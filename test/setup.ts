/**
 * Vitest 테스트 설정 파일
 *
 * @description 모든 테스트 실행 전에 필요한 초기화 작업을 수행합니다.
 * DOM polyfill, 글로벌 모킹, 테스트 유틸리티 설정 등을 포함합니다.
 *
 * @fileoverview 테스트 환경 설정 및 전역 모킹
 * @version 1.0.0
 */

// DOM API Polyfills
import { afterEach, beforeAll } from 'vitest';

/**
 * 글로벌 설정
 */
beforeAll(() => {
  // URL polyfill for Node.js environment
  if (typeof global.URL === 'undefined') {
    global.URL = URL;
  }

  // URLSearchParams polyfill for Node.js environment
  if (typeof global.URLSearchParams === 'undefined') {
    global.URLSearchParams = URLSearchParams;
  }

  // Mock fetch API
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('404') || url.includes('notfound')) {
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockRejectedValue(new Error('404 Not Found')),
        text: vi.fn().mockRejectedValue(new Error('404 Not Found')),
        blob: vi.fn().mockRejectedValue(new Error('404 Not Found')),
        arrayBuffer: vi.fn().mockRejectedValue(new Error('404 Not Found')),
      });
    }

    if (url.includes('network-error')) {
      return Promise.reject(new Error('Network error'));
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue('mock response'),
      blob: vi.fn().mockResolvedValue(new Blob(['mock data'], { type: 'image/jpeg' })),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      headers: {
        get: vi.fn((name: string) => {
          if (name.toLowerCase() === 'content-type') return 'image/jpeg';
          return null;
        }),
        has: vi.fn().mockReturnValue(true),
        forEach: vi.fn(),
      },
      clone: vi.fn(),
    });
  });

  // Set up fetch globally - 여러 위치에 설정
  global.fetch = mockFetch;
  globalThis.fetch = mockFetch;

  Object.defineProperty(global, 'fetch', {
    value: mockFetch,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  Object.defineProperty(globalThis, 'fetch', {
    value: mockFetch,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  if (typeof window !== 'undefined') {
    (window as any).fetch = mockFetch;
    Object.defineProperty(window, 'fetch', {
      value: mockFetch,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  // Mock matchMedia
  const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width: 768px') ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  global.matchMedia = mockMatchMedia;
  globalThis.matchMedia = mockMatchMedia;

  Object.defineProperty(global, 'matchMedia', {
    value: mockMatchMedia,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  Object.defineProperty(globalThis, 'matchMedia', {
    value: mockMatchMedia,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  if (typeof window !== 'undefined') {
    (window as any).matchMedia = mockMatchMedia;
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  // Mock URL.createObjectURL
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock-url'),
    writable: true,
    configurable: true,
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });

  // Mock crypto for UUID generation
  Object.defineProperty(window, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
      getRandomValues: vi.fn((arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    },
    writable: true,
    configurable: true,
  });

  // Enhance Element prototype for better instanceof checks
  if (typeof Element !== 'undefined') {
    // Override the Symbol.hasInstance to make instanceof work in test environment
    Object.defineProperty(Element, Symbol.hasInstance, {
      value: function (obj: any) {
        if (!obj || typeof obj !== 'object') return false;

        // Check for DOM node properties first
        if (obj.nodeType === 1) return true;

        // Check constructor names
        const constructorName = obj.constructor?.name;
        if (
          constructorName &&
          (constructorName.includes('Element') ||
            constructorName === 'HTMLDivElement' ||
            constructorName === 'HTMLSpanElement' ||
            constructorName === 'HTMLImageElement' ||
            constructorName === 'HTMLVideoElement')
        )
          return true;

        // Check for tag name and DOM-like properties
        if (obj.tagName && typeof obj.tagName === 'string') return true;

        // Check for common Element methods
        if (obj.getAttribute && obj.setAttribute && obj.appendChild) return true;

        // Check if object has Element-like properties
        if (obj.hasOwnProperty('nodeType') && obj.nodeType === 1) return true;

        // Check for Element prototype in prototype chain
        try {
          return Object.prototype.isPrototypeOf.call(Element.prototype, obj);
        } catch {
          return false;
        }
      },
      configurable: true,
      writable: true,
    });

    // Also add it to HTMLElement if available
    if (typeof HTMLElement !== 'undefined') {
      Object.defineProperty(HTMLElement, Symbol.hasInstance, {
        value: function (obj: any) {
          return Element[Symbol.hasInstance](obj);
        },
        configurable: true,
        writable: true,
      });
    }
  }

  // 추가적으로 document.createElement가 올바른 Element를 생성하도록 보장
  if (typeof document !== 'undefined' && document.createElement) {
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName: string) {
      const element = originalCreateElement.call(this, tagName);

      // Element의 nodeType이 1인지 확인하고 instanceof 검사 개선
      Object.defineProperty(element, 'nodeType', {
        value: 1,
        writable: false,
        configurable: false,
        enumerable: true,
      });

      // Element의 constructor 확인을 위한 추가 설정
      Object.defineProperty(element, 'constructor', {
        value: Element,
        writable: true,
        configurable: true,
        enumerable: false,
      });

      // Element.prototype을 프로토타입 체인에 확실히 포함
      if (!Object.prototype.isPrototypeOf.call(Element.prototype, element)) {
        try {
          Object.setPrototypeOf(element, Element.prototype);
        } catch (e) {
          // setPrototypeOf 실패 시 대체 방법
          element.__proto__ = Element.prototype;
        }
      }

      return element;
    };

    // 추가로 createElement에 의해 생성된 모든 요소가 Element로 인식되도록 global isElement 함수 정의
    (global as any).isElement = function (obj: any): boolean {
      if (!obj || typeof obj !== 'object') return false;

      // DOM nodeType check
      if (obj.nodeType === 1) return true;

      // Check Element instance
      if (obj instanceof Element) return true;

      // Check for Element-like properties
      if (obj.tagName && typeof obj.getAttribute === 'function') return true;

      return false;
    };
  }

  // Mock Observers
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  }));

  // CustomEvent polyfill for jsdom
  if (typeof global.CustomEvent === 'undefined') {
    (global as any).CustomEvent = class extends Event {
      public detail: any;

      constructor(typeArg: string, customEventInitDict?: CustomEventInit) {
        super(typeArg, customEventInitDict);
        this.detail = customEventInitDict?.detail;
      }
    };
  }

  // requestIdleCallback polyfill
  if (typeof global.requestIdleCallback === 'undefined') {
    (global as any).requestIdleCallback = (callback: any) => {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining() {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };
  }

  if (typeof global.cancelIdleCallback === 'undefined') {
    (global as any).cancelIdleCallback = (id: number) => {
      clearTimeout(id);
    };
  }

  // MutationObserver mock (jsdom에서 제공되지만 추가 설정)
  if (typeof global.MutationObserver === 'undefined') {
    global.MutationObserver = class MutationObserver {
      constructor(callback: MutationCallback) {
        // Mock implementation
      }
      observe() {
        // Mock implementation
      }
      disconnect() {
        // Mock implementation
      }
      takeRecords(): MutationRecord[] {
        return [];
      }
    };
  }

  // localStorage mock
  const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // console 메서드 정리 (테스트 중 로그 출력 최소화)
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
});

/**
 * 각 테스트 후 정리 작업
 */
afterEach(() => {
  // DOM 정리 (안전 체크 추가)
  if (document?.body) {
    document.body.innerHTML = '';
  }
  if (document?.head) {
    document.head.innerHTML = '';
  }

  // 모든 timers 정리
  vi.clearAllTimers();
  vi.clearAllMocks();

  // localStorage 정리
  if (global.localStorage) {
    global.localStorage.clear();
  }

  // Logger mock 정리 - 안전한 정리 방법
  if ((globalThis as any).mockLogger) {
    const logger = (globalThis as any).mockLogger;
    try {
      Object.keys(logger).forEach(key => {
        const fn = logger[key];
        if (typeof fn?.mockClear === 'function') {
          fn.mockClear();
        }
      });
    } catch (error) {
      // Logger mock 정리 실패 시에도 테스트 계속 진행
      console.warn('Failed to clear logger mocks:', error);
    }
  }

  // Download mocks 정리
  if ((globalThis as any).mockDownloadBlob) {
    (globalThis as any).mockDownloadBlob.mockClear();
  }
  if ((globalThis as any).mockCreateZip) {
    (globalThis as any).mockCreateZip.mockClear();
  }

  // 커스텀 이벤트 리스너 정리
  const events = ['xeg:mediaClick', 'xeg:openGallery', 'xeg:galleryStateChanged'];
  events.forEach(eventType => {
    const listeners = (document as any)._eventListeners?.[eventType];
    if (listeners) {
      listeners.forEach((listener: EventListener) => {
        document.removeEventListener(eventType, listener);
      });
    }
  });
});

// Mock logger for ServiceManager and other services
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
  log: vi.fn(),
  trace: vi.fn(),
};

// Make all logger functions have mockClear method
Object.keys(mockLogger).forEach(key => {
  const fn = mockLogger[key as keyof typeof mockLogger];
  if (typeof fn === 'function' && !fn.mockClear) {
    fn.mockClear = vi.fn().mockClear;
  }
});

// 글로벌 mockLogger 접근 가능하도록 설정
(globalThis as any).mockLogger = mockLogger;

// ServiceManager logger mock 설정 - 모든 가능한 경로에서 동일한 mock을 반환하도록
const loggerMockExport = {
  logger: mockLogger,
  createScopedLogger: vi.fn(() => mockLogger),
  logError: vi.fn(),
  measurePerformance: vi.fn(),
  devLog: vi.fn(),
  default: mockLogger,
};

// 실제 모듈 로딩 전에 mock을 설정 - beforeAll 외부에서 실행
vi.mock('@infrastructure/logging/logger', () => loggerMockExport);
vi.mock('src/infrastructure/logging/logger', () => loggerMockExport);
vi.mock('@infrastructure/logging', () => loggerMockExport);
vi.mock('src/infrastructure/logging', () => loggerMockExport);

// 다양한 상대 경로들에 대한 mock
vi.mock('../src/infrastructure/logging/logger', () => loggerMockExport);
vi.mock('../../src/infrastructure/logging/logger', () => loggerMockExport);
vi.mock('../../../src/infrastructure/logging/logger', () => loggerMockExport);
vi.mock('../../../../src/infrastructure/logging/logger', () => loggerMockExport);

// doMock을 사용한 추가 설정은 beforeAll 내부에서만 사용
// Named export mock을 위한 추가 설정 제거 - 중복 설정으로 인한 충돌 방지

// Mock BulkDownloadService and related download functions
const mockDownloadBlob = vi.fn();
const mockCreateZip = vi
  .fn()
  .mockResolvedValue(new Blob(['mock zip'], { type: 'application/zip' }));

vi.doMock('@shared/utils/external', () => ({
  // External 모듈의 모킹 (vendor utilities export)
  getFflate: vi.fn(() => ({
    zipSync: vi.fn(() => new Uint8Array([1, 2, 3])),
    zip: vi.fn((files, options, callback) => {
      callback(null, new Uint8Array([1, 2, 3]));
    }),
  })),
  getNativeDownload: vi.fn(() => ({
    downloadBlob: mockDownloadBlob,
    createDownloadUrl: vi.fn(blob => `blob:mock-url-${Math.random()}`),
    revokeDownloadUrl: vi.fn(),
  })),
  getPreact: vi.fn(() => ({
    h: vi.fn(),
    render: vi.fn(),
    Component: vi.fn(),
    Fragment: vi.fn(),
    createContext: vi.fn(),
    cloneElement: vi.fn(),
    createRef: vi.fn(),
    isValidElement: vi.fn(),
    options: {},
    createElement: vi.fn(),
  })),
  getPreactHooks: vi.fn(() => ({
    useState: vi.fn(),
    useEffect: vi.fn(),
    useRef: vi.fn(),
    useCallback: vi.fn(),
    useMemo: vi.fn(),
    useReducer: vi.fn(),
    useContext: vi.fn(),
    useLayoutEffect: vi.fn(),
    useImperativeHandle: vi.fn(),
    useDebugValue: vi.fn(),
    forwardRef: vi.fn(),
  })),
  getPreactSignals: vi.fn(() => ({
    signal: vi.fn(),
    computed: vi.fn(),
    effect: vi.fn(),
    batch: vi.fn(),
    useSignal: vi.fn(),
    useComputed: vi.fn(),
    useSignalEffect: vi.fn(),
  })),
  createZipFromItems: mockCreateZip,
  generateMediaFilename: vi.fn(media => `test-${media.url.split('/').pop()}`),
  generateZipFilename: vi.fn(() => 'test-gallery.zip'),
}));

vi.doMock('@core/services/BulkDownloadService', () => {
  const mockDownloadSingle = vi.fn().mockImplementation(async media => {
    // 에러 케이스 시뮬레이션
    if (media.url.includes('network-error') || media.url.includes('404')) {
      return {
        success: false,
        error: 'Network error',
      };
    }

    // 테스트용 fetch 호출 시뮬레이션
    if (global.fetch) {
      await global.fetch(media.url);
    }

    // 테스트용 downloadBlob 호출 시뮬레이션
    if ((globalThis as any).mockDownloadBlob) {
      (globalThis as any).mockDownloadBlob(
        new Blob(['mock data'], { type: 'image/jpeg' }),
        media.url.split('/').pop()
      );
    }

    return {
      success: true,
      filename: media.url.split('/').pop(),
    };
  });

  const mockDownloadMultiple = vi.fn().mockImplementation(async (mediaItems, options = {}) => {
    const strategy = options.strategy || (mediaItems.length > 1 ? 'zip' : 'individual');

    // 빈 배열 처리
    if (mediaItems.length === 0) {
      return {
        success: false,
        filesProcessed: 0,
        filesSuccessful: 0,
        errors: ['No media items provided'],
        error: 'No media items provided',
      };
    }

    // 에러 케이스 처리
    const hasNetworkError = mediaItems.some(
      item => item.url.includes('network-error') || item.url.includes('404')
    );

    if (hasNetworkError && strategy === 'zip') {
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        errors: ['Network error during ZIP creation'],
        error: 'Network error during ZIP creation',
      };
    }

    // ZIP 실패 시뮬레이션
    if ((globalThis as any).__TEST_ZIP_FAIL__) {
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        errors: ['ZIP creation failed'],
        error: 'ZIP creation failed',
      };
    }

    // onProgress 콜백이 있으면 호출
    if (options.onProgress) {
      options.onProgress({
        phase: 'preparing',
        current: 0,
        total: mediaItems.length,
        percentage: 0,
      });

      options.onProgress({
        phase: 'downloading',
        current: Math.floor(mediaItems.length / 2),
        total: mediaItems.length,
        percentage: 50,
      });

      options.onProgress({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });
    }

    // fetch 호출 시뮬레이션 (각 미디어 아이템에 대해)
    if (global.fetch && strategy === 'individual') {
      for (const media of mediaItems) {
        if (!media.url.includes('network-error') && !media.url.includes('404')) {
          await global.fetch(media.url);
        }
      }
    }

    // downloadBlob 호출 시뮬레이션
    if ((globalThis as any).mockDownloadBlob) {
      if (strategy === 'zip') {
        (globalThis as any).mockDownloadBlob(
          new Blob(['mock zip'], { type: 'application/zip' }),
          'test-gallery.zip'
        );
      } else {
        // 개별 다운로드
        for (const media of mediaItems) {
          if (!media.url.includes('network-error') && !media.url.includes('404')) {
            (globalThis as any).mockDownloadBlob(
              new Blob(['mock data'], { type: 'image/jpeg' }),
              media.url.split('/').pop()
            );
          }
        }
      }
    }

    // 부분 실패 시뮬레이션
    let successfulFiles = mediaItems.length;
    if (hasNetworkError && strategy === 'individual') {
      successfulFiles = mediaItems.filter(
        item => !item.url.includes('network-error') && !item.url.includes('404')
      ).length;
    }

    const baseResult = {
      success: successfulFiles > 0,
      filesProcessed: mediaItems.length,
      filesSuccessful: successfulFiles,
      errors: [] as string[],
    };

    if (strategy === 'zip' && successfulFiles === mediaItems.length) {
      return {
        ...baseResult,
        filename: 'test-gallery.zip',
      };
    }

    return baseResult;
  });

  const mockInstance = {
    initialize: vi.fn().mockImplementation(async () => {
      // initialize 호출 시 상태를 initialized로 변경
      mockInstance.isInitialized = vi.fn().mockReturnValue(true);
      mockInstance.getStatus = vi.fn().mockReturnValue('active');
      return Promise.resolve();
    }),
    destroy: vi.fn().mockImplementation(() => {
      // destroy 호출 시 상태 변경
      mockInstance.isInitialized = vi.fn().mockReturnValue(false);
      mockInstance.getStatus = vi.fn().mockReturnValue('inactive');
    }),
    downloadSingle: mockDownloadSingle,
    downloadMultiple: mockDownloadMultiple,
    downloadBulk: mockDownloadMultiple,
    cancelDownload: vi.fn(),
    getCurrentDownloadInfo: vi.fn().mockReturnValue({
      isDownloading: false,
      progress: 0,
      failedFiles: [],
    }),
    isInitialized: vi.fn().mockReturnValue(true),
    getStatus: vi.fn().mockReturnValue('active'),
  };

  // 글로벌에 mockInstance 저장하여 GalleryDownloadService에서 접근 가능하도록
  (globalThis as any).mockBulkDownloadInstance = mockInstance;

  const BulkDownloadService = class {
    static getInstance() {
      return mockInstance;
    }

    constructor() {
      return mockInstance;
    }
  };

  return { BulkDownloadService };
});

vi.doMock('@shared/utils/external/zip', () => ({
  createZipFromItems: mockCreateZip,
}));

// Mock vendor libraries on window object
const mockVendors = {
  fflate: {
    zip: vi.fn(),
    unzip: vi.fn(),
    strToU8: vi.fn(),
    zipSync: vi.fn(),
  },
  Motion: {
    animate: vi.fn(),
    timeline: vi.fn(),
    stagger: vi.fn(),
  },
  Preact: {
    h: vi.fn(),
    render: vi.fn(),
    Fragment: 'Fragment',
  },
  PreactSignals: {
    signal: vi.fn(),
    computed: vi.fn(),
    effect: vi.fn(),
    batch: vi.fn(),
  },
};

if (typeof window !== 'undefined') {
  Object.assign(window, mockVendors);
}

// Global과 globalThis에도 설정 (Node.js 환경 대응)
Object.assign(global, mockVendors);
Object.assign(globalThis, mockVendors);

// Global vendor mocks
(globalThis as any).mockVendors = mockVendors;
(globalThis as any).mockDownloadBlob = mockDownloadBlob;
(globalThis as any).mockCreateZip = mockCreateZip;

/**
 * 전역 타입 선언
 */
declare global {
  const vi: typeof import('vitest').vi;
}
