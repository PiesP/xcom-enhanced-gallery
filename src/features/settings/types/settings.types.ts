/**
 * @fileoverview Settings module types - Application settings interfaces and types
 * @description Defines configuration structure for gallery, download, tokens, and accessibility settings.
 * @module features/settings/types
 */

/**
 * Gallery settings configuration
 * @description Controls gallery display, interaction, and media playback behavior
 */
export interface GallerySettings {
  /** Auto-scroll speed (1-10) */
  autoScrollSpeed: number;
  /** Enable infinite scroll */
  infiniteScroll: boolean;
  /** Number of images to preload */
  preloadCount: number;
  /** Image fitting mode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer' */
  imageFitMode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';
  /** Gallery theme: 'auto' | 'light' | 'dark' */
  theme: 'auto' | 'light' | 'dark';
  /** Enable animations */
  animations: boolean;
  /** Enable keyboard navigation */
  enableKeyboardNav: boolean;
  /** Video volume level (0.0 ~ 1.0) */
  videoVolume: number;
  /** Video muted state (separate from volume for UX convenience) */
  videoMuted: boolean;
}

/**
 * Toolbar settings configuration
 * @description Controls toolbar visibility and auto-hide behavior
 */
export interface ToolbarSettings {
  /** Auto-hide delay in milliseconds (0 disables auto-hide) */
  autoHideDelay: number;
}

/**
 * Download settings configuration
 * @description Controls download behavior, filename patterns, and compression
 */
export interface DownloadSettings {
  /** Filename pattern: 'original' | 'tweet-id' | 'timestamp' | 'custom' */
  filenamePattern: 'original' | 'tweet-id' | 'timestamp' | 'custom';
  /** Custom filename template (used when filenamePattern is 'custom') */
  customTemplate?: string;
  /** Image quality: 'original' | 'large' | 'medium' | 'small' */
  imageQuality: 'original' | 'large' | 'medium' | 'small';
  /** Maximum concurrent downloads */
  maxConcurrentDownloads: number;
  /** Auto-compress to ZIP */
  autoZip: boolean;
  /** Download folder structure: 'flat' | 'by-date' | 'by-user' */
  folderStructure: 'flat' | 'by-date' | 'by-user';
}

/**
 * Token settings configuration
 * @description Manages API authentication tokens and refresh behavior
 */
export interface TokenSettings {
  /** Bearer token (optional, empty if not configured) */
  bearerToken?: string;
  /** Auto-refresh token on expiration */
  autoRefresh: boolean;
  /** Token expiration time (minutes) */
  expirationMinutes: number;
  /** Last token refresh time (UNIX timestamp in milliseconds) */
  lastRefresh?: number;
}

/**
 * Accessibility settings configuration
 * @description Controls accessibility features for motion sensitivity and screen readers
 */
export interface AccessibilitySettings {
  /** Reduce animations and transitions */
  reduceMotion: boolean;
  /** Enable screen reader support and ARIA announcements */
  screenReaderSupport: boolean;
  /** Show prominent focus indicators for keyboard navigation */
  focusIndicators: boolean;
}

/**
 * Feature flags configuration
 * @description Phase 326.4: Controls feature toggles and experimental features
 * @note All flags are required boolean values
 */
export interface FeatureFlags {
  /** Enable gallery feature (required, core functionality) */
  gallery: boolean;
  /** Enable settings UI and preferences panel */
  settings: boolean;
  /** Enable download feature for media files */
  download: boolean;
  /** Enable media extraction and processing */
  mediaExtraction: boolean;
  /** Enable accessibility features and enhancements */
  accessibility: boolean;
}

/**
 * Complete application settings
 * @description Root settings interface aggregating all configuration categories
 */
export interface AppSettings {
  /** Gallery display and interaction settings */
  gallery: GallerySettings;
  /** Toolbar visibility and behavior settings */
  toolbar: ToolbarSettings;
  /** Download behavior and compression settings */
  download: DownloadSettings;
  /** API authentication token settings */
  tokens: TokenSettings;
  /** Accessibility and usability settings */
  accessibility: AccessibilitySettings;
  /** Feature flags for toggleable functionality (Phase 326.4) */
  features: FeatureFlags;
  /** Settings version for compatibility management */
  version: string;
  /** Last modification time (UNIX timestamp in milliseconds) */
  lastModified: number;
}

/**
 * Top-level setting key type for type-safe access to root settings
 * @description Represents keys directly under AppSettings
 */
export type SettingKey = keyof AppSettings;

/**
 * Nested setting key type supporting dot notation for deep access
 * @description Allows type-safe access to nested properties via 'category.property' format
 * @example 'gallery.autoScrollSpeed' | 'download.filenamePattern' | 'version'
 */
export type NestedSettingKey =
  | `gallery.${keyof GallerySettings}`
  | `toolbar.${keyof ToolbarSettings}`
  | `download.${keyof DownloadSettings}`
  | `tokens.${keyof TokenSettings}`
  | `accessibility.${keyof AccessibilitySettings}`
  | `features.${keyof FeatureFlags}`
  | SettingKey;

/**
 * Settings change event
 * @description Emitted when a setting value changes
 * @template T The type of the setting value being changed
 */
export interface SettingChangeEvent<T = unknown> {
  /** The setting key using dot notation (e.g., 'gallery.theme') */
  key: NestedSettingKey;
  /** Previous setting value */
  oldValue: T;
  /** New setting value */
  newValue: T;
  /** Event timestamp (UNIX timestamp in milliseconds) */
  timestamp: number;
  /** Result pattern alignment: event status (currently success only, reserved for future error handling) */
  status?: 'success' | 'error';
}

/**
 * Settings validation result
 * @description Result of validating a setting value or configuration
 */
export interface SettingValidationResult {
  /** Whether the setting passed validation */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Suggested corrected value or usage hint */
  suggestion?: string;
}

/**
 * @note Import DEFAULT_SETTINGS directly from @constants.
 * This type file contains pure type definitions only.
 * @example
 * ```typescript
 * import { DEFAULT_SETTINGS } from '@constants/default-settings';
 * import type { AppSettings } from '@features/settings/types/settings.types';
 * ```
 */
