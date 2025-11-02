/**
 * @fileoverview Lazy ZIP Creation Utilities
 * @description ZIP 생성 기능을 동적 import로 로드하는 유틸리티 (Phase 326.3)
 * @module shared/utils
 *
 * 목적:
 * - ZIP 생성 기능을 필요시 동적으로 로드
 * - 초기 로드 시 ZIP 코드 제외 (bulk 다운로드 시에만 필요)
 * - 초기 번들 크기 감소 (ZIP 관련 코드 ~20KB)
 *
 * 전략:
 * - getLazyZipCreator: ZIP 생성 필요시 createZipBytesFromFileMap 동적 임포트
 * - preloadZipCreation: requestIdleCallback으로 미리 로드 (선택적)
 *
 * 예상 효과:
 * - 초기 번들: 2-5 KB 감소 (ZIP 생성 코드 제외)
 * - ZIP 생성 시: 거의 지연 없음 (스토어 메서드 사용)
 * - 프리로드 사용시: ZIP 생성 버튼 클릭 시 즉시 처리
 *
 * 참고:
 * - 현재 프로젝트는 StoreZipWriter를 사용 (fflate 없음)
 * - 향후 fflate 통합 시 동적 로드로 최적화 가능
 */

import { logger } from '../logging';

/**
 * Lazy ZIP 생성 유틸리티 로드
 *
 * ZIP 파일 생성 시 필요한 createZipBytesFromFileMap을 동적 import
 * 에러 시 null 반환
 *
 * @returns ZIP 생성 함수 또는 null
 *
 * @example
 * ```typescript
 * // BulkDownloadService에서 사용
 * const zipCreator = await getLazyZipCreator();
 * if (zipCreator) {
 *   const zipped = await zipCreator(files, config);
 *   // ZIP 파일 처리
 * }
 * ```
 */
export async function getLazyZipCreator(): Promise<
  typeof import('../external/zip').createZipBytesFromFileMap | null
> {
  try {
    logger.debug('[LazyCompression] Loading ZIP creation utilities...');

    // Phase 326.3: ZIP 생성 기능 동적 import
    // ZIP 기능은 bulk 다운로드 시에만 필요
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
