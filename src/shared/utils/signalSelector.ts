/**
 * @fileoverview Signal Selector Optimization Utilities
 *
 * Signal 상태에서 특정 값을 효율적으로 선택하고 메모이제이션합니다.
 * 불필요한 리렌더링을 방지하여 성능을 최적화합니다.
 */

import { getPreactHooks, getPreactSignals } from '@shared/external/vendors';

// 타입 정의
type Signal<T> = {
  value: T;
  subscribe: (callback: () => void) => () => void;
};

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
 * 디버그 정보가 포함된 셀렉터
 */
interface DebugSelector<T, R> {
  select: SelectorFn<T, R>;
  getStats: () => SelectorStats;
  clearStats: () => void;
}

/**
 * 글로벌 디버그 설정
 */
let isDebugMode = false;

/**
 * 디버그 모드 설정
 */
export function setDebugMode(enabled: boolean): void {
  isDebugMode = enabled;
}

/**
 * 메모이제이션된 셀렉터 생성
 *
 * @param selector - 선택 함수
 * @param options - 셀렉터 옵션
 * @returns 최적화된 셀렉터 함수
 */
export function createSelector<T, R>(
  selector: SelectorFn<T, R>,
  options: SelectorOptions<T> = {}
): SelectorFn<T, R> {
  const { dependencies, debug = isDebugMode, name = 'Anonymous' } = options;

  let lastDependencies: readonly unknown[] | undefined;
  let lastResult: R;
  let hasResult = false;

  // 디버그 통계
  const stats: SelectorStats = {
    computeCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastComputeTime: 0,
  };

  const optimizedSelector: SelectorFn<T, R> = (state: T): R => {
    const startTime = debug ? performance.now() : 0;

    // 의존성 기반 캐싱
    if (dependencies) {
      const currentDependencies = dependencies(state);

      if (hasResult && lastDependencies && shallowEqual(lastDependencies, currentDependencies)) {
        if (debug) {
          stats.cacheHits++;
          console.info(`[Selector:${name}] Cache hit`, { stats });
        }
        return lastResult;
      }

      lastDependencies = currentDependencies;
    }

    // 새로운 값 계산
    const result = selector(state);

    // 결과 캐싱
    if (!hasResult || !Object.is(lastResult, result)) {
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
    } else if (debug) {
      stats.cacheHits++;
    }

    return result;
  };

  // 디버그 정보 추가
  if (debug) {
    const debugSelector = optimizedSelector as unknown as DebugSelector<T, R>;
    debugSelector.getStats = () => ({ ...stats });
    debugSelector.clearStats = () => {
      stats.computeCount = 0;
      stats.cacheHits = 0;
      stats.cacheMisses = 0;
      stats.lastComputeTime = 0;
    };
  }

  return optimizedSelector;
}

/**
 * Signal용 최적화된 Hook
 *
 * @param signal - Preact Signal
 * @param selector - 선택 함수
 * @param options - 셀렉터 옵션
 * @returns 선택된 값
 */
export function useSelector<T, R>(
  signalInstance: Signal<T>,
  selector: SelectorFn<T, R>,
  options: SelectorOptions<T> = {}
): R {
  const { useMemo } = getPreactHooks();
  const { computed } = getPreactSignals();

  // 메모이제이션된 셀렉터 생성
  const memoizedSelector = useMemo(
    () => createSelector(selector, options),
    [selector, options.dependencies, options.debug, options.name]
  );

  // Signal 값에 셀렉터 적용
  const computedValue = useMemo(
    () => computed(() => memoizedSelector(signalInstance.value)),
    [signalInstance, memoizedSelector]
  );

  return computedValue.value;
}

/**
 * 여러 Signal을 조합하는 Hook
 *
 * @param signals - Signal 배열
 * @param combiner - 조합 함수
 * @param dependencies - 의존성 추출 함수
 * @returns 조합된 값
 */
export function useCombinedSelector<T extends readonly Signal<unknown>[], R>(
  signals: T,
  combiner: (...values: { [K in keyof T]: T[K] extends Signal<infer U> ? U : never }) => R,
  dependencies?: (
    ...values: { [K in keyof T]: T[K] extends Signal<infer U> ? U : never }
  ) => readonly unknown[]
): R {
  const { useMemo } = getPreactHooks();
  const { computed } = getPreactSignals();

  const combinedSignal = useMemo(() => {
    return computed(() => {
      const values = signals.map(s => s.value) as {
        [K in keyof T]: T[K] extends Signal<infer U> ? U : never;
      };
      return combiner(...values);
    });
  }, [signals, combiner]);

  // 의존성 기반 최적화
  if (dependencies) {
    // 타입 체크를 우회하여 실제 동작에 집중
    const signalValues = signals.map(s => s.value);
    const deps = (dependencies as (...args: unknown[]) => readonly unknown[])(...signalValues);
    return useMemo(() => combinedSignal.value, [combinedSignal, ...deps]);
  }

  return combinedSignal.value;
}

/**
 * 비동기 셀렉터 Hook
 *
 * @param signal - Preact Signal
 * @param asyncSelector - 비동기 선택 함수
 * @param defaultValue - 기본값
 * @returns 선택된 값과 로딩 상태
 */
export function useAsyncSelector<T, R>(
  signalInstance: Signal<T>,
  asyncSelector: (state: T) => Promise<R>,
  defaultValue: R
): { value: R; loading: boolean; error: Error | null } {
  const { useMemo, useCallback } = getPreactHooks();
  const { signal, computed } = getPreactSignals();

  const result = useMemo(
    () => signal({ value: defaultValue, loading: false, error: null as Error | null }),
    [defaultValue]
  );

  const debouncedSelector = useCallback(
    debounce(async (state: unknown) => {
      const typedState = state as T;
      result.value = { value: result.value.value, loading: true, error: null };
      try {
        const value = await asyncSelector(typedState);
        result.value = { value, loading: false, error: null };
      } catch (error) {
        result.value = {
          value: result.value.value,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    }, 300),
    [asyncSelector, result]
  );

  // Signal 값 변경 시 비동기 셀렉터 실행
  useMemo(() => {
    computed(() => {
      debouncedSelector(signalInstance.value);
    });
  }, [signalInstance, debouncedSelector]);

  return result.value;
}

/**
 * 얕은 비교 함수
 */
function shallowEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

/**
 * 디바운스 함수
 */
function debounce<T extends (...args: readonly unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 성능 모니터링을 위한 전역 통계
 */
const globalSelectorStats = new Map<string, SelectorStats>();

/**
 * 전역 셀렉터 통계 가져오기
 */
export function getGlobalSelectorStats(): Record<string, SelectorStats> {
  return Object.fromEntries(globalSelectorStats);
}

/**
 * 전역 셀렉터 통계 초기화
 */
export function clearGlobalSelectorStats(): void {
  globalSelectorStats.clear();
}
