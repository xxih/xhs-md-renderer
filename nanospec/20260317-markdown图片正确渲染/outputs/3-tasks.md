## 1. 文档收敛

- [x] 1.1 补充 `brief.md`，确认“Markdown 图片真实渲染”这一轮的目标、范围与约束。
- [x] 1.2 记录 `alignment.md`，把当前未明确的高级图片语法范围先收敛到标准 Markdown 图片语法。
- [x] 1.3 产出 `outputs/1-spec.md`，明确图片渲染目标、环境边界、非目标与验收标准。
- [x] 1.4 产出 `outputs/2-plan.md` 与 `outputs/3-tasks.md`，拆开共享模型、环境解析、渲染和验证路径。
- [x] 1.5 补充 `assets/research.md`，记录本地代码证据并给出 `adapt` 结论。

## 2. 共享图片模型与资源解析

- [x] 2.1 在 `packages/core` 中扩展图片 block 语义，明确原始图片引用、可渲染资源、失败态与尺寸信息的承载方式。
- [x] 2.2 在 CLI / Node 链路中实现相对 Markdown 文件的本地图片路径解析与资源归一化。
- [x] 2.3 在 Web 链路中实现浏览器可访问图片源的渲染支持，并为不可访问本地路径提供明确失败态。

## 3. 共享渲染与布局分析

- [x] 3.1 重构 `packages/core/src/preview.tsx` 的图片 block，去掉 `Image Placeholder`，改成真实图片渲染。
- [x] 3.2 调整图片的可见语义：成功加载时不默认展示 `alt` caption，失败时提供稳定回退。
- [x] 3.3 改造 `packages/core/src/layout.ts`，让图片区块基于真实尺寸或稳定回退比例参与布局估算。

## 4. 样例、文档与验证

- [x] 4.1 补一组带图片的 Markdown 样例和素材，覆盖 CLI 本地路径、Web URL / `data:` 源以及失败回退场景。
- [x] 4.2 更新 README，明确 Web 与 CLI 的图片源支持边界。
- [x] 4.3 跑 `npm run typecheck`、`npm run build`，并完成 CLI / Web 的图片渲染手动验证。
