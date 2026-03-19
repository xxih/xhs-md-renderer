import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseMarkdownToPages } from "../packages/core/src/index.ts";

test("parseMarkdownToPages keeps explicit page breaks and title metadata", async () => {
  const markdownPath = resolve("examples/sample.md");
  const markdown = await readFile(markdownPath, "utf8");
  const parsed = parseMarkdownToPages(markdown);

  assert.equal(parsed.source.title, "Untitled Note");
  assert.equal(parsed.pages.length, 3);
  assert.equal(parsed.pages[0]?.title, "把周复盘改造成一篇小红书图文");
  assert.equal(parsed.pages[1]?.title, "第一版应该交付什么");
  assert.equal(parsed.pages[2]?.title, "技术选型");
});
