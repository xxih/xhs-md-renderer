# 研究记录：按 note-to-red 原始比例对齐导出物

## 2026-03-16

### 本地候选

- `packages/core/src/preview.tsx`
- `packages/core/src/themes.ts`
- `packages/core/src/node.ts`

### 外部参考

- `nanospec/20260316-做一个将md转化为适配小红书图文的工具/assets/note-to-red/src/styles/view/layout.css`
- `nanospec/20260316-做一个将md转化为适配小红书图文的工具/assets/note-to-red/src/styles/theme/theme-user-info.css`
- `nanospec/20260316-做一个将md转化为适配小红书图文的工具/assets/note-to-red/src/templates/default.json`
- `nanospec/20260316-做一个将md转化为适配小红书图文的工具/assets/note-to-red/src/downloadManager.ts`

### 关键结论

1. `note-to-red` 的预览核心宽度是 `450px`，比例为 `3:4`。
2. 导出使用 `html-to-image`，并固定 `pixelRatio: 4`。
3. 因此用户提供的 `1800x2400` 成品图，正是 `450 x 4` 的直接放大结果。
4. 需要对齐的不是“感觉上的大一点”，而是把 `note-to-red` 的 CSS 基准值按 `width / 450` 放大。

### 关键基准值

- 画布内边距：`20px`
- header 下边距：`10px`
- user-info padding：`10px 12px 3px 12px`
- 头像：`42px`
- 用户区 gap：`12px`
- 用户名：`16px`
- 用户 ID：`14px`
- 日期：`13px`
- 内容块左右 margin：`13px`
- 标题：`1.5em`，默认字体设置下等价约 `24px`
- 正文：默认字体设置下等价约 `16px`
- 页脚：`padding 16px`，`font-size 13px`

### 实现决策

- `adapt`

原因：

- 当前仓库已经有统一 `core` 渲染链路，不适合直接搬运 Obsidian DOM 结构。
- 但尺寸和比例应直接采用 `note-to-red` 的基准值与导出倍率，而不是继续自定义估算。
