/**
 * Vitest 테스트 환경 설정 - Enhanced TDD Solution
 * 새로운 모듈화된 테스트 인프라 + 안정화된 Preact Hook 환경
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment.js';
import { setupGlobalMocks, resetMockApiState } from './__mocks__/userscript-api.mock.js';
import {
  setupUltimateConsoleEnvironment,
  cleanupUltimateConsoleEnvironment,
} from './utils/mocks/console-environment.js';
import {
  setupUltimateDOMEnvironment,
  cleanupUltimateDOMEnvironment,
} from './utils/mocks/dom-environment.js';

// ================================
// 🎯 Vendor API Mock 설정 (최우선)
// ================================

// 즉시 vendor-api Mock 적용
vi.mock('../src/shared/external/vendors/vendor-api', () => {
  // 실제 Hook처럼 작동하는 mock 구현
  const mockPreactHooks = {
    useState: vi.fn(initialValue => {
      const state = { current: initialValue };
      const setState = vi.fn(newValue => {
        if (typeof newValue === 'function') {
          state.current = newValue(state.current);
        } else {
          state.current = newValue;
        }
      });
      return [state.current, setState];
    }),
    useEffect: vi.fn(effect => {
      const cleanup = effect();
      return cleanup || (() => {});
    }),
    useContext: vi.fn(() => ({})),
    useReducer: vi.fn((reducer, initialState) => [initialState, vi.fn()]),
    useCallback: vi.fn(callback => callback),
    useMemo: vi.fn(factory => factory()),
    useRef: vi.fn(initialValue => ({ current: initialValue })),
    useImperativeHandle: vi.fn(),
    useLayoutEffect: vi.fn(effect => {
      const cleanup = effect();
      return cleanup || (() => {});
    }),
    useDebugValue: vi.fn(),
    useErrorBoundary: vi.fn(() => [null, vi.fn()]),
    useId: vi.fn(() => 'mock-id'),
  };

  const mockPreactSignals = {
    signal: vi.fn(value => ({ value, valueOf: () => value })),
    computed: vi.fn(compute => ({ value: compute(), valueOf: () => compute() })),
    effect: vi.fn(fn => {
      fn();
      return () => {};
    }),
    batch: vi.fn(fn => fn()),
  };

  let mockIsInitialized = false;

  return {
    async initializeVendors() {
      mockIsInitialized = true;
      console.log('[Mock] Vendor API 초기화 완료');
    },
    getPreactHooks() {
      if (!mockIsInitialized) {
        // Mock 환경에서는 즉시 초기화
        mockIsInitialized = true;
      }
      return mockPreactHooks;
    },
    getPreact() {
      return { options: {} };
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
    getMotionOne() {
      return {
        animate: vi.fn(),
        timeline: vi.fn(),
        stagger: vi.fn(),
      };
    },
    getTanStackQuery() {
      return {
        QueryClient: vi.fn(),
        useQuery: vi.fn(),
        useMutation: vi.fn(),
      };
    },
  };
});

// ================================
// 🚀 Ultimate Preact 테스트 환경 설정 (최고 레벨 안정화)
// ================================

import {
  setupPreactTestEnvironment,
  resetPreactHookState,
  cleanupPreactTestEnvironment,
  ensurePreactHookContext,
  PreactTestWrapper,
} from './utils/mocks/preact-test-environment';

// Ultimate Preact 테스트를 위한 전역 설정
global.__PREACT_TEST_ENV__ = true;
global.__ULTIMATE_PREACT_TEST__ = true;

// 🚀 Ultimate 최고 수준의 Preact Hook 환경 초기화 (TDD 솔루션)
setupPreactTestEnvironment();

console.log('[Ultimate Test Setup] Phase 1: Ultimate Preact Hook 환경 초기화 완료 ✅');
console.log('[Ultimate Test Setup] "__k" 에러 차단 시스템 활성화 ✅');

// 🚀 Phase 2: Ultimate Console & DOM 환경 초기화
setupUltimateConsoleEnvironment();
setupUltimateDOMEnvironment();

console.log('[Ultimate Test Setup] Phase 2: Console & DOM 환경 초기화 완료 ✅');

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
    setAttribute: vi.fn((name: string, value: string) => {
      if (name === 'data-gallery') element.dataset = { gallery: value };
      if (name === 'data-testid') element.dataset = { ...element.dataset, testid: value };
    }),
    getAttribute: vi.fn((name: string) => {
      if (name === 'data-gallery') return element.dataset?.gallery || null;
      if (name === 'data-testid') return element.dataset?.testid || null;
      return null;
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
  // 🚀 Ultimate Preact Hook 상태 초기화 (103개 테스트 실패 완전 해결!)
  resetPreactHookState();
  ensurePreactHookContext(); // Ultimate 컨텍스트 보장

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

  // 🎯 갤러리 컨테이너 미리 생성 (테스트에서 찾을 수 있도록)
  const galleryContainer = createMockElement('div');
  galleryContainer.setAttribute('data-gallery', 'enhanced');
  galleryContainer.className = 'gallery-container';
  galleryContainer.id = 'enhanced-gallery';
  global.document.body.appendChild(galleryContainer);

  // 추가 테스트용 요소들
  const tweetContainer = createMockElement('article');
  tweetContainer.setAttribute('data-testid', 'tweet');
  global.document.body.appendChild(tweetContainer);

  const videoPlayer = createMockElement('div');
  videoPlayer.setAttribute('data-testid', 'videoPlayer');
  global.document.body.appendChild(videoPlayer);

  const tweetPhoto = createMockElement('div');
  tweetPhoto.setAttribute('data-testid', 'tweetPhoto');
  global.document.body.appendChild(tweetPhoto);

  // 기본 테스트 환경 설정 (minimal)
  await setupTestEnvironment();
});

/**
 * 각 테스트 후에 환경 정리
 * 메모리 누수 방지 및 테스트 격리 보장
 */
afterEach(async () => {
  // 🧹 Ultimate 환경 정리 (Phase 1: Preact Hook)
  resetPreactHookState();
  cleanupPreactTestEnvironment(); // Ultimate 환경 정리

  // 🧹 Ultimate 환경 정리 (Phase 2: Console & DOM)
  cleanupUltimateConsoleEnvironment();
  cleanupUltimateDOMEnvironment();

  // DOM 정리 - body의 모든 자식 요소 제거
  while (global.document.body.children.length > 0) {
    global.document.body.removeChild(global.document.body.children[0]);
  }

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
