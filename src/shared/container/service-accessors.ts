/**
 * @fileoverview Service Accessors - 타입 안전한 서비스 접근자
 * @description
 * SERVICE_KEYS를 숨기고 명확한 타입 안전 접근자를 제공합니다.
 * 모든 접근은 CoreServiceRegistry를 통해 캐싱됩니다.
 *
 * **권장 용법**:
 * - Features에서: `getToastController()`, `getThemeService()` 등 사용
 * - SERVICE_KEYS 직접 참조 금지
 * - 없는 서비스는 try* 로 시작하는 함수 사용 (e.g., `tryGetSettingsManager()`)
 *
 * @example
 * ```typescript
 * // ✅ 접근자 사용
 * const toast = getToastController();
 * const theme = getThemeService();
 * const settings = tryGetSettingsManager();
 *
 * // ❌ SERVICE_KEYS 직접 사용 금지
 * import { SERVICE_KEYS } from '@/constants';
 * const service = CoreService.get(SERVICE_KEYS.TOAST);
 * ```
 */
import type { BulkDownloadService } from '../services/bulk-download-service';
import type { FilenameService } from '../services/file-naming';
import type { ThemeService } from '../services/theme-service';
import type { ToastController } from '../services/toast-controller';
import type { GalleryRenderer } from '../interfaces/gallery.interfaces';

import { CoreServiceRegistry } from './core-service-registry';
import { bridgeRegisterBaseService, bridgeInitializeAllBaseServices } from './service-bridge';
import { SERVICE_KEYS } from '../../constants';

// ============================================================================
// Service Getters (조회) - CoreServiceRegistry를 통한 캐싱
// ============================================================================

/**
 * 토스트 컨트롤러를 조회합니다.
 * @returns ToastController 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 */
export function getToastController(): ToastController {
  return CoreServiceRegistry.get<ToastController>(SERVICE_KEYS.TOAST);
}

/**
 * 테마 서비스를 조회합니다.
 * @returns ThemeService 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 */
export function getThemeService(): ThemeService {
  return CoreServiceRegistry.get<ThemeService>(SERVICE_KEYS.THEME);
}

/**
 * 미디어 파일명 서비스를 조회합니다.
 * @returns FilenameService 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 */
export function getMediaFilenameService(): FilenameService {
  return CoreServiceRegistry.get<FilenameService>(SERVICE_KEYS.MEDIA_FILENAME);
}

/**
 * 대량 다운로드 서비스를 조회합니다.
 * @returns BulkDownloadService 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 */
export function getBulkDownloadServiceFromContainer(): BulkDownloadService {
  return CoreServiceRegistry.get<BulkDownloadService>(SERVICE_KEYS.BULK_DOWNLOAD);
}

/**
 * 갤러리 다운로드 서비스를 조회합니다.
 * @returns BulkDownloadService 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 */
export function getGalleryDownloadService(): BulkDownloadService {
  return CoreServiceRegistry.get<BulkDownloadService>(SERVICE_KEYS.GALLERY_DOWNLOAD);
}

/**
 * 미디어 서비스를 조회합니다.
 * @returns unknown (순환 의존성 회피)
 * @throws 서비스를 찾을 수 없으면 예외 발생
 */
export function getMediaServiceFromContainer(): unknown {
  return CoreServiceRegistry.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
}

/**
 * 갤러리 렌더러를 조회합니다.
 * @returns GalleryRenderer 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 */
export function getGalleryRenderer(): GalleryRenderer {
  return CoreServiceRegistry.get<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
}

// ============================================================================
// Service Registrations (등록)
// ============================================================================

/**
 * 갤러리 렌더러를 등록합니다.
 * @param renderer 렌더러 인스턴스
 */
export function registerGalleryRenderer(renderer: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.GALLERY_RENDERER, renderer);
}

/**
 * 설정 관리자를 등록합니다.
 * @param settings 설정 관리자 인스턴스
 */
export function registerSettingsManager(settings: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.SETTINGS, settings);
}

/**
 * 트위터 토큰 추출기를 등록합니다.
 * @param instance 추출기 인스턴스
 */
export function registerTwitterTokenExtractor(instance: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, instance);
}

// ============================================================================
// Service Optional Getters (선택적 조회 - null 반환)
// ============================================================================

/**
 * 설정 관리자를 안전하게 조회합니다 (없으면 null).
 * @template T 서비스 타입 (기본값: unknown)
 * @returns 서비스 인스턴스 또는 null
 */
export function tryGetSettingsManager<T = unknown>(): T | null {
  return CoreServiceRegistry.tryGet<T>(SERVICE_KEYS.SETTINGS);
}

// ============================================================================
// BaseService Initialization & Registration
// ============================================================================

/**
 * Base 서비스들을 초기화합니다 (AnimationService, ThemeService, LanguageService).
 * 초기화 순서: ANIMATION → THEME → LANGUAGE (의존성 고려)
 *
 * @internal
 */
export async function initializeBaseServices(): Promise<void> {
  await bridgeInitializeAllBaseServices([
    SERVICE_KEYS.ANIMATION,
    SERVICE_KEYS.THEME,
    SERVICE_KEYS.LANGUAGE,
  ]);
}

/**
 * Base 서비스를 등록합니다.
 * @param key 서비스 키
 * @param service 서비스 인스턴스
 *
 * @internal
 */
export function registerBaseService(key: string, service: unknown): void {
  bridgeRegisterBaseService(key, service as Parameters<typeof bridgeRegisterBaseService>[1]);
}

// ============================================================================
// Service Warmup Helpers (Lazy 초기화 시도)
// ============================================================================

/**
 * 필수 서비스들을 미리 초기화합니다 (실패해도 무시).
 * MediaService, ToastController 초기화 시도.
 */
export function warmupCriticalServices(): void {
  try {
    void getMediaServiceFromContainer();
  } catch {
    // noop: 브라우저 환경에서만 필요
  }
  try {
    void getToastController();
  } catch {
    // noop
  }
}

/**
 * 비필수 서비스들을 미리 초기화합니다 (실패해도 무시).
 * ThemeService, BulkDownloadService 등 초기화 시도.
 */
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
 * Core Base 서비스들을 등록합니다 (AnimationService, ThemeService, LanguageService).
 * @internal
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
