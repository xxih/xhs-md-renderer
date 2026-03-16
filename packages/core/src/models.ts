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

export interface PageDividerBlock {
  type: "divider";
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

export type PageBlock = PageTextBlock | PageListBlock | PageImageBlock | PageDividerBlock;

export interface PageModel {
  id: string;
  index: number;
  title: string;
  sectionTitle: string;
  blocks: PageBlock[];
}

export interface ParseOptions {
  documentTitle?: string;
}

export interface ProfileConfig {
  avatarSrc: string;
  name: string;
  handle: string;
  showAvatar: boolean;
  showName: boolean;
  showHandle: boolean;
  showVerifiedBadge: boolean;
  showDate: boolean;
  dateText: string;
  showFooter: boolean;
  footerLeft: string;
  footerRight: string;
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

export interface LayoutConfig {
  bodyBottomPadding: number;
  warningThreshold: number;
}

export interface RenderConfig {
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  profile: ProfileConfig;
  layout: LayoutConfig;
  theme: ThemeConfig;
}

export interface RenderConfigOverrides
  extends Omit<Partial<RenderConfig>, "profile" | "theme" | "layout"> {
  profile?: Partial<ProfileConfig>;
  layout?: Partial<LayoutConfig>;
  theme?: ThemeConfig;
  themeId?: string;
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
  renderConfig: Pick<RenderConfig, "width" | "height" | "fontFamily" | "fontSize" | "layout"> & {
    themeId: string;
    profile: ProfileConfig;
  };
  pages: ExportManifestPage[];
}

export type PageLayoutStatus = "ok" | "warning" | "overflow";

export interface PageLayoutFeedback {
  id: string;
  index: number;
  pageNumber: number;
  title: string;
  status: PageLayoutStatus;
  availableContentHeight: number;
  estimatedContentHeight: number;
  remainingBottomSpace: number;
  overflowAmount: number;
  warningThreshold: number;
  safeBottomPadding: number;
  recommendation: string;
}

export interface LayoutReport {
  version: 1;
  generatedAt: string;
  sourceTitle: string;
  summary: {
    totalPages: number;
    okPages: number;
    warningPages: number;
    overflowPages: number;
  };
  pages: PageLayoutFeedback[];
}

export interface ExportBundle {
  manifest: ExportManifest;
  layoutReport: LayoutReport;
  pages: Array<{
    model: PageModel;
    fileName: string;
    png: Uint8Array;
  }>;
}
