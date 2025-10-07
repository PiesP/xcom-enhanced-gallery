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
          // 초기값 즉시 전달
          const currentValue = get();
          callback(currentValue);

          // JSDOM 환경(SSR)에서는 createEffect가 undefined를 반환할 수 있음
          let dispose: (() => void) | void = undefined;

          try {
            // Solid createEffect로 구독 구현
            dispose = createEffect(() => {
              callback(get());
            });
          } catch {
            // SSR 환경에서 effect가 동작하지 않을 수 있음
          }

          // cleanup 함수 반환 (항상 함수 반환)
          return typeof dispose === 'function' ? dispose : () => {};
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
 */
export function effectSafe(fn: () => void): () => void {
  try {
    const { createEffect } = getSolid();

    // JSDOM/SSR 환경에서는 effect가 즉시 실행되지 않을 수 있음
    // 수동으로 1회 실행
    try {
      fn();
    } catch (error) {
      logger.warn('Effect 함수 초기 실행 실패', { error });
    }

    // cleanup 함수 얻기 시도
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
