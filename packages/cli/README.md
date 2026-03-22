# xhs-md-renderer

Render Markdown into Xiaohongshu-friendly image pages from the command line.

## Install

```bash
npm install -g xhs-md-renderer
```

Or run it on demand:

```bash
npx xhs-md-renderer --input ./note.md --output ./.xhs-output
```

## Usage

```bash
xhs-md-renderer --input ./note.md --output ./.xhs-output
```

Common options:

- `--renderer auto|node|browser`
- `--title "My Note"`
- `--theme paper`
- `--font-family "PingFang SC, sans-serif"`
- `--font-size 16`
- `--config-dir ./.xhs-md-renderer`

## Config Directory

The CLI looks for a project config directory named `.xhs-md-renderer` in this order:

1. `--config-dir <path>`
2. Search upward from the input Markdown file directory
3. Built-in defaults

Supported files inside the config directory:

- `render.json`
- `avatar.png|jpg|jpeg|webp|gif`

## Notes

- The Node renderer works best when the machine has usable CJK fonts installed.
- The browser renderer needs a local Chromium-based browser.
- Every export writes `manifest.json`, `pages.json`, and `layout-report.json`.
