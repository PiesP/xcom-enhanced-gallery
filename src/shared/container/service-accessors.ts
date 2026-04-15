import { SERVICE_KEYS } from '@constants/service-keys';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { CoreService } from '@shared/services/service-manager';
import { ThemeService } from '@shared/services/theme-service';
import type { ThemeServiceContract } from '@shared/services/theme-service.contract';

// ============================================================================
// Required Service Getters
// ============================================================================
// Singleton-backed service getters use their direct source of truth.

export function getThemeService(): ThemeServiceContract {
  return ThemeService.getInstance();
}

export function getLanguageService(): LanguageService {
  return LanguageService.getInstance();
}

export function getMediaService(): MediaService {
  return MediaService.getInstance();
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
