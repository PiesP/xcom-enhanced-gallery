/**
 * Vendor 라이브러리 모킹 유틸리티
 * 프로젝트의 vendors getter 패턴에 맞는 테스트 Mock
 */

import { vi } from 'vitest';

// ================================
// Vendor Implementations
// ================================

/**
 * Mock fflate API 생성
 */
export function createMockFflate() {
  return {
    compress: vi.fn().mockImplementation((data, callback) => {
      // 압축 시뮬레이션
      const compressed = new Uint8Array(Math.floor(data.length * 0.7));
      callback(null, compressed);
    }),

    decompress: vi.fn().mockImplementation((data, callback) => {
      // 압축 해제 시뮬레이션
      callback(null, { 'test.txt': new Uint8Array([116, 101, 115, 116]) });
    }),

    strToU8: vi.fn().mockImplementation(str => {
      // 간단한 UTF-8 인코딩 시뮬레이션
      const result = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i) & 0xff;
      }
      return result;
    }),

    strFromU8: vi.fn().mockImplementation(data => {
      // 간단한 UTF-8 디코딩 시뮬레이션
      return String.fromCharCode(...Array.from(data));
    }),

    zipSync: vi.fn().mockImplementation(() => {
      return new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    }),

    unzipSync: vi.fn().mockImplementation(() => {
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
  return {
    h: vi.fn().mockImplementation((type, props, ...children) => {
      return {
        type,
        props: { ...props, children: children.length === 1 ? children[0] : children },
        key: props?.key || null,
      };
    }),

    Fragment: vi.fn().mockImplementation(({ children }) => children),

    render: vi.fn().mockImplementation((vnode, container) => {
      if (container && typeof container === 'object' && 'appendChild' in container) {
        // DOM에 렌더링 시뮬레이션
        const mockElement = { tagName: 'DIV', children: [vnode] };
        container.appendChild(mockElement);
      }
      return vnode;
    }),

    createContext: vi.fn().mockImplementation(defaultValue => ({
      Provider: vi.fn().mockImplementation(({ value, children }) => ({ value, children })),
      Consumer: vi
        .fn()
        .mockImplementation(({ children }) =>
          typeof children === 'function' ? children(defaultValue) : children
        ),
      displayName: 'MockContext',
    })),

    cloneElement: vi.fn().mockImplementation((element, props, ...children) => ({
      ...element,
      props: {
        ...element.props,
        ...props,
        children: children.length > 0 ? children : element.props.children,
      },
    })),

    isValidElement: vi
      .fn()
      .mockImplementation(element => element && typeof element === 'object' && 'type' in element),

    Component: vi.fn().mockImplementation(function (props) {
      this.props = props;
      this.state = {};
      this.setState = vi.fn();
      this.forceUpdate = vi.fn();
    }),

    PureComponent: vi.fn().mockImplementation(function (props) {
      this.props = props;
      this.state = {};
      this.setState = vi.fn();
      this.forceUpdate = vi.fn();
    }),
  };
}

/**
 * Mock Preact Hooks API 생성
 */
export function createMockPreactHooks() {
  const stateMap = new Map();
  let hookIndex = 0;

  return {
    useState: vi.fn().mockImplementation(initialState => {
      const currentIndex = hookIndex++;
      if (!stateMap.has(currentIndex)) {
        stateMap.set(
          currentIndex,
          typeof initialState === 'function' ? initialState() : initialState
        );
      }
      const setState = vi.fn().mockImplementation(newState => {
        const prevState = stateMap.get(currentIndex);
        const nextState = typeof newState === 'function' ? newState(prevState) : newState;
        stateMap.set(currentIndex, nextState);
      });
      return [stateMap.get(currentIndex), setState];
    }),

    useEffect: vi.fn().mockImplementation(effect => {
      if (typeof effect === 'function') {
        effect();
      }
    }),

    useMemo: vi.fn().mockImplementation(factory => {
      return typeof factory === 'function' ? factory() : null;
    }),

    useCallback: vi.fn().mockImplementation(callback => {
      return callback;
    }),

    useRef: vi.fn().mockImplementation(initialValue => ({
      current: initialValue,
    })),

    useReducer: vi.fn().mockImplementation((reducer, initialState) => {
      const [state, setState] = createMockPreactHooks().useState(initialState);
      const dispatch = vi.fn().mockImplementation(action => {
        const newState = reducer(state, action);
        setState(newState);
      });
      return [state, dispatch];
    }),

    useContext: vi.fn().mockImplementation(context => context.defaultValue || {}),

    useLayoutEffect: vi.fn().mockImplementation(effect => {
      if (typeof effect === 'function') {
        effect();
      }
    }),

    useImperativeHandle: vi.fn(),
    useDebugValue: vi.fn(),
  };
}

/**
 * Mock Preact Signals API 생성
 */
export function createMockPreactSignals() {
  return {
    signal: vi.fn().mockImplementation(value => ({
      value,
      peek: vi.fn(() => value),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),

    computed: vi.fn().mockImplementation(fn => ({
      value: typeof fn === 'function' ? fn() : null,
      peek: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),

    effect: vi.fn().mockImplementation(fn => {
      if (typeof fn === 'function') {
        fn();
      }
      return vi.fn(); // cleanup function
    }),

    batch: vi.fn().mockImplementation(fn => {
      if (typeof fn === 'function') {
        return fn();
      }
    }),
  };
}

/**
 * Mock Motion API 생성
 */
export function createMockMotion() {
  return {
    animate: vi.fn().mockImplementation(async () => {
      // 애니메이션 완료 시뮬레이션
      return Promise.resolve({
        finished: Promise.resolve(),
        cancel: vi.fn(),
        pause: vi.fn(),
        play: vi.fn(),
        currentTime: 0,
        playbackRate: 1,
      });
    }),

    scroll: vi.fn().mockImplementation(() => {
      return vi.fn(); // cleanup function
    }),

    timeline: vi.fn().mockImplementation(async () => {
      return Promise.resolve({
        finished: Promise.resolve(),
        cancel: vi.fn(),
        pause: vi.fn(),
        play: vi.fn(),
      });
    }),

    stagger: vi.fn().mockImplementation((duration = 0.1) => {
      return Array.from({ length: 10 }, (_, i) => i * duration);
    }),

    spring: vi.fn().mockImplementation(() => ({ mass: 1, stiffness: 100, damping: 10 })),

    inView: vi.fn().mockImplementation((element, callback) => {
      if (typeof callback === 'function') {
        // 즉시 in-view 상태로 시뮬레이션
        globalThis.setTimeout(() => callback(true), 0);
      }
      return vi.fn(); // cleanup function
    }),
  };
}

// ================================
// Vendor Getter 함수들
// ================================

/**
 * Mock vendor getter 함수들
 */
export const mockVendorGetters = {
  getFflate: vi.fn().mockReturnValue(createMockFflate()),
  getPreact: vi.fn().mockReturnValue(createMockPreact()),
  getPreactHooks: vi.fn().mockReturnValue(createMockPreactHooks()),
  getPreactSignals: vi.fn().mockReturnValue(createMockPreactSignals()),
  getMotion: vi.fn().mockReturnValue(createMockMotion()),
};

/**
 * Vendor API 모킹 설정
 */
export function setupVendorMocks() {
  // Mock modules
  vi.doMock('fflate', () => createMockFflate());
  vi.doMock('preact', () => createMockPreact());
  vi.doMock('preact/hooks', () => createMockPreactHooks());
  vi.doMock('@preact/signals', () => createMockPreactSignals());
  vi.doMock('motion', () => createMockMotion());

  return mockVendorGetters;
}

/**
 * Vendor 모킹 정리
 */
export function cleanupVendorMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
}

/**
 * Mock Vendor Manager 클래스
 */
export class MockVendorManager {
  private vendors: Map<string, any> = new Map();

  constructor() {
    this.vendors.set('fflate', createMockFflate());
    this.vendors.set('preact', createMockPreact());
    this.vendors.set('preact/hooks', createMockPreactHooks());
    this.vendors.set('@preact/signals', createMockPreactSignals());
    this.vendors.set('motion', createMockMotion());
  }

  get(name: string) {
    return this.vendors.get(name);
  }

  getFflate() {
    return this.get('fflate');
  }

  getPreact() {
    return this.get('preact');
  }

  getPreactHooks() {
    return this.get('preact/hooks');
  }

  getPreactSignals() {
    return this.get('@preact/signals');
  }

  getMotion() {
    return this.get('motion');
  }
}
