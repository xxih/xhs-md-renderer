#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { writeExportBundle } from "@xhs-md/core/node";
import type { LayoutReport, RenderConfig, RenderConfigOverrides } from "@xhs-md/core";
import { writeBrowserExportBundle } from "./browser-renderer.js";

const DEFAULT_CONFIG_DIR_NAME = ".xhs-md-renderer";
const DEFAULT_CONFIG_FILE_NAME = "render.json";
const DEFAULT_AVATAR_FILE_NAMES = [
  "avatar.png",
  "avatar.jpg",
  "avatar.jpeg",
  "avatar.webp",
  "avatar.gif"
] as const;

interface CliOptions {
  input: string;
  output: string;
  renderer?: "auto" | "browser" | "node";
  title?: string;
  themeId?: string;
  fontFamily?: string;
  fontSize?: number;
  name?: string;
  handle?: string;
  dateText?: string;
  showDate?: boolean;
  showFooter?: boolean;
  footerLeft?: string;
  footerRight?: string;
  configDir?: string;
  avatarPath?: string;
  bodyBottomPadding?: number;
  warningThreshold?: number;
}

type FileProfileConfig = Partial<RenderConfig["profile"]> & {
  avatarPath?: string;
};

interface RenderConfigFile {
  title?: string;
  renderConfig?: Omit<RenderConfigOverrides, "profile" | "layout"> & {
    profile?: FileProfileConfig;
    layout?: Partial<RenderConfig["layout"]>;
  };
}

function printHelp(): void {
  console.log(`
xhs-md-render

Usage:
  xhs-md-render --input <file.md> --output <dir> [--config-dir ./.xhs-md-renderer]
    [--renderer auto|node|browser]
    [--title "My Note"] [--theme default]
    [--font-family "..."] [--font-size 16]
    [--name "小明"] [--handle "@xiaoming"]
    [--date "2026/03/16"] [--hide-date]
    [--footer-left "左侧文案"] [--footer-right "右侧文案"] [--hide-footer]
    [--avatar ./avatar.png]
    [--body-bottom-padding 180] [--warning-threshold 180]

Default config discovery:
  1. If --config-dir is provided, read that directory.
  2. Otherwise search upward from the input Markdown directory for .xhs-md-renderer/.
  3. If found, read .xhs-md-renderer/render.json and optional avatar.* files.
`.trim());
}

function parseNumericFlag(raw: string | undefined, flagName: string): number | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${flagName} must be a number.`);
  }

  return parsed;
}

function parseCliOptions(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      renderer: { type: "string" },
      title: { type: "string", short: "t" },
      theme: { type: "string" },
      "font-family": { type: "string" },
      "font-size": { type: "string" },
      name: { type: "string" },
      handle: { type: "string" },
      date: { type: "string" },
      "hide-date": { type: "boolean" },
      "hide-footer": { type: "boolean" },
      "footer-left": { type: "string" },
      "footer-right": { type: "string" },
      "config-dir": { type: "string" },
      avatar: { type: "string" },
      "body-bottom-padding": { type: "string" },
      "warning-threshold": { type: "string" },
      help: { type: "boolean", short: "h" }
    },
    allowPositionals: false
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (!values.input || !values.output) {
    printHelp();
    throw new Error("Both --input and --output are required.");
  }

  const options: CliOptions = {
    input: values.input,
    output: values.output
  };

  if (values.renderer !== undefined) {
    if (values.renderer !== "auto" && values.renderer !== "browser" && values.renderer !== "node") {
      throw new Error("--renderer must be one of: auto, browser, node.");
    }

    options.renderer = values.renderer;
  }

  if (values.title !== undefined) {
    options.title = values.title;
  }

  if (values.theme !== undefined) {
    options.themeId = values.theme;
  }

  if (values["font-family"] !== undefined) {
    options.fontFamily = values["font-family"];
  }

  const fontSize = parseNumericFlag(values["font-size"], "--font-size");
  const bodyBottomPadding = parseNumericFlag(
    values["body-bottom-padding"],
    "--body-bottom-padding"
  );
  const warningThreshold = parseNumericFlag(values["warning-threshold"], "--warning-threshold");

  if (fontSize !== undefined) {
    options.fontSize = fontSize;
  }

  if (bodyBottomPadding !== undefined) {
    options.bodyBottomPadding = bodyBottomPadding;
  }

  if (warningThreshold !== undefined) {
    options.warningThreshold = warningThreshold;
  }

  if (values.name !== undefined) {
    options.name = values.name;
  }

  if (values.handle !== undefined) {
    options.handle = values.handle;
  }

  if (values.date !== undefined) {
    options.dateText = values.date;
    options.showDate = true;
  }

  if (values["hide-date"]) {
    options.showDate = false;
  }

  if (values["footer-left"] !== undefined) {
    options.footerLeft = values["footer-left"];
  }

  if (values["footer-right"] !== undefined) {
    options.footerRight = values["footer-right"];
  }

  if (values["hide-footer"]) {
    options.showFooter = false;
  }

  if (values["config-dir"] !== undefined) {
    options.configDir = values["config-dir"];
  }

  if (values.avatar !== undefined) {
    options.avatarPath = values.avatar;
  }

  return options;
}

async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    return (await stat(targetPath)).isDirectory();
  } catch {
    return false;
  }
}

async function isFile(targetPath: string): Promise<boolean> {
  try {
    return (await stat(targetPath)).isFile();
  } catch {
    return false;
  }
}

async function discoverConfigDir(inputPath: string, explicitConfigDir?: string): Promise<string | undefined> {
  if (explicitConfigDir) {
    const resolvedConfigDir = resolve(explicitConfigDir);

    if (!(await isDirectory(resolvedConfigDir))) {
      throw new Error(`Config directory not found: ${resolvedConfigDir}`);
    }

    return resolvedConfigDir;
  }

  let currentDir = dirname(inputPath);

  while (true) {
    const candidate = join(currentDir, DEFAULT_CONFIG_DIR_NAME);

    if (await isDirectory(candidate)) {
      return candidate;
    }

    const parentDir = dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

async function readConfigFile(configDir: string | undefined): Promise<{
  configFilePath?: string;
  config: RenderConfigFile;
}> {
  if (!configDir) {
    return { config: {} };
  }

  const configFilePath = join(configDir, DEFAULT_CONFIG_FILE_NAME);

  if (!(await isFile(configFilePath))) {
    return {
      configFilePath,
      config: {}
    };
  }

  const raw = await readFile(configFilePath, "utf8");
  const parsed = JSON.parse(raw) as RenderConfigFile;

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid config file: ${configFilePath}`);
  }

  return {
    configFilePath,
    config: parsed
  };
}

function mergeRenderConfigOverrides(
  base: RenderConfigOverrides = {},
  override: RenderConfigOverrides = {}
): RenderConfigOverrides {
  const mergedProfile = {
    ...(base.profile ?? {}),
    ...(override.profile ?? {})
  };
  const mergedLayout = {
    ...(base.layout ?? {}),
    ...(override.layout ?? {})
  };

  return {
    ...base,
    ...override,
    ...(Object.keys(mergedProfile).length === 0 ? {} : { profile: mergedProfile }),
    ...(Object.keys(mergedLayout).length === 0 ? {} : { layout: mergedLayout })
  };
}

function buildCliRenderConfig(options: CliOptions): RenderConfigOverrides {
  const profile = {
    ...(options.name === undefined ? {} : { name: options.name }),
    ...(options.handle === undefined ? {} : { handle: options.handle }),
    ...(options.showDate === undefined ? {} : { showDate: options.showDate }),
    ...(options.dateText === undefined ? {} : { dateText: options.dateText }),
    ...(options.showFooter === undefined ? {} : { showFooter: options.showFooter }),
    ...(options.footerLeft === undefined ? {} : { footerLeft: options.footerLeft }),
    ...(options.footerRight === undefined ? {} : { footerRight: options.footerRight })
  };
  const layout = {
    ...(options.bodyBottomPadding === undefined
      ? {}
      : { bodyBottomPadding: options.bodyBottomPadding }),
    ...(options.warningThreshold === undefined
      ? {}
      : { warningThreshold: options.warningThreshold })
  };

  return {
    ...(options.themeId === undefined ? {} : { themeId: options.themeId }),
    ...(options.fontFamily === undefined ? {} : { fontFamily: options.fontFamily }),
    ...(options.fontSize === undefined ? {} : { fontSize: options.fontSize }),
    ...(Object.keys(profile).length === 0 ? {} : { profile }),
    ...(Object.keys(layout).length === 0 ? {} : { layout })
  };
}

function toMimeType(filePath: string): string {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.endsWith(".png")) {
    return "image/png";
  }

  if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lowerPath.endsWith(".webp")) {
    return "image/webp";
  }

  if (lowerPath.endsWith(".gif")) {
    return "image/gif";
  }

  throw new Error(`Unsupported avatar file type: ${filePath}`);
}

async function readAvatarAsDataUrl(filePath: string): Promise<string> {
  const avatarBuffer = await readFile(filePath);
  return `data:${toMimeType(filePath)};base64,${avatarBuffer.toString("base64")}`;
}

async function detectDefaultAvatarPath(configDir: string): Promise<string | undefined> {
  for (const fileName of DEFAULT_AVATAR_FILE_NAMES) {
    const candidate = join(configDir, fileName);

    if (await isFile(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

async function resolveAvatarOverride(input: {
  cliAvatarPath?: string;
  configDir?: string;
  fileProfile?: FileProfileConfig;
}): Promise<{ avatarSrc?: string; avatarSourcePath?: string }> {
  if (input.cliAvatarPath) {
    const resolvedAvatarPath = resolve(input.cliAvatarPath);

    if (!(await isFile(resolvedAvatarPath))) {
      throw new Error(`Avatar file not found: ${resolvedAvatarPath}`);
    }

    return {
      avatarSrc: await readAvatarAsDataUrl(resolvedAvatarPath),
      avatarSourcePath: resolvedAvatarPath
    };
  }

  if (!input.configDir) {
    return {};
  }

  if (input.fileProfile?.avatarPath) {
    const resolvedAvatarPath = resolve(input.configDir, input.fileProfile.avatarPath);

    if (!(await isFile(resolvedAvatarPath))) {
      throw new Error(`Avatar file not found: ${resolvedAvatarPath}`);
    }

    return {
      avatarSrc: await readAvatarAsDataUrl(resolvedAvatarPath),
      avatarSourcePath: resolvedAvatarPath
    };
  }

  const defaultAvatarPath = await detectDefaultAvatarPath(input.configDir);

  if (!defaultAvatarPath) {
    return {};
  }

  return {
    avatarSrc: await readAvatarAsDataUrl(defaultAvatarPath),
    avatarSourcePath: defaultAvatarPath
  };
}

function stripProfileFileOnlyFields(
  profile: FileProfileConfig | undefined
): RenderConfigOverrides["profile"] {
  if (!profile) {
    return undefined;
  }

  const { avatarPath: _avatarPath, ...profileConfig } = profile;
  return profileConfig;
}

function printLayoutSummary(layoutReport: LayoutReport): void {
  console.log("Layout feedback:");

  for (const page of layoutReport.pages) {
    if (page.status === "overflow") {
      console.log(
        `  - Page ${page.pageNumber} [overflow] exceeded safe area by ${page.overflowAmount}px. ${page.recommendation}`
      );
      continue;
    }

    if (page.status === "warning") {
      console.log(
        `  - Page ${page.pageNumber} [warning] remaining bottom space ${page.remainingBottomSpace}px, below warning threshold ${page.warningThreshold}px. ${page.recommendation}`
      );
      continue;
    }

    console.log(
      `  - Page ${page.pageNumber} [ok] remaining bottom space ${page.remainingBottomSpace}px.`
    );
  }
}

function shouldFallbackToBrowser(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("Unsupported OpenType signature ttcf");
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const inputPath = resolve(options.input);
  const outputPath = resolve(options.output);
  const markdown = await readFile(inputPath, "utf8");
  const configDir = await discoverConfigDir(inputPath, options.configDir);
  const { configFilePath, config } = await readConfigFile(configDir);
  const strippedProfile = stripProfileFileOnlyFields(config.renderConfig?.profile);
  const fileRenderConfig: RenderConfigOverrides = {
    ...(config.renderConfig ?? {}),
    ...(strippedProfile === undefined ? {} : { profile: strippedProfile })
  };
  const avatarResolveInput: {
    cliAvatarPath?: string;
    configDir?: string;
    fileProfile?: FileProfileConfig;
  } = {};

  if (options.avatarPath !== undefined) {
    avatarResolveInput.cliAvatarPath = options.avatarPath;
  }

  if (configDir !== undefined) {
    avatarResolveInput.configDir = configDir;
  }

  if (config.renderConfig?.profile !== undefined) {
    avatarResolveInput.fileProfile = config.renderConfig.profile;
  }

  const avatarOverride = await resolveAvatarOverride(avatarResolveInput);
  const mergedRenderConfig = mergeRenderConfigOverrides(
    fileRenderConfig,
    buildCliRenderConfig(options)
  );

  if (avatarOverride.avatarSrc) {
    mergedRenderConfig.profile = {
      ...(mergedRenderConfig.profile ?? {}),
      avatarSrc: avatarOverride.avatarSrc
    };
  }

  const exportInput = {
    markdown,
    markdownFilePath: inputPath,
    outputDir: outputPath,
    renderConfig: mergedRenderConfig
  } as {
    markdown: string;
    markdownFilePath: string;
    outputDir: string;
    renderConfig: RenderConfigOverrides;
    title?: string;
  };

  const resolvedTitle = options.title ?? config.title;

  if (resolvedTitle !== undefined) {
    exportInput.title = resolvedTitle;
  }

  let bundle;
  let rendererUsed: "browser" | "node";

  if (options.renderer === "browser") {
    bundle = await writeBrowserExportBundle(exportInput);
    rendererUsed = "browser";
  } else if (options.renderer === "node") {
    bundle = await writeExportBundle(exportInput);
    rendererUsed = "node";
  } else {
    try {
      bundle = await writeExportBundle(exportInput);
      rendererUsed = "node";
    } catch (error) {
      if (!shouldFallbackToBrowser(error)) {
        throw error;
      }

      console.warn("Node renderer does not support the requested TTC font. Falling back to browser renderer.");
      bundle = await writeBrowserExportBundle(exportInput);
      rendererUsed = "browser";
    }
  }

  if (configDir) {
    console.log(`Config directory: ${configDir}`);
  } else {
    console.log(
      `Config directory: not found (searched upward from ${dirname(inputPath)} for ${DEFAULT_CONFIG_DIR_NAME})`
    );
  }

  if (configFilePath && (await isFile(configFilePath))) {
    console.log(`Config file: ${configFilePath}`);
  }

  if (avatarOverride.avatarSourcePath) {
    console.log(`Avatar source: ${avatarOverride.avatarSourcePath}`);
  }

  console.log(`Renderer: ${rendererUsed}`);
  printLayoutSummary(bundle.layoutReport);
  console.log(`Rendered ${bundle.pages.length} pages.`);
  console.log(`Output: ${outputPath}`);
  console.log(`Layout report: ${join(outputPath, "layout-report.json")}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
