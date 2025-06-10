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
import { beforeAll, afterEach } from 'vitest';

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

  // CustomEvent polyfill for jsdom
  if (typeof global.CustomEvent === 'undefined') {
    global.CustomEvent = class CustomEvent extends Event {
      public detail: any;

      constructor(typeArg: string, customEventInitDict?: CustomEventInit) {
        super(typeArg, customEventInitDict);
        this.detail = customEventInitDict?.detail;
      }
    };
  }

  // requestIdleCallback polyfill
  if (typeof global.requestIdleCallback === 'undefined') {
    global.requestIdleCallback = (callback: IdleRequestCallback) => {
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
    global.cancelIdleCallback = (id: number) => {
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
  // DOM 정리
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // 모든 timers 정리
  vi.clearAllTimers();
  vi.clearAllMocks();

  // localStorage 정리
  if (global.localStorage) {
    global.localStorage.clear();
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

/**
 * 전역 타입 선언
 */
declare global {
  const vi: typeof import('vitest').vi;
}
