/**
 * Vendor 라이브러리 모킹 유틸리티
 * 프로젝트의 vendors getter 패턴에 맞는 테스트 Mock
 */

import { vi } from 'vitest';

// ================================
// Mock Vendor Implementations
// ================================

/**
 * Mock fflate API 생성
 */
export function createMockFflate() {
  return {
    zip: vi.fn().mockImplementation((files, callback) => {
      // 간단한 zip 시뮬레이션
      const result = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // ZIP 매직 넘버
      callback(null, result);
    }),

    unzip: vi.fn().mockImplementation((data, callback) => {
      // 간단한 unzip 시뮬레이션
      callback(null, { 'test.txt': new Uint8Array([116, 101, 115, 116]) });
    }),

    strToU8: vi.fn().mockImplementation(str => {
      return new TextEncoder().encode(str);
    }),

    strFromU8: vi.fn().mockImplementation(data => {
      return new TextDecoder().decode(data);
    }),

    zipSync: vi.fn().mockImplementation(files => {
      return new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    }),

    unzipSync: vi.fn().mockImplementation(data => {
      return { 'test.txt': new Uint8Array([116, 101, 115, 116]) };
    }),

    deflate: vi.fn().mockImplementation((data, callback) => {
      // 압축된 데이터 시뮬레이션
      const compressed = new Uint8Array(Math.floor(data.length * 0.7));
      callback(null, compressed);
    }),

    inflate: vi.fn().mockImplementation((data, callback) => {
      // 압축 해제된 데이터 시뮬레이션
      const decompressed = new Uint8Array(Math.floor(data.length * 1.3));
      callback(null, decompressed);
    }),
  };
}

/**
 * Mock Preact API 생성
 */
export function createMockPreact() {
  const MockComponent = vi.fn().mockImplementation(function MockComponent() {
    return { render: vi.fn() };
  });

  return {
    h: vi.fn().mockImplementation((type, props, ...children) => {
      return {
        type,
        props: { ...props, children: children.length === 1 ? children[0] : children },
        key: props?.key || null,
        ref: props?.ref || null,
      };
    }),

    render: vi.fn().mockImplementation((vnode, container) => {
      // 간단한 렌더링 시뮬레이션
      if (container && typeof container.appendChild === 'function') {
        const mockElement = document.createElement('div');
        mockElement.textContent = JSON.stringify(vnode);
        container.appendChild(mockElement);
      }
    }),

    Component: MockComponent,

    Fragment: vi.fn().mockImplementation(props => props.children),

    createContext: vi.fn().mockImplementation(defaultValue => ({
      Provider: vi.fn(),
      Consumer: vi.fn(),
      _defaultValue: defaultValue,
    })),

    cloneElement: vi.fn().mockImplementation((vnode, props) => {
      return { ...vnode, props: { ...vnode?.props, ...props } };
    }),

    createRef: vi.fn().mockImplementation(() => ({ current: null })),

    isValidElement: vi.fn().mockImplementation(obj => {
      return obj != null && typeof obj === 'object' && 'type' in obj;
    }),

    options: {},

    createElement: vi.fn().mockImplementation((type, props, ...children) => {
      return {
        type,
        props: { ...props, children: children.length === 1 ? children[0] : children },
        key: props?.key || null,
        ref: props?.ref || null,
      };
    }),
  };
}

/**
 * Mock Preact Hooks API 생성
 */
export function createMockPreactHooks() {
  return {
    useState: vi.fn().mockImplementation(initialValue => {
      const setValue = vi.fn();
      return [initialValue, setValue];
    }),

    useEffect: vi.fn().mockImplementation((effect, deps) => {
      // 동기적으로 effect 실행 (테스트 환경)
      const cleanup = effect();
      return cleanup;
    }),

    useMemo: vi.fn().mockImplementation((factory, deps) => {
      return factory();
    }),

    useCallback: vi.fn().mockImplementation((callback, deps) => {
      return callback;
    }),

    useRef: vi.fn().mockImplementation(initialValue => {
      return { current: initialValue };
    }),

    useContext: vi.fn().mockImplementation(context => {
      return context?._defaultValue;
    }),

    useReducer: vi.fn().mockImplementation((reducer, initialState) => {
      const dispatch = vi.fn();
      return [initialState, dispatch];
    }),

    useLayoutEffect: vi.fn().mockImplementation((effect, deps) => {
      // useEffect와 동일하게 처리 (테스트 환경)
      const cleanup = effect();
      return cleanup;
    }),
  };
}

/**
 * Mock Preact Signals API 생성
 */
export function createMockPreactSignals() {
  return {
    signal: vi.fn().mockImplementation(initialValue => {
      const signalObj = {
        value: initialValue,
        peek: () => signalObj.value,
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };
      return signalObj;
    }),

    computed: vi.fn().mockImplementation(computation => {
      const computedObj = {
        value: computation(),
        peek: () => computedObj.value,
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };
      return computedObj;
    }),

    effect: vi.fn().mockImplementation(fn => {
      const dispose = vi.fn();
      fn(); // 즉시 실행
      return dispose;
    }),

    batch: vi.fn().mockImplementation(fn => {
      return fn(); // 동기적으로 실행
    }),
  };
}

/**
 * Mock Motion API 생성
 */
export function createMockMotion() {
  return {
    animate: vi.fn().mockImplementation(async (element, keyframes, options) => {
      // 즉시 완료되는 애니메이션 시뮬레이션
      if (element && typeof element === 'object' && 'style' in element) {
        Object.assign(element.style, keyframes);
      }
      return Promise.resolve();
    }),

    scroll: vi.fn().mockImplementation((onScroll, options) => {
      // 스크롤 이벤트 시뮬레이션
      const handler = () => onScroll({ scrollY: 0, scrollX: 0 });
      return vi.fn(); // cleanup function
    }),

    timeline: vi.fn().mockImplementation(async (keyframes, options) => {
      // 타임라인 애니메이션 즉시 완료
      return Promise.resolve();
    }),

    stagger: vi.fn().mockImplementation((duration = 0.1, options) => {
      return vi.fn().mockImplementation(index => index * duration);
    }),
  };
}

// ================================
// Vendor Manager Mock
// ================================

/**
 * Vendor Manager Mock 클래스
 * 실제 프로젝트의 VendorManager와 호환되는 인터페이스
 */
export class MockVendorManager {
  static instance = null;
  cache = new Map();

  static getInstance() {
    MockVendorManager.instance ??= new MockVendorManager();
    return MockVendorManager.instance;
  }

  static resetInstance() {
    MockVendorManager.instance = null;
  }

  async getFflate() {
    if (!this.cache.has('fflate')) {
      this.cache.set('fflate', createMockFflate());
    }
    return this.cache.get('fflate');
  }

  async getPreact() {
    if (!this.cache.has('preact')) {
      this.cache.set('preact', createMockPreact());
    }
    return this.cache.get('preact');
  }

  async getPreactHooks() {
    if (!this.cache.has('preact-hooks')) {
      this.cache.set('preact-hooks', createMockPreactHooks());
    }
    return this.cache.get('preact-hooks');
  }

  async getPreactSignals() {
    if (!this.cache.has('preact-signals')) {
      this.cache.set('preact-signals', createMockPreactSignals());
    }
    return this.cache.get('preact-signals');
  }

  getMotion() {
    if (!this.cache.has('motion')) {
      this.cache.set('motion', createMockMotion());
    }
    return this.cache.get('motion');
  }

  // 테스트 헬퍼 메서드
  clearCache() {
    this.cache.clear();
  }
}

// ================================
// Vendor Mock Setup Functions
// ================================

/**
 * 전역 vendor getter Mock 설정
 */
export function setupVendorMocks() {
  const mockManager = MockVendorManager.getInstance();

  // @infrastructure/external/vendors 모듈 Mock
  vi.doMock('@infrastructure/external/vendors', () => ({
    getFflate: () => mockManager.getFflate(),
    getPreact: () => mockManager.getPreact(),
    getPreactHooks: () => mockManager.getPreactHooks(),
    getPreactSignals: () => mockManager.getPreactSignals(),
    getMotion: () => mockManager.getMotion(),
  }));

  return mockManager;
}

/**
 * Vendor Mock 정리
 */
export function cleanupVendorMocks() {
  MockVendorManager.resetInstance();
  vi.clearAllMocks();
}
