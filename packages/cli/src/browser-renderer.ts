import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { prepareExportDocument } from "@xhs-md/core/node";
import type { ExportBundle, RenderConfigOverrides } from "@xhs-md/core";

const WEB_DIST_CANDIDATES = [
  fileURLToPath(new URL("../web-dist", import.meta.url)),
  fileURLToPath(new URL("../../../apps/web/dist", import.meta.url))
] as const;
const DEFAULT_BROWSER_PATHS = [
  process.env.XHS_MD_BROWSER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium"
] as const;

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function isFile(targetPath: string): Promise<boolean> {
  try {
    return (await stat(targetPath)).isFile();
  } catch {
    return false;
  }
}

async function resolveBrowserExecutablePath(): Promise<string> {
  for (const browserPath of DEFAULT_BROWSER_PATHS) {
    if (!browserPath) {
      continue;
    }

    if (await isFile(browserPath)) {
      return browserPath;
    }
  }

  throw new Error(
    "No supported local Chromium browser found. Set XHS_MD_BROWSER_EXECUTABLE_PATH or install Chrome, Chromium, Edge, or Brave."
  );
}

async function ensureWebDistDir(): Promise<string> {
  for (const rootDir of WEB_DIST_CANDIDATES) {
    const distIndexPath = join(rootDir, "index.html");

    if (await isFile(distIndexPath)) {
      return rootDir;
    }
  }

  throw new Error(
    `Web dist not found. Expected one of: ${WEB_DIST_CANDIDATES.join(", ")}. Run npm run build first.`
  );
}

async function startStaticServer(rootDir: string): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
    const candidatePath = normalize(join(rootDir, pathname));
    const safePath = candidatePath.startsWith(rootDir) ? candidatePath : join(rootDir, "index.html");
    const filePath = (await isFile(safePath)) ? safePath : join(rootDir, "index.html");

    try {
      const fileBuffer = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
        "Cache-Control": "no-store"
      });
      response.end(fileBuffer);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });

  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => resolvePromise());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve local preview server address.");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await new Promise<void>((resolvePromise, rejectPromise) => {
        server.close((error) => (error ? rejectPromise(error) : resolvePromise()));
      });
    }
  };
}

export async function writeBrowserExportBundle(input: {
  markdown: string;
  title?: string;
  outputDir: string;
  renderConfig?: RenderConfigOverrides;
  markdownFilePath?: string;
}): Promise<ExportBundle> {
  const rootDir = await ensureWebDistDir();
  const prepared = await prepareExportDocument(input);
  const outputDir = resolve(input.outputDir);
  const pagesDir = join(outputDir, "pages");
  const browserExecutablePath = await resolveBrowserExecutablePath();
  const server = await startStaticServer(rootDir);
  let browser:
    | Awaited<ReturnType<typeof chromium.launch>>
    | undefined;

  try {
    browser = await chromium.launch({
      executablePath: browserExecutablePath,
      headless: true
    });
    const page = await browser.newPage({
      viewport: {
        width: Math.min(prepared.config.width, 1600),
        height: Math.min(prepared.config.height, 1200)
      },
      deviceScaleFactor: 1
    });

    await page.addInitScript((payload) => {
      (window as typeof window & { __XHS_RENDER_PAYLOAD__?: unknown }).__XHS_RENDER_PAYLOAD__ =
        payload;
    }, prepared);
    await page.goto(`${server.origin}/?mode=render`, {
      waitUntil: "networkidle"
    });
    await page.waitForFunction(
      () =>
        (window as typeof window & {
          __XHS_RENDER_STATUS__?: {
            ready?: boolean;
          };
        }).__XHS_RENDER_STATUS__?.ready === true
    );

    await mkdir(pagesDir, { recursive: true });
    await writeFile(join(outputDir, "manifest.json"), JSON.stringify(prepared.manifest, null, 2), "utf8");
    await writeFile(
      join(outputDir, "layout-report.json"),
      JSON.stringify(prepared.layoutReport, null, 2),
      "utf8"
    );
    await writeFile(join(outputDir, "pages.json"), JSON.stringify(prepared.pages, null, 2), "utf8");

    const bundlePages: ExportBundle["pages"] = [];

    for (const manifestPage of prepared.manifest.pages) {
      const locator = page.locator(`[data-export-page="${manifestPage.id}"]`);
      const png = await locator.screenshot({
        type: "png"
      });
      const outputFilePath = join(pagesDir, manifestPage.fileName);
      await writeFile(outputFilePath, png);
      bundlePages.push({
        model: prepared.pages[manifestPage.index]!,
        fileName: manifestPage.fileName,
        png
      });
    }

    return {
      manifest: prepared.manifest,
      layoutReport: prepared.layoutReport,
      pages: bundlePages
    };
  } finally {
    if (browser) {
      await browser.close();
    }

    await server.close();
  }
}
