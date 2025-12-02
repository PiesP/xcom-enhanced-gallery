/**
 * @fileoverview Additional mutation coverage tests for media-utils.ts
 * Focus: Conditional expressions, logical operators, and equality operators
 */
import {
  extractVisualIndexFromUrl,
  extractDimensionsFromUrl,
  normalizeDimension,
  toPositiveNumber,
  normalizeMediaUrl,
  adjustClickedIndexAfterDeduplication,
  removeDuplicateMediaItems,
  sortMediaByVisualOrder,
} from '@shared/media/media-utils';
import type { MediaInfo } from '@shared/types';
import type { TweetMediaEntry } from '@shared/services/media/types';

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('media-utils mutation killers', () => {
  describe('extractVisualIndexFromUrl mutations', () => {
    it('kills !url -> url mutation', () => {
      // Empty string should return 0
      expect(extractVisualIndexFromUrl('')).toBe(0);
      // Undefined coerced to empty should also return 0
      expect(extractVisualIndexFromUrl(undefined as unknown as string)).toBe(0);
    });

    it('kills visualNumber > 0 -> visualNumber >= 0 mutation', () => {
      // photo/0 would give NaN which fails isFinite
      // So we need something that parses to 0
      // Actually the regex only matches digits, and Number.parseInt('0') = 0
      // 0 > 0 is false, so it returns 0
      // 0 >= 0 would be true, returning -1
      // URL pattern /photo/0 -> would return 0 (since 0-1 = -1 but fails > 0 check)
      expect(extractVisualIndexFromUrl('https://x.com/status/123/photo/0')).toBe(0);
    });

    it('kills match && match[2] -> true mutation', () => {
      // No match should return 0
      expect(extractVisualIndexFromUrl('https://x.com/status/123')).toBe(0);
    });

    it('kills Number.isFinite check', () => {
      // NaN should cause return 0
      // This happens when regex doesn't match
      expect(extractVisualIndexFromUrl('https://x.com/photo/abc')).toBe(0);
    });
  });

  describe('normalizeDimension mutations', () => {
    it('kills typeof value === "number" -> true mutation', () => {
      expect(normalizeDimension('100')).toBe(100);
      expect(normalizeDimension(null)).toBeUndefined();
    });

    it('kills Number.isFinite(value) check for number', () => {
      expect(normalizeDimension(Infinity)).toBeUndefined();
      expect(normalizeDimension(-Infinity)).toBeUndefined();
      expect(normalizeDimension(NaN)).toBeUndefined();
    });

    it('kills value > 0 -> value >= 0 mutation', () => {
      expect(normalizeDimension(0)).toBeUndefined();
      expect(normalizeDimension(0.1)).toBe(0); // rounds to 0
      expect(normalizeDimension(0.5)).toBe(1); // rounds to 1
    });

    it('kills typeof value === "string" -> true mutation', () => {
      expect(normalizeDimension({})).toBeUndefined();
      expect(normalizeDimension([])).toBeUndefined();
    });

    it('kills Number.isFinite(parsed) check for string', () => {
      expect(normalizeDimension('Infinity')).toBeUndefined();
      expect(normalizeDimension('NaN')).toBeUndefined();
    });

    it('kills parsed > 0 -> parsed >= 0 mutation', () => {
      expect(normalizeDimension('0')).toBeUndefined();
      expect(normalizeDimension('-5')).toBeUndefined();
    });
  });

  describe('toPositiveNumber mutations', () => {
    it('kills result === undefined -> true mutation', () => {
      expect(toPositiveNumber(100)).toBe(100);
      expect(toPositiveNumber(undefined)).toBeNull();
    });
  });

  describe('normalizeMediaUrl mutations', () => {
    it('kills !url -> url mutation', () => {
      expect(normalizeMediaUrl('')).toBeNull();
      expect(normalizeMediaUrl(null as unknown as string)).toBeNull();
    });

    it('kills filename && filename.length > 0 -> true mutation', () => {
      // URL with just slash
      expect(normalizeMediaUrl('https://example.com/')).toBeNull();
    });

    it('kills dotIndex !== -1 -> true mutation', () => {
      // File without extension
      expect(normalizeMediaUrl('https://example.com/filename')).toBe('filename');
    });

    it('handles urls without slash in fallback', () => {
      // String without any slash - will use lastIndexOf('/') = -1 path
      // When lastSlash === -1, returns null
      const noSlashUrl = 'filename.jpg';
      expect(normalizeMediaUrl(noSlashUrl)).toBeNull();
    });

    it('kills queryIndex !== -1 -> true mutation in fallback', () => {
      // Test fallback path with query
      const invalidUrl = '[invalid]/path/file.jpg?query=1';
      expect(normalizeMediaUrl(invalidUrl)).toBe('file');
    });

    it('kills hashIndex !== -1 -> true mutation in fallback', () => {
      // Test fallback path with hash
      const invalidUrl = '[invalid]/path/file.jpg#hash';
      expect(normalizeMediaUrl(invalidUrl)).toBe('file');
    });

    it('kills filenamePart.length > 0 -> true mutation in fallback', () => {
      // Empty filename after slash in fallback
      const invalidUrl = '[invalid]/path/';
      expect(normalizeMediaUrl(invalidUrl)).toBeNull();
    });
  });

  describe('adjustClickedIndexAfterDeduplication mutations', () => {
    it('kills uniqueItems.length === 0 -> true mutation', () => {
      const items = [{ url: 'a' }] as MediaInfo[];
      expect(adjustClickedIndexAfterDeduplication(items, items, 0)).toBe(0);
    });

    it('kills !clickedItem -> true mutation', () => {
      // This happens when safeOriginalIndex points to undefined
      const items = [{ url: 'a' }] as MediaInfo[];
      // clampIndex should prevent this, but test edge case
      expect(adjustClickedIndexAfterDeduplication([], items, 0)).toBe(0);
    });

    it('kills newIndex >= 0 -> newIndex > 0 mutation', () => {
      const items = [{ url: 'a' }, { url: 'b' }] as MediaInfo[];
      // Index 0 should return 0
      expect(adjustClickedIndexAfterDeduplication(items, items, 0)).toBe(0);
    });

    it('kills itemKey === clickedKey -> true mutation', () => {
      const original = [{ url: 'a' }, { url: 'b' }] as MediaInfo[];
      const unique = [{ url: 'a' }, { url: 'b' }] as MediaInfo[];
      // Should find exact match
      expect(adjustClickedIndexAfterDeduplication(original, unique, 1)).toBe(1);
    });

    it('should use originalUrl when available', () => {
      const original = [
        { url: 'a', originalUrl: 'orig-a' },
        { url: 'b', originalUrl: 'orig-b' },
      ] as MediaInfo[];
      const unique = [
        { url: 'a', originalUrl: 'orig-a' },
        { url: 'b', originalUrl: 'orig-b' },
      ] as MediaInfo[];
      expect(adjustClickedIndexAfterDeduplication(original, unique, 1)).toBe(1);
    });
  });

  describe('sortMediaByVisualOrder mutations', () => {
    it('kills mediaItems.length <= 1 -> true mutation', () => {
      const items: TweetMediaEntry[] = [];
      expect(sortMediaByVisualOrder(items)).toEqual([]);

      const single: TweetMediaEntry[] = [{ expanded_url: 'https://x.com/photo/1' }] as TweetMediaEntry[];
      expect(sortMediaByVisualOrder(single)).toEqual(single);
    });

    it('should sort multiple items by visual index', () => {
      const items: TweetMediaEntry[] = [
        { expanded_url: 'https://x.com/photo/2' },
        { expanded_url: 'https://x.com/photo/1' },
        { expanded_url: 'https://x.com/photo/3' },
      ] as TweetMediaEntry[];

      const sorted = sortMediaByVisualOrder(items);

      expect(sorted[0]?.expanded_url).toBe('https://x.com/photo/1');
      expect(sorted[1]?.expanded_url).toBe('https://x.com/photo/2');
      expect(sorted[2]?.expanded_url).toBe('https://x.com/photo/3');
    });

    it('should assign new index after sorting', () => {
      const items: TweetMediaEntry[] = [
        { expanded_url: 'https://x.com/photo/2' },
        { expanded_url: 'https://x.com/photo/1' },
      ] as TweetMediaEntry[];

      const sorted = sortMediaByVisualOrder(items);

      expect(sorted[0]?.index).toBe(0);
      expect(sorted[1]?.index).toBe(1);
    });

    it('should handle missing expanded_url', () => {
      const items: TweetMediaEntry[] = [
        { expanded_url: 'https://x.com/photo/2' },
        {}, // no expanded_url
      ] as TweetMediaEntry[];

      const sorted = sortMediaByVisualOrder(items);
      expect(sorted).toHaveLength(2);
    });
  });

  describe('removeDuplicateMediaItems mutations', () => {
    it('kills !mediaItems?.length -> true mutation', () => {
      expect(removeDuplicateMediaItems([])).toEqual([]);
      expect(removeDuplicateMediaItems(null as unknown as MediaInfo[])).toEqual([]);
    });

    it('kills !item -> true mutation in removeDuplicates', () => {
      const items = [null, { url: 'a' }] as unknown as MediaInfo[];
      expect(removeDuplicateMediaItems(items)).toHaveLength(1);
    });

    it('kills !key -> true mutation in removeDuplicates', () => {
      // Item without url or originalUrl
      const items = [{} as MediaInfo, { url: 'a' } as MediaInfo];
      const result = removeDuplicateMediaItems(items);
      // Should skip item without key
      expect(result).toHaveLength(1);
    });

    it('kills !seen.has(key) -> true mutation', () => {
      const items = [{ url: 'a' }, { url: 'a' }] as MediaInfo[];
      const result = removeDuplicateMediaItems(items);
      expect(result).toHaveLength(1);
    });
  });

  describe('extractDimensionsFromUrl mutations', () => {
    it('kills !url -> url mutation', () => {
      expect(extractDimensionsFromUrl('')).toBeNull();
    });

    it('kills !match -> true mutation', () => {
      expect(extractDimensionsFromUrl('https://example.com/img.jpg')).toBeNull();
    });

    it('kills !Number.isFinite(width) -> true mutation', () => {
      // Width is NaN - can't happen with \\d regex, but test parseInt edge
      expect(extractDimensionsFromUrl('https://example.com/NaNx100/img.jpg')).toBeNull();
    });

    it('kills width <= 0 -> width < 0 mutation', () => {
      expect(extractDimensionsFromUrl('https://example.com/00x100/img.jpg')).toBeNull();
    });

    it('kills height <= 0 -> height < 0 mutation', () => {
      expect(extractDimensionsFromUrl('https://example.com/100x00/img.jpg')).toBeNull();
    });

    it('should return valid dimensions', () => {
      const result = extractDimensionsFromUrl('https://example.com/1920x1080/img.jpg');
      expect(result).toEqual({ width: 1920, height: 1080 });
    });
  });
});
