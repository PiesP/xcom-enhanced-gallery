/**
 * Phase 326: Code Splitting - 프리로드 전략
 *
 * 청크 분리 후 동적 로드 최적화 전략
 * - Critical Path: 필수 청크 미리 로드
 * - Optional Path: 유휴 시간에 선택 기능 로드
 *
 * @see [PHASE_326_CODE_SPLITTING_PLAN.md](../../docs/PHASE_326_CODE_SPLITTING_PLAN.md)
 */

import { logger } from '@shared/logging';

/**
 * Critical 청크 프리로드
 * 초기화 완료 후 Gallery, Services 등 필수 청크 미리 로드
 *
 * @private 내부 부트스트랩 함수
 */
export async function preloadCriticalChunks(): Promise<void> {
  logger.debug('[preload] Critical 청크 프리로드 중...');

  try {
    // Gallery 청크 미리 로드 (주요 기능)
    // Phase 326: 동적 import로 청크 분리
    await import('@features/gallery');
    logger.debug('[preload] Gallery 청크 로드 완료');
  } catch (error) {
    logger.warn('[preload] Critical 청크 프리로드 실패:', error);
  }
}

/**
 * Optional 청크 지연 로드
 * 브라우저 유휴 시간에 Settings 등 선택 기능 청크 로드
 *
 * requestIdleCallback 미지원 시 타임아웃으로 폴백
 *
 * @private 내부 부트스트랩 함수
 */
export async function preloadOptionalChunks(): Promise<void> {
  // requestIdleCallback 지원 여부 확인
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
      // Fallback: 2초 후 로드 (유휴 시간으로 추정)
      globalThis.setTimeout(() => {
        void callback();
      }, 2000);
    }
  };

  schedulePreload(async () => {
    logger.debug('[preload] Optional 청크 프리로드 중...');

    try {
      // Settings 청크 지연 로드
      // Phase 326: 동적 import로 청크 분리
      await import('@features/settings');
      logger.debug('[preload] Settings 청크 로드 완료');
    } catch (error) {
      logger.warn('[preload] Optional 청크 프리로드 실패:', error);
    }
  });
}

/**
 * 프리로드 전략 전체 실행
 * Critical 먼저, Optional은 비동기로 진행
 *
 * @public 부트스트랩에서 호출
 */
export async function executePreloadStrategy(): Promise<void> {
  logger.info('[preload] 프리로드 전략 시작');

  try {
    // Critical 먼저 로드 (순서 보장)
    await preloadCriticalChunks();

    // Optional은 비동기로 진행 (메인 스레드 블로킹 안 함)
    void preloadOptionalChunks();
  } catch (error) {
    logger.error('[preload] 프리로드 전략 실행 실패:', error);
  }
}
