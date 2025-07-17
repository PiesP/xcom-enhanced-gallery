/**
 * 테스트 데이터 픽스처
 * 일관된 테스트 데이터 제공
 */

// ================================
// Media Item Fixtures
// ================================

export const mockImageInfo = {
  basic: {
    url: 'https://pbs.twimg.com/media/test-image.jpg',
    width: 1200,
    height: 800,
    format: 'jpg',
    size: 156789,
  },

  large: {
    url: 'https://pbs.twimg.com/media/test-large.jpg?format=jpg&name=large',
    width: 2048,
    height: 1536,
    format: 'jpg',
    size: 524288,
  },

  original: {
    url: 'https://pbs.twimg.com/media/test-orig.jpg?format=jpg&name=orig',
    width: 4096,
    height: 3072,
    format: 'jpg',
    size: 2097152,
  },
};

export const mockVideoInfo = {
  basic: {
    url: 'https://video.twimg.com/ext_tw_video/test.mp4',
    thumbnailUrl: 'https://pbs.twimg.com/ext_tw_video_thumb/test.jpg',
    duration: 30000,
    width: 1280,
    height: 720,
    format: 'mp4',
    size: 5242880,
    bitrate: 1400000,
  },

  highQuality: {
    url: 'https://video.twimg.com/ext_tw_video/test-hq.mp4',
    thumbnailUrl: 'https://pbs.twimg.com/ext_tw_video_thumb/test-hq.jpg',
    duration: 60000,
    width: 1920,
    height: 1080,
    format: 'mp4',
    size: 10485760,
    bitrate: 2800000,
  },
};

// ================================
// Tweet Fixtures
// ================================

export const mockTweetData = {
  simple: {
    id: '1234567890123456789',
    text: 'Simple test tweet with no media',
    author: 'testuser',
    timestamp: new Date('2023-01-01T00:00:00Z'),
  },

  withImage: {
    id: '1234567890123456790',
    text: 'Tweet with image attachment',
    author: 'testuser',
    timestamp: new Date('2023-01-01T01:00:00Z'),
    mediaItems: [
      {
        id: 'media-1',
        type: 'image' as const,
        info: mockImageInfo.basic,
        downloadStatus: 'idle' as const,
      },
    ],
  },

  withVideo: {
    id: '1234567890123456791',
    text: 'Tweet with video attachment',
    author: 'testuser',
    timestamp: new Date('2023-01-01T02:00:00Z'),
    mediaItems: [
      {
        id: 'media-2',
        type: 'video' as const,
        info: mockVideoInfo.basic,
        downloadStatus: 'idle' as const,
      },
    ],
  },

  withMultipleMedia: {
    id: '1234567890123456792',
    text: 'Tweet with multiple media items',
    author: 'testuser',
    timestamp: new Date('2023-01-01T03:00:00Z'),
    mediaItems: [
      {
        id: 'media-3',
        type: 'image' as const,
        info: mockImageInfo.basic,
        downloadStatus: 'idle' as const,
      },
      {
        id: 'media-4',
        type: 'image' as const,
        info: mockImageInfo.large,
        downloadStatus: 'idle' as const,
      },
      {
        id: 'media-5',
        type: 'video' as const,
        info: mockVideoInfo.basic,
        downloadStatus: 'idle' as const,
      },
    ],
  },
};

// ================================
// Gallery State Fixtures
// ================================

export const mockGalleryState = {
  empty: {
    currentIndex: 0,
    mediaItems: [],
    isVisible: false,
    isLoading: false,
    viewMode: 'grid' as const,
    error: null,
  },

  withSingleImage: {
    currentIndex: 0,
    mediaItems: [mockTweetData.withImage.mediaItems[0]],
    isVisible: true,
    isLoading: false,
    viewMode: 'fullscreen' as const,
    error: null,
  },

  withMultipleItems: {
    currentIndex: 1,
    mediaItems: mockTweetData.withMultipleMedia.mediaItems,
    isVisible: true,
    isLoading: false,
    viewMode: 'fullscreen' as const,
    error: null,
  },

  loading: {
    currentIndex: 0,
    mediaItems: [],
    isVisible: false,
    isLoading: true,
    viewMode: 'grid' as const,
    error: null,
  },

  error: {
    currentIndex: 0,
    mediaItems: [],
    isVisible: false,
    isLoading: false,
    viewMode: 'grid' as const,
    error: new Error('Failed to load media'),
  },
};

// ================================
// URL Fixtures
// ================================

export const mockUrls = {
  twitter: {
    base: 'https://x.com/user/status/1234567890123456789',
    withLang: 'https://x.com/user/status/1234567890123456789?lang=en',
    mobile: 'https://mobile.x.com/user/status/1234567890123456789',
  },

  twitterLegacy: {
    base: 'https://twitter.com/user/status/1234567890123456789',
    withParams: 'https://twitter.com/user/status/1234567890123456789?ref_src=twsrc',
  },

  media: {
    image: {
      small: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=small',
      medium: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=medium',
      large: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=large',
      orig: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=orig',
    },
    video: {
      mobile: 'https://video.twimg.com/ext_tw_video/123/pu/vid/480x270/video.mp4',
      web: 'https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/video.mp4',
      hd: 'https://video.twimg.com/ext_tw_video/123/pu/vid/1920x1080/video.mp4',
    },
  },
};

// ================================
// Browser Environment Fixtures
// ================================

export const mockBrowserEnvironment = {
  chrome: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    vendor: 'Google Inc.',
    language: 'en-US',
  },

  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    vendor: '',
    language: 'en-US',
  },

  safari: {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    vendor: 'Apple Computer, Inc.',
    language: 'en-US',
  },
};

// ================================
// DOM Element Fixtures
// ================================

export const mockDOMStructures = {
  tweetArticle: {
    tagName: 'article',
    attributes: {
      'data-testid': 'tweet',
      role: 'article',
    },
    children: [],
  },

  imageContainer: {
    tagName: 'div',
    attributes: {
      'data-testid': 'tweetPhoto',
    },
    children: [
      {
        tagName: 'img',
        attributes: {
          src: mockUrls.media.image.large,
          alt: 'Test image',
        },
      },
    ],
  },

  videoContainer: {
    tagName: 'div',
    attributes: {
      'data-testid': 'videoPlayer',
    },
    children: [
      {
        tagName: 'video',
        attributes: {
          src: mockUrls.media.video.web,
          poster: mockUrls.media.image.medium,
        },
      },
    ],
  },
};
