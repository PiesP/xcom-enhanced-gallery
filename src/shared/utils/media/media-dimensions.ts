/**
 * @fileoverview Shared media utility functions for dimension extraction, URL normalization, and sorting.
 */

import type { JSX } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo } from '@shared/types/media.types';
import { clampIndex } from '@shared/utils/types/safety';
import { tryParseUrl } from '@shared/utils/url/host';

export interface DimensionPair {
  readonly width: number;
  readonly height: number;
}

export interface ResolvedMediaDimensions {
  readonly dimensions: DimensionPair;
  /** True when dimensions were derived from media data (not the DEFAULT_DIMENSIONS fallback). */
  readonly hasIntrinsicSize: boolean;
}

const STANDARD_GALLERY_HEIGHT = 720;

const DEFAULT_DIMENSIONS: DimensionPair = {
  width: 540,
  height: STANDARD_GALLERY_HEIGHT,
} as const;

function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Avoid treating arbitrary strings (e.g. "not-a-url") as relative URLs.
  // We only support absolute URLs, protocol-relative URLs, and path-like inputs.
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/') &&
    !trimmed.startsWith('./') &&
    !trimmed.startsWith('../')
  ) {
    return null;
  }

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

  if (!urlCandidate) {
    return null;
  }

  const typePrefix =
    media.type === 'image' || media.type === 'video' || media.type === 'gif'
      ? `${media.type}:`
      : '';

  // Prefer a host+path based key to avoid collisions when different assets share the same filename.
  // For X/Twitter media URLs, the `name` query parameter commonly represents a size variant.
  // We intentionally ignore `name` so the same media doesn't appear multiple times.
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

  // Fallback: last path segment or full URL.
  const filename = extractFilenameFromUrl(urlCandidate);
  return filename ? `${typePrefix}${filename}` : `${typePrefix}${urlCandidate}`;
}

/**
 * Generic deduplication function
 * @template T - Array element type
 * @param items - Array to deduplicate (readonly, null/undefined safe)
 * @param keyExtractor - Function to extract unique key from each item
 * @returns Deduplicated array (original order preserved)
 */
function removeDuplicates<T>(
  items: ReadonlyArray<T | null | undefined>,
  keyExtractor: (item: T) => string | null | undefined
): T[] {
  let warnedMissingKey = false;
  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    if (item == null) {
      continue;
    }

    const key = keyExtractor(item);
    if (!key) {
      if (__DEV__ && !warnedMissingKey) {
        warnedMissingKey = true;
        logger.warn('Skipping item without key');
      }
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

/**
 * Deduplicate media items based on URL
 * @param mediaItems - Array of media items to deduplicate
 * @returns Deduplicated array of media items
 */
export function removeDuplicateMediaItems(
  mediaItems: ReadonlyArray<MediaInfo | undefined>
): MediaInfo[] {
  if (!mediaItems?.length) {
    return [];
  }

  const result = removeDuplicates<MediaInfo>(mediaItems, getMediaDedupKey);

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
 * Extract visual index from expanded_url
 * Parses Twitter URL to find visual position in media grid.
 */
export function extractVisualIndexFromUrl(url: string): number {
  if (!url) return 0;
  const match = url.match(/\/(photo|video)\/(\d+)(?:[?#].*)?$/);
  const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
  return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
}

/**
 * Sort media by visual display order
 */
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
 * Extract Dimensions from URL - Parse WxH Pattern
 */
export function extractDimensionsFromUrl(url: string): { width: number; height: number } | null {
  if (!url) return null;
  // Match patterns like /640x480/ or /640x480.jpg or /640x480 at end of path
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
 * Normalize Dimension - Type-Safe Number Parsing
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
 * Normalize Media URL for Comparison
 * Extracts pure filename (removes query strings, fragments)
 */
export function normalizeMediaUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Avoid treating arbitrary strings (e.g. "not-a-url") as relative URLs.
  // We only support absolute URLs, protocol-relative URLs, and path-like inputs.
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/') &&
    !trimmed.startsWith('./') &&
    !trimmed.startsWith('../')
  ) {
    return null;
  }

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

function deriveDimensionsFromMediaUrls(media: MediaInfo): DimensionPair | null {
  const candidates: Array<string | undefined> = [media.url, media.originalUrl, media.thumbnailUrl];
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

export function resolveMediaDimensions(media: MediaInfo | undefined): DimensionPair {
  return resolveMediaDimensionsWithIntrinsicFlag(media).dimensions;
}

/**
 * Resolve media dimensions and also indicate whether a real intrinsic size was found.
 *
 * This is useful for CLS mitigation where CSS rules should only activate when the
 * derived dimensions are trusted (i.e., not the DEFAULT_DIMENSIONS fallback).
 */
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

/**
 * Adjust clicked index after deduplication
 *
 * Finds the new index of the clicked item in the deduplicated list.
 *
 * @param originalItems - The original list of media items
 * @param uniqueItems - The deduplicated list of media items
 * @param originalClickedIndex - The index of the clicked item in the original list
 * @returns The index of the clicked item in the uniqueItems list, or 0 if not found
 */
export function adjustClickedIndexAfterDeduplication(
  originalItems: MediaInfo[],
  uniqueItems: MediaInfo[],
  originalClickedIndex: number
): number {
  if (uniqueItems.length === 0) return 0;

  // Normalize original index using shared clamp utility
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
