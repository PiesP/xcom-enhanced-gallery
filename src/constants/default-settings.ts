/**
 * @fileoverview Default settings configuration
 */

export const DEFAULT_SETTINGS = {
  gallery: {
    autoScrollSpeed: 5,
    infiniteScroll: true,
    preloadCount: 3,
    imageFitMode: 'fitWidth' as const,
    theme: 'auto' as const,
    animations: true,
    enableKeyboardNav: false,
  },
  toolbar: {
    /** Phase 268: Remove runtime warnings - toolbar settings schema */
    autoHideDelay: 3000, // ms, toolbar auto-hide delay (default 3s)
  },
  download: {
    filenamePattern: 'original' as const,
    imageQuality: 'original' as const,
    maxConcurrentDownloads: 3,
    autoZip: false,
    folderStructure: 'flat' as const,
  },
  tokens: {
    autoRefresh: true,
    expirationMinutes: 60,
  },
  performance: {
    domCaching: true,
    cacheTTL: 3000,
    debugMode: false,
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    screenReaderSupport: true,
    focusIndicators: true,
  },
  /** Phase 326.4: Conditional Feature Loading */
  features: {
    gallery: true, // Gallery feature enabled (required)
    settings: true, // Settings UI enabled
    download: true, // Download feature enabled
    mediaExtraction: true, // Media extraction enabled
    advancedFilters: true, // Advanced filters enabled (optional)
    accessibility: true, // Accessibility features enabled
  },
  version: '1.0.0',
  lastModified: Date.now(),
} as const;
