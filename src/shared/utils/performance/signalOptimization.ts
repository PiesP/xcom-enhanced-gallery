/**
 * @fileoverview Signal Selector Optimization
 * @description 메모화를 통한 시그널 셀렉터 성능 최적화
 */

import { getPreactHooks } from '@shared/external/vendors';

/**
 * 셀렉터 함수 타입
 */
type SelectorFunction<T, R> = (state: T) => R;

/**
 * 메모화된 셀렉터 생성 함수
 * Object.is를 사용한 참조 동일성 검사로 불필요한 재계산 방지
 */
export function createSelector<T, R>(
  selector: SelectorFunction<T, R>,
  debug = false
): SelectorFunction<T, R> {
  let lastInput: T;
  let lastOutput: R;
  let hasResult = false;
  const stats = { calls: 0, hits: 0, misses: 0 };

  const memoizedSelector = (input: T): R => {
    stats.calls++;
    globalStats.selectorCalls++;

    // Object.is를 사용한 참조 동일성 검사 (입력 전체가 아닌 실제 비교할 값 확인)
    if (hasResult && Object.is(input, lastInput)) {
      stats.hits++;
      globalStats.cacheHits++;
      if (debug || debugMode) {
        console.log('[Signal Selector] Cache hit:', stats);
      }
      return lastOutput;
    }

    // 새로운 결과 계산
    stats.misses++;
    globalStats.cacheMisses++;
    lastInput = input;
    lastOutput = selector(input);
    hasResult = true;

    if (debug || debugMode) {
      console.log('[Signal Selector] Cache miss, computed new result:', stats);
    }

    return lastOutput;
  };

  // 디버그용 통계 접근자 추가
  (memoizedSelector as typeof memoizedSelector & { getStats: () => typeof stats }).getStats =
    () => ({ ...stats });

  return memoizedSelector;
}

/**
 * 비동기 셀렉터 결과
 */
interface AsyncSelectorResult<T> {
  value: T;
  loading: boolean;
  error: Error | null;
}

/**
 * 비동기 셀렉터 훅
 * 디바운싱을 통한 요청 최적화
 */
export function useAsyncSelector<T, R>(
  state: { value: T } | T,
  selector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): AsyncSelectorResult<R> {
  const { useState, useEffect, useRef } = getPreactHooks();

  const [result, setResult] = useState<AsyncSelectorResult<R>>(() => ({
    value: defaultValue,
    loading: false,
    error: null,
  }));

  const mountedRef = useRef(true);
  const currentGenerationRef = useRef(0);

  // Signal 또는 값 추출
  const actualState =
    (state as { value?: T })?.value !== undefined ? (state as { value: T }).value : (state as T);

  useEffect(() => {
    // 새로운 generation 시작
    const generation = ++currentGenerationRef.current;

    setResult((prev: AsyncSelectorResult<R>) => ({ ...prev, loading: true, error: null }));

    const timeoutId = setTimeout(async () => {
      if (!mountedRef.current || generation !== currentGenerationRef.current) return;

      try {
        const value = await selector(actualState);
        if (mountedRef.current && generation === currentGenerationRef.current) {
          setResult({ value, loading: false, error: null });
        }
      } catch (error) {
        if (mountedRef.current && generation === currentGenerationRef.current) {
          setResult({
            value: defaultValue,
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      }
    }, debounceMs);

    // 컴포넌트 unmount 시 정리
    return () => {
      clearTimeout(timeoutId);
    };
  }, [actualState, selector, defaultValue, debounceMs]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return result;
}

/**
 * useSelector Hook
 * Signal에서 값을 선택하는 훅
 */
export function useSelector<T, R>(
  signal: { value: T },
  selector: (value: T) => R,
  deps?: unknown[]
): R {
  const { useMemo } = getPreactHooks();

  return useMemo(
    () => {
      return selector(signal.value);
    },
    deps ? [signal.value, ...deps] : [signal.value]
  );
}

/**
 * useCombinedSelector Hook
 * 여러 Signal을 조합하는 훅
 */
export function useCombinedSelector<T1, T2, R>(
  signal1: { value: T1 },
  signal2: { value: T2 },
  selector: (value1: T1, value2: T2) => R
): R {
  const { useMemo } = getPreactHooks();

  return useMemo(() => {
    return selector(signal1.value, signal2.value);
  }, [signal1.value, signal2.value]);
}

/**
 * 전역 성능 통계
 */
interface PerformanceStats {
  selectorCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

let globalStats: PerformanceStats = {
  selectorCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

let debugMode = false;

/**
 * 글로벌 통계 수집
 */
export function getGlobalStats(): PerformanceStats {
  return { ...globalStats };
}

/**
 * 통계 초기화
 */
export function resetGlobalStats(): void {
  globalStats = {
    selectorCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
}

/**
 * 디버그 모드 설정
 */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

/**
 * 디버그 모드 상태 확인
 */
export function isDebugMode(): boolean {
  return debugMode;
}
