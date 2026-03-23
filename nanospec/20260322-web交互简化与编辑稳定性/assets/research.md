# 研究记录：web交互简化与编辑稳定性

## 1. 问题定义

本轮要解决两类问题：

1. Web 界面的信息层级仍偏向调试面板，不适合普通用户直接编辑和导出图片。
2. Markdown 编辑区在正文中部按回车后，光标会跳到文本末尾，破坏连续编辑。

## 2. 本地代码证据

### 2.1 `pages.json` 当前仍是主工具栏一级按钮

证据：

- `apps/web/src/App.tsx:407` 到 `apps/web/src/App.tsx:421` 的主工具栏中，“导出图片包”“下载 pages.json”“恢复默认”并列展示。
- `apps/web/src/App.tsx:298` 到 `apps/web/src/App.tsx:303` 单独提供 `downloadPagesJson()`，说明它被当作直接面向用户的可见操作。

结论：

- 当前产品表达仍把 `pages.json` 视为普通用户可见能力，与“Web 直接交付图片”的目标冲突。

### 2.2 Markdown 编辑区当前只是普通 `textarea`

证据：

- `apps/web/src/App.tsx:429` 到 `apps/web/src/App.tsx:445` 中，Markdown 内容区直接使用单个 `textarea`。
- `apps/web/src/styles.css:60` 到 `apps/web/src/styles.css:63` 中，`textarea` 默认最小高度仅 `11rem`。
- `apps/web/src/styles.css:86` 到 `apps/web/src/styles.css:92` 中，左侧控制区是整体滚动容器，Markdown 区夹在多个配置卡片之间。

结论：

- 当前布局没有把 Markdown 编辑作为主工作区；编辑面积和优先级都偏低。

### 2.3 低频配置当前以多个常驻大卡片展开

证据：

- `apps/web/src/App.tsx:447` 到 `apps/web/src/App.tsx:649` 中，“画布与排版”“身份信息”“非正文元素”“日期与页脚文案”都以完整 section 常驻展开。
- `apps/web/src/styles.css:131` 到 `apps/web/src/styles.css:139` 中，每个 `panel-section` 都带有完整边框、背景和内边距。

结论：

- 低频配置在默认界面里占用了大量首屏空间，和正文编辑争抢注意力。

### 2.4 光标跳尾的高概率根因是把受控输入更新放进了 `startTransition`

证据：

- `apps/web/src/App.tsx:436` 到 `apps/web/src/App.tsx:444` 中，`textarea` 的 `onChange` 把 `updateState({ markdown: nextValue })` 包在 `startTransition()` 内。
- 同文件 `apps/web/src/App.tsx:211` 中又使用了 `useDeferredValue(editorState.markdown)` 作为重计算输入。

分析：

- 对受控文本输入，React 需要尽快把最新 `value` 与 DOM 输入保持同步。
- 将输入值更新放到 transition 中，会让这次更新变成低优先级，从而增加 DOM 原生值和 React 受控值短暂错位的概率。
- 对 `textarea` 这类需要精确保留 selection 的输入，这种错位很容易表现为插入发生后 selection 被重置，最终看起来像“光标跳到末尾”。
- 这里已经有 `useDeferredValue` 用于拖慢后续 Markdown 解析和预览计算，因此没有必要再把输入本身也放进 transition。

结论：

- 这部分更适合 `adapt` 当前实现：保留 `useDeferredValue` 作为预览降载手段，移除 `startTransition` 对输入值本身的包裹。

## 3. 候选方案比较

### 方案 A：仅调样式，不动结构

- 优点：改动最小。
- 缺点：`pages.json` 仍会出现在主工具栏；低频配置仍是长期展开；很难真正建立主路径。

结论：不足以满足 spec。

### 方案 B：保留当前单页结构，但重排主次信息并把低频配置折叠

- 做法：保留双栏模式，把左侧改为“主操作 + 大 Markdown 编辑器 + 折叠设置”，并将 `pages.json` 放入高级入口。
- 优点：改动集中在 `apps/web/src/App.tsx` 和 `apps/web/src/styles.css`，符合当前项目体量。
- 缺点：仍是同一页面内完成所有交互，需要仔细控制默认展开层级。

结论：可行。

### 方案 C：拆成多步向导或多路由编辑器

- 优点：层级更强。
- 缺点：超出本轮范围，且会显著增加状态同步和验证成本。

结论：超范围。

## 4. 实现决策

决策：`adapt`

原因：

- 现有 Web 已经具备正确的渲染、导出和配置模型，不需要推翻重做。
- 主要问题集中在信息层级、默认布局和一个明确的受控输入 bug。
- 采用“保留当前数据模型，重构界面层级，移除错误的输入调度策略”的方式，可以以较小改动满足本轮要求。
