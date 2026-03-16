import type { RenderConfig, RenderConfigOverrides, ThemeConfig } from "./models.js";

export const FONT_FAMILY_OPTIONS = [
  {
    label: "默认",
    value:
      "Optima, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', sans-serif"
  },
  {
    label: "宋体",
    value: "SimSun, 'Songti SC', serif"
  },
  {
    label: "黑体",
    value: "SimHei, 'Heiti SC', sans-serif"
  },
  {
    label: "楷体",
    value: "KaiTi, 'Kaiti SC', serif"
  },
  {
    label: "微软雅黑",
    value: "'Microsoft YaHei', 'PingFang SC', sans-serif"
  }
] as const;

export const THEMES: Record<string, ThemeConfig> = {
  default: {
    id: "default",
    name: "Default",
    background: "linear-gradient(180deg, #111114 0%, #151518 100%)",
    cardBackground: "#1c1c1e",
    accent: "#0a84ff",
    accentSoft: "rgba(10, 132, 255, 0.16)",
    textStrong: "#f5f5f7",
    textBody: "#f2f2f7",
    textMuted: "#98989d",
    border: "rgba(255, 255, 255, 0.08)",
    codeBackground: "#2c2c2e"
  },
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

function defaultDateText(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  width: 1800,
  height: 2400,
  fontFamily: FONT_FAMILY_OPTIONS[0].value,
  fontSize: 16,
  profile: {
    name: "小明",
    handle: "@xiaoming",
    showDate: true,
    dateText: defaultDateText(),
    showFooter: true,
    footerLeft: "把问题拆开，一个个解决",
    footerRight: "今天的进度也要记下来"
  },
  theme: THEMES.default!
};

export function getTheme(themeId?: string): ThemeConfig {
  if (themeId && THEMES[themeId]) {
    return THEMES[themeId]!;
  }

  return DEFAULT_RENDER_CONFIG.theme;
}

export function createRenderConfig(overrides: RenderConfigOverrides = {}): RenderConfig {
  const defaultConfig = {
    ...DEFAULT_RENDER_CONFIG,
    profile: {
      ...DEFAULT_RENDER_CONFIG.profile,
      dateText: defaultDateText()
    }
  };

  return {
    ...defaultConfig,
    ...overrides,
    profile: {
      ...defaultConfig.profile,
      ...overrides.profile
    },
    theme: overrides.theme ?? getTheme(overrides.themeId)
  };
}
