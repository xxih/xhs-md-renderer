import type { PageBlock, PageImageBlock, PageModel } from "./models.js";

export const DEFAULT_IMAGE_ASPECT_RATIO = 4 / 3;
export const DEFAULT_IMAGE_HEIGHT = 220;
export const MIN_IMAGE_HEIGHT = 120;
export const MAX_IMAGE_HEIGHT = 320;
const PNG_SIGNATURE = "89504e470d0a1a0a";
const GIF87A_SIGNATURE = "474946383761";
const GIF89A_SIGNATURE = "474946383961";
const RIFF_SIGNATURE = "52494646";
const WEBP_SIGNATURE = "57454250";

export function isDataUrl(reference: string): boolean {
  return reference.startsWith("data:");
}

export function isHttpUrl(reference: string): boolean {
  return /^https?:\/\//i.test(reference);
}

export function isBlobUrl(reference: string): boolean {
  return reference.startsWith("blob:");
}

export function isBrowserRenderableImageReference(reference: string): boolean {
  return (
    isDataUrl(reference) ||
    isHttpUrl(reference) ||
    isBlobUrl(reference) ||
    reference.startsWith("/")
  );
}

export function isLikelyRelativeImagePath(reference: string): boolean {
  if (!reference || reference.startsWith("#")) {
    return false;
  }

  return !isBrowserRenderableImageReference(reference);
}

export function getImageAspectRatio(
  image: Pick<PageImageBlock, "width" | "height">
): number {
  if (
    image.width !== undefined &&
    image.height !== undefined &&
    image.width > 0 &&
    image.height > 0
  ) {
    return image.width / image.height;
  }

  return DEFAULT_IMAGE_ASPECT_RATIO;
}

export function getImageDisplayHeight(input: {
  image: Pick<PageImageBlock, "width" | "height">;
  contentWidth: number;
  minHeight?: number;
  maxHeight?: number;
  fallbackHeight?: number;
}): number {
  const minHeight = input.minHeight ?? MIN_IMAGE_HEIGHT;
  const maxHeight = input.maxHeight ?? MAX_IMAGE_HEIGHT;

  let rawHeight = input.fallbackHeight ?? DEFAULT_IMAGE_HEIGHT;

  if (
    input.image.width !== undefined &&
    input.image.height !== undefined &&
    input.image.width > 0 &&
    input.image.height > 0 &&
    input.contentWidth > 0
  ) {
    rawHeight = Math.round((input.contentWidth * input.image.height) / input.image.width);
  }

  return Math.max(minHeight, Math.min(maxHeight, rawHeight));
}

function bytesToHex(bytes: Uint8Array, start: number, end: number): string {
  return Array.from(bytes.slice(start, end))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16)
  );
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) * 0x1000000 +
    (((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0))
  );
}

export function dataUrlToBytes(reference: string): Uint8Array | undefined {
  const match = /^data:[^;,]+(?:;charset=[^;,]+)?;base64,(.+)$/i.exec(reference);

  if (!match) {
    return undefined;
  }

  const base64 = match[1];

  if (!base64) {
    return undefined;
  }

  if (typeof atob === "function") {
    const decoded = atob(base64);
    const bytes = new Uint8Array(decoded.length);

    for (let index = 0; index < decoded.length; index += 1) {
      bytes[index] = decoded.charCodeAt(index);
    }

    return bytes;
  }

  return new Uint8Array(Buffer.from(base64, "base64"));
}

export function parseImageDimensions(bytes: Uint8Array): { width: number; height: number } | undefined {
  if (bytes.length < 10) {
    return undefined;
  }

  if (bytesToHex(bytes, 0, 8) === PNG_SIGNATURE && bytes.length >= 24) {
    return {
      width: readUint32BE(bytes, 16),
      height: readUint32BE(bytes, 20)
    };
  }

  const gifSignature = bytesToHex(bytes, 0, 6);

  if (
    (gifSignature === GIF87A_SIGNATURE || gifSignature === GIF89A_SIGNATURE) &&
    bytes.length >= 10
  ) {
    return {
      width: readUint16LE(bytes, 6),
      height: readUint16LE(bytes, 8)
    };
  }

  if (readUint16BE(bytes, 0) === 0xffd8) {
    let offset = 2;

    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = bytes[offset + 1];

      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb ||
        marker === 0xcd ||
        marker === 0xce ||
        marker === 0xcf
      ) {
        return {
          width: readUint16BE(bytes, offset + 7),
          height: readUint16BE(bytes, offset + 5)
        };
      }

      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }

      const segmentLength = readUint16BE(bytes, offset + 2);

      if (segmentLength < 2) {
        return undefined;
      }

      offset += segmentLength + 2;
    }

    return undefined;
  }

  if (
    bytes.length >= 30 &&
    bytesToHex(bytes, 0, 4) === RIFF_SIGNATURE &&
    bytesToHex(bytes, 8, 12) === WEBP_SIGNATURE
  ) {
    const chunkType = bytesToHex(bytes, 12, 16);

    if (chunkType === "56503858") {
      return {
        width: readUint24LE(bytes, 24) + 1,
        height: readUint24LE(bytes, 27) + 1
      };
    }

    if (chunkType === "5650384c" && bytes.length >= 25) {
      const bits =
        (bytes[21] ?? 0) |
        ((bytes[22] ?? 0) << 8) |
        ((bytes[23] ?? 0) << 16) |
        ((bytes[24] ?? 0) << 24);

      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1
      };
    }

    if (chunkType === "56503820") {
      return {
        width: readUint16LE(bytes, 26),
        height: readUint16LE(bytes, 28)
      };
    }
  }

  return undefined;
}

function cloneImageBlock(
  block: PageBlock,
  nextImageBlock: PageImageBlock
): PageBlock {
  if (block.type !== "image") {
    return block;
  }

  return nextImageBlock;
}

export function markPageImagesPending(pages: PageModel[]): PageModel[] {
  return pages.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) =>
      cloneImageBlock(
        block,
        block.type === "image"
          ? {
              ...block,
              status: "pending"
            }
          : (block as never)
      )
    )
  }));
}

function resolveBrowserImageReference(reference: string, baseUrl: string): string {
  if (isDataUrl(reference) || isHttpUrl(reference) || isBlobUrl(reference)) {
    return reference;
  }

  return new URL(reference, baseUrl).toString();
}

function loadBrowserImage(reference: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => {
      reject(new Error("Failed to load image."));
    };
    image.src = reference;
  });
}

async function resolveImageBlockInBrowser(
  block: PageImageBlock,
  baseUrl: string
): Promise<PageImageBlock> {
  let resolvedReference: string;

  try {
    resolvedReference = resolveBrowserImageReference(block.url, baseUrl);
  } catch {
    return {
      ...block,
      status: "failed",
      errorMessage: `无法解析图片地址：${block.url}`
    };
  }

  try {
    const dimensions = await loadBrowserImage(resolvedReference);
    return {
      ...block,
      src: resolvedReference,
      width: dimensions.width,
      height: dimensions.height,
      status: "resolved"
    };
  } catch {
    const errorMessage = isLikelyRelativeImagePath(block.url)
      ? `浏览器无法直接读取该本地图片路径：${block.url}。Web 预览请使用可访问 URL 或 data URL；CLI 导出可使用相对 Markdown 文件路径。`
      : `浏览器未能加载图片：${block.url}`;

    return {
      ...block,
      src: resolvedReference,
      status: "failed",
      errorMessage
    };
  }
}

export async function resolvePageImagesInBrowser(
  pages: PageModel[],
  options: { baseUrl?: string } = {}
): Promise<PageModel[]> {
  const baseUrl =
    options.baseUrl ??
    (typeof window !== "undefined" ? window.location.href : "http://localhost/");

  return Promise.all(
    pages.map(async (page) => ({
      ...page,
      blocks: await Promise.all(
        page.blocks.map(async (block) => {
          if (block.type !== "image") {
            return block;
          }

          return resolveImageBlockInBrowser(block, baseUrl);
        })
      )
    }))
  );
}
