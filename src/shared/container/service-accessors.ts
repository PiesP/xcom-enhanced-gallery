import type { FilenameService } from '../services/file-naming';
import type { ThemeService } from '../services/theme-service';
import type { GalleryRenderer } from '../interfaces/gallery.interfaces';
import type { BaseService } from '../types/core/base-service.types';

import { CoreService } from '../services/core';
import { themeService } from '../services/theme-service';
import { languageService } from '../services/language-service';

import { CoreServiceRegistry } from './core-service-registry';
import { SERVICE_KEYS } from '@/constants';

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
export function getThemeService(): ThemeService {
  return CoreServiceRegistry.get<ThemeService>(SERVICE_KEYS.THEME);
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

/**
 * Get media service (untyped to avoid circular dependency).
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
  return CoreServiceRegistry.get<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
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
// BaseService Initialization (Framework setup)
// ============================================================================

/**
 * Initialize base services (infrastructure layer).
 *
 * **Services**: Theme, Language (PC-only, core infrastructure)
 * **Note**: AnimationService removed in Phase 414 (optional feature)
 *
 * @internal Called from app bootstrap phase
 * @throws If any base service initialization fails
 *
 * @example
 * // During app startup
 * await initializeBaseServices();
 */
export async function initializeBaseServices(): Promise<void> {
  await CoreService.getInstance().initializeAllBaseServices([
    SERVICE_KEYS.THEME,
    SERVICE_KEYS.LANGUAGE,
  ]);
}

/**
 * Register base service in registry.
 *
 * @internal Called from app bootstrap or service initialization
 * @param key - Service key from SERVICE_KEYS
 * @param service - Service instance to register
 */
export function registerBaseService(key: string, service: BaseService): void {
  CoreService.getInstance().registerBaseService(key, service);
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

/**
 * Register core base services (ThemeService, LanguageService).
 * Phase 414: AnimationService removed (optional feature)
 * @internal
 */
export function registerCoreBaseServices(): void {
  // Allow registration errors to surface so bootstrap can fail fast.
  registerBaseService(SERVICE_KEYS.THEME, themeService);
  registerBaseService(SERVICE_KEYS.LANGUAGE, languageService);
}
