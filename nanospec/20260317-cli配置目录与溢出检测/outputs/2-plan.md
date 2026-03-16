# 方案：cli配置目录与溢出检测

## 1. 先把“外部配置输入”从 CLI 参数里抽出来

在 `packages/cli/src/index.ts` 中新增配置目录解析层，负责：

- 发现默认配置目录 `.xhs-md-renderer`
- 读取 `render.json`
- 解析头像文件路径
- 合并 CLI 参数与文件配置

这样 CLI 的职责会变成“解析输入源并产出统一 `renderConfig`”，而不是继续把所有字段硬编码在参数拼装里。

## 2. 把底部安全边距与布局反馈纳入 core

在 `packages/core/src/models.ts` 和 `packages/core/src/themes.ts` 中扩展统一配置模型，新增布局相关字段，例如正文底部安全边距和预警阈值。随后在 `packages/core/src/preview.tsx` 中使用该配置，明确为正文区预留底部空间。

布局反馈逻辑也放到 `core`，以便 CLI 和后续 Web 都能复用同一套分析结果。

## 3. 用估算模型产出可自动消费的每页反馈

新增一个独立的布局分析模块，基于当前页面结构、字号、行高、块级间距和正文可用高度估算每页占用空间。输出每页：

- 可用内容区高度
- 估算内容高度
- 剩余底部空间
- 最终状态 `ok / warning / overflow`

这套模型不追求像素级测量，但要保证口径稳定、字段明确、对 AI 友好。

## 4. 让导出产物带上布局报告

在 `packages/core/src/node.ts` 的导出链路中增加布局报告生成，并在写出 bundle 时同时落盘 `layout-report.json`。CLI 只需要消费这个结果并打印摘要。

## 5. 文档与验证

同步更新 `README.md`，写清默认配置目录、配置文件名、头像文件约定和布局报告含义。验证以以下顺序进行：

1. `npm run typecheck`
2. `npm run build`
3. 跑一条 CLI 样例，确认能读配置目录并产出 `layout-report.json`
4. 检查控制台摘要是否能区分正常页、预警页和溢出页
