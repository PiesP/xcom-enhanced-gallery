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
// Preact 훅 환경 안정화 (turbo 모드에서 __H/"Cannot read properties of undefined" 문제 방지)
import { setupUltimatePreactTestEnvironment } from './utils/mocks/ultimate-preact-environment.js';
import { ensureScrollAPIs, ensureNavigationAPI } from './utils/mocks/browser-polyfills.js';
import { setupCommonDOMMocks } from './utils/mocks/common-dom-mocks.js';

// 중요: hooks-bundled 등 모듈이 로드되기 전에 Preact 모듈을 mock 해야 합니다.
// setupFiles는 테스트 파일 로딩 전에 실행되므로, 여기서 즉시 호출하여 vi.mock을 등록합니다.
setupUltimatePreactTestEnvironment();

// DOM API 전역 설정
beforeAll(() => {
  // 브라우저 환경 설정
  setupBrowserEnvironment();

  // 공용 폴리필 적용
  ensureScrollAPIs(window as any);
  ensureNavigationAPI(window as any);

  // 공통 DOM 모킹 적용 (matchMedia/Observers/RAF/CSS.supports 등)
  setupCommonDOMMocks(window as any);

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

  // CSS.supports는 setupCommonDOMMocks에서 처리됨

  // URL 설정은 browser-environment.mock에서 안전하게 처리합니다 (재정의 금지)

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
