import { SERVICE_KEYS } from '@constants';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import { logger } from '@shared/logging';
import type { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import type { LanguageService } from '@shared/services/language-service';
import type { MediaService } from '@shared/services/media-service';
import { CoreService } from '@shared/services/service-manager';
import {
  getLanguageServiceInstance,
  getMediaServiceInstance,
  getThemeServiceInstance,
} from '@shared/services/singletons';
import type { ThemeServiceContract } from '@shared/services/theme-service.contract';

// ============================================================================
// Service Key Accessors (Phase 414): Centralized SERVICE_KEYS exposure
// ============================================================================
// Keeping the literal SERVICE_KEYS references inside this module maintains the
// existing lint contract (only specific files may reference SERVICE_KEYS).
// Other modules should import these constants instead of referencing
// SERVICE_KEYS directly.

export const THEME_SERVICE_IDENTIFIER = SERVICE_KEYS.THEME;
export const LANGUAGE_SERVICE_IDENTIFIER = SERVICE_KEYS.LANGUAGE;
export const MEDIA_SERVICE_IDENTIFIER = SERVICE_KEYS.MEDIA_SERVICE;

export const CORE_BASE_SERVICE_IDENTIFIERS = [
  THEME_SERVICE_IDENTIFIER,
  LANGUAGE_SERVICE_IDENTIFIER,
  MEDIA_SERVICE_IDENTIFIER,
] as const;
export type CoreBaseServiceIdentifier = (typeof CORE_BASE_SERVICE_IDENTIFIERS)[number];

// ============================================================================
// Helper: Try CoreService first for test mock support
// ============================================================================
// [CRITICAL] This priority logic is STRICTLY for testing purposes.
// In test environments, mocks are registered in CoreService.
// We check CoreService first to allow mock injection, then fallback to ES Module singleton.
//
// DO NOT use CoreService directly in business logic for static services.
// ALWAYS use the accessor functions exported below.

function tryGetFromCoreService<T>(key: string): T | null {
  try {
    const coreService = CoreService.getInstance();
    if (coreService.has(key)) {
      return coreService.get<T>(key);
    }
  } catch (error) {
    // CoreService not available, use ES Module singleton
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.debug('[service-accessors] CoreService unavailable, using singleton fallback', {
        key,
        error,
      });
    }
  }
  return null;
}

// ============================================================================
// Required Service Getters
// ============================================================================
// These check CoreService first (for test mocks), then use ES Module singletons.
// This hybrid approach enables both test mock injection and production tree-shaking.
//
// [RULE] Always use these getters instead of CoreService.getInstance().get() for static services.

/**
 * Get theme service for UI styling.
 * Checks CoreService first (for test mocks), then uses ES Module singleton.
 *
 * @returns ThemeService for theme management
 */
export function getThemeService(): ThemeServiceContract {
  return (
    tryGetFromCoreService<ThemeServiceContract>(SERVICE_KEYS.THEME) ?? getThemeServiceInstance()
  );
}

/**
 * Get language service for i18n.
 * Checks CoreService first (for test mocks), then uses ES Module singleton.
 *
 * @returns LanguageService for language management
 */
export function getLanguageService(): LanguageService {
  return (
    tryGetFromCoreService<LanguageService>(SERVICE_KEYS.LANGUAGE) ?? getLanguageServiceInstance()
  );
}

/**
 * Get media service.
 * Checks CoreService first (for test mocks), then uses ES Module singleton.
 *
 * @returns MediaService instance
 */
export function getMediaService(): MediaService {
  return (
    tryGetFromCoreService<MediaService>(SERVICE_KEYS.MEDIA_SERVICE) ?? getMediaServiceInstance()
  );
}

/**
 * Get gallery renderer for media display.
 *
 * [ARCHITECTURE NOTE] GalleryRenderer uses CoreService.getInstance().get() pattern
 * (runtime-registered service) instead of ES Module Singleton. This is intentional because:
 * 1. GalleryRenderer is dynamically registered at runtime during gallery initialization
 * 2. Its lifecycle is tied to gallery feature enablement, not app startup
 * 3. ES Module Singleton pattern requires static initialization which conflicts with
 *    lazy-loading requirements for bundle optimization
 *
 * @returns GalleryRenderer for rendering gallery UI
 * @throws CoreService throws if gallery renderer not registered
 */
export function getGalleryRenderer(): GalleryRenderer {
  return CoreService.getInstance().get<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
}

// ============================================================================
// Lazy-Loaded Service Getters
// ============================================================================
// These services are loaded on-demand to optimize initial bundle size.

/**
 * Get download orchestrator (lazy-loaded).
 *
 * This accessor ensures the download service is registered before returning it.
 * Uses lazy loading pattern to reduce initial bundle size by ~15-20KB.
 *
 * @returns Promise resolving to DownloadOrchestrator instance
 * @throws Error if download service registration fails
 *
 * @example
 * const orchestrator = await getDownloadOrchestrator();
 * await orchestrator.downloadSingle(mediaInfo);
 */
export async function getDownloadOrchestrator() {
  // Check CoreService first for test mocks
  const coreService = CoreService.getInstance();
  if (coreService.has(SERVICE_KEYS.GALLERY_DOWNLOAD)) {
    return coreService.get<DownloadOrchestrator>(SERVICE_KEYS.GALLERY_DOWNLOAD);
  }

  const { ensureDownloadServiceRegistered } = await import('@shared/services/lazy-services');
  await ensureDownloadServiceRegistered();

  const { DownloadOrchestrator } = await import('@shared/services/download/download-orchestrator');
  return DownloadOrchestrator.getInstance();
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
export function registerGalleryRenderer(renderer: GalleryRenderer): void {
  CoreService.getInstance().register(SERVICE_KEYS.GALLERY_RENDERER, renderer);
}

/**
 * Register settings manager in service registry.
 *
 * @param settings - Settings manager instance to register
 */
export function registerSettingsManager(settings: unknown): void {
  CoreService.getInstance().register(SERVICE_KEYS.SETTINGS, settings);
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
  return CoreService.getInstance().tryGet<T>(SERVICE_KEYS.SETTINGS);
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
    void getMediaService();
  } catch (error) {
    // noop: Only needed in browser environment
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.debug('[service-accessors] warmupCriticalServices failed (ignored)', error);
    }
  }
}

/**
 * Pre-initialize non-critical services (best-effort, no error throwing).
 *
 * **Services**: ThemeService
 * **Behavior**: Silently fails if service not available
 * **Use Case**: Eager initialization for performance (optional)
 */
export function warmupNonCriticalServices(): void {
  try {
    void getThemeService();
  } catch (error) {
    // noop
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.debug('[service-accessors] warmupNonCriticalServices failed (ignored)', error);
    }
  }
}
