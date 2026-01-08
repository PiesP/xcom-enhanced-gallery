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
// Check CoreService first for test mocks, then fallback to ES Module singleton.
// DO NOT use CoreService directly; use accessors below.

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
 */
function tryGetFromCoreService<T>(key: string): T | null {
  try {
    const coreService = CoreService.getInstance();
    if (coreService.has(key)) {
      return coreService.get<T>(key);
    }
  } catch (error) {
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
// Service getters: check CoreService first (test mocks), fallback to singletons.

export function getThemeService(): ThemeServiceContract {
  return (
    tryGetFromCoreService<ThemeServiceContract>(SERVICE_KEYS.THEME) ?? ThemeService.getInstance()
  );
}

export function getLanguageService(): LanguageService {
  return (
    tryGetFromCoreService<LanguageService>(SERVICE_KEYS.LANGUAGE) ?? LanguageService.getInstance()
  );
}

export function getMediaService(): MediaService {
  return (
    tryGetFromCoreService<MediaService>(SERVICE_KEYS.MEDIA_SERVICE) ?? MediaService.getInstance()
  );
}

/** Get gallery renderer (runtime-registered, not ES module singleton). */
export function getGalleryRenderer(): GalleryRenderer {
  return CoreService.getInstance().get<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
}

// Lazy-loaded (deferred registration) services. Single-file bundle, no dynamic imports.

export async function getDownloadOrchestrator(): Promise<DownloadOrchestrator> {
  const coreService = CoreService.getInstance();
  if (coreService.has(SERVICE_KEYS.GALLERY_DOWNLOAD)) {
    return coreService.get<DownloadOrchestrator>(SERVICE_KEYS.GALLERY_DOWNLOAD);
  }

  const orchestrator = DownloadOrchestrator.getInstance();
  coreService.register(SERVICE_KEYS.GALLERY_DOWNLOAD, orchestrator);
  return orchestrator;
}

// Service registration helpers.

export function registerGalleryRenderer(renderer: GalleryRenderer): void {
  CoreService.getInstance().register(SERVICE_KEYS.GALLERY_RENDERER, renderer);
}

export function registerSettingsManager(settings: unknown): void {
  CoreService.getInstance().register(SERVICE_KEYS.SETTINGS, settings);
}

// Optional service getter: returns null if not registered.

export function tryGetSettingsManager<T = unknown>(): T | null {
  return CoreService.getInstance().tryGet<T>(SERVICE_KEYS.SETTINGS);
}
