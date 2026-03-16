# markdown图片正确渲染 调研记录

## 1. 本地代码证据

1. `packages/core/src/parser.ts`
   现状：已经把标准 Markdown 图片节点映射为 `PageImageBlock`，说明“解析不到图片”不是当前主问题。
   证据：`paragraphHasOnlyImage()`、`blockFromNode()` 都会产出 `type: "image"` 的 block。

2. `packages/core/src/preview.tsx`
   现状：图片 block 仍渲染为固定高度的 `Image Placeholder`，没有真实图片元素，也没有图片加载失败语义。
   影响：Web 预览与 Node 导出共用这棵渲染树，因此两端都会继承占位行为。

3. `packages/core/src/layout.ts`
   现状：图片高度估算仍使用固定 `140px` 占位高度，并把 `alt`/`url` 当成说明文字计入高度。
   影响：即使后续渲染出真实图片，布局反馈也会继续与实际输出脱节。

4. `packages/core/src/node.ts`
   现状：导出链路通过 `XhsPageCard` 走统一渲染，因此 CLI 导出的 PNG 当前也不可能得到真实图片。

5. 仓库内样例与测试
   现状：`examples/sample.md` 中没有图片样例，仓库内也没有围绕图片渲染的测试或验证样本。

## 2. 候选实现方向

### 方案 A：沿用现有 `PageImageBlock` 并补齐资源解析

- 保留现有 Markdown 解析入口。
- 在共享模型里补充图片资源解析后的可渲染信息和尺寸信息。
- Node/CLI 与 Web 只在“如何把源地址变成可加载资源”上做环境适配。

优点：改动集中在现有 `core` 模型和共享渲染树，最符合当前架构。

### 方案 B：为 CLI/Web 分别维护两套图片渲染逻辑

- Web 直接用浏览器 `<img>`。
- CLI 走另一套 Node 私有资源读取与绘制逻辑。

缺点：会把预览、导出、布局分析再次拆成两条链路，后续维护成本更高。

## 3. 决策

结论：`adapt`

理由：

1. 本地代码已经有图片 block，不需要重造解析层。
2. 当前缺口集中在“资源解析 + 共享渲染 + 布局估算”，适合沿现有模型做最小闭环。
3. 预览与导出已经共享 `XhsPageCard`，继续复用这条链路能避免 Web/CLI 行为分叉。

## 4. 下一步建议

1. 先在规格里明确“标准 Markdown 图片语法 + 环境内可解析图片源”的支持边界。
2. 再在方案里拆开 Node/CLI 与 Web 的资源解析职责，避免一开始把两端能力混成同一条假设。
3. 落一组带图片的样例 Markdown 和验证步骤，避免后续实现完仍然没有回归样本。
