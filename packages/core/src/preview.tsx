import React from "react";
import type { CSSProperties } from "react";
import type { PageBlock, PageModel, RenderConfig } from "./models.js";

function blockTextStyle(config: RenderConfig): CSSProperties {
  return {
    color: config.theme.textBody,
    fontFamily: config.fontFamily,
    fontSize: 34,
    lineHeight: 1.55,
    letterSpacing: "-0.02em",
    margin: 0
  };
}

function renderBlock(block: PageBlock, index: number, config: RenderConfig): React.ReactNode {
  const textStyle = blockTextStyle(config);

  if (block.type === "paragraph") {
    return <p key={index} style={{ ...textStyle }}>{block.text}</p>;
  }

  if (block.type === "quote") {
    return (
      <div
        key={index}
        style={{
          ...textStyle,
          borderLeft: `10px solid ${config.theme.accent}`,
          paddingLeft: 24,
          color: config.theme.textStrong
        }}
      >
        {block.text}
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div
        key={index}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: config.theme.codeBackground,
          borderRadius: 28,
          padding: "28px 30px",
          border: `1px solid ${config.theme.border}`
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: "#ff8e72" }} />
          <span style={{ width: 14, height: 14, borderRadius: 99, background: "#f6c85b" }} />
          <span style={{ width: 14, height: 14, borderRadius: 99, background: "#7dd39c" }} />
        </div>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            color: config.theme.textStrong,
            fontSize: 26,
            lineHeight: 1.45,
            fontFamily: "\"SFMono-Regular\", ui-monospace, monospace"
          }}
        >
          {block.text}
        </pre>
      </div>
    );
  }

  if (block.type === "list") {
    return (
      <div key={index} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {block.items.map((item, itemIndex) => (
          <div key={`${index}-${itemIndex}`} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                marginTop: 8,
                background: config.theme.accentSoft,
                color: config.theme.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: config.fontFamily,
                fontSize: 20,
                fontWeight: 700
              }}
            >
              {block.ordered ? itemIndex + 1 : "•"}
            </div>
            <p style={{ ...textStyle, flex: 1 }}>{item}</p>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div
        key={index}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderRadius: 28,
          padding: 24,
          border: `1px dashed ${config.theme.border}`,
          background: "rgba(255,255,255,0.5)"
        }}
      >
        <div
          style={{
            height: 220,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${config.theme.accentSoft}, ${config.theme.cardBackground})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: config.theme.accent,
            fontFamily: config.fontFamily,
            fontWeight: 700,
            fontSize: 28
          }}
        >
          Image Placeholder
        </div>
        <p style={{ ...textStyle, fontSize: 26, color: config.theme.textMuted }}>
          {block.alt || block.url}
        </p>
      </div>
    );
  }

  return (
    <h3
      key={index}
      style={{
        margin: 0,
        color: config.theme.textStrong,
        fontFamily: config.fontFamily,
        fontSize: 40,
        fontWeight: 700,
        letterSpacing: "-0.04em"
      }}
    >
      {block.text}
    </h3>
  );
}

export function XhsPageCard(props: { page: PageModel; config: RenderConfig }): React.ReactElement {
  const { config, page } = props;

  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        display: "flex",
        padding: 52,
        background: config.theme.background,
        boxSizing: "border-box",
        position: "relative"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: 52,
          border: `1px solid ${config.theme.border}`,
          opacity: 0.75
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 30,
          padding: "42px 40px 40px",
          borderRadius: 46,
          background: config.theme.cardBackground,
          boxShadow: "0 28px 80px rgba(62, 39, 21, 0.08)",
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: config.theme.accentSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: config.theme.accent,
                fontFamily: config.fontFamily,
                fontSize: 28,
                fontWeight: 800
              }}
            >
              {config.profile.name.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: config.theme.textStrong,
                  fontFamily: config.fontFamily,
                  fontSize: 28,
                  fontWeight: 700
                }}
              >
                {config.profile.name}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: config.theme.textMuted,
                  fontFamily: config.fontFamily,
                  fontSize: 22
                }}
              >
                {config.profile.handle}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              borderRadius: 999,
              background: config.theme.accentSoft,
              color: config.theme.accent,
              fontFamily: config.fontFamily,
              fontSize: 22,
              fontWeight: 700
            }}
          >
            Page {page.index + 1}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: config.theme.accent,
              fontFamily: config.fontFamily,
              fontSize: 20,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.18em"
            }}
          >
            {page.sectionTitle}
          </div>
          <h1
            style={{
              margin: 0,
              color: config.theme.textStrong,
              fontFamily: config.fontFamily,
              fontSize: 62,
              lineHeight: 1.08,
              letterSpacing: "-0.05em"
            }}
          >
            {page.title}
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>
          {page.blocks.map((block, index) => renderBlock(block, index, config))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 22,
            borderTop: `1px solid ${config.theme.border}`,
            color: config.theme.textMuted,
            fontFamily: config.fontFamily,
            fontSize: 22
          }}
        >
          <span>{config.profile.footer}</span>
          <span>{page.blocks.length} blocks</span>
        </div>
      </div>
    </div>
  );
}
