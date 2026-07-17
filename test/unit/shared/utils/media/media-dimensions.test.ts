// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  extractDimensionsFromUrl,
  normalizeDimension,
  resolveMediaDimensionsWithIntrinsicFlag,
  createIntrinsicSizingStyle,
  sortMediaByVisualOrder,
} from '@shared/utils/media/media-dimensions';

describe('media-dimensions (pure functions)', () => {
  // ── extractDimensionsFromUrl ──────────────────────────────────────
  describe('extractDimensionsFromUrl', () => {
    it('should extract dimensions from URL path', () => {
      expect(extractDimensionsFromUrl('https://pbs.twimg.com/media/ABC?format=jpg')).toBeNull();
      expect(extractDimensionsFromUrl('https://example.com/1920x1080/image.jpg')).toEqual({ width: 1920, height: 1080 });
      expect(extractDimensionsFromUrl('https://example.com/800x600/')).toEqual({ width: 800, height: 600 });
    });

    it('should handle dimensions at end of URL', () => {
      expect(extractDimensionsFromUrl('https://example.com/1280x720')).toEqual({ width: 1280, height: 720 });
    });

    it('should reject invalid dimensions', () => {
      expect(extractDimensionsFromUrl('https://example.com/0x1080/image.jpg')).toBeNull();
      expect(extractDimensionsFromUrl('https://example.com/1920x0/image.jpg')).toBeNull();
      expect(extractDimensionsFromUrl('')).toBeNull();
    });

    it('should reject non-numeric dimensions', () => {
      expect(extractDimensionsFromUrl('https://example.com/abcxdef/image.jpg')).toBeNull();
    });

    it('should require at least 2-digit numbers', () => {
      expect(extractDimensionsFromUrl('https://example.com/1x2/image.jpg')).toBeNull();
      expect(extractDimensionsFromUrl('https://example.com/10x20/image.jpg')).toEqual({ width: 10, height: 20 });
    });
  });

  // ── normalizeDimension ────────────────────────────────────────────
  describe('normalizeDimension', () => {
    it('should normalize valid numbers', () => {
      expect(normalizeDimension(100)).toBe(100);
      expect(normalizeDimension(100.7)).toBe(101); // rounds
      expect(normalizeDimension(100.3)).toBe(100);
    });

    it('should normalize valid strings', () => {
      expect(normalizeDimension('100')).toBe(100);
      expect(normalizeDimension('100.7')).toBe(101);
    });

    it('should return null for invalid values', () => {
      expect(normalizeDimension(0)).toBeNull();
      expect(normalizeDimension(-1)).toBeNull();
      expect(normalizeDimension(NaN)).toBeNull();
      expect(normalizeDimension(Infinity)).toBeNull();
      expect(normalizeDimension('abc')).toBeNull();
      expect(normalizeDimension('')).toBeNull();
      expect(normalizeDimension(null)).toBeNull();
      expect(normalizeDimension(undefined)).toBeNull();
    });
  });

  // ── resolveMediaDimensionsWithIntrinsicFlag ───────────────────────
  describe('resolveMediaDimensionsWithIntrinsicFlag', () => {
    it('should use direct width/height from media', () => {
      const media = { width: 1920, height: 1080 } as any;
      const result = resolveMediaDimensionsWithIntrinsicFlag(media);
      expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
      expect(result.hasIntrinsicSize).toBe(true);
    });

    it('should extract from metadata.dimensions', () => {
      const media = {
        metadata: { dimensions: { width: 800, height: 600 } },
      } as any;
      const result = resolveMediaDimensionsWithIntrinsicFlag(media);
      expect(result.dimensions).toEqual({ width: 800, height: 600 });
      expect(result.hasIntrinsicSize).toBe(true);
    });

    it('should extract from metadata.apiData.original_width/height', () => {
      const media = {
        metadata: { apiData: { original_width: 1280, original_height: 720 } },
      } as any;
      const result = resolveMediaDimensionsWithIntrinsicFlag(media);
      expect(result.dimensions).toEqual({ width: 1280, height: 720 });
      expect(result.hasIntrinsicSize).toBe(true);
    });

    it('should extract from URL dimensions', () => {
      const media = { url: 'https://example.com/640x480/image.jpg' } as any;
      const result = resolveMediaDimensionsWithIntrinsicFlag(media);
      expect(result.dimensions).toEqual({ width: 640, height: 480 });
      expect(result.hasIntrinsicSize).toBe(true);
    });

    it('should return default dimensions when nothing found', () => {
      const media = { url: 'https://example.com/image.jpg' } as any;
      const result = resolveMediaDimensionsWithIntrinsicFlag(media);
      expect(result.hasIntrinsicSize).toBe(false);
      expect(result.dimensions.height).toBe(720); // STANDARD_GALLERY_HEIGHT
    });

    it('should return default for undefined media', () => {
      const result = resolveMediaDimensionsWithIntrinsicFlag(undefined);
      expect(result.hasIntrinsicSize).toBe(false);
      expect(result.dimensions.height).toBe(720);
    });

    it('should prioritize direct dimensions over metadata', () => {
      const media = {
        width: 1920,
        height: 1080,
        metadata: { dimensions: { width: 800, height: 600 } },
      } as any;
      const result = resolveMediaDimensionsWithIntrinsicFlag(media);
      expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
    });
  });

  // ── createIntrinsicSizingStyle ────────────────────────────────────
  describe('createIntrinsicSizingStyle', () => {
    it('should create CSS custom properties', () => {
      const result = createIntrinsicSizingStyle({ width: 1920, height: 1080 });
      expect(result['--xeg-aspect-default']).toBe('1920 / 1080');
      expect(result['--xeg-gallery-item-intrinsic-ratio']).toBeCloseTo(1.777778, 5);
    });

    it('should handle square dimensions', () => {
      const result = createIntrinsicSizingStyle({ width: 100, height: 100 });
      expect(result['--xeg-gallery-item-intrinsic-ratio']).toBe('1.000000');
    });

    it('should handle zero height gracefully (ratio defaults to 1)', () => {
      const result = createIntrinsicSizingStyle({ width: 100, height: 0 });
      expect(result['--xeg-gallery-item-intrinsic-ratio']).toBe('1.000000');
    });

    it('should convert pixels to rem', () => {
      const result = createIntrinsicSizingStyle({ width: 160, height: 90 });
      expect(result['--xeg-gallery-item-intrinsic-width']).toBe('10.0000rem');
      expect(result['--xeg-gallery-item-intrinsic-height']).toBe('5.6250rem');
    });
  });

  // ── sortMediaByVisualOrder ────────────────────────────────────────
  describe('sortMediaByVisualOrder', () => {
    it('should sort by visual index extracted from URL', () => {
      const items = [
        { expanded_url: 'https://x.com/user/status/123/photo/3' },
        { expanded_url: 'https://x.com/user/status/123/photo/1' },
        { expanded_url: 'https://x.com/user/status/123/photo/2' },
      ] as any[];
      const result = sortMediaByVisualOrder(items);
      expect(result[0].expanded_url).toContain('/photo/1');
      expect(result[1].expanded_url).toContain('/photo/2');
      expect(result[2].expanded_url).toContain('/photo/3');
    });

    it('should handle single item', () => {
      const items = [{ expanded_url: 'https://x.com/user/status/123/photo/1' }] as any[];
      const result = sortMediaByVisualOrder(items);
      expect(result).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = sortMediaByVisualOrder([]);
      expect(result).toHaveLength(0);
    });

    it('should assign new index after sorting', () => {
      const items = [
        { expanded_url: 'https://x.com/user/status/123/photo/2', index: 5 },
        { expanded_url: 'https://x.com/user/status/123/photo/1', index: 3 },
      ] as any[];
      const result = sortMediaByVisualOrder(items);
      expect(result[0].index).toBe(0);
      expect(result[1].index).toBe(1);
    });

    it('should default to index 0 for URLs without visual index', () => {
      const items = [
        { expanded_url: 'https://x.com/user/status/123' },
        { expanded_url: 'https://x.com/user/status/123/photo/1' },
      ] as any[];
      const result = sortMediaByVisualOrder(items);
      // URL without visual index gets 0, so it comes first
      expect(result[0].expanded_url).toBe('https://x.com/user/status/123');
    });
  });
});
