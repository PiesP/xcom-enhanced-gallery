/**
 * @fileoverview Lazy Motion Service - Motion One 라이브러리 지연 로딩
 * @version 1.0.0
 * @description 애니메이션 사용 시에만 Motion One 라이브러리를 동적으로 로드하여 초기 번들 크기 최적화
 */

import { logger } from '@shared/logging/logger';

/**
 * Motion One API 타입 정의 (vendor-manager에서 독립)
 */
export interface LazyMotionAPI {
  animate: (
    element: Element,
    keyframes: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => unknown;
  scroll: (
    callback: (info: Record<string, unknown>) => void,
    options?: Record<string, unknown>
  ) => () => void;
  timeline: (definition: Record<string, unknown>[], options?: Record<string, unknown>) => unknown;
  stagger: (duration: number, options?: Record<string, unknown>) => (index: number) => number;
  inView: (
    element: Element,
    callback: (info: Record<string, unknown>) => void,
    options?: Record<string, unknown>
  ) => () => void;
}

/**
 * Motion One 지연 로딩 결과
 */
export interface LazyMotionResult {
  success: boolean;
  motionAPI?: LazyMotionAPI;
  error?: string;
}

/**
 * Motion One 라이브러리 지연 로딩 서비스
 *
 * 애니메이션이 실제로 필요한 시점에서만 Motion One 라이브러리를 로드하여
 * 초기 번들 크기를 최적화합니다.
 */
export class LazyMotionService {
  private static motionAPI: LazyMotionAPI | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<LazyMotionResult> | null = null;

  /**
   * Motion One API를 지연 로딩합니다.
   * 이미 로드된 경우 캐시된 인스턴스를 반환합니다.
   */
  static async loadMotionAPI(): Promise<LazyMotionResult> {
    // 이미 로드된 경우 즉시 반환
    if (this.motionAPI) {
      return {
        success: true,
        motionAPI: this.motionAPI,
      };
    }

    // 이미 로딩 중인 경우 동일한 Promise 반환
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // 새로운 로딩 시작
    this.isLoading = true;
    this.loadPromise = this.performLoad();

    try {
      const result = await this.loadPromise;
      this.isLoading = false;
      return result;
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  /**
   * 실제 Motion One 라이브러리 로딩 수행
   */
  private static async performLoad(): Promise<LazyMotionResult> {
    try {
      logger.info('LazyMotionService: Loading Motion One library...');

      // 동적 import로 vendor manager 로드
      const { getMotion } = await import('@shared/external/vendors');
      const motionAPI = getMotion();

      // 기본 API 유효성 검증
      if (!motionAPI || typeof motionAPI.animate !== 'function') {
        throw new Error('Motion API not properly loaded');
      }

      // 캐시에 저장
      this.motionAPI = motionAPI as LazyMotionAPI;

      logger.info('LazyMotionService: Motion One library loaded successfully');

      return {
        success: true,
        motionAPI: this.motionAPI,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('LazyMotionService: Failed to load Motion One library:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 애니메이션 요소가 준비되었을 때 Motion API 로드
   */
  static async animateElement(
    element: Element,
    keyframes: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<unknown> {
    const result = await this.loadMotionAPI();

    if (!result.success || !result.motionAPI) {
      throw new Error(`Failed to load Motion API: ${result.error}`);
    }

    return result.motionAPI.animate(element, keyframes, options);
  }

  /**
   * 스크롤 애니메이션이 필요할 때 Motion API 로드
   */
  static async setupScrollAnimation(
    callback: (info: Record<string, unknown>) => void,
    options?: Record<string, unknown>
  ): Promise<() => void> {
    const result = await this.loadMotionAPI();

    if (!result.success || !result.motionAPI) {
      throw new Error(`Failed to load Motion API: ${result.error}`);
    }

    return result.motionAPI.scroll(callback, options);
  }

  /**
   * 뷰포트 진입 감지가 필요할 때 Motion API 로드
   */
  static async setupInViewAnimation(
    element: Element,
    callback: (info: Record<string, unknown>) => void,
    options?: Record<string, unknown>
  ): Promise<() => void> {
    const result = await this.loadMotionAPI();

    if (!result.success || !result.motionAPI) {
      throw new Error(`Failed to load Motion API: ${result.error}`);
    }

    return result.motionAPI.inView(element, callback, options);
  }

  /**
   * 캐시된 Motion API가 있는지 확인 (로딩 없이)
   */
  static isMotionLoaded(): boolean {
    return this.motionAPI !== null;
  }

  /**
   * 캐시 초기화 (테스트용)
   */
  static resetCache(): void {
    this.motionAPI = null;
    this.isLoading = false;
    this.loadPromise = null;
  }
}

/**
 * 편의 함수: 요소 애니메이션 지연 로딩
 */
export async function animateWhenReady(
  element: Element,
  keyframes: Record<string, unknown>,
  options?: Record<string, unknown>
): Promise<unknown> {
  return LazyMotionService.animateElement(element, keyframes, options);
}

/**
 * 편의 함수: 스크롤 애니메이션 지연 로딩
 */
export async function scrollAnimationWhenReady(
  callback: (info: Record<string, unknown>) => void,
  options?: Record<string, unknown>
): Promise<() => void> {
  return LazyMotionService.setupScrollAnimation(callback, options);
}

/**
 * 편의 함수: 인뷰 애니메이션 지연 로딩
 */
export async function inViewAnimationWhenReady(
  element: Element,
  callback: (info: Record<string, unknown>) => void,
  options?: Record<string, unknown>
): Promise<() => void> {
  return LazyMotionService.setupInViewAnimation(element, callback, options);
}
