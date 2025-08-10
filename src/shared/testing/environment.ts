/**
 * @fileoverview 테스트 환경 설정 유틸리티
 * TDD Phase 5c: Testing Strategy Unification - Environment Setup
 */

import type { TestEnvironmentConfig } from './types';

/**
 * 테스트 환경 생성
 */
export async function createTestEnvironment(config: TestEnvironmentConfig): Promise<{
  dom: Document;
  window: Window;
  mocks: Map<string, unknown>;
  cleanup: () => Promise<void>;
}> {
  const { scenario, mocks, timeout = 30000, isolated = true } = config;

  // DOM 환경 설정
  const dom = createTestDOM();
  const window = createTestWindow();

  // Mock 시스템 초기화
  const mockRegistry = new Map<string, unknown>();

  for (const mockName of mocks) {
    const mock = await createMock(mockName);
    mockRegistry.set(mockName, mock);
  }

  // 타임아웃 설정
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      throw new Error(`Test environment timeout after ${timeout}ms for scenario: ${scenario}`);
    }, timeout);
  }

  return {
    dom,
    window,
    mocks: mockRegistry,
    cleanup: async () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Mock 정리
      mockRegistry.clear();

      // DOM 정리 (필요시)
      if (isolated) {
        cleanupTestDOM(dom);
      }
    },
  };
}

/**
 * 기본 테스트 DOM 생성
 */
function createTestDOM(): Document {
  // JSDOM 또는 happy-dom 환경에서 사용
  if (typeof document !== 'undefined') {
    return document;
  }

  // 폴백: 최소 DOM 인터페이스
  return {
    createElement: (tagName: string) => ({
      tagName: tagName.toUpperCase(),
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  } as unknown as Document;
}

/**
 * 테스트 Window 객체 생성
 */
function createTestWindow(): Window {
  if (typeof window !== 'undefined') {
    return window;
  }

  return {
    document: createTestDOM(),
    location: { href: 'http://localhost' },
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  } as unknown as Window;
}

/**
 * Mock 생성 팩토리
 */
async function createMock(mockName: string): Promise<unknown> {
  switch (mockName) {
    case 'dom':
      return createDOMBasicMock();
    case 'services':
      return createServicesBasicMock();
    case 'gallery':
      return createGalleryBasicMock();
    default:
      return {};
  }
}

/**
 * 기본 DOM Mock
 */
function createDOMBasicMock() {
  return {
    document: createTestDOM(),
    window: createTestWindow(),
    createElement: (tag: string) => ({ tagName: tag }),
  };
}

/**
 * 기본 Services Mock
 */
function createServicesBasicMock() {
  return {
    getInstance: () => ({}),
    resetInstance: () => {},
    initialize: () => Promise.resolve(),
  };
}

/**
 * 기본 Gallery Mock
 */
function createGalleryBasicMock() {
  return {
    openGallery: () => Promise.resolve(),
    closeGallery: () => Promise.resolve(),
    isOpen: () => false,
  };
}

/**
 * 테스트 DOM 정리
 */
function cleanupTestDOM(dom: Document): void {
  // DOM 정리 로직 (메모리 누수 방지)
  if (dom.body) {
    dom.body.innerHTML = '';
  }
}
