/**
 * Vitest 테스트 환경 설정
 * 새로운 모듈화된 테스트 인프라 사용
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment.js';
import { setupGlobalMocks, resetMockApiState } from './__mocks__/userscript-api.mock.js';

// URL polyfill import - 비동기 초기화
import { setupURLPolyfill } from './polyfills/url-polyfill.js';

// ================================
// 전역 테스트 환경 설정
// ================================

// URL polyfill을 즉시 설정
(async () => {
  await setupURLPolyfill();
})();

// jsdom 환경 호환성 향상을 위한 polyfill 설정
function setupJsdomPolyfills() {
  // window.scrollTo polyfill (jsdom에서 지원하지 않음)
  if (typeof globalThis.window !== 'undefined' && !globalThis.window.scrollTo) {
    globalThis.window.scrollTo = function (x, y) {
      // 테스트에서는 실제 스크롤이 필요하지 않으므로 빈 함수로 구현
      globalThis.window.scrollX = x || 0;
      globalThis.window.scrollY = y || 0;
    };
  }

  // navigation API polyfill (jsdom limitation)
  if (typeof globalThis.window !== 'undefined' && !globalThis.window.navigation) {
    globalThis.window.navigation = {
      navigate: () => Promise.resolve(),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  // document.elementsFromPoint polyfill (jsdom limitation)
  if (typeof globalThis.document !== 'undefined' && !globalThis.document.elementsFromPoint) {
    globalThis.document.elementsFromPoint = function () {
      // 테스트 환경에서는 빈 배열 반환
      return [];
    };
  }

  // matchMedia polyfill 강화
  if (typeof globalThis.window !== 'undefined' && !globalThis.window.matchMedia) {
    globalThis.window.matchMedia = function (query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function () {},
        removeListener: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () {
          return true;
        },
      };
    };
  }

  // IntersectionObserver polyfill (jsdom limitation)
  if (typeof globalThis.window !== 'undefined' && !globalThis.window.IntersectionObserver) {
    globalThis.window.IntersectionObserver = class MockIntersectionObserver {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.root = options?.root || null;
        this.rootMargin = options?.rootMargin || '0px';
        this.thresholds = Array.isArray(options?.threshold)
          ? options.threshold
          : [options?.threshold || 0];
        this._observing = new Set();
        this._isDisconnected = false;
      }

      observe(element) {
        if (element && typeof element === 'object' && !this._isDisconnected) {
          this._observing.add(element);

          // 안전한 비동기 콜백 실행 - 무한 루프 방지
          if (this.callback && !this._isDisconnected) {
            // 다음 틱에서 실행하여 동기적 무한 루프 방지
            globalThis.setTimeout(() => {
              if (!this._isDisconnected && this._observing.has(element)) {
                try {
                  this.callback(
                    [
                      {
                        target: element,
                        isIntersecting: true,
                        intersectionRatio: 1,
                        boundingClientRect: {
                          top: 0,
                          left: 0,
                          right: 100,
                          bottom: 100,
                          width: 100,
                          height: 100,
                        },
                        intersectionRect: {
                          top: 0,
                          left: 0,
                          right: 100,
                          bottom: 100,
                          width: 100,
                          height: 100,
                        },
                        rootBounds: {
                          top: 0,
                          left: 0,
                          right: 1000,
                          bottom: 1000,
                          width: 1000,
                          height: 1000,
                        },
                        time: Date.now(),
                      },
                    ],
                    this
                  );
                } catch (error) {
                  // 콜백 에러를 무시하여 테스트 안정성 확보
                  globalThis.console.warn('IntersectionObserver 콜백 에러 (무시됨):', error);
                }
              }
            }, 0);
          }
        }
      }

      unobserve(element) {
        if (element && this._observing.has(element)) {
          this._observing.delete(element);
        }
      }

      disconnect() {
        this._isDisconnected = true;
        this._observing.clear();
      }

      takeRecords() {
        return [];
      }
    };
  }

  // 전역 범위에서도 IntersectionObserver 사용 가능하도록 설정
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    globalThis.IntersectionObserver = globalThis.window?.IntersectionObserver;
  }
}

// 기본적인 브라우저 환경 설정 강화
if (typeof globalThis !== 'undefined') {
  // 안전한 window 객체 설정
  if (!globalThis.window || typeof globalThis.window !== 'object') {
    globalThis.window = {};
  }

  // 안전한 document 객체 설정 - body 포함
  if (!globalThis.document || typeof globalThis.document !== 'object') {
    globalThis.document = {
      body: { innerHTML: '' },
      createElement: () => ({ innerHTML: '' }),
      querySelector: () => null,
      querySelectorAll: () => [],
    };
  } else if (!globalThis.document.body) {
    globalThis.document.body = { innerHTML: '' };
  }

  // document.body가 안전하게 설정되었는지 다시 확인
  if (globalThis.document.body && typeof globalThis.document.body !== 'object') {
    globalThis.document.body = { innerHTML: '' };
  }

  // 안전한 location 객체 설정
  if (!globalThis.location || typeof globalThis.location !== 'object') {
    globalThis.location = {
      href: 'https://x.com',
      hostname: 'x.com',
      pathname: '/',
      search: '',
    };
  }

  // jsdom polyfill 적용
  setupJsdomPolyfills();
}

/**
 * 각 테스트 전에 기본 환경 설정
 * 모든 테스트가 깨끗한 환경에서 실행되도록 보장
 */
beforeEach(async () => {
  // Mock API 연결 활성화
  setupGlobalMocks();

  // URL 생성자 다시 확인 및 설정 (polyfill에서 이미 설정했지만 한번 더 확인)
  if (!globalThis.URL || typeof globalThis.URL !== 'function') {
    await setupURLPolyfill();
  }

  // Vendor 초기화 - 모든 테스트에서 사용할 수 있도록
  try {
    const { initializeVendors } = await import('../src/shared/external/vendors/vendor-api.js');
    await initializeVendors();
  } catch {
    // vendor 초기화 실패는 무시하고 계속 진행
  }

  // 기본 테스트 환경 설정 (minimal)
  await setupTestEnvironment();
});

/**
 * 각 테스트 후에 환경 정리
 * 메모리 누수 방지 및 테스트 격리 보장
 */
afterEach(async () => {
  // Mock API 상태 초기화
  resetMockApiState();

  await cleanupTestEnvironment();
});

// ================================
// 환경 사용 가이드
// ================================
// 이 파일은 vitest.config.ts의 setupFiles에서 자동으로 로드됩니다
// 개별 테스트에서 특별한 환경이 필요한 경우:
// - setupComponentTestEnvironment() : DOM + 브라우저 확장 + 컴포넌트 환경
// - setupBrowserTestEnvironment() : DOM + 브라우저 확장 환경
// - setupTestEnvironment() : 모든 환경 + 샘플 데이터
// - setupMinimalEnvironment() : 기본 환경 (기본값)
