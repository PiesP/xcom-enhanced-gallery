/**
 * @fileoverview 외부 라이브러리 Mock 구현
 * @description TanStack Query, Preact 등 외부 라이브러리 Mock
 */

import { vi } from 'vitest';

// ================================
// TanStack Query Mock
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
}

class MockQueryClient {
  private queryCache = new MockQueryCache();
  private mutationCache = new MockMutationCache();
  private queries = new Map();

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
// Preact Mock 개선
// ================================

export const mockPreact = {
  createElement: vi.fn((type, props, ...children) => ({
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  })),
  render: vi.fn(),
  Component: class MockComponent {
    constructor(_props: any) {
      _props; // Mock component doesn't use props
    }
    render() {
      return null;
    }
  },
  Fragment: 'Fragment',
  memo: vi.fn(component => component),
  forwardRef: vi.fn(component => component),
};

export const mockPreactHooks = {
  useState: vi.fn(initial => [initial, vi.fn()]),
  useEffect: vi.fn((effect, deps) => {
    void deps; // Mock doesn't track dependencies
    if (typeof effect === 'function') {
      const cleanup = effect();
      return cleanup;
    }
  }),
  useRef: vi.fn(initial => ({ current: initial })),
  useCallback: vi.fn((fn, deps) => {
    void deps; // Mock doesn't track dependencies
    return fn;
  }),
  useMemo: vi.fn((fn, deps) => {
    void deps; // Mock doesn't track dependencies
    return fn();
  }),
  useContext: vi.fn(),
  useReducer: vi.fn(),
  useLayoutEffect: vi.fn(),
  useImperativeHandle: vi.fn(),
};

export const mockPreactSignals = {
  signal: vi.fn(value => ({
    value,
    valueOf: () => value,
    toString: () => String(value),
    peek: () => value,
    subscribe: vi.fn(),
  })),
  computed: vi.fn(compute => ({
    value: compute(),
    valueOf: () => compute(),
    toString: () => String(compute()),
    peek: () => compute(),
    subscribe: vi.fn(),
  })),
  effect: vi.fn(fn => {
    fn();
    return vi.fn(); // cleanup function
  }),
  batch: vi.fn(fn => fn()),
};

// ================================
// Motion Mock
// ================================

export const mockMotion = {
  animate: vi.fn(() => Promise.resolve()),
  timeline: vi.fn(() => Promise.resolve()),
  scroll: vi.fn(() => vi.fn()),
  inView: vi.fn(() => vi.fn()),
};

// ================================
// Mock 설정 헬퍼
// ================================

export function setupVendorMocks() {
  // getTanStackQuery Mock
  vi.doMock('@shared/external/vendors', () => ({
    getTanStackQuery: vi.fn(() => mockTanStackQuery),
    getPreact: vi.fn(() => mockPreact),
    getPreactHooks: vi.fn(() => mockPreactHooks),
    getPreactSignals: vi.fn(() => mockPreactSignals),
    getMotion: vi.fn(() => mockMotion),
    getMotionOne: vi.fn(() => mockMotion), // getMotionOne 추가
    getFflate: vi.fn(() => ({ compress: vi.fn(), decompress: vi.fn() })),
    getPreactCompat: vi.fn(() => ({ memo: mockPreact.memo, forwardRef: mockPreact.forwardRef })),
    initializeVendors: vi.fn(() => Promise.resolve()),
  }));

  // 전역 환경에 Mock 설정
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__VENDOR_MOCKS__ = {
      tanStackQuery: mockTanStackQuery,
      preact: mockPreact,
      preactHooks: mockPreactHooks,
      preactSignals: mockPreactSignals,
      motion: mockMotion,
    };
  }
}

export function resetVendorMocks() {
  vi.clearAllMocks();

  // Reset mock states
  mockPreactHooks.useState.mockImplementation(initial => [initial, vi.fn()]);
  mockPreactHooks.useEffect.mockImplementation((effect, deps) => {
    void deps; // Mock doesn't track dependencies
    if (typeof effect === 'function') {
      const cleanup = effect();
      return cleanup;
    }
  });
  mockPreactHooks.useRef.mockImplementation(initial => ({ current: initial }));
}
