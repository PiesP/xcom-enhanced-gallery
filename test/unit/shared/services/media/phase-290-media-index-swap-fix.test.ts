/**
 * @fileoverview Phase 290.1: Media Index Swap Fix - 3rd and 4th Image Order Correction
 * @description Test to verify that clicking 3rd/4th images in Twitter opens correct image in gallery
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';

describe('Phase 290.1 - Media Index Swap Fix', () => {
  setupGlobalTestIsolation();

  describe('Visual Order Extraction from expanded_url', () => {
    it('should extract correct visual index from /photo/N URL', () => {
      // Simulate the extractVisualIndexFromUrl logic
      const extractVisualIndex = (url: string): number => {
        if (!url) return 0;
        const match = url.match(/\/(photo|video)\/(\d+)$/);
        const visualNumberStr = match?.[2];
        if (visualNumberStr) {
          const visualNumber = Number.parseInt(visualNumberStr, 10);
          return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
        }
        return 0;
      };

      // Test cases
      expect(extractVisualIndex('https://twitter.com/user/status/123/photo/1')).toBe(0);
      expect(extractVisualIndex('https://twitter.com/user/status/123/photo/2')).toBe(1);
      expect(extractVisualIndex('https://twitter.com/user/status/123/photo/3')).toBe(2);
      expect(extractVisualIndex('https://twitter.com/user/status/123/photo/4')).toBe(3);
    });

    it('should extract correct visual index from /video/N URL', () => {
      const extractVisualIndex = (url: string): number => {
        if (!url) return 0;
        const match = url.match(/\/(photo|video)\/(\d+)$/);
        const visualNumberStr = match?.[2];
        if (visualNumberStr) {
          const visualNumber = Number.parseInt(visualNumberStr, 10);
          return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
        }
        return 0;
      };

      expect(extractVisualIndex('https://twitter.com/user/status/123/video/1')).toBe(0);
      expect(extractVisualIndex('https://twitter.com/user/status/123/video/2')).toBe(1);
    });

    it('should return 0 for URLs without photo/video pattern', () => {
      const extractVisualIndex = (url: string): number => {
        if (!url) return 0;
        const match = url.match(/\/(photo|video)\/(\d+)$/);
        const visualNumberStr = match?.[2];
        if (visualNumberStr) {
          const visualNumber = Number.parseInt(visualNumberStr, 10);
          return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
        }
        return 0;
      };

      expect(extractVisualIndex('')).toBe(0);
      expect(extractVisualIndex('https://twitter.com/user/status/123')).toBe(0);
      expect(extractVisualIndex('https://twitter.com/user/status/123/photo/0')).toBe(0);
      expect(extractVisualIndex('https://twitter.com/user/status/123/photo/-1')).toBe(0);
    });
  });

  describe('Media Array Sorting by Visual Order', () => {
    it('should sort media in correct visual order when API returns [0,1,3,2]', () => {
      // Mock TweetMediaEntry-like objects
      interface MockMediaEntry {
        expanded_url: string;
        index: number;
        download_url: string;
      }

      const sortMediaByVisualOrder = (mediaItems: MockMediaEntry[]): MockMediaEntry[] => {
        if (mediaItems.length <= 1) {
          return mediaItems;
        }

        const extractVisualIndex = (url: string): number => {
          if (!url) return 0;
          const match = url.match(/\/(photo|video)\/(\d+)$/);
          const visualNumberStr = match?.[2];
          if (visualNumberStr) {
            const visualNumber = Number.parseInt(visualNumberStr, 10);
            return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
          }
          return 0;
        };

        const withVisualIndex = mediaItems.map(media => ({
          media,
          visualIndex: extractVisualIndex(media.expanded_url),
        }));

        withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

        return withVisualIndex.map(({ media }, newIndex) => ({
          ...media,
          index: newIndex,
        }));
      };

      // Simulate Twitter API returning media in wrong order: [0, 1, 3, 2]
      const apiMedias: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/1',
          index: 0,
          download_url: 'https://pbs.twimg.com/media/img1.jpg',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/2',
          index: 1,
          download_url: 'https://pbs.twimg.com/media/img2.jpg',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/4', // ← Swapped!
          index: 2,
          download_url: 'https://pbs.twimg.com/media/img4.jpg',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/3', // ← Swapped!
          index: 3,
          download_url: 'https://pbs.twimg.com/media/img3.jpg',
        },
      ];

      const sorted = sortMediaByVisualOrder(apiMedias);

      // After sorting, indices should be reassigned correctly
      expect(sorted[0].expanded_url).toContain('/photo/1');
      expect(sorted[0].index).toBe(0);

      expect(sorted[1].expanded_url).toContain('/photo/2');
      expect(sorted[1].index).toBe(1);

      expect(sorted[2].expanded_url).toContain('/photo/3'); // ← Fixed!
      expect(sorted[2].index).toBe(2);

      expect(sorted[3].expanded_url).toContain('/photo/4'); // ← Fixed!
      expect(sorted[3].index).toBe(3);

      // Verify download URLs are in correct order
      expect(sorted[2].download_url).toBe('https://pbs.twimg.com/media/img3.jpg');
      expect(sorted[3].download_url).toBe('https://pbs.twimg.com/media/img4.jpg');
    });

    it('should handle single media without sorting', () => {
      interface MockMediaEntry {
        expanded_url: string;
        index: number;
      }

      const sortMediaByVisualOrder = (mediaItems: MockMediaEntry[]): MockMediaEntry[] => {
        if (mediaItems.length <= 1) {
          return mediaItems;
        }
        return mediaItems; // Simplified for single item
      };

      const singleMedia: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/1',
          index: 0,
        },
      ];

      const result = sortMediaByVisualOrder(singleMedia);
      expect(result).toEqual(singleMedia);
      expect(result[0].index).toBe(0);
    });

    it('should maintain order when media is already correctly ordered', () => {
      interface MockMediaEntry {
        expanded_url: string;
        index: number;
      }

      const sortMediaByVisualOrder = (mediaItems: MockMediaEntry[]): MockMediaEntry[] => {
        if (mediaItems.length <= 1) {
          return mediaItems;
        }

        const extractVisualIndex = (url: string): number => {
          if (!url) return 0;
          const match = url.match(/\/(photo|video)\/(\d+)$/);
          const visualNumberStr = match?.[2];
          if (visualNumberStr) {
            const visualNumber = Number.parseInt(visualNumberStr, 10);
            return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
          }
          return 0;
        };

        const withVisualIndex = mediaItems.map(media => ({
          media,
          visualIndex: extractVisualIndex(media.expanded_url),
        }));

        withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

        return withVisualIndex.map(({ media }, newIndex) => ({
          ...media,
          index: newIndex,
        }));
      };

      const correctlyOrdered: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/1',
          index: 0,
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/2',
          index: 1,
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/3',
          index: 2,
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/4',
          index: 3,
        },
      ];

      const result = sortMediaByVisualOrder(correctlyOrdered);

      expect(result[0].index).toBe(0);
      expect(result[1].index).toBe(1);
      expect(result[2].index).toBe(2);
      expect(result[3].index).toBe(3);
    });
  });

  describe('Regression Test: Bug Fix Scenario', () => {
    it('should fix the swap bug where clicking 3rd image shows 4th and vice versa', () => {
      // This test documents the exact bug scenario reported by user:
      // - Click Twitter's 3rd image → Gallery shows 4th
      // - Click Twitter's 4th image → Gallery shows 3rd

      interface MockMediaEntry {
        expanded_url: string;
        index: number;
        visualLabel: string;
      }

      const sortMediaByVisualOrder = (mediaItems: MockMediaEntry[]): MockMediaEntry[] => {
        if (mediaItems.length <= 1) {
          return mediaItems;
        }

        const extractVisualIndex = (url: string): number => {
          if (!url) return 0;
          const match = url.match(/\/(photo|video)\/(\d+)$/);
          const visualNumberStr = match?.[2];
          if (visualNumberStr) {
            const visualNumber = Number.parseInt(visualNumberStr, 10);
            return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
          }
          return 0;
        };

        const withVisualIndex = mediaItems.map(media => ({
          media,
          visualIndex: extractVisualIndex(media.expanded_url),
        }));

        withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

        return withVisualIndex.map(({ media }, newIndex) => ({
          ...media,
          index: newIndex,
        }));
      };

      // Simulate buggy API response
      const buggyApiResponse: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/1',
          index: 0,
          visualLabel: '1st',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/2',
          index: 1,
          visualLabel: '2nd',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/4',
          index: 2,
          visualLabel: '4th (wrong position)',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/3',
          index: 3,
          visualLabel: '3rd (wrong position)',
        },
      ];

      const fixed = sortMediaByVisualOrder(buggyApiResponse);

      // Verify fix:
      // User clicks Twitter's 3rd image (visual position 3) -> should show gallery index 2
      const thirdImageInGallery = fixed.find(m => m.expanded_url.includes('/photo/3'));
      expect(thirdImageInGallery?.index).toBe(2); // ✅ Fixed: was 3, now 2

      // User clicks Twitter's 4th image (visual position 4) -> should show gallery index 3
      const fourthImageInGallery = fixed.find(m => m.expanded_url.includes('/photo/4'));
      expect(fourthImageInGallery?.index).toBe(3); // ✅ Fixed: was 2, now 3
    });
  });

  describe('Phase 290.2 - Quoted Tweet Index Adjustment', () => {
    interface MockMediaEntry {
      expanded_url: string;
      index: number;
      visualLabel: string;
      tweet_id: string;
    }

    it('should not overlap indices when combining quoted tweet and original tweet', () => {
      // Simulate sortMediaByVisualOrder function
      const sortMediaByVisualOrder = (mediaItems: MockMediaEntry[]): MockMediaEntry[] => {
        if (mediaItems.length <= 1) {
          return mediaItems;
        }

        const extractVisualIndex = (url: string): number => {
          if (!url) return 0;
          const match = url.match(/\/(photo|video)\/(\d+)$/);
          const visualNumberStr = match?.[2];
          if (visualNumberStr) {
            const visualNumber = Number.parseInt(visualNumberStr, 10);
            return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
          }
          return 0;
        };

        const withVisualIndex = mediaItems.map(media => ({
          media,
          visualIndex: extractVisualIndex(media.expanded_url),
        }));

        withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

        return withVisualIndex.map(({ media }, newIndex) => ({
          ...media,
          index: newIndex,
        }));
      };

      // Quoted tweet has 2 images
      const quotedMedia: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/quoted_user/status/999/photo/1',
          index: 0,
          visualLabel: 'Quoted 1st',
          tweet_id: '999',
        },
        {
          expanded_url: 'https://twitter.com/quoted_user/status/999/photo/2',
          index: 1,
          visualLabel: 'Quoted 2nd',
          tweet_id: '999',
        },
      ];

      // Original tweet has 3 images
      const originalMedia: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/1',
          index: 0,
          visualLabel: 'Original 1st',
          tweet_id: '123',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/2',
          index: 1,
          visualLabel: 'Original 2nd',
          tweet_id: '123',
        },
        {
          expanded_url: 'https://twitter.com/user/status/123/photo/3',
          index: 2,
          visualLabel: 'Original 3rd',
          tweet_id: '123',
        },
      ];

      // Sort each independently
      const sortedQuoted = sortMediaByVisualOrder(quotedMedia);
      const sortedOriginal = sortMediaByVisualOrder(originalMedia);

      // Phase 290.2: Adjust original indices to prevent overlap
      const adjustedOriginal = sortedOriginal.map(media => ({
        ...media,
        index: media.index + sortedQuoted.length,
      }));

      // Combine: quoted first, then original
      const combined = [...sortedQuoted, ...adjustedOriginal];

      // Verify no index overlap
      const indices = combined.map(m => m.index);
      const uniqueIndices = new Set(indices);
      expect(uniqueIndices.size).toBe(indices.length); // All indices should be unique

      // Verify quoted tweet: index 0, 1
      expect(sortedQuoted[0]?.index).toBe(0);
      expect(sortedQuoted[1]?.index).toBe(1);

      // Verify original tweet: index 2, 3, 4 (shifted by quoted length)
      expect(adjustedOriginal[0]?.index).toBe(2);
      expect(adjustedOriginal[1]?.index).toBe(3);
      expect(adjustedOriginal[2]?.index).toBe(4);

      // Verify combined array
      expect(combined.length).toBe(5);
      expect(combined[0]?.tweet_id).toBe('999'); // Quoted 1st
      expect(combined[1]?.tweet_id).toBe('999'); // Quoted 2nd
      expect(combined[2]?.tweet_id).toBe('123'); // Original 1st
      expect(combined[3]?.tweet_id).toBe('123'); // Original 2nd
      expect(combined[4]?.tweet_id).toBe('123'); // Original 3rd
    });

    it('should handle quoted tweet with swapped 3rd/4th images correctly', () => {
      const sortMediaByVisualOrder = (mediaItems: MockMediaEntry[]): MockMediaEntry[] => {
        if (mediaItems.length <= 1) {
          return mediaItems;
        }

        const extractVisualIndex = (url: string): number => {
          if (!url) return 0;
          const match = url.match(/\/(photo|video)\/(\d+)$/);
          const visualNumberStr = match?.[2];
          if (visualNumberStr) {
            const visualNumber = Number.parseInt(visualNumberStr, 10);
            return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
          }
          return 0;
        };

        const withVisualIndex = mediaItems.map(media => ({
          media,
          visualIndex: extractVisualIndex(media.expanded_url),
        }));

        withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

        return withVisualIndex.map(({ media }, newIndex) => ({
          ...media,
          index: newIndex,
        }));
      };

      // Quoted tweet has 4 images with buggy API order (3rd and 4th swapped)
      const buggyQuotedMedia: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/quoted_user/status/888/photo/1',
          index: 0,
          visualLabel: 'Quoted 1st',
          tweet_id: '888',
        },
        {
          expanded_url: 'https://twitter.com/quoted_user/status/888/photo/2',
          index: 1,
          visualLabel: 'Quoted 2nd',
          tweet_id: '888',
        },
        {
          expanded_url: 'https://twitter.com/quoted_user/status/888/photo/4',
          index: 2,
          visualLabel: 'Quoted 4th (wrong position)',
          tweet_id: '888',
        },
        {
          expanded_url: 'https://twitter.com/quoted_user/status/888/photo/3',
          index: 3,
          visualLabel: 'Quoted 3rd (wrong position)',
          tweet_id: '888',
        },
      ];

      // Original tweet has 2 images
      const originalMedia: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/user/status/777/photo/1',
          index: 0,
          visualLabel: 'Original 1st',
          tweet_id: '777',
        },
        {
          expanded_url: 'https://twitter.com/user/status/777/photo/2',
          index: 1,
          visualLabel: 'Original 2nd',
          tweet_id: '777',
        },
      ];

      // Fix quoted tweet order
      const fixedQuoted = sortMediaByVisualOrder(buggyQuotedMedia);
      // Fix original tweet order
      const fixedOriginal = sortMediaByVisualOrder(originalMedia);

      // Adjust original indices
      const adjustedOriginal = fixedOriginal.map(media => ({
        ...media,
        index: media.index + fixedQuoted.length,
      }));

      const combined = [...fixedQuoted, ...adjustedOriginal];

      // Verify quoted tweet 3rd/4th are fixed
      const quoted3rd = fixedQuoted.find(m => m.expanded_url.includes('/photo/3'));
      const quoted4th = fixedQuoted.find(m => m.expanded_url.includes('/photo/4'));
      expect(quoted3rd?.index).toBe(2); // ✅ Fixed: was 3, now 2
      expect(quoted4th?.index).toBe(3); // ✅ Fixed: was 2, now 3

      // Verify original tweet indices are shifted
      expect(adjustedOriginal[0]?.index).toBe(4); // Shifted by 4 (quoted length)
      expect(adjustedOriginal[1]?.index).toBe(5);

      // Verify combined result
      expect(combined.length).toBe(6);
      expect(combined.map(m => m.index)).toEqual([0, 1, 2, 3, 4, 5]); // Sequential indices
    });

    it('should handle quoted tweet only (no original media)', () => {
      const sortMediaByVisualOrder = (mediaItems: MockMediaEntry[]): MockMediaEntry[] => {
        if (mediaItems.length <= 1) {
          return mediaItems;
        }

        const extractVisualIndex = (url: string): number => {
          if (!url) return 0;
          const match = url.match(/\/(photo|video)\/(\d+)$/);
          const visualNumberStr = match?.[2];
          if (visualNumberStr) {
            const visualNumber = Number.parseInt(visualNumberStr, 10);
            return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
          }
          return 0;
        };

        const withVisualIndex = mediaItems.map(media => ({
          media,
          visualIndex: extractVisualIndex(media.expanded_url),
        }));

        withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);

        return withVisualIndex.map(({ media }, newIndex) => ({
          ...media,
          index: newIndex,
        }));
      };

      // Quoted tweet with 3 images
      const quotedMedia: MockMediaEntry[] = [
        {
          expanded_url: 'https://twitter.com/quoted_user/status/555/photo/1',
          index: 0,
          visualLabel: 'Quoted 1st',
          tweet_id: '555',
        },
        {
          expanded_url: 'https://twitter.com/quoted_user/status/555/photo/2',
          index: 1,
          visualLabel: 'Quoted 2nd',
          tweet_id: '555',
        },
        {
          expanded_url: 'https://twitter.com/quoted_user/status/555/photo/3',
          index: 2,
          visualLabel: 'Quoted 3rd',
          tweet_id: '555',
        },
      ];

      // No original media
      const originalMedia: MockMediaEntry[] = [];

      const sortedQuoted = sortMediaByVisualOrder(quotedMedia);
      const sortedOriginal = sortMediaByVisualOrder(originalMedia);

      const adjustedOriginal = sortedOriginal.map(media => ({
        ...media,
        index: media.index + sortedQuoted.length,
      }));

      const combined = [...sortedQuoted, ...adjustedOriginal];

      // Verify only quoted media
      expect(combined.length).toBe(3);
      expect(combined[0]?.index).toBe(0);
      expect(combined[1]?.index).toBe(1);
      expect(combined[2]?.index).toBe(2);
    });
  });
});
