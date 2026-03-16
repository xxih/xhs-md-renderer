import React, { useDeferredValue, useMemo, useState } from "react";
import { XhsPageCard, createRenderConfig, parseMarkdownToPages } from "@xhs-md/core";
import type { RenderConfig } from "@xhs-md/core";

const initialMarkdown = `# Build the terminal tool first

## Why this order works

The renderer is the lowest-level dependency.

- It stabilizes the export protocol
- It gives the future workflow a reliable ending
- It keeps the first milestone narrow

---

## What the first repo should support

1. One shared core
2. CLI export
3. Web preview
4. Modern stack, not legacy baggage

> Keep the workflow bigger than the first repo, but keep the first repo small enough to finish.
`;

function App(): React.ReactElement {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [themeId, setThemeId] = useState("paper");
  const [headingLevel, setHeadingLevel] = useState<2 | 3>(2);
  const [name, setName] = useState("Studio Notes");
  const [handle, setHandle] = useState("@xhs-md");
  const [footer, setFooter] = useState("Shared preview surface powered by the same core");
  const deferredMarkdown = useDeferredValue(markdown);

  const config = useMemo<RenderConfig>(
    () =>
      createRenderConfig({
        themeId,
        splitHeadingLevel: headingLevel,
        profile: {
          name,
          handle,
          footer
        }
      }),
    [footer, handle, headingLevel, name, themeId]
  );

  const parsed = useMemo(
    () =>
      parseMarkdownToPages(deferredMarkdown, {
        splitHeadingLevel: config.splitHeadingLevel,
        documentTitle: "Web Preview"
      }),
    [config.splitHeadingLevel, deferredMarkdown]
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
          <h1>Shared core first, workflow later</h1>
          <p>
            The web app previews the same page model the CLI exports. PNG generation stays in the
            Node-side core, so the rendering rules remain centralized.
          </p>
        </div>

        <section className="panel-section">
          <div className="section-header">
            <h2>Markdown</h2>
            <button type="button" onClick={downloadPagesJson}>
              Download pages.json
            </button>
          </div>
          <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
        </section>

        <section className="panel-section">
          <div className="section-header">
            <h2>Render config</h2>
          </div>

          <label>
            Theme
            <select value={themeId} onChange={(event) => setThemeId(event.target.value)}>
              <option value="paper">Paper</option>
              <option value="studio">Studio</option>
            </select>
          </label>

          <label>
            Split heading level
            <select
              value={headingLevel}
              onChange={(event) => setHeadingLevel(Number(event.target.value) as 2 | 3)}
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>

          <label>
            Profile name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label>
            Handle
            <input value={handle} onChange={(event) => setHandle(event.target.value)} />
          </label>

          <label>
            Footer
            <input value={footer} onChange={(event) => setFooter(event.target.value)} />
          </label>
        </section>
      </aside>

      <main className="preview-panel">
        <div className="preview-header">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{parsed.pages.length} pages generated</h2>
          </div>
          <p>
            The browser surface previews the exact page model. For image export, call the CLI or
            Node-side core.
          </p>
        </div>

        <div className="preview-grid">
          {parsed.pages.map((page) => (
            <div className="page-frame" key={page.id}>
              <div className="page-scale">
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
