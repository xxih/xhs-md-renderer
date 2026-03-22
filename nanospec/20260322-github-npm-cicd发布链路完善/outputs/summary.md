# 总结：GitHub / npm / CI/CD 发布链路完善

## 已交付

本轮已经把仓库从“本地可运行项目”升级为“正式可公开交付项目”：

- 建立了公开 GitHub 仓库与 `main` 分支
- 建立了 CI、Pages、npm 发布三条 GitHub Actions workflow
- 发布了 npm 包 `xhs-md-renderer`
- 打通了 `v0.1.1` tag -> Trusted Publishing 自动发版
- 建立了 `.research`、`.quality` 与 `nanospec` 三套可追踪中间产物

## 关键决策

1. 保持 monorepo，不拆仓；只公开发布一个 CLI 包。
2. `packages/core` 不单独发 npm，而是在 CLI 打包前把构建产物内嵌进最终 tarball。
3. 新包首发允许一次人工发布，随后切回 Trusted Publishing 自动发版。
4. Pages 与 npm 发布解耦：`main` 负责 demo，tag 负责正式版本。
5. CLI 命令入口最终统一为 `xhs-md-renderer`，避免 npm 在 publish 阶段移除无效 `bin` 声明。

## 本轮最有价值的复用经验

### 1. 新包首发不要默认以为能先配 Trusted Publishing

真实平台约束是：npm 包页不存在，就没有 Trusted Publishing 的设置入口。遇到新包首发时，应优先接受“一次人工首发 + 后续自动化接管”的路径，而不是在首发前反复卡住。

### 2. GitHub 新仓首次启用 Pages 可能不是 workflow 自己就能兜底

如果仓库还没有 Pages site，`actions/configure-pages` 可能直接失败。应把“创建 Pages site 并切到 workflow build type”纳入排障 checklist。

### 3. workspace 项目的 CI 要按 fresh checkout 重新推演依赖顺序

本地由于已有 `dist/` 或 workspace link，很多问题不容易暴露；CI fresh checkout 会把这些隐式依赖放大。对 monorepo 项目来说，typecheck / build 顺序本身就是需要设计的内容。

### 4. npm 发布前一定要做 dry-run，并观察 npm 是否在 publish 时自动纠正字段

这次 CLI `bin` 的问题如果没有 dry-run 和首发时的 npm warning，很容易把一个“安装后没有命令入口”的包发出去。以后发布前要把 npm warning 当成正式信号，而不是噪音。

## 剩余事项

- 当前工作区还有一轮 README / changelog / GitHub release 自动生成的补充改动未纳入本任务交付。
- 若后续继续做正式开源完善，可单开新任务处理：
  - release note 模板
  - changelog 维护策略
  - README 首页进一步优化
  - install / usage 截图或 demo GIF

## 后续建议

1. 以后每次发版都沿用：本地 `npm run verify` -> `npm pack --dry-run` -> 提交版本号 -> 打 tag -> 观察 publish workflow。
2. 如果未来要对外暴露 JS API，再评估是否把 `@xhs-md/core` 单独做成正式 npm 包。
3. 若要继续打磨开源项目形态，建议单开一轮“README / CHANGELOG / GitHub Release 体验完善”任务，而不是继续混在本轮发布链路任务里。
