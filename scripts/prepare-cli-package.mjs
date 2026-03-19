import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const CLI_DIST_DIR = resolve(REPO_ROOT, "packages/cli/dist");
const CORE_DIST_DIR = resolve(REPO_ROOT, "packages/core/dist");
const WEB_DIST_DIR = resolve(REPO_ROOT, "apps/web/dist");
const CLI_VENDOR_CORE_DIR = resolve(CLI_DIST_DIR, "vendor/core");
const CLI_WEB_DIST_DIR = resolve(REPO_ROOT, "packages/cli/web-dist");

async function assertPathExists(targetPath) {
  try {
    await access(targetPath);
  } catch {
    throw new Error(`Required build artifact not found: ${targetPath}`);
  }
}

async function rewriteCliImports(rootDir) {
  const entries = await readDirRecursive(rootDir);

  await Promise.all(
    entries
      .filter((filePath) => filePath.endsWith(".js") || filePath.endsWith(".d.ts"))
      .map(async (filePath) => {
        const original = await readFile(filePath, "utf8");
        const updated = original
          .replaceAll('"@xhs-md/core/node"', '"./vendor/core/node.js"')
          .replaceAll("'@xhs-md/core/node'", "'./vendor/core/node.js'")
          .replaceAll('"@xhs-md/core"', '"./vendor/core/index.js"')
          .replaceAll("'@xhs-md/core'", "'./vendor/core/index.js'");

        if (updated !== original) {
          await writeFile(filePath, updated, "utf8");
        }
      })
  );
}

async function readDirRecursive(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const filePaths = [];

  for (const entry of entries) {
    const entryPath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...(await readDirRecursive(entryPath)));
      continue;
    }

    filePaths.push(entryPath);
  }

  return filePaths;
}

await assertPathExists(CLI_DIST_DIR);
await assertPathExists(CORE_DIST_DIR);
await assertPathExists(WEB_DIST_DIR);

await rm(CLI_VENDOR_CORE_DIR, { recursive: true, force: true });
await rm(CLI_WEB_DIST_DIR, { recursive: true, force: true });
await mkdir(dirname(CLI_VENDOR_CORE_DIR), { recursive: true });
await cp(CORE_DIST_DIR, CLI_VENDOR_CORE_DIR, { recursive: true });
await cp(WEB_DIST_DIR, CLI_WEB_DIST_DIR, { recursive: true });
await rewriteCliImports(CLI_DIST_DIR);
