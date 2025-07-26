/**
 * 유저스크립트 API 모의(Mock) 구현
 * GM_* 함수들을 모의하여 실제 브라우저 확장 API 호출 방지
 */

import { vi } from 'vitest';

// ================================
// 유저스크립트 API Mock Storage
// ================================

const mockStorage = new Map<string, string>();

// ================================
// GM_* API Mocks
// ================================

export const mockUserscriptAPI = {
  GM_getValue: vi.fn((key: string, defaultValue?: string) => {
    return mockStorage.get(key) ?? defaultValue;
  }),

  GM_setValue: vi.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),

  GM_deleteValue: vi.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),

  GM_listValues: vi.fn(() => {
    return Array.from(mockStorage.keys());
  }),

  GM_xmlhttpRequest: vi.fn((details: any) => {
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

  GM_download: vi.fn((url: string, filename: string) => {
    return Promise.resolve({
      url,
      filename,
      error: null,
    });
  }),

  GM_notification: vi.fn((options: any) => {
    globalThis.console.log('Mock notification:', options);
  }),

  GM_openInTab: vi.fn((url: string) => {
    globalThis.console.log('Mock open in tab:', url);
    return { close: vi.fn() };
  }),

  GM_registerMenuCommand: vi.fn((caption: string, _commandFunc: Function) => {
    return caption;
  }),

  GM_unregisterMenuCommand: vi.fn((_menuCmdId: string) => {
    // Mock implementation
  }),

  GM_setClipboard: vi.fn((data: string) => {
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
// Global Mock Setup
// ================================

/**
 * 전역 유저스크립트 API를 모의로 설정
 */
export function setupUserscriptAPIMocks() {
  // window 객체에 GM_* 함수들 추가
  Object.entries(mockUserscriptAPI).forEach(([key, value]) => {
    (globalThis as any)[key] = value;
    if (typeof window !== 'undefined') {
      (window as any)[key] = value;
    }
  });
}

/**
 * 모의 스토리지 초기화
 */
export function clearMockStorage() {
  mockStorage.clear();
  // 모든 mock 함수들의 호출 기록 초기화
  Object.values(mockUserscriptAPI).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
  });
}

/**
 * 특정 GM_getValue 응답 설정
 */
export function setMockStorageValue(key: string, value: string) {
  mockStorage.set(key, value);
}

/**
 * XML HTTP Request 모의 응답 설정
 */
export function setupMockXMLHttpResponse(response: Partial<any>) {
  mockUserscriptAPI.GM_xmlhttpRequest.mockImplementation((details: any) => {
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
