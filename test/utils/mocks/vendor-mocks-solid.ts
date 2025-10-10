/**
 * Vendor 라이브러리 모킹 유틸리티 (Solid.js 기반)
 * 프로젝트의 vendors getter 패턴에 맞는 테스트 Mock
 *
 * @version 2.0.0 - Solid.js 마이그레이션
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
    zip: vi
      .fn()
      .mockImplementation(
        (_files: unknown, callback: (err: Error | null, result: Uint8Array) => void) => {
          const result = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // ZIP 매직 넘버
          callback(null, result);
        }
      ),

    unzip: vi
      .fn()
      .mockImplementation(
        (
          _data: unknown,
          callback: (err: Error | null, result: Record<string, Uint8Array>) => void
        ) => {
          callback(null, { 'test.txt': new Uint8Array([116, 101, 115, 116]) });
        }
      ),

    strToU8: vi.fn().mockImplementation((str: string) => {
      const bytes: number[] = [];
      for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i));
      }
      return new Uint8Array(bytes);
    }),

    strFromU8: vi.fn().mockImplementation((data: Uint8Array) => {
      return String.fromCharCode(...Array.from(data));
    }),

    zipSync: vi.fn().mockImplementation(() => {
      return new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    }),

    unzipSync: vi.fn().mockImplementation(() => {
      return { 'test.txt': new Uint8Array([116, 101, 115, 116]) };
    }),

    deflate: vi
      .fn()
      .mockImplementation(
        (data: Uint8Array, callback: (err: Error | null, result: Uint8Array) => void) => {
          const compressed = new Uint8Array(Math.floor(data.length * 0.7));
          callback(null, compressed);
        }
      ),

    inflate: vi
      .fn()
      .mockImplementation(
        (data: Uint8Array, callback: (err: Error | null, result: Uint8Array) => void) => {
          const decompressed = new Uint8Array(Math.floor(data.length * 1.3));
          callback(null, decompressed);
        }
      ),
  };
}

/**
 * Mock Solid.js API 생성
 * Solid.js의 핵심 primitives와 JSX 함수들을 모킹
 */
export function createMockSolid() {
  // JSX 엘리먼트를 표현하는 간단한 객체
  const createMockElement = (
    type: unknown,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ) => ({
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
    key: props?.key || null,
  });

  return {
    // JSX 렌더링
    h: vi.fn().mockImplementation(createMockElement),
    createElement: vi.fn().mockImplementation(createMockElement),

    render: vi.fn().mockImplementation((code: () => unknown, container?: HTMLElement) => {
      const result = typeof code === 'function' ? code() : code;
      if (container && typeof container.appendChild === 'function') {
        const mockElement = document.createTextNode(JSON.stringify(result));
        container.appendChild(mockElement);
      }
      return vi.fn(); // dispose function
    }),

    // Solid.js Primitives
    createSignal: vi.fn().mockImplementation(<T>(initialValue: T) => {
      let value = initialValue;
      const getter = vi.fn(() => value);
      const setter = vi.fn((newValue: T | ((prev: T) => T)) => {
        value = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
      });
      return [getter, setter] as const;
    }),

    createEffect: vi.fn().mockImplementation((fn: () => void | (() => void)) => {
      const cleanup = fn();
      if (typeof cleanup === 'function') {
        return cleanup;
      }
      return undefined;
    }),

    createMemo: vi.fn().mockImplementation(<T>(fn: () => T) => {
      const value = fn();
      return vi.fn(() => value);
    }),

    createRoot: vi.fn().mockImplementation(<T>(fn: (dispose: () => void) => T) => {
      const dispose = vi.fn();
      return fn(dispose);
    }),

    onCleanup: vi.fn().mockImplementation((_fn: () => void) => {
      // 테스트 환경에서는 즉시 등록만 함
    }),

    onMount: vi.fn().mockImplementation((fn: () => void) => {
      fn(); // 테스트에서는 즉시 실행
    }),

    batch: vi.fn().mockImplementation(<T>(fn: () => T): T => {
      return fn(); // 동기적으로 실행
    }),

    untrack: vi.fn().mockImplementation(<T>(fn: () => T): T => {
      return fn();
    }),

    // Context API
    createContext: vi.fn().mockImplementation(<T>(defaultValue?: T) => ({
      Provider: vi.fn(),
      id: Symbol(),
      defaultValue,
    })),

    useContext: vi.fn().mockImplementation(<T>(context: { defaultValue?: T }) => {
      return context.defaultValue;
    }),

    // Ref
    useRef: vi.fn().mockImplementation(<T>(initialValue: T | null = null) => {
      return { current: initialValue };
    }),

    // Control Flow Components
    Show: vi.fn().mockImplementation(({ when, children }: { when: unknown; children: unknown }) => {
      return when ? children : null;
    }),

    For: vi
      .fn()
      .mockImplementation(
        ({
          each,
          children,
        }: {
          each: unknown[];
          children: (item: unknown, index: () => number) => unknown;
        }) => {
          if (!Array.isArray(each)) return null;
          return each.map((item, i) => children(item, () => i));
        }
      ),

    Switch: vi.fn().mockImplementation(({ children }: { children: unknown }) => children),
    Match: vi
      .fn()
      .mockImplementation(({ when, children }: { when: boolean; children: unknown }) =>
        when ? children : null
      ),

    // Dynamic
    Dynamic: vi
      .fn()
      .mockImplementation(
        ({ component, ...props }: { component: unknown; [key: string]: unknown }) => {
          if (typeof component === 'function') {
            return (component as (props: unknown) => unknown)(props);
          }
          return null;
        }
      ),

    // Portal
    Portal: vi.fn().mockImplementation(({ children }: { children: unknown }) => children),

    // Error Boundary
    ErrorBoundary: vi.fn().mockImplementation(({ children }: { children: unknown }) => children),

    // Suspense
    Suspense: vi.fn().mockImplementation(({ children }: { children: unknown }) => children),

    // Utilities
    mergeProps: vi.fn().mockImplementation((...sources: Record<string, unknown>[]) => {
      return Object.assign({}, ...sources);
    }),

    splitProps: vi
      .fn()
      .mockImplementation(<T extends Record<string, unknown>>(props: T, ...keys: (keyof T)[][]) => {
        const split: Record<string, unknown>[] = [];
        keys.forEach(keySet => {
          const obj: Record<string, unknown> = {};
          keySet.forEach(key => {
            if (key in props) {
              obj[key as string] = props[key];
            }
          });
          split.push(obj);
        });
        return split;
      }),
  };
}

/**
 * Mock Solid.js Store API 생성
 */
export function createMockSolidStore() {
  return {
    createStore: vi
      .fn()
      .mockImplementation(<T extends Record<string, unknown>>(initialValue: T) => {
        let store = { ...initialValue };
        const setter = vi.fn((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
          const changes = typeof updates === 'function' ? updates(store as T) : updates;
          store = { ...store, ...changes };
        });
        return [store, setter] as const;
      }),

    produce: vi.fn().mockImplementation(<T>(fn: (state: T) => void) => {
      return (state: T) => {
        const draft = { ...state };
        fn(draft);
        return draft;
      };
    }),

    reconcile: vi.fn().mockImplementation(<T>(value: T) => {
      return () => value;
    }),

    unwrap: vi.fn().mockImplementation(<T>(value: T): T => {
      return value;
    }),
  };
}

/**
 * Mock Motion API 생성
 */
export function createMockMotion() {
  return {
    animate: vi
      .fn()
      .mockImplementation(
        async (element: HTMLElement | null, keyframes: Record<string, unknown>) => {
          if (element && typeof element === 'object' && 'style' in element) {
            Object.assign(element.style, keyframes);
          }
          return Promise.resolve();
        }
      ),

    scroll: vi
      .fn()
      .mockImplementation((onScroll: (data: { scrollY: number; scrollX: number }) => void) => {
        onScroll({ scrollY: 0, scrollX: 0 });
        return vi.fn(); // cleanup function
      }),

    timeline: vi.fn().mockImplementation(async () => {
      return Promise.resolve();
    }),

    stagger: vi.fn().mockImplementation((duration = 0.1) => {
      return vi.fn().mockImplementation((index: number) => index * duration);
    }),
  };
}

// ================================
// Vendor Manager Mock
// ================================

/**
 * Vendor Manager Mock 클래스
 * Solid.js 기반의 VendorManager와 호환되는 인터페이스
 */
export class MockVendorManager {
  private static instance: MockVendorManager | null = null;
  private cache = new Map<string, unknown>();

  static getInstance(): MockVendorManager {
    if (!MockVendorManager.instance) {
      MockVendorManager.instance = new MockVendorManager();
    }
    return MockVendorManager.instance;
  }

  static resetInstance(): void {
    MockVendorManager.instance = null;
  }

  async getFflate() {
    if (!this.cache.has('fflate')) {
      this.cache.set('fflate', createMockFflate());
    }
    return this.cache.get('fflate');
  }

  getSolid() {
    if (!this.cache.has('solid')) {
      this.cache.set('solid', createMockSolid());
    }
    return this.cache.get('solid');
  }

  getSolidStore() {
    if (!this.cache.has('solid-store')) {
      this.cache.set('solid-store', createMockSolidStore());
    }
    return this.cache.get('solid-store');
  }

  getMotion() {
    if (!this.cache.has('motion')) {
      this.cache.set('motion', createMockMotion());
    }
    return this.cache.get('motion');
  }

  // 테스트 헬퍼 메서드
  clearCache(): void {
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

  // @shared/external/vendors 모듈 Mock
  vi.doMock('@shared/external/vendors', () => ({
    getFflate: () => mockManager.getFflate(),
    getSolid: () => mockManager.getSolid(),
    getSolidStore: () => mockManager.getSolidStore(),
    getMotion: () => mockManager.getMotion(),
    initializeVendors: vi.fn().mockResolvedValue(undefined),
  }));

  return mockManager;
}

/**
 * Vendor Mock 정리
 */
export function cleanupVendorMocks(): void {
  MockVendorManager.resetInstance();
  vi.clearAllMocks();
}

// Legacy 호환성을 위한 alias (점진적 마이그레이션용)
export const createMockPreact = createMockSolid;
export const createMockPreactHooks = createMockSolid;
export const createMockPreactSignals = createMockSolid;
