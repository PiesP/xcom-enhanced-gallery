/**
 * @fileoverview Vendor Mock for Testing - Optimized
 * @version 1.1.0 - 성능 최적화된 테스트용 vendor 모듈 모킹
 */

import { vi } from 'vitest';

// Mock Preact API - 최소한으로 단순화
export const mockPreactAPI = {
  h: vi.fn((type, props, ...children) => ({
    type,
    props: props || {},
    children: children.flat(),
  })),
  render: vi.fn(),
  Component: vi.fn(),
  Fragment: 'Fragment',
  createContext: vi.fn(() => ({ Provider: vi.fn(), Consumer: vi.fn() })),
  cloneElement: vi.fn(),
  createRef: vi.fn(() => ({ current: null })),
  isValidElement: vi.fn(() => true),
  options: {},
  createElement: vi.fn(),
};

// Mock Preact Hooks API - side effect 제거
export const mockPreactHooksAPI = {
  useState: vi.fn(initial => [initial, vi.fn()]),
  useEffect: vi.fn(() => undefined), // side effect 제거
  useMemo: vi.fn(factory => factory()),
  useCallback: vi.fn(callback => callback),
  useRef: vi.fn(initial => ({ current: initial })),
  useContext: vi.fn(() => ({})),
  useReducer: vi.fn((_, initialState) => [initialState, vi.fn()]),
  useLayoutEffect: vi.fn(() => undefined), // side effect 제거
};

// Mock Preact Signals API - 단순화
export const mockPreactSignalsAPI = {
  signal: vi.fn(value => ({ value, peek: () => value })),
  computed: vi.fn(fn => ({ value: fn() })),
  effect: vi.fn(() => undefined),
  batch: vi.fn(fn => fn()),
};

// Mock Preact Compat API - 단순화
export const mockPreactCompatAPI = {
  memo: vi.fn(Component => Component),
  forwardRef: vi.fn(Component => Component),
};

// Mock Fflate API - 빈 함수로 단순화
export const mockFflateAPI = {
  zip: vi.fn(),
  unzip: vi.fn(),
  strToU8: vi.fn(() => new Uint8Array()),
  strFromU8: vi.fn(() => ''),
  zipSync: vi.fn(() => new Uint8Array()),
  unzipSync: vi.fn(() => ({})),
  deflate: vi.fn(() => new Uint8Array()),
  inflate: vi.fn(() => new Uint8Array()),
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
  vi.doMock('@shared/external/vendors', () => ({
    getFflate: vi.fn(() => mockFflateAPI),
    getPreact: vi.fn(() => mockPreactAPI),
    getPreactHooks: vi.fn(() => mockPreactHooksAPI),
    getPreactSignals: vi.fn(() => mockPreactSignalsAPI),
    getPreactCompat: vi.fn(() => mockPreactCompatAPI),
    getNativeDownload: vi.fn(() => mockNativeDownloadAPI),
    initializeVendors: vi.fn(() => Promise.resolve()),
    cleanupVendors: vi.fn(() => Promise.resolve()),
    getVendorVersions: vi.fn(() => ({})),
    isVendorsInitialized: vi.fn(() => true),
    getVendorInitializationReport: vi.fn(() => ({})),
    getVendorStatuses: vi.fn(() => ({})),
    isVendorInitialized: vi.fn(() => true),
  }));

  vi.doMock('@shared/external/vendors/vendor-api-safe', () => ({
    getFflateSafe: vi.fn(() => mockFflateAPI),
    getPreactSafe: vi.fn(() => mockPreactAPI),
    getPreactHooksSafe: vi.fn(() => mockPreactHooksAPI),
    getPreactSignalsSafe: vi.fn(() => mockPreactSignalsAPI),
    getPreactCompatSafe: vi.fn(() => mockPreactCompatAPI),
    getNativeDownloadSafe: vi.fn(() => mockNativeDownloadAPI),
  }));
}

/**
 * vendor-api mock 리셋 - 성능 최적화
 */
export function resetVendorMocks() {
  vi.clearAllMocks();
}
