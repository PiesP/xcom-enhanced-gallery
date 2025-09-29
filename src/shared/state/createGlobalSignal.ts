/**
 * @fileoverview SolidJS 기반 전역 시그널 헬퍼
 * @description Stage D Phase 4 – Preact Signals 제거 후 상태 계층을 SolidJS 핵심 API로 통합
 */

import type { Accessor } from 'solid-js';

import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging';

type ValueUpdater<T> = T | ((previous: T) => T);

export interface GlobalSignal<T> {
  /** SolidJS accessor – Solid 컴포넌트에서 반응형으로 사용 가능 */
  readonly accessor: Accessor<T>;
  /** 현재 값 스냅샷 (구독 없이 조회) */
  value: T;
  /** 함수형 업데이트 지원 */
  update(updater: (previous: T) => T): void;
  /** 변경 구독 – 반환 함수로 구독 해제 */
  subscribe(listener: (value: T) => void): () => void;
  /** 현재 값 조회(동일 참조 반환) */
  peek(): T;
  /** 테스트/정리용 dispose */
  dispose(): void;
}

interface RootInstance<T> {
  readonly accessor: Accessor<T>;
  readonly setAccessor: (input: ValueUpdater<T>) => void;
  readonly dispose: () => void;
}

/**
 * SolidJS `createSignal`을 이용해 전역 상태를 생성합니다.
 * Preact Signals에서 사용하던 `.value`/`subscribe` 인터페이스를 동일하게 제공합니다.
 */
export function createGlobalSignal<T>(initialValue: T): GlobalSignal<T> {
  const solid = getSolidCore();
  const subscribers = new Set<(value: T) => void>();
  let currentValue = initialValue;

  const root = solid.createRoot<RootInstance<T>>(dispose => {
    const [accessor, setAccessor] = solid.createSignal(initialValue, { equals: Object.is });

    const signalSetter = (input: ValueUpdater<T>) => {
      const resolved =
        typeof input === 'function' ? (input as (prev: T) => T)(currentValue) : input;
      if (Object.is(resolved, currentValue)) {
        return;
      }

      currentValue = resolved;
      try {
        solid.batch(() => setAccessor(() => resolved));
      } catch {
        setAccessor(() => resolved);
      }

      if (subscribers.size > 0) {
        for (const listener of subscribers) {
          try {
            listener(resolved);
          } catch (error) {
            logger.error('[GlobalSignal] subscriber error', error);
          }
        }
      }
    };

    return {
      accessor,
      setAccessor: signalSetter,
      dispose,
    } satisfies RootInstance<T>;
  });

  const notify = (input: ValueUpdater<T>) => {
    root.setAccessor(input);
  };

  return {
    get accessor() {
      return root.accessor;
    },

    get value(): T {
      return currentValue;
    },

    set value(next: T) {
      notify(next);
    },

    update(updater: (previous: T) => T): void {
      notify(updater);
    },

    subscribe(listener: (value: T) => void): () => void {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },

    peek(): T {
      return currentValue;
    },

    dispose(): void {
      subscribers.clear();
      try {
        root.dispose();
      } catch {
        /* noop */
      }
    },
  } satisfies GlobalSignal<T>;
}
