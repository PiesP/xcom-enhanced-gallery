/**
 * @fileoverview 서비스 키 상수 (Phase 309+)
 *
 * 카테고리별로 그룹화되고 알파벳 순으로 정렬되었습니다.
 */

export const SERVICE_KEYS = {
  // ========================================
  // Animation & Language Services (Phase A5.2)
  // ========================================
  ANIMATION: 'animation.service',
  LANGUAGE: 'language.service',

  // ========================================
  // Core Services
  // ========================================
  BULK_DOWNLOAD: 'core.bulkDownload',

  // ========================================
  // Gallery Services
  // ========================================
  GALLERY: 'gallery',
  GALLERY_DOWNLOAD: 'gallery.download',
  GALLERY_RENDERER: 'gallery.renderer',

  // ========================================
  // Media Services
  // ========================================
  MEDIA_EXTRACTION: 'media.extraction',
  MEDIA_FILENAME: 'media.filename',
  MEDIA_SERVICE: 'media.service',

  // ========================================
  // Settings Services
  // ========================================
  SETTINGS: 'settings.manager',
  TWITTER_TOKEN_EXTRACTOR: 'settings.tokenExtractor',

  // ========================================
  // UI Services
  // ========================================
  THEME: 'theme.auto',
  TOAST: 'toast.controller',

  // ========================================
  // Video Services
  // ========================================
  VIDEO_CONTROL: 'video.control',
  VIDEO_STATE: 'video.state',
} as const;
