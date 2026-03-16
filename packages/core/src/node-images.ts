import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDataUrl, isHttpUrl } from "./image.js";
import type { PageBlock, PageImageBlock, PageModel } from "./models.js";

type ImageDimensions = {
  width: number;
  height: number;
};

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

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

function withDimensions(dimensions: ImageDimensions | undefined): {
  width?: number;
  height?: number;
} {
  if (!dimensions) {
    return {};
  }

  return {
    width: dimensions.width,
    height: dimensions.height
  };
}

function normalizeMimeType(rawMimeType: string | null | undefined): string | undefined {
  if (!rawMimeType) {
    return undefined;
  }

  return rawMimeType.split(";")[0]?.trim().toLowerCase() || undefined;
}

function mimeTypeFromPath(filePath: string): string | undefined {
  return IMAGE_MIME_BY_EXTENSION[extname(filePath).toLowerCase()];
}

function mimeTypeFromBuffer(buffer: Uint8Array): string | undefined {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  const shortHeader = Buffer.from(buffer.slice(0, Math.min(buffer.length, 12))).toString("ascii");

  if (shortHeader.startsWith("GIF87a") || shortHeader.startsWith("GIF89a")) {
    return "image/gif";
  }

  if (shortHeader.startsWith("RIFF") && shortHeader.slice(8, 12) === "WEBP") {
    return "image/webp";
  }

  const prefix = Buffer.from(buffer.slice(0, Math.min(buffer.length, 256)))
    .toString("utf8")
    .trimStart();

  if (prefix.startsWith("<svg") || prefix.startsWith("<?xml")) {
    return "image/svg+xml";
  }

  return undefined;
}

function toDataUrl(mimeType: string, buffer: Uint8Array): string {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
}

function parseDataUrl(input: string): { buffer: Uint8Array; mimeType?: string } {
  const match = /^data:([^;,]+)?((?:;[^;,=]+=[^;,=]+)*)(;base64)?,([\s\S]*)$/i.exec(input);

  if (!match) {
    throw new Error("Invalid data URL.");
  }

  const mimeType = normalizeMimeType(match[1]);
  const isBase64 = Boolean(match[3]);
  const payload = match[4] ?? "";
  const decoded = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return mimeType
    ? {
        buffer: new Uint8Array(decoded),
        mimeType
      }
    : {
        buffer: new Uint8Array(decoded)
      };
}

function parseSvgLength(rawValue: string | undefined): number | undefined {
  if (!rawValue) {
    return undefined;
  }

  const value = rawValue.trim();
  const match = /^([0-9]+(?:\.[0-9]+)?)(px)?$/i.exec(value);

  if (!match) {
    return undefined;
  }

  const rawNumericValue = match[1];

  if (!rawNumericValue) {
    return undefined;
  }

  const numericValue = Number(rawNumericValue);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
}

function detectSvgDimensions(svgText: string): ImageDimensions | undefined {
  const widthMatch = /\bwidth=["']([^"']+)["']/i.exec(svgText);
  const heightMatch = /\bheight=["']([^"']+)["']/i.exec(svgText);
  const parsedWidth = parseSvgLength(widthMatch?.[1]);
  const parsedHeight = parseSvgLength(heightMatch?.[1]);

  if (parsedWidth && parsedHeight) {
    return {
      width: parsedWidth,
      height: parsedHeight
    };
  }

  const viewBoxMatch = /\bviewBox=["']([^"']+)["']/i.exec(svgText);

  if (!viewBoxMatch?.[1]) {
    return undefined;
  }

  const segments = viewBoxMatch[1]
    .trim()
    .split(/[\s,]+/)
    .map((segment) => Number(segment));

  if (segments.length !== 4 || !segments.every((value) => Number.isFinite(value))) {
    return undefined;
  }

  const width = segments[2];
  const height = segments[3];

  if (width === undefined || height === undefined || width <= 0 || height <= 0) {
    return undefined;
  }

  return {
    width,
    height
  };
}

function detectPngDimensions(buffer: Uint8Array): ImageDimensions | undefined {
  if (buffer.length < 24) {
    return undefined;
  }

  return {
    width: readUint32BE(buffer, 16),
    height: readUint32BE(buffer, 20)
  };
}

function detectGifDimensions(buffer: Uint8Array): ImageDimensions | undefined {
  if (buffer.length < 10) {
    return undefined;
  }

  return {
    width: readUint16LE(buffer, 6),
    height: readUint16LE(buffer, 8)
  };
}

function detectJpegDimensions(buffer: Uint8Array): ImageDimensions | undefined {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return undefined;
  }

  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = readUint16BE(buffer, offset + 2);

    if (marker === undefined || segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
      return undefined;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      return {
        width: readUint16BE(buffer, offset + 7),
        height: readUint16BE(buffer, offset + 5)
      };
    }

    offset += 2 + segmentLength;
  }

  return undefined;
}

function detectWebpDimensions(buffer: Uint8Array): ImageDimensions | undefined {
  const header = Buffer.from(buffer.slice(0, Math.min(buffer.length, 16))).toString("ascii");

  if (buffer.length < 30 || !header.startsWith("RIFF") || header.slice(8, 12) !== "WEBP") {
    return undefined;
  }

  const chunkType = Buffer.from(buffer.slice(12, 16)).toString("ascii");

  if (chunkType === "VP8 ") {
    return {
      width: (buffer[26] ?? 0) | (((buffer[27] ?? 0) & 0x3f) << 8),
      height: (buffer[28] ?? 0) | (((buffer[29] ?? 0) & 0x3f) << 8)
    };
  }

  if (chunkType === "VP8L") {
    const value =
      (buffer[21] ?? 0) |
      ((buffer[22] ?? 0) << 8) |
      ((buffer[23] ?? 0) << 16) |
      ((buffer[24] ?? 0) << 24);

    return {
      width: (value & 0x3fff) + 1,
      height: ((value >> 14) & 0x3fff) + 1
    };
  }

  if (chunkType === "VP8X") {
    return {
      width: 1 + readUint24LE(buffer, 24),
      height: 1 + readUint24LE(buffer, 27)
    };
  }

  return undefined;
}

function detectImageDimensions(
  buffer: Uint8Array,
  mimeType: string | undefined
): ImageDimensions | undefined {
  if (!mimeType) {
    return undefined;
  }

  if (mimeType === "image/png") {
    return detectPngDimensions(buffer);
  }

  if (mimeType === "image/jpeg") {
    return detectJpegDimensions(buffer);
  }

  if (mimeType === "image/gif") {
    return detectGifDimensions(buffer);
  }

  if (mimeType === "image/webp") {
    return detectWebpDimensions(buffer);
  }

  if (mimeType === "image/svg+xml") {
    return detectSvgDimensions(Buffer.from(buffer).toString("utf8"));
  }

  return undefined;
}

function resolveFileReference(reference: string, markdownFilePath?: string): string {
  if (reference.startsWith("file://")) {
    return fileURLToPath(reference);
  }

  const decodedReference = decodeURIComponent(reference);

  if (isAbsolute(decodedReference)) {
    return decodedReference;
  }

  if (markdownFilePath) {
    return resolve(dirname(markdownFilePath), decodedReference);
  }

  return resolve(decodedReference);
}

async function loadImageAsset(reference: string, markdownFilePath?: string): Promise<{
  src: string;
  width?: number;
  height?: number;
}> {
  if (isDataUrl(reference)) {
    const parsed = parseDataUrl(reference);
    const mimeType = parsed.mimeType ?? mimeTypeFromBuffer(parsed.buffer);
    const dimensions = detectImageDimensions(parsed.buffer, mimeType);

    return {
      src: reference,
      ...withDimensions(dimensions)
    };
  }

  if (isHttpUrl(reference)) {
    const response = await fetch(reference);

    if (!response.ok) {
      throw new Error(`Image request failed with status ${response.status}.`);
    }

    const buffer = new Uint8Array(await response.arrayBuffer());
    const mimeType =
      normalizeMimeType(response.headers.get("content-type")) ??
      mimeTypeFromPath(new URL(reference).pathname) ??
      mimeTypeFromBuffer(buffer);

    if (!mimeType) {
      throw new Error("Unsupported remote image type.");
    }

    const dimensions = detectImageDimensions(buffer, mimeType);

    return {
      src: toDataUrl(mimeType, buffer),
      ...withDimensions(dimensions)
    };
  }

  const resolvedFilePath = resolveFileReference(reference, markdownFilePath);
  const buffer = new Uint8Array(await readFile(resolvedFilePath));
  const mimeType = mimeTypeFromPath(resolvedFilePath) ?? mimeTypeFromBuffer(buffer);

  if (!mimeType) {
    throw new Error(`Unsupported image type: ${resolvedFilePath}`);
  }

  const dimensions = detectImageDimensions(buffer, mimeType);

  return {
    src: toDataUrl(mimeType, buffer),
    ...withDimensions(dimensions)
  };
}

async function resolveNodeImageBlock(
  block: PageImageBlock,
  markdownFilePath?: string
): Promise<PageImageBlock> {
  try {
    const asset = await loadImageAsset(block.url, markdownFilePath);
    const { errorMessage: _errorMessage, ...cleanBlock } = block;

    return {
      ...cleanBlock,
      ...asset,
      status: "resolved"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      ...block,
      status: "failed",
      errorMessage: `图片加载失败：${message}`
    };
  }
}

async function resolveNodeBlock(
  block: PageBlock,
  markdownFilePath?: string
): Promise<PageBlock> {
  if (block.type !== "image") {
    return block;
  }

  return resolveNodeImageBlock(block, markdownFilePath);
}

export async function resolvePageImagesForNode(
  pages: PageModel[],
  markdownFilePath?: string
): Promise<PageModel[]> {
  return Promise.all(
    pages.map(async (page) => ({
      ...page,
      blocks: await Promise.all(
        page.blocks.map((block) => resolveNodeBlock(block, markdownFilePath))
      )
    }))
  );
}
