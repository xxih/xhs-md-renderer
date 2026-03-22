# GitHub / npm / CI/CD 发布链路完善

## 背景

仓库此前已经具备 Markdown 转图片的核心能力，但还停留在本地可用阶段：没有 GitHub 公开仓库、没有 npm 包发布路径、没有稳定的 CI/CD，也没有把 GitHub Pages 演示站和 npm 自动发版串成完整交付链。

用户要求把这一波工作做成可对外发布、可持续演进的正式项目；遇到账号、权限、平台配置等外部卡点时，再单独讨论。

## 当前目标

1. 建立公开 GitHub 仓库并推送主分支。
2. 把 CLI 整理成可发布的 npm 包 `xhs-md-renderer`。
3. 补齐 GitHub Actions CI、GitHub Pages、npm 发布 workflow。
4. 打通从本地版本变更、Git tag 到 npm 自动发布的整条链路。
5. 把中间决策、外部卡点、验收证据和复用建议回写成 NanoSpec 文档。

## 当前约束

1. 仓库继续保持 monorepo 结构，不拆成多仓。
2. 公开发布对象只收敛到一个 npm CLI 包，包名保持 `xhs-md-renderer`。
3. 外部平台配置要尽量复用官方推荐路径：GitHub Actions、GitHub Pages、npm Trusted Publishing。
4. 新包首发时，如果平台存在 Trusted Publishing 先决条件或权限限制，需要允许先走一次手动首发，再切回自动化。
