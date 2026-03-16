# xhs-md-renderer

A modern workspace for one job: turn Markdown into Xiaohongshu-friendly image pages with one shared core.

## Workspace

- `packages/core`: parsing, page modeling, themes, shared preview component, and Node-side rendering/export helpers
- `packages/cli`: batch and agent-friendly CLI
- `apps/web`: visual editor and preview surface backed by the same page model

## Stack

- TypeScript 5
- React 19
- Vite 7
- `unified` + `remark-parse` + `remark-gfm`
- `satori` + `@resvg/resvg-js`
- npm workspaces

## Quick start

```bash
npm install
npm run build
npm run dev:web
```

While `npm run dev:web` is running, edits under `packages/core/src/preview.tsx` are served from source in dev mode, so the browser preview updates immediately after save.

Use the CLI to render a Markdown file into image assets:

```bash
npm run dev:cli
```

Or directly:

```bash
npm run dev -w @xhs-md/cli -- --input ./examples/sample.md --output ./.tmp/sample-output
```

## CLI Config Directory

The CLI now supports a stable project-level config directory named `.xhs-md-renderer`.

Discovery order:

1. `--config-dir <path>`
2. Search upward from the input Markdown file directory for `.xhs-md-renderer/`
3. Fall back to built-in defaults when no config directory exists

Inside that directory, the CLI reads:

- `render.json`: render config overrides
- `avatar.png|jpg|jpeg|webp|gif`: optional default avatar file

Example:

```text
your-project/
├── note.md
└── .xhs-md-renderer/
    ├── render.json
    └── avatar.png
```

Example `render.json`:

```json
{
  "title": "本周复盘",
  "renderConfig": {
    "themeId": "paper",
    "fontSize": 16,
    "layout": {
      "bodyBottomPadding": 180,
      "warningThreshold": 180
    },
    "profile": {
      "name": "小明",
      "handle": "@xiaoming",
      "showVerifiedBadge": true,
      "avatarPath": "./avatar.png"
    }
  }
}
```

CLI flags still work, and they override values loaded from `render.json` for the current run.

## Layout Feedback

Every CLI export now writes `layout-report.json` alongside `manifest.json` and `pages.json`.

The report marks each page as:

- `ok`: enough bottom space remains
- `warning`: page is close to the configured safe bottom area
- `overflow`: estimated content height exceeds the available content area

This makes the CLI more automation-friendly for later AI usage, because the caller can see which page needs splitting, trimming, or font/layout adjustments.

## Paging Syntax

Use `<!-- xhs-page -->` to start a new output page. Markdown headings stay as content; they no longer trigger pagination by themselves.

## Markdown Images

Standard Markdown image syntax `![alt](src)` now renders as real images in the shared page card instead of placeholders.

Supported image sources:

- CLI / Node export: local paths relative to the input Markdown file, absolute file paths, `http(s)` URLs, and `data:` URLs
- Web preview: browser-accessible `http(s)` URLs, `data:` URLs, and any same-origin path the browser can actually load

Current boundary:

- Web preview does not have direct access to arbitrary local files referenced from a Markdown file on disk. When you use a local relative path such as `./assets/demo-figure.svg` in the browser editor, the preview shows an explicit failure state instead of pretending the image rendered.

Examples:

- local CLI sample: `examples/sample.md`
- browser/data URL sample: `examples/image-web.md`
- failure fallback sample: `examples/image-error.md`

## Current scope

This repository only covers the terminal Markdown-to-image tool. It is designed to become the rendering backend for a larger `script + skill` workflow later, but that workflow is intentionally out of scope here.
