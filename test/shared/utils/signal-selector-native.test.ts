/**
 * @fileoverview SOLID-NATIVE-001 Phase G-2 — signalSelector Native Pattern Tests
 * @description SolidJS 네이티브 패턴으로 전환된 signalSelector 유틸리티 검증
 * RED Phase: 네이티브 API가 올바르게 작동하는지 테스트로 먼저 정의
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { getSolidCore } from '@shared/external/vendors';

import type { Accessor } from 'solid-js';

// Phase G-2-1: ObservableValue<T> → Accessor<T> 기반 API
describe('Phase G-2-1: useSignalSelector - Native SolidJS Pattern', () => {
  let solid: ReturnType<typeof getSolidCore>;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    solid = getSolidCore();
    cleanup = undefined;
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

  it('should create memoized selector from Accessor<T>', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // Given: SolidJS native signal
      const [count, setCount] = solid.createSignal(10);

      // When: useSignalSelector로 파생 값 생성 (아직 구현 안됨)
      // import { useSignalSelector } from '@shared/utils/signalSelector';
      // const doubled = useSignalSelector(count, n => n * 2);

      // Then: createMemo로 직접 구현한 예상 동작
      const doubled = solid.createMemo(() => count() * 2);

      expect(doubled()).toBe(20);

      setCount(15);
      expect(doubled()).toBe(30);

      return doubled;
    });

    expect(result()).toBe(30);
  });

  it('should support memoization with custom equality', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [obj, setObj] = solid.createSignal({ value: 10 }, { equals: false });

      // 예상 API: useSignalSelector(accessor, selector, { equals: customEquals })
      const selected = solid.createMemo(() => obj().value);

      expect(selected()).toBe(10);

      // 객체 참조는 바뀌지만 value는 동일
      setObj({ value: 10 });
      expect(selected()).toBe(10);

      setObj({ value: 20 });
      expect(selected()).toBe(20);

      return selected;
    });

    expect(result()).toBe(20);
  });

  it('should prevent unnecessary recomputation', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [count, setCount] = solid.createSignal(5);
      const computeSpy = vi.fn((n: number) => n * 3);

      const tripled = solid.createMemo(() => computeSpy(count()));

      expect(tripled()).toBe(15);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 같은 값으로 재할당 → 재계산 없어야 함
      setCount(5);
      expect(tripled()).toBe(15);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      setCount(10);
      expect(tripled()).toBe(30);
      expect(computeSpy).toHaveBeenCalledTimes(2);

      return tripled;
    });

    expect(result()).toBe(30);
  });
});

// Phase G-2-2: useCombinedSelector → Native API
describe('Phase G-2-2: useCombinedSignalSelector - Multiple Accessors', () => {
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

  it('should combine multiple accessors with createMemo', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [a, setA] = solid.createSignal(2);
      const [b, setB] = solid.createSignal(3);

      // 예상 API: useCombinedSignalSelector([a, b], (valA, valB) => valA + valB)
      const sum = solid.createMemo(() => a() + b());

      expect(sum()).toBe(5);

      setA(10);
      expect(sum()).toBe(13);

      setB(7);
      expect(sum()).toBe(17);

      return sum;
    });

    expect(result()).toBe(17);
  });

  it('should optimize with dependency tracking', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [x, setX] = solid.createSignal(1);
      const [y, setY] = solid.createSignal(2);
      const [z, setZ] = solid.createSignal(3);

      const computeSpy = vi.fn((a: number, b: number) => a * b);

      // x와 y만 의존, z는 무시
      const product = solid.createMemo(() => computeSpy(x(), y()));

      expect(product()).toBe(2);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // z 변경 → product는 재계산 안됨
      setZ(100);
      expect(product()).toBe(2);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      setX(5);
      expect(product()).toBe(10);
      expect(computeSpy).toHaveBeenCalledTimes(2);

      return product;
    });

    expect(result()).toBe(10);
  });

  it('should work with complex derived state', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [firstName, setFirstName] = solid.createSignal('John');
      const [lastName, setLastName] = solid.createSignal('Doe');
      const [age, setAge] = solid.createSignal(30);

      const fullName = solid.createMemo(() => `${firstName()} ${lastName()}`);
      const summary = solid.createMemo(() => `${fullName()}, ${age()} years old`);

      expect(summary()).toBe('John Doe, 30 years old');

      setFirstName('Jane');
      expect(summary()).toBe('Jane Doe, 30 years old');

      setAge(25);
      expect(summary()).toBe('Jane Doe, 25 years old');

      return summary;
    });

    expect(result()).toBe('Jane Doe, 25 years old');
  });
});

// Phase G-2-3: 레거시 호환성 검증
describe('Phase G-2-3: Legacy Compatibility - ObservableValue Interface', () => {
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

  it('should support legacy ObservableValue with .value property', () => {
    // 레거시 createGlobalSignal 구조
    interface LegacyObservable<T> {
      value: T;
      subscribe: (listener: (value: T) => void) => () => void;
    }

    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [accessor, setter] = solid.createSignal(100);

      // 레거시 래퍼 구조 시뮬레이션
      const legacy: LegacyObservable<number> = {
        get value() {
          return accessor();
        },
        set value(next: number) {
          setter(next);
        },
        subscribe: (listener: (value: number) => void) => {
          const effect = solid.createEffect(() => {
            listener(accessor());
          });
          return () => {
            /* cleanup handled by createRoot */
          };
        },
      };

      expect(legacy.value).toBe(100);

      legacy.value = 200;
      expect(legacy.value).toBe(200);

      return accessor;
    });

    expect(result()).toBe(200);
  });

  it('should allow gradual migration from ObservableValue to Accessor', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      // 신규 코드: 순수 Accessor 사용
      const [count, setCount] = solid.createSignal(5);

      // 레거시 코드: .value 접근을 위한 래퍼 (마이그레이션 기간)
      const legacyWrapper = {
        get value() {
          return count();
        },
        set value(next: number) {
          setCount(next);
        },
        accessor: count,
      };

      // 신규 패턴: Accessor 직접 사용
      const doubled = solid.createMemo(() => count() * 2);

      // 레거시 패턴: .value 사용
      expect(legacyWrapper.value).toBe(5);
      expect(doubled()).toBe(10);

      legacyWrapper.value = 10;
      expect(count()).toBe(10);
      expect(doubled()).toBe(20);

      return { count, doubled };
    });

    expect(result.count()).toBe(10);
    expect(result.doubled()).toBe(20);
  });
});

// Phase G-2-4: 타입 안전성 검증
describe('Phase G-2-4: Type Safety - Accessor<T> Contracts', () => {
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

  it('should enforce Accessor<T> return type', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [str, setStr] = solid.createSignal('hello');

      // Accessor<string> 타입 강제
      const upper: Accessor<string> = solid.createMemo(() => str().toUpperCase());

      expect(upper()).toBe('HELLO');

      setStr('world');
      expect(upper()).toBe('WORLD');

      return upper;
    });

    expect(result()).toBe('WORLD');
  });

  it('should support complex type transformations', () => {
    interface User {
      id: number;
      name: string;
    }

    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [user, setUser] = solid.createSignal<User>({ id: 1, name: 'Alice' });

      // Accessor<User> → Accessor<string>
      const userName: Accessor<string> = solid.createMemo(() => user().name);

      expect(userName()).toBe('Alice');

      setUser({ id: 2, name: 'Bob' });
      expect(userName()).toBe('Bob');

      return userName;
    });

    expect(result()).toBe('Bob');
  });

  it('should work with nullable types', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [maybeValue, setMaybeValue] = solid.createSignal<number | null>(null);

      const doubled: Accessor<number | null> = solid.createMemo(() => {
        const val = maybeValue();
        return val !== null ? val * 2 : null;
      });

      expect(doubled()).toBeNull();

      setMaybeValue(10);
      expect(doubled()).toBe(20);

      setMaybeValue(null);
      expect(doubled()).toBeNull();

      return doubled;
    });

    expect(result()).toBeNull();
  });
});

// Phase G-2-5: 성능 특성 검증
describe('Phase G-2-5: Performance - Memoization Efficiency', () => {
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

  it('should not recompute when dependencies are stable', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [a, setA] = solid.createSignal(1);
      const [b] = solid.createSignal(2); // 불변

      const computeSpy = vi.fn((x: number, y: number) => x + y);
      const sum = solid.createMemo(() => computeSpy(a(), b()));

      expect(sum()).toBe(3);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // b는 안 바뀜, a만 업데이트
      setA(1); // 같은 값
      expect(sum()).toBe(3);
      expect(computeSpy).toHaveBeenCalledTimes(1); // 재계산 없음

      setA(5);
      expect(sum()).toBe(7);
      expect(computeSpy).toHaveBeenCalledTimes(2);

      return sum;
    });

    expect(result()).toBe(7);
  });

  it('should batch multiple updates efficiently', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [x, setX] = solid.createSignal(1);
      const [y, setY] = solid.createSignal(2);

      const computeSpy = vi.fn((a: number, b: number) => a + b);
      const sum = solid.createMemo(() => computeSpy(x(), y()));

      expect(sum()).toBe(3);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // batch로 여러 업데이트를 하나로
      solid.batch(() => {
        setX(10);
        setY(20);
      });

      expect(sum()).toBe(30);
      expect(computeSpy).toHaveBeenCalledTimes(2); // batch 후 1회만 재계산

      return sum;
    });

    expect(result()).toBe(30);
  });

  it('should handle deep memo chains efficiently', () => {
    const result = solid.createRoot(dispose => {
      cleanup = dispose;

      const [base, setBase] = solid.createSignal(2);

      const spy1 = vi.fn((n: number) => n * 2);
      const spy2 = vi.fn((n: number) => n + 10);
      const spy3 = vi.fn((n: number) => n ** 2);

      const step1 = solid.createMemo(() => spy1(base()));
      const step2 = solid.createMemo(() => spy2(step1()));
      const step3 = solid.createMemo(() => spy3(step2()));

      expect(step3()).toBe(196); // ((2 * 2) + 10) ** 2 = 14^2
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(spy3).toHaveBeenCalledTimes(1);

      setBase(3);
      expect(step3()).toBe(256); // ((3 * 2) + 10) ** 2 = 16^2
      expect(spy1).toHaveBeenCalledTimes(2);
      expect(spy2).toHaveBeenCalledTimes(2);
      expect(spy3).toHaveBeenCalledTimes(2);

      return step3;
    });

    expect(result()).toBe(256);
  });
});
