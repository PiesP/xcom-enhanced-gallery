/**
 * @fileoverview 특화된 Mock 유틸리티
 * TDD Phase 5c: Testing Strategy Unification - Specialized Mocks
 */

/**
 * DOM Mock 생성
 */
export function createDOMMock(): {
  document: Document;
  window: Window;
  createElement: (tag: string) => Element;
} {
  const mockDocument = {
    createElement: (tag: string) => ({
      tagName: tag.toUpperCase(),
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      textContent: '',
      innerHTML: '',
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    body: {
      appendChild: () => {},
      removeChild: () => {},
      innerHTML: '',
    },
  } as unknown as Document;

  const mockWindow = {
    document: mockDocument,
    location: { href: 'http://localhost:3000' },
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  } as unknown as Window;

  return {
    document: mockDocument,
    window: mockWindow,
    createElement: (tag: string) => mockDocument.createElement(tag),
  };
}

/**
 * 서비스 Mock 생성
 */
export function createServiceMock(serviceName: string): {
  [key: string]: () => unknown;
} {
  const baseMethods = {
    getInstance: () => ({}),
    resetInstance: () => {},
    initialize: () => Promise.resolve(),
    cleanup: () => Promise.resolve(),
  };

  // 서비스별 특화 메서드 추가
  const specializedMethods = getSpecializedMethods(serviceName);

  return {
    ...baseMethods,
    ...specializedMethods,
  };
}

/**
 * 서비스별 특화 메서드 조회
 */
function getSpecializedMethods(serviceName: string): Record<string, () => unknown> {
  const methodsMap: Record<string, Record<string, () => unknown>> = {
    gallery: {
      openGallery: () => Promise.resolve(),
      closeGallery: () => Promise.resolve(),
      isOpen: () => false,
      getImages: () => [],
      setImages: () => {},
    },
    media: {
      extractMedia: () => [],
      processMedia: () => Promise.resolve([]),
      validateURL: () => true,
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    },
    animation: {
      animate: () => Promise.resolve(),
      stop: () => {},
      pause: () => {},
      resume: () => {},
    },
  };

  return methodsMap[serviceName] || {};
}

/**
 * API Mock 생성
 */
export function createAPIMock(_apiName: string): {
  get: (url: string) => Promise<{ data: unknown }>;
  post: (url: string, data?: unknown) => Promise<{ data: unknown }>;
  put: (url: string, data?: unknown) => Promise<{ data: unknown }>;
  delete: (url: string) => Promise<{ data: unknown }>;
} {
  return {
    get: async (_url: string) => ({ data: {} }),
    post: async (_url: string, _data?: unknown) => ({ data: {} }),
    put: async (_url: string, _data?: unknown) => ({ data: {} }),
    delete: async (_url: string) => ({ data: {} }),
  };
}

/**
 * 이벤트 Mock 생성
 */
export function createEventMock(): {
  addEventListener: (event: string, handler: () => void) => void;
  removeEventListener: (event: string, handler: () => void) => void;
  dispatchEvent: (event: string, data?: unknown) => void;
} {
  const listeners = new Map<string, Array<() => void>>();

  return {
    addEventListener: (event: string, handler: () => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)?.push(handler);
    },
    removeEventListener: (event: string, handler: () => void) => {
      const handlers = listeners.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    },
    dispatchEvent: (event: string, _data?: unknown) => {
      const handlers = listeners.get(event) || [];
      handlers.forEach(handler => handler());
    },
  };
}
