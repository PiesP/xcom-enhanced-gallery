/**
 * @fileoverview WebP 최적화 유틸리티
 * @description WebP 지원 감지 및 URL 최적화 통합 모듈
 */

import { logger } from '@shared/logging/logger';
import { isTestEnvironment, isBrowserEnvironment } from './environment';

/**
 * WebP 지원 상태
 */
let webpSupportCache: boolean | null = null;

/**
 * WebP 지원 감지 (비동기)
 */
async function detectWebPSupport(): Promise<boolean> {
  try {
    // 테스트 환경에서는 기본값 true 사용
    if (isTestEnvironment()) {
      return true;
    }

    // 브라우저 환경이 아닌 경우
    if (!isBrowserEnvironment()) {
      return false;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    // canvas.toDataURL이 구현되지 않은 경우 (예: jsdom)
    if (typeof canvas.toDataURL !== 'function') {
      logger.debug('[WebPUtils] WebP detection skipped (canvas.toDataURL not available)');
      return false;
    }

    const dataURL = canvas.toDataURL('image/webp');

    // dataURL이 null이나 유효하지 않은 경우 처리
    if (!dataURL || typeof dataURL !== 'string') {
      logger.debug('[WebPUtils] WebP detection failed (invalid dataURL)');
      return false;
    }

    const isSupported = dataURL.indexOf('data:image/webp') === 0;
    logger.debug('[WebPUtils] WebP support detected:', isSupported);

    return isSupported;
  } catch (error) {
    logger.warn('[WebPUtils] WebP detection failed:', error);
    return false;
  }
}

/**
 * WebP 최적화 유틸리티 클래스
 */
export class WebPUtils {
  /**
   * WebP 지원 여부 확인 (캐싱됨)
   */
  static async isSupported(): Promise<boolean> {
    if (webpSupportCache === null) {
      webpSupportCache = await detectWebPSupport();
    }
    return webpSupportCache;
  }

  /**
   * WebP 지원 여부 확인 (동기, 캐시된 값 반환)
   */
  static isSupportedSync(): boolean {
    return webpSupportCache ?? false;
  }

  /**
   * WebP 지원 감지 강제 실행
   */
  static async detectSupport(): Promise<boolean> {
    webpSupportCache = await detectWebPSupport();
    return webpSupportCache;
  }

  /**
   * URL을 WebP 형식으로 최적화
   */
  static optimizeUrl(originalUrl: string): string {
    // WebP가 지원되지 않으면 원본 URL 반환
    if (!WebPUtils.isSupportedSync()) {
      return originalUrl;
    }

    // 이미 WebP 형식인 경우 변경하지 않음
    if (originalUrl.includes('format=webp')) {
      return originalUrl;
    }

    // Twitter 이미지 URL에서 WebP 변환
    if (originalUrl.includes('pbs.twimg.com')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}format=webp`;
    }

    // 비-Twitter URL은 변경하지 않음
    return originalUrl;
  }

  /**
   * 캐시 초기화 (테스트용)
   */
  static resetCache(): void {
    webpSupportCache = null;
  }

  /**
   * 현재 캐시 상태 조회
   */
  static getCacheStatus(): { cached: boolean; supported: boolean | null } {
    return {
      cached: webpSupportCache !== null,
      supported: webpSupportCache,
    };
  }
}

/**
 * WebP 최적화 편의 함수 (기존 코드 호환성)
 * @deprecated WebPUtils.optimizeUrl() 사용 권장
 */
export function optimizeWebP(originalUrl: string): string {
  return WebPUtils.optimizeUrl(originalUrl);
}

/**
 * Twitter 이미지 URL 최적화 (기존 코드 호환성)
 * @deprecated WebPUtils.optimizeUrl() 사용 권장
 */
export function optimizeTwitterImageUrl(originalUrl: string): string {
  return WebPUtils.optimizeUrl(originalUrl);
}
