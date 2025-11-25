/**
 * @fileoverview Service key constants (Phase 309+)
 *
 * Grouped by category and sorted alphabetically.
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

  // ========================================
  // UI Services
  // ========================================
  THEME: 'theme.auto',

  // ========================================
  // Video Services
  // ========================================
  VIDEO_CONTROL: 'video.control',
  VIDEO_STATE: 'video.state',
} as const;
