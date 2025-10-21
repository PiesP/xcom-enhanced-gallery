/**
 * Typed service accessors wrapping the service-bridge and centralizing SERVICE_KEYS usage.
 * Use these helpers instead of referring to SERVICE_KEYS directly in features/bootstrap.
 */
import type { BulkDownloadService } from '../services/bulk-download-service';
import type { FilenameService } from '../media/filename-service';
import type { ThemeService } from '../services/theme-service';
import type { ToastController } from '../services/toast-controller';
import type { GalleryRenderer } from '../interfaces/gallery.interfaces';

import {
  bridgeGetService,
  bridgeRegister,
  bridgeTryGet,
  bridgeRegisterBaseService,
  bridgeInitializeAllBaseServices,
} from './service-bridge';
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
  return bridgeGetService<BulkDownloadService>(SERVICE_KEYS.BULK_DOWNLOAD);
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

/**
 * Phase A5.2: BaseService 초기화 헬퍼
 */
export async function initializeBaseServices(): Promise<void> {
  // 초기화 순서: ANIMATION → THEME → LANGUAGE
  // (이 순서는 서비스 간 의존성을 고려)
  await bridgeInitializeAllBaseServices([
    SERVICE_KEYS.ANIMATION,
    SERVICE_KEYS.THEME,
    SERVICE_KEYS.LANGUAGE,
  ]);
}

/**
 * BaseService 등록 (main.ts에서 사용)
 */
export function registerBaseService(key: string, service: unknown): void {
  bridgeRegisterBaseService(key, service as Parameters<typeof bridgeRegisterBaseService>[1]);
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

/**
 * BaseService를 service-manager에 등록
 * Phase A5.2: AnimationService, ThemeService, LanguageService 중앙 관리
 */
export function registerCoreBaseServices(): void {
  try {
    const { AnimationService } = require('../services/animation-service');
    const animationService = AnimationService.getInstance();
    registerBaseService(SERVICE_KEYS.ANIMATION, animationService);
  } catch {
    // noop
  }

  try {
    const { themeService } = require('../services/theme-service');
    registerBaseService(SERVICE_KEYS.THEME, themeService);
  } catch {
    // noop
  }

  try {
    const { languageService } = require('../services/language-service');
    registerBaseService(SERVICE_KEYS.LANGUAGE, languageService);
  } catch {
    // noop
  }
}
