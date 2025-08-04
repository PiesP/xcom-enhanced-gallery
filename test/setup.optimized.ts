/**
 * @fileoverview 최적화된 테스트 환경 설정
 * @description 통합된 테스트 구조에 맞는 환경 설정
 * @version 1.0.0 - Optimized Setup
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/dom';

// 브라우저 환경 Mock 설정
import {
  setupBrowserEnvironment,
  clearBrowserEnvironment,
} from './__mocks__/browser-environment.mock';

// DOM API 전역 설정
beforeAll(() => {
  // 브라우저 환경 설정
  setupBrowserEnvironment();

  // JSDOM 환경 설정
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // ResizeObserver 모킹
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // IntersectionObserver 모킹
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // requestAnimationFrame 모킹
  global.requestAnimationFrame = vi.fn(callback => {
    return setTimeout(callback, 16);
  });

  global.cancelAnimationFrame = vi.fn(id => {
    clearTimeout(id);
  });

  // Performance API 모킹 (더 완전한 버전)
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    } as any;
  }

  // CSS.supports 모킹
  if (!global.CSS) {
    global.CSS = {
      supports: vi.fn((property: string) => {
        // 기본적인 CSS 기능들은 지원하는 것으로 가정
        const supportedFeatures = [
          'container-type',
          'color',
          'margin-inline-start',
          'contain',
          'grid-template-rows',
          'layer',
        ];
        return supportedFeatures.includes(property);
      }),
    } as any;
  }

  // URL 모킹
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://x.com/home',
      hostname: 'x.com',
      pathname: '/home',
      search: '',
      hash: '',
    },
    writable: true,
  });

  // 사용자 스크립트 API 모킹
  global.GM_setValue = vi.fn();
  global.GM_getValue = vi.fn();
  global.GM_deleteValue = vi.fn();
  global.GM_listValues = vi.fn(() => []);
  global.GM_download = vi.fn();
  global.GM_xmlhttpRequest = vi.fn();

  // 콘솔 최적화 (테스트 중 불필요한 로그 제거)
  if (process.env.NODE_ENV === 'test') {
    console.debug = vi.fn();
    console.info = vi.fn();
  }
});

// 각 테스트 전 초기화
beforeEach(() => {
  // DOM 초기화 (안전하게)
  if (document.body) {
    document.body.innerHTML = '';
  }
  if (document.head) {
    document.head.innerHTML = '';
  }

  // Mock 초기화
  vi.clearAllMocks();

  // 타이머 초기화
  vi.clearAllTimers();
  vi.useFakeTimers();
});

// 각 테스트 후 정리
afterEach(() => {
  // DOM 정리
  if (typeof cleanup === 'function') {
    cleanup();
  }

  // 브라우저 환경 정리
  clearBrowserEnvironment();

  // 타이머 정리
  vi.useRealTimers();

  // 이벤트 리스너 정리
  document.removeAllListeners?.();

  // Mock 정리
  vi.restoreAllMocks();
});

// 전체 테스트 종료 후 정리
afterAll(() => {
  // 글로벌 정리
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// 테스트 헬퍼 함수들
export const testHelpers = {
  /**
   * 비동기 작업 대기
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * DOM 요소 생성 헬퍼
   */
  createElement: (tag: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },

  /**
   * 이벤트 발생 헬퍼
   */
  fireEvent: (element: Element, eventType: string, options: any = {}) => {
    const event = new Event(eventType, { bubbles: true, ...options });
    element.dispatchEvent(event);
  },

  /**
   * Mock 함수 실행 검증 헬퍼
   */
  expectMockCalled: (mockFn: any, times: number = 1) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
  },

  /**
   * 성능 측정 헬퍼
   */
  measurePerformance: async (fn: () => Promise<void> | void) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },

  /**
   * 메모리 사용량 측정 헬퍼 (모킹)
   */
  getMemoryUsage: () => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return Math.random() * 1000000; // 테스트용 랜덤값
  },
};

// 전역 타입 확장
declare global {
  var GM_setValue: typeof vi.fn;
  var GM_getValue: typeof vi.fn;
  var GM_deleteValue: typeof vi.fn;
  var GM_listValues: typeof vi.fn;
  var GM_download: typeof vi.fn;
  var GM_xmlhttpRequest: typeof vi.fn;

  interface Document {
    removeAllListeners?(): void;
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// 환경 정보 출력 (디버그용)
if (process.env.NODE_ENV === 'test' && process.env.VITEST_DEBUG) {
  console.log('🧪 최적화된 테스트 환경이 초기화되었습니다.');
  console.log('📊 통합 테스트 모드: 활성화');
  console.log('⚡ 성능 최적화: 활성화');
}
