# 对齐记录：GitHub / npm / CI/CD 发布链路完善

## 2026-03-19

- [缺失] 仓库起始状态只有本地 git 仓库，没有 GitHub remote、没有 `.github/workflows/*`、没有 npm 发布元数据，也没有测试脚本。
  处理：将任务范围明确为“先补齐发布链路基础设施，再处理外部账号与平台配置”。
  影响：`brief.md`、`outputs/1-spec.md`、`outputs/2-plan.md` 与 `outputs/3-tasks.md` 都按“基础设施先行，外部发布后置”编写。

## 2026-03-21

- [偏差] 创建 `xxih/xhs-md-renderer` 仓库后，首次 `git push origin main` 被 GitHub 拒绝，原因是当前 `gh` 凭证缺少 `workflow` scope，无法推送 `.github/workflows/*`。
  处理：补齐 `gh auth refresh -h github.com -s workflow` 与 `gh auth setup-git`，确认 `gh auth status` 中出现 `workflow` scope 后重新推送。
  影响：GitHub 仓库创建与代码推送拆成两个步骤；相关卡点需要记录到任务文档与后续 checklist 中。

- [偏差] 首轮 CI 在 GitHub Actions fresh checkout 环境中失败，`packages/cli` 的 TypeScript 校验无法解析 `@xhs-md/core`，因为该 workspace 依赖的 `dist` 声明文件在 CI 中尚未生成。
  处理：把根脚本 `typecheck` 改为先 `typecheck @xhs-md/core`，再 `build @xhs-md/core`，然后再校验 CLI 和 Web。
  影响：`outputs/2-plan.md` 和 `outputs/3-tasks.md` 需要同步反映“workspace 依赖 fresh checkout 下的构建顺序”这一约束。

- [缺失] GitHub Pages 初始并未启用，导致 `actions/configure-pages@v5` 直接返回 404 / `Resource not accessible by integration`。
  处理：先在 workflow 中启用 `enablement: true`，随后通过 GitHub API 创建 Pages site，并把 Pages 站点切到 `workflow` 模式。
  影响：Pages 部署不再假设仓库已预先开启；需要把“新仓首次启用 Pages”的平台配置纳入对齐记录和复用建议。

- [偏差] Node 20 runner 下 `node --import tsx --test tests/**/*.test.ts` 没有展开 glob，导致 CI 只在 Node 20 失败、Node 22 通过。
  处理：将测试脚本改为 `node --import tsx --test tests/*.test.ts`。
  影响：测试脚本需要优先选跨 Node 版本、跨 shell 的稳定写法。

## 2026-03-22

- [缺失] npm 新包在首发前没有包级设置页，Trusted Publishing 无法先配置；只有包首次发布成功后，npm 网站才出现 `Settings -> Trusted publishing`。
  处理：先用本机 `npm login` 对官方 registry 做一次手动首发 `0.1.0`，再回到包页补配 Trusted Publishing。
  影响：`outputs/1-spec.md` 与 `outputs/summary.md` 需要明确记录“新包首发阶段允许一次人工发布”这一现实约束。

- [偏差] 本机 `npm login` 默认跳到了 cnpm 镜像站，而不是官方 npm。
  处理：切到 `https://registry.npmjs.org/` 完成登录，并用 `npm whoami --registry=https://registry.npmjs.org/` 验证登录账号。
  影响：后续文档和复用建议必须加入“确认 registry 指向官方 npm”这一检查项。

- [偏差] 手动首发 `0.1.0` 前，npm 在 publish 阶段自动移除了包里的 `bin` 字段，导致 CLI 入口配置不稳定；同时 npm 还要求网页二次验证（`EOTP`）。
  处理：把 CLI 入口改成单字符串 `bin: "./bin/xhs-md-render.js"`，命令名统一为 `xhs-md-renderer`，然后重新打包校验；人工完成 npm 网页二次验证后完成首发。
  影响：后续 `0.1.1` 作为修正版本发布，用于验证修正后的 `bin` 与 Trusted Publishing 自动发版链路都正常。
