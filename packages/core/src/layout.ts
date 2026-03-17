import type {
  LayoutReport,
  PageBlock,
  PageLayoutFeedback,
  PageLayoutStatus,
  PageModel,
  RenderConfig
} from "./models.js";
import {
  DEFAULT_IMAGE_HEIGHT,
  MAX_IMAGE_HEIGHT,
  MIN_IMAGE_HEIGHT,
  getImageDisplayHeight
} from "./image.js";

export const CARD_PADDING_Y = 32;
export const CARD_PADDING_X = 20;
export const HEADER_INSET_X = 12;
export const HEADER_PADDING_Y = 10;
export const HEADER_GAP = 16;
export const BODY_INSET_X = 13;
export const BODY_BLOCK_GAP = 18;
export const TITLE_FONT_SIZE = 24;
export const TITLE_LINE_HEIGHT = 1.5;
export const SUBHEADING_LINE_HEIGHT = 1.4;
export const BODY_LINE_HEIGHT = 1.8;
export const NAME_FONT_SIZE = 16;
export const HANDLE_FONT_SIZE = 14;
export const FOOTER_FONT_SIZE = 13;
export const FOOTER_PADDING = 16;

const ASCII_UNIT_WIDTH = 0.56;
const CJK_UNIT_WIDTH = 1;
const SPACE_UNIT_WIDTH = 0.34;
const MONO_UNIT_WIDTH = 0.62;

export function noteScale(config: RenderConfig): number {
  return config.width / 450;
}

export function notePx(config: RenderConfig, value: number): number {
  return Math.round(value * noteScale(config));
}

export function contentPx(config: RenderConfig, value: number): number {
  return Math.round(value * noteScale(config) * (config.fontSize / 16));
}

function roundPx(value: number): number {
  return Math.round(value);
}

function visualUnits(text: string): number {
  let total = 0;

  for (const char of text) {
    if (/\s/.test(char)) {
      total += SPACE_UNIT_WIDTH;
      continue;
    }

    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(char)) {
      total += CJK_UNIT_WIDTH;
      continue;
    }

    total += ASCII_UNIT_WIDTH;
  }

  return total;
}

function estimateWrappedLines(
  text: string,
  availableWidth: number,
  fontSize: number,
  unitWidth: number
): number {
  if (!text.trim()) {
    return 1;
  }

  const unitsPerLine = Math.max(1, availableWidth / Math.max(1, fontSize * unitWidth));
  return Math.max(1, Math.ceil(visualUnits(text) / unitsPerLine));
}

function estimateTextHeight(
  text: string,
  availableWidth: number,
  fontSize: number,
  lineHeight: number,
  unitWidth: number = CJK_UNIT_WIDTH
): number {
  const lineCount = estimateWrappedLines(text, availableWidth, fontSize, unitWidth);
  return lineCount * fontSize * lineHeight;
}

function headerContentHeight(config: RenderConfig): number {
  const avatarHeight = config.profile.showAvatar ? notePx(config, 42) : 0;
  const nameHeight = config.profile.showName ? notePx(config, NAME_FONT_SIZE) * 1.25 : 0;
  const handleHeight = config.profile.showHandle ? notePx(config, HANDLE_FONT_SIZE) * 1.25 : 0;
  const nameStackGap = nameHeight > 0 && handleHeight > 0 ? notePx(config, 1) : 0;
  const leftHeight = Math.max(avatarHeight, nameHeight + handleHeight + nameStackGap);
  const rightHeight = config.profile.showDate ? notePx(config, FOOTER_FONT_SIZE) * 1.25 : 0;

  return Math.max(leftHeight, rightHeight);
}

function showHeader(config: RenderConfig): boolean {
  return (
    config.profile.showAvatar ||
    config.profile.showName ||
    config.profile.showHandle ||
    config.profile.showDate
  );
}

function footerHeight(config: RenderConfig): number {
  if (!config.profile.showFooter) {
    return 0;
  }

  return notePx(config, FOOTER_PADDING) * 2 + notePx(config, FOOTER_FONT_SIZE) * 1.35 + 1;
}

export function bodyContentWidth(config: RenderConfig): number {
  return (
    config.width - notePx(config, CARD_PADDING_X) * 2 - notePx(config, BODY_INSET_X) * 2
  );
}

function contentAreaHeight(config: RenderConfig): number {
  const cardHeight = config.height - notePx(config, CARD_PADDING_Y) * 2;
  const headerHeight = showHeader(config)
    ? headerContentHeight(config) + notePx(config, HEADER_PADDING_Y) * 2
    : 0;

  return cardHeight - headerHeight - footerHeight(config);
}

function estimateCodeHeight(text: string, width: number, config: RenderConfig): number {
  const fontSize = contentPx(config, 14);
  const lines = text.split(/\r?\n/);
  const wrappedLines = lines.reduce(
    (sum, line) => sum + estimateWrappedLines(line, width, fontSize, MONO_UNIT_WIDTH),
    0
  );

  return (
    notePx(config, 16) * 2 +
    notePx(config, 14) +
    notePx(config, 10) +
    wrappedLines * fontSize * 1.6
  );
}

function estimateListHeight(
  block: Extract<PageBlock, { type: "list" }>,
  width: number,
  config: RenderConfig
): number {
  const markerWidth = block.ordered ? contentPx(config, 16) : notePx(config, 12);
  const itemGap = notePx(config, 10);
  const textWidth = Math.max(80, width - markerWidth - itemGap);
  const fontSize = contentPx(config, 16);
  const itemsHeight = block.items.reduce(
    (sum, item) => sum + estimateTextHeight(item, textWidth, fontSize, BODY_LINE_HEIGHT),
    0
  );

  return itemsHeight + itemGap * Math.max(0, block.items.length - 1);
}

function resolveDefaultImageDisplayHeight(
  block: Extract<PageBlock, { type: "image" }>,
  width: number,
  config: RenderConfig
): number {
  return getImageDisplayHeight({
    image: block,
    contentWidth: width,
    minHeight: notePx(config, MIN_IMAGE_HEIGHT),
    maxHeight: notePx(config, MAX_IMAGE_HEIGHT),
    fallbackHeight: notePx(config, DEFAULT_IMAGE_HEIGHT)
  });
}

function estimateImageBlockHeight(
  block: Extract<PageBlock, { type: "image" }>,
  width: number,
  config: RenderConfig,
  imageDisplayHeight: number
): number {
  const baseHeight = notePx(config, 12) * 2 + imageDisplayHeight;

  if (block.status === "failed") {
    return (
      baseHeight +
      notePx(config, 10) +
      estimateTextHeight(
        block.errorMessage || block.alt || block.url,
        width,
        contentPx(config, 13),
        BODY_LINE_HEIGHT
      )
    );
  }

  return baseHeight;
}

function estimateBlockHeight(
  block: PageBlock,
  width: number,
  config: RenderConfig,
  imageDisplayHeight?: number
): number {
  if (block.type === "paragraph" || block.type === "quote") {
    return estimateTextHeight(block.text, width, contentPx(config, 16), BODY_LINE_HEIGHT);
  }

  if (block.type === "subheading") {
    return estimateTextHeight(
      block.text,
      width,
      contentPx(config, 20),
      SUBHEADING_LINE_HEIGHT
    );
  }

  if (block.type === "code") {
    return estimateCodeHeight(block.text, width - notePx(config, 38), config);
  }

  if (block.type === "list") {
    return estimateListHeight(block, width, config);
  }

  if (block.type === "image") {
    return estimateImageBlockHeight(
      block,
      width,
      config,
      imageDisplayHeight ?? resolveDefaultImageDisplayHeight(block, width, config)
    );
  }

  return 1;
}

function pageBlockGapTotal(blockCount: number, config: RenderConfig): number {
  return blockCount > 1 ? notePx(config, BODY_BLOCK_GAP) * (blockCount - 1) : 0;
}

function pageTitleHeight(page: PageModel, width: number, config: RenderConfig): number {
  return estimateTextHeight(
    page.title,
    width,
    contentPx(config, TITLE_FONT_SIZE),
    TITLE_LINE_HEIGHT
  );
}

function blockHeightBudget(page: PageModel, config: RenderConfig, width: number): number {
  return (
    contentAreaHeight(config) -
    pageTitleHeight(page, width, config) -
    (page.blocks.length > 0 ? notePx(config, BODY_BLOCK_GAP) : 0) -
    pageBlockGapTotal(page.blocks.length, config) -
    config.layout.bodyBottomPadding
  );
}

export function getPageImageDisplayHeights(
  page: PageModel,
  config: RenderConfig
): Map<number, number> {
  const width = bodyContentWidth(config);
  const imageHeights = new Map<number, number>();
  const imageCapacities: Array<{ index: number; capacity: number }> = [];
  let fixedBlockHeights = 0;

  for (const [index, block] of page.blocks.entries()) {
    if (block.type !== "image") {
      fixedBlockHeights += estimateBlockHeight(block, width, config);
      continue;
    }

    const displayHeight = resolveDefaultImageDisplayHeight(block, width, config);
    const minDisplayHeight = notePx(config, MIN_IMAGE_HEIGHT);
    imageHeights.set(index, displayHeight);
    fixedBlockHeights += estimateImageBlockHeight(block, width, config, displayHeight);
    imageCapacities.push({
      index,
      capacity: Math.max(0, displayHeight - minDisplayHeight)
    });
  }

  const shortage = Math.max(0, fixedBlockHeights - blockHeightBudget(page, config, width));

  if (shortage === 0 || imageCapacities.length === 0) {
    return imageHeights;
  }

  const totalCapacity = imageCapacities.reduce((sum, item) => sum + item.capacity, 0);

  if (totalCapacity === 0) {
    return imageHeights;
  }

  let remainingShortage = shortage;
  let remainingCapacity = totalCapacity;

  for (const item of imageCapacities) {
    if (remainingShortage <= 0 || item.capacity <= 0) {
      continue;
    }

    const proportionalReduction = Math.round((remainingShortage * item.capacity) / remainingCapacity);
    const reduction = Math.min(item.capacity, Math.max(0, proportionalReduction));

    if (reduction <= 0) {
      continue;
    }

    imageHeights.set(item.index, (imageHeights.get(item.index) ?? 0) - reduction);
    remainingShortage -= reduction;
    remainingCapacity -= item.capacity;
  }

  if (remainingShortage > 0) {
    for (const item of imageCapacities) {
      if (remainingShortage <= 0) {
        break;
      }

      const currentHeight = imageHeights.get(item.index);

      if (currentHeight === undefined) {
        continue;
      }

      const minDisplayHeight = notePx(config, MIN_IMAGE_HEIGHT);
      const extraReduction = Math.min(remainingShortage, Math.max(0, currentHeight - minDisplayHeight));

      if (extraReduction <= 0) {
        continue;
      }

      imageHeights.set(item.index, currentHeight - extraReduction);
      remainingShortage -= extraReduction;
    }
  }

  return imageHeights;
}

function recommendationForStatus(status: PageLayoutStatus): string {
  if (status === "overflow") {
    return "该页已超出可用内容区，建议拆成新页、删减文字或降低字号。";
  }

  if (status === "warning") {
    return "该页已经接近底部安全区，建议适当删减文字或提前拆页。";
  }

  return "该页底部空间充足。";
}

export function analyzePageLayout(
  pages: PageModel[],
  config: RenderConfig,
  sourceTitle: string
): LayoutReport {
  const width = bodyContentWidth(config);
  const availableHeight = contentAreaHeight(config);
  const pageFeedback = pages.map<PageLayoutFeedback>((page) => {
    const titleHeight = pageTitleHeight(page, width, config);
    const imageHeights = getPageImageDisplayHeights(page, config);
    const blockHeights = page.blocks.map((block, index) =>
      estimateBlockHeight(block, width, config, imageHeights.get(index))
    );
    const blockGapTotal = pageBlockGapTotal(page.blocks.length, config);
    const estimatedContentHeight =
      titleHeight +
      (page.blocks.length > 0 ? notePx(config, BODY_BLOCK_GAP) : 0) +
      blockHeights.reduce((sum, value) => sum + value, 0) +
      blockGapTotal +
      config.layout.bodyBottomPadding;
    const remainingBottomSpace = roundPx(availableHeight - estimatedContentHeight);

    let status: PageLayoutStatus = "ok";

    if (remainingBottomSpace < 0) {
      status = "overflow";
    } else if (remainingBottomSpace < config.layout.warningThreshold) {
      status = "warning";
    }

    return {
      id: page.id,
      index: page.index,
      pageNumber: page.index + 1,
      title: page.title,
      status,
      availableContentHeight: roundPx(availableHeight),
      estimatedContentHeight: roundPx(estimatedContentHeight),
      remainingBottomSpace,
      overflowAmount: Math.max(0, roundPx(-remainingBottomSpace)),
      warningThreshold: config.layout.warningThreshold,
      safeBottomPadding: config.layout.bodyBottomPadding,
      recommendation: recommendationForStatus(status)
    };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceTitle,
    summary: {
      totalPages: pageFeedback.length,
      okPages: pageFeedback.filter((page) => page.status === "ok").length,
      warningPages: pageFeedback.filter((page) => page.status === "warning").length,
      overflowPages: pageFeedback.filter((page) => page.status === "overflow").length
    },
    pages: pageFeedback
  };
}
