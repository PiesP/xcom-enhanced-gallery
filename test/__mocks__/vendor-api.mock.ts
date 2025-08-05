/**
 * Vendor API Mock for Testing
 *
 * @description
 * 테스트 환경에서 vendor API를 Mock으로 제공하여
 * getPreactHooks() 등이 정상 작동하도록 합니다.
 */

import { vi } from 'vitest';

// Mock Preact Hooks API
const mockPreactHooks = {
  useState: vi.fn(),
  useEffect: vi.fn(),
  useContext: vi.fn(),
  useReducer: vi.fn(),
  useCallback: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
  useImperativeHandle: vi.fn(),
  useLayoutEffect: vi.fn(),
  useDebugValue: vi.fn(),
  useErrorBoundary: vi.fn(),
  useId: vi.fn(),
};

// Mock Preact Signals
const mockPreactSignals = {
  signal: vi.fn(initialValue => ({
    value: initialValue,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    peek: vi.fn(() => initialValue),
  })),
  computed: vi.fn(),
  effect: vi.fn(),
  batch: vi.fn(),
};

// Mock 초기화 상태
let mockIsInitialized = false;

// Mock Vendor API 함수들
export const mockVendorAPI = {
  async initializeVendors(): Promise<void> {
    mockIsInitialized = true;
    console.log('[Mock] Vendor API 초기화 완료');
  },

  getPreactHooks() {
    if (!mockIsInitialized) {
      throw new Error(
        'Preact Hooks가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.'
      );
    }
    return mockPreactHooks;
  },

  getPreact() {
    if (!mockIsInitialized) {
      throw new Error('Preact가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
    }
    return mockPreact;
  },

  getPreactSignals() {
    if (!mockIsInitialized) {
      throw new Error(
        'Preact Signals가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.'
      );
    }
    return mockPreactSignals;
  },

  // 초기화 상태 확인용
  isInitialized: () => mockIsInitialized,

  // 테스트 정리용
  reset: () => {
    mockIsInitialized = false;
  },
};

// 실제 vendor-api 모듈을 Mock으로 대체
vi.mock('../src/shared/external/vendors/vendor-api', () => mockVendorAPI);

export default mockVendorAPI;
