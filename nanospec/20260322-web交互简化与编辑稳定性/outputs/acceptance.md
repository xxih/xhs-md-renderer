# 验收记录：web交互简化与编辑稳定性

## 验收结论

结论：本地实现与验证通过，待完成正式发布回写。

## 关键交付结果

- Web 主路径收口为“编辑 Markdown -> 预览 -> 导出图片”。
- `pages.json` 从首屏主操作移入“高级操作”折叠区域。
- Markdown 编辑区扩展为默认主工作区，低频设置改为折叠分组。
- Markdown 中部回车后光标不再跳到文末。
- Web 图片导出包默认只包含 `manifest.json` 与 `pages/*.png`。

## Fresh evidence

### 静态验证

- `npm run typecheck`
  - 结果：成功
- `npm test`
  - 结果：成功
- `npm run build`
  - 结果：成功

### 浏览器回归

- 本地启动：`npm run dev -w @xhs-md/web -- --host 127.0.0.1 --port 4173`
  - 结果：成功
- Playwright 快照验证
  - 结果：首屏仅显示“导出图片包”“恢复默认”；`pages.json` 仅在“高级操作”折叠面板中出现。
- Playwright 编辑验证
  - 操作：将光标定位到正文中部，按回车并继续输入“继续”
  - 结果：插入内容停留在中部新行位置，selection 未跳到文本末尾。
- Playwright 导出验证
  - 结果：页面出现“已导出 1 张图片。”
  - 下载产物：`xhs-pages-1774275459034.zip`

### 导出产物检查

- `unzip -l /var/folders/rp/pd6thbz16bs0fs06nt0dcs0m0000gp/T/playwright-mcp-output/1774273921856/xhs-pages-1774275459034.zip`
  - 结果：仅包含 `manifest.json`、`pages/` 和 `pages/page-01.png`

### 发布前检查

- `npm pack --dry-run -w xhs-md-renderer`
  - 结果：成功
  - 说明：tarball 版本为 `0.1.3`，包含 `bin/`、`dist/`、`web-dist/` 与 `README.md`

## 待回写

- 提交 `main`
- 推送 tag `v0.1.3`
- 回写 GitHub Actions、npm 与 Pages 的正式发布证据
