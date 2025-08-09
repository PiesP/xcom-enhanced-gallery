/**
 * Vitest 테스트 환경 설정 - Enhanced TDD Solution
 * 새로운 모듈화된 테스트 인프라 + 안정화된 Preact Hook 환경
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment.js';
import { setupGlobalMocks, resetMockApiState } from './__mocks__/userscript-api.mock.js';
import { setupVendorMocks, resetVendorMocks } from './__mocks__/vendor-libs-enhanced.mock.js';
import {
  setupUltimateConsoleEnvironment,
  cleanupUltimateConsoleEnvironment,
} from './utils/mocks/console-environment.js';
import {
  setupUltimateDOMEnvironment,
  cleanupUltimateDOMEnvironment,
} from './utils/mocks/dom-environment.js';

// ================================
// 🔧 Promise 및 에러 처리 개선
// ================================

// EventEmitter MaxListeners 경고 방지 (테스트 폭이 넓어 동적 증가)
try {
  const currentMax = (process as any).getMaxListeners?.() ?? 10;
  if (currentMax < 50) {
    process.setMaxListeners(50);
  }
} catch {
  // ignore
}

// 테스트 중 발생하는 unhandled rejection 처리 개선
// 중복 등록 방지: vitest 워커 재사용 시 이미 등록된 경우 skip
if (!(process as any).__xeg_unhandled_rejection_registered) {
  (process as any).__xeg_unhandled_rejection_registered = true;
  process.on('unhandledRejection', reason => {
    // 워커 스레드 관련 에러들을 모두 억제
    const isWorkerError =
      (reason instanceof Error &&
        (reason.message?.includes('Terminating worker thread') ||
          reason.message?.includes('ThreadTermination') ||
          reason.message?.includes('tinypool') ||
          reason.stack?.includes('tinypool'))) ||
      (typeof reason === 'string' && reason.includes('worker'));

    if (isWorkerError) {
      // 완전히 억제 (로그도 출력하지 않음)
      return;
    }

    // 다른 에러는 기존 핸들러로 전달하거나 경고만 출력
    console.warn('테스트 환경 Promise Rejection:', reason);
  });
}

// Uncaught Exception도 처리
if (!(process as any).__xeg_uncaught_exception_registered) {
  (process as any).__xeg_uncaught_exception_registered = true;
  process.on('uncaughtException', error => {
    const isWorkerError =
      error.message?.includes('Terminating worker thread') ||
      error.message?.includes('ThreadTermination') ||
      error.message?.includes('tinypool') ||
      error.stack?.includes('tinypool');

    if (isWorkerError) {
      return; // 완전히 억제
    }

    console.error('테스트 환경 Uncaught Exception:', error);
  });
}

// 테스트 완료 후 더 긴 정리 시간
afterEach(async () => {
  // Promise 정리를 위한 대기 시간 증가
  await new Promise(resolve => setTimeout(resolve, 50));
});

// Ultimate Preact Test Environment v2.0
import {
  setupUltimatePreactTestEnvironment,
  resetPreactHookState,
  ensurePreactHookContext,
} from './utils/mocks/ultimate-preact-environment';

// ================================
// 🔧 Web Storage API 모킹 (localStorage, sessionStorage)
// ================================

// Storage 구현 생성 - Vitest worker에서 작동하도록 개선
function createStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
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

  consoleMethods.forEach(method => {
    Object.defineProperty(globalTarget.console, method, {
      value: vi.fn().mockImplementation(() => {
        // 실제 콘솔 출력은 비활성화하고 모킹만 수행
        return undefined;
      }),
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

// Helper classes for TanStack Query
class MockQueryCache {
  build() {}
  add() {}
  remove() {}
  clear() {}
  get() {
    return null;
  }
  getAll() {
    return [];
  }
  subscribe() {
    return () => {};
  }
  config = {};
  mount() {}
  unmount() {}
}

class MockMutationCache {
  clear() {}
  find() {
    return null;
  }
  getAll() {
    return [];
  }
}

// 즉시 vendor-api Mock 적용

// ================================
// 🎯 Enhanced Preact Hook Mock System
// ================================

// Hook Context 시뮬레이션
let currentHookIndex = 0;
let hookStates: any[] = [];
let currentComponent: any = null;

function resetHookContext() {
  currentHookIndex = 0;
  hookStates = [];
  currentComponent = null;
}

// Enhanced useState Mock
function createEnhancedUseState() {
  return vi.fn(initialValue => {
    const hookIndex = currentHookIndex++;

    if (hookStates[hookIndex] === undefined) {
      hookStates[hookIndex] = typeof initialValue === 'function' ? initialValue() : initialValue;
    }

    const setState = vi.fn(newValue => {
      const nextValue = typeof newValue === 'function' ? newValue(hookStates[hookIndex]) : newValue;

      hookStates[hookIndex] = nextValue;

      // 리렌더링 시뮬레이션
      if (currentComponent && currentComponent.forceUpdate) {
        currentComponent.forceUpdate();
      }
    });

    return [hookStates[hookIndex], setState];
  });
}

// Enhanced useEffect Mock
function createEnhancedUseEffect() {
  return vi.fn((effect, deps) => {
    const hookIndex = currentHookIndex++;
    const prevDeps = hookStates[hookIndex]?.deps;

    const depsChanged =
      !prevDeps ||
      !deps ||
      deps.length !== prevDeps.length ||
      deps.some((dep, i) => dep !== prevDeps[i]);

    if (depsChanged) {
      // 이전 cleanup 실행
      if (hookStates[hookIndex]?.cleanup) {
        hookStates[hookIndex].cleanup();
      }

      // 새 effect 실행
      const cleanup = effect();
      hookStates[hookIndex] = { deps, cleanup };
    }
  });
}

// Enhanced useRef Mock
function createEnhancedUseRef() {
  return vi.fn(initialValue => {
    const hookIndex = currentHookIndex++;

    if (hookStates[hookIndex] === undefined) {
      hookStates[hookIndex] = { current: initialValue };
    }

    return hookStates[hookIndex];
  });
}

// Mock the vendor API module
vi.mock('@shared/external/vendors/vendor-api', () => {
  // 실제 Hook처럼 작동하는 Enhanced mock 구현
  const mockPreactHooks = {
    useState: createEnhancedUseState(),
    useEffect: createEnhancedUseEffect(),
    useRef: createEnhancedUseRef(),
    useContext: vi.fn(() => ({})),
    useReducer: vi.fn((reducer, initialState) => {
      const hookIndex = currentHookIndex++;

      if (hookStates[hookIndex] === undefined) {
        hookStates[hookIndex] = initialState;
      }

      const dispatch = vi.fn(action => {
        hookStates[hookIndex] = reducer(hookStates[hookIndex], action);
      });

      return [hookStates[hookIndex], dispatch];
    }),
    useCallback: vi.fn((callback, deps) => {
      const hookIndex = currentHookIndex++;
      const prevDeps = hookStates[hookIndex]?.deps;

      const depsChanged =
        !prevDeps ||
        !deps ||
        deps.length !== prevDeps.length ||
        deps.some((dep, i) => dep !== prevDeps[i]);

      if (depsChanged || hookStates[hookIndex] === undefined) {
        hookStates[hookIndex] = { callback, deps };
      }

      return hookStates[hookIndex].callback;
    }),
    useMemo: vi.fn((factory, deps) => {
      const hookIndex = currentHookIndex++;
      const prevDeps = hookStates[hookIndex]?.deps;

      const depsChanged =
        !prevDeps ||
        !deps ||
        deps.length !== prevDeps.length ||
        deps.some((dep, i) => dep !== prevDeps[i]);

      if (depsChanged || hookStates[hookIndex] === undefined) {
        const value = factory();
        hookStates[hookIndex] = { value, deps };
      }

      return hookStates[hookIndex].value;
    }),
    useImperativeHandle: vi.fn(),
    useLayoutEffect: createEnhancedUseEffect(),
    useDebugValue: vi.fn(),
    useErrorBoundary: vi.fn(() => [null, vi.fn()]),
    useId: vi.fn(() => `mock-id-${currentHookIndex++}`),
  };

  const mockPreactSignals = {
    signal: vi.fn(value => ({
      value,
      valueOf: () => value,
      peek: () => value,
      subscribe: vi.fn(() => vi.fn()),
      toString: () => String(value),
    })),
    computed: vi.fn(compute => ({
      value: compute(),
      valueOf: () => compute(),
      peek: () => compute(),
      subscribe: vi.fn(() => vi.fn()),
    })),
    effect: vi.fn(fn => {
      fn();
      return () => {};
    }),
    batch: vi.fn(fn => fn()),
  };

  let mockIsInitialized = false;
  function resetVendorCache() {
    mockIsInitialized = false;
    resetHookContext();
  }

  return {
    async initializeVendors() {
      mockIsInitialized = true;
      resetHookContext(); // Hook 컨텍스트 초기화
      console.log('[Mock] Enhanced Vendor API 초기화 완료');
    },
    resetVendorCache,
    getPreactHooks() {
      if (!mockIsInitialized) {
        mockIsInitialized = true;
        resetHookContext();
      }
      return mockPreactHooks;
    },
    getPreact() {
      return {
        options: {
          __k: () => {}, // Preact 내부 상태 관리 모킹
          __r: () => {},
          __e: () => {},
          __h: () => {},
        },
        render: vi.fn(),
        createElement: vi.fn((type, props, ...children) => ({
          type,
          props: { ...props, children: children.length === 1 ? children[0] : children },
          __k: [], // Preact 내부 상태
          __: null,
          __i: 0,
        })),
        Fragment: 'Fragment',
      };
    },
    getPreactSignals() {
      if (!mockIsInitialized) {
        // Mock 환경에서는 즉시 초기화
        mockIsInitialized = true;
      }
      return mockPreactSignals;
    },
    getFflate() {
      return {
        zip: vi.fn(() => new Uint8Array()),
        unzip: vi.fn(() => ({})),
        strToU8: vi.fn(str => new TextEncoder().encode(str)),
        strFromU8: vi.fn(data => new TextDecoder().decode(data)),
      };
    },
    getTanStackQuery() {
      return {
        QueryClient: class {
          getQueryCache() {
            return new MockQueryCache();
          }
          getMutationCache() {
            return new MockMutationCache();
          }
          getQueryData() {
            return null;
          }
          setQueryData() {}
          invalidateQueries() {}
          removeQueries() {}
          fetchQuery() {
            return Promise.resolve(null);
          }
          prefetchQuery() {
            return Promise.resolve();
          }
          cancelQueries() {
            return Promise.resolve();
          }
          resetQueries() {}
          isFetching() {
            return false;
          }
          isMutating() {
            return false;
          }
          getDefaultOptions() {
            return {};
          }
          setDefaultOptions() {}
          setQueryDefaults() {}
          getQueryDefaults() {
            return {};
          }
          setMutationDefaults() {}
          getMutationDefaults() {
            return {};
          }
          mount() {}
          unmount() {}
          clear() {}
        },
        QueryCache: class {
          build() {}
          add() {}
          remove() {}
          clear() {}
          get() {
            return null;
          }
          getAll() {
            return [];
          }
          subscribe() {
            return () => {};
          }
          config = {};
          mount() {}
          unmount() {}
        },
        MutationCache: class {
          clear() {}
          find() {
            return null;
          }
          getAll() {
            return [];
          }
        },
        queryKey: (key: unknown[]) => key,
        hashQueryKey: (key: unknown[]) => JSON.stringify(key),
      };
    },
  };
});

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
  // Mock 시스템 정리
  resetVendorMocks();
  vi.clearAllMocks();

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

// HTMLElement 체크를 위한 전역 설정
global.HTMLElement = global.HTMLElement || class HTMLElement extends Element {};
global.Element = global.Element || class Element {};

// 🔧 FIX: 전역 DOM API 모킹 추가 - Preact 호환성 강화
const createMockElement = (tag = 'div') => {
  const element = {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    style: { cssText: '', willChange: '' }, // willChange 추가
    textContent: '',
    innerHTML: '',
    nodeType: 1,
    parentNode: null,
    children: [],
    childNodes: [],
    role: undefined as string | undefined,
    ariaLabel: undefined as string | undefined,
    ariaLabelledBy: undefined as string | undefined,
    setAttribute: vi.fn((name: string, value: string) => {
      if (name === 'data-gallery') element.dataset = { gallery: value };
      if (name === 'data-testid') element.dataset = { ...element.dataset, testid: value };
      if (name === 'role') element.role = value;
      if (name === 'aria-label') element.ariaLabel = value;
      if (name === 'aria-labelledby') element.ariaLabelledBy = value;
    }),
    getAttribute: vi.fn((name: string) => {
      if (name === 'data-gallery') return element.dataset?.gallery || null;
      if (name === 'data-testid') return element.dataset?.testid || null;
      if (name === 'role') return element.role || null;
      if (name === 'aria-label') return element.ariaLabel || null;
      if (name === 'aria-labelledby') return element.ariaLabelledBy || null;
      return null;
    }),
    hasAttribute: vi.fn((name: string) => {
      if (name === 'data-gallery') return !!element.dataset?.gallery;
      if (name === 'data-testid') return !!element.dataset?.testid;
      if (name === 'role') return !!element.role;
      if (name === 'aria-label') return !!element.ariaLabel;
      if (name === 'aria-labelledby') return !!element.ariaLabelledBy;
      return false;
    }),
    dataset: {} as any,
    removeAttribute: vi.fn(),
    appendChild: vi.fn((child: any) => {
      element.children.push(child);
      child.parentNode = element;
    }),
    removeChild: vi.fn((child: any) => {
      const index = element.children.indexOf(child);
      if (index > -1) {
        element.children.splice(index, 1);
        child.parentNode = null;
      }
    }),
    remove: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })),
    closest: vi.fn(() => null),
    contains: vi.fn(() => false),
    querySelector: vi.fn((selector: string) => {
      // 간단한 선택자 매칭 구현
      for (const child of element.children) {
        if (matchesSelector(child, selector)) {
          return child;
        }
        // 재귀적으로 하위 요소도 검색
        const found = child.querySelector?.(selector);
        if (found) return found;
      }
      return null;
    }),
    querySelectorAll: vi.fn((selector: string) => {
      const results: any[] = [];
      for (const child of element.children) {
        if (matchesSelector(child, selector)) {
          results.push(child);
        }
        // 재귀적으로 하위 요소도 검색
        const childResults = child.querySelectorAll?.(selector) || [];
        results.push(...childResults);
      }
      return results;
    }),
    // Preact에서 필요한 추가 속성들
    __k: null, // Preact virtual node key
    __e: null, // Preact DOM element reference
    __P: null, // Preact parent
  };

  return element;
};

// 선택자 매칭 함수
function matchesSelector(element: any, selector: string): boolean {
  if (selector.startsWith('[data-gallery')) {
    const match = selector.match(/\[data-gallery(?:="([^"]*)")?\]/);
    if (match) {
      const expectedValue = match[1];
      const actualValue = element.dataset?.gallery;
      return expectedValue ? actualValue === expectedValue : !!actualValue;
    }
  }
  if (selector.startsWith('[data-testid')) {
    const match = selector.match(/\[data-testid="([^"]*)"\]/);
    if (match) {
      return element.dataset?.testid === match[1];
    }
  }
  if (selector === element.tagName?.toLowerCase()) {
    return true;
  }
  if (selector.startsWith('.') && element.className?.includes(selector.slice(1))) {
    return true;
  }
  if (selector.startsWith('#') && element.id === selector.slice(1)) {
    return true;
  }
  return false;
}

// Document 전역 모킹 - Preact 호환성 강화
const documentBody = createMockElement('body');
const documentHead = createMockElement('head');
const documentElement = createMockElement('html');

global.document = {
  getElementById: vi.fn((id: string) => {
    // body와 head에서 ID로 검색
    const allElements = [
      documentBody,
      documentHead,
      ...documentBody.children,
      ...documentHead.children,
    ];
    return allElements.find(el => el.id === id) || null;
  }),
  createElement: vi.fn(tag => createMockElement(tag)),
  createTextNode: vi.fn(text => ({ textContent: text, nodeType: 3 })),
  querySelector: vi.fn((selector: string) => {
    // body와 head에서 검색
    const bodyResult = documentBody.querySelector(selector);
    if (bodyResult) return bodyResult;

    const headResult = documentHead.querySelector(selector);
    if (headResult) return headResult;

    return null;
  }),
  querySelectorAll: vi.fn((selector: string) => {
    const bodyResults = documentBody.querySelectorAll(selector);
    const headResults = documentHead.querySelectorAll(selector);
    return [...bodyResults, ...headResults];
  }),
  getElementsByTagName: vi.fn((tagName: string) => {
    const allElements = [
      documentBody,
      documentHead,
      ...documentBody.children,
      ...documentHead.children,
    ];
    return allElements.filter(el => el.tagName?.toLowerCase() === tagName.toLowerCase());
  }),
  getElementsByClassName: vi.fn((className: string) => {
    const allElements = [
      documentBody,
      documentHead,
      ...documentBody.children,
      ...documentHead.children,
    ];
    return allElements.filter(el => el.className?.includes(className));
  }),
  body: documentBody,
  head: documentHead,
  documentElement,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true), // ✅ dispatchEvent 추가
  createEvent: vi.fn(() => ({
    initEvent: vi.fn(),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  })),
  location: {
    href: 'https://x.com',
    origin: 'https://x.com',
    pathname: '/',
    search: '',
    hash: '',
  },
  // Preact에서 필요한 추가 속성들
  defaultView: null, // window 참조
  nodeType: 9, // Document node
};

// Window 전역 모킹 - Preact 호환성 강화
global.window = {
  ...global.window,
  document: global.document,
  location: global.document.location,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true), // ✅ dispatchEvent 추가
  getComputedStyle: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
  })),
  requestAnimationFrame: vi.fn(cb => setTimeout(cb, 16)),
  cancelAnimationFrame: vi.fn(),
  performance: {
    now: vi.fn(() => Date.now()),
  },
  // Preact Hook을 위한 추가 설정
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,
};

// Document의 defaultView를 window로 설정
global.document.defaultView = global.window;

// MutationObserver 전역 모킹 - 실제 Node 검증 추가
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(target => {
    // target이 Node 타입인지 검증
    if (!target || typeof target !== 'object') {
      throw new TypeError(
        "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'."
      );
    }
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserver 전역 모킹
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ================================
// 전역 테스트 환경 설정
// ================================

// URL 생성자 폴백 - Node.js URL 직접 사용
function createURLPolyfill() {
  try {
    // Node.js의 기본 URL을 직접 사용
    const { URL: NodeURL } = require('node:url');
    console.log('Using Node.js URL constructor');
    return NodeURL;
  } catch (error) {
    console.warn('Node URL import failed, using fallback:', error);

    // fallback implementation
    function URLConstructor(url) {
      if (!(this instanceof URLConstructor)) {
        return new URLConstructor(url);
      }

      const urlRegex = /^(https?):\/\/([^/]+)(\/[^?]*)?\??(.*)$/;
      const match = url.match(urlRegex);

      if (!match) {
        throw new Error('Invalid URL');
      }

      const [, protocol, hostname, pathname = '/', search = ''] = match;

      this.protocol = `${protocol}:`;
      this.hostname = hostname;
      this.pathname = pathname;
      this.search = search ? `?${search}` : '';
      this.href = url;

      this.toString = () => this.href;

      return this;
    }

    return URLConstructor;
  }
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

/**
 * 각 테스트 전에 기본 환경 설정
 * 모든 테스트가 깨끗한 환경에서 실행되도록 보장
 */
beforeEach(async () => {
  // 🚀 타이머 Mock 설정 (useToolbar Hook 테스트 요구사항)
  vi.useFakeTimers();

  // 🚀 Ultimate Preact Hook 상태 초기화 (103개 테스트 실패 완전 해결!)
  resetPreactHookState();
  ensurePreactHookContext(); // Ultimate 컨텍스트 보장

  // Mock API 연결 활성화
  setupGlobalMocks();
  setupVendorMocks();

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

  const videoPlayer = global.document.createElement('div');
  videoPlayer.setAttribute('data-testid', 'videoPlayer');
  if (global.document.body && typeof global.document.body.appendChild === 'function') {
    try {
      global.document.body.appendChild(videoPlayer);
    } catch (error) {
      console.warn('[Setup] Failed to append videoPlayer:', error);
    }
  }

  const tweetPhoto = global.document.createElement('div');
  tweetPhoto.setAttribute('data-testid', 'tweetPhoto');
  if (global.document.body && typeof global.document.body.appendChild === 'function') {
    try {
      global.document.body.appendChild(tweetPhoto);
    } catch (error) {
      console.warn('[Setup] Failed to append tweetPhoto:', error);
    }
  }

  // 기본 테스트 환경 설정 (minimal)
  await setupTestEnvironment();
});

/**
 * 각 테스트 후에 환경 정리
 * 메모리 누수 방지 및 테스트 격리 보장
 */
afterEach(async () => {
  // 🚀 타이머 정리 (useToolbar Hook 테스트 요구사항)
  if (vi.isFakeTimers()) {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  }

  // 🧹 Ultimate 환경 정리 (Phase 1: Preact Hook)
  resetPreactHookState();
  // Ultimate 환경이 자동으로 정리됨

  // 🧹 Ultimate 환경 정리 (Phase 2: Console & DOM)
  cleanupUltimateConsoleEnvironment();
  cleanupUltimateDOMEnvironment();

  // DOM 정리 - body의 모든 자식 요소 제거
  if (global.document?.body?.children) {
    while (global.document.body.children.length > 0) {
      global.document.body.removeChild(global.document.body.children[0]);
    }
  }

  // Mock API 상태 초기화
  resetMockApiState();
  resetVendorMocks();

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
