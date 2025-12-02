/**
 * @fileoverview Tests for media dimensions utility
 */

import {
  createIntrinsicSizingStyle,
  resolveMediaDimensions,
  toRem,
} from '@shared/utils/media/dimensions';
import type { MediaInfo } from '@shared/types/media.types';

describe('resolveMediaDimensions', () => {
  it('should return default dimensions when media is undefined', () => {
    const result = resolveMediaDimensions(undefined);
    expect(result).toEqual({ width: 540, height: 720 });
  });

  it('should use direct width/height when available', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      width: 1920,
      height: 1080,
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 1920, height: 1080 });
  });

  it('should use metadata dimensions when direct properties are missing', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {
        dimensions: {
          width: 800,
          height: 600,
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 800, height: 600 });
  });

  it('should use API data original_width/height', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {
        apiData: {
          original_width: 1280,
          original_height: 720,
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 1280, height: 720 });
  });

  it('should use API data originalWidth/originalHeight (camelCase)', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {
        apiData: {
          originalWidth: 1280,
          originalHeight: 720,
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 1280, height: 720 });
  });

  it('should extract dimensions from download_url pattern', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/video.mp4',
      type: 'video',
      metadata: {
        apiData: {
          download_url: 'https://video.twimg.com/ext_tw_video/123/1280x720/video.mp4',
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 1280, height: 720 });
  });

  it('should extract dimensions from preview_url pattern', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/video.mp4',
      type: 'video',
      metadata: {
        apiData: {
          preview_url: 'https://video.twimg.com/ext_tw_video/123/640x360/preview.jpg',
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 640, height: 360 });
  });

  it('should convert aspect_ratio to dimensions', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {
        apiData: {
          aspect_ratio: [16, 9],
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result.height).toBe(720);
    expect(result.width).toBeCloseTo(1280, 0);
  });

  it('should return default when no valid dimensions found', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {},
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 540, height: 720 });
  });

  it('should handle string dimensions in metadata', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {
        dimensions: {
          width: '1024',
          height: '768',
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 1024, height: 768 });
  });

  it('should ignore invalid dimensions (negative)', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      width: -100,
      height: -100,
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 540, height: 720 });
  });

  it('should ignore invalid dimensions (zero)', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      width: 0,
      height: 0,
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 540, height: 720 });
  });

  it('should ignore NaN dimensions', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      width: NaN,
      height: NaN,
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 540, height: 720 });
  });

  it('should handle URL without dimension pattern', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/video.mp4',
      type: 'video',
      metadata: {
        apiData: {
          download_url: 'https://video.twimg.com/ext_tw_video/123/video.mp4',
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 540, height: 720 });
  });

  it('should handle empty aspect_ratio array', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {
        apiData: {
          aspect_ratio: [],
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 540, height: 720 });
  });

  it('should handle invalid aspect_ratio values', () => {
    const media: MediaInfo = {
      id: 'test',
      url: 'https://example.com/image.jpg',
      type: 'image',
      metadata: {
        apiData: {
          original_width: 1000,
          original_height: 1000,
          aspect_ratio: [1, 0], // Invalid
        },
      },
    };

    const result = resolveMediaDimensions(media);
    expect(result).toEqual({ width: 1000, height: 1000 });
  });

  describe('mutation tests', () => {
    it('should handle non-finite width/height', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/image.jpg',
        type: 'image',
        width: Infinity,
        height: 100,
      };
      // Should fall back to default
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });

      const media2: MediaInfo = {
        id: 'test',
        url: 'https://example.com/image.jpg',
        type: 'image',
        width: 100,
        height: NaN,
      };
      expect(resolveMediaDimensions(media2)).toEqual({ width: 540, height: 720 });
    });

    it('should handle zero or negative width/height', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/image.jpg',
        type: 'image',
        width: 0,
        height: 100,
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });

      const media2: MediaInfo = {
        id: 'test',
        url: 'https://example.com/image.jpg',
        type: 'image',
        width: 100,
        height: -50,
      };
      expect(resolveMediaDimensions(media2)).toEqual({ width: 540, height: 720 });
    });

    it('should handle non-finite aspect ratio components', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/image.jpg',
        type: 'image',
        metadata: {
          apiData: {
            aspect_ratio: [1, Infinity],
          },
        },
      };
      // Should fall back to default if no other dimensions
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });
    });

    it('should handle zero or negative aspect ratio components', () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/image.jpg',
        type: 'image',
        metadata: {
          apiData: {
            aspect_ratio: [1, 0],
          },
        },
      };
      expect(resolveMediaDimensions(media)).toEqual({ width: 540, height: 720 });

      const media2: MediaInfo = {
        id: 'test',
        url: 'https://example.com/image.jpg',
        type: 'image',
        metadata: {
          apiData: {
            aspect_ratio: [-1, 1],
          },
        },
      };
      expect(resolveMediaDimensions(media2)).toEqual({ width: 540, height: 720 });
    });
  });
});

describe('toRem', () => {
  it('should convert 16px to 1rem', () => {
    expect(toRem(16)).toBe('1.0000rem');
  });

  it('should convert 32px to 2rem', () => {
    expect(toRem(32)).toBe('2.0000rem');
  });

  it('should handle fractional pixels', () => {
    expect(toRem(24)).toBe('1.5000rem');
  });

  it('should handle zero', () => {
    expect(toRem(0)).toBe('0.0000rem');
  });
});

describe('createIntrinsicSizingStyle', () => {
  it('should create CSS properties for given dimensions', () => {
    const result = createIntrinsicSizingStyle({ width: 1920, height: 1080 });

    expect(result['--xeg-aspect-default']).toBe('1920 / 1080');
    expect(result['--xeg-gallery-item-intrinsic-width']).toBe('120.0000rem');
    expect(result['--xeg-gallery-item-intrinsic-height']).toBe('67.5000rem');
    const ratio = result['--xeg-gallery-item-intrinsic-ratio'];
    expect(ratio).toBeDefined();
    expect(parseFloat(ratio as string)).toBeCloseTo(1.777778, 4);
  });

  it('should handle square dimensions', () => {
    const result = createIntrinsicSizingStyle({ width: 100, height: 100 });

    expect(result['--xeg-aspect-default']).toBe('100 / 100');
    expect(result['--xeg-gallery-item-intrinsic-ratio']).toBe('1.000000');
  });

  it('should handle portrait dimensions', () => {
    const result = createIntrinsicSizingStyle({ width: 720, height: 1280 });

    expect(result['--xeg-aspect-default']).toBe('720 / 1280');
    const ratio = result['--xeg-gallery-item-intrinsic-ratio'];
    expect(ratio).toBeDefined();
    expect(parseFloat(ratio as string)).toBeCloseTo(0.5625, 4);
  });
});
