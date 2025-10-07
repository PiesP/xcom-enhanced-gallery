/**
 * @fileoverview Signals Safe Factory
 * @description Phase 6: Solid.js Signals 기반 팩토리
 */

import { logger } from '@shared/logging/logger';
import { getSolid } from '@shared/external/vendors';

// 공통 시그널 타입 (subscribe 지원)
export type SafeSignal<T> = {
  value: T;
  subscribe: (callback: (value: T) => void) => () => void;
};

function getSolidOrNull() {
  try {
    return getSolid();
  } catch (error) {
    logger.warn('Solid.js 미사용 환경 감지 - 안전 폴백 사용', { error });
    return null;
  }
}

/**
 * 안전한 시그널 생성기. Solid.js가 없으면 경량 폴백을 제공합니다.
 */
export function createSignalSafe<T>(initial: T): SafeSignal<T> {
  const solid = getSolidOrNull();

  if (solid?.createSignal && solid?.createEffect) {
    const [getter, setter] = solid.createSignal<T>(initial);
    return {
      get value() {
        return getter();
      },
      set value(v: T) {
        setter(v as Exclude<T, Function>);
      },
      subscribe: (callback: (value: T) => void): (() => void) => {
        try {
          solid.createEffect(() => callback(getter()));
          // Solid createEffect는 cleanup 함수를 반환하지 않으므로 noop 반환
          return () => {};
        } catch (error) {
          logger.warn('Solid effect 구독 실패 - noop 처리', { error });
          return () => {};
        }
      },
    };
  }

  // 폴백: 간단한 옵저버 패턴 구현
  let _value = initial;
  const listeners = new Set<(v: T) => void>();

  const fallback: SafeSignal<T> = {
    get value() {
      return _value;
    },
    set value(v: T) {
      _value = v;
      try {
        listeners.forEach(l => l(_value));
      } catch (error) {
        logger.warn('Fallback Signal notify 실패', { error });
      }
    },
    subscribe(callback: (value: T) => void): () => void {
      // 즉시 현재값 전달 후 구독 등록
      try {
        callback(_value);
      } catch {
        // ignore
      }
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };

  return fallback;
}

/**
 * 안전한 effect. Solid.js가 없으면 콜백을 1회 실행하고 noop을 반환합니다.
 */
export function effectSafe(fn: () => void): () => void {
  const solid = getSolidOrNull();
  if (solid?.createEffect) {
    try {
      solid.createEffect(fn);
      // Solid createEffect는 cleanup 함수를 반환하지 않음
      return () => {};
    } catch (error) {
      logger.warn('Solid effect 실행 실패 - noop 처리', { error });
    }
  }
  try {
    fn();
  } catch {
    // ignore
  }
  return () => {};
}

/**
 * 안전한 computed. Solid.js가 없으면 접근 시 계산되는 getter를 제공합니다.
 */
export function computedSafe<T>(compute: () => T): { readonly value: T } {
  const solid = getSolidOrNull();
  if (solid?.createMemo) {
    try {
      const memo = solid.createMemo(compute);
      return {
        get value() {
          return memo();
        },
      } as const;
    } catch (error) {
      logger.warn('Solid createMemo 생성 실패 - fallback으로 진행', { error });
    }
  }
  return {
    get value() {
      return compute();
    },
  } as const;
}
