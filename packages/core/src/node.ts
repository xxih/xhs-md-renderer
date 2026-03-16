import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import React from "react";
import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";
import type {
  ExportBundle,
  ExportManifest,
  LayoutReport,
  PageModel,
  RenderConfig,
  RenderConfigOverrides
} from "./models.js";
import { analyzePageLayout } from "./layout.js";
import { resolvePageImagesForNode } from "./node-images.js";
import { parseMarkdownToPages } from "./parser.js";
import { XhsPageCard } from "./preview.js";
import { createRenderConfig } from "./themes.js";

const DEFAULT_FONT_PATHS = [
  "/Library/Fonts/Arial Unicode.ttf",
  "/System/Library/Fonts/SFNS.ttf",
  "/System/Library/Fonts/Helvetica.ttc"
];

async function loadFontData(fontPath: string): Promise<ArrayBuffer> {
  const fontBuffer = await readFile(fontPath);
  return fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength);
}

async function loadFonts(): Promise<NonNullable<SatoriOptions["fonts"]>> {
  for (const fontPath of DEFAULT_FONT_PATHS) {
    try {
      return [
        {
          name: "PrimarySans",
          data: await loadFontData(fontPath),
          weight: 400 as const,
          style: "normal"
        }
      ];
    } catch {
      continue;
    }
  }

  throw new Error("No usable system font found. Expected one of the default macOS fonts to exist.");
}

export async function renderPageToSvg(page: PageModel, config: RenderConfig): Promise<string> {
  const fonts = await loadFonts();

  return satori(React.createElement(XhsPageCard, { page, config }), {
    width: config.width,
    height: config.height,
    fonts
  });
}

export async function renderPageToPng(page: PageModel, config: RenderConfig): Promise<Uint8Array> {
  const svg = await renderPageToSvg(page, config);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: config.width
    },
    background: "rgba(255,255,255,1)"
  });

  return resvg.render().asPng();
}

export async function buildExportBundle(input: {
  markdown: string;
  title?: string;
  outputDir?: string;
  renderConfig?: RenderConfigOverrides;
  markdownFilePath?: string;
}): Promise<ExportBundle> {
  const config = createRenderConfig(input.renderConfig);
  const parsed = parseMarkdownToPages(
    input.markdown,
    input.title === undefined ? {} : { documentTitle: input.title }
  );
  const pages = await resolvePageImagesForNode(parsed.pages, input.markdownFilePath);
  const { source } = parsed;

  const manifest: ExportManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceTitle: source.title,
    renderConfig: {
      width: config.width,
      height: config.height,
      fontFamily: config.fontFamily,
      fontSize: config.fontSize,
      layout: config.layout,
      profile: config.profile,
      themeId: config.theme.id
    },
    pages: []
  };
  const layoutReport: LayoutReport = analyzePageLayout(pages, config, source.title);

  const bundlePages: ExportBundle["pages"] = [];

  for (const page of pages) {
    const fileName = `page-${String(page.index + 1).padStart(2, "0")}.png`;
    const png = await renderPageToPng(page, config);
    manifest.pages.push({
      id: page.id,
      index: page.index,
      title: page.title,
      sectionTitle: page.sectionTitle,
      fileName
    });
    bundlePages.push({ model: page, fileName, png });
  }

  return {
    manifest,
    layoutReport,
    pages: bundlePages
  };
}

export async function writeExportBundle(input: {
  markdown: string;
  title?: string;
  outputDir: string;
  renderConfig?: RenderConfigOverrides;
  markdownFilePath?: string;
}): Promise<ExportBundle> {
  const bundle = await buildExportBundle(input);
  const outputDir = resolve(input.outputDir);
  const pagesDir = join(outputDir, "pages");

  await mkdir(pagesDir, { recursive: true });
  await writeFile(join(outputDir, "manifest.json"), JSON.stringify(bundle.manifest, null, 2), "utf8");
  await writeFile(join(outputDir, "layout-report.json"), JSON.stringify(bundle.layoutReport, null, 2), "utf8");

  const models = bundle.pages.map((page) => page.model);
  await writeFile(join(outputDir, "pages.json"), JSON.stringify(models, null, 2), "utf8");

  await Promise.all(
    bundle.pages.map((page) => writeFile(join(pagesDir, page.fileName), Buffer.from(page.png)))
  );

  return bundle;
}

export async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}
