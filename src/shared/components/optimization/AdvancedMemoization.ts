/**
 * @fileoverview 고급 메모이제이션 시스템
 * @description Phase 3: 성능 최적화를 위한 고급 메모이제이션 패턴
 * @version 3.0.0
 */

import { getPreactCompat } from '../../external/vendors';

// Preact 컴포넌트 타입 정의
type ComponentFunction<T = Record<string, unknown>> = (props: T) => unknown;

/**
 * 메모이제이션 옵션 인터페이스
 */
interface MemoizationOptions<T = Record<string, unknown>> {
  /** 커스텀 비교 함수 */
  compare?: (prevProps: T, nextProps: T) => boolean;
  /** 메모리 최적화를 위한 최대 캐시 크기 */
  maxCacheSize?: number;
  /** 성능 모니터링 활성화 */
  enableProfiling?: boolean;
}

/**
 * 성능 프로파일링 데이터
 */
interface ProfileData {
  renderCount: number;
  skipCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

/**
 * 고급 메모이제이션 클래스
 *
 * Features:
 * - 커스텀 비교 함수 지원
 * - 성능 프로파일링
 * - 메모리 최적화
 * - 캐시 관리
 */
class AdvancedMemoization {
  private static instance: AdvancedMemoization;
  private readonly profileData = new Map<string, ProfileData>();
  private readonly cacheSize = new Map<string, number>();

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): AdvancedMemoization {
    if (!this.instance) {
      this.instance = new AdvancedMemoization();
    }
    return this.instance;
  }

  /**
   * 고급 메모이제이션 적용
   */
  memoize<T extends Record<string, unknown>>(
    Component: ComponentFunction<T>,
    options: MemoizationOptions<T> = {}
  ) {
    const { compare = this.defaultCompare, maxCacheSize = 50, enableProfiling = false } = options;

    const componentName = Component.name || 'AnonymousComponent';

    if (enableProfiling) {
      this.initializeProfile(componentName);
    }

    const { memo } = getPreactCompat();

    return memo(Component as never, (prevProps: T, nextProps: T) => {
      const startTime = performance.now();

      try {
        const shouldSkip = compare(prevProps, nextProps);
        const endTime = performance.now();

        if (enableProfiling) {
          this.updateProfile(componentName, shouldSkip, endTime - startTime);
        }

        // 캐시 크기 관리
        this.manageCacheSize(componentName, maxCacheSize);

        return shouldSkip;
      } catch (error) {
        console.warn(`[XEG] Memoization comparison error for ${componentName}:`, error);
        return false; // 에러 시 리렌더링
      }
    });
  }

  /**
   * 기본 props 비교 함수 (shallow comparison)
   */
  private defaultCompare(
    prevProps: Record<string, unknown>,
    nextProps: Record<string, unknown>
  ): boolean {
    if (prevProps === nextProps) return true;

    if (!prevProps || !nextProps) return false;

    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) return false;

    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) return false;
    }

    return true;
  }

  /**
   * 깊은 비교 함수 (성능 비용이 높음)
   */
  deepCompare(prevProps: unknown, nextProps: unknown): boolean {
    if (prevProps === nextProps) return true;

    if (!prevProps || !nextProps) return false;

    if (typeof prevProps !== typeof nextProps) return false;

    if (typeof prevProps !== 'object') return prevProps === nextProps;

    if (Array.isArray(prevProps) !== Array.isArray(nextProps)) return false;

    if (Array.isArray(prevProps) && Array.isArray(nextProps)) {
      if (prevProps.length !== nextProps.length) return false;
      return prevProps.every((item, index) => this.deepCompare(item, nextProps[index]));
    }

    const prevKeys = Object.keys(prevProps as Record<string, unknown>);
    const nextKeys = Object.keys(nextProps as Record<string, unknown>);

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every(key =>
      this.deepCompare(
        (prevProps as Record<string, unknown>)[key],
        (nextProps as Record<string, unknown>)[key]
      )
    );
  }

  /**
   * 선택적 비교 함수 (특정 props만 비교)
   */
  selectiveCompare(compareKeys: string[]) {
    return (prevProps: Record<string, unknown>, nextProps: Record<string, unknown>): boolean => {
      for (const key of compareKeys) {
        if (prevProps[key] !== nextProps[key]) return false;
      }
      return true;
    };
  }

  /**
   * 프로파일 데이터 초기화
   */
  private initializeProfile(componentName: string): void {
    if (!this.profileData.has(componentName)) {
      this.profileData.set(componentName, {
        renderCount: 0,
        skipCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
      });
    }
  }

  /**
   * 프로파일 데이터 업데이트
   */
  private updateProfile(componentName: string, wasSkipped: boolean, renderTime: number): void {
    const profile = this.profileData.get(componentName);
    if (!profile) return;

    if (wasSkipped) {
      profile.skipCount++;
    } else {
      profile.renderCount++;
      profile.lastRenderTime = renderTime;

      // 평균 렌더링 시간 계산
      const totalTime = profile.averageRenderTime * (profile.renderCount - 1) + renderTime;
      profile.averageRenderTime = totalTime / profile.renderCount;
    }
  }

  /**
   * 캐시 크기 관리
   */
  private manageCacheSize(componentName: string, maxSize: number): void {
    const currentSize = this.cacheSize.get(componentName) || 0;

    if (currentSize >= maxSize) {
      // 캐시 크기 초과 시 일부 정리
      this.cacheSize.set(componentName, Math.floor(maxSize * 0.7));
    } else {
      this.cacheSize.set(componentName, currentSize + 1);
    }
  }

  /**
   * 성능 통계 반환
   */
  getPerformanceStats(componentName: string): ProfileData | null {
    return this.profileData.get(componentName) || null;
  }

  /**
   * 모든 컴포넌트의 성능 통계 반환
   */
  getAllPerformanceStats(): Map<string, ProfileData> {
    return new Map(this.profileData);
  }

  /**
   * 성능 통계 초기화
   */
  clearStats(): void {
    this.profileData.clear();
    this.cacheSize.clear();
  }

  /**
   * 메모리 사용량 최적화 - 사용하지 않는 프로파일 데이터 정리
   */
  cleanup(): void {
    const now = Date.now();
    const oldEntries: string[] = [];

    for (const [componentName, profile] of this.profileData.entries()) {
      // 5분 이상 사용되지 않은 컴포넌트는 정리
      if (now - profile.lastRenderTime > 5 * 60 * 1000) {
        oldEntries.push(componentName);
      }
    }

    oldEntries.forEach(name => {
      this.profileData.delete(name);
      this.cacheSize.delete(name);
    });
  }
}

/**
 * 고급 메모이제이션 유틸리티 함수들
 */

/**
 * 컴포넌트에 고급 메모이제이션 적용
 */
export function withAdvancedMemo<T extends Record<string, unknown>>(
  Component: (props: T) => unknown,
  options?: MemoizationOptions<T>
) {
  return AdvancedMemoization.getInstance().memoize(Component, options);
}

/**
 * 깊은 비교를 사용하는 메모이제이션
 */
export function withDeepMemo<T extends Record<string, unknown>>(
  Component: (props: T) => unknown,
  options: Omit<MemoizationOptions<T>, 'compare'> = {}
) {
  const memoizer = AdvancedMemoization.getInstance();
  return memoizer.memoize(Component, {
    ...options,
    compare: memoizer.deepCompare.bind(memoizer),
  });
}

/**
 * 선택적 props 비교를 사용하는 메모이제이션
 */
export function withSelectiveMemo<T extends Record<string, unknown>>(
  Component: (props: T) => unknown,
  compareKeys: string[],
  options: Omit<MemoizationOptions<T>, 'compare'> = {}
) {
  const memoizer = AdvancedMemoization.getInstance();
  return memoizer.memoize(Component, {
    ...options,
    compare: memoizer.selectiveCompare(compareKeys),
  });
}

/**
 * 성능 모니터링이 활성화된 메모이제이션
 */
export function withProfiledMemo<T extends Record<string, unknown>>(
  Component: (props: T) => unknown,
  options: Omit<MemoizationOptions<T>, 'enableProfiling'> = {}
) {
  return AdvancedMemoization.getInstance().memoize(Component, {
    ...options,
    enableProfiling: true,
  });
}

/**
 * 메모이제이션 성능 통계 조회
 */
export function getComponentStats(componentName: string): ProfileData | null {
  return AdvancedMemoization.getInstance().getPerformanceStats(componentName);
}

/**
 * 모든 컴포넌트 성능 통계 조회
 */
export function getAllComponentStats(): Map<string, ProfileData> {
  return AdvancedMemoization.getInstance().getAllPerformanceStats();
}

/**
 * 메모이제이션 시스템 정리
 */
export function cleanupMemoization(): void {
  AdvancedMemoization.getInstance().cleanup();
}

/**
 * 성능 통계 초기화
 */
export function clearMemoizationStats(): void {
  AdvancedMemoization.getInstance().clearStats();
}

// 주기적인 메모리 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      AdvancedMemoization.getInstance().cleanup();
    },
    5 * 60 * 1000
  );
}

export { AdvancedMemoization };
