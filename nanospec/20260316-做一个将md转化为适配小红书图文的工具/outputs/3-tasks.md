## 1. 已完成

- [x] 1.1 阅读 `assets/note-to-red` 的 README 与核心代码，确认其主要覆盖“Markdown 拆页、模板排版、图文导出”这一末端环节。
- [x] 1.2 补充外部调研，识别“小红书创作自动化”现有工具主要分布在排版导出、自动发布、AI 创作流水线三层。
- [x] 1.3 更新 `brief.md`、`alignment.md`、`assets/research.md` 和 `outputs/1-spec.md`，收敛出首版推荐方向。
- [x] 1.4 根据新增要求，把 spec 调整为“统一 core + 多端适配 + skills 工作流”的方向，并补出高层方案骨架。
- [x] 1.5 执行本轮 `align`，把“统一 core”的范围纠偏为“仅针对 md 转图文末端工具”，同步回写 spec、plan 和 tasks。
- [x] 1.6 创建 `xhs-md-renderer` 的 `core + cli + web` 多包仓库，并完成首次依赖安装与构建。
- [x] 1.7 跑通第一条实际链路：CLI 从 Markdown 产出 `manifest.json + pages.json + 多张 png`。

## 2. 待你确认

- [ ] 2.1 是否接受用统一 `core` 作为唯一业务收敛层，CLI / Web / Obsidian 都只做适配层。
- [ ] 2.2 是否接受多端推进顺序按 `core -> CLI -> Obsidian 插件 -> Web` 规划。
- [ ] 2.3 是否接受当前任务只做“md 转图文末端工具”，不展开完整 `script + skill` 创作工作流设计。
- [ ] 2.4 是否接受 v1 先只支持 Markdown / Obsidian 笔记作为输入源。
- [ ] 2.5 是否接受导出结果先按“图片 + 元信息”的最小协议设计，而不是完整发布包。

## 3. 下一步

- [ ] 3.1 在你确认 spec 方向后，继续细化 `outputs/2-plan.md`，定义末端工具的 `core` API、分页模型、渲染接口和导出协议。
- [ ] 3.2 继续评估 `note-to-red` 哪部分可直接吸收到 renderer 层，哪部分只保留为参考实现。
- [ ] 3.3 增强 `export-bundle`，明确图片之外的元信息字段和稳定命名协议。
- [ ] 3.4 为 Web 增加更完整的分页调整能力，并与 CLI 输出保持一致。
- [ ] 3.5 为未来 `script + skill` 工作流预留调用接口，但不在本轮继续展开整条工作流设计。
- [ ] 3.6 完成仓库迁移后，在新仓库上下文中继续维护 nanospec 任务产物。
