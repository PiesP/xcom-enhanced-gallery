// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  extractFilenameFromUrl,
  extractVisualIndexFromUrl,
  getMediaDedupKey,
  normalizeMediaUrl,
} from '@shared/utils/media/media-url-utils';
import type { MediaInfo } from '@shared/types/media.types';

function makeMedia(overrides: Partial<MediaInfo> = {}): MediaInfo {
  return {
    id: 'media',
    url: 'https://pbs.twimg.com/media/fallback.jpg',
    type: 'image',
    ...overrides,
  };
}

describe('media-url-utils (pure functions)', () => {
  // ── extractFilenameFromUrl ────────────────────────────────────────
  describe('extractFilenameFromUrl', () => {
    it('should extract filename from valid URL', () => {
      expect(extractFilenameFromUrl('https://pbs.twimg.com/media/ABC123.jpg')).toBe('ABC123.jpg');
      expect(extractFilenameFromUrl('https://video.twimg.com/ext_tw_video/123/pu/vid/720x1280/abc.mp4')).toBe('abc.mp4');
    });

    it('should return null for empty or invalid input', () => {
      expect(extractFilenameFromUrl('')).toBeNull();
      expect(extractFilenameFromUrl('not-a-url')).toBeNull();
    });

    it('should return null for URLs without valid prefix', () => {
      expect(extractFilenameFromUrl('ftp://example.com/image.jpg')).toBeNull();
    });

    it('should handle protocol-relative URLs', () => {
      expect(extractFilenameFromUrl('//pbs.twimg.com/media/ABC.jpg')).toBe('ABC.jpg');
    });

    it('should handle relative paths', () => {
      expect(extractFilenameFromUrl('/media/ABC.jpg')).toBe('ABC.jpg');
    });

    it('should return null for URLs with no filename', () => {
      expect(extractFilenameFromUrl('https://pbs.twimg.com/')).toBeNull();
    });
  });

  // ── extractVisualIndexFromUrl ─────────────────────────────────────
  describe('extractVisualIndexFromUrl', () => {
    it('should extract visual index from photo URL', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/1')).toBe(0);
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/3')).toBe(2);
    });

    it('should extract visual index from video URL', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/video/1')).toBe(0);
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/video/2')).toBe(1);
    });

    it('should return 0 for URLs without visual index', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123')).toBe(0);
      expect(extractVisualIndexFromUrl('')).toBe(0);
    });

    it('should handle query strings and fragments', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/2?format=jpg')).toBe(1);
    });

    it('rejects zero, missing, and non-terminal visual positions', () => {
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/0')).toBe(0);
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/')).toBe(0);
      expect(extractVisualIndexFromUrl('https://x.com/user/status/123/photo/2/extra')).toBe(0);
    });
  });

  // ── normalizeMediaUrl ─────────────────────────────────────────────
  describe('normalizeMediaUrl', () => {
    it('should extract filename without extension', () => {
      expect(normalizeMediaUrl('https://pbs.twimg.com/media/ABC123.jpg')).toBe('ABC123');
      expect(normalizeMediaUrl('https://video.twimg.com/vid/abc.mp4')).toBe('abc');
    });

    it('should return null for empty or invalid input', () => {
      expect(normalizeMediaUrl('')).toBeNull();
      expect(normalizeMediaUrl('not-a-url')).toBeNull();
    });

    it('should return null for URLs without valid prefix', () => {
      expect(normalizeMediaUrl('ftp://example.com/image.jpg')).toBeNull();
    });

    it('should handle URLs without extension', () => {
      expect(normalizeMediaUrl('https://pbs.twimg.com/media/ABC123')).toBe('ABC123');
    });

    it('should return null for empty filename', () => {
      expect(normalizeMediaUrl('https://pbs.twimg.com/')).toBeNull();
    });
  });

  describe('getMediaDedupKey', () => {
    it('prefers the original URL and preserves the normalized format discriminator', () => {
      expect(
        getMediaDedupKey(
          makeMedia({
            originalUrl: 'https://pbs.twimg.com/media/original?name=large&format=png',
          })
        )
      ).toBe('image:pbs.twimg.com/media/original?format=png');
    });

    it.each(['image', 'video', 'gif'] as const)('keeps %s media in a distinct namespace', (type) => {
      expect(getMediaDedupKey(makeMedia({ type }))).toBe(
        `${type}:pbs.twimg.com/media/fallback.jpg`
      );
    });

    it('falls back from an empty original URL to the primary URL', () => {
      expect(getMediaDedupKey(makeMedia({ originalUrl: '' }))).toBe(
        'image:pbs.twimg.com/media/fallback.jpg'
      );
    });

    it('returns null when neither URL candidate is usable', () => {
      expect(getMediaDedupKey(makeMedia({ url: '', originalUrl: '' }))).toBeNull();
    });

    it('normalizes relative URLs against the safe parsing base', () => {
      expect(getMediaDedupKey(makeMedia({ url: '/media/relative.jpg' }))).toBe(
        'image:example.invalid/media/relative.jpg'
      );
    });
  });
});
