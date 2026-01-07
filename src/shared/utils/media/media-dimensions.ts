/** Media utilities: dimensions, URL normalization, sorting */

import type { JSX } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo } from '@shared/types/media.types';
import { clampIndex } from '@shared/utils/types/safety';
import { tryParseUrl } from '@shared/utils/url/host';

/** Immutable width and height pair */
interface DimensionPair {
  readonly width: number;
  readonly height: number;
}

/** Media dimensions with intrinsic size flag */
interface ResolvedMediaDimensions {
  readonly dimensions: DimensionPair;
  readonly hasIntrinsicSize: boolean;
}

const STANDARD_GALLERY_HEIGHT = 720 as const;

const DEFAULT_DIMENSIONS = {
  width: 540,
  height: STANDARD_GALLERY_HEIGHT,
} as const satisfies DimensionPair;

/** Check if string has a valid URL prefix */
function hasValidUrlPrefix(str: string): boolean {
  return /^(?:https?:\/\/|\/\/|\/|\.\/|\.\.\/)/u.test(str);
}

/**
 * Extract filename from URL pathname
 * @param url - URL string to parse
 * @returns Filename or null if extraction fails
 */
function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed || !hasValidUrlPrefix(trimmed)) return null;

  const parsed = tryParseUrl(trimmed, 'https://example.invalid');
  if (!parsed) return null;

  const filename = parsed.pathname.split('/').pop();
  return filename && filename.length > 0 ? filename : null;
}

/**
 * Generate deduplication key for media item
 * @param media - Media info to generate key for
 * @returns Unique key for deduplication or null
 */
function getMediaDedupKey(media: MediaInfo): string | null {
  const urlCandidate =
    typeof media.originalUrl === 'string' && media.originalUrl.length > 0
      ? media.originalUrl
      : typeof media.url === 'string' && media.url.length > 0
        ? media.url
        : null;

  if (!urlCandidate) {
    return null;
  }

  const typePrefix =
    media.type === 'image' || media.type === 'video' || media.type === 'gif'
      ? `${media.type}:`
      : '';

  const parsed = tryParseUrl(urlCandidate, 'https://example.invalid');
  if (parsed) {
    const host = parsed.hostname;
    const path = parsed.pathname;
    const format = parsed.searchParams.get('format');
    const formatSuffix = format ? `?format=${format}` : '';

    if (host && path) {
      return `${typePrefix}${host}${path}${formatSuffix}`;
    }
  }

  const filename = extractFilenameFromUrl(urlCandidate);
  return filename ? `${typePrefix}${filename}` : `${typePrefix}${urlCandidate}`;
}

/** Deduplicate media items by URL */
export function removeDuplicateMediaItems(
  mediaItems: ReadonlyArray<MediaInfo | undefined>
): MediaInfo[] {
  if (!mediaItems?.length) {
    return [];
  }

  let warnedMissingKey = false;
  const seen = new Set<string>();
  const result: MediaInfo[] = [];

  for (const item of mediaItems) {
    if (item == null) continue;

    const key = getMediaDedupKey(item);
    if (!key) {
      if (__DEV__ && !warnedMissingKey) {
        warnedMissingKey = true;
        logger.warn('Skipping item without key');
      }
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  if (__DEV__) {
    const inputCount = mediaItems.filter(Boolean).length;
    const removedCount = inputCount - result.length;
    if (removedCount > 0) {
      logger.debug('Removed duplicate media items:', {
        original: inputCount,
        unique: result.length,
        removed: removedCount,
      });
    }
  }

  return result;
}

/**
 * Extract visual index (1-based) from photo/video URL
 * @param url - URL to parse
 * @returns Zero-based index or 0 if not found
 */
function extractVisualIndexFromUrl(url: string): number {
  if (!url) return 0;
  const match = url.match(/\/(photo|video)\/(\d+)(?:[?#].*)?$/);
  const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
  return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
}

/** Sort media by visual display order */
export function sortMediaByVisualOrder(mediaItems: TweetMediaEntry[]): TweetMediaEntry[] {
  if (mediaItems.length <= 1) return mediaItems;

  const withVisualIndex = mediaItems.map((media) => {
    const visualIndex = extractVisualIndexFromUrl(media.expanded_url || '');
    return { media, visualIndex };
  });

  withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

  return withVisualIndex.map(({ media }, newIndex) => ({
    ...media,
    index: newIndex,
  }));
}

/**
 * Extract dimensions from URL containing WxH pattern
 * @param url - URL to parse
 * @returns Dimension pair or null if not found
 */
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

/**
 * Normalize dimension value to positive integer
 * Accepts numbers or numeric strings
 * @param value - Value to normalize
 * @returns Rounded positive integer or null if invalid
 */
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

/**
 * Normalize media URL to comparable filename (extension removed)
 * @param url - URL to normalize
 * @returns Normalized filename or null if invalid
 */
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

type MetadataRecord = Record<string, unknown> | undefined;

/**
 * Scale aspect ratio to standard gallery height
 * @param widthRatio - Width component of aspect ratio
 * @param heightRatio - Height component of aspect ratio
 * @returns Scaled dimensions or default if invalid
 */
function scaleAspectRatio(widthRatio: number, heightRatio: number): DimensionPair {
  if (heightRatio <= 0 || widthRatio <= 0) {
    return DEFAULT_DIMENSIONS;
  }

  const scaledHeight = STANDARD_GALLERY_HEIGHT;
  const scaledWidth = Math.max(1, Math.round((widthRatio / heightRatio) * scaledHeight));

  return {
    width: scaledWidth,
    height: scaledHeight,
  };
}

/**
 * Extract dimensions from metadata object
 * @param dimensions - Metadata dimensions object
 * @returns Dimension pair or null if not found
 */
function extractDimensionsFromMetadataObject(
  dimensions?: Record<string, unknown>
): DimensionPair | null {
  if (!dimensions) {
    return null;
  }

  const width = normalizeDimension(dimensions.width);
  const height = normalizeDimension(dimensions.height);
  if (width && height) {
    return { width, height };
  }

  return null;
}

/**
 * Derive dimensions from metadata using multiple strategies
 * @param metadata - Metadata record
 * @returns Dimension pair or null if not found
 */
function deriveDimensionsFromMetadata(metadata: MetadataRecord): DimensionPair | null {
  if (!metadata) {
    return null;
  }

  const dimensions = extractDimensionsFromMetadataObject(
    metadata.dimensions as Record<string, unknown> | undefined
  );
  if (dimensions) {
    return dimensions;
  }

  const apiData = metadata.apiData as Record<string, unknown> | undefined;
  if (!apiData) {
    return null;
  }

  const originalWidth = normalizeDimension(apiData.original_width ?? apiData.originalWidth);
  const originalHeight = normalizeDimension(apiData.original_height ?? apiData.originalHeight);
  if (originalWidth && originalHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const downloadUrl = apiData.download_url;
  if (typeof downloadUrl === 'string' && downloadUrl) {
    const fromDownloadUrl = extractDimensionsFromUrl(downloadUrl);
    if (fromDownloadUrl) {
      return fromDownloadUrl;
    }
  }

  const previewUrl = apiData.preview_url;
  if (typeof previewUrl === 'string' && previewUrl) {
    const fromPreviewUrl = extractDimensionsFromUrl(previewUrl);
    if (fromPreviewUrl) {
      return fromPreviewUrl;
    }
  }

  const aspectRatio = apiData.aspect_ratio;
  if (Array.isArray(aspectRatio) && aspectRatio.length >= 2) {
    const ratioWidth = normalizeDimension(aspectRatio[0]);
    const ratioHeight = normalizeDimension(aspectRatio[1]);
    if (ratioWidth && ratioHeight) {
      return scaleAspectRatio(ratioWidth, ratioHeight);
    }
  }

  return null;
}

/**
 * Derive dimensions from media URL candidates
 * @param media - Media info object
 * @returns Dimension pair or null if not found in any URL
 */
function deriveDimensionsFromMediaUrls(media: MediaInfo): DimensionPair | null {
  const candidates: readonly (string | undefined)[] = [
    media.url,
    media.originalUrl,
    media.thumbnailUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) {
      const dimensions = extractDimensionsFromUrl(candidate);
      if (dimensions) {
        return dimensions;
      }
    }
  }
  return null;
}

/** Resolve media dimensions with intrinsic size flag */
export function resolveMediaDimensionsWithIntrinsicFlag(
  media: MediaInfo | undefined
): ResolvedMediaDimensions {
  if (!media) {
    return { dimensions: DEFAULT_DIMENSIONS, hasIntrinsicSize: false };
  }

  const directWidth = normalizeDimension(media.width);
  const directHeight = normalizeDimension(media.height);
  if (directWidth && directHeight) {
    return { dimensions: { width: directWidth, height: directHeight }, hasIntrinsicSize: true };
  }

  const fromMetadata = deriveDimensionsFromMetadata(
    media.metadata as Record<string, unknown> | undefined
  );
  if (fromMetadata) {
    return { dimensions: fromMetadata, hasIntrinsicSize: true };
  }

  const fromUrls = deriveDimensionsFromMediaUrls(media);
  if (fromUrls) {
    return { dimensions: fromUrls, hasIntrinsicSize: true };
  }

  return { dimensions: DEFAULT_DIMENSIONS, hasIntrinsicSize: false };
}

/**
 * Convert pixel value to rem unit
 * @param pixels - Pixel value to convert
 * @returns CSS rem value with 4 decimal places
 */
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

/** Adjust clicked index after deduplication */
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
  const newIndex = uniqueItems.findIndex((item) => {
    return getMediaDedupKey(item) === clickedKey;
  });

  return newIndex >= 0 ? newIndex : 0;
}
