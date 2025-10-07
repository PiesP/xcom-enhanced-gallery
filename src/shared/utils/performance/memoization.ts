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
 * 컴포넌트 메모화 (Solid.js 네이티브 기능 권장)
 * @deprecated Solid.js는 기본적으로 최적화되어 있어 메모화가 불필요함
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
 * 콜백 메모화
 * @deprecated Solid.js는 컴포넌트가 1회 실행되므로 useCallback 불필요
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCallback<T extends (...args: any[]) => any>(callback: T, _deps: unknown[]): T {
  return callback;
}

/**
 * 값 메모화
 * @deprecated Solid.js는 createMemo를 사용
 */
export function useMemo<T>(factory: () => T, _deps: unknown[]): T {
  return factory();
}
