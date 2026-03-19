import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
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
  RenderConfigOverrides,
  SourceDocument
} from "./models.js";
import { analyzePageLayout } from "./layout.js";
import { resolvePageImagesForNode } from "./node-images.js";
import { parseMarkdownToPages } from "./parser.js";
import { XhsPageCard } from "./preview.js";
import { createRenderConfig } from "./themes.js";

const FONT_CANDIDATES = [
  {
    names: ["SimSun", "Songti SC", "Songti", "STSong"],
    paths: ["/System/Library/Fonts/Supplemental/Songti.ttc"]
  },
  {
    names: ["KaiTi", "Kaiti SC", "Kaiti", "Noto Sans Kaithi"],
    paths: [
      "/System/Library/Fonts/Supplemental/NotoSansKaithi-Regular.ttf",
      "/System/Library/Fonts/Supplemental/Kailasa.ttc"
    ]
  },
  {
    names: ["SimHei", "Heiti SC", "STHeiti", "Hiragino Sans GB"],
    paths: [
      "/System/Library/Fonts/STHeiti Medium.ttc",
      "/System/Library/Fonts/Hiragino Sans GB.ttc"
    ]
  },
  {
    names: ["PingFang SC", "Microsoft YaHei", "Helvetica Neue", "Helvetica", "Optima"],
    paths: [
      "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
      "/usr/share/fonts/opentype/noto/NotoSansSC-Regular.otf",
      "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
      "/System/Library/Fonts/Hiragino Sans GB.ttc",
      "/Library/Fonts/HelveticaNeue.ttc",
      "/System/Library/Fonts/Helvetica.ttc",
      "/Library/Fonts/Arial Unicode.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"
    ]
  },
  {
    names: ["Times New Roman", "Georgia", "serif", "sans-serif"],
    paths: [
      "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
      "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
      "/System/Library/Fonts/Supplemental/Georgia.ttf",
      "/System/Library/Fonts/Helvetica.ttc",
      "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
      "/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    ]
  }
] as const;

async function loadFontData(fontPath: string): Promise<ArrayBuffer> {
  const fontBuffer = await readFile(fontPath);
  return fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength);
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function parseRequestedFontNames(fontFamily: string): string[] {
  return fontFamily
    .split(",")
    .map((family) => family.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

async function resolveFontPath(paths: readonly string[]): Promise<string | undefined> {
  for (const fontPath of paths) {
    if (await isFile(fontPath)) {
      return fontPath;
    }
  }

  return undefined;
}

async function loadFonts(fontFamily: string): Promise<NonNullable<SatoriOptions["fonts"]>> {
  const requestedNames = parseRequestedFontNames(fontFamily);
  const loadedFonts: NonNullable<SatoriOptions["fonts"]> = [];
  const loadedPaths = new Map<string, ArrayBuffer>();

  for (const candidate of FONT_CANDIDATES) {
    const requested = candidate.names.some((name) => requestedNames.includes(name));

    if (!requested && loadedFonts.length > 0) {
      continue;
    }

    const fontPath = await resolveFontPath(candidate.paths);

    if (!fontPath) {
      continue;
    }

    let data = loadedPaths.get(fontPath);

    if (!data) {
      data = await loadFontData(fontPath);
      loadedPaths.set(fontPath, data);
    }

    for (const name of candidate.names) {
      loadedFonts.push({
        name,
        data,
        weight: 400 as const,
        style: "normal"
      });
    }
  }

  if (loadedFonts.length > 0) {
    return loadedFonts;
  }

  throw new Error("No usable system font found for the requested font family.");
}

export async function renderPageToSvg(page: PageModel, config: RenderConfig): Promise<string> {
  const fonts = await loadFonts(config.fontFamily);

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

export interface PreparedExportDocument {
  source: SourceDocument;
  pages: PageModel[];
  config: RenderConfig;
  manifest: ExportManifest;
  layoutReport: LayoutReport;
}

export async function prepareExportDocument(input: {
  markdown: string;
  title?: string;
  renderConfig?: RenderConfigOverrides;
  markdownFilePath?: string;
}): Promise<PreparedExportDocument> {
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
    pages: pages.map((page) => ({
      id: page.id,
      index: page.index,
      title: page.title,
      sectionTitle: page.sectionTitle,
      fileName: `page-${String(page.index + 1).padStart(2, "0")}.png`
    }))
  };
  const layoutReport: LayoutReport = analyzePageLayout(pages, config, source.title);

  return {
    source,
    pages,
    config,
    manifest,
    layoutReport
  };
}

export async function buildExportBundle(input: {
  markdown: string;
  title?: string;
  outputDir?: string;
  renderConfig?: RenderConfigOverrides;
  markdownFilePath?: string;
}): Promise<ExportBundle> {
  const prepared = await prepareExportDocument(input);
  const { pages, config, manifest, layoutReport } = prepared;

  const bundlePages: ExportBundle["pages"] = [];

  for (const page of pages) {
    const fileName = manifest.pages[page.index]?.fileName ?? `page-${String(page.index + 1).padStart(2, "0")}.png`;
    const png = await renderPageToPng(page, config);
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
