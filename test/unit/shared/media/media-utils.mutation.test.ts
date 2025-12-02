import {
  extractVisualIndexFromUrl,
  extractDimensionsFromUrl,
  normalizeDimension,
  normalizeMediaUrl,
  adjustClickedIndexAfterDeduplication,
  removeDuplicateMediaItems,
} from '@shared/media/media-utils';
import type { MediaInfo } from '@shared/types';

describe('media-utils mutation tests', () => {
  describe('extractVisualIndexFromUrl', () => {
    it('should extract visual index from photo URL', () => {
      // photo/1 -> index 0
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/1')).toBe(0);
      // photo/2 -> index 1
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/2')).toBe(1);
    });

    it('should extract visual index from video URL', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/video/1')).toBe(0);
    });

    it('should return 0 for invalid URLs', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123')).toBe(0);
      expect(extractVisualIndexFromUrl('')).toBe(0);
    });

    it('should return 0 if the visual index is not at the end of the string', () => {
      // Targets regex anchor mutant ($)
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/2/extra')).toBe(0);
    });
  });

  describe('extractDimensionsFromUrl', () => {
    it('should extract dimensions from URL', () => {
      expect(extractDimensionsFromUrl('https://pbs.twimg.com/media/100x200/img.jpg')).toEqual({
        width: 100,
        height: 200,
      });
    });

    it('should return null if dimensions are missing', () => {
      expect(extractDimensionsFromUrl('https://pbs.twimg.com/media/img.jpg')).toBeNull();
    });

    it('should return null if dimensions are zero', () => {
      // Targets width <= 0 and height <= 0 mutants
      expect(extractDimensionsFromUrl('https://pbs.twimg.com/media/00x200/img.jpg')).toBeNull();
      expect(extractDimensionsFromUrl('https://pbs.twimg.com/media/100x00/img.jpg')).toBeNull();
    });
  });

  describe('normalizeDimension', () => {
    it('should normalize valid dimensions', () => {
      expect(normalizeDimension(100)).toBe(100);
      expect(normalizeDimension('100')).toBe(100);
    });

    it('should return undefined for invalid dimensions', () => {
      expect(normalizeDimension(0)).toBeUndefined();
      expect(normalizeDimension(-1)).toBeUndefined();
      expect(normalizeDimension('abc')).toBeUndefined();
      expect(normalizeDimension(null)).toBeUndefined();
      expect(normalizeDimension(undefined)).toBeUndefined();
    });
  });

  describe('normalizeMediaUrl', () => {
    it('should normalize URL with query parameters', () => {
      const url = 'https://pbs.twimg.com/media/F_xxxxxxxx.jpg?format=jpg&name=large';
      const normalized = normalizeMediaUrl(url);
      expect(normalized).toBe('F_xxxxxxxx');
    });

    it('should normalize URL with hash', () => {
      const url = 'https://pbs.twimg.com/media/F_xxxxxxxx.jpg#hash';
      const normalized = normalizeMediaUrl(url);
      expect(normalized).toBe('F_xxxxxxxx');
    });

    it('should handle URLs without protocol', () => {
      // Targets conditional expression mutants in fallback logic
      expect(normalizeMediaUrl('//pbs.twimg.com/media/img.jpg')).toBe('img');
    });

    it('should handle relative URLs with query parameters (fallback path)', () => {
      // Targets conditional expression mutants in catch block (queryIndex)
      expect(normalizeMediaUrl('/media/img.jpg?foo=bar')).toBe('img');
    });

    it('should handle relative URLs with hash (fallback path)', () => {
      // Targets conditional expression mutants in catch block (hashIndex)
      expect(normalizeMediaUrl('/media/img.jpg#hash')).toBe('img');
    });

    it('should return null for empty input', () => {
      expect(normalizeMediaUrl('')).toBeNull();
    });
  });

  describe('adjustClickedIndexAfterDeduplication', () => {
    it('should find correct index in unique list', () => {
      const originalItems = [{ url: 'a' }, { url: 'b' }, { url: 'c' }] as MediaInfo[];
      const uniqueItems = [{ url: 'a' }, { url: 'b' }, { url: 'c' }] as MediaInfo[];
      expect(adjustClickedIndexAfterDeduplication(originalItems, uniqueItems, 1)).toBe(1);
    });

    it('should handle duplicates', () => {
      const originalItems = [
        { url: 'a' },
        { url: 'a' }, // duplicate
        { url: 'b' },
      ] as MediaInfo[];
      const uniqueItems = [{ url: 'a' }, { url: 'b' }] as MediaInfo[];
      // Clicking the second 'a' (index 1) should map to 'a' in unique list (index 0)
      expect(adjustClickedIndexAfterDeduplication(originalItems, uniqueItems, 1)).toBe(0);
      // Clicking 'b' (index 2) should map to 'b' in unique list (index 1)
      expect(adjustClickedIndexAfterDeduplication(originalItems, uniqueItems, 2)).toBe(1);
    });

    it('should clamp out of bounds index', () => {
      const originalItems = [{ url: 'a' }] as MediaInfo[];
      const uniqueItems = [{ url: 'a' }] as MediaInfo[];
      expect(adjustClickedIndexAfterDeduplication(originalItems, uniqueItems, 5)).toBe(0);
      expect(adjustClickedIndexAfterDeduplication(originalItems, uniqueItems, -1)).toBe(0);
    });

    it('should return 0 if unique items empty', () => {
      expect(adjustClickedIndexAfterDeduplication([], [], 0)).toBe(0);
    });
  });

  describe('removeDuplicateMediaItems', () => {
    it('should remove duplicate media items based on originalUrl', () => {
      const items = [
        { url: 'a', originalUrl: 'orig-a' },
        { url: 'b', originalUrl: 'orig-a' }, // duplicate
        { url: 'c', originalUrl: 'orig-c' },
      ] as MediaInfo[];
      const result = removeDuplicateMediaItems(items);
      expect(result).toHaveLength(2);
      expect(result[0]?.url).toBe('a');
      expect(result[1]?.url).toBe('c');
    });

    it('should use url when originalUrl is missing', () => {
      const items = [
        { url: 'a' },
        { url: 'a' }, // duplicate
        { url: 'b' },
      ] as MediaInfo[];
      const result = removeDuplicateMediaItems(items);
      expect(result).toHaveLength(2);
      expect(result[0]?.url).toBe('a');
      expect(result[1]?.url).toBe('b');
    });

    it('should return empty array for empty input', () => {
      expect(removeDuplicateMediaItems([])).toEqual([]);
    });

    it('should handle null input gracefully', () => {
      // Targets !items?.length check
      expect(removeDuplicateMediaItems(null as unknown as MediaInfo[])).toEqual([]);
      expect(removeDuplicateMediaItems(undefined as unknown as MediaInfo[])).toEqual([]);
    });

    it('should handle null/undefined items gracefully', () => {
      const items = [null, undefined, { url: 'a' }] as unknown as MediaInfo[];
      const result = removeDuplicateMediaItems(items);
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe('a');
    });
  });
});
