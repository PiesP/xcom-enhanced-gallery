/**
 * @fileoverview Solid Signals Safe Factory
 * @description Solid.js 기반 Signals 팩토리. Preact Signals와 호환 가능한 .value accessor 제공.
 */

import { logger } from '@shared/logging/logger';
import { getSolid } from '@shared/external/vendors';

// 공통 시그널 타입 (subscribe 지원, Preact Signals 호환)
export type SafeSignal<T> = {
  value: T;
  subscribe: (callback: (value: T) => void) => () => void;
};

// Computed Signal 타입 (읽기 전용)
export type SafeComputed<T> = {
  readonly value: T;
};

/**
 * Solid.js 기반 안전한 시그널 생성기
 * Preact Signals의 .value accessor 패턴 호환
 */
export function createSignalSafe<T>(initial: T): SafeSignal<T> {
  try {
    const { createSignal, createEffect } = getSolid();
    const [get, set] = createSignal<T>(initial);

    // Preact Signals 호환 .value accessor 구현
    const safeSignal: SafeSignal<T> = {
      get value() {
        return get();
      },
      set value(newValue: T) {
        // Solid의 set은 Exclude<T, Function> | ((prev: T) => T) 타입
        // 함수가 아닌 경우에만 허용되므로, 타입 단언으로 우회
        set(newValue as Exclude<T, Function>);
      },
      subscribe(callback: (value: T) => void): () => void {
        try {
          // createRoot로 effect를 감싸서 안전한 cleanup 보장
          const { createRoot } = getSolid();
          let rootDispose: (() => void) | void = undefined;

          try {
            rootDispose = createRoot(dispose => {
              // Effect를 createRoot 스코프 내에서 생성
              // createEffect는 즉시 실행되므로 초기값 호출도 여기서 처리
              createEffect(() => {
                callback(get());
              });

              // createRoot의 dispose 함수 반환 (root와 그 안의 effect 모두 cleanup)
              return dispose;
            });
          } catch (error) {
            // SSR 환경 또는 createRoot 실패 시 fallback
            logger.warn('Solid Signal subscribe - createRoot 실패, 초기값만 호출', {
              error,
            });
            // SSR 환경에서는 최소한 초기값은 전달
            const currentValue = get();
            callback(currentValue);
          }

          // cleanup 함수 반환 (항상 함수 반환)
          return typeof rootDispose === 'function' ? rootDispose : () => {};
        } catch (error) {
          logger.warn('Solid Signal subscribe 실패', { error });
          return () => {};
        }
      },
    };

    return safeSignal;
  } catch (error) {
    logger.error('Solid.js 초기화 실패 - Signal 생성 불가', { error });
    throw new Error('Solid.js가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
  }
}

/**
 * Solid.js createMemo 기반 computed signal
 * @returns 읽기 전용 computed signal (.value만 제공)
 */
export function computedSafe<T>(fn: () => T): SafeComputed<T> {
  try {
    const { createMemo } = getSolid();
    const memo = createMemo(fn);

    const safeComputed: SafeComputed<T> = {
      get value() {
        return memo();
      },
    };

    return safeComputed;
  } catch (error) {
    logger.error('Solid.js computed 생성 실패', { error });
    throw new Error('Solid.js가 초기화되지 않았습니다.');
  }
}

/**
 * Solid.js createEffect 기반 effect
 * @returns cleanup 함수 (항상 함수 반환, SSR 환경 고려)
 *
 * Phase 9.17: 이중 실행 방지
 * - createEffect는 즉시 1번 실행하므로 수동 실행 제거
 * - SSR 환경에서도 createEffect가 한 번은 실행함
 */
export function effectSafe(fn: () => void): () => void {
  try {
    const { createEffect } = getSolid();

    // Phase 9.17: 수동 실행 제거 - createEffect가 즉시 1번 실행함
    // 이전에는 수동 1회 + createEffect 1회 = 총 2회 실행되어 이중 렌더링 발생
    const dispose = createEffect(fn);

    // dispose가 함수가 아닐 수 있으므로 안전하게 처리
    return typeof dispose === 'function' ? dispose : () => {};
  } catch (error) {
    logger.error('Solid.js effect 실행 실패', { error });
    // 폴백: 1회 실행 후 noop cleanup
    try {
      fn();
    } catch {
      // ignore
    }
    return () => {};
  }
}
