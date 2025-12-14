/**
 * @fileoverview Service key constants
 *
 * Grouped by category and sorted alphabetically.
 * All values use consistent dot-notation format: `<category>.<name>`
 *
 * Note: Some keys are reserved for future use and not currently registered.
 * These are marked with [RESERVED] in comments.
 */

export const SERVICE_KEYS = {
  // ========================================
  // Core Services
  // ========================================
  /**
   * @deprecated Use GALLERY_DOWNLOAD instead. Will be removed in v2.0.0.
   * Alias for GALLERY_DOWNLOAD (Phase 355 consolidation)
   */
  BULK_DOWNLOAD: 'core.bulk-download',
  LANGUAGE: 'core.language',

  // ========================================
  // Gallery Services
  // ========================================
  GALLERY_DOWNLOAD: 'gallery.download',
  GALLERY_RENDERER: 'gallery.renderer',

  // ========================================
  // Media Services
  // ========================================
  MEDIA_FILENAME: 'media.filename',
  MEDIA_SERVICE: 'media.service',

  // ========================================
  // Settings Services
  // ========================================
  SETTINGS: 'settings.manager',

  // ========================================
  // UI Services
  // ========================================
  THEME: 'ui.theme',
  // ========================================
  // [RESERVED] Future Extension Keys
  // These keys are defined for future features but not currently in use.
  // Do not remove - they ensure consistent naming when features are added.
  // ========================================
  /** [RESERVED] Animation service for future motion control */
  // ANIMATION: 'ui.animation',
  /** [RESERVED] Gallery root service for future component orchestration */
  // GALLERY: 'gallery.root',
  /** [RESERVED] Media extraction service (currently handled by MediaExtractionService directly) */
  // MEDIA_EXTRACTION: 'media.extraction',
  /** [RESERVED] Video playback control service */
  // VIDEO_CONTROL: 'video.control',
  /** [RESERVED] Video state management service */
  // VIDEO_STATE: 'video.state',
} as const;
