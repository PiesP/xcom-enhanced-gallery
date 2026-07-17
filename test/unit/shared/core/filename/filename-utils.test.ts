// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  getIndexFromMediaId,
  normalizeIndex,
  generateMediaFilename,
  generateZipFilename,
} from '@shared/core/filename/filename-utils';

describe('filename-utils', () => {
  // ── getIndexFromMediaId ───────────────────────────────────────────
  describe('getIndexFromMediaId', () => {
    it('should extract 1-indexed position from _media_N pattern', () => {
      expect(getIndexFromMediaId('1234567890_media_0')).toBe('1');
      expect(getIndexFromMediaId('1234567890_media_1')).toBe('2');
      expect(getIndexFromMediaId('1234567890_media_3')).toBe('4');
    });

    it('should extract raw index from _N pattern', () => {
      expect(getIndexFromMediaId('photo_0')).toBe('0');
      expect(getIndexFromMediaId('photo_3')).toBe('3');
    });

    it('should return null for invalid input', () => {
      expect(getIndexFromMediaId(undefined)).toBeNull();
      expect(getIndexFromMediaId('')).toBeNull();
      expect(getIndexFromMediaId('no-index-here')).toBeNull();
    });
  });

  // ── normalizeIndex ────────────────────────────────────────────────
  describe('normalizeIndex', () => {
    it('should normalize valid indices', () => {
      expect(normalizeIndex(1)).toBe('1');
      expect(normalizeIndex('3')).toBe('3');
      expect(normalizeIndex(0)).toBe('1'); // minimum is 1
    });

    it('should default to 1 for invalid input', () => {
      expect(normalizeIndex(undefined)).toBe('1');
      expect(normalizeIndex(NaN)).toBe('1');
      expect(normalizeIndex(-1)).toBe('1');
      expect(normalizeIndex('abc')).toBe('1');
    });

    it('should handle float values without flooring', () => {
      // normalizeIndex does not floor — it returns the number as-is
      expect(normalizeIndex(2.7)).toBe('2.7');
    });
  });

  // ── generateMediaFilename ─────────────────────────────────────────
  describe('generateMediaFilename', () => {
    const baseMedia = {
      id: '1234567890_media_0',
      url: 'https://pbs.twimg.com/media/ABC?format=jpg&name=orig',
      originalUrl: 'https://pbs.twimg.com/media/ABC?format=jpg&name=orig',
      type: 'image' as const,
      tweetId: '1234567890',
      tweetUsername: 'testuser',
    };

    it('should use media.filename if available', () => {
      const media = { ...baseMedia, filename: 'custom-name.jpg' };
      expect(generateMediaFilename(media, { nowMs: 1000 })).toBe('custom-name.jpg');
    });

    it('should generate username_tweetId_index format', () => {
      const result = generateMediaFilename(baseMedia, { nowMs: 1000 });
      expect(result).toBe('testuser_1234567890_1.jpg');
    });

    it('should use tweet-only format when username is unknown', () => {
      const media = { ...baseMedia, tweetUsername: 'unknown' };
      const result = generateMediaFilename(media, { nowMs: 1000 });
      expect(result).toBe('tweet_1234567890_1.jpg');
    });

    it('should use fallback prefix when no tweetId', () => {
      const media = { ...baseMedia, tweetId: undefined, tweetUsername: undefined };
      const result = generateMediaFilename(media, { nowMs: 1000 });
      expect(result).toBe('media_1000_1.jpg');
    });

    it('should sanitize special characters', () => {
      const media = { ...baseMedia, tweetUsername: 'user<>:"/\\|?*name' };
      const result = generateMediaFilename(media, { nowMs: 1000 });
      expect(result).not.toMatch(/[<>:"/\\|?*]/);
    });

    it('should use custom extension from options', () => {
      const result = generateMediaFilename(baseMedia, { nowMs: 1000, extension: 'png' });
      expect(result).toBe('testuser_1234567890_1.png');
    });

    it('should use custom index from options when media.id has no index', () => {
      const media = { ...baseMedia, id: 'no-index' };
      const result = generateMediaFilename(media, { nowMs: 1000, index: 3 });
      expect(result).toBe('testuser_1234567890_3.jpg');
    });

    it('should handle quoted tweet metadata', () => {
      const media = {
        ...baseMedia,
        sourceLocation: 'quoted' as const,
        quotedUsername: 'quoteduser',
        quotedTweetId: '9876543210',
      };
      const result = generateMediaFilename(media, { nowMs: 1000 });
      expect(result).toBe('quoteduser_9876543210_1.jpg');
    });

    it('should fallback to media timestamp on error', () => {
      // Pass media with a getter that throws to trigger the catch block
      const media = {
        get id() { throw new Error('id error'); },
      } as any;
      const result = generateMediaFilename(media, { nowMs: 1000 });
      expect(result).toBe('media_1000.jpg');
    });
  });

  // ── generateZipFilename ───────────────────────────────────────────
  describe('generateZipFilename', () => {
    const baseItem = {
      id: '123',
      url: 'https://pbs.twimg.com/media/ABC?format=jpg',
      originalUrl: 'https://pbs.twimg.com/media/ABC?format=jpg',
      type: 'image' as const,
      tweetId: '1234567890',
      tweetUsername: 'testuser',
    };

    it('should generate username_tweetId.zip from first item', () => {
      const result = generateZipFilename([baseItem], { nowMs: 1000 });
      expect(result).toBe('testuser_1234567890.zip');
    });

    it('should use fallback prefix when no metadata', () => {
      const item = { ...baseItem, tweetId: undefined, tweetUsername: undefined };
      const result = generateZipFilename([item], { nowMs: 1000 });
      expect(result).toBe('xcom_gallery_1000.zip');
    });

    it('should use custom fallback prefix', () => {
      const item = { ...baseItem, tweetId: undefined, tweetUsername: undefined };
      const result = generateZipFilename([item], { nowMs: 1000, fallbackPrefix: 'my_archive' });
      expect(result).toBe('my_archive_1000.zip');
    });

    it('should handle empty array', () => {
      const result = generateZipFilename([], { nowMs: 1000 });
      expect(result).toBe('xcom_gallery_1000.zip');
    });
  });
});
