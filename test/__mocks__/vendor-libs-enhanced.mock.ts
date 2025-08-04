/**
 * Enhanced Vendor Libraries Mock System
 * 완전한 외부 라이브러리 Mock 및 Preact 환경 시뮬레이션
 */

import { vi } from 'vitest';
import {
  ultimateContext,
  ensurePreactHookContext,
  resetPreactHookState,
} from '../utils/mocks/ultimate-preact-environment.js';

// ================================
// TanStack Query Mock - Enhanced
// ================================

class MockQueryCache {
  private queries = new Map();

  clear() {
    this.queries.clear();
  }

  find(_predicate?: any) {
    return null;
  }

  getAll() {
    return Array.from(this.queries.values());
  }

  get(key: string) {
    return this.queries.get(key);
  }

  set(key: string, value: any) {
    this.queries.set(key, value);
  }

  subscribe() {
    return () => {}; // unsubscribe function
  }
}

class MockMutationCache {
  private mutations = new Map();

  clear() {
    this.mutations.clear();
  }

  find(_predicate?: any) {
    return null;
  }

  getAll() {
    return Array.from(this.mutations.values());
  }

  build() {
    return {};
  }

  add(mutation: any) {
    this.mutations.set(mutation.id || Math.random(), mutation);
  }

  remove(mutation: any) {
    this.mutations.delete(mutation.id);
  }
}

class MockQueryClient {
  private queryCache = new MockQueryCache();
  private mutationCache = new MockMutationCache();
  private queries = new Map();
  private defaultOptions = {};

  getQueryData(queryKey: unknown[]) {
    return this.queries.get(JSON.stringify(queryKey)) || null;
  }

  setQueryData(queryKey: unknown[], data: unknown) {
    this.queries.set(JSON.stringify(queryKey), data);
  }

  invalidateQueries() {
    return Promise.resolve();
  }

  prefetchQuery() {
    return Promise.resolve();
  }

  fetchQuery() {
    return Promise.resolve(null);
  }

  getQueryCache() {
    return this.queryCache;
  }

  getMutationCache() {
    return this.mutationCache;
  }

  setDefaultOptions(options: any) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  getDefaultOptions() {
    return this.defaultOptions;
  }

  mount() {
    // Mount implementation
  }

  unmount() {
    // Unmount implementation
  }
}

export const mockTanStackQuery = {
  QueryClient: MockQueryClient,
  QueryCache: MockQueryCache,
  MutationCache: MockMutationCache,
  queryKey: (key: unknown[]) => key,
  hashQueryKey: (key: unknown[]) => JSON.stringify(key),
};

// QueryCache를 직접 export
export { MockQueryCache as QueryCache };
export { MockQueryClient as QueryClient };
export { MockMutationCache as MutationCache };

// ================================
// 🎯 @testing-library/preact Mock (Ultimate Solution)
// ================================

export function mockTestingLibraryPreact() {
  return {
    render: vi.fn((element, options) => {
      // DOM 컨테이너 생성
      const container = document.createElement('div');
      if (options?.container) {
        options.container.appendChild(container);
      } else {
        document.body.appendChild(container);
      }

      return {
        container,
        baseElement: document.body,
        debug: () => console.log(container.innerHTML),
        rerender: vi.fn(),
        unmount: vi.fn(() => {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }),
      };
    }),

    renderHook: vi.fn((hook, _options) => {
      // Ultimate Hook 컨텍스트 설정
      ensurePreactHookContext();

      let currentResult: any;
      let hasError = false;
      let error: any;

      const runHook = () => {
        try {
          hasError = false;
          error = undefined;
          // Mock 상태에서 Hook 실행
          currentResult = hook();
        } catch (e) {
          hasError = true;
          error = e;
          currentResult = undefined;
        }
      };

      // 초기 실행
      runHook();

      return {
        result: {
          get current() {
            if (hasError) throw error;
            return currentResult;
          },
        },
        rerender: vi.fn(newHook => {
          if (newHook) {
            hook = newHook;
          }
          runHook();
        }),
        unmount: vi.fn(() => {
          resetPreactHookState();
        }),
      };
    }),

    cleanup: vi.fn(() => {
      // DOM 정리
      document.body.innerHTML = '';
      resetPreactHookState();
    }),

    act: vi.fn(async callback => {
      ensurePreactHookContext();
      if (callback) {
        return await callback();
      }
    }),

    screen: {
      getByText: vi.fn(text => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent?.includes(text)) || null;
      }),
      getByTestId: vi.fn(testId => {
        return document.querySelector(`[data-testid="${testId}"]`);
      }),
      queryByText: vi.fn(text => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent?.includes(text)) || null;
      }),
      queryByTestId: vi.fn(testId => {
        return document.querySelector(`[data-testid="${testId}"]`);
      }),
    },

    fireEvent: {
      click: vi.fn(element => {
        if (element && typeof element.click === 'function') {
          element.click();
        }
      }),
      mouseEnter: vi.fn(element => {
        if (element) {
          const event = new MouseEvent('mouseenter', { bubbles: true });
          element.dispatchEvent(event);
        }
      }),
      mouseLeave: vi.fn(element => {
        if (element) {
          const event = new MouseEvent('mouseleave', { bubbles: true });
          element.dispatchEvent(event);
        }
      }),
    },
  };
}

// Enhanced Preact Core Mock
export const mockPreact = {
  render: vi.fn(),
  hydrate: vi.fn(),
  createElement: vi.fn((type, props, ...children) => ({
    type,
    props: { ...props, children },
    key: props?.key,
    ref: props?.ref,
    __k: null, // Mock internal state
    __: null, // Mock parent
  })),
  Component: vi.fn(),
  Fragment: vi.fn(),
  cloneElement: vi.fn(),
  createContext: vi.fn(() => ({ Provider: vi.fn(), Consumer: vi.fn() })),
  createRef: vi.fn(() => ({ current: null })),
  isValidElement: vi.fn(() => true),
  options: {
    debounceRendering: vi.fn(),
    diff: vi.fn(),
    commit: vi.fn(),
    unmount: vi.fn(),
    requestAnimationFrame: vi.fn(),
    __: vi.fn(),
  },
};

// Enhanced Preact Hooks
export const mockPreactHooks = {
  useState: vi.fn(initialValue => {
    const value = typeof initialValue === 'function' ? initialValue() : initialValue;
    return [value, vi.fn()];
  }),
  useEffect: vi.fn((effect, _deps) => {
    const cleanup = effect();
    return cleanup || (() => {});
  }),
  useRef: vi.fn(initialValue => ({ current: initialValue })),
  useContext: vi.fn(() => ({})),
  useReducer: vi.fn((reducer, initialState) => [initialState, vi.fn()]),
  useCallback: vi.fn(callback => callback),
  useMemo: vi.fn(factory => factory()),
  useLayoutEffect: vi.fn(effect => {
    const cleanup = effect();
    return cleanup || (() => {});
  }),
  useImperativeHandle: vi.fn(),
  useDebugValue: vi.fn(),
  useErrorBoundary: vi.fn(() => [null, vi.fn()]),
  useId: vi.fn(() => 'mock-id'),
};

// ================================
// Preact Signals Mock 개선
// ================================

export const mockPreactSignals = {
  signal: vi.fn(value => ({
    value,
    valueOf: () => value,
    peek: () => value,
    subscribe: vi.fn(() => vi.fn()),
    toString: () => String(value),
  })),
  computed: vi.fn(compute => ({
    value: compute(),
    valueOf: () => compute(),
    peek: () => compute(),
    subscribe: vi.fn(() => vi.fn()),
  })),
  effect: vi.fn(fn => {
    fn();
    return () => {};
  }),
  batch: vi.fn(fn => fn()),
};

// ================================
// Motion One Mock 개선
// ================================

export const mockMotionOne = {
  animate: vi.fn().mockImplementation(async (element, keyframes, options) => {
    return {
      finished: Promise.resolve(),
      stop: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      reverse: vi.fn(),
      duration: options?.duration || 1000,
    };
  }),
  scroll: vi.fn().mockImplementation(_onScroll => {
    return () => {}; // cleanup function
  }),
  timeline: vi.fn().mockImplementation(async _keyframes => {
    return {
      finished: Promise.resolve(),
      stop: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
    };
  }),
  stagger: vi.fn().mockImplementation(duration => index => index * duration),
  inView: vi.fn().mockImplementation((element, onInView) => {
    // 즉시 실행
    onInView({ target: element, isIntersecting: true });
    return () => {}; // cleanup
  }),
  transform: vi.fn().mockImplementation((value, from, to) => {
    const progress = Math.max(0, Math.min(1, (value - from[0]) / (from[1] - from[0])));
    return to[0] + progress * (to[1] - to[0]);
  }),
};

// ================================
// fflate Mock 개선
// ================================

export const mockFflate = {
  zip: vi.fn(() => new Uint8Array()),
  unzip: vi.fn(() => ({})),
  strToU8: vi.fn(str => new TextEncoder().encode(str)),
  strFromU8: vi.fn(data => new TextDecoder().decode(data)),
  gzip: vi.fn(() => new Uint8Array()),
  gunzip: vi.fn(() => new Uint8Array()),
  deflate: vi.fn(() => new Uint8Array()),
  inflate: vi.fn(() => new Uint8Array()),
};

// ================================
// Setup and Reset Functions
// ================================

export function setupVendorMocks() {
  // TanStack Query 전역 설정
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).QueryClient = MockQueryClient;
    (globalThis as any).QueryCache = MockQueryCache;
  }

  // Preact 전역 설정
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).preact = mockPreact;
  }

  console.log('[Vendor Mocks] All vendor libraries mocked successfully');
}

export function resetVendorMocks() {
  // 모든 mock 함수 초기화
  vi.clearAllMocks();

  // TanStack Query 상태 초기화
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).QueryClient;
    delete (globalThis as any).QueryCache;
  }

  console.log('[Vendor Mocks] All vendor mocks reset');
}
