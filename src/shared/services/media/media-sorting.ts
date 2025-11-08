/**
 * Media Sorting and Visual Ordering Utilities
 *
 * @fileoverview Corrects Twitter API media ordering to match visual display.
 *
 * **Problem**:
 * Twitter API may return media in incorrect order. Example:
 * - 4-image grid visually shows: [0, 1, 2, 3]
 * - Twitter API returns: [0, 1, 3, 2] (out of order)
 * - Causes gallery to display in wrong sequence
 *
 * **Solution** (Phase 290.1):
 * - Extract visual index from expanded_url (/photo/N or /video/N)
 * - Sort media by extracted visual index
 * - Reassign index field to match sorted order
 *
 * **Performance**:
 * - O(n log n) time complexity (JavaScript sort)
 * - O(n) space complexity (temporary array)
 * - Typical: ~1ms for 4-image tweet
 *
 * **Use Cases**:
 * - Gallery display: Ensure media appears in visual order
 * - API response processing: Normalize before caching
 * - Download queue: Maintain user-visible sequence
 *
 * **Architecture Integration** (Phase 309):
 * - Part of media service layer
 * - Stateless utility (no lifecycle)
 * - Used by TwitterAPI and gallery components
 *
 * @example
 * ```typescript
 * // Before: [photo/1, photo/4, photo/2, photo/3]
 * const sorted = sortMediaByVisualOrder(unsorted);
 * // After: [photo/1, photo/2, photo/3, photo/4]
 * ```
 */

import type { TweetMediaEntry } from './types';

/**
 * Extract visual index from expanded_url
 *
 * Parses Twitter URL to find visual position in media grid.
 *
 * **URL Patterns**:
 * - Photo: `https://twitter.com/user/status/123/photo/1` → index 0
 * - Photo: `https://twitter.com/user/status/123/photo/4` → index 3
 * - Video: `https://twitter.com/user/status/123/video/2` → index 1
 *
 * **Algorithm**:
 * 1. Match /photo/N or /video/N pattern at end of URL
 * 2. Extract visual number (N) from pattern
 * 3. Convert to 0-based index (N - 1)
 * 4. Return 0 on parse failure (safe fallback)
 *
 * **Performance**:
 * - Regex match: O(1) for typical URLs
 * - No allocations on success
 * - Handles malformed URLs gracefully
 *
 * @param url - Expanded URL from Twitter API
 * @returns Zero-based visual index (0-3 for 4-image tweet, etc.)
 *
 * @example
 * ```typescript
 * extractVisualIndexFromUrl('https://twitter.com/user/status/123/photo/2')
 * // Returns 1 (0-based index for 2nd image)
 *
 * extractVisualIndexFromUrl('https://twitter.com/user/status/123/video/1')
 * // Returns 0 (0-based index for 1st video)
 * ```
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
 * Sort media by visual display order
 *
 * Corrects media ordering to match visual grid layout.
 *
 * **Background**:
 * Twitter API may return media in incorrect visual order. This function:
 * 1. Extracts visual index from each media's expanded_url
 * 2. Sorts media array by visual index
 * 3. Reassigns index field to match sorted order
 *
 * **Input Example**:
 * ```
 * [
 *   { id: 'a', expanded_url: '.../photo/1', index: 0 },
 *   { id: 'b', expanded_url: '.../photo/4', index: 1 },  // Wrong order!
 *   { id: 'c', expanded_url: '.../photo/2', index: 2 },
 *   { id: 'd', expanded_url: '.../photo/3', index: 3 },
 * ]
 * ```
 *
 * **Output Example**:
 * ```
 * [
 *   { id: 'a', expanded_url: '.../photo/1', index: 0 },
 *   { id: 'c', expanded_url: '.../photo/2', index: 1 },  // Corrected!
 *   { id: 'd', expanded_url: '.../photo/3', index: 2 },
 *   { id: 'b', expanded_url: '.../photo/4', index: 3 },
 * ]
 * ```
 *
 * **Algorithm** (Sorting Phase 290.1):
 * 1. Create temporary array with visual indices
 * 2. Sort by visual index (ascending)
 * 3. Reassign index field (0, 1, 2, ...)
 * 4. Return corrected array
 *
 * **Performance**:
 * - Time: O(n log n) where n = media count (typically 1-4)
 * - Space: O(n) temporary allocations
 * - Typical: < 1ms for 4-image tweet
 *
 * **Safety**:
 * - Handles empty arrays (returns unchanged)
 * - Handles single items (returns unchanged)
 * - Handles missing expanded_url (defaults to index 0)
 *
 * @param mediaItems - Array of media entries from Twitter API
 * @returns Sorted array with corrected visual order
 *
 * @example
 * ```typescript
 * const unsorted = [
 *   { id: '1', expanded_url: '.../photo/3', index: 0 },
 *   { id: '2', expanded_url: '.../photo/1', index: 1 },
 * ];
 *
 * const sorted = sortMediaByVisualOrder(unsorted);
 * // Result: [{ id: '2', ..., index: 0 }, { id: '1', ..., index: 1 }]
 * ```
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
