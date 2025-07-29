/**
 * @fileoverview Lazy Intersection Service - OptimizedLazyLoadingService 지연 로딩
 * @version 1.0.0
 * @description IntersectionObserver 지원 시에만 OptimizedLazyLoadingService를 동적으로 로드
 */

import { logger } from '@shared/logging/logger';

/**
 * LazyLoadingService API 타입 정의 (독립적)
 */
export interface LazyIntersectionObserverService {
  observe: (element: unknown, loadFn: () => Promise<void>) => void;
  unobserve: (element: unknown) => void;
  getMetrics: () => Record<string, unknown>;
  dispose: () => void;
}

/**
 * Intersection Service 지연 로딩 결과
 */
export interface LazyIntersectionResult {
  success: boolean;
  service?: LazyIntersectionObserverService;
  error?: string;
}

/**
 * OptimizedLazyLoadingService 지연 로딩 서비스
 *
 * IntersectionObserver가 지원되는 환경에서만 OptimizedLazyLoadingService를 로드하여
 * 초기 번들 크기를 최적화하고 브라우저 호환성을 향상시킵니다.
 */
export class LazyIntersectionService {
  private static service: LazyIntersectionObserverService | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<LazyIntersectionResult> | null = null;

  /**
   * IntersectionObserver 지원 여부 확인
   */
  static isIntersectionObserverSupported(): boolean {
    if (typeof window === 'undefined') {
      return false; // 서버 환경에서는 지원하지 않음
    }

    return 'IntersectionObserver' in window && window.IntersectionObserver !== undefined;
  }

  /**
   * OptimizedLazyLoadingService 동적 로딩
   */
  static async loadIntersectionService(): Promise<LazyIntersectionObserverService> {
    // 이미 로드된 경우 캐시된 인스턴스 반환
    if (this.service) {
      logger.debug('LazyIntersectionService: 캐시된 OptimizedLazyLoadingService 반환');
      return this.service;
    }

    // 로딩 중인 경우 동일한 Promise 반환
    if (this.isLoading && this.loadPromise) {
      logger.debug('LazyIntersectionService: OptimizedLazyLoadingService 로딩 중, 대기...');
      const result = await this.loadPromise;
      if (result.success && result.service) {
        return result.service;
      }
      throw new Error(result.error || 'OptimizedLazyLoadingService 로딩 실패');
    }

    // 새로운 로딩 시작
    this.isLoading = true;
    this.loadPromise = this.performLoad();

    try {
      const result = await this.loadPromise;
      if (result.success && result.service) {
        this.service = result.service;
        return result.service;
      }
      throw new Error(result.error || 'OptimizedLazyLoadingService 로딩 실패');
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * 실제 OptimizedLazyLoadingService 로딩 수행
   */
  private static async performLoad(): Promise<LazyIntersectionResult> {
    try {
      logger.debug('LazyIntersectionService: OptimizedLazyLoadingService 동적 로딩 시작');

      // 동적 import를 통한 OptimizedLazyLoadingService 로딩
      const { OptimizedLazyLoadingService } = await import(
        '@shared/services/OptimizedLazyLoadingService'
      );

      if (!OptimizedLazyLoadingService) {
        throw new Error('OptimizedLazyLoadingService 클래스를 찾을 수 없습니다');
      }

      // OptimizedLazyLoadingService 인스턴스 생성
      const service = OptimizedLazyLoadingService.getInstance({
        rootMargin: '100px',
        threshold: 0.1,
        maxConcurrentLoads: 5,
        loadDelay: 0,
      });

      logger.debug('LazyIntersectionService: OptimizedLazyLoadingService 로딩 완료');

      return {
        success: true,
        service: service as LazyIntersectionObserverService,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      logger.error('LazyIntersectionService: OptimizedLazyLoadingService 로딩 실패', error);

      return {
        success: false,
        error: `OptimizedLazyLoadingService 로딩 실패: ${errorMessage}`,
      };
    }
  }

  /**
   * IntersectionObserver 지원 시에만 요소 관찰
   */
  static async observeWhenSupported(element: unknown, loadFn: () => Promise<void>): Promise<void> {
    if (!this.isIntersectionObserverSupported()) {
      logger.debug('LazyIntersectionService: IntersectionObserver 미지원, 즉시 로딩으로 fallback');
      // IntersectionObserver 미지원 시 즉시 로딩
      await loadFn();
      return;
    }

    try {
      const service = await this.loadIntersectionService();
      service.observe(element, loadFn);
    } catch (error) {
      logger.warn('LazyIntersectionService: 서비스 로딩 실패, 즉시 로딩으로 fallback', error);
      // 서비스 로딩 실패 시 즉시 로딩
      await loadFn();
    }
  }

  /**
   * 요소 관찰 중지
   */
  static async unobserveElement(element: unknown): Promise<void> {
    if (!this.service) {
      logger.debug('LazyIntersectionService: 서비스가 로드되지 않음, unobserve 무시');
      return;
    }

    this.service.unobserve(element);
  }

  /**
   * 성능 메트릭 조회
   */
  static async getPerformanceMetrics(): Promise<Record<string, unknown> | null> {
    if (!this.service) {
      logger.debug('LazyIntersectionService: 서비스가 로드되지 않음, 메트릭 없음');
      return null;
    }

    return this.service.getMetrics();
  }

  /**
   * 서비스 캐시 초기화
   */
  static clearCache(): void {
    logger.debug('LazyIntersectionService: 캐시 초기화');
    if (this.service) {
      this.service.dispose();
    }
    this.service = null;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * 현재 서비스 상태 확인
   */
  static getStatus(): {
    isLoaded: boolean;
    isLoading: boolean;
    isSupported: boolean;
  } {
    return {
      isLoaded: !!this.service,
      isLoading: this.isLoading,
      isSupported: this.isIntersectionObserverSupported(),
    };
  }
}

/**
 * 편의 함수: 이미지 지연 로딩 (IntersectionObserver 지원 시)
 */
export async function observeImageWhenSupported(
  img: unknown,
  src: string,
  _options?: Record<string, unknown>
): Promise<void> {
  if (!img || !src) {
    logger.warn('LazyIntersectionService: 유효하지 않은 이미지 또는 src');
    return;
  }

  await LazyIntersectionService.observeWhenSupported(img, async () => {
    // 이미지 로딩 로직 (간소화)
    if (typeof img === 'object' && img !== null && 'src' in img) {
      (img as { src: string }).src = src;
    }
    logger.debug('LazyIntersectionService: 이미지 로딩 완료', { src });
  });
}

/**
 * 편의 함수: 비디오 지연 로딩 (IntersectionObserver 지원 시)
 */
export async function observeVideoWhenSupported(
  video: unknown,
  src: string,
  _options?: Record<string, unknown>
): Promise<void> {
  if (!video || !src) {
    logger.warn('LazyIntersectionService: 유효하지 않은 비디오 또는 src');
    return;
  }

  await LazyIntersectionService.observeWhenSupported(video, async () => {
    // 비디오 로딩 로직 (간소화)
    if (typeof video === 'object' && video !== null && 'src' in video && 'load' in video) {
      (video as { src: string; load: () => void }).src = src;
      (video as { src: string; load: () => void }).load();
    }
    logger.debug('LazyIntersectionService: 비디오 로딩 완료', { src });
  });
}

/**
 * 편의 함수: 일반 요소 지연 로딩
 */
export async function observeElementWhenSupported(
  element: unknown,
  loadFn: () => Promise<void>
): Promise<void> {
  await LazyIntersectionService.observeWhenSupported(element, loadFn);
}
