/**
 * Vendor 사용을 위한 헬퍼 유틸리티들
 * 가이드라인에 맞춘 일관된 vendor 접근 패턴 제공
 */
import { logger } from '@infrastructure/logging/logger';

/**
 * Vendor 라이브러리 사전 로딩
 * 성능 최적화를 위한 preload 패턴
 */
export async function preloadVendors(): Promise<void> {
  try {
    const promises = [
      import('./index').then(module => {
        // Preact 관련 vendor들 미리 로딩
        module.getPreact();
        module.getPreactSignals();
      }),
      import('./index').then(module => {
        // fflate 미리 로딩 (선택적)
        return module.getFflate();
      }),
    ];

    await Promise.allSettled(promises);
    logger.debug('Vendor libraries preloaded successfully');
  } catch (error) {
    logger.warn('Vendor preloading failed:', error);
  }
}
