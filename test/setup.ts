/**
 * Vitest 테스트 환경 설정
 * 새로운 모듈화된 테스트 인프라 사용
 */

/* eslint-disable no-undef */

// ================================
// Solid.js 클라이언트 모드 설정 (모든 import 전에!)
// ================================

// Solid.js가 브라우저 환경으로 인식하도록 설정
// SSR 플래그를 false로 명시적으로 설정
type SolidHydrationRuntime = {
  _$HY?: {
    running: boolean;
    context: unknown;
    owner: unknown;
  };
  IS_SERVER?: boolean;
  _SERVER_?: boolean;
};

if (typeof globalThis !== 'undefined') {
  const solidRuntime = globalThis as typeof globalThis & SolidHydrationRuntime;
  solidRuntime._$HY = solidRuntime._$HY || {
    running: false,
    context: null,
    owner: null,
  };
  solidRuntime.IS_SERVER = false;
  solidRuntime._SERVER_ = false;
}

// Node 환경 변수도 설정
if (typeof process !== 'undefined' && process.env) {
  process.env.SSR = 'false';
  process.env.IS_SERVER = 'false';
}

// ================================
// 전역 __DEV__ 변수 설정 (logger.ts에서 사용)
// ================================
if (typeof globalThis !== 'undefined') {
  (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = true;
  (globalThis as typeof globalThis & { __IS_DEV__?: boolean }).__IS_DEV__ = true;
}

// ================================
// Feature Flags 설정
// ================================
if (typeof globalThis !== 'undefined') {
  (
    globalThis as typeof globalThis & { __FEATURE_MEDIA_EXTRACTION__?: boolean }
  ).__FEATURE_MEDIA_EXTRACTION__ = true;
}

// ================================
// 전역 imports
// ================================

import '@testing-library/jest-dom';
// JSDOM helper: add HTMLElement.asImage() used by some tests for convenience
if (typeof window !== 'undefined') {
  (HTMLElement as any).prototype.asImage = function (): HTMLImageElement | null {
    return this instanceof HTMLImageElement ? (this as HTMLImageElement) : null;
  };
}
import { beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './__mocks__/test-environment.js';
import { setupGlobalMocks, resetMockApiState } from './__mocks__/userscript-api.mock.js';
import { URL as NodeURL } from 'node:url';

// ================================
// 전역 테스트 환경 설정
// ================================

// URL 생성자 폴백 - Node.js URL 직접 사용
function createURLPolyfill() {
  // ESM 환경에서 URL 생성자 확보
  // happy-dom이 제공하는 URL이 있으면 우선 사용, 없으면 Node URL 사용
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
const vendorInitializationPromise = (async () => {
  try {
    const vendors = await import('../src/shared/external/vendors/index.ts');
    if (typeof vendors.initializeVendors === 'function') {
      await vendors.initializeVendors();
    }
  } catch {
    // 테스트 환경에서만 사용되므로 실패해도 치명적이지 않음
  }
})();

// 테스트 전역 로그 레벨을 낮추기 위한 별도 API는 제거됨 (Phase 420)

// happy-dom 환경 호환성 향상을 위한 polyfill 설정
function setupTestEnvironmentPolyfills() {
  // window.scrollTo polyfill (happy-dom에서 부분 지원)
  if (typeof globalThis.window !== 'undefined' && !globalThis.window.scrollTo) {
    globalThis.window.scrollTo = function (
      optionsOrX?: ScrollToOptions | number,
      y?: number
    ): void {
      if (typeof optionsOrX === 'object') {
        globalThis.window.scrollX = optionsOrX.left || 0;
        globalThis.window.scrollY = optionsOrX.top || 0;
      } else {
        globalThis.window.scrollX = optionsOrX || 0;
        globalThis.window.scrollY = y || 0;
      }
    };
  }

  // navigation API polyfill (happy-dom 테스트 환경 호환성)
  if (typeof globalThis.window !== 'undefined') {
    (globalThis.window as any).navigation = {
      navigate: () => Promise.resolve(),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  // document.elementsFromPoint polyfill (happy-dom 테스트 환경 호환성)
  if (typeof globalThis.document !== 'undefined' && !globalThis.document.elementsFromPoint) {
    globalThis.document.elementsFromPoint = function (_x: number, _y: number): Element[] {
      // 테스트 환경에서는 빈 배열 반환
      return [];
    };
  }

  // matchMedia polyfill 강화
  if (typeof globalThis.window !== 'undefined' && !globalThis.window.matchMedia) {
    globalThis.window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
      }) as MediaQueryList;
  }

  // IntersectionObserver polyfill (happy-dom 테스트 환경 호환성)
  if (typeof globalThis.window !== 'undefined' && !globalThis.window.IntersectionObserver) {
    const createDomRectReadOnly = (size: number): DOMRectReadOnly =>
      ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: size,
        bottom: size,
        width: size,
        height: size,
        toJSON: () => ({
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: size,
          bottom: size,
          width: size,
          height: size,
        }),
      }) as DOMRectReadOnly;

    (globalThis.window as any).IntersectionObserver = class MockIntersectionObserver {
      callback: IntersectionObserverCallback;
      options: IntersectionObserverInit | undefined;
      root: Element | Document | null;
      rootMargin: string;
      thresholds: readonly number[];
      _observing: Set<Element>;
      _isDisconnected: boolean;

      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.options = options ?? undefined;
        this.root = options?.root || null;
        this.rootMargin = options?.rootMargin || '0px';
        this.thresholds = Array.isArray(options?.threshold)
          ? options.threshold
          : [options?.threshold || 0];
        this._observing = new Set();
        this._isDisconnected = false;
      }

      observe(element: Element): void {
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
                    boundingClientRect: createDomRectReadOnly(100),
                    intersectionRect: createDomRectReadOnly(100),
                    rootBounds: createDomRectReadOnly(1000),
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

      unobserve(element: Element): void {
        if (element && this._observing.has(element)) {
          this._observing.delete(element);
        }
      }

      disconnect(): void {
        this._isDisconnected = true;
        this._observing.clear();
      }

      takeRecords(): IntersectionObserverEntry[] {
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

  // 네비게이션 기능 안전 처리: assign/replace를 안전 스텁으로
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
    globalThis.window = {} as Window & typeof globalThis;
  }

  // 안전한 document 객체 설정 - body 포함
  if (!globalThis.document || typeof globalThis.document !== 'object') {
    // 최소 document 구현을 제공하여 스파이 설정이 실패하지 않도록 함
    globalThis.document = {
      body: { innerHTML: '' } as unknown as HTMLBodyElement,
      createElement: ((tagName: string) =>
        ({
          innerHTML: '',
          tagName: String(tagName).toUpperCase(),
        }) as unknown as HTMLElement) as Document['createElement'],
      querySelector: (() => null) as Document['querySelector'],
      querySelectorAll: (() =>
        [] as unknown as NodeListOf<Element>) as Document['querySelectorAll'],
      addEventListener: (() => {}) as Document['addEventListener'],
      removeEventListener: (() => {}) as Document['removeEventListener'],
    } as unknown as Document;
  } else if (!globalThis.document.body) {
    globalThis.document.body = { innerHTML: '' } as unknown as HTMLBodyElement;
  }

  // document.body가 안전하게 설정되었는지 다시 확인
  if (globalThis.document.body && typeof globalThis.document.body !== 'object') {
    globalThis.document.body = { innerHTML: '' } as unknown as HTMLBodyElement;
  }

  // 안전한 location 객체 설정
  if (!globalThis.location || typeof globalThis.location !== 'object') {
    globalThis.location = {
      href: 'https://x.com',
      hostname: 'x.com',
      pathname: '/',
      search: '',
    } as unknown as Location;
  }

  // happy-dom polyfill 적용
  setupTestEnvironmentPolyfills();

  // 콘솔 필터: 테스트 환경의 알려진 경고를 억제
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

  await vendorInitializationPromise;

  // Vendor 초기화 - 모든 테스트에서 사용할 수 있도록
  try {
    const { initializeVendors } = await import('../src/shared/external/vendors/index.js');
    await initializeVendors();
  } catch (error) {
    // vendor 초기화 실패는 무시하고 계속 진행
  }

  // 기본 테스트 환경 설정 (minimal)
  await setupTestEnvironment();
});

/**
 * 각 테스트 후에 환경 정리
 * 메모리 누수 방지 및 테스트 격리 보장 (Phase 200: 강화)
 */
afterEach(async () => {
  // Mock API 상태 초기화
  resetMockApiState();

  await cleanupTestEnvironment();

  // Phase 200: 추가 메모리 정리
  // 테스트 후 가비지 컬렉션 힌트 제공
  if (typeof gc !== 'undefined') {
    try {
      gc();
    } catch {
      // gc() 호출 실패해도 무시
    }
  }
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
