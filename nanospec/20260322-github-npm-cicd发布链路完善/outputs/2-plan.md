# 方案：GitHub / npm / CI/CD 发布链路完善

## 1. 先把仓库整理成可发布形态，再碰外部平台

第一步不是直接创建仓库或发布 npm，而是先在本地完成发布面清理：

- 明确只发布 `packages/cli`
- 为 CLI 包补齐 `license`、`repository`、`homepage`、`bugs`、`files`、`publishConfig`
- 补测试、补 `verify`、补 dry-run 打包检查
- 处理 CLI 对 core 和 web 构建产物的依赖

这样做的目的是先确保“本地包是自洽的”，再去推进 GitHub 和 npm 平台配置。

## 2. 把发布对象收敛成一个 CLI 包

当前仓库是 monorepo，但对外无需同时发布多个包。更稳的做法是：

- 根包继续作为 workspace 容器
- `packages/core` 保持内部包，必要时标记为 private
- `packages/cli` 改成真正的公开包 `xhs-md-renderer`
- 通过 `prepare-package` 在 prepack 阶段把 `packages/core/dist` 与 `apps/web/dist` 一并打入 CLI 包

这样既保留 monorepo 开发体验，也避免多包发布带来的版本同步成本。

## 3. CI 采用“校验、测试、构建”三层门禁

GitHub Actions 的基础 CI 采用：

1. typecheck
2. smoke tests
3. build

但由于 CLI 的类型检查依赖 `@xhs-md/core` 构建产物，实际执行顺序需要调整为“先校验 core，再构建 core，再校验 CLI / Web”。

## 4. Pages 与 npm 发布分成两条 CD 流程

持续交付拆成两条独立流水线：

- `main` push -> GitHub Pages 部署演示站
- `v*` tag push -> npm 自动发布

这样可以把演示站更新频率与正式包发布频率分开，降低每次发版的耦合度。

## 5. 平台卡点按 align 记录，不在对话里漂浮

本轮外部卡点并非代码逻辑问题，而是平台限制和权限问题：

- GitHub token 缺少 `workflow` scope
- 新仓 Pages 未启用
- npm login 指向镜像站
- 新包首发前无法配置 Trusted Publishing
- npm 首发要求网页二次验证

这些卡点都需要先写入 `alignment.md`，再同步到 plan、tasks 和最终总结中，避免下次重复踩坑。

## 6. 采用“一次人工首发 + 后续 Trusted Publishing 自动化”的落地路径

由于新包首发前无法先配 Trusted Publishing，因此实际落地顺序是：

1. 本机登录官方 npm registry
2. 人工首发 `0.1.0`
3. 在 npm 包页补配 Trusted Publishing
4. 修正 CLI bin 问题并发布 `0.1.1`
5. 通过 `v0.1.1` tag 验证 GitHub Actions 自动发版

这条路径虽然不是“从零到一完全自动化”，但它符合平台现实约束，并且能把自动化稳定地接到后续版本上。
