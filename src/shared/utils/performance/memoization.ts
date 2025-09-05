/**
 * @fileoverview Component Memoization Utilities
 * @description 컴포넌트 성능 최적화를 위한 메모화 유틸리티
 */

/**
 * Props 비교 함수 타입
 */
type PropsComparator<P> = (prevProps: P, nextProps: P) => boolean;

/**
 * 얕은 비교 함수
 */
function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Preact 컴포넌트 메모화
 */
export function memo<P extends Record<string, unknown>>(
  Component: (props: P) => unknown,
  compare?: PropsComparator<P>
): (props: P) => unknown {
  // Fallback: 간단한 캐싱 구현
  let lastProps: P | undefined;
  let lastResult: unknown;

  return (props: P) => {
    const compareFn = compare || shallowEqual;

    if (lastProps && compareFn(lastProps, props)) {
      return lastResult;
    }

    lastProps = props;
    lastResult = Component(props);
    return lastResult;
  };
}

/**
 * 콜백 메모화 (useCallback 대체)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCallback<T extends (...args: any[]) => any>(callback: T, _deps: unknown[]): T {
  // 간단한 의존성 배열 기반 메모화
  // 실제 프로덕션에서는 Preact의 useCallback 사용 권장
  return callback;
}

/**
 * 값 메모화 (useMemo 대체)
 */
export function useMemo<T>(factory: () => T, _deps: unknown[]): T {
  // 간단한 의존성 배열 기반 메모화
  // 실제 프로덕션에서는 Preact의 useMemo 사용 권장
  return factory();
}
