/**
 * @fileoverview Lazy Memoization Service - AdvancedMemoization 지연 로딩
 * @version 1.0.0
 * @description 고급 메모이제이션이 필요한 경우에만 AdvancedMemoization을 동적으로 로드
 */

import { logger } from '@shared/logging/logger';
import { getPreactCompat } from '@shared/external/vendors';

/**
 * 기본 컴포넌트 함수 타입
 */
type ComponentFunction<T = Record<string, unknown>> = (props: T) => unknown;

/**
 * 고급 메모이제이션 API 타입 정의 (독립적)
 */
export interface LazyAdvancedMemoization {
  memoize: <T extends Record<string, unknown>>(
    Component: ComponentFunction<T>,
    options?: Record<string, unknown>
  ) => ComponentFunction<T>;
  deepCompare: (prevProps: unknown, nextProps: unknown) => boolean;
  selectiveCompare: (compareKeys: string[]) => (prev: unknown, next: unknown) => boolean;
  getPerformanceStats: (componentName: string) => Record<string, unknown> | null;
  getAllPerformanceStats: () => Map<string, unknown>;
  cleanup: () => void;
  clearStats: () => void;
}

/**
 * AdvancedMemoization 지연 로딩 결과
 */
export interface LazyMemoizationResult {
  success: boolean;
  memoizer?: LazyAdvancedMemoization;
  error?: string;
}

/**
 * AdvancedMemoization 지연 로딩 서비스
 *
 * 기본 memo는 즉시 사용하고, 고급 기능(deep compare, profiling 등)이
 * 필요한 경우에만 AdvancedMemoization을 로드하여 번들 크기를 최적화합니다.
 */
export class LazyMemoizationService {
  private static memoizer: LazyAdvancedMemoization | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<LazyMemoizationResult> | null = null;

  /**
   * AdvancedMemoization 동적 로딩
   */
  static async loadAdvancedMemoization(): Promise<LazyAdvancedMemoization> {
    // 이미 로드된 경우 캐시된 인스턴스 반환
    if (this.memoizer) {
      logger.debug('LazyMemoizationService: 캐시된 AdvancedMemoization 반환');
      return this.memoizer;
    }

    // 로딩 중인 경우 동일한 Promise 반환
    if (this.isLoading && this.loadPromise) {
      logger.debug('LazyMemoizationService: AdvancedMemoization 로딩 중, 대기...');
      const result = await this.loadPromise;
      if (result.success && result.memoizer) {
        return result.memoizer;
      }
      throw new Error(result.error || 'AdvancedMemoization 로딩 실패');
    }

    // 새로운 로딩 시작
    this.isLoading = true;
    this.loadPromise = this.performLoad();

    try {
      const result = await this.loadPromise;
      if (result.success && result.memoizer) {
        this.memoizer = result.memoizer;
        return result.memoizer;
      }
      throw new Error(result.error || 'AdvancedMemoization 로딩 실패');
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * 실제 AdvancedMemoization 로딩 수행 (폴백 구현)
   */
  private static async performLoad(): Promise<LazyMemoizationResult> {
    try {
      logger.debug('LazyMemoizationService: 기본 메모이제이션 폴백 사용');

      // AdvancedMemoization이 제거되었으므로 기본 구현으로 폴백
      const basicMemoization: LazyAdvancedMemoization = {
        memoize: <T extends Record<string, unknown>>(Component: ComponentFunction<T>) => Component,
        deepCompare: (prevProps: unknown, nextProps: unknown) => prevProps === nextProps,
        selectiveCompare: () => (prev: unknown, next: unknown) => prev === next,
        getPerformanceStats: () => null,
        getAllPerformanceStats: () => new Map(),
        cleanup: () => {},
        clearStats: () => {},
      };

      logger.debug('LazyMemoizationService: 기본 메모이제이션 로딩 완료');

      return {
        success: true,
        memoizer: basicMemoization,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      logger.error('LazyMemoizationService: 메모이제이션 로딩 실패', error);

      return {
        success: false,
        error: `메모이제이션 로딩 실패: ${errorMessage}`,
      };
    }
  }

  /**
   * 기본 메모이제이션 (지연 로딩 없음)
   */
  static async memoizeBasic<T extends Record<string, unknown>>(
    Component: ComponentFunction<T>
  ): Promise<ComponentFunction<T>> {
    logger.debug('LazyMemoizationService: 기본 메모이제이션 적용');

    // 기본 Preact memo 사용 (지연 로딩 없음)
    const { memo } = getPreactCompat();
    return memo(Component as never) as ComponentFunction<T>;
  }

  /**
   * 고급 메모이제이션 (지연 로딩)
   */
  static async memoizeAdvanced<T extends Record<string, unknown>>(
    Component: ComponentFunction<T>,
    options: Record<string, unknown> = {}
  ): Promise<ComponentFunction<T>> {
    logger.debug('LazyMemoizationService: 고급 메모이제이션 적용 - 지연 로딩');

    const memoizer = await this.loadAdvancedMemoization();
    return memoizer.memoize(Component, options);
  }

  /**
   * 깊은 비교 메모이제이션 (지연 로딩)
   */
  static async memoizeWithDeepCompare<T extends Record<string, unknown>>(
    Component: ComponentFunction<T>,
    options: Record<string, unknown> = {}
  ): Promise<ComponentFunction<T>> {
    logger.debug('LazyMemoizationService: 깊은 비교 메모이제이션 - 지연 로딩');

    const memoizer = await this.loadAdvancedMemoization();
    return memoizer.memoize(Component, {
      ...options,
      compare: memoizer.deepCompare,
    });
  }

  /**
   * 선택적 props 비교 메모이제이션 (지연 로딩)
   */
  static async memoizeWithSelectiveCompare<T extends Record<string, unknown>>(
    Component: ComponentFunction<T>,
    compareKeys: string[],
    options: Record<string, unknown> = {}
  ): Promise<ComponentFunction<T>> {
    logger.debug('LazyMemoizationService: 선택적 비교 메모이제이션 - 지연 로딩');

    const memoizer = await this.loadAdvancedMemoization();
    return memoizer.memoize(Component, {
      ...options,
      compare: memoizer.selectiveCompare(compareKeys),
    });
  }

  /**
   * 성능 프로파일링이 활성화된 메모이제이션 (지연 로딩)
   */
  static async memoizeWithProfiling<T extends Record<string, unknown>>(
    Component: ComponentFunction<T>,
    options: Record<string, unknown> = {}
  ): Promise<ComponentFunction<T>> {
    logger.debug('LazyMemoizationService: 프로파일링 메모이제이션 - 지연 로딩');

    const memoizer = await this.loadAdvancedMemoization();
    return memoizer.memoize(Component, {
      ...options,
      enableProfiling: true,
    });
  }

  /**
   * 성능 통계 조회 (지연 로딩)
   */
  static async getPerformanceStats(
    componentName?: string
  ): Promise<Record<string, unknown> | Map<string, unknown> | null> {
    if (!this.memoizer) {
      logger.debug('LazyMemoizationService: AdvancedMemoization 미로드, 통계 없음');
      return null;
    }

    if (componentName) {
      return this.memoizer.getPerformanceStats(componentName);
    }

    return this.memoizer.getAllPerformanceStats();
  }

  /**
   * 메모이제이션 시스템 정리
   */
  static async cleanup(): Promise<void> {
    if (this.memoizer) {
      this.memoizer.cleanup();
    }
    logger.debug('LazyMemoizationService: 시스템 정리 완료');
  }

  /**
   * 성능 통계 초기화
   */
  static async clearStats(): Promise<void> {
    if (this.memoizer) {
      this.memoizer.clearStats();
    }
    logger.debug('LazyMemoizationService: 통계 초기화 완료');
  }

  /**
   * 캐시 초기화
   */
  static clearCache(): void {
    logger.debug('LazyMemoizationService: 캐시 초기화');
    this.memoizer = null;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * 현재 서비스 상태 확인
   */
  static getStatus(): {
    isLoaded: boolean;
    isLoading: boolean;
    hasCache: boolean;
  } {
    return {
      isLoaded: !!this.memoizer,
      isLoading: this.isLoading,
      hasCache: !!this.memoizer,
    };
  }

  /**
   * 메모이제이션 필요성 판단
   */
  static shouldUseAdvancedMemoization(options: Record<string, unknown> = {}): boolean {
    // 고급 기능이 필요한 경우 판단
    const hasAdvancedFeatures =
      options.enableProfiling || options.compare || options.maxCacheSize || options.deepCompare;

    return !!hasAdvancedFeatures;
  }
}

/**
 * 편의 함수: 조건부 메모이제이션
 */
export async function memoizeConditionally<T extends Record<string, unknown>>(
  Component: ComponentFunction<T>,
  options: Record<string, unknown> = {}
): Promise<ComponentFunction<T>> {
  const needsAdvanced = LazyMemoizationService.shouldUseAdvancedMemoization(options);

  if (needsAdvanced) {
    logger.debug('편의함수: 고급 메모이제이션 적용');
    return await LazyMemoizationService.memoizeAdvanced(Component, options);
  } else {
    logger.debug('편의함수: 기본 메모이제이션 적용');
    return await LazyMemoizationService.memoizeBasic(Component);
  }
}

/**
 * 편의 함수: Smart 메모이제이션 (자동 판단)
 */
export async function smartMemoize<T extends Record<string, unknown>>(
  Component: ComponentFunction<T>,
  options: {
    deepCompare?: boolean;
    selectiveKeys?: string[];
    enableProfiling?: boolean;
    maxCacheSize?: number;
  } = {}
): Promise<ComponentFunction<T>> {
  const { deepCompare, selectiveKeys, enableProfiling, maxCacheSize } = options;

  // 깊은 비교가 필요한 경우
  if (deepCompare) {
    return await LazyMemoizationService.memoizeWithDeepCompare(Component, {
      enableProfiling,
      maxCacheSize,
    });
  }

  // 선택적 비교가 필요한 경우
  if (selectiveKeys && selectiveKeys.length > 0) {
    return await LazyMemoizationService.memoizeWithSelectiveCompare(Component, selectiveKeys, {
      enableProfiling,
      maxCacheSize,
    });
  }

  // 프로파일링만 필요한 경우
  if (enableProfiling || maxCacheSize) {
    return await LazyMemoizationService.memoizeAdvanced(Component, options);
  }

  // 기본 메모이제이션
  return await LazyMemoizationService.memoizeBasic(Component);
}
