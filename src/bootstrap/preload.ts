/**
 * Phase 326: Code Splitting - preload strategy
 *
 * Dynamic chunk loading optimization strategy after chunk separation
 * - Critical Path: Preload essential chunks
 * - Optional Path: Load optional features during idle time
 * - ZIP Path: Phase 326.3 - ZIP creation dynamic loading (lazy-compression)
 *
 * Note:
 * - Settings preload: Handled directly in GalleryApp via ensureSettingsServiceInitialized
 * - This is because Settings loading is closely related to Gallery initialization
 *
 * @see [PHASE_326_CODE_SPLITTING_PLAN.md](../../docs/PHASE_326_CODE_SPLITTING_PLAN.md)
 */

import { logger } from '@shared/logging';
import { preloadZipCreation } from '@shared/utils/lazy-compression';

/**
 * Critical chunk preload
 * Preload essential chunks after initialization - Gallery, Services, etc.
 *
 * @private Internal bootstrap function
 */
export async function preloadCriticalChunks(): Promise<void> {
  logger.debug('[preload] Preloading critical chunks...');

  try {
    // Preload Gallery chunk (main feature)
    // Phase 326: Chunk separation via dynamic import
    await import('@features/gallery');
    logger.debug('[preload] Gallery chunk loaded');
  } catch (error) {
    logger.warn('[preload] Critical chunk preload failed:', error);
  }
}

/**
 * Optional chunk delayed loading
 * Load Settings and other optional feature chunks during browser idle time
 *
 * Falls back to timeout if requestIdleCallback is unsupported
 *
 * @private Internal bootstrap function
 */
export async function preloadOptionalChunks(): Promise<void> {
  // Check requestIdleCallback support
  const schedulePreload = (callback: () => Promise<void>) => {
    const hasRequestIdleCallback =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as Record<string, unknown>).requestIdleCallback === 'function';

    if (hasRequestIdleCallback) {
      const requestIdleCallback = (globalThis as Record<string, unknown>).requestIdleCallback as (
        cb: () => void
      ) => void;
      requestIdleCallback(() => {
        void callback();
      });
    } else {
      // Fallback: Load after 2 seconds (estimated idle time)
      globalThis.setTimeout(() => {
        void callback();
      }, 2000);
    }
  };

  schedulePreload(async () => {
    logger.debug('[preload] Preloading optional chunks...');

    try {
      // Delayed Settings chunk loading
      // Phase 326: Chunk separation via dynamic import
      await import('@features/settings');
      logger.debug('[preload] Settings chunk loaded');
    } catch (error) {
      logger.warn('[preload] Optional chunk preload failed:', error);
    }
  });
}

/**
 * 프리로드 전략 전체 실행
 * Critical 먼저, Optional과 ZIP은 비동기로 진행
 *
 * Phase 326.3: ZIP 생성 동적 로드 통합
 * - Critical: Gallery 필수 기능
 * - Optional: Settings 서비스 (requestIdleCallback)
 * - ZIP: preloadZipCreation (독립 스케줄)
 *
 * @public 부트스트랩에서 호출
 */
export async function executePreloadStrategy(): Promise<void> {
  logger.info('[preload] 프리로드 전략 시작');

  try {
    // Critical 먼저 로드 (순서 보장)
    await preloadCriticalChunks();

    // Optional과 ZIP은 비동기로 진행 (메인 스레드 블로킹 안 함)
    void preloadOptionalChunks();
    void preloadZipCreation(); // Phase 326.3: ZIP 생성 동적 로드
  } catch (error) {
    logger.error('[preload] 프리로드 전략 실행 실패:', error);
  }
}
