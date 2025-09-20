/**
 * @fileoverview [DEPRECATED] Signal Selector Optimization (legacy)
 * @description 이 모듈은 signalSelector 유틸로 위임하도록 변경되었습니다.
 * createSelector/useAsyncSelector/useCombinedSelector는 내부적으로
 * ../signalSelector의 동등 API로 위임합니다.
 *
 * 유지 기간 동안의 호환성을 위해 남겨두며, 신규 코드는
 * `@shared/utils/signalSelector` 또는 `@shared/utils/performance`(re-export)
 * 경유 사용을 권장합니다.
 */

import { getPreactHooks } from '@shared/external/vendors';
import {
  createSelector as createSelectorUnified,
  useAsyncSelector as useAsyncSelectorUnified,
  useCombinedSelector as useCombinedSelectorUnified,
} from '../signalSelector';

/**
 * 셀렉터 함수 타입
 */
/** @deprecated use SelectorFn from signalSelector instead */
type SelectorFunction<T, R> = (state: T) => R;

/**
 * 메모화된 셀렉터 생성 함수
 * Object.is를 사용한 참조 동일성 검사로 불필요한 재계산 방지
 */
/**
 * @deprecated Use createSelector from '@shared/utils/signalSelector' instead.
 * 이 구현은 통합 유틸로 위임합니다. legacy boolean debug 인자는
 * options.debug로 매핑됩니다.
 */
export function createSelector<T, R>(
  selector: SelectorFunction<T, R>,
  debug = false
): SelectorFunction<T, R> {
  // legacy API를 통합 옵션으로 위임
  const wrapped = createSelectorUnified(selector, { debug, name: 'legacy' });
  return (state: T) => wrapped(state);
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
/**
 * @deprecated Use useAsyncSelector from '@shared/utils/signalSelector'.
 * 통합 유틸로 위임하여 동작을 통일합니다.
 */
export function useAsyncSelector<T, R>(
  state: { value: T } | T,
  selector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): AsyncSelectorResult<R> {
  // signal-like 입력을 signalSelector의 API에 맞춰 전달
  const signalLike = ((): { value: T } => {
    if (state && typeof state === 'object' && 'value' in (state as Record<string, unknown>)) {
      return state as { value: T };
    }
    // 간단한 래퍼 생성
    return { value: state as T };
  })();
  const res = useAsyncSelectorUnified(signalLike, selector, defaultValue, debounceMs);
  return res;
}

/**
 * useSelector Hook
 * Signal에서 값을 선택하는 훅
 */
/**
 * @deprecated Use useSelector from '@shared/utils/signalSelector'.
 */
export function useSelector<T, R>(
  signal: { value: T },
  selector: (value: T) => R,
  deps?: unknown[]
): R {
  const { useMemo } = getPreactHooks();
  // 기존 동작 유지: 단순 selector 적용. 고급 최적화가 필요하면 통합 유틸 사용 권장.
  return useMemo(() => selector(signal.value), deps ? [signal.value, ...deps] : [signal.value]);
}

/**
 * useCombinedSelector Hook
 * 여러 Signal을 조합하는 훅
 */
/**
 * @deprecated Use useCombinedSelector from '@shared/utils/signalSelector'.
 * 여기서는 2-arity 시그니처를 유지하되 내부적으로 배열 기반 API로 위임합니다.
 */
export function useCombinedSelector<T1, T2, R>(
  signal1: { value: T1 },
  signal2: { value: T2 },
  selector: (value1: T1, value2: T2) => R
): R {
  return useCombinedSelectorUnified([signal1, signal2] as const, (a, b) => selector(a, b));
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
