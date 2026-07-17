// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  extractFilenameFromUrl,
  extractVisualIndexFromUrl,
  normalizeMediaUrl,
} from '@shared/utils/media/media-url-utils';

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
});
