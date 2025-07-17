/**
 * @fileoverview Service Constants (Simplified)
 * @version 3.0.0
 *
 * 단순화된 서비스 상수 관리
 */

/**
 * 서비스 키 상수
 */
export const SERVICE_KEYS = {
  // Core Services
  BULK_DOWNLOAD: 'core.bulkDownload',

  // Gallery Services
  GALLERY: 'gallery',
  GALLERY_RENDERER: 'gallery.renderer',
  GALLERY_DOWNLOAD: 'gallery.download',

  // Media Services
  MEDIA_EXTRACTION: 'media.extraction',
  MEDIA_FILENAME: 'media.filename',

  // UI Services
  AUTO_THEME: 'theme.auto',
  TOAST_CONTROLLER: 'toast.controller',

  // Settings Services
  SETTINGS_MANAGER: 'settings.manager',
  TWITTER_TOKEN_EXTRACTOR: 'settings.tokenExtractor',

  // Video Services
  VIDEO_STATE: 'video.state',
  VIDEO_CONTROL: 'video.control',
} as const;

/**
 * CSS 클래스 상수
 */
export const CSS_CLASSES = {
  GALLERY_CONTAINER: 'xeg-gallery-container',
  OVERLAY: 'xeg-overlay',
} as const;

/**
 * 이벤트 상수
 */
export const EVENTS = {
  GALLERY_OPEN: 'xeg:gallery:open',
  GALLERY_CLOSE: 'xeg:gallery:close',
  MEDIA_CLICK: 'xeg:media:click',
} as const;

/**
 * 테스트 ID 상수
 */
export const TEST_IDS = {
  TWEET_PHOTO: 'tweetPhoto',
  TWEET: 'tweet',
  GALLERY_CONTAINER: 'xeg-gallery',
} as const;

/**
 * 타이밍 상수
 */
export const TIMING = {
  CLICK_DEBOUNCE: 300,
  ANIMATION_DURATION: 300,
  SCROLL_DURATION: 150,
} as const;

/**
 * 크기 제한 상수
 */
export const LIMITS = {
  MAX_MEDIA_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_CONCURRENT_DOWNLOADS: 4,
  REQUEST_TIMEOUT: 30000, // 30초
} as const;
