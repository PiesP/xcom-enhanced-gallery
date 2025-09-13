/**
 * @fileoverview Signal Selector Optimization Utilities
 *
 * Signal 상태에서 특정 값을 효율적으로 선택하고 메모이제이션합니다.
 * 불필요한 리렌더링을 방지하여 성능을 최적화합니다.
 */

import { getPreactHooks, getPreactSignals } from '@shared/external/vendors';
import { globalTimerManager } from './timer-management';

// 타입 정의
type Signal<T> = {
  /**
   * Current value of the signal. Accessing this inside a computed/effect
   * body will correctly register reactive dependencies via preact/signals.
   */
  value: T;
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

  let lastArgs: T | undefined;
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

    // Object.is 기반 인자 참조 동일성 검사
    if (hasResult && lastArgs && Object.is(lastArgs, state)) {
      if (debug) {
        stats.cacheHits++;
        console.info(`[Selector:${name}] Cache hit (same reference)`, { stats });
      }
      return lastResult;
    }

    // 의존성 기반 캐싱
    if (dependencies) {
      const currentDependencies = dependencies(state);

      if (hasResult && lastDependencies && shallowEqual(lastDependencies, currentDependencies)) {
        if (debug) {
          stats.cacheHits++;
          console.info(`[Selector:${name}] Cache hit (dependencies)`, { stats });
        }
        return lastResult;
      }

      lastDependencies = currentDependencies;
    }

    // 새로운 값 계산
    const result = selector(state);

    // 인자와 결과 캐싱
    lastArgs = state;
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
 * @param debounceMs - 디바운스 시간 (밀리초)
 * @returns 선택된 값과 로딩 상태
 */
export function useAsyncSelector<T, R>(
  signalInstance: Signal<T>,
  asyncSelector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): { value: R; loading: boolean; error: Error | null } {
  const { useMemo, useCallback, useRef, useEffect } = getPreactHooks();
  const { signal } = getPreactSignals();

  const result = useMemo(
    () => signal({ value: defaultValue, loading: false, error: null as Error | null }),
    [defaultValue]
  );

  // Generation counter로 race condition 방지
  const generationRef = useRef(0);

  const debouncedSelector = useCallback(
    debounce(async (state: T) => {
      const currentGeneration = ++generationRef.current;

      result.value = { value: result.value.value, loading: true, error: null };

      try {
        const value = await asyncSelector(state);

        // 최신 요청인지 확인 (race condition 방지)
        if (currentGeneration === generationRef.current) {
          result.value = { value, loading: false, error: null };
        }
      } catch (error) {
        // 최신 요청인지 확인
        if (currentGeneration === generationRef.current) {
          result.value = {
            value: result.value.value,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      }
    }, debounceMs),
    [asyncSelector, result, debounceMs]
  );

  // Signal 값 변경 시 비동기 셀렉터 실행
  useEffect(() => {
    debouncedSelector(signalInstance.value);
  }, [signalInstance.value, debouncedSelector]);

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
 * 디바운스 함수 (개선된 버전)
 */
function debounce<TArgs extends readonly unknown[]>(
  func: (...args: TArgs) => unknown,
  wait: number
): (...args: TArgs) => void {
  let timeout: number | undefined;

  return (...args: TArgs) => {
    const later = () => {
      timeout = undefined;
      func(...args);
    };

    if (timeout) {
      globalTimerManager.clearTimeout(timeout);
    }
    timeout = globalTimerManager.setTimeout(later, wait);
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
