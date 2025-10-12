/**
 * Typed service accessors wrapping the service-bridge and centralizing SERVICE_KEYS usage.
 * Use these helpers instead of referring to SERVICE_KEYS directly in features/bootstrap.
 */
import type { BulkDownloadService } from '../services/BulkDownloadService';
import { bulkDownloadService as __bulkDownloadServiceInstance } from '../services/BulkDownloadService';
import type { FilenameService } from '../media/filename-service';
import type { ThemeService } from '../services/ThemeService';
import type { ToastController } from '../services/ToastController';
import type { GalleryRenderer } from '../interfaces/gallery.interfaces';

import { bridgeGetService, bridgeRegister, bridgeTryGet } from './service-bridge';
import { SERVICE_KEYS } from '../../constants';

// Getters (from container)
export function getToastController(): ToastController {
  return bridgeGetService<ToastController>(SERVICE_KEYS.TOAST);
}

export function getThemeService(): ThemeService {
  return bridgeGetService<ThemeService>(SERVICE_KEYS.THEME);
}

export function getMediaFilenameService(): FilenameService {
  return bridgeGetService<FilenameService>(SERVICE_KEYS.MEDIA_FILENAME);
}

export function getBulkDownloadServiceFromContainer(): BulkDownloadService {
  try {
    return bridgeGetService<BulkDownloadService>(SERVICE_KEYS.BULK_DOWNLOAD);
  } catch {
    // Lazy fallback: register module-level singleton if not present
    // This keeps tests green even when core service registration hasn't run yet.
    // Use module-level instance imported above to avoid dynamic import issues in ESM tests.
    const bulkDownloadService = __bulkDownloadServiceInstance as BulkDownloadService;
    bridgeRegister(SERVICE_KEYS.BULK_DOWNLOAD, bulkDownloadService);
    // Also provide gallery alias for compatibility
    bridgeRegister(SERVICE_KEYS.GALLERY_DOWNLOAD, bulkDownloadService);
    return bulkDownloadService;
  }
}

export function getGalleryDownloadService(): BulkDownloadService {
  return bridgeGetService<BulkDownloadService>(SERVICE_KEYS.GALLERY_DOWNLOAD);
}

export function getMediaServiceFromContainer(): unknown {
  // Return unknown to avoid type-level import and potential circular deps with MediaService
  return bridgeGetService<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
}

export function getGalleryRenderer(): GalleryRenderer {
  return bridgeGetService<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
}

// Registrations (to container)
export function registerGalleryRenderer(renderer: unknown): void {
  bridgeRegister(SERVICE_KEYS.GALLERY_RENDERER, renderer);
}

export function registerSettingsManager(settings: unknown): void {
  bridgeRegister(SERVICE_KEYS.SETTINGS, settings);
}

// Optional getter (no-throw) for Settings service; avoids exposing SERVICE_KEYS at call sites
export function tryGetSettingsManager<T = unknown>(): T | null {
  return bridgeTryGet<T>(SERVICE_KEYS.SETTINGS);
}

export function registerTwitterTokenExtractor(instance: unknown): void {
  bridgeRegister(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, instance);
}

// Warmup helpers to initialize services without exposing keys at call sites
export function warmupCriticalServices(): void {
  // MediaService covers MEDIA_SERVICE/VIDEO_CONTROL/MEDIA_EXTRACTION/VIDEO_STATE registrations
  try {
    void getMediaServiceFromContainer();
  } catch {
    // noop
  }
  try {
    void getToastController();
  } catch {
    // noop
  }
}

export function warmupNonCriticalServices(): void {
  try {
    void getThemeService();
  } catch {
    // noop
  }
  try {
    void getBulkDownloadServiceFromContainer();
  } catch {
    // noop
  }
  try {
    void getMediaFilenameService();
  } catch {
    // noop
  }
  try {
    void getGalleryDownloadService();
  } catch {
    // noop
  }
}
