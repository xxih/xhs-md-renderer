# 方案：末端图文工具的统一 Core + 多端适配

本轮先给出高层方案骨架，作为后续 `/plan` 的起点。这里的范围只覆盖“Markdown 转小红书图文”的末端工具，不覆盖完整的小红书创作工作流。

## 1. 分层建议

### 1.1 Core 层

职责：

- 读取和解析 Markdown / Obsidian 笔记
- 生成分页中间产物
- 管理分页、锁定块、视觉配置和导出状态
- 驱动图文渲染模块
- 导出统一图片结果

要求：

- 不依赖具体界面
- 不依赖 Obsidian 专有 UI 生命周期
- 提供稳定 API 供 CLI / Web / Obsidian 插件调用

### 1.2 Renderer 层

职责：

- 把分页内容转成图片
- 复用模板、主题、身份信息
- 支持单页与批量导出

要求：

- 被 `core` 调用，而不是直接绑死在某个端里
- 输入是结构化分页数据，输出是图片文件或二进制结果

### 1.3 Workflow / Skills 层

职责：

- 在未来的整体系统中，把这个末端工具暴露给 `script + skill` 工作流作为稳定调用入口

要求：

- 当前只保留接口边界，不展开全流程设计
- 不把当前末端工具的业务逻辑散落在 prompt 或某个端的临时脚本里

### 1.4 Surface 层

包含：

- CLI
- Web
- Obsidian 插件

职责：

- CLI 负责自动化、批量、脚本式调用
- Web 负责可视化编辑、预览与人工校对
- Obsidian 插件负责知识库内工作流接入

## 2. 数据与产物建议

建议 `core` 统一管理这些对象：

- `source-document`
- `content-pages`
- `render-config`
- `image-assets`
- `export-bundle`

这样不同端之间传递的是结构化中间产物，而不是彼此私有状态；未来工作流只需要消费 `export-bundle` 即可。

## 3. v1 建议顺序

建议按下面顺序推进：

1. 先定义 `core` 的输入输出模型和发布包协议。
2. 先做 CLI，验证 `core` 可被无界面稳定调用。
3. 再做 Obsidian 插件，把知识库内工作流跑通。
4. 最后做 Web，把中间产物可视化和可编辑能力补齐。

## 4. 当前还需要定的点

1. 图文渲染模块是直接吸收 `note-to-red` 的实现思路，还是只借鉴其模板/主题结构。
2. `export-bundle` 的最小协议是什么，图片之外要不要携带分页元信息和配置快照。
3. Web 与 Obsidian 插件是否都需要首批实现分页微调，还是只在其中一个端先提供。

## 5. 当前落地

代码仓库已创建为独立仓库，当前任务后续也会随仓库一起迁移并在仓库内继续维护。

当前已落地的技术栈：

- Monorepo: npm workspaces
- Core/CLI: TypeScript 5 + Node 24
- Web: React 19 + Vite 7
- Markdown parser: `unified + remark-parse + remark-gfm`
- Image renderer: `satori + @resvg/resvg-js`

当前已验证链路：

1. `packages/core` 可解析 Markdown 并生成分页模型。
2. `packages/cli` 可调用同一 `core` 产出 `manifest.json + pages.json + png`。
3. `apps/web` 可消费同一分页模型进行预览，并完成生产构建。
