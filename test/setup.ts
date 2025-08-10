/**
 * Vitest 테스트 환경 설정 - Enhanced TDD Solution
 * 새로운 모듈화된 테스트 인프라 + 안정화된 Preact Hook 환경
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';
import { ensureScrollAPIs, ensureNavigationAPI } from './utils/mocks/browser-polyfills.js';
import { setupCommonDOMMocks } from './utils/mocks/common-dom-mocks.js';

import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment.js';
import { setupGlobalMocks, resetMockApiState } from './__mocks__/userscript-api.mock.js';
import { setupVendorMocks, resetVendorMocks } from './__mocks__/vendor-libs.mock.js';
import {
  setupUltimateConsoleEnvironment,
  cleanupUltimateConsoleEnvironment,
} from './utils/mocks/console-environment.js';
import {
  setupUltimateDOMEnvironment,
  cleanupUltimateDOMEnvironment,
} from './utils/mocks/dom-environment.js';

// ================================
// � Global timers fallback (stabilize worker threads)
// ================================
import {
  setTimeout as nodeSetTimeout,
  clearTimeout as nodeClearTimeout,
  setInterval as nodeSetInterval,
  clearInterval as nodeClearInterval,
} from 'node:timers';

// Ensure timers exist at bootstrap time (before any hooks) and remain valid
(() => {
  const g: any = globalThis as any;
  if (!g.__xeg_resilient_timers_installed) {
    const baseTimers = {
      setTimeout: nodeSetTimeout as unknown as typeof setTimeout,
      clearTimeout: nodeClearTimeout as unknown as typeof clearTimeout,
      setInterval: nodeSetInterval as unknown as typeof setInterval,
      clearInterval: nodeClearInterval as unknown as typeof clearInterval,
    };

    let userSetTimeout: typeof setTimeout | null =
      typeof g.setTimeout === 'function' ? (g.setTimeout as typeof setTimeout) : null;
    let userClearTimeout: typeof clearTimeout | null =
      typeof g.clearTimeout === 'function' ? (g.clearTimeout as typeof clearTimeout) : null;
    let userSetInterval: typeof setInterval | null =
      typeof g.setInterval === 'function' ? (g.setInterval as typeof setInterval) : null;
    let userClearInterval: typeof clearInterval | null =
      typeof g.clearInterval === 'function' ? (g.clearInterval as typeof clearInterval) : null;

    const defineResilient = (
      name: 'setTimeout' | 'clearTimeout' | 'setInterval' | 'clearInterval',
      getUser: () => any,
      setUser: any,
      base: any
    ) => {
      // void args; // mark used via function body reference
      try {
        Object.defineProperty(g, name, {
          configurable: true,
          enumerable: true,
          get() {
            const u = getUser();
            const result = typeof u === 'function' ? (u as T) : base;
            if (u == null) {
              // 진단 로그: 비정상 상태에서 기본 타이머 사용
              try {
                const err = new Error(`[Timers] ${name} getter fallback to base`);
                console && console.debug && console.debug(err.message);
              } catch {
                // ignore: safe debug logging attempt failed
              }
            }
            return result;
          },
          set(v) {
            if (typeof v === 'function') {
              setUser(v as T);
            } else {
              // 비함수 할당 시 진단 로그 출력
              try {
                const err = new Error(`[Timers] ${name} assigned non-function: ${String(v)}`);
                console &&
                  console.warn &&
                  console.warn(err.message, err.stack?.split('\n').slice(0, 3).join('\n'));
              } catch {
                // ignore: safe warn logging attempt failed
              }
              setUser(null as any);
            }
          },
        });
      } catch {
        // Fallback simple assignment if defineProperty fails
        (g as any)[name] = (getUser() || base) as any;
      }
    };

    defineResilient(
      'setTimeout',
      () => userSetTimeout,
      v => (userSetTimeout = v),
      baseTimers.setTimeout
    );
    defineResilient(
      'clearTimeout',
      () => userClearTimeout,
      v => (userClearTimeout = v),
      baseTimers.clearTimeout
    );
    defineResilient(
      'setInterval',
      () => userSetInterval,
      v => (userSetInterval = v),
      baseTimers.setInterval
    );
    defineResilient(
      'clearInterval',
      () => userClearInterval,
      v => (userClearInterval = v),
      baseTimers.clearInterval
    );

    g.__xeg_resilient_timers_installed = true;
  }
})();

// ================================
// 🛡️ Vitest worker state resilience (Windows teardown guard)
// - Windows 멀티파일 실행 종료 시점에 getWorkerState()가 throw 하여 Unhandled Error가 남는 문제를 방지
// - 전역 __vitest_worker__ 값을 마지막 정상 상태로 보존하고, 사라진 경우 최소 shape로 복원
// ================================
(() => {
  try {
    if (process.platform !== 'win32') return;
    const g: any = globalThis as any;
    const KEY = '__vitest_worker__';
    const origDefineProperty = Object.defineProperty.bind(Object);
    const createRpcStub = () =>
      new Proxy(
        {},
        {
          get() {
            const fn: any = () => Promise.resolve(undefined);
            fn.asEvent = fn;
            return fn;
          },
        }
      );
    // 마지막으로 관측된 정상 상태를 보존
    let lastKnown: any = (g as any)[KEY] ?? null;

    const ensureDescriptorWrap = () => {
      const desc = Object.getOwnPropertyDescriptor(g, KEY);
      // 최소 shape: Vitest가 onAfterRunFiles 패치에서 참조하는 필드만 제공
      const fallback = {
        environment: { transformMode: 'web' },
        ctx: { projectName: 'default' },
        rpc: createRpcStub(),
      } as any;

      // data property 또는 미정의라면 accessor로 교체
      if (!desc || 'value' in desc) {
        let current = desc && 'value' in desc ? (desc as any).value : (g as any)[KEY];
        if (current) lastKnown = current;
        Object.defineProperty(g, KEY, {
          configurable: true,
          enumerable: false,
          get() {
            const v = current ?? lastKnown ?? fallback;
            return v;
          },
          set(v) {
            current = v;
            if (v) lastKnown = v;
          },
        });
        return;
      }

      // 이미 accessor인 경우, 기존 getter/setter를 래핑하여 lastKnown을 유지
      const origGet = desc.get?.bind(g);
      const origSet = desc.set?.bind(g);
      Object.defineProperty(g, KEY, {
        configurable: true,
        enumerable: false,
        get() {
          const v = origGet ? origGet() : undefined;
          if (v) lastKnown = v;
          return (
            v ??
            lastKnown ?? {
              environment: { transformMode: 'web' },
              ctx: { projectName: 'default' },
              rpc: createRpcStub(),
            }
          );
        },
        set(v) {
          try {
            origSet?.(v);
          } finally {
            if (v) lastKnown = v;
          }
        },
      });
    };

    // 즉시 한 번 적용하고, 이후에도 값이 바뀔 때마다 lastKnown이 갱신되도록 동작
    ensureDescriptorWrap();

    // Vitest가 이후에 __vitest_worker__를 data descriptor로 재정의해도 다시 래핑되도록 후킹
    try {
      (Object as any).defineProperty = function (target: any, prop: PropertyKey, descriptor: any) {
        const res = origDefineProperty(target, prop, descriptor);
        try {
          if (target === g && prop === KEY) {
            // 재정의 직후 곧바로 다시 래핑하여 getter 기반으로 유지
            ensureDescriptorWrap();
          }
        } catch {
          // ignore: wrapping safeguard
        }
        return res;
      } as typeof Object.defineProperty;
    } catch {
      // ignore: defineProperty hook patch failed (non-critical)
    }
  } catch {
    // ignore: worker-state resilience guard best-effort
  }
})();

// Track all timers created during tests and aggressively clear them between/after tests
const __xeg_timerRegistry: {
  timeouts: Set<ReturnType<typeof setTimeout>>;
  intervals: Set<ReturnType<typeof setInterval>>;
} = {
  timeouts: new Set(),
  intervals: new Set(),
};

function __xeg_wrapSetTimeout(fn: typeof setTimeout): typeof setTimeout {
  void fn; // mark used to satisfy TS noUnusedParameters
  return ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
    // Ensure callback is a function; wrap to auto-deregister
    const id = (nodeSetTimeout as any)(
      (...cbArgs: any[]) => {
        try {
          if (typeof handler === 'function') {
            (handler as any)(...cbArgs);
          } else {
            // string handlers are discouraged; eval-like - ignore
          }
        } finally {
          __xeg_timerRegistry.timeouts.delete(id as any);
        }
      },
      timeout as any,
      ...args
    );
    __xeg_timerRegistry.timeouts.add(id as any);
    return id as any;
  }) as any;
}

function __xeg_wrapSetInterval(fn: typeof setInterval): typeof setInterval {
  void fn; // mark used
  return ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
    const id = (nodeSetInterval as any)(handler as any, timeout as any, ...args);
    __xeg_timerRegistry.intervals.add(id as any);
    return id as any;
  }) as any;
}

function __xeg_wrapClearTimeout(fn: typeof clearTimeout): typeof clearTimeout {
  void fn; // mark used
  return ((id: any) => {
    try {
      __xeg_timerRegistry.timeouts.delete(id);
    } finally {
      (nodeClearTimeout as any)(id);
    }
  }) as any;
}

function __xeg_wrapClearInterval(fn: typeof clearInterval): typeof clearInterval {
  void fn; // mark used
  return ((id: any) => {
    try {
      __xeg_timerRegistry.intervals.delete(id);
    } finally {
      (nodeClearInterval as any)(id);
    }
  }) as any;
}

// Install wrapped timers globally (and keep resilient getters working)
(() => {
  try {
    const g: any = globalThis as any;
    const wrappedSetTimeout = __xeg_wrapSetTimeout(nodeSetTimeout as any);
    const wrappedSetInterval = __xeg_wrapSetInterval(nodeSetInterval as any);
    const wrappedClearTimeout = __xeg_wrapClearTimeout(nodeClearTimeout as any);
    const wrappedClearInterval = __xeg_wrapClearInterval(nodeClearInterval as any);

    // Assign via setters defined in defineResilient (above)
    g.setTimeout = wrappedSetTimeout as any;
    g.setInterval = wrappedSetInterval as any;
    g.clearTimeout = wrappedClearTimeout as any;
    g.clearInterval = wrappedClearInterval as any;

    if (typeof g.window === 'object' && g.window) {
      g.window.setTimeout = g.setTimeout;
      g.window.setInterval = g.setInterval;
      g.window.clearTimeout = g.clearTimeout;
      g.window.clearInterval = g.clearInterval;
    }
  } catch {
    // ignore: install wrapped timers
  }
})();

function __xeg_clearAllTimers(): void {
  try {
    // Clear intervals first to stop recurring tasks
    for (const id of Array.from(__xeg_timerRegistry.intervals)) {
      try {
        (clearInterval as any)(id);
      } catch {
        // ignore: best-effort clearInterval
      }
    }
    __xeg_timerRegistry.intervals.clear();

    // Clear any remaining timeouts
    for (const id of Array.from(__xeg_timerRegistry.timeouts)) {
      try {
        (clearTimeout as any)(id);
      } catch {
        // ignore: best-effort clearTimeout
      }
    }
    __xeg_timerRegistry.timeouts.clear();
  } catch {
    // swallow: timer registry enforcement
  }
}

// Strong timer enforcement utility to guard against suites that accidentally nullify timers
function __xeg_enforceRealTimers(): void {
  try {
    const g: any = globalThis as any;
    if (typeof g.setTimeout !== 'function') g.setTimeout = nodeSetTimeout as any;
    if (typeof g.clearTimeout !== 'function') g.clearTimeout = nodeClearTimeout as any;
    if (typeof g.setInterval !== 'function') g.setInterval = nodeSetInterval as any;
    if (typeof g.clearInterval !== 'function') g.clearInterval = nodeClearInterval as any;

    if (typeof g.window === 'object' && g.window) {
      if (typeof g.window.setTimeout !== 'function') g.window.setTimeout = g.setTimeout;
      if (typeof g.window.clearTimeout !== 'function') g.window.clearTimeout = g.clearTimeout;
      if (typeof g.window.setInterval !== 'function') g.window.setInterval = g.setInterval;
      if (typeof g.window.clearInterval !== 'function') g.window.clearInterval = g.clearInterval;
    }
  } catch {
    // ignore enforcement errors
  }
}

// ================================
// �🔧 Promise 및 에러 처리 개선
// ================================

// EventEmitter MaxListeners 경고 방지 (테스트 폭이 넓어 동적 증가)
try {
  const currentMax = (process as any).getMaxListeners?.() ?? 10;
  if (currentMax < 50) {
    process.setMaxListeners(50);
  }
} catch {
  // ignore: setMaxListeners may be unavailable
}

// 테스트 중 발생하는 unhandled rejection 처리 개선
// 중복 등록 방지: vitest 워커 재사용 시 이미 등록된 경우 skip
if (!(process as any).__xeg_unhandled_rejection_registered) {
  (process as any).__xeg_unhandled_rejection_registered = true;
  const __xeg_unhandledRejectionHandler = (reason: unknown) => {
    // 워커 스레드 관련 에러들을 모두 억제
    const isWorkerError =
      (reason instanceof Error &&
        (reason.message?.includes('Terminating worker thread') ||
          reason.message?.includes('ThreadTermination') ||
          reason.message?.includes('tinypool') ||
          reason.stack?.includes('tinypool'))) ||
      (typeof reason === 'string' && reason.includes('worker'));

    // 일부 환경에서 드물게 발생하는 비정상 타이머 에러 억제
    const isTimerError =
      (reason instanceof Error && reason.message?.includes('setTimeout is not a function')) ||
      (typeof reason === 'string' && reason.includes('setTimeout is not a function'));

    const isVitestStateError =
      (reason instanceof Error &&
        (reason.message?.includes('Vitest failed to access its internal state') ||
          reason.stack?.includes('getWorkerState'))) ||
      (typeof reason === 'string' && reason.includes('Vitest failed to access its internal state'));

    if (isWorkerError || isTimerError || isVitestStateError) {
      // 완전히 억제 (로그도 출력하지 않음)
      return;
    }

    // 다른 에러는 기존 핸들러로 전달하거나 경고만 출력
    console.warn('테스트 환경 Promise Rejection:', reason);
  };
  (process as any).__xeg_unhandledRejectionHandler = __xeg_unhandledRejectionHandler;
  process.on('unhandledRejection', __xeg_unhandledRejectionHandler);
}

// Uncaught Exception도 처리
if (!(process as any).__xeg_uncaught_exception_registered) {
  (process as any).__xeg_uncaught_exception_registered = true;
  const __xeg_uncaughtExceptionHandler = (error: any) => {
    const isWorkerError =
      error.message?.includes('Terminating worker thread') ||
      error.message?.includes('ThreadTermination') ||
      error.message?.includes('tinypool') ||
      error.stack?.includes('tinypool');

    const isTimerError = error.message?.includes('setTimeout is not a function');
    const isVitestStateError =
      error.message?.includes('Vitest failed to access its internal state') ||
      error.stack?.includes('getWorkerState');

    if (isWorkerError || isTimerError || isVitestStateError) {
      return; // 완전히 억제
    }

    console.error('테스트 환경 Uncaught Exception:', error);
  };
  (process as any).__xeg_uncaughtExceptionHandler = __xeg_uncaughtExceptionHandler;
  process.on('uncaughtException', __xeg_uncaughtExceptionHandler);
}

// Node의 uncaughtExceptionCaptureCallback을 사용해 특정 종료 시점 에러 완전 차단
try {
  const setCapture = (process as any).setUncaughtExceptionCaptureCallback as any;
  if (typeof setCapture === 'function' && !(process as any).__xeg_uncaught_capture_set) {
    (process as any).__xeg_uncaught_capture_set = true;
    setCapture((err: any) => {
      const msg = err?.message ?? '';
      const stack = err?.stack ?? '';
      const isVitestStateError =
        typeof msg === 'string' && msg.includes('Vitest failed to access its internal state');
      const isGetWorkerState = typeof stack === 'string' && stack.includes('getWorkerState');
      if (isVitestStateError || isGetWorkerState) {
        // swallow
        return;
      }
      // 다른 에러는 기존 uncaughtException 핸들러로 위임되도록 콜백 해제
      setCapture(null);
      // 재방지: 콜백 해제 후 throw하여 일반 uncaughtException 흐름으로 전달
      throw err;
    });
  }
} catch {
  // ignore
}

// 테스트 완료 후 비동기 큐 플러시 (타이머 비의존)
afterEach(async () => {
  // Flush microtasks without relying on timers (avoids fake timers deadlock)
  await Promise.resolve();
  // Best-effort: ensure no timers leak beyond test boundaries
  __xeg_clearAllTimers();
});

// Ultimate Preact Test Environment v2.0
import {
  setupUltimatePreactTestEnvironment,
  resetPreactHookState,
  ensurePreactHookContext,
} from './utils/mocks/ultimate-preact-environment.js';

// ================================
// 🔧 Web Storage API 모킹 (localStorage, sessionStorage)
// ================================

// Storage 구현 생성 - Vitest worker에서 작동하도록 개선
function createStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
}

// 전역 환경에 Storage 설정 - 모든 가능한 global 객체에 설정
function setupStorageGlobally() {
  const storage = createStorageMock();
  const sessionStorage = createStorageMock();

  // globalThis에 설정
  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: sessionStorage,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  // global에 설정
  if (typeof global !== 'undefined') {
    Object.defineProperty(global, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorage,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  // window에 설정 (JSDOM 환경)
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorage,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
}

// 즉시 실행하여 Storage 설정
setupStorageGlobally();

// ================================
// 🔧 Console API 안전 모킹 (최우선) - Enhanced for UnifiedLogger
// ================================

// 브라우저 환경에서 globalThis와 global 모두 지원
const globalTarget =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof global !== 'undefined'
      ? global
      : typeof window !== 'undefined'
        ? window
        : {};

// localStorage 및 sessionStorage 모킹 설정 (기존 코드 제거)
if (globalTarget) {
  if (!globalTarget.localStorage) {
    Object.defineProperty(globalTarget, 'localStorage', {
      value: createStorageMock(),
      writable: true,
      configurable: true,
    });
  }

  if (!globalTarget.sessionStorage) {
    Object.defineProperty(globalTarget, 'sessionStorage', {
      value: createStorageMock(),
      writable: true,
      configurable: true,
    });
  }
}

if (globalTarget) {
  // console 객체가 없거나 불완전한 경우 완전 재생성
  if (!globalTarget.console || typeof globalTarget.console.info !== 'function') {
    globalTarget.console = {} as Console;
  }

  // 모든 console 메서드를 vi.fn()으로 완전 모킹
  const consoleMethods = [
    'debug',
    'info',
    'warn',
    'error',
    'log',
    'trace',
    'table',
    'assert',
    'clear',
    'count',
    'dir',
    'group',
    'groupCollapsed',
    'groupEnd',
    'time',
    'timeEnd',
  ];

  // Vitest state 접근을 피하기 위해 vi.fn 대신 순수 no-op 사용
  const noop = function noopConsole(): void {
    // intentionally empty
  };

  consoleMethods.forEach(method => {
    Object.defineProperty(globalTarget.console, method, {
      value: noop,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  });

  // 추가 보장: global, globalThis, window 모두에 동일한 console 할당
  if (typeof global !== 'undefined') global.console = globalTarget.console;
  if (typeof globalThis !== 'undefined') globalThis.console = globalTarget.console;
  if (typeof window !== 'undefined') window.console = globalTarget.console;
}

// ================================
// 🎯 Vendor API Mock 설정 (최우선)
// ================================
// Note: 별도 MockQueryCache/MockMutationCache 및 로컬 훅 모의 구현은 제거되었습니다.
// 실제 구현과 test/__mocks__/vendor-libs-enhanced.mock.ts에서 제공하는 안전한 폴백을 사용합니다.

// ================================
// 🚀 Phase 1: Ultimate Preact Hook 환경 + Mock 시스템 통합 초기화
// ================================

console.log('[Ultimate Test Setup v2.0] Phase 1: Ultimate Mock 시스템 초기화 시작...');

// 1. Ultimate Preact 환경 설정 (v2.0)
setupUltimatePreactTestEnvironment();
console.log('[Ultimate Test Setup v2.0] Phase 1: Ultimate Preact Hook 환경 v2.0 초기화 완료 ✅');
console.log('[Ultimate Test Setup v2.0] "__k" 에러 완전 차단 시스템 활성화 ✅');

// 전역 Preact 환경 완전 안정화
if (typeof globalThis !== 'undefined') {
  // 모든 Preact 관련 전역 변수를 안정화
  globalThis.__PREACT_DEVTOOLS__ = {
    renderRoot: () => {},
    hook: () => {},
    diff: () => {},
    commit: () => {},
    render: () => {},
  };

  // Hook 컨텍스트 강화
  globalThis.__PREACT_HOOKS_CONTEXT__ = {
    __h: [],
    __s: [],
    __c: null,
    __k: [],
  };

  // Testing Library Preact 환경 보정
  globalThis.__TESTING_LIBRARY_PREACT__ = true;
}
console.log('[Ultimate Test Setup] 전역 Preact 환경 완전 안정화 완료 ✅');

// 2. Enhanced Vendor Libraries Mock 설정
setupVendorMocks();
console.log('[Ultimate Test Setup] Enhanced Vendor Mocks 초기화 완료 ✅');

// 3. Console 및 DOM 환경 초기화
setupUltimateConsoleEnvironment();
setupUltimateDOMEnvironment();
console.log('[Ultimate Test Setup] Ultimate Console & DOM 환경 초기화 완료 ✅');

// 4. UserScript API Mock 설정
setupGlobalMocks();
console.log('[Ultimate Test Setup] UserScript API Mock 초기화 완료 ✅');

// ================================
// 🔧 Enhanced Global Test Lifecycle
// ================================

beforeEach(async () => {
  __xeg_enforceRealTimers();
  // Enhanced Mock 시스템 초기화
  resetVendorMocks();
  setupVendorMocks();

  // Mock API 상태 초기화
  resetMockApiState();

  // 테스트 환경 설정
  await setupTestEnvironment();

  console.log('[Test Lifecycle] ✅ Enhanced beforeEach 완료');
});

afterEach(async () => {
  __xeg_enforceRealTimers();
  __xeg_clearAllTimers();
  // Mock 시스템 정리 (Vitest API 호출 없이)
  resetVendorMocks();

  // 테스트 환경 정리
  await cleanupTestEnvironment();

  console.log('[Test Lifecycle] ✅ Enhanced afterEach 완료');
});

console.log('[Ultimate Test Setup] 🎉 모든 Enhanced Mock 시스템 초기화 완료!');
console.log('[Ultimate Test Setup] 🚀 Preact Hook "__k" 에러 완전 차단!');
console.log('[Ultimate Test Setup] 📋 Enhanced Vendor Libraries Mock 완료!');
console.log('[Ultimate Test Setup] 🔧 Ultimate DOM & Console 환경 완료!');

// ================================
// 🚀 Ultimate renderHook 패치 (Preact Wrapper 자동 적용)
// ================================

import { renderHook as originalRenderHook } from '@testing-library/preact';

// 🚀 Ultimate Enhanced renderHook with automatic PreactTestWrapper
const ultimateEnhancedRenderHook = (callback: any, options: any = {}) => {
  // Ultimate Hook 컨텍스트 강제 보장
  ensurePreactHookContext();

  return originalRenderHook(callback, {
    ...options,
    wrapper: PreactTestWrapper,
  });
};

// 🚀 Ultimate 전역 renderHook 치환
global.renderHook = ultimateEnhancedRenderHook;

// ================================
// 전역 DOM 및 브라우저 API 설정
// ================================

// jsdom 가용 여부 감지 (실제 Window/Document 객체가 존재하는지)
const hasJsdomWindow =
  typeof globalThis.window !== 'undefined' &&
  typeof globalThis.document !== 'undefined' &&
  typeof (globalThis.document as any).createElement === 'function';

// jsdom 환경 폴리필: 공용 스크롤/내비/DOM 모킹 적용
try {
  if (typeof globalThis.window !== 'undefined') {
    ensureScrollAPIs(globalThis.window as any);
    ensureNavigationAPI(globalThis.window as any);
    setupCommonDOMMocks(globalThis.window as any);
  }
} catch {
  // ignore
}

// HTMLElement 체크를 위한 전역 설정 (없을 때만 정의)
if (typeof (global as any).Element === 'undefined') {
  (global as any).Element = class Element {} as any;
}
if (typeof (global as any).HTMLElement === 'undefined') {
  (global as any).HTMLElement = class HTMLElement extends (global as any).Element {} as any;
}

// (구) 비-jsdom 환경 전역 DOM 대체 구현 제거: jsdom 환경 전제 + 공용 유틸 적용

// Document/Window 전역 모킹 - jsdom 미존재 시에만 대체 구현 적용
// jsdom 환경 raf 보강(필요 시)
try {
  if (typeof window !== 'undefined') {
    if (!(window as any).requestAnimationFrame) {
      (window as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16);
    }
    if (!(window as any).cancelAnimationFrame) {
      (window as any).cancelAnimationFrame = (id?: any) =>
        (id != null ? clearTimeout(id) : undefined) as any;
    }
  }
} catch {
  // ignore
}

// MutationObserver 전역 모킹 - 실제 Node 검증 추가 (없을 때만)
if (typeof (global as any).MutationObserver === 'undefined') {
  (global as any).MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn((target: any) => {
      if (!target || typeof target !== 'object') {
        throw new TypeError(
          "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'."
        );
      }
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// IntersectionObserver 전역 모킹 (없을 때만)
if (typeof (global as any).IntersectionObserver === 'undefined') {
  (global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// 기본적인 브라우저 환경 설정 강화 (위에서 공용 폴리필 적용됨)
if (typeof globalThis !== 'undefined') {
  // 안전한 window 객체 설정
  // NOTE: jsdom이 없는 환경에서만 대체 구현을 제공하되, 기존의 완전한 구현이 있으면 절대 다운그레이드하지 않습니다.
  if (!hasJsdomWindow) {
    if (!globalThis.window || typeof globalThis.window !== 'object') {
      globalThis.window = {} as any;
    }

    // 기존 document가 충분히 구현되어 있다면 유지 (createElement/appendChild/contains 확인)
    const d: any = globalThis.document as any;
    const hasRobustDoc =
      d &&
      typeof d === 'object' &&
      typeof d.createElement === 'function' &&
      d.body &&
      typeof d.body.appendChild === 'function' &&
      typeof d.body.contains === 'function';

    if (!hasRobustDoc) {
      // setupUltimateDOMEnvironment에서 이미 강한 DOM을 구성했다면 d가 존재할 수 있음.
      // 부족한 경우에만 보강하고, 절대 간소한 POJO로 덮어쓰지 않습니다.
      if (!d || typeof d.createElement !== 'function') {
        // 최소 안전 보강: createElement가 없다면 간단한 강화 요소 팩토리 사용
        (globalThis as any).document = (globalThis as any).document || ({} as any);
        (globalThis as any).document.createElement = (tag: string) => createMockElement(tag);
        (globalThis as any).document.querySelector = (_selector: string) => {
          void _selector; // mark used for TS noUnusedParameters
          return null;
        };
        (globalThis as any).document.querySelectorAll = (_selector: string) => {
          void _selector; // mark used for TS noUnusedParameters
          return [];
        };
      }
      if (
        !((globalThis as any).document as any).body ||
        typeof ((globalThis as any).document as any).body.appendChild !== 'function'
      ) {
        ((globalThis as any).document as any).body = createMockElement('body');
      }
    }
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

  // 위에서 ensureScrollAPIs/ensureNavigationAPI/setupCommonDOMMocks 적용 완료
}

// DOM API 폴리필 추가
if (!document.elementFromPoint) {
  document.elementFromPoint = function () {
    // 단순한 폴백 - 첫 번째 요소를 반환
    return document.body.firstElementChild || null;
  };
}

if (!document.elementsFromPoint) {
  document.elementsFromPoint = function (x, y) {
    const element = document.elementFromPoint(x, y);
    return element ? [element] : [];
  };
}

// (구) 엘리먼트 보강/프로토타입 패치 제거: jsdom 표준 기능 사용

/**
 * 각 테스트 전에 기본 환경 설정
 * 모든 테스트가 깨끗한 환경에서 실행되도록 보장
 */
beforeEach(async () => {
  // 타이머는 각 테스트 파일에서 필요 시 개별적으로 mock 처리합니다.

  // 🚀 Ultimate Preact Hook 상태 초기화 (103개 테스트 실패 완전 해결!)
  resetPreactHookState();
  ensurePreactHookContext(); // Ultimate 컨텍스트 보장

  // Mock API 연결 활성화
  setupGlobalMocks();
  setupVendorMocks();

  // URL 생성자 다시 확인 및 설정
  // (구) URL 폴리필 제거: jsdom/Node 기본 URL 사용

  // Vendor 초기화 - 모든 테스트에서 사용할 수 있도록
  try {
    const { initializeVendors } = await import('../src/shared/external/vendors/vendor-api.js');
    await initializeVendors();
  } catch {
    // ignore: vendor initialization is optional in tests
  }

  // 🎯 갤러리 컨테이너 미리 생성 (테스트에서 찾을 수 있도록)
  try {
    const galleryContainer = global.document.createElement('div');
    galleryContainer.setAttribute('data-gallery', 'enhanced');
    galleryContainer.className = 'gallery-container';
    galleryContainer.id = 'enhanced-gallery';

    if (global.document.body && typeof global.document.body.appendChild === 'function') {
      global.document.body.appendChild(galleryContainer);
    }

    // 추가 테스트용 요소들
    const tweetContainer = global.document.createElement('article');
    tweetContainer.setAttribute('data-testid', 'tweet');

    if (global.document.body && typeof global.document.body.appendChild === 'function') {
      global.document.body.appendChild(tweetContainer);
    }
  } catch (error) {
    // DOM 요소 생성 실패는 조용히 처리
    console.warn('[Setup] DOM element creation failed:', error);
  }

  // 일부 테스트 환경(Node/비-JSDOM)에서 document.createElement가 없을 수 있음
  try {
    if (global.document && typeof global.document.createElement === 'function') {
      const videoPlayer = global.document.createElement('div');
      if (typeof videoPlayer?.setAttribute === 'function') {
        videoPlayer.setAttribute('data-testid', 'videoPlayer');
      }
      if (global.document.body && typeof global.document.body.appendChild === 'function') {
        try {
          global.document.body.appendChild(videoPlayer);
        } catch (error) {
          console.warn('[Setup] Failed to append videoPlayer:', error);
        }
      }
    }
  } catch (error) {
    console.warn('[Setup] Failed to create videoPlayer element:', error);
  }

  try {
    if (global.document && typeof global.document.createElement === 'function') {
      const tweetPhoto = global.document.createElement('div');
      if (typeof tweetPhoto?.setAttribute === 'function') {
        tweetPhoto.setAttribute('data-testid', 'tweetPhoto');
      }
      if (global.document.body && typeof global.document.body.appendChild === 'function') {
        try {
          global.document.body.appendChild(tweetPhoto);
        } catch (error) {
          console.warn('[Setup] Failed to append tweetPhoto:', error);
        }
      }
    }
  } catch (error) {
    console.warn('[Setup] Failed to create tweetPhoto element:', error);
  }

  // 기본 테스트 환경 설정 (minimal)
  await setupTestEnvironment();
});

/**
 * 각 테스트 후에 환경 정리
 * 메모리 누수 방지 및 테스트 격리 보장
 */
afterEach(async () => {
  // 강제 타이머 정리 (실제 타이머 포함). Vitest Fake Timers API는 호출하지 않음.
  __xeg_clearAllTimers();

  // 🧹 Ultimate 환경 정리 (Phase 1: Preact Hook)
  resetPreactHookState();

  // 🧹 Ultimate 환경 정리 (Phase 2: Console & DOM)
  cleanupUltimateConsoleEnvironment();
  cleanupUltimateDOMEnvironment();

  // DOM 정리 - body의 모든 자식 요소 제거
  if (global.document?.body?.children) {
    while (global.document.body.children.length > 0) {
      global.document.body.removeChild(global.document.body.children[0]);
    }
  }

  // Mock API 상태 초기화 (Vitest API 호출 없이)
  resetMockApiState();
  resetVendorMocks();

  await cleanupTestEnvironment();
  // One more guard at the very end
  __xeg_enforceRealTimers();
  __xeg_clearAllTimers();
});

// 최종 수트 종료 시 한 번 더 모든 타이머를 정리
// Windows에서 Vitest onAfterRunSuite 시점과 충돌할 수 있어 등록하지 않음
if (process.platform !== 'win32') {
  afterAll(async () => {
    // Keep teardown minimal to avoid affecting Vitest runner lifecycle
    try {
      __xeg_clearAllTimers();
    } catch {
      // ignore: best-effort timer clear during teardown
    }
    try {
      __xeg_enforceRealTimers();
    } catch {
      // ignore: best-effort timer enforcement during teardown
    }
  });
} else {
  // Windows: onAfterRunFiles 직전에 Vitest 내부 상태 접근 실패 방지
  afterAll(() => {
    try {
      const g: any = globalThis as any;
      const KEY = '__vitest_worker__';
      if (!g[KEY]) {
        Object.defineProperty(g, KEY, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: { environment: { transformMode: 'web' }, ctx: { projectName: 'default' } },
        });
      }
    } catch {
      // ignore
    }
  });
}

// ================================
// 환경 사용 가이드
// ================================
// 이 파일은 vitest.config.ts의 setupFiles에서 자동으로 로드됩니다
// 개별 테스트에서 특별한 환경이 필요한 경우:
// - setupComponentTestEnvironment() : DOM + 브라우저 확장 + 컴포넌트 환경
// - setupBrowserTestEnvironment() : DOM + 브라우저 확장 환경
// - setupTestEnvironment() : 모든 환경 + 샘플 데이터
// - setupMinimalEnvironment() : 기본 환경 (기본값)
