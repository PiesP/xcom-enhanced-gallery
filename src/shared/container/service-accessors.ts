import { SERVICE_KEYS } from '@constants/service-keys';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import { logger } from '@shared/logging/logger';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { CoreService } from '@shared/services/service-manager';
import { ThemeService } from '@shared/services/theme-service';
import type { ThemeServiceContract } from '@shared/services/theme-service.contract';

// ============================================================================
// Helper: Try CoreService first for test mock support
// ============================================================================
// [CRITICAL] This priority logic is STRICTLY for testing purposes.
// In test environments, mocks are registered in CoreService.
// We check CoreService first to allow mock injection, then fallback to ES Module singleton.
//
// DO NOT use CoreService directly in business logic for static services.
// ALWAYS use the accessor functions exported below.

/**
 * Try to retrieve a service from CoreService (for test mocks).
 *
 * This function checks CoreService first to support test mock injection.
 * If the service is not registered in CoreService, returns null to trigger
 * fallback to ES Module singleton.
 *
 * @template T - Service type to retrieve
 * @param key - Service key from SERVICE_KEYS constants
 * @returns Service instance if registered in CoreService, null otherwise
 *
 * @internal This is a private helper for service accessors only.
 *
 * @example
 * const theme = tryGetFromCoreService<ThemeServiceContract>(SERVICE_KEYS.THEME);
 * if (!theme) {
 *   // Fallback to singleton
 * }
 */
function tryGetFromCoreService<T>(key: string): T | null {
  try {
    const coreService = CoreService.getInstance();
    if (coreService.has(key)) {
      return coreService.get<T>(key);
    }
  } catch (error) {
    // CoreService not available, use ES Module singleton
    if (__DEV__) {
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
 *
 * Retrieves the theme service instance using a hybrid resolution strategy:
 * 1. Checks CoreService for test mocks (testing only)
 * 2. Falls back to ES Module singleton (production)
 *
 * @returns ThemeService instance implementing ThemeServiceContract
 *
 * @example
 * const themeService = getThemeService();
 * const currentTheme = themeService.getCurrentTheme();
 * themeService.setTheme('dark');
 */
export function getThemeService(): ThemeServiceContract {
  return (
    tryGetFromCoreService<ThemeServiceContract>(SERVICE_KEYS.THEME) ?? ThemeService.getInstance()
  );
}

/**
 * Get language service for internationalization (i18n).
 *
 * Retrieves the language service instance using a hybrid resolution strategy:
 * 1. Checks CoreService for test mocks (testing only)
 * 2. Falls back to ES Module singleton (production)
 *
 * @returns LanguageService instance for language management and translations
 *
 * @example
 * const languageService = getLanguageService();
 * const translation = languageService.translate('msg.welcome');
 * languageService.setLanguage('ko');
 */
export function getLanguageService(): LanguageService {
  return (
    tryGetFromCoreService<LanguageService>(SERVICE_KEYS.LANGUAGE) ?? LanguageService.getInstance()
  );
}

/**
 * Get media service for media information extraction and processing.
 *
 * Retrieves the media service instance using a hybrid resolution strategy:
 * 1. Checks CoreService for test mocks (testing only)
 * 2. Falls back to ES Module singleton (production)
 *
 * @returns MediaService instance for media data extraction and validation
 *
 * @example
 * const mediaService = getMediaService();
 * const mediaInfo = await mediaService.extractMediaInfo(articleElement);
 */
export function getMediaService(): MediaService {
  return (
    tryGetFromCoreService<MediaService>(SERVICE_KEYS.MEDIA_SERVICE) ?? MediaService.getInstance()
  );
}

/**
 * Get gallery renderer for media display and UI interactions.
 *
 * [ARCHITECTURE NOTE] GalleryRenderer uses CoreService.getInstance().get() pattern
 * (runtime-registered service) instead of ES Module Singleton. This is intentional because:
 * 1. GalleryRenderer is dynamically registered at runtime during gallery initialization
 * 2. Its lifecycle is tied to gallery feature enablement, not app startup
 * 3. ES Module Singleton pattern requires static initialization which conflicts with
 *    lazy-loading requirements for bundle optimization
 *
 * @returns GalleryRenderer instance for rendering gallery UI
 * @throws Error if gallery renderer is not registered in CoreService
 *
 * @example
 * const galleryRenderer = getGalleryRenderer();
 * await galleryRenderer.render(mediaList);
 *
 * @example Error handling
 * try {
 *   const renderer = getGalleryRenderer();
 * } catch (error) {
 *   console.error('Gallery not initialized', error);
 * }
 */
export function getGalleryRenderer(): GalleryRenderer {
  return CoreService.getInstance().get<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
}

// ============================================================================
// Lazy-Loaded Service Getters
// ============================================================================
// These services are *initialized/registered* on-demand (deferred instantiation).
//
// Note:
// - This project ships a single-file userscript bundle (IIFE).
// - Runtime code-splitting / dynamic import() is intentionally unsupported.
//
// So "lazy" here refers to deferred instantiation/registration, not module loading.

/**
 * Get download orchestrator for media download functionality (lazily initialized).
 *
 * This accessor ensures the download service is registered before returning it.
 * Initialization is deferred until the first time a download operation is requested.
 *
 * This does not change the shipped bundle size (single-file output). It only
 * defers instantiation work until actually needed.
 *
 * @returns Promise resolving to DownloadOrchestrator instance
 * @throws Error if download service registration fails
 *
 * @example Basic usage
 * const orchestrator = await getDownloadOrchestrator();
 * await orchestrator.downloadSingle(mediaInfo);
 *
 * @example With error handling
 * try {
 *   const orchestrator = await getDownloadOrchestrator();
 *   await orchestrator.downloadBatch(mediaList);
 * } catch (error) {
 *   console.error('Download initialization failed', error);
 * }
 */
export async function getDownloadOrchestrator(): Promise<DownloadOrchestrator> {
  // Check CoreService first for test mocks
  const coreService = CoreService.getInstance();
  if (coreService.has(SERVICE_KEYS.GALLERY_DOWNLOAD)) {
    return coreService.get<DownloadOrchestrator>(SERVICE_KEYS.GALLERY_DOWNLOAD);
  }

  const orchestrator = DownloadOrchestrator.getInstance();
  coreService.register(SERVICE_KEYS.GALLERY_DOWNLOAD, orchestrator);
  return orchestrator;
}

// ============================================================================
// Service Registration Helpers
// ============================================================================
// Helper functions for registering services in the service registry.

/**
 * Register gallery renderer in the service registry.
 *
 * This function should be called during gallery initialization to make
 * the renderer available through getGalleryRenderer().
 *
 * @param renderer - GalleryRenderer instance to register
 *
 * @example
 * const renderer = new GalleryRenderer(config);
 * registerGalleryRenderer(renderer);
 *
 * // Later in code
 * const registered = getGalleryRenderer(); // Returns the registered instance
 */
export function registerGalleryRenderer(renderer: GalleryRenderer): void {
  CoreService.getInstance().register(SERVICE_KEYS.GALLERY_RENDERER, renderer);
}

/**
 * Register settings manager in the service registry.
 *
 * This function should be called during application initialization to make
 * the settings manager available through tryGetSettingsManager().
 *
 * @param settings - Settings manager instance to register
 *
 * @example
 * const settingsManager = new SettingsManager();
 * registerSettingsManager(settingsManager);
 *
 * // Later in code
 * const settings = tryGetSettingsManager<ISettingsManager>();
 * if (settings) {
 *   const theme = settings.get('theme');
 * }
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
 * Use this function when you need to access settings but the settings manager
 * might not be initialized yet (e.g., during early initialization phases).
 *
 * @template T - Settings manager type (defaults to unknown)
 * @returns Settings manager instance if registered, null otherwise
 *
 * @example Type-safe usage
 * const settings = tryGetSettingsManager<ISettingsManager>();
 * if (settings) {
 *   const value = settings.get('key');
 * }
 *
 * @example Early initialization check
 * const settings = tryGetSettingsManager();
 * if (!settings) {
 *   console.log('Settings not yet initialized');
 *   return;
 * }
 */
export function tryGetSettingsManager<T = unknown>(): T | null {
  return CoreService.getInstance().tryGet<T>(SERVICE_KEYS.SETTINGS);
}
