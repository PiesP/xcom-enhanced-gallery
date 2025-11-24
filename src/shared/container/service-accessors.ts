import type { FilenameService } from "@shared/services/filename-service";
import type { ThemeServiceContract } from "@shared/services/theme-service.contract";
import type { LanguageService } from "@shared/services/language-service";
import type { GalleryRenderer } from "@shared/interfaces/gallery.interfaces";

import { CoreServiceRegistry } from "@shared/container/core-service-registry";
import { SERVICE_KEYS } from "@/constants";

// ============================================================================
// Service Key Accessors (Phase 414): Centralized SERVICE_KEYS exposure
// ============================================================================
// Keeping the literal SERVICE_KEYS references inside this module maintains the
// existing lint contract (only specific files may reference SERVICE_KEYS).
// Other modules should import these constants instead of referencing
// SERVICE_KEYS directly.

export const THEME_SERVICE_IDENTIFIER = SERVICE_KEYS.THEME;
export const LANGUAGE_SERVICE_IDENTIFIER = SERVICE_KEYS.LANGUAGE;
export const CORE_BASE_SERVICE_IDENTIFIERS = [
  THEME_SERVICE_IDENTIFIER,
  LANGUAGE_SERVICE_IDENTIFIER,
] as const;
export type CoreBaseServiceIdentifier =
  (typeof CORE_BASE_SERVICE_IDENTIFIERS)[number];

// ============================================================================
// Required Service Getters
// ============================================================================
// These throw if service not found. Use for guaranteed services.

/**
 * Get theme service for UI styling.
 *
 * @returns ThemeService for theme management
 * @throws CoreService throws if theme service not registered
 */
export function getThemeService(): ThemeServiceContract {
  return CoreServiceRegistry.get<ThemeServiceContract>(SERVICE_KEYS.THEME);
}

/**
 * Get language service for i18n.
 *
 * @returns LanguageService for language management
 * @throws CoreService throws if language service not registered
 */
export function getLanguageService(): LanguageService {
  return CoreServiceRegistry.get<LanguageService>(SERVICE_KEYS.LANGUAGE);
}

/**
 * Get media filename service for filename generation.
 *
 * @returns FilenameService for media file naming
 * @throws CoreService throws if filename service not registered
 */
export function getMediaFilenameService(): FilenameService {
  return CoreServiceRegistry.get<FilenameService>(SERVICE_KEYS.MEDIA_FILENAME);
}

import type { MediaService } from "@shared/services/media-service";

/**
 * Get media service.
 *
 * @returns MediaService instance
 * @throws CoreService throws if media service not registered
 */
export function getMediaService(): MediaService {
  return CoreServiceRegistry.get<MediaService>(SERVICE_KEYS.MEDIA_SERVICE);
}

/**
 * Get media service (untyped to avoid circular dependency).
 * @deprecated Use getMediaService() instead
 *
 * @returns Media service instance (unknown type due to cyclic import)
 * @throws CoreService throws if media service not registered
 */
export function getMediaServiceFromContainer(): unknown {
  return CoreServiceRegistry.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
}

/**
 * Get gallery renderer for media display.
 *
 * @returns GalleryRenderer for rendering gallery UI
 * @throws CoreService throws if gallery renderer not registered
 */
export function getGalleryRenderer(): GalleryRenderer {
  return CoreServiceRegistry.get<GalleryRenderer>(
    SERVICE_KEYS.GALLERY_RENDERER,
  );
}

// ============================================================================
// Service Registration Helpers
// ============================================================================
// Helper functions for registering services in the registry.

/**
 * Register gallery renderer in service registry.
 *
 * @param renderer - GalleryRenderer instance to register
 *
 * @example
 * const renderer = new GalleryRenderer(config);
 * registerGalleryRenderer(renderer);
 */
export function registerGalleryRenderer(renderer: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.GALLERY_RENDERER, renderer);
}

/**
 * Register settings manager in service registry.
 *
 * @param settings - Settings manager instance to register
 */
export function registerSettingsManager(settings: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.SETTINGS, settings);
}

/**
 * Register Twitter token extractor in service registry.
 *
 * @param instance - Token extractor instance to register
 */
export function registerTwitterTokenExtractor(instance: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, instance);
}

// ============================================================================
// Optional Service Getters (Return null if missing)
// ============================================================================

/**
 * Get settings manager safely (returns null if not registered).
 *
 * @template T - Settings manager type (defaults to unknown)
 * @returns Settings manager instance or null if not found
 *
 * @example
 * const settings = tryGetSettingsManager<ISettingsManager>();
 * if (settings) {
 *   const value = settings.get('key');
 * }
 */
export function tryGetSettingsManager<T = unknown>(): T | null {
  return CoreServiceRegistry.tryGet<T>(SERVICE_KEYS.SETTINGS);
}

// ============================================================================
// Service Warmup (Lazy initialization attempts)
// ============================================================================

/**
 * Pre-initialize critical services (best-effort, no error throwing).
 *
 * **Services**: MediaService
 * **Behavior**: Silently fails if service not available
 * **Use Case**: Eager initialization for performance (optional)
 */
export function warmupCriticalServices(): void {
  try {
    void getMediaServiceFromContainer();
  } catch {
    // noop: Only needed in browser environment
  }
}

/**
 * Pre-initialize non-critical services (best-effort, no error throwing).
 *
 * **Services**: ThemeService, MediaFilenameService
 * **Behavior**: Silently fails if service not available
 * **Use Case**: Eager initialization for performance (optional)
 */
export function warmupNonCriticalServices(): void {
  try {
    void getThemeService();
  } catch {
    // noop
  }
  try {
    void getMediaFilenameService();
  } catch {
    // noop
  }
}
