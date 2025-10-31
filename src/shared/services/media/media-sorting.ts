/**
 * @fileoverview Media Sorting Utilities
 * @description 미디어 시각적 순서 정렬 유틸리티
 * @version 1.0.0 - Phase 291: TwitterVideoExtractor 분할
 */

import type { TweetMediaEntry } from './types';

/**
 * Extract visual index from expanded_url
 * Examples:
 *   - "https://twitter.com/user/status/123/photo/1" -> 0
 *   - "https://twitter.com/user/status/123/photo/4" -> 3
 *   - "https://twitter.com/user/status/123/video/2" -> 1
 */
export function extractVisualIndexFromUrl(url: string): number {
  if (!url) {
    return 0;
  }

  // Match /photo/N or /video/N pattern
  const match = url.match(/\/(photo|video)\/(\d+)$/);
  const visualNumberStr = match?.[2];
  if (visualNumberStr) {
    const visualNumber = Number.parseInt(visualNumberStr, 10);
    // Convert to 0-based index (photo/1 -> index 0)
    return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
  }

  return 0;
}

/**
 * Phase 290.1: Sort media by visual order
 * Twitter API may return media in incorrect order (e.g., [0, 1, 3, 2] for 4-image grid)
 * This method extracts the visual index from expanded_url (/photo/N or /video/N) and sorts accordingly
 */
export function sortMediaByVisualOrder(mediaItems: TweetMediaEntry[]): TweetMediaEntry[] {
  if (mediaItems.length <= 1) {
    return mediaItems;
  }

  // Extract visual order index from expanded_url
  const withVisualIndex = mediaItems.map(media => {
    const visualIndex = extractVisualIndexFromUrl(media.expanded_url);
    return { media, visualIndex };
  });

  // Sort by visual index
  withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

  // Reassign index field to match sorted order
  const sorted = withVisualIndex.map(({ media }, newIndex) => ({
    ...media,
    index: newIndex,
  }));

  return sorted;
}
