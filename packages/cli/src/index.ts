#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { writeExportBundle } from "@xhs-md/core/node";

interface CliOptions {
  input: string;
  output: string;
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
}

function printHelp(): void {
  console.log(`
xhs-md-render

Usage:
  xhs-md-render --input <file.md> --output <dir> [--title "My Note"] [--theme default]
    [--font-family "..."] [--font-size 16]
    [--name "小明"] [--handle "@xiaoming"]
    [--date "2026/03/16"] [--hide-date]
    [--footer-left "左侧文案"] [--footer-right "右侧文案"] [--hide-footer]
`.trim());
}

function parseCliOptions(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
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

  const fontSize = values["font-size"] ? Number(values["font-size"]) : undefined;

  if (fontSize !== undefined && Number.isNaN(fontSize)) {
    throw new Error("--font-size must be a number.");
  }

  const options: CliOptions = {
    input: values.input,
    output: values.output
  };

  if (values.title !== undefined) {
    options.title = values.title;
  }

  if (values.theme !== undefined) {
    options.themeId = values.theme;
  }

  if (values["font-family"] !== undefined) {
    options.fontFamily = values["font-family"];
  }

  if (fontSize !== undefined) {
    options.fontSize = fontSize;
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

  return options;
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const inputPath = resolve(options.input);
  const outputPath = resolve(options.output);
  const markdown = await readFile(inputPath, "utf8");
  const renderConfig = {
    ...(options.themeId === undefined ? {} : { themeId: options.themeId }),
    ...(options.fontFamily === undefined ? {} : { fontFamily: options.fontFamily }),
    ...(options.fontSize === undefined ? {} : { fontSize: options.fontSize }),
    profile: {
      ...(options.name === undefined ? {} : { name: options.name }),
      ...(options.handle === undefined ? {} : { handle: options.handle }),
      ...(options.showDate === undefined ? {} : { showDate: options.showDate }),
      ...(options.dateText === undefined ? {} : { dateText: options.dateText }),
      ...(options.showFooter === undefined ? {} : { showFooter: options.showFooter }),
      ...(options.footerLeft === undefined ? {} : { footerLeft: options.footerLeft }),
      ...(options.footerRight === undefined ? {} : { footerRight: options.footerRight })
    }
  };

  const bundle = await writeExportBundle({
    ...(options.title === undefined ? {} : { title: options.title }),
    markdown,
    outputDir: outputPath,
    renderConfig
  });

  console.log(`Rendered ${bundle.pages.length} pages.`);
  console.log(`Output: ${outputPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
