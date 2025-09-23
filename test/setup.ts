/**
 * Vitest 테스트 환경 설정
 * 새로운 모듈화된 테스트 인프라 사용
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach } from 'vitest';
import { globalTimerManager } from '@/shared/utils/timer-management';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment.js';
import { setupGlobalMocks, resetMockApiState } from './__mocks__/userscript-api.mock.js';

// ================================
// 전역 테스트 환경 설정
// ================================

// URL 생성자 폴백 - Node.js URL 직접 사용
function createURLPolyfill() {
  // Node 18+ 환경에서는 기본적으로 globalThis.URL 존재
  if (typeof globalThis.URL === 'function') return globalThis.URL as any;

  // fallback implementation (단순 파서)
  function URLConstructor(this: any, url: string) {
    if (!(this instanceof URLConstructor)) {
      return new (URLConstructor as any)(url);
    }
    const urlRegex = /^(https?):\/\/([^/]+)(\/[^?]*)?\??(.*)$/;
    const match = url.match(urlRegex);
    if (!match) throw new Error('Invalid URL');
    const [, protocol, hostname, pathname = '/', search = ''] = match;
    this.protocol = `${protocol}:`;
    this.hostname = hostname;
    this.pathname = pathname;
    this.search = search ? `?${search}` : '';
    this.href = url;
    this.toString = () => this.href;
    return this;
  }
  return URLConstructor as any;
}

// URL 폴백 설정
function setupURLPolyfill() {
  const URLPolyfill = createURLPolyfill();

  // globalThis 레벨에 설정
  globalThis.URL = URLPolyfill;

  // window 레벨에도 설정 (안전하게)
  try {
    if (typeof globalThis.window !== 'undefined') {
      (globalThis as any).window.URL = URLPolyfill;
    }
  } catch {
    // 무시
  }

  // global 레벨에도 설정 (안전하게)
  try {
    if (typeof (globalThis as any).global !== 'undefined') {
      (globalThis as any).global.URL = URLPolyfill;
    }
  } catch {
    // 무시
  }
}

// URL 폴백 설정 실행
setupURLPolyfill();

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
              if (typeof globalThis.console !== 'undefined') {
                globalThis.console.warn('IntersectionObserver 콜백 에러 (무시됨):', error);
              }
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
      const needsPolyfill =
        typeof proto.toDataURL !== 'function' ||
        // 일부 jsdom 버전은 함수가 존재하더라도 호출 시 Not implemented를 던짐
        // 안전하게 오버라이드하여 테스트 노이즈를 제거
        /not implemented/i.test(String(proto.toDataURL));

      if (needsPolyfill) {
        proto.toDataURL = function toDataURL(type?: string) {
          const mime = typeof type === 'string' ? type.toLowerCase() : 'image/png';
          const isWebp = mime.includes('webp');
          // 최소한의 dataURL(내용은 중요하지 않음) 반환
          return `data:${isWebp ? 'image/webp' : 'image/png'};base64,AAAA`;
        };
      }
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

  // requestAnimationFrame 폴리필 (마이크로태스크 기반으로 flush를 teardown 이전에 앞당김)
  if (typeof globalThis.requestAnimationFrame !== 'function') {
    (globalThis as any).requestAnimationFrame = (cb: () => void) => {
      // queueMicrotask 사용: next frame을 최대한 빨리 실행시켜 effect cleanup 레이스 감소
      const run = () => {
        try {
          const nowProvider = (globalThis as any).performance;
          cb(nowProvider && typeof nowProvider.now === 'function' ? nowProvider.now() : Date.now());
        } catch {
          // 무시
        }
      };
      const qm = (globalThis as any).queueMicrotask;
      if (typeof qm === 'function') {
        qm(run);
        // id 의미 없음 - clear에 대비해 심볼 반환
        return -1 as unknown as number;
      }
      return (globalThis as any).setTimeout(run, 0);
    };
  }
  if (typeof globalThis.cancelAnimationFrame !== 'function') {
    (globalThis as any).cancelAnimationFrame = (id: number) => {
      if (id !== -1 && (globalThis as any).clearTimeout) {
        (globalThis as any).clearTimeout(id);
      }
    };
  }

  // window / global 객체에 동기화 (일부 라이브러리가 window.cancelAnimationFrame 직접 참조)
  try {
    const win: any = (globalThis as any).window;
    if (win && typeof win === 'object') {
      if (typeof win.requestAnimationFrame !== 'function') {
        win.requestAnimationFrame = (globalThis as any).requestAnimationFrame;
      }
      if (typeof win.cancelAnimationFrame !== 'function') {
        win.cancelAnimationFrame = (globalThis as any).cancelAnimationFrame;
      }
    }
  } catch {
    // 무시
  }

  // Node 글로벌 (global)에도 동기화 - 일부 polyfill/라이브러리가 global.* 접근
  try {
    const g: any = (globalThis as any).global || globalThis;
    if (g && typeof g === 'object') {
      if (typeof g.requestAnimationFrame !== 'function') {
        g.requestAnimationFrame = (globalThis as any).requestAnimationFrame;
      }
      if (typeof g.cancelAnimationFrame !== 'function') {
        g.cancelAnimationFrame = (globalThis as any).cancelAnimationFrame;
      }
    }
  } catch {
    // 무시
  }

  // (중요) Vitest teardown이 글로벌 키 delete 시도 → non-configurable이면 오류를 유발하므로
  // 삭제 가능 상태(configurable) 유지. 대신 rAF를 microtask로 빠르게 실행해 잔여 cleanup을 최소화.
}

// teardown 타이밍 레이스로 발생하는 비본질적 rAF 관련 Unhandled Rejection 억제
// 사례: Preact hooks(afterNextFrame)에서 환경 해제 후 requestAnimationFrame 참조 시
// 테스트 신뢰도에 영향을 주지 않도록 해당 패턴만 무시
try {
  const swallowIfBenign = (reason: unknown): boolean => {
    try {
      const message = String((reason as any)?.message ?? reason ?? '');
      return /requestAnimationFrame is not defined/i.test(message);
    } catch {
      return false;
    }
  };

  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('unhandledrejection', (event: any) => {
      if (swallowIfBenign(event?.reason)) {
        try {
          event?.preventDefault?.();
        } catch {}
        globalThis?.console?.warn?.(
          '[test/setup] Swallowed benign unhandled rejection:',
          event?.reason
        );
      }
    });
  }

  // Node/Vitest 백업 핸들러
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.on) {
    (globalThis as any).process.on('unhandledRejection', (reason: unknown) => {
      if (!swallowIfBenign(reason)) {
        // 원래 핸들러로 전파 시도(테스트 러너가 캐치)
        throw reason as any;
      } else {
        globalThis?.console?.warn?.(
          '[test/setup] Swallowed benign unhandled rejection (process):',
          reason
        );
      }
    });
  }
} catch {
  // 무시
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

  // 전역 타이머 정리: 테스트 종료 후 잔여 타이머로 인한 teardown 레이스 방지
  try {
    globalTimerManager.cleanup();
  } catch {
    // 무시: 테스트 안정성 목적
  }

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
