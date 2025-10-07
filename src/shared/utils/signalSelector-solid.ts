/**
 * @fileoverview Solid.js Signal Selector Optimization Utilities (Phase 3)
 *
 * Solid createMemo 기반 signal selector로 Preact Hooks 대체
 * - createSelector: Signal에서 값을 선택하고 메모이제이션
 * - createCombinedSelector: 여러 Signal을 조합하여 새로운 computed 값 생성
 */

import { getSolid } from '../external/vendors';

// Solid API
const { createMemo } = getSolid();

/**
 * Selector 함수 타입
 */
export type SelectorFn<T, R> = (state: T) => R;

/**
 * 의존성 추출 함수 타입
 */
export type DependencyExtractor<T> = (state: T) => readonly unknown[];

/**
 * 메모이제이션된 셀렉터 옵션
 */
export interface SelectorOptions<T> {
  /** 의존성 추출 함수 (성능 최적화용) */
  dependencies?: DependencyExtractor<T>;
  /** 디버그 모드 활성화 */
  debug?: boolean;
  /** 셀렉터 이름 (디버깅용) */
  name?: string;
}

/**
 * 셀렉터 성능 통계
 */
interface SelectorStats {
  computeCount: number;
  cacheHits: number;
  cacheMisses: number;
  lastComputeTime: number;
}

/**
 * Solid Signal Accessor 타입
 */
type Accessor<T> = () => T;

/**
 * 얕은 비교 유틸리티
 */
function shallowEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Solid createMemo 기반 메모이제이션된 셀렉터 생성
 *
 * @param source - Solid Signal Accessor
 * @param selector - 선택 함수
 * @param options - 셀렉터 옵션
 * @returns 최적화된 Solid Accessor
 */
export function createSelector<T, R>(
  source: Accessor<T>,
  selector: SelectorFn<T, R>,
  options: SelectorOptions<T> = {}
): Accessor<R> {
  const { dependencies, debug = false, name = 'Anonymous' } = options;

  // 의존성 기반 메모이제이션
  if (dependencies) {
    let lastDependencies: readonly unknown[] | undefined;
    let lastResult: R | undefined;
    let hasResult = false;

    // 디버그 통계
    const stats: SelectorStats = {
      computeCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastComputeTime: 0,
    };

    const memoized = createMemo<R>(() => {
      const startTime = debug ? performance.now() : 0;
      const state = source();
      const currentDependencies = dependencies(state);

      // 의존성 비교
      if (hasResult && lastDependencies && shallowEqual(lastDependencies, currentDependencies)) {
        if (debug) {
          stats.cacheHits++;
          console.info(`[Selector:${name}] Cache hit (dependencies)`, { stats });
        }
        return lastResult!;
      }

      // 새로운 값 계산
      const result = selector(state);
      lastDependencies = currentDependencies;
      lastResult = result;
      hasResult = true;

      if (debug) {
        stats.computeCount++;
        stats.cacheMisses++;
        stats.lastComputeTime = performance.now() - startTime;
        console.info(`[Selector:${name}] Computed new value`, {
          result,
          computeTime: stats.lastComputeTime,
          stats,
        });
      }

      return result;
    });

    // 디버그 API 추가
    if (debug) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (memoized as any).getStats = () => ({ ...stats });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (memoized as any).clearStats = () => {
        stats.computeCount = 0;
        stats.cacheHits = 0;
        stats.cacheMisses = 0;
        stats.lastComputeTime = 0;
      };
    }

    return memoized;
  }

  // 기본 createMemo (Solid 자동 메모이제이션)
  const memoized = createMemo<R>(() => {
    const state = source();
    return selector(state);
  });

  if (debug) {
    const stats: SelectorStats = {
      computeCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastComputeTime: 0,
    };

    const wrappedMemo = () => {
      const startTime = performance.now();
      const result = memoized();
      stats.computeCount++;
      stats.lastComputeTime = performance.now() - startTime;

      console.info(`[Selector:${name}] Computed value`, {
        result,
        computeTime: stats.lastComputeTime,
        stats,
      });

      return result;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrappedMemo as any).getStats = () => ({ ...stats });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrappedMemo as any).clearStats = () => {
      stats.computeCount = 0;
      stats.cacheHits = 0;
      stats.cacheMisses = 0;
      stats.lastComputeTime = 0;
    };

    return wrappedMemo as Accessor<R>;
  }

  return memoized;
}

/**
 * 여러 Solid Signal을 조합하는 Selector
 *
 * @param sources - Solid Signal Accessor 배열
 * @param combiner - 조합 함수
 * @returns 조합된 Solid Accessor
 */
export function createCombinedSelector<T extends readonly unknown[], R>(
  sources: readonly [...{ [K in keyof T]: Accessor<T[K]> }],
  combiner: (values: T) => R
): Accessor<R> {
  return createMemo<R>(() => {
    // 모든 source를 읽어 의존성 추적
    const values = sources.map(source => source()) as unknown as T;
    return combiner(values);
  });
}

/**
 * 디버그 모드 설정 (기존 API 호환)
 */
export function setDebugMode(_enabled: boolean): void {
  // Solid에서는 전역 디버그 모드 대신 옵션으로 제어
  console.info('[signalSelector-solid] Debug mode should be set per selector via options');
}
