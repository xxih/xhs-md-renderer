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

## 2026-03-19 GitHub + npm + CI/CD 发布准备

- 目标：把当前 monorepo 整理成可推送到 GitHub、可发布 npm 包、并带有完整 CI/CD 的项目。
- 本地候选：
  - 根包 `package.json` 当前是 `private` workspace，适合作为仓库容器，不适合直接发布。
  - `packages/cli/package.json` 已经有 `bin`，最接近最终 npm 包，但当前运行时依赖内部包 `@xhs-md/core`，不能单独发布。
  - `packages/cli/src/browser-renderer.ts` 依赖 `apps/web/dist`，说明 npm 包还需要把 Web 构建产物一起带上。
  - 仓库当前没有 `.github/workflows/*`、没有测试脚本、没有 npm 发布元数据，也没有 Git remote。
- 外部候选来源：
  - npm `package.json` 文档：确认 `files` / `publishConfig` 的打包边界。
  - npm Trusted Publishing 文档：确认 GitHub Actions + OIDC 的推荐发布方式。
  - GitHub Actions 官方 Node package 发布文档：确认 CI 发布骨架。
  - Vite 静态部署文档：确认 GitHub Pages 演示站的部署方式。
- 结论：
  - 采用 `adapt`：保留 monorepo，根包继续只做工作区容器。
  - 只发布一个 CLI 包 `xhs-md-renderer`，并在打包前把 `packages/core/dist` 内嵌到 CLI 包里，同时复制 `apps/web/dist` 给浏览器渲染器使用。
  - CI 走 `typecheck + test + build`，CD 拆成两条：GitHub Pages 部署演示站、npm 发布 CLI。
  - 当前外部卡点主要有 3 个：GitHub 仓库名/可见性、开源许可证选择、npm Trusted Publishing 的一次性账号配置。
