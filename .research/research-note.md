# Research Note

## 2026-03-17 preview.tsx 实时预览

- 目标：修改 `packages/core/src/preview.tsx` 时，能在 `apps/web` 里立即看到效果。
- 本地候选：
  - `apps/web/src/App.tsx` 直接消费 `@xhs-md/core` 导出的 `XhsPageCard`
  - `apps/web/vite.config.ts` 当前只有 React 插件，没有对 workspace 源码做 alias
  - `packages/core/package.json` 的导出指向 `dist/index.js`
- 结论：
  - 当前开发态默认吃的是 `@xhs-md/core` 的 `dist` 产物，改 `packages/core/src/preview.tsx` 不会自动进入 Vite HMR。
  - 采用 `adapt`：只在 `vite serve` 时把 `@xhs-md/core` alias 到 `packages/core/src/index.ts`，保留构建态继续按包导出走。
- 结果：
  - 运行 `npm run dev:web` 后，保存 `packages/core/src/preview.tsx` 会触发浏览器热更新。
