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
  headingLevel?: number;
}

function printHelp(): void {
  console.log(`
xhs-md-render

Usage:
  xhs-md-render --input <file.md> --output <dir> [--title "My Note"] [--theme paper] [--heading-level 2]
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
      "heading-level": { type: "string" },
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

  const headingLevel = values["heading-level"] ? Number(values["heading-level"]) : undefined;

  if (headingLevel !== undefined && Number.isNaN(headingLevel)) {
    throw new Error("--heading-level must be a number.");
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

  if (headingLevel !== undefined) {
    options.headingLevel = headingLevel;
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
    ...(options.headingLevel === undefined ? {} : { splitHeadingLevel: options.headingLevel })
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
