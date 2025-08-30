/**
 * @fileoverview 유저스크립트 API 모의(Mock) 구현
 * @description GM_* 함수들을 모의하여 실제 브라우저 확장 API 호출 방지
 */

import { vi } from 'vitest';

// ================================
// 유저스크립트 API Mock Storage
// ================================

const mockStorage = new Map();

// ================================
// GM_* API Mocks
// ================================

export const mockUserscriptAPI = {
  GM_getValue: vi.fn((key, defaultValue) => {
    return mockStorage.get(key) ?? defaultValue;
  }),

  GM_setValue: vi.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),

  GM_deleteValue: vi.fn(key => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),

  GM_listValues: vi.fn(() => {
    return Array.from(mockStorage.keys());
  }),

  GM_xmlhttpRequest: vi.fn(details => {
    // 기본적으로 성공 응답을 반환
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      responseText: JSON.stringify({ success: true }),
      response: JSON.stringify({ success: true }),
      responseHeaders: 'content-type: application/json',
      readyState: 4,
    };

    globalThis.setTimeout(() => {
      if (details.onload) {
        details.onload(mockResponse);
      }
    }, 0);

    return {
      abort: vi.fn(),
    };
  }),

  GM_download: vi.fn((url, filename) => {
    return Promise.resolve({
      url,
      filename,
      error: null,
    });
  }),

  GM_notification: vi.fn(options => {
    globalThis.console.log('Mock notification:', options);
  }),

  GM_openInTab: vi.fn(url => {
    globalThis.console.log('Mock open in tab:', url);
    return { close: vi.fn() };
  }),

  GM_registerMenuCommand: vi.fn(caption => {
    return caption;
  }),

  GM_unregisterMenuCommand: vi.fn(() => {
    // Mock implementation
  }),

  GM_setClipboard: vi.fn(data => {
    globalThis.console.log('Mock clipboard:', data);
  }),

  GM_info: {
    script: {
      name: 'X.com Enhanced Gallery (Test)',
      version: '1.0.0',
    },
    scriptHandler: 'Tampermonkey',
    version: '5.0.0',
  },
};

// ================================
// Global Mock Setup & API Connection
// ================================

/**
 * Mock API 상태 추적
 */
export const mockApiState = {
  downloadQueue: [],
  notifications: [],
  isAutoDownloadEnabled: false,
  lastDownloadCall: null,
};

/**
 * Mock API에 실제 동작 연결
 */
export function connectMockAPI() {
  // GM_download 향상된 Mock - 상태 추적 포함
  mockUserscriptAPI.GM_download = vi.fn((url, filename) => {
    mockApiState.downloadQueue.push({ url, filename });
    mockApiState.lastDownloadCall = { url, filename, timestamp: Date.now() };

    globalThis.console.log(`[Mock API] Download triggered: ${filename} from ${url}`);

    return Promise.resolve({
      url,
      filename,
      error: null,
    });
  });

  // GM_notification 향상된 Mock - 상태 추적 포함
  mockUserscriptAPI.GM_notification = vi.fn(options => {
    mockApiState.notifications.push(options);
    globalThis.console.log('[Mock API] Notification triggered:', options);
  });

  return mockApiState;
}

/**
 * Mock API 상태 초기화
 */
export function resetMockApiState() {
  mockApiState.downloadQueue.length = 0;
  mockApiState.notifications.length = 0;
  mockApiState.isAutoDownloadEnabled = false;
  mockApiState.lastDownloadCall = null;

  // Mock 함수 호출 카운터 초기화
  vi.clearAllMocks();
}

/**
 * 글로벌 스코프에 Mock API 설정
 * 실제 애플리케이션에서 GM_* 함수들이 호출될 때 Mock이 사용되도록 함
 */
export function setupGlobalMocks() {
  // Mock API 연결 활성화
  connectMockAPI();

  // globalThis에 직접 설정 (안전한 설정)
  if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, mockUserscriptAPI);
  }

  // window에도 설정 (브라우저 환경)
  try {
    if (typeof globalThis.window !== 'undefined') {
      Object.assign(globalThis.window, mockUserscriptAPI);
    }
  } catch {
    // 무시
  }

  // global에도 설정 (Node.js 환경)
  try {
    if (typeof globalThis.global !== 'undefined') {
      Object.assign(globalThis.global, mockUserscriptAPI);
    }
  } catch {
    // 무시
  }
}

/**
 * 유저스크립트 API 모의 설정
 */
export function setupUserscriptAPIMocks() {
  // globalThis에 모의 함수들 설정
  Object.assign(globalThis, mockUserscriptAPI);

  // Node.js 환경용 설정
  try {
    if (typeof globalThis.global !== 'undefined') {
      Object.assign(globalThis.global, mockUserscriptAPI);
    }
  } catch {
    // 무시
  }
}

/**
 * 모의 스토리지 초기화
 */
export function clearMockStorage() {
  mockStorage.clear();
  // 모든 mock 함수들의 호출 기록 초기화
  Object.values(mockUserscriptAPI).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
}

/**
 * 특정 GM_getValue 응답 설정
 */
export function setMockStorageValue(key, value) {
  mockStorage.set(key, value);
}

/**
 * XML HTTP Request 모의 응답 설정
 */
export function setupMockXMLHttpResponse(response) {
  mockUserscriptAPI.GM_xmlhttpRequest.mockImplementation(details => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      responseText: '',
      response: '',
      responseHeaders: '',
      readyState: 4,
      ...response,
    };

    globalThis.setTimeout(() => {
      if (details.onload) {
        details.onload(mockResponse);
      }
    }, 0);

    return { abort: vi.fn() };
  });
}
