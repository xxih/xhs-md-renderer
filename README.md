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

## Paging Syntax

Use `<!-- xhs-page -->` to start a new output page. Markdown headings stay as content; they no longer trigger pagination by themselves.

## Current scope

This repository only covers the terminal Markdown-to-image tool. It is designed to become the rendering backend for a larger `script + skill` workflow later, but that workflow is intentionally out of scope here.
