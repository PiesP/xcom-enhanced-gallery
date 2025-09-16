/**
 * Vitest 테스트 환경 설정
 * 새로운 모듈화된 테스트 인프라 사용
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment.js';
import { setupGlobalMocks, resetMockApiState } from './__mocks__/userscript-api.mock.js';
import { URL as NodeURL } from 'node:url';

// ================================
// 전역 테스트 환경 설정
// ================================

// URL 생성자 폴백 - Node.js URL 직접 사용
function createURLPolyfill() {
  // Node.js ESM 환경에서 URL 생성자 확보
  // jsdom이 제공하는 URL이 있으면 우선 사용, 없으면 Node URL 사용
  if (typeof globalThis.URL === 'function') return globalThis.URL as unknown as typeof URL;
  return NodeURL as unknown as typeof URL;
}

// URL 폴백 설정
function setupURLPolyfill() {
  const URLPolyfill = createURLPolyfill();

  // globalThis 레벨에 설정
  globalThis.URL = URLPolyfill;

  // window 레벨에도 설정 (안전하게)
  try {
    if (typeof window !== 'undefined') {
      // @ts-expect-error — jsdom Window type
      window.URL = URLPolyfill;
    }
  } catch {
    // 무시
  }

  // global 레벨에도 설정 (안전하게)
  try {
    if (typeof global !== 'undefined') {
      global.URL = URLPolyfill;
    }
  } catch {
    // 무시
  }
}

// URL 폴백 설정 실행
setupURLPolyfill();

// Vendors 선행 초기화 (모듈 로드 시 1회)
// 자동 초기화 경고/신호 폴백 경고를 줄이기 위해 테스트 시작 전에 초기화합니다.
// 중복 호출은 StaticVendorManager에서 안전하게 처리됩니다.
try {
  // vitest는 ESM을 지원하므로 top-level await 사용 가능
  const vendors = await import('../src/shared/external/vendors/index.ts');
  if (typeof vendors.initializeVendors === 'function') {
    await vendors.initializeVendors();
  }
} catch {
  // 테스트 환경에서만 사용되므로 실패해도 치명적이지 않음
}

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
    globalThis.document.elementsFromPoint = function (x, y) {
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

          // 테스트 안정성을 위해 즉시 콜백 실행
          if (this.callback && !this._isDisconnected && this._observing.has(element)) {
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
              console.warn('IntersectionObserver 콜백 에러 (무시됨):', error);
            }
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

  // HTMLCanvasElement.toDataURL polyfill (jsdom: Not implemented 방지)
  try {
    // jsdom에서는 HTMLCanvasElement가 존재하지만 toDataURL 호출 시 예외를 던질 수 있음
    const CanvasCtor: any = (globalThis as any).HTMLCanvasElement;
    if (CanvasCtor && CanvasCtor.prototype) {
      const proto = CanvasCtor.prototype as any;
      // 항상 안전 래핑: 원본이 있으면 try/catch로 감싸고, 실패 시 폴백 반환
      const originalToDataURL = proto.toDataURL;
      proto.toDataURL = function toDataURL(type?: string) {
        try {
          if (typeof originalToDataURL === 'function') {
            return originalToDataURL.call(this, type);
          }
        } catch {
          // fallthrough to fallback
        }
        const mime = typeof type === 'string' ? type.toLowerCase() : 'image/png';
        const isWebp = mime.includes('webp');
        return `data:${isWebp ? 'image/webp' : 'image/png'};base64,AAAA`;
      };
    }

    // 문서 생성 경로에서도 안전 보장: canvas 생성 시 toDataURL 주입
    const doc: any = (globalThis as any).document;
    if (doc && typeof doc.createElement === 'function') {
      const origCreate = doc.createElement.bind(doc);
      doc.createElement = function (tagName: any, options?: any) {
        const el = origCreate(tagName, options);
        try {
          if (
            el &&
            (String(tagName).toLowerCase?.() === 'canvas' || el.tagName?.toLowerCase() === 'canvas')
          ) {
            if (typeof el.toDataURL !== 'function') {
              el.toDataURL = function toDataURL(type?: string) {
                const mime = typeof type === 'string' ? type.toLowerCase() : 'image/png';
                const isWebp = mime.includes('webp');
                return `data:${isWebp ? 'image/webp' : 'image/png'};base64,AAAA`;
              };
            } else {
              // 기존 구현이 예외를 던지는 경우를 대비해 안전 래핑
              const original = el.toDataURL;
              el.toDataURL = function toDataURL(type?: string) {
                try {
                  return original.call(el, type);
                } catch {
                  const mime = typeof type === 'string' ? type.toLowerCase() : 'image/png';
                  const isWebp = mime.includes('webp');
                  return `data:${isWebp ? 'image/webp' : 'image/png'};base64,AAAA`;
                }
              };
            }
          }
        } catch {
          // 무시
        }
        return el;
      };
    }
  } catch {
    // 무시: 테스트 환경에서만 사용되는 폴리필
  }

  // jsdom navigation not implemented 경고 억제: assign/replace를 안전 스텁으로
  try {
    if (typeof globalThis.window !== 'undefined' && globalThis.window.location) {
      const loc = globalThis.window.location as any;
      if (typeof loc.assign === 'function') {
        try {
          vi.spyOn(loc, 'assign').mockImplementation(() => {});
        } catch {
          loc.assign = () => {};
        }
      } else {
        loc.assign = () => {};
      }

      if (typeof loc.replace === 'function') {
        try {
          vi.spyOn(loc, 'replace').mockImplementation(() => {});
        } catch {
          loc.replace = () => {};
        }
      } else {
        loc.replace = () => {};
      }
    }
  } catch {
    // 무시
  }
}

// 기본적인 브라우저 환경 설정 강화
if (typeof globalThis !== 'undefined') {
  // 안전한 window 객체 설정
  if (!globalThis.window || typeof globalThis.window !== 'object') {
    // 기본 형태의 window 객체 확보
    // @ts-expect-error — define minimal window for tests
    globalThis.window = {};
  }

  // 안전한 document 객체 설정 - body 포함
  if (!globalThis.document || typeof globalThis.document !== 'object') {
    // 최소 document 구현을 제공하여 스파이 설정이 실패하지 않도록 함
    // @ts-expect-error — lightweight document stub for tests
    globalThis.document = {
      body: { innerHTML: '' },
      createElement: () => ({ innerHTML: '' }),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
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

  // 공용 콘솔 필터: jsdom의 알려진 Not implemented 노이즈를 억제
  try {
    const originalError = console.error.bind(console);
    const originalWarn = console.warn.bind(console);
    const shouldSuppress = (args: any[]) => {
      const msg = String(args[0] ?? '').toLowerCase();
      return (
        msg.includes("not implemented: htmlcanvaselement's todataurl() method") ||
        msg.includes('not implemented: navigation to another document')
      );
    };
    console.error = (...args: any[]) => {
      if (shouldSuppress(args)) return; // 억제
      originalError(...args);
    };
    console.warn = (...args: any[]) => {
      if (shouldSuppress(args)) return; // 억제
      originalWarn(...args);
    };
  } catch {
    // 무시
  }
}

/**
 * 각 테스트 전에 기본 환경 설정
 * 모든 테스트가 깨끗한 환경에서 실행되도록 보장
 */
beforeEach(async () => {
  // Mock API 연결 활성화
  setupGlobalMocks();

  // URL 생성자 다시 확인 및 설정
  if (!globalThis.URL || typeof globalThis.URL !== 'function') {
    const URLPolyfill = createURLPolyfill();
    globalThis.URL = URLPolyfill;
  }

  // Vendor 초기화 - 모든 테스트에서 사용할 수 있도록
  try {
    const { initializeVendors } = await import('../src/shared/external/vendors/vendor-api.js');
    await initializeVendors();
  } catch (error) {
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
