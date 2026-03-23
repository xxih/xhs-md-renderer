import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { toBlob } from "html-to-image";
import JSZip from "jszip";
import {
  FONT_FAMILY_OPTIONS,
  THEMES,
  XhsPageCard,
  createRenderConfig,
  markPageImagesPending,
  parseMarkdownToPages,
  resolvePageImagesInBrowser
} from "@xhs-md/core";
import type { PageModel, RenderConfig } from "@xhs-md/core";

type BrowserRenderPayload = {
  sourceTitle: string;
  pages: PageModel[];
  config: RenderConfig;
};

declare global {
  interface Window {
    __XHS_RENDER_PAYLOAD__?: BrowserRenderPayload;
    __XHS_RENDER_STATUS__?: {
      ready: boolean;
      pageCount: number;
      sourceTitle: string;
    };
  }
}

type EditorState = {
  markdown: string;
  themeId: string;
  fontFamily: string;
  fontSize: number;
  profile: RenderConfig["profile"];
};

type EditorStateUpdate = Omit<Partial<EditorState>, "profile"> & {
  profile?: Partial<RenderConfig["profile"]>;
};

const editorStorageKey = "xhs-md:web-editor-state";
const pageBreakMarker = "<!-- xhs-page -->";
const initialConfig = createRenderConfig();
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

function createDefaultEditorState(): EditorState {
  const config = createRenderConfig();

  return {
    markdown: initialMarkdown,
    themeId: config.theme.id,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    profile: {
      ...config.profile
    }
  };
}

function readStoredEditorState(): EditorState {
  const defaults = createDefaultEditorState();

  if (typeof window === "undefined") {
    return defaults;
  }

  const raw = window.localStorage.getItem(editorStorageKey);

  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EditorState>;
    return {
      ...defaults,
      ...parsed,
      profile: {
        ...defaults.profile,
        ...parsed.profile
      }
    };
  } catch {
    return defaults;
  }
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isRenderMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("mode") === "render";
}

function RenderModeApp(): React.ReactElement {
  const payload = useMemo<BrowserRenderPayload | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.__XHS_RENDER_PAYLOAD__ ?? null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !payload) {
      return;
    }

    window.__XHS_RENDER_STATUS__ = {
      ready: true,
      pageCount: payload.pages.length,
      sourceTitle: payload.sourceTitle
    };
  }, [payload]);

  if (!payload) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f1eb",
          color: "#34261d",
          fontFamily: "'Avenir Next', 'PingFang SC', sans-serif"
        }}
      >
        缺少渲染 payload
      </main>
    );
  }

  return (
    <main
      data-render-ready="true"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        padding: 24,
        boxSizing: "border-box",
        background: "#ebe5da"
      }}
    >
      {payload.pages.map((page) => (
        <div
          key={page.id}
          data-export-page={page.id}
          data-export-index={page.index}
          style={{
            width: payload.config.width,
            height: payload.config.height
          }}
        >
          <XhsPageCard page={page} config={payload.config} />
        </div>
      ))}
    </main>
  );
}

function App(): React.ReactElement {
  if (isRenderMode()) {
    return <RenderModeApp />;
  }

  const [editorState, setEditorState] = useState<EditorState>(() => readStoredEditorState());
  const [isExporting, setIsExporting] = useState(false);
  const [isResolvingImages, setIsResolvingImages] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const deferredMarkdown = useDeferredValue(editorState.markdown);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    window.localStorage.setItem(editorStorageKey, JSON.stringify(editorState));
  }, [editorState]);

  const config = useMemo<RenderConfig>(
    () =>
      createRenderConfig({
        themeId: editorState.themeId,
        fontFamily: editorState.fontFamily,
        fontSize: editorState.fontSize,
        profile: editorState.profile
      }),
    [editorState]
  );

  const parsed = useMemo(
    () =>
      parseMarkdownToPages(deferredMarkdown, {
        documentTitle: "Web Preview"
      }),
    [deferredMarkdown]
  );
  const [pages, setPages] = useState<PageModel[]>(() => markPageImagesPending(parsed.pages));

  useEffect(() => {
    const pendingPages = markPageImagesPending(parsed.pages);
    setPages(pendingPages);

    let cancelled = false;
    setIsResolvingImages(true);

    void resolvePageImagesInBrowser(parsed.pages)
      .then((resolvedPages: PageModel[]) => {
        if (!cancelled) {
          setPages(resolvedPages);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPages(pendingPages);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingImages(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [parsed.pages]);

  const previewScale = useMemo(() => Math.min(0.22, 400 / config.width), [config.width]);
  const canvasStyle = useMemo(
    () =>
      ({
        "--page-width": `${config.width}px`,
        "--page-height": `${config.height}px`,
        "--preview-scale": String(previewScale),
        "--scaled-page-width": `${Math.round(config.width * previewScale)}px`,
        "--scaled-page-height": `${Math.round(config.height * previewScale)}px`
      }) as CSSProperties,
    [config.height, config.width, previewScale]
  );

  const updateState = (nextState: EditorStateUpdate): void => {
    setEditorState((current) => ({
      ...current,
      ...nextState,
      profile: {
        ...current.profile,
        ...(nextState.profile ?? {})
      }
    }));
  };

  const updateProfile = (nextProfile: Partial<RenderConfig["profile"]>): void => {
    updateState({
      profile: nextProfile
    });
  };

  const downloadPagesJson = (): void => {
    const blob = new Blob([JSON.stringify(pages, null, 2)], {
      type: "application/json"
    });
    downloadBlob("pages.json", blob);
  };

  const exportImageArchive = async (): Promise<void> => {
    try {
      setIsExporting(true);
      setExportMessage("");

      const zip = new JSZip();
      const pagesFolder = zip.folder("pages");

      if (!pagesFolder) {
        throw new Error("无法创建导出目录。");
      }

      const manifest = {
        version: 1,
        generatedAt: new Date().toISOString(),
        sourceTitle: parsed.source.title,
        renderConfig: {
          width: config.width,
          height: config.height,
          fontFamily: config.fontFamily,
          fontSize: config.fontSize,
          profile: config.profile,
          themeId: config.theme.id
        },
        pages: pages.map((page) => ({
          id: page.id,
          index: page.index,
          title: page.title,
          sectionTitle: page.sectionTitle,
          fileName: `page-${String(page.index + 1).padStart(2, "0")}.png`
        }))
      };

      for (const page of pages) {
        const node = pageRefs.current[page.id];

        if (!node) {
          throw new Error(`未找到第 ${page.index + 1} 页的导出节点。`);
        }

        const blob = await toBlob(node, {
          cacheBust: true,
          pixelRatio: 1,
          width: config.width,
          height: config.height,
          canvasWidth: config.width,
          canvasHeight: config.height
        });

        if (!blob) {
          throw new Error(`第 ${page.index + 1} 页导出失败。`);
        }

        pagesFolder.file(`page-${String(page.index + 1).padStart(2, "0")}.png`, blob);
      }

      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(`xhs-pages-${Date.now()}.zip`, zipBlob);
      setExportMessage(`已导出 ${pages.length} 张图片。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "导出失败。";
      setExportMessage(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({
        avatarSrc: typeof reader.result === "string" ? reader.result : ""
      });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const resetEditor = (): void => {
    window.localStorage.removeItem(editorStorageKey);
    setExportMessage("");
    setEditorState(createDefaultEditorState());
  };

  return (
    <div className="app-shell">
      <aside className="control-panel">
        <section className="panel-section composer-shell">
          <div className="composer-header">
            <div className="header-copy">
              <p className="eyebrow">Web 图片编辑器</p>
              <h1>先写正文，再导出图片</h1>
              <p className="section-hint">
                Markdown 是主工作区。低频配置和调试能力收进下方折叠面板。
              </p>
            </div>
            <div className="toolbar-row primary-actions">
              <button
                type="button"
                onClick={exportImageArchive}
                disabled={isExporting || isResolvingImages}
              >
                {isExporting ? "导出中..." : isResolvingImages ? "解析图片中..." : "导出图片包"}
              </button>
              <button type="button" className="secondary-button" onClick={resetEditor}>
                恢复默认
              </button>
            </div>
          </div>

          {exportMessage ? <p className="status-text">{exportMessage}</p> : null}
          {!exportMessage && isResolvingImages ? (
            <p className="status-text">正在解析图片资源，完成后导出会更稳定。</p>
          ) : null}

          <div className="editor-card">
            <div className="section-header">
              <div>
                <h2>Markdown 正文</h2>
                <p className="section-hint">标题仍然是正文内容；用分页标记显式开新页。</p>
              </div>
              <div className="editor-meta">
                <span>{pages.length} 页</span>
                <span>{config.theme.name}</span>
              </div>
            </div>
            <textarea
              className="markdown-editor"
              spellCheck={false}
              value={editorState.markdown}
              onChange={(event) => updateState({ markdown: event.target.value })}
            />
            <div className="editor-footer">
              <span>分页标记</span>
              <code>{pageBreakMarker}</code>
            </div>
          </div>

          <section className="panel-section settings-shell">
            <div className="section-header">
              <div>
                <h2>按需微调</h2>
                <p className="section-hint">常规写作先完成，样式和调试设置再按需展开。</p>
              </div>
            </div>

            <details className="settings-group">
              <summary>画布与排版</summary>
              <div className="settings-body field-grid compact-grid">
                <label>
                  主题
                  <select
                    value={editorState.themeId}
                    onChange={(event) => updateState({ themeId: event.target.value })}
                  >
                    {Object.values(THEMES).map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  字体
                  <select
                    value={editorState.fontFamily}
                    onChange={(event) => updateState({ fontFamily: event.target.value })}
                  >
                    {FONT_FAMILY_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  字号
                  <input
                    type="number"
                    min={12}
                    max={24}
                    value={editorState.fontSize}
                    onChange={(event) =>
                      updateState({
                        fontSize: Number(event.target.value) || createDefaultEditorState().fontSize
                      })
                    }
                  />
                </label>
              </div>
            </details>

            <details className="settings-group" open>
              <summary>身份信息</summary>
              <div className="settings-body">
                <div className="field-grid compact-grid">
                  <label>
                    名称
                    <input
                      value={editorState.profile.name}
                      onChange={(event) => updateProfile({ name: event.target.value })}
                    />
                  </label>

                  <label>
                    账号
                    <input
                      value={editorState.profile.handle}
                      onChange={(event) => updateProfile({ handle: event.target.value })}
                    />
                  </label>
                </div>

                <div className="avatar-row">
                  <div className="avatar-preview">
                    {editorState.profile.avatarSrc ? (
                      <img src={editorState.profile.avatarSrc} alt="头像预览" />
                    ) : (
                      <span>{(editorState.profile.name.slice(0, 1) || "图").toUpperCase()}</span>
                    )}
                  </div>
                  <div className="avatar-actions">
                    <div className="toolbar-row compact-buttons">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        上传头像
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => updateProfile({ avatarSrc: "" })}
                      >
                        清空头像
                      </button>
                    </div>
                    <p className="section-hint">头像会保存在当前浏览器中，刷新后仍会恢复。</p>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden-input"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
            </details>

            <details className="settings-group">
              <summary>页面元素</summary>
              <div className="settings-body">
                <div className="toggle-grid">
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={editorState.profile.showAvatar}
                      onChange={(event) => updateProfile({ showAvatar: event.target.checked })}
                    />
                    <span>头像</span>
                  </label>
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={editorState.profile.showVerifiedBadge}
                      onChange={(event) =>
                        updateProfile({ showVerifiedBadge: event.target.checked })
                      }
                    />
                    <span>认证标志</span>
                  </label>
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={editorState.profile.showName}
                      onChange={(event) => updateProfile({ showName: event.target.checked })}
                    />
                    <span>名称</span>
                  </label>
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={editorState.profile.showHandle}
                      onChange={(event) => updateProfile({ showHandle: event.target.checked })}
                    />
                    <span>账号</span>
                  </label>
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={editorState.profile.showDate}
                      onChange={(event) => updateProfile({ showDate: event.target.checked })}
                    />
                    <span>日期</span>
                  </label>
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={editorState.profile.showFooter}
                      onChange={(event) => updateProfile({ showFooter: event.target.checked })}
                    />
                    <span>页脚</span>
                  </label>
                </div>

                <div className="field-grid compact-grid">
                  <label className="field-span">
                    日期文案
                    <input
                      value={editorState.profile.dateText}
                      disabled={!editorState.profile.showDate}
                      onChange={(event) => updateProfile({ dateText: event.target.value })}
                    />
                  </label>

                  <label>
                    页脚左文案
                    <input
                      value={editorState.profile.footerLeft}
                      disabled={!editorState.profile.showFooter}
                      onChange={(event) => updateProfile({ footerLeft: event.target.value })}
                    />
                  </label>

                  <label>
                    页脚右文案
                    <input
                      value={editorState.profile.footerRight}
                      disabled={!editorState.profile.showFooter}
                      onChange={(event) => updateProfile({ footerRight: event.target.value })}
                    />
                  </label>
                </div>
              </div>
            </details>

            <details className="settings-group subtle-group">
              <summary>高级操作</summary>
              <div className="settings-body">
                <p className="section-hint">
                  `pages.json` 仅供调试或二次处理使用，不属于普通图片导出路径。
                </p>
                <div className="toolbar-row compact-buttons">
                  <button type="button" className="secondary-button" onClick={downloadPagesJson}>
                    下载 pages.json
                  </button>
                </div>
              </div>
            </details>
          </section>
        </section>
      </aside>

      <main className="preview-panel">
        <div className="preview-header">
          <div>
            <p className="eyebrow">导出预览</p>
            <h2>{pages.length} 页图片结果</h2>
            <p>右侧始终显示当前导出的实际卡片效果。</p>
          </div>
          <div className="preview-meta">
            <span>{config.theme.name}</span>
            <span>{config.width} x {config.height}</span>
            <span>{Math.round(previewScale * 100)}% 缩放</span>
          </div>
        </div>

        <div className="preview-grid">
          {pages.map((page) => (
            <div className="page-frame" key={page.id} style={canvasStyle}>
              <div className="page-stage">
                <div className="page-scale">
                  <div
                    className="page-capture"
                    ref={(node) => {
                      pageRefs.current[page.id] = node;
                    }}
                  >
                    <XhsPageCard page={page} config={config} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export { App };
