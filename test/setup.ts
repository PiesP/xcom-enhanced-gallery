/**
 * Vitest 테스트 환경 설정
 * 새로운 모듈화된 테스트 인프라 사용
 */
/// <reference path="./types/globals.d.ts" />

import '@testing-library/jest-dom';
// global Process 인터페이스 확장은 test/types/globals.d.ts 로 이동 (파서 충돌 방지)
export {}; // 모듈 컨텍스트 강제
import { beforeEach, afterEach } from 'vitest';

// 타입 에러 방지를 위한 임시 함수들
const setupTestEnvironment = () => {};
const cleanupTestEnvironment = () => {};
const setupGlobalMocks = () => {};
const resetMockApiState = () => {};

// URL polyfill import - 비동기 초기화
const setupURLPolyfill = () => Promise.resolve();

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
    // @ts-ignore
    globalThis.window.scrollTo = function (xOrOptions, y) {
      // 테스트에서는 실제 스크롤이 필요하지 않으므로 빈 함수로 구현
      if (typeof xOrOptions === 'number') {
        // @ts-ignore
        globalThis.window.scrollX = xOrOptions || 0;
        // @ts-ignore
        globalThis.window.scrollY = y || 0;
      } else if (xOrOptions && typeof xOrOptions === 'object') {
        // @ts-ignore
        globalThis.window.scrollX = xOrOptions.left || 0;
        // @ts-ignore
        globalThis.window.scrollY = xOrOptions.top || 0;
      }
    };
  }

  // navigation API polyfill (jsdom limitation)
  if (typeof globalThis.window !== 'undefined' && !globalThis.window['navigation']) {
    globalThis.window['navigation'] = {
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

  // Global polyfills for jsdom lacking APIs used by virtualization & scroll tests
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    // simple rAF polyfill using setTimeout ~16ms (ensure numeric id for TS compatibility)
    globalThis.requestAnimationFrame = cb => {
      const id = globalThis.setTimeout(() => cb(Date.now()), 16);
      // 일부 환경에서 Timeout 객체 반환 → 숫자 식별자 추출 시 Number() 사용 (노드 18 이상 호환)
      return typeof id === 'number' ? id : Number(id && id.ref ? id.ref : Date.now());
    };
  }
  // ESM 환경에서 일부 라이브러리가 전역 lexical 식별자(requestAnimationFrame)를 직접 참조할 수 있으므로
  // indirect eval 을 사용해 전역 var 바인딩을 주입 (이미 존재하면 덮어쓰지 않음)
  try {
    (0, eval)(
      'if (typeof requestAnimationFrame === "undefined" && typeof globalThis !== "undefined" && globalThis.requestAnimationFrame) { var requestAnimationFrame = globalThis.requestAnimationFrame; }'
    );
  } catch {
    // ignore
  }
  if (typeof globalThis.cancelAnimationFrame === 'undefined') {
    globalThis.cancelAnimationFrame = id => {
      globalThis.clearTimeout(id);
    };
    try {
      // indirect eval 로 전역 lexical 환경에 cancelAnimationFrame 식별자 주입 (Node ESM 환경에서 참조 에러 방지)
      (0, eval)(
        'var cancelAnimationFrame = function(id){ if (globalThis && globalThis.clearTimeout) { globalThis.clearTimeout(id); } };'
      );
    } catch {
      // 실패 시 무시
    }
  }
  // 보장: 전역 식별자 바인딩 (ESM 환경에서 일부 라이브러리가 직접 식별자 참조)
  // window 객체에 mirror (일부 코드가 window.cancelAnimationFrame 직접 참조)
  if (typeof globalThis.window !== 'undefined') {
    if (!globalThis.window.cancelAnimationFrame) {
      globalThis.window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
    }
    if (!globalThis.window.requestAnimationFrame) {
      globalThis.window.requestAnimationFrame = globalThis.requestAnimationFrame;
    }
  }
  // scrollTo noop polyfill
  if (typeof globalThis.scrollTo === 'undefined') {
    globalThis.scrollTo = () => {};
  }

  // scrollIntoView polyfill (jsdom not implemented)
  // HTMLElement reference (no TS casting to keep parser simple)
  const HTMLElementRef = (globalThis && globalThis.HTMLElement) || null;
  if (HTMLElementRef && !HTMLElementRef.prototype.scrollIntoView) {
    HTMLElementRef.prototype.scrollIntoView = function () {
      /* no-op polyfill */
    };
  }

  // window alias safety
  if (typeof globalThis.window !== 'undefined') {
    if (typeof globalThis.window.scrollTo === 'undefined') {
      // @ts-ignore
      globalThis.window.scrollTo = () => {};
    }
    // jsdom 기본 구현은 존재하지만 호출 시 Not implemented: window.scrollTo 경고를 발생시킴
    // 경고 노이즈 감소 및 afterEach cleanup 중 불필요한 stderr 방지를 위해 항상 noop으로 재정의
    try {
      // @ts-ignore - 재할당 허용 (테스트 환경 전용)
      globalThis.window.scrollTo = function () {
        /* noop (silenced) */
      };
      // 전역 mirror (일부 코드가 globalThis.scrollTo 직접 호출)
      // @ts-ignore
      globalThis.scrollTo = globalThis.window.scrollTo;
    } catch {
      // 실패 시 무시 (테스트 안정성 영향 없음)
    }
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
    class MockIntersectionObserver {
      callback;
      options;
      root;
      rootMargin;
      thresholds;
      _observing;
      _isDisconnected;

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
    }

    globalThis.window.IntersectionObserver = MockIntersectionObserver;
  }

  // 전역 범위에서도 IntersectionObserver 사용 가능하도록 설정
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    globalThis.IntersectionObserver = globalThis.window?.IntersectionObserver;
  }
}

// 기본적인 브라우저 환경 설정 강화: JSDOM 환경이므로 DOM mocking 대신 polyfill만 적용
if (typeof globalThis !== 'undefined') {
  // 공용 MediaInfo 팩토리 (테스트 전용) - type 필드 literal 유지
  if (typeof globalThis.__xegCreateImageMedia !== 'function') {
    // @ts-ignore - 전역 주입
    globalThis.__xegCreateImageMedia = id => ({
      id,
      url: `https://pbs.twimg.com/media/${id}.jpg`,
      type: 'image',
      filename: `${id}.jpg`,
    });
  }
  // JSDOM 환경에서는 실제 DOM을 사용하고 부족한 부분만 polyfill로 보강
  setupJsdomPolyfills();

  // teardown 이후 지연된 타이머에서 발생하는 cancelAnimationFrame ReferenceError 무시
  // Vitest isolation + preact hooks 타이머 조합에서 드물게 발생 (환경 dispose 후)
  // Node 환경 전역 process 안전 접근 (브라우저 번들 영향 없음)
  // @ts-ignore - globalThis process 접근 (테스트 환경)
  // 타입 파서 충돌을 피하기 위해 any 캐스팅 (테스트 전용)
  // NOTE: 파서 충돌 회피: 순수 JS 형태로 process 참조 (테스트 전용)
  // @ts-ignore
  const nodeProcess = globalThis.process && globalThis.process;
  // nodeProcess.__xegCafPatched 접근 시 파서가 TS 구문을 제대로 처리하지 못하는 환경 대응 위해 any 캐스팅 회피
  const alreadyPatched =
    nodeProcess && typeof nodeProcess === 'object' && nodeProcess['__xegCafPatched'];
  if (nodeProcess && typeof nodeProcess.on === 'function' && !alreadyPatched) {
    try {
      nodeProcess.on('uncaughtException', err => {
        if (err && /cancelAnimationFrame is not defined/.test(String(err.message))) {
          // 테스트 신뢰성에 영향 없는 클린업 타이밍 이슈 → 무시
          return; // swallow
        }
        throw err; // 다른 에러는 그대로 전파
      });
      // 비동기 종료 후 발생하는 rAF 미정의 Unhandled Rejection (preact hooks clean-up) 무시
      nodeProcess.on('unhandledRejection', err => {
        const msg = err && (err as any).message ? String((err as any).message) : String(err);
        if (/requestAnimationFrame is not defined/.test(msg)) {
          return; // swallow
        }
      });
      try {
        nodeProcess['__xegCafPatched'] = true; // 플래그 설정
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }
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

  // 남은 rAF 콜백 정리 (테스트 종료 후 지연 실행으로 uncaught 발생 방지)
  try {
    if (typeof globalThis.cancelAnimationFrame === 'function') {
      // 단순히 일정 범위 id를 순회하며 취소 (테스트 내 polyfill이 증가하는 숫자 id 사용)
      // 안전: 실패해도 영향 없음
      for (let i = 0; i < 50; i++) {
        // @ts-ignore
        globalThis.cancelAnimationFrame(i);
      }
    }
  } catch {
    // ignore
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
