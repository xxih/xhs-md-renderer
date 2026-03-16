import { toString } from "mdast-util-to-string";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import type { Heading, Image, ListItem, Nodes, Paragraph, Parent, Root } from "mdast";
import type { PageBlock, PageModel, ParseOptions, SourceDocument } from "./models.js";

export const PAGE_BREAK_MARKER = "<!-- xhs-page -->";
const PAGE_BREAK_PATTERN = /^<!--\s*xhs-page\s*-->$/i;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDocument(markdown: string, options: ParseOptions): SourceDocument {
  const title = options.documentTitle?.trim() || "Untitled Note";

  return {
    id: slugify(title) || "untitled-note",
    title,
    markdown
  };
}

function createPage(index: number, fallbackTitle: string): PageModel {
  const safeTitle = fallbackTitle.trim() || `Page ${index + 1}`;
  return {
    id: `${index + 1}-${slugify(safeTitle) || "page"}`,
    index,
    title: safeTitle,
    sectionTitle: safeTitle,
    blocks: []
  };
}

function collectListItemText(item: ListItem): string {
  return item.children.map((child) => toString(child)).join(" ").trim();
}

function paragraphHasOnlyImage(node: Paragraph): node is Paragraph & { children: [Image] } {
  return node.children.length === 1 && node.children[0]?.type === "image";
}

function defaultPageTitle(sourceTitle: string, index: number): string {
  return index === 0 ? sourceTitle : `Page ${index + 1}`;
}

function isFallbackPageTitle(page: PageModel, sourceTitle: string): boolean {
  return page.title === defaultPageTitle(sourceTitle, page.index);
}

function isPageBreakNode(node: Nodes): boolean {
  return node.type === "html" && PAGE_BREAK_PATTERN.test(node.value.trim());
}

function blockFromNode(node: Nodes): PageBlock | null {
  switch (node.type) {
    case "paragraph": {
      if (paragraphHasOnlyImage(node)) {
        const image = node.children[0];
        return {
          type: "image",
          alt: image.alt || "Image",
          url: image.url
        };
      }

      const text = toString(node).trim();
      return text ? { type: "paragraph", text } : null;
    }
    case "blockquote": {
      const text = toString(node).trim();
      return text ? { type: "quote", text } : null;
    }
    case "code":
      return blockFromCodeNode(node.value.trim(), node.lang || undefined);
    case "list":
      return {
        type: "list",
        ordered: Boolean(node.ordered),
        items: node.children.map(collectListItemText).filter(Boolean)
      };
    case "thematicBreak":
      return {
        type: "divider"
      };
    case "heading": {
      const text = toString(node).trim();
      return text ? { type: "subheading", text } : null;
    }
    case "image":
      return {
        type: "image",
        alt: node.alt || "Image",
        url: node.url
      };
    default: {
      const text = "children" in node ? toString(node as Parent).trim() : "";
      return text ? { type: "paragraph", text } : null;
    }
  }
}

function blockFromCodeNode(text: string, language?: string): PageBlock | null {
  if (!text) {
    return null;
  }

  return language
    ? {
        type: "code",
        text,
        language
      }
    : {
        type: "code",
        text
      };
}

function pushPageIfUseful(pages: PageModel[], page: PageModel | null): void {
  if (!page) {
    return;
  }

  if (page.blocks.length === 0 && page.title === `Page ${page.index + 1}`) {
    return;
  }

  pages.push(page);
}

export function parseMarkdownToPages(markdown: string, options: ParseOptions = {}): {
  source: SourceDocument;
  pages: PageModel[];
} {
  const source = createDocument(markdown, options);
  const root = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const pages: PageModel[] = [];

  let currentPage: PageModel | null = null;

  const openPage = (): void => {
    pushPageIfUseful(pages, currentPage);
    currentPage = createPage(pages.length, defaultPageTitle(source.title, pages.length));
  };

  const ensurePage = (): PageModel => {
    if (!currentPage) {
      currentPage = createPage(pages.length, defaultPageTitle(source.title, pages.length));
    }

    return currentPage!;
  };

  for (const node of root.children) {
    if (isPageBreakNode(node)) {
      if (currentPage) {
        openPage();
      }
      continue;
    }

    const page = ensurePage();

    if (node.type === "heading") {
      const text = toString(node as Heading).trim();

      if (text && page.blocks.length === 0 && isFallbackPageTitle(page, source.title)) {
        page.title = text;
        page.sectionTitle = text;
        continue;
      }
    }

    const block = blockFromNode(node);

    if (block) {
      page.blocks.push(block);
    }
  }

  pushPageIfUseful(pages, currentPage);

  if (pages.length === 0) {
    pages.push(createPage(0, source.title));
  }

  return { source, pages };
}
