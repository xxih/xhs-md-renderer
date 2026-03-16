export interface SourceDocument {
  id: string;
  title: string;
  markdown: string;
}

export interface PageTextBlock {
  type: "paragraph" | "quote" | "code" | "subheading";
  text: string;
  language?: string;
}

export interface PageListBlock {
  type: "list";
  ordered: boolean;
  items: string[];
}

export interface PageImageBlock {
  type: "image";
  alt: string;
  url: string;
}

export type PageBlock = PageTextBlock | PageListBlock | PageImageBlock;

export interface PageModel {
  id: string;
  index: number;
  title: string;
  sectionTitle: string;
  blocks: PageBlock[];
}

export interface ParseOptions {
  splitHeadingLevel?: number;
  documentTitle?: string;
}

export interface ProfileConfig {
  name: string;
  handle: string;
  footer: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  background: string;
  cardBackground: string;
  accent: string;
  accentSoft: string;
  textStrong: string;
  textBody: string;
  textMuted: string;
  border: string;
  codeBackground: string;
}

export interface RenderConfig {
  width: number;
  height: number;
  splitHeadingLevel: number;
  fontFamily: string;
  profile: ProfileConfig;
  theme: ThemeConfig;
}

export interface ExportManifestPage {
  id: string;
  index: number;
  title: string;
  sectionTitle: string;
  fileName: string;
}

export interface ExportManifest {
  version: 1;
  generatedAt: string;
  sourceTitle: string;
  renderConfig: Pick<RenderConfig, "width" | "height" | "splitHeadingLevel" | "fontFamily"> & {
    themeId: string;
  };
  pages: ExportManifestPage[];
}

export interface ExportBundle {
  manifest: ExportManifest;
  pages: Array<{
    model: PageModel;
    fileName: string;
    png: Uint8Array;
  }>;
}
