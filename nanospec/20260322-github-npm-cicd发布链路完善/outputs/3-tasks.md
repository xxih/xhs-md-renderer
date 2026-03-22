## 1. 发布对象与本地校验准备

- [x] 1.1 明确只发布 `packages/cli`，将公开包名收敛为 `xhs-md-renderer`。
- [x] 1.2 为 CLI 包补齐 `license`、仓库地址、主页、问题地址、`files` 与 `publishConfig`。
- [x] 1.3 新增 smoke tests、`verify`、`pack:cli` 等脚本，并完成本地打包 dry-run 验证。
- [x] 1.4 编写 `prepare-package`，把 `packages/core/dist` 与 `apps/web/dist` 一并纳入最终 CLI 包。

验收条件：本地 `npm run verify` 与 `npm pack --dry-run -w xhs-md-renderer` 成功。

## 2. GitHub 仓库与 Actions 链路

- [x] 2.1 创建公开仓库 `xxih/xhs-md-renderer` 并推送主分支。
- [x] 2.2 补齐 CI workflow，覆盖 typecheck、tests、build。
- [x] 2.3 补齐 GitHub Pages workflow，并完成 Pages site 启用。
- [x] 2.4 修复 fresh checkout 下的 workspace typecheck 顺序问题与 Node 20 测试 glob 问题。

验收条件：GitHub 仓库可访问，CI 与 Deploy web demo workflow 最新一轮成功。

## 3. npm 首发与 Trusted Publishing 切换

- [x] 3.1 确认本机 `npm login` 使用的是官方 registry，而不是镜像站。
- [x] 3.2 完成 `xhs-md-renderer@0.1.0` 手动首发。
- [x] 3.3 在 npm 包页配置 Trusted Publishing，绑定 GitHub Actions `publish.yml`。
- [x] 3.4 修复 CLI `bin` 入口并把命令名稳定为 `xhs-md-renderer`。

验收条件：npm 包页可访问，且后续版本具备走 Trusted Publishing 自动发布的条件。

## 4. 自动发版验证

- [x] 4.1 升级版本到 `0.1.1` 并完成 fresh verify。
- [x] 4.2 推送 `main` 与 tag `v0.1.1`。
- [x] 4.3 观察 `Publish npm package` workflow，确认 Trusted Publishing 自动发版成功。
- [x] 4.4 验证 npm registry 中最新版本变为 `0.1.1`。

验收条件：GitHub Actions 中 `Publish npm package` for `v0.1.1` 成功，`npm view xhs-md-renderer version` 返回 `0.1.1`。

## 5. 文档与中间产物沉淀

- [x] 5.1 记录研究结论到 `.research/research-note.md`。
- [x] 5.2 记录验证证据到 `.quality/quality-check.md`。
- [x] 5.3 将本轮背景、偏差、方案、任务、验收与总结落成 NanoSpec 文档。

验收条件：当前任务目录下包含 `brief.md`、`alignment.md`、`assets/research.md`、`outputs/1-spec.md`、`outputs/2-plan.md`、`outputs/3-tasks.md`、`outputs/acceptance.md`、`outputs/summary.md`。
