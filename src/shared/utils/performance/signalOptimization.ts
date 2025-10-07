import { getSolid } from '@shared/external/vendors';
const { createEffect, createSignal, onCleanup, untrack } = getSolid();
import type { Accessor } from '@shared/external/vendors';

/**
 * @fileoverview Performance Optimization Primitives (Solid.js) - Phase 3
 * @description Solid Primitives 기반 성능 최적화 유틸리티
 *
 * 마이그레이션 노트:
 * - Preact useMemo → Solid createMemo (자동 의존성 추적)
 * - Preact useCallback → 불필요 (Solid 컴포넌트는 1회 실행)
 * - Preact useEffect → Solid createEffect
 */

import { globalTimerManager } from '../timer-management';

/**
 * 셀렉터 함수 타입
 */
type SelectorFunction<T, R> = (state: T) => R;

/**
 * 비동기 셀렉터 결과
 */
export interface AsyncSelectorResult<T> {
  value: T;
  loading: boolean;
  error: Error | null;
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
 * 메모화된 셀렉터 생성 함수 (Solid Primitives)
 * createMemo를 사용하여 Accessor 기반 메모이제이션 제공
 *
 * @param source - Solid signal accessor
 * @param selector - 변환 함수
 * @param debug - 디버그 모드
 * @returns 메모화된 accessor 함수
 */
export function createMemoizedSelector<T, R>(
  source: Accessor<T>,
  selector: SelectorFunction<T, R>,
  debug = false
): Accessor<R> & { getStats: () => { calls: number; hits: number; misses: number } } {
  let lastInput: T;
  let lastOutput: R;
  let hasResult = false;
  const stats = { calls: 0, hits: 0, misses: 0 };

  const memoizedSelector = () => {
    stats.calls++;
    globalStats.selectorCalls++;

    const input = source();

    // Object.is를 사용한 참조 동일성 검사
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

  return memoizedSelector as Accessor<R> & {
    getStats: () => { calls: number; hits: number; misses: number };
  };
}

/**
 * 비동기 셀렉터 Primitive (Solid.js)
 * createEffect를 사용한 비동기 작업 처리
 *
 * @param source - Solid signal accessor
 * @param selector - 비동기 변환 함수
 * @param defaultValue - 기본값
 * @param debounceMs - 디바운스 시간 (ms)
 * @returns 비동기 결과 accessor
 */
export function createAsyncSelector<T, R>(
  source: Accessor<T>,
  selector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): Accessor<AsyncSelectorResult<R>> {
  // Solid signal을 사용하여 reactive하게 만듭니다
  const [result, setResult] = createSignal<AsyncSelectorResult<R>>({
    value: defaultValue,
    loading: true, // 초기에는 loading 상태
    error: null,
  });

  let currentGeneration = 0;
  let isDisposed = false;

  createEffect(() => {
    // 새로운 generation 시작
    const generation = ++currentGeneration;
    const state = source();

    // 즉시 loading 상태로 설정
    untrack(() => setResult({ ...result(), loading: true, error: null }));

    const timeoutId = globalTimerManager.setTimeout(async () => {
      if (isDisposed || generation !== currentGeneration) return;

      try {
        const value = await selector(state);
        if (!isDisposed && generation === currentGeneration) {
          untrack(() => setResult({ value, loading: false, error: null }));
        }
      } catch (error) {
        if (!isDisposed && generation === currentGeneration) {
          untrack(() =>
            setResult({
              value: defaultValue,
              loading: false,
              error: error instanceof Error ? error : new Error('Unknown error'),
            })
          );
        }
      }
    }, debounceMs);

    onCleanup(() => {
      globalTimerManager.clearTimeout(timeoutId);
    });
  });

  onCleanup(() => {
    isDisposed = true;
  });

  return result;
}

/**
 * 글로벌 통계 조회
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
