/**
 * 브라우저 확장 API 모킹 유틸리티
 * Chrome/Browser extension API를 테스트용으로 모킹
 */

import { vi } from 'vitest';

// ================================
// Browser Extension API Types
// ================================

export type MockBrowserRuntime = {
  id: string;
  sendMessage: ReturnType<typeof vi.fn>;
  getURL: ReturnType<typeof vi.fn>;
  onMessage: {
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
    hasListener: ReturnType<typeof vi.fn>;
  };
  lastError?: Error;
};

export type MockBrowserStorage = {
  local: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    getBytesInUse: ReturnType<typeof vi.fn>;
  };
  sync: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    getBytesInUse: ReturnType<typeof vi.fn>;
  };
};

export type MockBrowserTabs = {
  query: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

export type MockBrowserAPI = {
  runtime: MockBrowserRuntime;
  storage: MockBrowserStorage;
  tabs: MockBrowserTabs;
};

// ================================
// Mock Storage Implementation
// ================================

class MockStorage {
  private data = new Map<string, unknown>();

  get = vi.fn().mockImplementation(async (keys?: string | string[] | Record<string, unknown>) => {
    if (!keys) {
      // 모든 데이터 반환
      const result: Record<string, unknown> = {};
      this.data.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    if (typeof keys === 'string') {
      return { [keys]: this.data.get(keys) };
    }

    if (Array.isArray(keys)) {
      const result: Record<string, unknown> = {};
      keys.forEach(key => {
        if (this.data.has(key)) {
          result[key] = this.data.get(key);
        }
      });
      return result;
    }

    if (typeof keys === 'object') {
      const result: Record<string, unknown> = {};
      Object.entries(keys).forEach(([key, defaultValue]) => {
        result[key] = this.data.has(key) ? this.data.get(key) : defaultValue;
      });
      return result;
    }

    return {};
  });

  set = vi.fn().mockImplementation(async (items: Record<string, unknown>) => {
    Object.entries(items).forEach(([key, value]) => {
      this.data.set(key, value);
    });
    return Promise.resolve();
  });

  remove = vi.fn().mockImplementation(async (keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => {
      this.data.delete(key);
    });
    return Promise.resolve();
  });

  clear = vi.fn().mockImplementation(async () => {
    this.data.clear();
    return Promise.resolve();
  });

  getBytesInUse = vi.fn().mockImplementation(async (keys?: string | string[]) => {
    // 간단한 바이트 계산 시뮬레이션
    if (!keys) {
      return Array.from(this.data.values()).reduce(
        (total: number, value: unknown) => total + JSON.stringify(value).length,
        0
      );
    }

    const keysArray = Array.isArray(keys) ? keys : [keys];
    return keysArray.reduce((total: number, key) => {
      const value = this.data.get(key);
      return total + (value ? JSON.stringify(value).length : 0);
    }, 0);
  });

  // 테스트 헬퍼 메서드
  _getData(): Map<string, unknown> {
    return new Map(this.data);
  }

  _reset(): void {
    this.data.clear();
  }
}

// ================================
// Mock Factory Functions
// ================================

/**
 * 브라우저 확장 API Mock 생성
 */
export function createBrowserExtensionMock(): MockBrowserAPI {
  const localStorage = new MockStorage();
  const syncStorage = new MockStorage();

  const runtime: MockBrowserRuntime = {
    id: 'mock-extension-id',

    sendMessage: vi.fn().mockImplementation(async (message: unknown) => {
      // 기본적으로 성공 응답 반환
      return Promise.resolve({ success: true, data: message });
    }),

    getURL: vi.fn().mockImplementation((path: string) => {
      return `chrome-extension://mock-extension-id/${path}`;
    }),

    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false),
    },
  };

  const storage: MockBrowserStorage = {
    local: localStorage,
    sync: syncStorage,
  };

  const tabs: MockBrowserTabs = {
    query: vi.fn().mockImplementation(async (queryInfo: Record<string, unknown>) => {
      // 기본 탭 정보 반환
      return [
        {
          id: 1,
          url: 'https://x.com/user/status/123456789',
          title: 'Test Tweet',
          active: true,
          windowId: 1,
          ...queryInfo,
        },
      ];
    }),

    get: vi.fn().mockImplementation(async (tabId: number) => {
      return {
        id: tabId,
        url: 'https://x.com/user/status/123456789',
        title: 'Test Tweet',
        active: true,
        windowId: 1,
      };
    }),

    sendMessage: vi.fn().mockImplementation(async (tabId: number, message: unknown) => {
      return Promise.resolve({ success: true, tabId, message });
    }),

    create: vi.fn().mockImplementation(async (createProperties: Record<string, unknown>) => {
      return {
        id: Math.floor(Math.random() * 1000) + 1,
        windowId: 1,
        active: true,
        ...createProperties,
      };
    }),

    update: vi
      .fn()
      .mockImplementation(async (tabId: number, updateProperties: Record<string, unknown>) => {
        return {
          id: tabId,
          windowId: 1,
          active: true,
          ...updateProperties,
        };
      }),

    remove: vi.fn().mockImplementation(async (tabIds: number | number[]) => {
      const _ids = Array.isArray(tabIds) ? tabIds : [tabIds];
      return Promise.resolve(_ids);
    }),
  };

  return {
    runtime,
    storage,
    tabs,
  };
}

/**
 * Web API Mock 설정 (Fetch, ResizeObserver 등)
 */
type FetchOptionsLike = Record<string, unknown> | undefined;

export function setupWebAPIMocks(): void {
  // Fetch API Mock
  (globalThis as Record<string, unknown>).fetch = vi
    .fn()
    .mockImplementation(async (url: string, options?: FetchOptionsLike) => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({ url, options }),
        text: async () => JSON.stringify({ url, options }),
        blob: async () => ({ data: JSON.stringify({ url, options }) }),
        arrayBuffer: async () => new ArrayBuffer(0),
      };

      return Promise.resolve(mockResponse);
    });

  // ResizeObserver Mock
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // IntersectionObserver Mock
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));

  // MutationObserver Mock
  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([]),
  }));
}

/**
 * 브라우저 확장 환경 설정
 */
export function setupBrowserExtensionEnvironment(): MockBrowserAPI {
  const mockBrowser = createBrowserExtensionMock();

  // Global browser/chrome API 설정
  Object.defineProperty(global, 'browser', {
    value: mockBrowser,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'chrome', {
    value: mockBrowser,
    writable: true,
    configurable: true,
  });

  // Web API Mocks 설정
  setupWebAPIMocks();

  return mockBrowser;
}

/**
 * 브라우저 확장 환경 정리
 */
export function cleanupBrowserExtensionEnvironment(): void {
  Object.defineProperty(global, 'browser', {
    value: undefined,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'chrome', {
    value: undefined,
    writable: true,
    configurable: true,
  });

  // Web API 정리
  delete (global as any).fetch;
  delete (global as any).ResizeObserver;
  delete (global as any).IntersectionObserver;
  delete (global as any).MutationObserver;
}
