/**
 * @fileoverview Vendor Mock for Testing
 * @version 1.0.0 - 테스트용 vendor 모듈 모킹
 */

import { vi } from 'vitest';

// Mock Preact API
export const mockPreactAPI = {
  h: vi.fn((type, props, ...children) => ({
    type,
    props: props || {},
    children: children.flat(),
    key: props?.key || null,
    ref: props?.ref || null,
  })),

  render: vi.fn(),
  Component: vi.fn(),
  Fragment: 'Fragment',
  createContext: vi.fn(),
  cloneElement: vi.fn(),
  createRef: vi.fn(() => ({ current: null })),
  isValidElement: vi.fn(() => true),
  options: {},
  createElement: vi.fn(),
};

// Mock Preact Hooks API
export const mockPreactHooksAPI = {
  useState: vi.fn(initial => [initial, vi.fn()]),
  useEffect: vi.fn((effect, _deps) => {
    void _deps;
    if (typeof effect === 'function') {
      // 즉시 실행하여 side effect 시뮬레이션
      const cleanup = effect();
      return cleanup;
    }
  }),
  useMemo: vi.fn((factory, _deps) => {
    void _deps;
    if (typeof factory === 'function') {
      return factory();
    }
    return factory;
  }),
  useCallback: vi.fn((callback, _deps) => {
    void _deps;
    return callback;
  }),
  useRef: vi.fn(initial => ({ current: initial })),
  useContext: vi.fn(),
  useReducer: vi.fn((reducer, initialState) => [initialState, vi.fn()]),
  useLayoutEffect: vi.fn(),
};

// Mock Preact Signals API
export const mockPreactSignalsAPI = {
  signal: vi.fn(value => ({
    value,
    peek: () => value,
    subscribe: vi.fn(),
    valueOf: () => value,
    toString: () => String(value),
  })),
  computed: vi.fn(),
  effect: vi.fn(),
  batch: vi.fn(fn => fn()),
};

// Mock Preact Compat API
export const mockPreactCompatAPI = {
  memo: vi.fn((Component, _compare) => {
    void _compare;
    const MemoComponent = props => Component(props);
    MemoComponent.displayName = `memo(${Component.displayName || Component.name || 'Component'})`;
    return MemoComponent;
  }),
  forwardRef: vi.fn(Component => {
    const ForwardedComponent = props => Component(props);
    ForwardedComponent.displayName = `forwardRef(${Component.displayName || Component.name || 'Component'})`;
    return ForwardedComponent;
  }),
};

// Mock Native Download API
export const mockNativeDownloadAPI = {
  downloadBlob: vi.fn(),
  createDownloadUrl: vi.fn(() => 'mock-url'),
  revokeDownloadUrl: vi.fn(),
};

/**
 * vendor-api mock 설정
 */
export function setupVendorMocks() {
  const legacyPreactExports = {
    getPreact: vi.fn(() => mockPreactAPI),
    getPreactHooks: vi.fn(() => mockPreactHooksAPI),
    getPreactSignals: vi.fn(() => mockPreactSignalsAPI),
    getPreactCompat: vi.fn(() => mockPreactCompatAPI),
    h: mockPreactAPI.h,
    render: mockPreactAPI.render,
    Component: mockPreactAPI.Component,
    Fragment: mockPreactAPI.Fragment,
  };

  vi.doMock('@shared/external/vendors', () => ({
    __esModule: true,
    legacyPreact: legacyPreactExports,
    getNativeDownload: vi.fn(() => mockNativeDownloadAPI),
    initializeVendors: vi.fn(() => Promise.resolve()),
    cleanupVendors: vi.fn(() => Promise.resolve()),
    getVendorVersions: vi.fn(() => ({})),
    isVendorsInitialized: vi.fn(() => true),
    getVendorInitializationReport: vi.fn(() => ({})),
    getVendorStatuses: vi.fn(() => ({})),
    isVendorInitialized: vi.fn(() => true),
  }));

  vi.doMock('@test-utils/legacy-preact', () => ({
    __esModule: true,
    ...legacyPreactExports,
  }));
}

/**
 * vendor-api mock 리셋
 */
export function resetVendorMocks() {
  vi.clearAllMocks();

  // Mock 함수들을 다시 설정
  Object.values(mockPreactAPI).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear();
    }
  });

  Object.values(mockPreactHooksAPI).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear();
    }
  });

  Object.values(mockPreactSignalsAPI).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear();
    }
  });

  Object.values(mockPreactCompatAPI).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear();
    }
  });

  Object.values(mockNativeDownloadAPI).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
}
