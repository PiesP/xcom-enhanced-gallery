/**
 * 유저스크립트 API 모의(Mock) 구현
 * @fileoverview GM_* 함수들을 모의하여 실제 브라우저 확장 API 호출 방지
 */

import { vi } from 'vitest';

// ================================
// Types & Interfaces
// ================================

/** Mock API 상태 추적 */
interface DownloadCall {
  url: string;
  filename: string;
  timestamp?: number;
}

/** Mock API 전체 상태 */
interface MockApiState {
  downloadQueue: Array<{ url: string; filename: string }>;
  notifications: Array<unknown>;
  isAutoDownloadEnabled: boolean;
  lastDownloadCall: DownloadCall | null;
}

// ================================
// Mock Storage
// ================================

const mockStorage = new Map<string, unknown>();
const mockCookieStore = new Map<string, string>();

// ================================
// Storage API Mocks
// ================================

const storageAPIMocks = {
  /**
   * 저장된 값 조회
   * @param key - 저장소 키
   * @param defaultValue - 키가 없을 때 반환할 기본값
   */
  GM_getValue: vi.fn((key: string, defaultValue?: unknown) => {
    return mockStorage.get(key) ?? defaultValue;
  }),

  /**
   * 값 저장
   * @param key - 저장소 키
   * @param value - 저장할 값
   */
  GM_setValue: vi.fn((key: string, value: unknown) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),

  /**
   * 키 삭제
   * @param key - 삭제할 키
   */
  GM_deleteValue: vi.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),

  /**
   * 모든 키 나열
   */
  GM_listValues: vi.fn(() => {
    return Array.from(mockStorage.keys());
  }),
};

// ================================
// Network API Mocks
// ================================

const networkAPIMocks = {
  /**
   * XML HTTP Request 모의
   */
  GM_xmlhttpRequest: vi.fn((details: { onload?: (response: unknown) => void }) => {
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

    return { abort: vi.fn() };
  }),

  /**
   * 파일 다운로드
   */
  GM_download: vi.fn((url: string, filename: string) => {
    return Promise.resolve({
      url,
      filename,
      error: null,
    });
  }),
};

const cookieAPIMocks = {
  GM_cookie: {
    list: vi.fn(
      (
        details?: { name?: string },
        callback?: (cookies: Array<{ name: string; value: string }>, error: string | null) => void
      ) => {
        const entries = Array.from(mockCookieStore.entries()).map(([name, value]) => ({
          name,
          value,
        }));
        const filtered = details?.name
          ? entries.filter(entry => entry.name === details.name)
          : entries;
        callback?.(filtered, null);
      }
    ),
    set: vi.fn((details: { name: string; value: string }, callback?: (error?: string) => void) => {
      mockCookieStore.set(details.name, details.value);
      callback?.();
    }),
    delete: vi.fn((details: { name: string }, callback?: (error?: string) => void) => {
      mockCookieStore.delete(details.name);
      callback?.();
    }),
  },
};

// ================================
// UI API Mocks
// ================================

const uiAPIMocks = {
  /**
   * 알림 표시
   */
  GM_notification: vi.fn((options: unknown) => {
    globalThis.console.log('Mock notification:', options);
  }),

  /**
   * 새 탭에서 URL 열기
   */
  GM_openInTab: vi.fn((url: string) => {
    globalThis.console.log('Mock open in tab:', url);
    return { close: vi.fn() };
  }),
};

// ================================
// Menu & Context API Mocks
// ================================

const menuAPIMocks = {
  /**
   * 메뉴 명령 등록
   */
  GM_registerMenuCommand: vi.fn((caption: string) => {
    return caption;
  }),

  /**
   * 메뉴 명령 해제
   */
  GM_unregisterMenuCommand: vi.fn(() => {
    // Mock implementation
  }),

  /**
   * 클립보드 설정
   */
  GM_setClipboard: vi.fn((data: unknown) => {
    globalThis.console.log('Mock clipboard:', data);
  }),
};

// ================================
// Info & Metadata
// ================================

const infoAPIMocks = {
  /**
   * 스크립트 정보
   */
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
// Complete Mock API Object
// ================================

export const mockUserscriptAPI = {
  ...storageAPIMocks,
  ...networkAPIMocks,
  ...uiAPIMocks,
  ...menuAPIMocks,
  ...infoAPIMocks,
  ...cookieAPIMocks,
};

// ================================
// Mock State Management
// ================================

export const mockApiState: MockApiState = {
  downloadQueue: [],
  notifications: [],
  isAutoDownloadEnabled: false,
  lastDownloadCall: null,
};

/**
 * Mock API에 상태 추적 기능 연결
 */
export function connectMockAPI(): MockApiState {
  // GM_download 향상된 Mock - 상태 추적 포함
  mockUserscriptAPI.GM_download = vi.fn((url: string, filename: string) => {
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
  mockUserscriptAPI.GM_notification = vi.fn((options: unknown) => {
    mockApiState.notifications.push(options);
    globalThis.console.log('[Mock API] Notification triggered:', options);
  });

  return mockApiState;
}

/**
 * Mock API 상태 초기화
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetMockApiState();
 * });
 * ```
 */
export function resetMockApiState(): void {
  mockApiState.downloadQueue.length = 0;
  mockApiState.notifications.length = 0;
  mockApiState.isAutoDownloadEnabled = false;
  mockApiState.lastDownloadCall = null;

  // Mock 함수 호출 카운터 초기화
  vi.clearAllMocks();
}

/**
 * 글로벌 스코프에 Mock API 설정
 *
 * 실제 애플리케이션에서 GM_* 함수들이 호출될 때 Mock이 사용되도록 합니다.
 *
 * @example
 * ```typescript
 * beforeAll(() => {
 *   setupGlobalMocks();
 * });
 * ```
 */
export function setupGlobalMocks(): void {
  // Mock API 연결 활성화
  connectMockAPI();

  // globalThis에 설정
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
 * 모의 스토리지 초기화
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearMockStorage();
 * });
 * ```
 */
export function clearMockStorage(): void {
  mockStorage.clear();
  mockCookieStore.clear();
  // 모든 mock 함수들의 호출 기록 초기화
  Object.values(mockUserscriptAPI).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
    if (typeof mock === 'object') {
      Object.values(mock).forEach(inner => {
        if (typeof inner === 'function' && 'mockClear' in inner) {
          (inner as any).mockClear();
        }
      });
    }
  });
}

/**
 * 특정 GM_getValue 응답 설정
 *
 * @param key - 저장소 키
 * @param value - 저장할 값
 *
 * @example
 * ```typescript
 * setMockStorageValue('theme', 'dark');
 * expect(await GM_getValue('theme')).toBe('dark');
 * ```
 */
export function setMockStorageValue(key: string, value: unknown): void {
  mockStorage.set(key, value);
}

/**
 * XML HTTP Request 모의 응답 설정
 *
 * @param response - 모의 응답 객체 (선택 사항)
 *
 * @example
 * ```typescript
 * setupMockXMLHttpResponse({
 *   status: 404,
 *   responseText: 'Not found',
 * });
 * ```
 */
export function setupMockXMLHttpResponse(
  response?: Partial<{
    status: number;
    statusText: string;
    responseText: string;
    response: string;
    responseHeaders: string;
  }>
): void {
  mockUserscriptAPI.GM_xmlhttpRequest = vi.fn(
    (details: { onload?: (response: unknown) => void }) => {
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
    }
  );
}
