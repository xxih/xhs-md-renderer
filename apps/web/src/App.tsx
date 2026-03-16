import React, { startTransition, useDeferredValue, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  FONT_FAMILY_OPTIONS,
  THEMES,
  XhsPageCard,
  createRenderConfig,
  parseMarkdownToPages
} from "@xhs-md/core";
import type { RenderConfig } from "@xhs-md/core";

const initialConfig = createRenderConfig();
const pageBreakMarker = "<!-- xhs-page -->";
const initialMarkdown = `# 小明的周末复盘

把拆页预览和导出链路先打通以后，后面的调整就顺很多。

- 页面结构更稳定了
- 配置项收口到同一份 render config
- Web 预览和导出结果更容易保持一致

<!-- xhs-page -->

# 下周继续补什么

- 把默认 mock 文案再收干净一点
- 继续打磨预览页的交互细节
- 给导出链路补一轮更扎实的验证

> 先把基础体验做顺，再继续往上叠功能。
`;

function App(): React.ReactElement {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [themeId, setThemeId] = useState(initialConfig.theme.id);
  const [fontFamily, setFontFamily] = useState(initialConfig.fontFamily);
  const [fontSize, setFontSize] = useState(initialConfig.fontSize);
  const [name, setName] = useState(initialConfig.profile.name);
  const [handle, setHandle] = useState(initialConfig.profile.handle);
  const [showDate, setShowDate] = useState(initialConfig.profile.showDate);
  const [dateText, setDateText] = useState(initialConfig.profile.dateText);
  const [showFooter, setShowFooter] = useState(initialConfig.profile.showFooter);
  const [footerLeft, setFooterLeft] = useState(initialConfig.profile.footerLeft);
  const [footerRight, setFooterRight] = useState(initialConfig.profile.footerRight);
  const deferredMarkdown = useDeferredValue(markdown);

  const config = useMemo<RenderConfig>(
    () =>
      createRenderConfig({
        themeId,
        fontFamily,
        fontSize,
        profile: {
          name,
          handle,
          showDate,
          dateText,
          showFooter,
          footerLeft,
          footerRight
        }
      }),
    [
      dateText,
      fontFamily,
      fontSize,
      footerLeft,
      footerRight,
      handle,
      name,
      showDate,
      showFooter,
      themeId
    ]
  );

  const parsed = useMemo(
    () =>
      parseMarkdownToPages(deferredMarkdown, {
        documentTitle: "Web Preview"
      }),
    [deferredMarkdown]
  );

  const previewScale = useMemo(() => Math.min(0.22, 380 / config.width), [config.width]);
  const canvasStyle = useMemo(
    () =>
      ({
        "--page-width": `${config.width}px`,
        "--page-height": `${config.height}px`,
        "--preview-scale": String(previewScale)
      }) as CSSProperties,
    [config.height, config.width, previewScale]
  );

  const downloadPagesJson = (): void => {
    const blob = new Blob([JSON.stringify(parsed.pages, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pages.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <aside className="control-panel">
        <div className="hero-card">
          <p className="eyebrow">xhs-md-renderer</p>
          <h1>1800 x 2400 first, workflow later</h1>
          <p>
            The preview stage now follows the same canvas size the exporter uses, so the browser is
            no longer faking an older 1080 x 1440 surface.
          </p>
        </div>

        <section className="panel-section">
          <div className="section-header">
            <div>
              <h2>Markdown</h2>
              <p className="section-hint">Use {pageBreakMarker} to start a new page.</p>
            </div>
            <button type="button" onClick={downloadPagesJson}>
              Download pages.json
            </button>
          </div>
          <textarea
            value={markdown}
            onChange={(event) => {
              const nextValue = event.target.value;
              startTransition(() => {
                setMarkdown(nextValue);
              });
            }}
          />
        </section>

        <section className="panel-section">
          <div className="section-header">
            <h2>Theme and type</h2>
          </div>

          <div className="field-grid">
            <label>
              Theme
              <select value={themeId} onChange={(event) => setThemeId(event.target.value)}>
                {Object.values(THEMES).map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Font family
              <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}>
                {FONT_FAMILY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Font size
              <input
                type="number"
                min={12}
                max={24}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value) || initialConfig.fontSize)}
              />
            </label>
          </div>
        </section>

        <section className="panel-section">
          <div className="section-header">
            <h2>Identity</h2>
          </div>

          <div className="field-grid">
            <label>
              Profile name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>

            <label>
              Handle
              <input value={handle} onChange={(event) => setHandle(event.target.value)} />
            </label>
          </div>
        </section>

        <section className="panel-section">
          <div className="section-header">
            <h2>Date and footer</h2>
          </div>

          <div className="toggle-row">
            <label className="toggle-field">
              <input
                type="checkbox"
                checked={showDate}
                onChange={(event) => setShowDate(event.target.checked)}
              />
              <span>Show date</span>
            </label>

            <label className="toggle-field">
              <input
                type="checkbox"
                checked={showFooter}
                onChange={(event) => setShowFooter(event.target.checked)}
              />
              <span>Show footer</span>
            </label>
          </div>

          <div className="field-grid">
            <label className="field-span">
              Date text
              <input
                value={dateText}
                disabled={!showDate}
                onChange={(event) => setDateText(event.target.value)}
              />
            </label>

            <label>
              Footer left
              <input
                value={footerLeft}
                disabled={!showFooter}
                onChange={(event) => setFooterLeft(event.target.value)}
              />
            </label>

            <label>
              Footer right
              <input
                value={footerRight}
                disabled={!showFooter}
                onChange={(event) => setFooterRight(event.target.value)}
              />
            </label>
          </div>
        </section>
      </aside>

      <main className="preview-panel">
        <div className="preview-header">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{parsed.pages.length} pages generated</h2>
          </div>
          <div className="preview-meta">
            <span>{config.width} x {config.height}</span>
            <span>{Math.round(previewScale * 100)}% scale</span>
            <span>{config.theme.name}</span>
          </div>
        </div>

        <div className="preview-grid">
          {parsed.pages.map((page) => (
            <div className="page-frame" key={page.id}>
              <div className="page-scale" style={canvasStyle}>
                <XhsPageCard page={page} config={config} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export { App };
