# 调研记录：GitHub / npm / CI/CD 发布链路完善

## 本地代码与仓库证据

- 根 `package.json` 起初是 workspace 容器，`private: true`，适合继续作为 monorepo 根而不是直接发布。
- `packages/cli` 已有 `bin`，最适合作为最终 npm 发布对象，但其运行时依赖 `@xhs-md/core` 和 `apps/web/dist`，因此需要在打包前把依赖产物内嵌进 CLI 包。
- 仓库起始时没有 `.github/workflows/*`，也没有测试脚本和 release 流程。

## 关键外部事实

- npm Trusted Publishing 的推荐路径是 GitHub Actions + OIDC。
- 但新包在首发前没有包级设置页，因此无法先在 npm 网站完成 Trusted Publishing 绑定；需要先有一次已发布的包。
- GitHub Pages 在新仓默认可能未启用，首次部署时可能需要显式创建 Pages site 并切到 `workflow` build type。

## Adopt / Adapt / Build 结论

- `adapt`: 保持 monorepo，不拆仓；只发布一个 CLI 包 `xhs-md-renderer`。
- `adapt`: CI 使用 `typecheck + test + build`，但要根据 workspace 依赖顺序做小幅调整。
- `adopt`: Pages、npm publish、Trusted Publishing 都按 GitHub / npm 官方推荐路径落地。
- `build`: 为 CLI 包自建 `prepare-package` 脚本，把 `packages/core/dist` 和 `apps/web/dist` 一起打入最终 npm tarball。

## 关键结果

- GitHub 公开仓库：`https://github.com/xxih/xhs-md-renderer`
- GitHub Pages：`https://xxih.github.io/xhs-md-renderer/`
- npm 包：`https://www.npmjs.com/package/xhs-md-renderer`
- 自动发布验证版本：`0.1.1`
