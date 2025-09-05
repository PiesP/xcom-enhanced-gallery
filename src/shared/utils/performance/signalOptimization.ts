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
export function createSelector<T, R>(selector: SelectorFunction<T, R>): SelectorFunction<T, R> {
  let lastInput: T | undefined;
  let lastOutput: R;
  let hasResult = false;

  return (input: T): R => {
    // 참조 동일성 검사
    if (hasResult && Object.is(input, lastInput)) {
      return lastOutput;
    }

    // 새로운 결과 계산
    lastInput = input;
    lastOutput = selector(input);
    hasResult = true;

    return lastOutput;
  };
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
  state: T,
  selector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): AsyncSelectorResult<R> {
  const { useState, useEffect } = getPreactHooks();

  const [result, setResult] = useState<AsyncSelectorResult<R>>({
    value: defaultValue,
    loading: false,
    error: null,
  });

  useEffect(() => {
    setResult((prev: AsyncSelectorResult<R>) => ({ ...prev, loading: true, error: null }));

    const timeoutId = setTimeout(async () => {
      try {
        const value = await selector(state);
        setResult({ value, loading: false, error: null });
      } catch (error) {
        setResult({
          value: defaultValue,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [state, selector, defaultValue, debounceMs]);

  return result;
}
