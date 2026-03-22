# 规格说明：GitHub / npm / CI/CD 发布链路完善

## 1. 背景

当前项目已经具备核心渲染能力，但缺少正式开源项目应有的交付链：公开仓库、可安装 npm 包、持续集成、演示站和自动发布都还没有收敛成一个稳定闭环。

本轮任务的本质不是补某一个脚本，而是把“本地可运行项目”升级为“可以公开访问、可以安装使用、可以持续发布的正式项目”。

## 2. 交付目标

### 2.1 建立公开 GitHub 仓库并推送主分支

项目必须拥有一个公开可访问的 GitHub 仓库 `xxih/xhs-md-renderer`，并成功推送主分支代码。

成功标志：仓库页面可访问，默认分支为 `main`，包含工作流文件、README 和当前代码。

### 2.2 发布一个对外可安装的 npm CLI 包

项目必须对外发布一个公共 npm 包，包名固定为 `xhs-md-renderer`。安装后，用户可以通过稳定的 CLI 命令运行导出能力。

成功标志：官方 npm registry 上可以查看包页面和版本；安装后存在可执行命令入口。

### 2.3 补齐持续集成、Pages 与自动发布工作流

仓库必须具备以下自动化：

- PR / push 自动校验
- `main` 分支自动部署 GitHub Pages 演示站
- 版本 tag 自动发布 npm 包

成功标志：对应 GitHub Actions workflow 可执行，并在成功后留下可追踪的运行记录。

### 2.4 打通从版本变更到自动发布的整条链路

系统必须支持以下实际发布路径：

1. 更新版本号
2. 提交并推送 `main`
3. 打 tag，例如 `v0.1.1`
4. GitHub Actions 自动发布 npm 包
5. npm registry 反映出新版本

成功标志：至少有一个 tag 版本通过自动化成功发布。

### 2.5 沉淀卡点、决策与验收证据

本轮工作中出现的权限、平台限制、账号设置、registry 偏差、Pages 初始化和新包首发限制都必须以可复用形式落档，而不是只留在聊天记录里。

成功标志：NanoSpec 文档能够独立说明这轮工作做了什么、遇到了什么卡点、如何解决，以及后续如何复用。

## 3. 非目标

以下内容不属于本轮：

- 增加新的渲染功能或视觉能力
- 引入新的运行平台或后端服务
- 发布多个 npm 包
- 重构 monorepo 结构
- 做完整的社区运营或开源推广动作

## 4. 关键约束

1. 根仓库继续保持 monorepo，不改变 `packages/* + apps/*` 布局。
2. 公开发布对象收敛到一个 CLI 包，不把 `@xhs-md/core` 作为独立 npm 包对外发布。
3. 自动发布优先走 Trusted Publishing；但若新包首发前存在平台限制，允许一次人工首发作为过渡。
4. GitHub Pages 和 npm 发布都必须使用官方平台支持的标准路径，而不是依赖本机长期持有的手工 token。

## 5. 验收标准

1. GitHub 仓库 `https://github.com/xxih/xhs-md-renderer` 可访问，默认分支为 `main`。
2. GitHub Pages 演示站可访问：`https://xxih.github.io/xhs-md-renderer/`。
3. npm 包可访问：`https://www.npmjs.com/package/xhs-md-renderer`。
4. `Publish npm package` workflow 至少有一次基于版本 tag 的成功运行。
5. npm registry 中可以查询到自动发布后的版本 `0.1.1`。
6. 本轮工作过程、偏差与验证结果已回写到 NanoSpec 文档。
