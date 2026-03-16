import type { RenderConfig, ThemeConfig } from "./models.js";

export const THEMES: Record<string, ThemeConfig> = {
  paper: {
    id: "paper",
    name: "Paper",
    background: "linear-gradient(180deg, #f8f2e8 0%, #efe4d4 100%)",
    cardBackground: "#fffaf3",
    accent: "#b74d2c",
    accentSoft: "#f2d5c6",
    textStrong: "#34261d",
    textBody: "#554336",
    textMuted: "#8a7666",
    border: "rgba(102, 73, 49, 0.14)",
    codeBackground: "#f3eadf"
  },
  studio: {
    id: "studio",
    name: "Studio",
    background: "linear-gradient(180deg, #f1f5ff 0%, #dce8ff 100%)",
    cardBackground: "#ffffff",
    accent: "#1959d1",
    accentSoft: "#d6e4ff",
    textStrong: "#16223b",
    textBody: "#31425f",
    textMuted: "#65748c",
    border: "rgba(25, 89, 209, 0.12)",
    codeBackground: "#eef4ff"
  }
};

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  width: 1080,
  height: 1440,
  splitHeadingLevel: 2,
  fontFamily: "\"Arial Unicode MS\", \"Arial Unicode\", sans-serif",
  profile: {
    name: "Creator",
    handle: "@creator",
    footer: "Generated from Markdown with one shared core"
  },
  theme: THEMES.paper!
};

export function getTheme(themeId?: string): ThemeConfig {
  if (themeId && THEMES[themeId]) {
    return THEMES[themeId]!;
  }

  return DEFAULT_RENDER_CONFIG.theme;
}

export function createRenderConfig(
  overrides: Partial<RenderConfig> & { themeId?: string } = {}
): RenderConfig {
  return {
    ...DEFAULT_RENDER_CONFIG,
    ...overrides,
    profile: {
      ...DEFAULT_RENDER_CONFIG.profile,
      ...overrides.profile
    },
    theme: overrides.theme ?? getTheme(overrides.themeId)
  };
}
