/**
 * test/unit/__factories__/mock-utils.factory.ts
 *
 * Mock 객체 생성 팩토리 함수 모음
 * 목표: 반복되는 Mock 패턴을 표준화하여 테스트 코드 단순화
 *
 * 사용 예:
 * ```typescript
 * const { element, mockHandler } = createMockEventContext();
 * const service = createMockService({ extract: vi.fn() });
 * const { signals, store } = createMockSignalStore();
 * ```
 */

import { vi } from 'vitest';

// ============ DOM Mock Factories ============

/**
 * Mock DOM Element 생성
 * 용도: 이벤트 리스너 테스트, DOM 유틸 테스트
 */
export function createMockElement(overrides: Partial<HTMLElement> = {}) {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn(() => false),
    },
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    ...overrides,
  } as any;
}

/**
 * Mock Event 생성
 * 용도: 이벤트 핸들러 테스트, 키보드/마우스 이벤트 시뮬레이션
 */
export function createMockEvent(type: string, overrides: Partial<Event> = {}) {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: createMockElement(),
    currentTarget: createMockElement(),
    key: '',
    keyCode: 0,
    ...overrides,
  } as any;
}

/**
 * Mock KeyboardEvent 생성
 * 용도: 키보드 네비게이션 테스트
 */
export function createMockKeyEvent(key: string, overrides: Partial<KeyboardEvent> = {}) {
  return createMockEvent('keydown', {
    key,
    code: `Key${key.toUpperCase()}`,
    ...overrides,
  }) as any;
}

/**
 * Mock WheelEvent 생성
 * 용도: 스크롤 테스트
 */
export function createMockWheelEvent(deltaY: number = 100) {
  return {
    ...createMockEvent('wheel'),
    deltaY,
    deltaX: 0,
    deltaZ: 0,
  } as any;
}

// ============ Service Mock Factories ============

/**
 * Mock Service 컨텍스트
 * 용도: 서비스 간 협업 테스트
 */
export function createMockServiceContext() {
  return {
    extract: vi.fn(),
    download: vi.fn(),
    process: vi.fn(),
    validate: vi.fn(),
    transform: vi.fn(),
    dispose: vi.fn(),
    initialize: vi.fn(),
    reset: vi.fn(),
  };
}

/**
 * Mock Media Service
 * 용도: 미디어 서비스 테스트
 */
export function createMockMediaService(overrides = {}) {
  return {
    extract: vi.fn(async () => [
      {
        url: 'https://example.com/image.jpg',
        type: 'image' as const,
        filename: 'image.jpg',
      },
    ]),
    processMedia: vi.fn(async (items: any) => items),
    getMetadata: vi.fn(async () => ({ count: 1, totalSize: 1024 })),
    ...overrides,
  };
}

/**
 * Mock Bulk Download Service
 * 용도: 대량 다운로드 서비스 테스트
 */
export function createMockBulkDownloadService(overrides = {}) {
  return {
    start: vi.fn(async () => ({ success: true, count: 5 })),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getProgress: vi.fn(() => ({ current: 0, total: 5, percent: 0 })),
    ...overrides,
  };
}

/**
 * Mock Event Manager
 * 용도: 이벤트 시스템 테스트
 */
export function createMockEventManager(overrides = {}) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    once: vi.fn(),
    clear: vi.fn(),
    getListeners: vi.fn(() => ({})),
    ...overrides,
  };
}

// ============ Reactive (Solid.js) Mock Factories ============

/**
 * Mock Signal Store
 * 용도: Solid.js 신호 기반 상태 테스트
 */
export function createMockSignalStore(initialValue = {}) {
  const signals: Record<string, any> = {};
  const handlers = new Set<Function>();

  return {
    get(key: string) {
      return signals[key];
    },
    set(key: string, value: any) {
      signals[key] = value;
      handlers.forEach(h => h({ [key]: value }));
    },
    subscribe(handler: Function) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    getState() {
      return { ...signals };
    },
    ...initialValue,
  };
}

/**
 * Mock Solid.js Signal
 * 용도: 신호 리액티비티 테스트
 */
export function createMockSignal<T>(initialValue: T) {
  let value = initialValue;
  const subscribers = new Set<Function>();

  const getter = (() => value) as any;
  getter.setter = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      subscribers.forEach(sub => sub(newValue));
    }
  };
  getter.subscribe = (handler: Function) => {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  };

  return [getter, getter.setter] as [() => T, (value: T) => void];
}

// ============ Data Structure Mock Factories ============

/**
 * Mock Media Item
 * 용도: 미디어 데이터 테스트
 */
export function createMockMediaItem(overrides: Partial<any> = {}) {
  return {
    url: 'https://example.com/image.jpg',
    type: 'image' as const,
    filename: 'image.jpg',
    size: 1024,
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Mock Gallery State
 * 용도: 갤러리 상태 테스트
 */
export function createMockGalleryState(overrides: Partial<any> = {}) {
  return {
    currentIndex: 0,
    items: [],
    isOpen: false,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

/**
 * Mock Settings
 * 용도: 설정 테스트
 */
export function createMockSettings(overrides: Partial<any> = {}) {
  return {
    theme: 'light',
    downloadPath: '/downloads',
    autoPlay: false,
    quality: 'high',
    ...overrides,
  };
}

// ============ Context Mock Factories ============

/**
 * Mock Test Context (복합 팩토리)
 * 용도: 통합 테스트에서 여러 Mock을 한 번에 설정
 */
export function createMockTestContext() {
  return {
    // DOM
    element: createMockElement(),
    event: createMockEvent('click'),
    keyEvent: (key: string) => createMockKeyEvent(key),
    wheelEvent: (deltaY?: number) => createMockWheelEvent(deltaY),

    // Services
    mediaService: createMockMediaService(),
    bulkDownloadService: createMockBulkDownloadService(),
    eventManager: createMockEventManager(),

    // Reactive
    signalStore: createMockSignalStore(),

    // Data
    mediaItem: createMockMediaItem(),
    galleryState: createMockGalleryState(),
    settings: createMockSettings(),

    // Utilities
    createMockElement,
    createMockEvent,
    createMockKeyEvent,
    createMockWheelEvent,
    createMockServiceContext,
  };
}

// ============ Advanced Mock Factories ============

/**
 * Mock EventEmitter with Typed Events
 * 용도: 타입 안전 이벤트 시스템 테스트
 */
export function createMockEventEmitter<T extends Record<string, any>>() {
  const listeners: Record<string, Function[]> = {};

  return {
    on<K extends keyof T>(event: K, handler: (data: T[K]) => void) {
      if (!listeners[String(event)]) listeners[String(event)] = [];
      listeners[String(event)].push(handler);
      return () => {
        const idx = listeners[String(event)].indexOf(handler);
        if (idx > -1) listeners[String(event)].splice(idx, 1);
      };
    },
    emit<K extends keyof T>(event: K, data: T[K]) {
      const cbs = listeners[String(event)] || [];
      cbs.forEach(cb => cb(data));
    },
    clear() {
      Object.keys(listeners).forEach(key => {
        listeners[key] = [];
      });
    },
    getListeners(event?: keyof T) {
      if (event) return listeners[String(event)]?.length || 0;
      return Object.values(listeners).reduce((sum, arr) => sum + arr.length, 0);
    },
  };
}

/**
 * Mock Fetch Response
 * 용도: HTTP 요청 테스트
 */
export function createMockFetchResponse(data: any = {}, overrides: Record<string, any> = {}) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://example.com',
    headers: new Map(),
    json: vi.fn(async () => data),
    text: vi.fn(async () => JSON.stringify(data)),
    blob: vi.fn(async () => new Blob([JSON.stringify(data)])),
    arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
    clone: vi.fn(function () {
      return this;
    }),
    ...overrides,
  } as any;
}

/**
 * Mock Storage (localStorage/sessionStorage)
 * 용도: 저장소 테스트
 */
export function createMockStorage() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((index: number) => {
      const keys = Array.from(store.keys());
      return keys[index] || null;
    }),
    get length() {
      return store.size;
    },
  } as any;
}
