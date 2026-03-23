# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3] - 2026-03-23

### Changed

- Simplified the web editor so image export is the primary action and `pages.json` moves into an advanced/debug section.
- Reworked the web layout to prioritize the Markdown editor and collapse low-frequency settings into lighter-weight groups.

### Fixed

- Fixed the Web Markdown editor so pressing Enter in the middle of the document no longer jumps the caret to the end.
- Removed `pages.json` from the default Web image export archive so the direct output path stays focused on images plus manifest.

## [0.1.2] - 2026-03-22

### Added

- Added a proper top-level `CHANGELOG.md`.
- Added a dedicated NanoSpec task record for the GitHub / npm / CI/CD release rollout.

### Changed

- Reworked the repository `README.md` into a more complete open-source project homepage.
- Extended the publish workflow so version tags also create a GitHub Release with generated notes.

## [0.1.1] - 2026-03-22

### Fixed

- Fixed the published CLI entry so the installed executable is available as `xhs-md-renderer`.
- Fixed workspace CI typechecking by building `@xhs-md/core` before downstream CLI checks.
- Fixed the test glob used in CI so Node 20 and Node 22 both execute the smoke tests consistently.

### Infrastructure

- Verified npm Trusted Publishing from GitHub Actions with provenance.
- Enabled GitHub Pages deployment for the web demo.

## [0.1.0] - 2026-03-22

### Added

- Initial public release of the Markdown-to-Xiaohongshu image renderer CLI.
- Shared `core`, `cli`, and `web` workspace structure.
- Markdown parsing, paging, theme configuration, image rendering, and layout reporting.
- Project CI, Pages deployment, and npm publish workflows.
