import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PageImageBlock } from "../packages/core/src/models.ts";
import { prepareExportDocument } from "../packages/core/src/node.ts";

test("prepareExportDocument resolves local markdown images into exportable data URLs", async () => {
  const markdownPath = resolve("examples/sample.md");
  const markdown = await readFile(markdownPath, "utf8");
  const prepared = await prepareExportDocument({
    markdown,
    markdownFilePath: markdownPath
  });

  const imageBlocks = prepared.pages.flatMap((page) =>
    page.blocks.filter((block): block is PageImageBlock => block.type === "image")
  );

  assert.equal(prepared.pages.length, 3);
  assert.equal(prepared.layoutReport.pages.length, 3);
  assert.equal(imageBlocks.length, 2);

  for (const block of imageBlocks) {
    assert.equal(block.status, "resolved");
    assert.match(block.src ?? "", /^data:image\/svg\+xml;base64,/);
    assert.ok((block.width ?? 0) > 0);
    assert.ok((block.height ?? 0) > 0);
  }
});
