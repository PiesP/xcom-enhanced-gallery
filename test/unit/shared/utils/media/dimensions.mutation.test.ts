import {
  resolveMediaDimensions,
  createIntrinsicSizingStyle,
  toRem,
} from '@shared/utils/media/dimensions';
import type { MediaInfo } from '@shared/types/media.types';

describe('dimensions mutation tests', () => {
  describe('parsePositiveNumber edge cases (via resolveMediaDimensions)', () => {
    it('should reject 0 and negative numbers in direct properties', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        width: 0,
        height: 100,
      };
      // Should fall back to default because width is invalid
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });

      const media2: MediaInfo = {
        ...media,
        width: 100,
        height: -50,
      };
      expect(resolveMediaDimensions(media2)).toEqual({ width: 540, height: 720 });
    });

    it('should reject non-finite numbers', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        width: Infinity,
        height: 100,
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });
    });

    it('should handle string parsing strictness', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        metadata: {
          dimensions: {
            width: '100',
            height: 'invalid',
          },
        },
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });
    });
  });

  describe('extractDimensionsFromUrl edge cases', () => {
    it('should reject invalid dimensions in URL', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'video',
        metadata: {
          apiData: {
            download_url: 'https://video.twimg.com/ext_tw_video/123/0x720/video.mp4',
          },
        },
      };
      // 0 width should be rejected
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });
    });

    it('should reject negative dimensions in URL', () => {
      // Regex \d{2,6} won't match negative sign, but let's ensure logic holds if regex matched
      // Actually regex only matches digits, so negative isn't possible via regex match
      // But we can test "00" which parses to 0
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'video',
        metadata: {
          apiData: {
            download_url: 'https://video.twimg.com/ext_tw_video/123/00x720/video.mp4',
          },
        },
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });
    });
  });

  describe('scaleAspectRatio edge cases', () => {
    it('should handle aspect ratio calculation rounding', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        metadata: {
          apiData: {
            aspect_ratio: [16, 9],
          },
        },
      };
      // 16/9 * 720 = 1280
      expect(resolveMediaDimensions(media)).toEqual({ width: 1280, height: 720 });
    });

    it('should ensure minimum width of 1', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        metadata: {
          apiData: {
            aspect_ratio: [1, 10000], // Very tall image
          },
        },
      };
      // (1/10000) * 720 = 0.072 -> rounds to 0 -> max(1, 0) = 1
      expect(resolveMediaDimensions(media)).toEqual({ width: 1, height: 720 });
    });
  });

  describe('Precedence and Fallback', () => {
    it('should prioritize dimensions object over apiData', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        metadata: {
          dimensions: { width: 100, height: 100 },
          apiData: { original_width: 200, original_height: 200 },
        },
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 100, height: 100 });
    });

    it('should prioritize original_width over download_url', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        metadata: {
          apiData: {
            original_width: 200,
            original_height: 200,
            download_url: '/100x100/',
          },
        },
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 200, height: 200 });
    });

    it('should prioritize download_url over preview_url', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        metadata: {
          apiData: {
            download_url: '/200x200/',
            preview_url: '/100x100/',
          },
        },
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 200, height: 200 });
    });

    it('should prioritize preview_url over aspect_ratio', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'test',
        type: 'image',
        metadata: {
          apiData: {
            preview_url: '/200x200/',
            aspect_ratio: [1, 1], // would result in 720x720
          },
        },
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 200, height: 200 });
    });
  });

  describe('createIntrinsicSizingStyle', () => {
    it('should calculate correct aspect ratio string', () => {
      const style = createIntrinsicSizingStyle({ width: 1920, height: 1080 });
      expect(style['--xeg-aspect-default']).toBe('1920 / 1080');
      expect(style['--xeg-gallery-item-intrinsic-ratio']).toBe((1920 / 1080).toFixed(6));
    });

    it('should convert dimensions to rem', () => {
      const style = createIntrinsicSizingStyle({ width: 16, height: 32 });
      expect(style['--xeg-gallery-item-intrinsic-width']).toBe('1.0000rem');
      expect(style['--xeg-gallery-item-intrinsic-height']).toBe('2.0000rem');
    });
  });

  describe('toRem', () => {
    it('should format with 4 decimal places', () => {
      expect(toRem(10)).toBe('0.6250rem');
      expect(toRem(16)).toBe('1.0000rem');
      expect(toRem(0)).toBe('0.0000rem');
    });
  });
});
