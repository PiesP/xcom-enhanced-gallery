/**
 * 브라우저 환경 모의 구현
 * 브라우저 확장 API 및 웹 환경을 모의하여 테스트 환경에서 사용
 */

import { vi } from 'vitest';

// ================================
// 브라우저 환경 Mock
// ================================

/**
 * 브라우저 확장 관련 API 모의
 */
export const mockBrowserExtensionAPI = {
  // Chrome Extension API
  chrome: {
    runtime: {
      sendMessage: vi.fn((message, callback) => {
        if (callback) callback({ success: true });
      }),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      getURL: vi.fn(path => `chrome-extension://test/${path}`),
    },
    storage: {
      local: {
        get: vi.fn((keys, callback) => {
          callback({ [keys]: 'mock-value' });
        }),
        set: vi.fn((items, callback) => {
          if (callback) callback();
        }),
      },
    },
  },

  // URL 관련 API
  URL: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  },

  // Fetch API
  fetch: vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('mock response'),
      blob: () => Promise.resolve({ size: 0, type: 'application/octet-stream' }),
    })
  ),

  // 클립보드 API
  navigator: {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('mock clipboard content')),
    },
    userAgent: 'Mozilla/5.0 (Test Environment)',
  },
};

/**
 * 로컬 스토리지 모의
 */
export const mockLocalStorage = {
  store: new Map(),

  getItem: vi.fn(key => mockLocalStorage.store.get(key) || null),
  setItem: vi.fn((key, value) => mockLocalStorage.store.set(key, value)),
  removeItem: vi.fn(key => mockLocalStorage.store.delete(key)),
  clear: vi.fn(() => mockLocalStorage.store.clear()),
  key: vi.fn(index => Array.from(mockLocalStorage.store.keys())[index] || null),
  get length() {
    return mockLocalStorage.store.size;
  },
};

/**
 * 세션 스토리지 모의
 */
export const mockSessionStorage = {
  store: new Map(),

  getItem: vi.fn(key => mockSessionStorage.store.get(key) || null),
  setItem: vi.fn((key, value) => mockSessionStorage.store.set(key, value)),
  removeItem: vi.fn(key => mockSessionStorage.store.delete(key)),
  clear: vi.fn(() => mockSessionStorage.store.clear()),
  key: vi.fn(index => Array.from(mockSessionStorage.store.keys())[index] || null),
  get length() {
    return mockSessionStorage.store.size;
  },
};

/**
 * Location 객체 모의
 */
export const mockLocation = {
  href: 'https://x.com/test',
  protocol: 'https:',
  host: 'x.com',
  hostname: 'x.com',
  port: '',
  pathname: '/test',
  search: '',
  hash: '',
  origin: 'https://x.com',

  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

/**
 * History 객체 모의
 */
export const mockHistory = {
  length: 1,
  scrollRestoration: 'auto',
  state: null,

  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
  pushState: vi.fn(),
  replaceState: vi.fn(),
};

// ================================
// 미디어 관련 Mock
// ================================

/**
 * 이미지 로딩 모의
 */
export class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.width = 800;
    this.height = 600;

    // 이미지 로딩 시뮬레이션
    globalThis.setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
}

/**
 * Blob 생성 모의
 */
export const mockBlob = vi.fn((data, options) => {
  return {
    size: data ? data.length : 0,
    type: options?.type || 'application/octet-stream',
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(data?.join?.('') || ''),
    stream: () => ({ getReader: () => ({}) }),
    slice: vi.fn(),
  };
});

// ================================
// 타이머 관련 Mock
// ================================

export const mockTimers = {
  setTimeout: vi.fn((callback, delay) => {
    return globalThis.setTimeout(callback, delay);
  }),
  clearTimeout: vi.fn(id => {
    globalThis.clearTimeout(id);
  }),
  setInterval: vi.fn((callback, interval) => {
    return globalThis.setInterval(callback, interval);
  }),
  clearInterval: vi.fn(id => {
    globalThis.clearInterval(id);
  }),
};

// ================================
// 전역 환경 설정
// ================================

/**
 * 브라우저 환경 모의 설정
 */
export function setupBrowserEnvironment() {
  // Chrome Extension API
  if (typeof globalThis !== 'undefined') {
    globalThis.chrome = mockBrowserExtensionAPI.chrome;
  }

  // Storage API
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });

  // Location & History
  Object.defineProperty(globalThis, 'location', {
    value: mockLocation,
    writable: true,
  });

  Object.defineProperty(globalThis, 'history', {
    value: mockHistory,
    writable: true,
  });

  // Media APIs
  globalThis.Image = MockImage;
  globalThis.Blob = mockBlob;

  // Network APIs
  globalThis.fetch = mockBrowserExtensionAPI.fetch;

  // Navigator
  Object.defineProperty(globalThis, 'navigator', {
    value: mockBrowserExtensionAPI.navigator,
    writable: true,
  });

  // URL API
  globalThis.URL = {
    ...globalThis.URL,
    createObjectURL: mockBrowserExtensionAPI.URL.createObjectURL,
    revokeObjectURL: mockBrowserExtensionAPI.URL.revokeObjectURL,
  };
}

/**
 * 모든 브라우저 모의 상태 초기화
 */
export function clearBrowserEnvironment() {
  // Storage 초기화
  mockLocalStorage.store.clear();
  mockSessionStorage.store.clear();

  // Mock 함수들 초기화
  Object.values(mockBrowserExtensionAPI.chrome.runtime).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });

  mockBrowserExtensionAPI.fetch.mockClear();

  // Location 초기화
  mockLocation.href = 'https://x.com/test';
  mockLocation.pathname = '/test';
  mockLocation.search = '';
  mockLocation.hash = '';
}

/**
 * 특정 URL로 위치 설정
 */
export function setMockLocation(url) {
  try {
    const urlObj = globalThis.URL
      ? new globalThis.URL(url)
      : {
          protocol: 'https:',
          host: 'x.com',
          hostname: 'x.com',
          port: '',
          pathname: '/test',
          search: '',
          hash: '',
          origin: 'https://x.com',
        };

    mockLocation.href = url;
    mockLocation.protocol = urlObj.protocol;
    mockLocation.host = urlObj.host;
    mockLocation.hostname = urlObj.hostname;
    mockLocation.port = urlObj.port;
    mockLocation.pathname = urlObj.pathname;
    mockLocation.search = urlObj.search;
    mockLocation.hash = urlObj.hash;
    mockLocation.origin = urlObj.origin;
  } catch {
    // URL 파싱 실패 시 기본값 사용
    mockLocation.href = url;
  }
}

/**
 * 네트워크 요청 응답 설정
 */
export function setupMockFetchResponse(response) {
  mockBrowserExtensionAPI.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve({ size: 0, type: 'application/octet-stream' }),
    ...response,
  });
}
