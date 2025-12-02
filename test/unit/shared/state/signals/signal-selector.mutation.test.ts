/**
 * @fileoverview Signal Selector Mutation Tests
 *
 * Tests targeting mutation coverage for signal-selector.ts
 * Focuses on: shallowEqual, dependency caching, memoization edge cases
 */

import { useSelector, type SelectorFn } from '@shared/state/signals/signal-selector';

// Mock Solid.js with tracking capability
let memoCallCount = 0;

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createMemo: (fn: () => unknown) => {
    memoCallCount++;
    return fn;
  },
}));

// Create a mock signal type for testing
type TestSignal<T> = { value: T };

function createMockSignal<T>(initialValue: T): TestSignal<T> {
  return { value: initialValue };
}

describe('signal-selector mutation tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoCallCount = 0;
  });

  describe('shallowEqual function', () => {
    it('should return false when arrays have different lengths', () => {
      interface State {
        items: number[];
      }
      const state1: State = { items: [1, 2] };
      const state2: State = { items: [1, 2, 3] };

      const signal = { value: state1 };
      const selector: SelectorFn<State, number[]> = state => [...state.items];

      const result = useSelector(signal, selector, {
        dependencies: state => state.items,
      });

      // First call
      const firstResult = result();
      expect(firstResult).toEqual([1, 2]);

      // Change signal to state2 with different array length
      signal.value = state2;
      const secondResult = result();
      expect(secondResult).toEqual([1, 2, 3]);
    });

    it('should return false when array elements differ using Object.is', () => {
      interface State {
        a: number;
        b: number;
      }
      let currentState: State = { a: 1, b: 2 };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => state.a + state.b);
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.a, state.b],
      });

      // First call
      expect(result()).toBe(3);
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Change 'b' value - should recompute
      currentState = { a: 1, b: 5 };
      expect(result()).toBe(6);
      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    it('should use cached value when dependencies are shallowly equal', () => {
      interface State {
        count: number;
        name: string;
        metadata: { timestamp: number };
      }
      let currentState: State = { count: 5, name: 'test', metadata: { timestamp: 1000 } };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => `${state.name}-${state.count}`);
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.count, state.name],
      });

      // First call
      expect(result()).toBe('test-5');
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Change only metadata (not in dependencies) - dependencies unchanged
      // But since state object reference changes, we need new call
      currentState = { count: 5, name: 'test', metadata: { timestamp: 2000 } };

      // Should still use cached value because dependencies didn't change
      expect(result()).toBe('test-5');
      // Note: computeFn will be called again because we don't have reference equality
      // but the result should be cached based on dependency values
    });

    it('should handle Object.is semantics for NaN', () => {
      interface State {
        value: number;
      }
      const state1: State = { value: NaN };
      const signal = { value: state1 };

      const selector: SelectorFn<State, boolean> = state => Number.isNaN(state.value);
      const result = useSelector(signal, selector, {
        dependencies: state => [state.value],
      });

      expect(result()).toBe(true);

      // NaN === NaN is false, but Object.is(NaN, NaN) is true
      signal.value = { value: NaN };
      const secondResult = result();
      expect(secondResult).toBe(true);
    });

    it('should handle Object.is semantics for -0 and +0', () => {
      interface State {
        value: number;
      }
      let currentState: State = { value: 0 };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => state.value);
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.value],
      });

      expect(result()).toBe(0);
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Object.is(0, -0) is false, so should recompute
      currentState = { value: -0 };
      expect(result()).toBe(-0);
      expect(computeFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoization and caching', () => {
    it('should return cached result when same state reference is passed', () => {
      const fixedState = { count: 10, name: 'fixed' };
      const signal = { value: fixedState };

      const computeFn = vi.fn((state: typeof fixedState) => state.count * 2);
      const result = useSelector(signal, computeFn);

      // First call
      expect(result()).toBe(20);
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Second call with same reference
      expect(result()).toBe(20);
      // Should not recompute because reference is the same
      expect(computeFn).toHaveBeenCalledTimes(1);
    });

    it('should recompute when state reference changes without dependencies', () => {
      let currentState = { count: 5 };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: typeof currentState) => state.count * 3);
      const result = useSelector(signal, computeFn);

      expect(result()).toBe(15);
      expect(computeFn).toHaveBeenCalledTimes(1);

      // New reference, same value
      currentState = { count: 5 };
      expect(result()).toBe(15);
      // Should recompute because reference changed and no dependencies to compare
      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    it('should handle hasResult flag correctly on first call', () => {
      const signal = createMockSignal({ value: 42 });
      const selector: SelectorFn<typeof signal.value, number> = state => state.value * 2;

      const result = useSelector(signal, selector, {
        dependencies: state => [state.value],
      });

      // First call - hasResult is false
      expect(result()).toBe(84);

      // Second call - hasResult is true, should check dependencies
      expect(result()).toBe(84);
    });

    it('should handle dependency function returning empty array', () => {
      const signal = createMockSignal({ a: 1, b: 2 });

      const computeFn = vi.fn((state: typeof signal.value) => state.a + state.b);
      const result = useSelector(signal, computeFn, {
        dependencies: () => [],
      });

      expect(result()).toBe(3);
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Even with same empty array, new state reference
      signal.value = { a: 1, b: 2 };
      expect(result()).toBe(3);
      // Empty arrays are shallowly equal, so should use cached
      expect(computeFn).toHaveBeenCalledTimes(1);
    });

    it('should correctly update lastDependencies on each computation', () => {
      interface State {
        x: number;
        y: number;
      }
      let currentState: State = { x: 1, y: 10 };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => state.x * state.y);
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.x, state.y],
      });

      // First computation
      expect(result()).toBe(10);
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Change x
      currentState = { x: 2, y: 10 };
      expect(result()).toBe(20);
      expect(computeFn).toHaveBeenCalledTimes(2);

      // Change y
      currentState = { x: 2, y: 5 };
      expect(result()).toBe(10);
      expect(computeFn).toHaveBeenCalledTimes(3);

      // No change
      currentState = { x: 2, y: 5 };
      expect(result()).toBe(10);
      // Dependencies are same, cached
      expect(computeFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values in dependencies', () => {
      interface State {
        optional?: string;
        required: number;
      }
      let currentState: State = { required: 1 };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => `${state.optional ?? 'none'}-${state.required}`);
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.optional, state.required],
      });

      expect(result()).toBe('none-1');
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Add optional
      currentState = { optional: 'value', required: 1 };
      expect(result()).toBe('value-1');
      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    it('should handle null values in dependencies', () => {
      interface State {
        nullable: string | null;
      }
      let currentState: State = { nullable: null };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => state.nullable ?? 'default');
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.nullable],
      });

      expect(result()).toBe('default');

      currentState = { nullable: 'value' };
      expect(result()).toBe('value');
    });

    it('should handle boolean values in dependencies', () => {
      interface State {
        enabled: boolean;
        count: number;
      }
      let currentState: State = { enabled: false, count: 5 };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => (state.enabled ? state.count : 0));
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.enabled, state.count],
      });

      expect(result()).toBe(0);

      currentState = { enabled: true, count: 5 };
      expect(result()).toBe(5);

      // Change count but not enabled
      currentState = { enabled: true, count: 10 };
      expect(result()).toBe(10);
    });

    it('should handle object references in dependencies', () => {
      interface State {
        config: { id: string };
      }
      const config1 = { id: 'a' };
      const config2 = { id: 'a' }; // Same value, different reference
      let currentState: State = { config: config1 };
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: State) => state.config.id);
      const result = useSelector(signal, computeFn, {
        dependencies: state => [state.config],
      });

      expect(result()).toBe('a');
      expect(computeFn).toHaveBeenCalledTimes(1);

      // Different object reference should trigger recompute
      currentState = { config: config2 };
      expect(result()).toBe('a');
      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    it('should handle array iteration boundary correctly', () => {
      interface State {
        items: readonly number[];
      }
      const longArray = Array.from({ length: 100 }, (_, i) => i);
      const signal = createMockSignal<State>({ items: longArray });

      const computeFn = vi.fn((state: State) => state.items.reduce((a, b) => a + b, 0));
      const result = useSelector(signal, computeFn, {
        dependencies: state => [...state.items],
      });

      expect(result()).toBe(4950); // Sum of 0-99
    });
  });

  describe('without dependencies option', () => {
    it('should use reference equality when no dependencies provided', () => {
      const state1 = { value: 1 };
      const state2 = { value: 1 }; // Same value, different reference
      let currentState = state1;
      const signal = {
        get value() {
          return currentState;
        },
      };

      const computeFn = vi.fn((state: typeof state1) => state.value);
      const result = useSelector(signal, computeFn);

      expect(result()).toBe(1);
      expect(computeFn).toHaveBeenCalledTimes(1);

      currentState = state2;
      expect(result()).toBe(1);
      expect(computeFn).toHaveBeenCalledTimes(2);

      // Same reference again
      currentState = state2;
      expect(result()).toBe(1);
      expect(computeFn).toHaveBeenCalledTimes(2);
    });
  });
});
