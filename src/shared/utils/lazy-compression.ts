/**
 * @fileoverview Lazy ZIP Creation Utilities
 * @description Utility to dynamically import ZIP creation via dynamic import (Phase 326.3)
 * @module shared/utils
 *
 * Purpose:
 * - Dynamically load ZIP creation functionality when needed
 * - Exclude ZIP code from initial load (only needed for bulk downloads)
 * - Reduce initial bundle size (ZIP-related code ~20KB)
 *
 * Strategy:
 * - getLazyZipCreator: Dynamically import createZipBytesFromFileMap when ZIP is needed
 * - preloadZipCreation: Preload via requestIdleCallback (optional)
 *
 * Expected effects:
 * - Initial bundle: 2-5 KB reduction (ZIP creation code excluded)
 * - ZIP creation: Minimal delay (uses store method)
 * - With preload: Immediate processing when ZIP creation button clicked
 *
 * Note:
 * - Current project uses StoreZipWriter (no fflate)
 * - Future fflate integration can optimize via dynamic loading
 */

import { logger } from '../logging';

/**
 * Lazy load ZIP creation utility
 *
 * Dynamically import createZipBytesFromFileMap needed for ZIP file creation
 * Returns null on error
 *
 * @returns ZIP creation function or null
 *
 * @example
 * ```typescript
 * // Use in BulkDownloadService
 * const zipCreator = await getLazyZipCreator();
 * if (zipCreator) {
 *   const zipped = await zipCreator(files, config);
 *   // Process ZIP file
 * }
 * ```
 */
export async function getLazyZipCreator(): Promise<
  typeof import('../external/zip').createZipBytesFromFileMap | null
> {
  try {
    logger.debug('[LazyCompression] Loading ZIP creation utilities...');

    // Phase 326.3: Dynamically import ZIP creation functionality
    // ZIP functionality is only needed for bulk downloads
    const zipModule = await import('../external/zip');

    if (zipModule?.createZipBytesFromFileMap) {
      logger.debug('[LazyCompression] ✅ ZIP creation utilities loaded');
      return zipModule.createZipBytesFromFileMap;
    }

    logger.warn('[LazyCompression] createZipBytesFromFileMap not found');
    return null;
  } catch (error) {
    logger.error('[LazyCompression] Failed to load ZIP utilities:', error);
    return null;
  }
}

/**
 * ZIP 생성 기능 프리로드 (선택적)
 *
 * requestIdleCallback을 사용하여 유휴 시간에 ZIP 생성 함수 미리 로드
 * 실패해도 무시 (non-critical)
 *
 * 단계:
 * 1. requestIdleCallback으로 유휴 시간 대기
 * 2. ZIP 생성 모듈 동적 import (캐싱됨)
 * 3. 나중에 ZIP 생성 시 즉시 사용 가능
 *
 * @example
 * ```typescript
 * // bootstrap/preload.ts 또는 BulkDownloadService 초기화 시
 * void preloadZipCreation(); // Fire and forget
 * ```
 */
export function preloadZipCreation(): void {
  try {
    // requestIdleCallback 또는 setTimeout fallback
    const schedulePreload = (callback: (deadline: IdleDeadline) => void) => {
      type RICFunction = (
        callback: (deadline: IdleDeadline) => void,
        options: { timeout: number }
      ) => void;
      const rIC = globalThis.requestIdleCallback as RICFunction | undefined;
      if (typeof rIC !== 'undefined') {
        return rIC(callback, { timeout: 5000 });
      }
      // Fallback: 5초 후 실행
      return globalThis.setTimeout(() => {
        callback({
          didTimeout: true,
          timeRemaining: () => 0,
        } as IdleDeadline);
      }, 5000);
    };

    schedulePreload(async () => {
      try {
        logger.debug('[LazyCompression] Preloading ZIP creation utilities...');

        // 동적 import로 ZIP 모듈 프리로드 (캐싱됨)
        await import('../external/zip');

        logger.debug('[LazyCompression] ✅ ZIP creation utilities preloaded');
      } catch (error) {
        logger.debug('[LazyCompression] Preload failed (non-critical):', error);
      }
    });
  } catch (error) {
    logger.debug('[LazyCompression] Preload scheduling failed:', error);
  }
}

/**
 * ZIP 생성 프리로드 전략
 *
 * Phase 326.3 통합:
 * - Lazy Load: getLazyZipCreator (필요시 동적 로드)
 * - Optional Preload: preloadZipCreation (idle 시간에 미리 로드)
 *
 * 효과:
 * - 초기 번들 크기: 2-5% 감소 (ZIP 생성 코드 제외)
 * - ZIP 생성 성능: 거의 동일 (캐싱된 ZIP 모듈 사용)
 * - 사용자 경험: 프리로드 후 bulk 다운로드가 즉시 처리됨
 */
export async function executeZipPreloadStrategy(): Promise<void> {
  logger.debug('[LazyCompression] Executing ZIP preload strategy');

  try {
    // requestIdleCallback으로 선택적 프리로드
    preloadZipCreation();
  } catch (error) {
    logger.debug('[LazyCompression] Preload strategy error:', error);
  }
}
