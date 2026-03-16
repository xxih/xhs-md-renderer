# research

## 本地候选

### 候选 1: `apps/web/src/App.tsx`

- 证据：已有 `editorStorageKey` 和 `localStorage` 读写，说明仓库已经接受“配置先统一建模，再由具体入口读写”的模式。
- 结论：可借鉴“先构造默认状态，再合并持久化/覆盖项”的合并思路。

### 候选 2: `packages/cli/src/index.ts`

- 证据：当前 CLI 已有一套参数到 `renderConfig` 的映射，但没有文件配置层，也没有头像文件解析和反馈输出。
- 结论：适合在现有入口上做 `adapt`，不需要重写 CLI 框架。

### 候选 3: `packages/core/src/themes.ts`

- 证据：默认配置和配置合并已经集中在 `createRenderConfig`。
- 结论：新增底部安全边距和预警阈值应进入这里，而不是只在 CLI 私有处理。

### 候选 4: `packages/core/src/preview.tsx`

- 证据：正文容器目前只有左右 margin，没有显式底部安全区；footer 还是绝对定位在底部。
- 结论：需要在这里把底部安全边距转成真实布局约束。

### 候选 5: `packages/core/src/node.ts`

- 证据：当前导出链路统一写出 `manifest.json`、`pages.json` 和 `pages/*.png`。
- 结论：布局报告适合跟随这里一起写出，避免 CLI 自己再分叉一套输出逻辑。

## 外部候选

- 本轮未引入额外外部依赖。
- 原因：默认配置目录发现、JSON 合并、头像文件解析和启发式布局分析都能在现有栈内完成，没有必要为此增加新包。

## 决策

- `adapt`

原因：

1. 仓库里已经有统一 `RenderConfig` 和 CLI 参数映射骨架，可以直接扩展。
2. 溢出反馈是新能力，需要自己在 `core` 里 build 一层分析模型，但不需要推翻现有导出链路。
3. 头像稳定读取也只需要在 CLI 增加文件解析，不需要引入新的素材系统。
