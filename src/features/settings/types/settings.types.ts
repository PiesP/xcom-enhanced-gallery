/**
 * @fileoverview Settings module types - Application settings interfaces and types
 * @description Defines configuration structure for gallery, download, tokens, performance, and accessibility settings.
 * @module features/settings/types
 */

/**
 * Gallery settings configuration
 */
export interface GallerySettings {
  /** Auto-scroll speed (1-10) */
  autoScrollSpeed: number;
  /** Enable infinite scroll */
  infiniteScroll: boolean;
  /** Number of images to preload */
  preloadCount: number;
  /** Image fitting mode */
  imageFitMode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';
  /** Gallery theme */
  theme: 'auto' | 'light' | 'dark';
  /** Enable animations */
  animations: boolean;
  /** Enable keyboard navigation */
  enableKeyboardNav: boolean;
}

/**
 * Download settings configuration
 */
export interface DownloadSettings {
  /** Filename pattern */
  filenamePattern: 'original' | 'tweet-id' | 'timestamp' | 'custom';
  /** Custom filename template */
  customTemplate?: string;
  /** Image quality */
  imageQuality: 'original' | 'large' | 'medium' | 'small';
  /** Maximum concurrent downloads */
  maxConcurrentDownloads: number;
  /** Auto-compress to ZIP */
  autoZip: boolean;
  /** Download folder structure */
  folderStructure: 'flat' | 'by-date' | 'by-user';
}

/**
 * Token settings configuration
 */
export interface TokenSettings {
  /** Bearer token */
  bearerToken?: string;
  /** Auto-refresh token */
  autoRefresh: boolean;
  /** Token expiration time (minutes) */
  expirationMinutes: number;
  /** Last refresh time */
  lastRefresh?: number;
}

/**
 * Performance settings configuration
 */
export interface PerformanceSettings {
  /** Enable DOM caching */
  domCaching: boolean;
  /** Cache TTL (milliseconds) */
  cacheTTL: number;
  /** Debug mode */
  debugMode: boolean;
}

/**
 * Accessibility settings configuration
 */
export interface AccessibilitySettings {
  /** High contrast mode */
  highContrast: boolean;
  /** Reduce animations */
  reduceMotion: boolean;
  /** Screen reader support */
  screenReaderSupport: boolean;
  /** Focus indicators */
  focusIndicators: boolean;
}

/**
 * Phase 326.4: Feature flags configuration
 */
export interface FeatureFlags {
  /** Enable gallery feature (required) */
  gallery: boolean;
  /** Enable settings UI */
  settings: boolean;
  /** Enable download feature */
  download: boolean;
  /** Enable media extraction */
  mediaExtraction: boolean;
  /** Enable advanced filters (optional) */
  advancedFilters: boolean;
  /** Enable accessibility features */
  accessibility: boolean;
}

/**
 * Complete application settings
 */
export interface AppSettings {
  gallery: GallerySettings;
  download: DownloadSettings;
  tokens: TokenSettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  /** Phase 326.4: Feature flags */
  features: FeatureFlags;
  /** Settings version (for compatibility management) */
  version: string;
  /** Last modification time */
  lastModified: number;
}

/**
 * Top-level setting key type (for type-safe access)
 */
export type SettingKey = keyof AppSettings;

/**
 * Nested setting key type (supports dot notation)
 */
export type NestedSettingKey =
  | `gallery.${keyof GallerySettings}`
  | `download.${keyof DownloadSettings}`
  | `tokens.${keyof TokenSettings}`
  | `performance.${keyof PerformanceSettings}`
  | `accessibility.${keyof AccessibilitySettings}`
  | `features.${keyof FeatureFlags}`
  | SettingKey;

/**
 * Settings change event
 */
export interface SettingChangeEvent<T = unknown> {
  key: NestedSettingKey;
  oldValue: T;
  newValue: T;
  timestamp: number;
  /** Result pattern alignment: event status (currently success only) */
  status?: 'success' | 'error';
}

/**
 * Settings validation result
 */
export interface SettingValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * @note Import DEFAULT_SETTINGS directly from @/constants.
 * This type file contains pure type definitions only.
 * @example
 * ```typescript
 * import { DEFAULT_SETTINGS } from '@/constants';
 * import type { AppSettings } from '@/features/settings/types/settings.types';
 * ```
 */
