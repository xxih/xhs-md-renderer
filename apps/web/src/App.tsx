import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
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

function App(): React.ReactElement {
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
      zip.file("pages.json", JSON.stringify(pages, null, 2));

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
        <div className="hero-card compact-card">
          <p className="eyebrow">中文优先 Web 编辑器</p>
          <h1>直接编辑、预览并导出图文图片</h1>
          <p>用 {pageBreakMarker} 显式分页，左侧改配置，右侧看真实卡片效果。</p>
        </div>

        <section className="panel-section toolbar-section">
          <div className="toolbar-row">
            <button
              type="button"
              onClick={exportImageArchive}
              disabled={isExporting || isResolvingImages}
            >
              {isExporting ? "导出中..." : isResolvingImages ? "解析图片中..." : "导出图片包"}
            </button>
            <button type="button" className="secondary-button" onClick={downloadPagesJson}>
              下载 pages.json
            </button>
            <button type="button" className="secondary-button" onClick={resetEditor}>
              恢复默认
            </button>
          </div>
          {exportMessage ? <p className="status-text">{exportMessage}</p> : null}
          {isResolvingImages ? (
            <p className="status-text">正在解析图片资源，完成后再导出会更稳定。</p>
          ) : null}
        </section>

        <section className="panel-section compact-section">
          <div className="section-header">
            <div>
              <h2>Markdown 内容</h2>
              <p className="section-hint">使用 {pageBreakMarker} 开新页，标题只负责正文内容。</p>
            </div>
          </div>
          <textarea
            value={editorState.markdown}
            onChange={(event) => {
              const nextValue = event.target.value;
              startTransition(() => {
                updateState({ markdown: nextValue });
              });
            }}
          />
        </section>

        <section className="panel-section compact-section">
          <div className="section-header">
            <h2>画布与排版</h2>
          </div>
          <div className="field-grid compact-grid">
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
        </section>

        <section className="panel-section compact-section">
          <div className="section-header">
            <h2>身份信息</h2>
          </div>
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
                <button type="button" className="secondary-button" onClick={() => avatarInputRef.current?.click()}>
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
        </section>

        <section className="panel-section compact-section">
          <div className="section-header">
            <h2>非正文元素</h2>
          </div>
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
                onChange={(event) => updateProfile({ showVerifiedBadge: event.target.checked })}
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
        </section>

        <section className="panel-section compact-section">
          <div className="section-header">
            <h2>日期与页脚文案</h2>
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
        </section>
      </aside>

      <main className="preview-panel">
        <div className="preview-header">
          <div>
            <p className="eyebrow">实时预览</p>
            <h2>共生成 {pages.length} 页</h2>
          </div>
          <div className="preview-meta">
            <span>{config.width} x {config.height}</span>
            <span>{Math.round(previewScale * 100)}% 缩放</span>
            <span>{config.theme.name}</span>
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
