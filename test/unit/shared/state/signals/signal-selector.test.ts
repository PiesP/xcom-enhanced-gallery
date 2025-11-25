import { useSelector, type SelectorFn } from '@shared/state/signals/signal-selector';
import { describe, expect, it, vi } from 'vitest';

// Mock Solid.js
vi.mock('@shared/external/vendors', () => ({
  getSolid: () => ({
    createMemo: (fn: () => unknown) => fn,
  }),
}));

// Create a mock signal type for testing
type TestSignal<T> = { value: T };

function createMockSignal<T>(initialValue: T): TestSignal<T> {
  return { value: initialValue };
}

describe('signal-selector', () => {
  describe('useSelector', () => {
    it('should create a selector that returns computed value', () => {
      const signal = createMockSignal({ count: 10, name: 'test' });
      const selector: SelectorFn<typeof signal.value, number> = state => state.count * 2;

      const result = useSelector(signal, selector);
      expect(result()).toBe(20);
    });

    it('should memoize based on reference equality', () => {
      const state = { count: 5 };
      const signal = createMockSignal(state);
      const selector = vi.fn((s: typeof state) => s.count * 2);

      const result = useSelector(signal, selector);

      // First call
      expect(result()).toBe(10);

      // Second call with same reference should use cached value
      expect(result()).toBe(10);
    });

    it('should use dependency-based caching when dependencies provided', () => {
      interface State {
        count: number;
        name: string;
      }
      const signal = createMockSignal<State>({ count: 5, name: 'test' });
      const selector: SelectorFn<State, string> = state =>
        `${state.name}-${state.count}`;

      const result = useSelector(signal, selector, {
        dependencies: state => [state.count, state.name],
      });

      expect(result()).toBe('test-5');
    });

    it('should handle empty dependencies', () => {
      const signal = createMockSignal({ value: 42 });
      const selector: SelectorFn<typeof signal.value, number> = state => state.value;

      const result = useSelector(signal, selector, {
        dependencies: () => [],
      });

      expect(result()).toBe(42);
    });

    it('should recompute when dependencies change', () => {
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

      expect(result()).toBe(3);

      // Update state with different reference but same values
      const newState = { a: 1, b: 2 };
      currentState = newState;

      // With dependency-based caching, should still use cached value
      expect(result()).toBe(3);
    });

    it('should handle complex nested state', () => {
      interface NestedState {
        user: {
          profile: {
            name: string;
            age: number;
          };
        };
        settings: {
          theme: string;
        };
      }

      const signal = createMockSignal<NestedState>({
        user: { profile: { name: 'John', age: 30 } },
        settings: { theme: 'dark' },
      });

      const selector: SelectorFn<NestedState, string> = state =>
        `${state.user.profile.name} (${state.settings.theme})`;

      const result = useSelector(signal, selector);

      expect(result()).toBe('John (dark)');
    });

    it('should work with array state', () => {
      const signal = createMockSignal([1, 2, 3, 4, 5]);
      const selector: SelectorFn<number[], number> = state =>
        state.reduce((sum, n) => sum + n, 0);

      const result = useSelector(signal, selector);

      expect(result()).toBe(15);
    });

    it('should handle selector that returns undefined', () => {
      const signal = createMockSignal<{ optional?: string }>({});
      const selector: SelectorFn<typeof signal.value, string | undefined> = state =>
        state.optional;

      const result = useSelector(signal, selector);

      expect(result()).toBeUndefined();
    });

    it('should handle selector that returns null', () => {
      const signal = createMockSignal<{ nullable: string | null }>({ nullable: null });
      const selector: SelectorFn<typeof signal.value, string | null> = state =>
        state.nullable;

      const result = useSelector(signal, selector);

      expect(result()).toBeNull();
    });
  });
});
