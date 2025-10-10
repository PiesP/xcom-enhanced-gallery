/**
 * @fileoverview Signals Safe Factory
 * @description Preact Signals 의존을 안전하게 감싸는 팩토리. 테스트/Node 환경과
 * TDZ 상황에서도 동작하도록 폴백을 제공합니다.
 */

import { logger } from '@shared/logging/logger';
import { getSolid } from '@shared/external/vendors';

// 공통 시그널 타입 (subscribe 지원)
export type SafeSignal<T> = {
  value: T;
  subscribe: (callback: (value: T) => void) => () => void;
};

function getSolidOrNull(): ReturnType<typeof getSolid> | null {
  try {
    return getSolid();
  } catch (error) {
    logger.warn('Solid.js 미사용 환경 감지 - 안전 폴백 사용', { error });
    return null;
  }
}

/**
 * 안전한 시그널 생성기. Preact Signals이 없으면 경량 폴백을 제공합니다.
 */
export function createSignalSafe<T>(initial: T): SafeSignal<T> {
  const solid = getSolidOrNull();

  if (solid) {
    const { createSignal, createRoot, createEffect } = solid;
    const [read, write] = createSignal(initial, { equals: false });

    const signalObject = {
      subscribe(callback: (value: T) => void): () => void {
        try {
          return createRoot(dispose => {
            createEffect(() => {
              callback(read());
            });
            return dispose;
          });
        } catch (error) {
          logger.warn('Solid signal 구독 실패 - noop 처리', { error });
          return () => {};
        }
      },
    } as SafeSignal<T>;

    Object.defineProperty(signalObject, 'value', {
      get: () => read(),
      set: (value: T) => {
        try {
          write(() => value);
        } catch (error) {
          logger.warn('Solid signal 값 설정 실패 - 기존 값 유지', { error });
        }
      },
      enumerable: true,
    });

    return signalObject;
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
  } as SafeSignal<T>;

  return fallback;
}

/**
 * 안전한 effect. Signals이 없으면 콜백을 1회 실행하고 noop을 반환합니다.
 */
export function effectSafe(fn: () => void): () => void {
  const solid = getSolidOrNull();
  if (solid) {
    try {
      const { createRoot, createEffect } = solid;
      return createRoot(dispose => {
        createEffect(() => fn());
        return dispose;
      });
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
 * 안전한 computed. Signals이 없으면 접근 시 계산되는 getter를 제공합니다.
 */
export function computedSafe<T>(compute: () => T): { readonly value: T } {
  const solid = getSolidOrNull();
  if (solid) {
    try {
      const { createRoot, createMemo } = solid;
      let memoAccessor: (() => T) | null = null;

      createRoot(dispose => {
        memoAccessor = createMemo(compute);
        return () => {
          memoAccessor = null;
          dispose();
        };
      });

      return {
        get value() {
          try {
            return memoAccessor ? memoAccessor() : compute();
          } catch (error) {
            logger.warn('Solid memo 접근 실패 - 즉시 계산으로 대체', { error });
            return compute();
          }
        },
      } as const;
    } catch (error) {
      logger.warn('Solid computed 생성 실패 - fallback으로 진행', { error });
    }
  }
  return {
    get value() {
      return compute();
    },
  } as const;
}
