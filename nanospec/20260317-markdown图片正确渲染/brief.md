# markdown图片正确渲染

## 背景

当前仓库已经能把 Markdown 解析成页面模型，`packages/core/src/parser.ts` 也已经把标准图片语法解析成 `image` block，但共享渲染组件 `packages/core/src/preview.tsx` 仍然只输出 `Image Placeholder`，CLI 和 Web 预览都没有真正把图片渲染出来。

同时，`packages/core/src/layout.ts` 目前仍按固定占位高度估算图片区块，导致图片进入页面后，布局反馈、导出结果和真实视觉表现也还没有形成闭环。

用户要求单独开一个新任务，把“Markdown 中的图片能够正确渲染”作为一轮独立需求来收敛，而不是继续混在已有 Web 或 CLI 体验任务里。

## 当前目标

1. 让标准 Markdown 图片语法在共享渲染链路中输出真实图片，而不是占位块。
2. 明确图片来源在 Web 与 CLI 两个环境中的解析边界，避免“解析了图片节点，但没有可渲染资源”的半成品状态。
3. 让图片区块参与页面布局估算和导出结果，保证预览、导出与布局反馈口径一致。

## 当前约束

1. 继续沿用 `packages/core + packages/cli + apps/web` 的现有架构，不引入后端服务。
2. 不能破坏现有标题、段落、列表、代码块、分隔线等 Markdown 渲染链路。
3. 本轮先聚焦“Markdown 正文图片正确显示”，不把封面模板、图库管理或高级样式控制混进来。
