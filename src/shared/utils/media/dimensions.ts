/**
 * @fileoverview Media dimension calculation utilities
 * @description Unified dimension resolution for gallery media items
 * @module shared/utils/media/dimensions
 * @version 1.0.0 - Phase 434
 */

import type { MediaInfo } from '@shared/types/media.types';

/**
 * Width and height pair for media dimensions
 */
export interface DimensionPair {
  readonly width: number;
  readonly height: number;
}

/**
 * Default dimensions when metadata is unavailable
 * Based on standard gallery height (720px) with 4:3 aspect ratio
 */
const DEFAULT_DIMENSIONS: DimensionPair = {
  width: 540,
  height: 720,
} as const;

/**
 * Pattern to extract video dimensions from URL path
 * Matches patterns like /1280x720/ in video URLs
 */
const VIDEO_DIMENSION_PATTERN = /\/(\d{2,6})x(\d{2,6})\//;

/**
 * Parse a value as a positive number
 * @param value - Value to parse
 * @returns Positive number or null
 */
function parsePositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const n = Number.parseFloat(value);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return null;
}

/**
 * Extract dimensions from URL path pattern
 * @param url - URL to parse
 * @returns Dimension pair or null
 */
function extractDimensionsFromUrl(url?: string): DimensionPair | null {
  if (!url) {
    return null;
  }

  const match = url.match(VIDEO_DIMENSION_PATTERN);
  if (!match) {
    return null;
  }

  const width = Number.parseInt(match[1] ?? '', 10);
  const height = Number.parseInt(match[2] ?? '', 10);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
}

/**
 * Scale aspect ratio to standard height (720px)
 * @param w - Width ratio
 * @param h - Height ratio
 * @returns Scaled dimension pair
 */
function scaleAspectRatio(w: number, h: number): DimensionPair {
  return {
    height: 720,
    width: Math.max(1, Math.round((w / h) * 720)),
  };
}

/**
 * Extract dimensions from media metadata
 * Tries multiple sources in order of reliability
 * @param metadata - Media metadata object
 * @returns Dimension pair or null
 */
function deriveDimensionsFromMetadata(
  metadata: Record<string, unknown> | undefined,
): DimensionPair | null {
  if (!metadata) {
    return null;
  }

  // 1. Try direct dimensions object
  const dimensions = metadata.dimensions as Record<string, unknown> | undefined;
  if (dimensions) {
    const w = parsePositiveNumber(dimensions.width);
    const h = parsePositiveNumber(dimensions.height);
    if (w && h) {
      return { width: w, height: h };
    }
  }

  // 2. Try API data
  const apiData = metadata.apiData as Record<string, unknown> | undefined;
  if (!apiData) {
    return null;
  }

  // 2a. Try original_width/height
  const originalWidth = parsePositiveNumber(apiData['original_width'] ?? apiData['originalWidth']);
  const originalHeight = parsePositiveNumber(
    apiData['original_height'] ?? apiData['originalHeight'],
  );
  if (originalWidth && originalHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  // 2b. Try URL extraction
  const fromDownloadUrl = extractDimensionsFromUrl(apiData['download_url'] as string | undefined);
  if (fromDownloadUrl) {
    return fromDownloadUrl;
  }

  const fromPreviewUrl = extractDimensionsFromUrl(apiData['preview_url'] as string | undefined);
  if (fromPreviewUrl) {
    return fromPreviewUrl;
  }

  // 2c. Try aspect_ratio array
  const aspectRatio = apiData['aspect_ratio'];
  if (Array.isArray(aspectRatio) && aspectRatio.length >= 2) {
    const r1 = parsePositiveNumber(aspectRatio[0]);
    const r2 = parsePositiveNumber(aspectRatio[1]);
    if (r1 && r2) {
      return scaleAspectRatio(r1, r2);
    }
  }

  return null;
}

/**
 * Resolve media dimensions from all available sources
 *
 * Resolution order:
 * 1. Direct width/height properties on MediaInfo
 * 2. Metadata dimensions object
 * 3. API data original_width/height
 * 4. URL pattern extraction
 * 5. Aspect ratio conversion
 * 6. Default fallback (540x720)
 *
 * @param media - Media info object
 * @returns Resolved dimensions (never null)
 */
export function resolveMediaDimensions(media: MediaInfo | undefined): DimensionPair {
  if (!media) {
    return DEFAULT_DIMENSIONS;
  }

  // 1. Try direct properties
  const directWidth = parsePositiveNumber(media.width);
  const directHeight = parsePositiveNumber(media.height);
  if (directWidth && directHeight) {
    return { width: directWidth, height: directHeight };
  }

  // 2. Try metadata sources
  const fromMetadata = deriveDimensionsFromMetadata(
    media.metadata as Record<string, unknown> | undefined,
  );
  if (fromMetadata) {
    return fromMetadata;
  }

  // 3. Return default
  return DEFAULT_DIMENSIONS;
}

/**
 * Convert pixels to rem units
 * @param pixels - Value in pixels
 * @returns Value in rem as string
 */
export function toRem(pixels: number): string {
  return `${(pixels / 16).toFixed(4)}rem`;
}

/**
 * Calculate CSS properties for intrinsic sizing
 * @param dimensions - Width and height
 * @returns CSS properties object
 */
export function createIntrinsicSizingStyle(dimensions: DimensionPair): Record<string, string> {
  const ratio = dimensions.width / dimensions.height;
  return {
    '--xeg-aspect-default': `${dimensions.width} / ${dimensions.height}`,
    '--xeg-gallery-item-intrinsic-width': toRem(dimensions.width),
    '--xeg-gallery-item-intrinsic-height': toRem(dimensions.height),
    '--xeg-gallery-item-intrinsic-ratio': ratio.toFixed(6),
  };
}
