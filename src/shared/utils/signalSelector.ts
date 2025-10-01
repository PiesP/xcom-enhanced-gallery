/**
 * @fileoverview SolidJS Native Signal Selector Utilities
 * @description Epic SOLID-NATIVE-002 Phase C - Accessor<T> 기반 selector 유틸리티
 *
 * 레거시 ObservableValue<T> {.value, .subscribe()} 패턴 제거
 * → SolidJS Accessor<T> 네이티브 패턴으로 전환
 */

import type { Accessor } from 'solid-js';

import { getSolidCore } from '@shared/external/vendors';

/**
 * Selector 함수 타입 - Accessor 기반
 */
export type SelectorFn<T, R> = (value: T) => R;

/**
 * Accessor에서 파생 값을 생성하는 메모이제이션된 selector
 *
 * @template T - 입력 값 타입
 * @template R - 출력 값 타입
 * @param accessor - SolidJS Accessor<T>
 * @param selector - 변환 함수 (value: T) => R
 * @param options - equals 옵션 (기본: Object.is)
 * @returns 메모이제이션된 Accessor<R>
 *
 * @example
 * const [count, setCount] = createSignal(10);
 * const doubled = useSignalSelector(count, n => n * 2);
 * console.log(doubled()); // 20
 */
export function useSignalSelector<T, R>(
  accessor: Accessor<T>,
  selector: SelectorFn<T, R>,
  options?: { equals?: false | ((prev: R, next: R) => boolean) }
): Accessor<R> {
  const solid = getSolidCore();

  return solid.createMemo(() => {
    const value = accessor();
    return selector(value);
  }, options);
}

/**
 * 여러 Accessor를 결합하는 메모이제이션된 selector
 *
 * @template TAccessors - Accessor 배열 타입
 * @template R - 출력 값 타입
 * @param accessors - Accessor 배열 [Accessor<A>, Accessor<B>, ...]
 * @param combiner - 결합 함수 (a: A, b: B, ...) => R
 * @param options - equals 옵션
 * @returns 메모이제이션된 Accessor<R>
 *
 * @example
 * const [a] = createSignal(2);
 * const [b] = createSignal(3);
 * const sum = useCombinedSignalSelector([a, b], (x, y) => x + y);
 * console.log(sum()); // 5
 */
export function useCombinedSignalSelector<TAccessors extends readonly Accessor<unknown>[], R>(
  accessors: TAccessors,
  combiner: (
    ...values: { [K in keyof TAccessors]: TAccessors[K] extends Accessor<infer U> ? U : never }
  ) => R,
  options?: { equals?: false | ((prev: R, next: R) => boolean) }
): Accessor<R> {
  const solid = getSolidCore();

  return solid.createMemo(() => {
    // 모든 Accessor 호출하여 현재 값 가져오기
    const values = accessors.map(accessor => accessor()) as {
      [K in keyof TAccessors]: TAccessors[K] extends Accessor<infer U> ? U : never;
    };

    return combiner(...values);
  }, options);
}

/**
 * 디버그 모드 전역 설정 (호환성 유지)
 */
let isDebugMode = false;

/**
 * 디버그 모드 설정
 */
export function setDebugMode(enabled: boolean): void {
  isDebugMode = enabled;
}

/**
 * 디버그 모드 상태 가져오기
 */
export function getDebugMode(): boolean {
  return isDebugMode;
}

/**
 * Legacy API Migration Guide:
 *
 * Before (Epic SOLID-NATIVE-001):
 * ```ts
 * const mySignal = createGlobalSignal({ count: 0 });
 * const doubled = useSelector(mySignal, state => state.count * 2);
 * console.log(doubled.value); // .value 접근
 * ```
 *
 * After (Epic SOLID-NATIVE-002):
 * ```ts
 * const [count, setCount] = createSignal(0);
 * const doubled = useSignalSelector(count, n => n * 2);
 * console.log(doubled()); // 함수 호출
 * ```
 *
 * Migration Steps:
 * 1. createGlobalSignal → createSignal 전환
 * 2. useSelector → useSignalSelector
 * 3. .value 접근 → () 함수 호출
 * 4. ObservableValue 인터페이스 제거
 */
