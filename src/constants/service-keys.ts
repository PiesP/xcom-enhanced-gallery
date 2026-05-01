/**
 * @fileoverview Service key constants for dependency injection.
 *
 * Centralized string constants (dot-notation format: `<category>.<name>`)
 * for service registration and lookup in CoreService.
 *
 * @module constants/service-keys
 */

/**
 * Service key constants for dependency injection.
 *
 * Uses `as const` for literal type preservation and exhaustive pattern matching.
 * Keys are organized by functional category (Core, Gallery, Media, Settings, UI).
 */
export const SERVICE_KEYS = {
  // ========================================
  // Core Services
  // ========================================

  /**
   * Language service for internationalization (i18n)
   *
   * @remarks
   * Manages UI language selection, translation loading, and locale formatting.
   * Provides reactive language change notifications.
   *
   * @see {@link LanguageService}
   */
  LANGUAGE: 'core.language',

  // ========================================
  // Gallery Services
  // ========================================

  /**
   * Gallery download service
   *
   * @remarks
   * Handles batch downloading of media items from gallery view.
   * Manages download queue, progress tracking, and ZIP archive creation.
   *
   * @see {@link GalleryDownloadService}
   */
  GALLERY_DOWNLOAD: 'gallery.download',

  /**
   * Gallery renderer service
   *
   * @remarks
   * Core gallery rendering logic, coordinates media display, navigation,
   * and viewport management.
   *
   * @see {@link GalleryRenderer}
   */
  GALLERY_RENDERER: 'gallery.renderer',

  // ========================================
  // Media Services
  // ========================================

  /**
   * Media filename service
   *
   * @remarks
   * Generates sanitized filenames for downloaded media based on user preferences.
   * Supports templates: original, tweet-id, timestamp, custom.
   *
   * @see {@link MediaFilenameService}
   */
  MEDIA_FILENAME: 'media.filename',

  /**
   * Media service
   *
   * @remarks
   * Central media processing service. Handles media extraction from tweets,
   * URL normalization, quality selection, and metadata parsing.
   *
   * @see {@link MediaService}
   */
  MEDIA_SERVICE: 'media.service',

  // ========================================
  // Settings Services
  // ========================================

  /**
   * Settings manager service
   *
   * @remarks
   * Manages application settings persistence, validation, and migration.
   * Provides reactive settings change notifications.
   *
   * @see {@link SettingsService}
   */
  SETTINGS: 'settings.manager',

  // ========================================
  // UI Services
  // ========================================

  /**
   * Theme service for UI theming
   *
   * @remarks
   * Manages theme selection (light/dark/auto), system preference detection,
   * and theme change notifications. Applies theme to DOM via CSS classes.
   *
   * @see {@link ThemeService}
   */
  THEME: 'ui.theme',
} as const;

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract service key string union from SERVICE_KEYS
 *
 * @remarks
 * Provides a union type of all valid service key strings for type-safe operations.
 *
 * @example
 * ```typescript
 * type ServiceKey = ServiceKeyString;
 * // 'core.language' | 'gallery.download' | 'gallery.renderer' | ...
 *
 * function getService(key: ServiceKeyString): unknown {
 *   return CoreService.getInstance().get(key);
 * }
 * ```
 */
export type ServiceKeyString = (typeof SERVICE_KEYS)[keyof typeof SERVICE_KEYS];

/**
 * Type helper: Extract service key name union from SERVICE_KEYS
 *
 * @remarks
 * Provides a union type of all SERVICE_KEYS property names (e.g., 'THEME', 'LANGUAGE').
 *
 * @example
 * ```typescript
 * type KeyName = ServiceKeyName;
 * // 'LANGUAGE' | 'GALLERY_DOWNLOAD' | 'GALLERY_RENDERER' | ...
 *
 * function hasServiceKey(key: string): key is ServiceKeyName {
 *   return key in SERVICE_KEYS;
 * }
 * ```
 */
export type ServiceKeyName = keyof typeof SERVICE_KEYS;
