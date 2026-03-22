# 验收记录：GitHub / npm / CI/CD 发布链路完善

## 验收结论

结论：通过。

## 关键交付结果

- GitHub 仓库：`https://github.com/xxih/xhs-md-renderer`
- GitHub Pages：`https://xxih.github.io/xhs-md-renderer/`
- npm 包：`https://www.npmjs.com/package/xhs-md-renderer`
- 自动发布验证版本：`0.1.1`
- 最新自动发布 tag：`v0.1.1`

## Fresh evidence

### 本地验证

- `npm run verify`
  - 结果：成功
  - 说明：覆盖 typecheck、tests、build
- `npm pack --dry-run -w xhs-md-renderer --registry=https://registry.npmjs.org/`
  - 结果：成功
  - 说明：确认最终 tarball 包含 `bin/`、`dist/`、`web-dist/`

### GitHub Actions

- `CI` workflow latest success
  - run id: `23395821020`
  - 触发：`main` push (`Release 0.1.1`)
- `Deploy web demo` workflow latest success
  - run id: `23395821023`
  - 触发：`main` push (`Release 0.1.1`)
- `Publish npm package` workflow latest success
  - run id: `23395821650`
  - 触发：tag push `v0.1.1`

### 平台侧验证

- `npm view xhs-md-renderer version --registry=https://registry.npmjs.org/`
  - 返回：`0.1.1`
- GitHub Pages site 已创建为 `workflow` build type
- npm 包页已存在且 Trusted Publishing 已配置完成

## 备注

- `0.1.0` 是首次人工发布，用于突破“新包首发前无法配置 Trusted Publishing”的平台限制。
- `0.1.1` 是修正 CLI bin 入口并验证自动发布链路的首个自动化版本。
