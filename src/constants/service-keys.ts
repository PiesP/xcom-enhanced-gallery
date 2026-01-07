/**
 * @fileoverview Service key constants for dependency injection container
 * @description Centralized string constants for service registration and lookup in CoreService.
 * All keys follow dot-notation format: `<category>.<name>` and are grouped by functional category.
 * @module constants/service-keys
 *
 * @remarks
 * **Key Format Convention**:
 * - Pattern: `<category>.<name>`
 * - Category: Broad functional area (core, gallery, media, settings, ui)
 * - Name: Specific service identifier (lowercase, descriptive)
 *
 * **Usage Pattern**:
 * ```typescript
 * // Registration
 * CoreService.getInstance().register(SERVICE_KEYS.THEME, themeService);
 *
 * // Lookup (prefer service accessors)
 * import { getThemeService } from '@shared/container/service-accessors';
 * const theme = getThemeService();
 * ```
 *
 * **Reserved Keys**:
 * Some keys are defined but commented out, reserved for future features.
 * These maintain naming consistency and prevent conflicts during development.
 *
 * @example
 * ```typescript
 * import { SERVICE_KEYS } from '@constants/service-keys';
 * import { CoreService } from '@shared/services/service-manager';
 *
 * // Register a service
 * const service = new MyService();
 * CoreService.getInstance().register(SERVICE_KEYS.MEDIA_SERVICE, service);
 *
 * // Retrieve a service (not recommended, use accessors instead)
 * const retrieved = CoreService.getInstance().get(SERVICE_KEYS.MEDIA_SERVICE);
 * ```
 *
 * @see {@link CoreService} for service registration and lifecycle
 * @see {@link module:shared/container/service-accessors} for typed service access
 */

/**
 * Service key constants for dependency injection
 *
 * @remarks
 * This object uses `as const` to preserve literal types, enabling:
 * - Type-safe service key references
 * - Exhaustive pattern matching in TypeScript
 * - IDE autocomplete for all service keys
 *
 * Keys are organized by functional category and sorted alphabetically within each group.
 *
 * **Categories**:
 * - **Core**: Fundamental application services (language, i18n)
 * - **Gallery**: Gallery feature services (rendering, downloads)
 * - **Media**: Media processing services (extraction, metadata)
 * - **Settings**: Configuration and preferences services
 * - **UI**: User interface services (theme, animations)
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

  // ========================================
  // Reserved Keys (Future Extensions)
  // ========================================
  //
  // The following keys are reserved for planned features but not currently implemented.
  // They are commented out to prevent accidental registration while maintaining
  // naming consistency for future development.
  //
  // **Do not remove** - Uncomment and implement when the corresponding feature is added.
  //
  // ========================================

  /**
   * [RESERVED] Animation service for coordinated motion control
   *
   * @remarks
   * Future service for managing complex animations, transitions, and motion preferences.
   * Will respect `prefers-reduced-motion` and provide animation queuing.
   *
   * @reserved
   */
  // ANIMATION: 'ui.animation',

  /**
   * [RESERVED] Gallery root service for component orchestration
   *
   * @remarks
   * Future high-level gallery service for coordinating renderer, download, and state.
   * Will act as facade for gallery feature module.
   *
   * @reserved
   */
  // GALLERY: 'gallery.root',

  /**
   * [RESERVED] Media extraction service
   *
   * @remarks
   * Future dedicated service for extracting media from tweets and profiles.
   * Currently handled directly by MediaExtractionService without DI registration.
   *
   * @reserved
   */
  // MEDIA_EXTRACTION: 'media.extraction',

  /**
   * [RESERVED] Video playback control service
   *
   * @remarks
   * Future service for centralized video playback control (play/pause/seek/volume).
   * Will coordinate with VideoStateService for state management.
   *
   * @reserved
   */
  // VIDEO_CONTROL: 'video.control',

  /**
   * [RESERVED] Video state management service
   *
   * @remarks
   * Future service for tracking video playback state across gallery navigation.
   * Will preserve play position, volume, and mute state.
   *
   * @reserved
   */
  // VIDEO_STATE: 'video.state',
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
