// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { planBulkDownload } from '@shared/core/download/download-plan';

describe('download-plan', () => {
  const baseMedia = {
    id: '1234567890_media_0',
    url: 'https://pbs.twimg.com/media/ABC?format=jpg&name=orig',
    originalUrl: 'https://pbs.twimg.com/media/ABC?format=jpg&name=orig',
    type: 'image' as const,
    tweetId: '1234567890',
    tweetUsername: 'testuser',
  };

  describe('planBulkDownload', () => {
    it('should create a plan with items from mediaItems', () => {
      const result = planBulkDownload({
        mediaItems: [baseMedia],
        nowMs: 1000,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].url).toBe(baseMedia.url);
      expect(result.items[0].desiredName).toContain('testuser');
    });

    it('should generate zip filename from first item metadata', () => {
      const result = planBulkDownload({
        mediaItems: [baseMedia],
        nowMs: 1000,
      });

      expect(result.zipFilename).toBe('testuser_1234567890.zip');
    });

    it('should use custom zipFilename when provided', () => {
      const result = planBulkDownload({
        mediaItems: [baseMedia],
        nowMs: 1000,
        zipFilename: 'custom-archive.zip',
      });

      expect(result.zipFilename).toBe('custom-archive.zip');
    });

    it('should use fallback zip filename when no metadata', () => {
      const media = { ...baseMedia, tweetId: undefined, tweetUsername: undefined };
      const result = planBulkDownload({
        mediaItems: [media],
        nowMs: 1000,
      });

      expect(result.zipFilename).toBe('xcom_gallery_1000.zip');
    });

    it('should associate prefetched blobs with items', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const prefetchedBlobs = new Map([[baseMedia.url, blob]]);

      const result = planBulkDownload({
        mediaItems: [baseMedia],
        prefetchedBlobs,
        nowMs: 1000,
      });

      expect(result.items[0].blob).toBe(blob);
    });

    it('should handle multiple media items', () => {
      const media2 = { ...baseMedia, id: '1234567890_media_1', url: 'https://pbs.twimg.com/media/DEF?format=jpg' };
      const result = planBulkDownload({
        mediaItems: [baseMedia, media2],
        nowMs: 1000,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].url).toBe(baseMedia.url);
      expect(result.items[1].url).toBe(media2.url);
    });

    it('should handle empty mediaItems', () => {
      const result = planBulkDownload({
        mediaItems: [],
        nowMs: 1000,
      });

      expect(result.items).toHaveLength(0);
      expect(result.zipFilename).toBe('xcom_gallery_1000.zip');
    });
  });
});
