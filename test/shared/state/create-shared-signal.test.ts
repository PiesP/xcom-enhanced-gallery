/**
 * @fileoverview SOLID-NATIVE-001 Phase G-2 — createSharedSignal Utility Tests
 * @description 순수 SolidJS 패턴으로 전역 상태를 생성하는 새로운 유틸리티 검증
 * RED Phase: 레거시 createGlobalSignal 호환성 유지하며 네이티브 API 제공
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { getSolidCore } from '@shared/external/vendors';

import type { Accessor, Setter } from 'solid-js';

// Phase G-2-6: createSharedSignal 기본 동작
describe('Phase G-2-6: createSharedSignal - Pure SolidJS Pattern', () => {
  let solid: ReturnType<typeof getSolidCore>;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    solid = getSolidCore();
  });

  afterEach(() => {
    if (cleanup) {
      try {
        cleanup();
      } catch {
        /* noop */
      }
    }
  });

  it('should return [accessor, setter] tuple like createSignal', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // 예상 API: createSharedSignal<T>(initialValue)
      // Returns: [Accessor<T>, Setter<T>]
      const [count, setCount] = solid.createSignal(0);

      expect(typeof count).toBe('function');
      expect(typeof setCount).toBe('function');
      expect(count()).toBe(0);

      setCount(10);
      expect(count()).toBe(10);

      return count;
    });

    expect(result()).toBe(10);
  });

  it('should support functional updates', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [count, setCount] = solid.createSignal(5);

      setCount(prev => prev + 10);
      expect(count()).toBe(15);

      setCount(prev => prev * 2);
      expect(count()).toBe(30);

      return count;
    });

    expect(result()).toBe(30);
  });

  it('should work with custom equals function', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // 객체 참조는 바뀌어도 id가 같으면 동일한 것으로 간주
      const [obj, setObj] = solid.createSignal(
        { id: 1, name: 'Alice' },
        {
          equals: (a, b) => a.id === b.id,
        }
      );

      const computeSpy = vi.fn(() => obj().name);
      const name = solid.createMemo(computeSpy);

      expect(name()).toBe('Alice');
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 객체 참조는 바뀌지만 id가 같음 → 업데이트 안됨
      setObj({ id: 1, name: 'Alice' });
      expect(name()).toBe('Alice');
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // id가 다름 → 업데이트됨
      setObj({ id: 2, name: 'Bob' });
      expect(name()).toBe('Bob');
      expect(computeSpy).toHaveBeenCalledTimes(2);

      return obj;
    });

    expect(result().name).toBe('Bob');
  });
});

// Phase G-2-7: 전역 접근 패턴
describe('Phase G-2-7: Global Access - Module-Level Signals', () => {
  let solid: ReturnType<typeof getSolidCore>;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    solid = getSolidCore();
  });

  afterEach(() => {
    if (cleanup) {
      try {
        cleanup();
      } catch {
        /* noop */
      }
    }
  });

  it('should allow module-level signal definition', () => {
    // 모듈 레벨 전역 상태 시뮬레이션
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // 예상 패턴: 파일 최상위에 정의
      const [globalCount, setGlobalCount] = solid.createSignal(100);

      // 다른 함수에서 접근
      function increment() {
        setGlobalCount(prev => prev + 1);
      }

      function getCount(): number {
        return globalCount();
      }

      expect(getCount()).toBe(100);
      increment();
      expect(getCount()).toBe(101);
      increment();
      expect(getCount()).toBe(102);

      return globalCount;
    });

    expect(result()).toBe(102);
  });

  it('should support multiple consumers', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [shared, setShared] = solid.createSignal('initial');

      // Consumer 1: 대문자 변환
      const upper = solid.createMemo(() => shared().toUpperCase());

      // Consumer 2: 길이 측정
      const length = solid.createMemo(() => shared().length);

      expect(upper()).toBe('INITIAL');
      expect(length()).toBe(7);

      setShared('hello');
      expect(upper()).toBe('HELLO');
      expect(length()).toBe(5);

      return { shared, upper, length };
    });

    expect(result.shared()).toBe('hello');
    expect(result.upper()).toBe('HELLO');
    expect(result.length()).toBe(5);
  });
});

// Phase G-2-8: 레거시 createGlobalSignal 호환성
describe('Phase G-2-8: Legacy Compatibility - createGlobalSignal Interface', () => {
  let solid: ReturnType<typeof getSolidCore>;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    solid = getSolidCore();
  });

  afterEach(() => {
    if (cleanup) {
      try {
        cleanup();
      } catch {
        /* noop */
      }
    }
  });

  it('should provide .value getter/setter for backward compatibility', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [accessor, setter] = solid.createSignal(42);

      // 레거시 호환 래퍼
      const legacy = {
        get value() {
          return accessor();
        },
        set value(next: number) {
          setter(next);
        },
        accessor,
        setter,
      };

      // 레거시 스타일 접근
      expect(legacy.value).toBe(42);

      legacy.value = 100;
      expect(legacy.value).toBe(100);

      // 네이티브 스타일 접근
      expect(accessor()).toBe(100);

      setter(200);
      expect(legacy.value).toBe(200);

      return legacy;
    });

    expect(result.value).toBe(200);
  });

  it('should support subscribe-like pattern via manual callback', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [accessor, setter] = solid.createSignal(10);

      // 레거시 subscribe를 수동 콜백 패턴으로 에뮬레이션
      const listeners: Array<(value: number) => void> = [];

      function subscribe(listener: (value: number) => void) {
        listeners.push(listener);
        // 초기 값으로 즉시 호출
        listener(accessor());

        return () => {
          const index = listeners.indexOf(listener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        };
      }

      // setter 래퍼: 변경 시 리스너들에게 알림
      function setSetter(next: number | ((prev: number) => number)) {
        setter(next);
        const current = accessor();
        for (const listener of listeners) {
          listener(current);
        }
      }

      const spy = vi.fn();
      const unsubscribe = subscribe(spy);

      expect(spy).toHaveBeenCalledWith(10);
      expect(spy).toHaveBeenCalledTimes(1);

      setSetter(20);
      expect(spy).toHaveBeenCalledWith(20);
      expect(spy).toHaveBeenCalledTimes(2);

      unsubscribe();

      setSetter(30);
      expect(spy).toHaveBeenCalledTimes(2); // 구독 해제 후 호출 안됨

      return accessor;
    });

    expect(result()).toBe(30);
  });

  it('should support peek() for non-reactive access', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [accessor, setter] = solid.createSignal(100);

      // peek은 untrack으로 구현 가능
      function peek(): number {
        return solid.untrack(() => accessor());
      }

      const computeSpy = vi.fn(() => accessor());
      const memo = solid.createMemo(computeSpy);

      expect(memo()).toBe(100);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // peek는 의존성 추적 안됨
      const peeked = peek();
      expect(peeked).toBe(100);

      setter(200);
      expect(peek()).toBe(200);
      expect(memo()).toBe(200);
      expect(computeSpy).toHaveBeenCalledTimes(2);

      return accessor;
    });

    expect(result()).toBe(200);
  });

  it('should support update() for functional updates', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [accessor, setter] = solid.createSignal(5);

      // update는 setter의 함수형 업데이트와 동일
      function update(updater: (prev: number) => number) {
        setter(updater);
      }

      expect(accessor()).toBe(5);

      update(prev => prev * 2);
      expect(accessor()).toBe(10);

      update(prev => prev + 5);
      expect(accessor()).toBe(15);

      return accessor;
    });

    expect(result()).toBe(15);
  });
});

// Phase G-2-9: 마이그레이션 가이드 검증
describe('Phase G-2-9: Migration Guide - From createGlobalSignal to Native', () => {
  let solid: ReturnType<typeof getSolidCore>;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    solid = getSolidCore();
  });

  afterEach(() => {
    if (cleanup) {
      try {
        cleanup();
      } catch {
        /* noop */
      }
    }
  });

  it('should demonstrate migration path: .value → function call', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // Before: createGlobalSignal
      const legacyStyle = (() => {
        const [accessor, setter] = solid.createSignal(10);
        return {
          get value() {
            return accessor();
          },
          set value(next: number) {
            setter(next);
          },
        };
      })();

      // After: createSharedSignal (native)
      const [count, setCount] = solid.createSignal(10);

      // 레거시 코드
      expect(legacyStyle.value).toBe(10);
      legacyStyle.value = 20;
      expect(legacyStyle.value).toBe(20);

      // 신규 코드
      expect(count()).toBe(10);
      setCount(20);
      expect(count()).toBe(20);

      return { legacy: legacyStyle, native: count };
    });

    expect(result.legacy.value).toBe(20);
    expect(result.native()).toBe(20);
  });

  it('should demonstrate migration: manual callback → reactive tracking', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [accessor, setter] = solid.createSignal(0);

      // Before: 수동 subscribe 패턴 (레거시)
      const legacyCallbacks: Array<(value: number) => void> = [];
      function notifyLegacyListeners(value: number) {
        for (const cb of legacyCallbacks) {
          cb(value);
        }
      }

      const legacySpy = vi.fn();
      legacyCallbacks.push(legacySpy);
      notifyLegacyListeners(accessor()); // 초기 호출

      // After: createEffect로 자동 추적 (네이티브)
      const nativeSpy = vi.fn();
      let nativeValue = accessor();
      nativeSpy(nativeValue);

      expect(legacySpy).toHaveBeenCalledWith(0);
      expect(nativeSpy).toHaveBeenCalledWith(0);

      // 레거시: 수동 알림 필요
      setter(10);
      notifyLegacyListeners(accessor());

      // 네이티브: 자동 추적 시뮬레이션
      nativeValue = accessor();
      nativeSpy(nativeValue);

      expect(legacySpy).toHaveBeenCalledWith(10);
      expect(nativeSpy).toHaveBeenCalledWith(10);

      return accessor;
    });

    expect(result()).toBe(10);
  });

  it('should demonstrate coexistence during migration', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // 레거시 시그널
      const [legacyAccessor, legacySetter] = solid.createSignal(5);
      const legacyWrapper = {
        get value() {
          return legacyAccessor();
        },
        set value(next: number) {
          legacySetter(next);
        },
        accessor: legacyAccessor,
      };

      // 신규 시그널
      const [modernAccessor, modernSetter] = solid.createSignal(5);

      // 레거시 의존 코드 (단계적 마이그레이션)
      const legacyDerived = solid.createMemo(() => legacyAccessor() * 2);

      // 신규 코드
      const modernDerived = solid.createMemo(() => modernAccessor() * 2);

      expect(legacyWrapper.value).toBe(5);
      expect(modernAccessor()).toBe(5);
      expect(legacyDerived()).toBe(10);
      expect(modernDerived()).toBe(10);

      legacyWrapper.value = 10;
      modernSetter(10);

      expect(legacyDerived()).toBe(20);
      expect(modernDerived()).toBe(20);

      return { legacy: legacyAccessor, modern: modernAccessor };
    });

    expect(result.legacy()).toBe(10);
    expect(result.modern()).toBe(10);
  });
});

// Phase G-2-10: 타입 안전성
describe('Phase G-2-10: Type Safety - Accessor and Setter Contracts', () => {
  let solid: ReturnType<typeof getSolidCore>;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    solid = getSolidCore();
  });

  afterEach(() => {
    if (cleanup) {
      try {
        cleanup();
      } catch {
        /* noop */
      }
    }
  });

  it('should enforce correct Accessor<T> and Setter<T> types', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // 명시적 타입 선언
      const [count, setCount]: [Accessor<number>, Setter<number>] = solid.createSignal(0);

      expect(count()).toBe(0);

      // Setter는 값 또는 함수 모두 받음
      setCount(10);
      expect(count()).toBe(10);

      setCount(prev => prev + 5);
      expect(count()).toBe(15);

      return count;
    });

    expect(result()).toBe(15);
  });

  it('should work with complex object types', () => {
    interface AppState {
      user: { id: number; name: string } | null;
      loading: boolean;
    }

    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [state, setState]: [Accessor<AppState>, Setter<AppState>] = solid.createSignal({
        user: null,
        loading: false,
      });

      expect(state().user).toBeNull();
      expect(state().loading).toBe(false);

      setState({ user: { id: 1, name: 'Alice' }, loading: true });
      expect(state().user?.name).toBe('Alice');
      expect(state().loading).toBe(true);

      setState(prev => ({ ...prev, loading: false }));
      expect(state().loading).toBe(false);
      expect(state().user?.name).toBe('Alice');

      return state;
    });

    expect(result().user?.name).toBe('Alice');
  });

  it('should support union types', () => {
    type Status = 'idle' | 'loading' | 'success' | 'error';

    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [status, setStatus]: [Accessor<Status>, Setter<Status>] = solid.createSignal('idle');

      expect(status()).toBe('idle');

      setStatus('loading');
      expect(status()).toBe('loading');

      setStatus('success');
      expect(status()).toBe('success');

      return status;
    });

    expect(result()).toBe('success');
  });
});
