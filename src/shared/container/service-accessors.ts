/**
 * Typed service accessors wrapping the service-bridge and centralizing SERVICE_KEYS usage.
 * Use these helpers instead of referring to SERVICE_KEYS directly in features/bootstrap.
 */
import type { BulkDownloadService } from '../services/BulkDownloadService';
import type { FilenameService } from '../media/FilenameService';
import type { ThemeService } from '../services/ThemeService';
import type { ToastController } from '../services/ToastController';
import type { GalleryRenderer } from '../interfaces/gallery.interfaces';

import { bridgeGetService, bridgeRegister, bridgeTryGet } from './service-bridge';
import { SERVICE_KEYS } from '../../constants';

// Getters (from container)
export function getToastController(): ToastController {
  return bridgeGetService<ToastController>(SERVICE_KEYS.TOAST);
}

// Optional getter for ToastController (does not throw when missing)
export function tryGetToastController(): ToastController | null {
  return bridgeTryGet<ToastController>(SERVICE_KEYS.TOAST);
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
    // Phase 3: Avoid eager import at module eval time.
    // Do not import or instantiate BulkDownloadService here.
    // Callers must ensure core services are registered first
    // (registerCoreServices) before accessing this accessor.
    throw new Error(
      '[getBulkDownloadServiceFromContainer] BulkDownloadService is not available. Ensure core services are registered before access.'
    );
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
  // 단일 인스턴스 가드: 이미 등록된 인스턴스가 있다면 동일 참조는 무시,
  // 다른 인스턴스인 경우 이전 인스턴스를 우선 정리한 뒤 교체한다.
  const existing = bridgeTryGet<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
  if (existing) {
    if (existing === renderer) {
      // 동일 인스턴스 재등록은 무시 (idempotent)
      return;
    }
    try {
      // 안전한 정리 시도
      (existing as unknown as { destroy?: () => void; cleanup?: () => void }).destroy?.();
    } catch {
      // ignore
    }
    try {
      (existing as unknown as { destroy?: () => void; cleanup?: () => void }).cleanup?.();
    } catch {
      // ignore
    }
  }
  bridgeRegister(SERVICE_KEYS.GALLERY_RENDERER, renderer as GalleryRenderer);
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
