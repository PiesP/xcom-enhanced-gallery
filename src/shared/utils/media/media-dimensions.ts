/** Media utilities: dimensions, URL normalization, sorting, deduplication */

import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo } from '@shared/types/media.types';
import { clampIndex } from '@shared/utils/types/safety';
import { tryParseUrl } from '@shared/utils/url/host';
import type { JSX } from 'solid-js';

interface DimensionPair {
  readonly width: number;
  readonly height: number;
}

interface ResolvedMediaDimensions {
  readonly dimensions: DimensionPair;
  readonly hasIntrinsicSize: boolean;
}

const STANDARD_GALLERY_HEIGHT = 720;
const DEFAULT_DIMENSIONS: DimensionPair = { width: 540, height: STANDARD_GALLERY_HEIGHT };

function hasValidUrlPrefix(str: string): boolean {
  return /^(?:https?:\/\/|\/\/|\/|\.\/|\.\.\/)/u.test(str);
}

function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || !hasValidUrlPrefix(trimmed)) return null;
  const parsed = tryParseUrl(trimmed, 'https://example.invalid');
  if (!parsed) return null;
  const filename = parsed.pathname.split('/').pop();
  return filename && filename.length > 0 ? filename : null;
}

function getMediaDedupKey(media: MediaInfo): string | null {
  const urlCandidate =
    typeof media.originalUrl === 'string' && media.originalUrl.length > 0
      ? media.originalUrl
      : typeof media.url === 'string' && media.url.length > 0
        ? media.url
        : null;

  if (!urlCandidate) return null;

  const typePrefix =
    media.type === 'image' || media.type === 'video' || media.type === 'gif'
      ? `${media.type}:`
      : '';

  const parsed = tryParseUrl(urlCandidate, 'https://example.invalid');
  if (parsed) {
    const host = parsed.hostname;
    const path = parsed.pathname;
    const format = parsed.searchParams.get('format');
    if (host && path) {
      return `${typePrefix}${host}${path}${format ? `?format=${format}` : ''}`;
    }
  }

  const filename = extractFilenameFromUrl(urlCandidate);
  return filename ? `${typePrefix}${filename}` : `${typePrefix}${urlCandidate}`;
}

export function removeDuplicateMediaItems(
  mediaItems: ReadonlyArray<MediaInfo | undefined>
): MediaInfo[] {
  if (!mediaItems?.length) return [];

  const seen = new Set<string>();
  const result: MediaInfo[] = [];

  for (const item of mediaItems) {
    if (item == null) continue;
    const key = getMediaDedupKey(item);
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

function extractVisualIndexFromUrl(url: string): number {
  if (!url) return 0;
  const match = url.match(/\/(photo|video)\/(\d+)(?:[?#].*)?$/);
  const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
  return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
}

export function sortMediaByVisualOrder(mediaItems: TweetMediaEntry[]): TweetMediaEntry[] {
  if (mediaItems.length <= 1) return mediaItems;

  return mediaItems
    .map((media) => ({ media, visualIndex: extractVisualIndexFromUrl(media.expanded_url || '') }))
    .sort((a, b) => a.visualIndex - b.visualIndex)
    .map(({ media }, newIndex) => ({ ...media, index: newIndex }));
}

export function extractDimensionsFromUrl(url: string): DimensionPair | null {
  if (!url) return null;
  const match = url.match(/\/(\d{2,6})x(\d{2,6})(?:\/|\.|$)/);
  if (!match) return null;

  const width = Number.parseInt(match[1] ?? '', 10);
  const height = Number.parseInt(match[2] ?? '', 10);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
}

export function normalizeDimension(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return null;
}

export function normalizeMediaUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || !hasValidUrlPrefix(trimmed)) return null;

  const parsed = tryParseUrl(trimmed, 'https://example.invalid');
  if (!parsed) return null;

  let filename = parsed.pathname.split('/').pop();
  if (!filename) return null;

  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex !== -1) {
    filename = filename.substring(0, dotIndex);
  }

  return filename && filename.length > 0 ? filename : null;
}

function scaleAspectRatio(widthRatio: number, heightRatio: number): DimensionPair {
  if (heightRatio <= 0 || widthRatio <= 0) return DEFAULT_DIMENSIONS;
  return {
    width: Math.max(1, Math.round((widthRatio / heightRatio) * STANDARD_GALLERY_HEIGHT)),
    height: STANDARD_GALLERY_HEIGHT,
  };
}

function deriveDimensionsFromMetadata(
  metadata: Record<string, unknown> | undefined
): DimensionPair | null {
  if (!metadata) return null;

  const dims = metadata.dimensions as Record<string, unknown> | undefined;
  const w = normalizeDimension(dims?.width);
  const h = normalizeDimension(dims?.height);
  if (w && h) return { width: w, height: h };

  const apiData = metadata.apiData as Record<string, unknown> | undefined;
  if (!apiData) return null;

  const origW = normalizeDimension(apiData.original_width ?? apiData.originalWidth);
  const origH = normalizeDimension(apiData.original_height ?? apiData.originalHeight);
  if (origW && origH) return { width: origW, height: origH };

  const downloadUrl = apiData.download_url;
  if (typeof downloadUrl === 'string' && downloadUrl) {
    const fromUrl = extractDimensionsFromUrl(downloadUrl);
    if (fromUrl) return fromUrl;
  }

  const previewUrl = apiData.preview_url;
  if (typeof previewUrl === 'string' && previewUrl) {
    const fromUrl = extractDimensionsFromUrl(previewUrl);
    if (fromUrl) return fromUrl;
  }

  const aspectRatio = apiData.aspect_ratio;
  if (Array.isArray(aspectRatio) && aspectRatio.length >= 2) {
    const ratioW = normalizeDimension(aspectRatio[0]);
    const ratioH = normalizeDimension(aspectRatio[1]);
    if (ratioW && ratioH) return scaleAspectRatio(ratioW, ratioH);
  }

  return null;
}

function deriveDimensionsFromMediaUrls(media: MediaInfo): DimensionPair | null {
  for (const candidate of [media.url, media.originalUrl, media.thumbnailUrl]) {
    if (typeof candidate === 'string' && candidate) {
      const dimensions = extractDimensionsFromUrl(candidate);
      if (dimensions) return dimensions;
    }
  }
  return null;
}

export function resolveMediaDimensionsWithIntrinsicFlag(
  media: MediaInfo | undefined
): ResolvedMediaDimensions {
  if (!media) return { dimensions: DEFAULT_DIMENSIONS, hasIntrinsicSize: false };

  const directW = normalizeDimension(media.width);
  const directH = normalizeDimension(media.height);
  if (directW && directH) {
    return { dimensions: { width: directW, height: directH }, hasIntrinsicSize: true };
  }

  const fromMetadata = deriveDimensionsFromMetadata(
    media.metadata as Record<string, unknown> | undefined
  );
  if (fromMetadata) return { dimensions: fromMetadata, hasIntrinsicSize: true };

  const fromUrls = deriveDimensionsFromMediaUrls(media);
  if (fromUrls) return { dimensions: fromUrls, hasIntrinsicSize: true };

  return { dimensions: DEFAULT_DIMENSIONS, hasIntrinsicSize: false };
}

function toRem(pixels: number): string {
  return `${(pixels / 16).toFixed(4)}rem`;
}

export function createIntrinsicSizingStyle(dimensions: DimensionPair): JSX.CSSProperties {
  const ratio = dimensions.height > 0 ? dimensions.width / dimensions.height : 1;
  return {
    '--xeg-aspect-default': `${dimensions.width} / ${dimensions.height}`,
    '--xeg-gallery-item-intrinsic-width': toRem(dimensions.width),
    '--xeg-gallery-item-intrinsic-height': toRem(dimensions.height),
    '--xeg-gallery-item-intrinsic-ratio': ratio.toFixed(6),
  };
}

export function adjustClickedIndexAfterDeduplication(
  originalItems: MediaInfo[],
  uniqueItems: MediaInfo[],
  originalClickedIndex: number
): number {
  if (uniqueItems.length === 0) return 0;

  const safeOriginalIndex = clampIndex(originalClickedIndex, originalItems.length);
  const clickedItem = originalItems[safeOriginalIndex];
  if (!clickedItem) return 0;

  const clickedKey = getMediaDedupKey(clickedItem);
  if (!clickedKey) return 0;

  const newIndex = uniqueItems.findIndex((item) => getMediaDedupKey(item) === clickedKey);
  return newIndex >= 0 ? newIndex : 0;
}
