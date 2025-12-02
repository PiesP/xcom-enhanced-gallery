import {
  adjustClickedIndexAfterDeduplication,
  extractDimensionsFromUrl,
  extractVisualIndexFromUrl,
  normalizeDimension,
  normalizeMediaUrl,
  removeDuplicateMediaItems,
  sortMediaByVisualOrder,
  toPositiveNumber,
} from '@shared/media/media-utils';
import { logger } from '@shared/logging';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo } from '@shared/types/media.types';

// Mock logger for testing
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('media-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('__DEV__', true); // Default to true for tests
  });

  describe('removeDuplicateMediaItems', () => {
    it('should remove duplicate media items based on originalUrl', () => {
      const items: MediaInfo[] = [
        { id: '1', url: 'url1', originalUrl: 'orig1', type: 'image' } as MediaInfo,
        { id: '2', url: 'url2', originalUrl: 'orig2', type: 'image' } as MediaInfo,
        { id: '3', url: 'url3', originalUrl: 'orig1', type: 'image' } as MediaInfo, // Duplicate
      ];

      const result = removeDuplicateMediaItems(items);
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('1');
      expect(result[1]?.id).toBe('2');
    });

    it('should use url when originalUrl is missing', () => {
      const items: MediaInfo[] = [
        { id: '1', url: 'url1', type: 'image' } as MediaInfo,
        { id: '2', url: 'url1', type: 'image' } as MediaInfo, // Duplicate by url
        { id: '3', url: 'url2', type: 'image' } as MediaInfo,
      ];

      const result = removeDuplicateMediaItems(items);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty input', () => {
      const result = removeDuplicateMediaItems([]);
      expect(result).toHaveLength(0);
    });

    it('should handle null/undefined items gracefully', () => {
      const items = [
        { id: '1', url: 'url1', originalUrl: 'orig1', type: 'image' } as MediaInfo,
        null as unknown as MediaInfo,
        { id: '2', url: 'url2', originalUrl: 'orig2', type: 'image' } as MediaInfo,
      ];

      const result = removeDuplicateMediaItems(items);
      expect(result).toHaveLength(2);
    });

    it('should preserve original order', () => {
      const items: MediaInfo[] = [
        { id: '3', url: 'url3', originalUrl: 'orig3', type: 'image' } as MediaInfo,
        { id: '1', url: 'url1', originalUrl: 'orig1', type: 'image' } as MediaInfo,
        { id: '2', url: 'url2', originalUrl: 'orig2', type: 'image' } as MediaInfo,
      ];

      const result = removeDuplicateMediaItems(items);
      expect(result[0]?.id).toBe('3');
      expect(result[1]?.id).toBe('1');
      expect(result[2]?.id).toBe('2');
    });

    it('should handle items without url key', () => {
      const items = [
        { id: '1', url: 'url1', type: 'image' } as MediaInfo,
        { id: '2', type: 'image' } as unknown as MediaInfo, // Missing url
      ];

      const result = removeDuplicateMediaItems(items);
      // Item without url should be skipped due to empty key
      expect(result).toHaveLength(1);
    });

    it('should handle undefined input', () => {
      const result = removeDuplicateMediaItems(undefined as unknown as MediaInfo[]);
      expect(result).toEqual([]);
    });

    describe('logging behavior', () => {
      const itemsWithDuplicates: MediaInfo[] = [
        { id: '1', url: 'url1', originalUrl: 'orig1', type: 'image' } as MediaInfo,
        { id: '2', url: 'url1', originalUrl: 'orig1', type: 'image' } as MediaInfo,
      ];

      const itemsWithoutDuplicates: MediaInfo[] = [
        { id: '1', url: 'url1', originalUrl: 'orig1', type: 'image' } as MediaInfo,
      ];

      it('should log debug message when duplicates removed in DEV mode', () => {
        vi.stubGlobal('__DEV__', true);
        removeDuplicateMediaItems(itemsWithDuplicates);
        expect(logger.debug).toHaveBeenCalledWith(
          'Removed duplicate media items:',
          expect.objectContaining({ removed: 1 })
        );
      });

      it('should NOT log debug message when duplicates removed in PROD mode', () => {
        vi.stubGlobal('__DEV__', false);
        removeDuplicateMediaItems(itemsWithDuplicates);
        expect(logger.debug).not.toHaveBeenCalled();
      });

      it('should NOT log debug message when NO duplicates removed in DEV mode', () => {
        vi.stubGlobal('__DEV__', true);
        removeDuplicateMediaItems(itemsWithoutDuplicates);
        expect(logger.debug).not.toHaveBeenCalled();
      });
    });
  });

  describe('extractVisualIndexFromUrl', () => {
    it('should extract visual index from photo URL', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/1')).toBe(0);
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/2')).toBe(1);
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/4')).toBe(3);
    });

    it('should extract visual index from video URL', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/video/1')).toBe(0);
    });

    it('should handle multi-digit visual index', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/12')).toBe(11);
    });

    it('should handle zero visual index (invalid case returning 0)', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/0')).toBe(0);
    });

    it('should return 0 for invalid URLs', () => {
      expect(extractVisualIndexFromUrl('')).toBe(0);
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123')).toBe(0);
      expect(extractVisualIndexFromUrl('invalid-url')).toBe(0);
    });

    it('should return 0 for non-numeric index', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/abc')).toBe(0);
    });
  });

  describe('sortMediaByVisualOrder', () => {
    it('should sort media items by visual index', () => {
      const items = [
        { expanded_url: 'https://x.com/u/s/1/photo/3', media_id: '3' },
        { expanded_url: 'https://x.com/u/s/1/photo/1', media_id: '1' },
        { expanded_url: 'https://x.com/u/s/1/photo/2', media_id: '2' },
      ] as unknown as TweetMediaEntry[];

      const sorted = sortMediaByVisualOrder(items);
      expect(sorted).toHaveLength(3);
      expect(sorted[0]!.media_id).toBe('1');
      expect(sorted[1]!.media_id).toBe('2');
      expect(sorted[2]!.media_id).toBe('3');
    });

    it('should update index property', () => {
      const items = [
        { expanded_url: 'https://x.com/u/s/1/photo/2', media_id: '2' },
        { expanded_url: 'https://x.com/u/s/1/photo/1', media_id: '1' },
      ] as unknown as TweetMediaEntry[];

      const sorted = sortMediaByVisualOrder(items);
      expect(sorted[0]!.index).toBe(0);
      expect(sorted[1]!.index).toBe(1);
    });

    it('should handle empty or single item arrays', () => {
      expect(sortMediaByVisualOrder([])).toEqual([]);
      const single = [{ expanded_url: 'url', media_id: '1' }] as unknown as TweetMediaEntry[];
      expect(sortMediaByVisualOrder(single)).toEqual(single);
    });
  });

  describe('extractDimensionsFromUrl', () => {
    it('should extract dimensions from URL pattern', () => {
      expect(
        extractDimensionsFromUrl('https://pbs.twimg.com/media/img.jpg?name=1200x800')
      ).toBeNull(); // Query param not handled by regex
      expect(extractDimensionsFromUrl('https://pbs.twimg.com/media/1200x800/img.jpg')).toEqual({
        width: 1200,
        height: 800,
      });
      // The regex is /\/(\d{2,6})x(\d{2,6})\//
      expect(extractDimensionsFromUrl('/path/1920x1080/image.jpg')).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it('should return null for invalid patterns', () => {
      expect(extractDimensionsFromUrl('https://example.com/image.jpg')).toBeNull();
      expect(extractDimensionsFromUrl('/path/10x/image.jpg')).toBeNull();
    });

    it('should return null for invalid dimensions', () => {
      expect(extractDimensionsFromUrl('/path/0x100/img.jpg')).toBeNull();
    });
  });

  describe('normalizeDimension', () => {
    it('should normalize numbers', () => {
      expect(normalizeDimension(100)).toBe(100);
      expect(normalizeDimension(100.5)).toBe(101);
    });

    it('should normalize strings', () => {
      expect(normalizeDimension('100')).toBe(100);
      expect(normalizeDimension('100.5')).toBe(101);
    });

    it('should return undefined for invalid inputs', () => {
      expect(normalizeDimension(0)).toBeUndefined();
      expect(normalizeDimension('0')).toBeUndefined();
      expect(normalizeDimension(-1)).toBeUndefined();
      expect(normalizeDimension('abc')).toBeUndefined();
      expect(normalizeDimension(null)).toBeUndefined();
      expect(normalizeDimension(undefined)).toBeUndefined();
    });
  });

  describe('toPositiveNumber', () => {
    it('should return number for valid input', () => {
      expect(toPositiveNumber(100)).toBe(100);
      expect(toPositiveNumber('50')).toBe(50);
    });

    it('should return null for invalid input', () => {
      expect(toPositiveNumber(0)).toBeNull();
      expect(toPositiveNumber('abc')).toBeNull();
    });
  });

  describe('normalizeMediaUrl', () => {
    it('should extract filename from URL', () => {
      expect(normalizeMediaUrl('https://example.com/path/image.jpg')).toBe('image');
      expect(normalizeMediaUrl('https://example.com/path/image.jpg?foo=bar')).toBe('image');
      expect(normalizeMediaUrl('https://example.com/path/image.jpg#hash')).toBe('image');
    });

    it('should handle URLs without protocol', () => {
      // The implementation uses new URL() first, which might fail for relative paths without base
      // Then it falls back to string manipulation
      expect(normalizeMediaUrl('/path/image.jpg')).toBe('image');
    });

    it('should return null for empty or invalid inputs', () => {
      expect(normalizeMediaUrl('')).toBeNull();
    });
  });

  describe('adjustClickedIndexAfterDeduplication', () => {
    const item1 = { url: 'url1', originalUrl: 'orig1' } as MediaInfo;
    const item2 = { url: 'url2', originalUrl: 'orig2' } as MediaInfo;
    const item3 = { url: 'url3', originalUrl: 'orig3' } as MediaInfo;
    const itemDuplicate = { url: 'url1', originalUrl: 'orig1' } as MediaInfo;

    it('should find correct index in unique list', () => {
      const original = [item1, item2, item3];
      const unique = [item1, item2, item3];

      expect(adjustClickedIndexAfterDeduplication(original, unique, 1)).toBe(1);
    });

    it('should handle duplicates', () => {
      const original = [item1, itemDuplicate, item2];
      const unique = [item1, item2];

      // Clicking the duplicate (index 1) should map to the first instance (index 0)
      expect(adjustClickedIndexAfterDeduplication(original, unique, 1)).toBe(0);

      // Clicking item2 (index 2) should map to index 1 in unique list
      expect(adjustClickedIndexAfterDeduplication(original, unique, 2)).toBe(1);
    });

    it('should clamp out of bounds index', () => {
      const original = [item1];
      const unique = [item1];

      expect(adjustClickedIndexAfterDeduplication(original, unique, 100)).toBe(0);
      expect(adjustClickedIndexAfterDeduplication(original, unique, -1)).toBe(0);
    });

    it('should return 0 if unique list is empty', () => {
      expect(adjustClickedIndexAfterDeduplication([item1], [], 0)).toBe(0);
    });

    it('should return 0 if item not found (fallback)', () => {
      const original = [item1];
      const unique = [item2]; // item1 not in unique
      expect(adjustClickedIndexAfterDeduplication(original, unique, 0)).toBe(0);
    });
  });
});
