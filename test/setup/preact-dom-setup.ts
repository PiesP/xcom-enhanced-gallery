/**
 * Preact DOM 테스트 환경 설정
 *
 * Preact hooks이 테스트 환경에서 작동하도록 JSDOM 설정
 */

import { beforeEach, vi } from 'vitest';
import { getPreactHooks } from '@shared/external/vendors';

// Preact 컴포넌트 렌더링 컨텍스트 모킹
export function setupPreactTestEnvironment() {
  beforeEach(() => {
    // Preact 내부 hook context 모킹
    const mockHookContext = {
      __hooks: [],
      __h: 0,
      __H: null,
      __S: [],
      constructor: {
        __b: vi.fn(),
        __r: vi.fn(),
        __e: vi.fn(),
        __c: vi.fn(),
        __h: vi.fn(),
      },
    };

    // 글로벌 Preact context 설정
    globalThis.__preactHookContext = mockHookContext;

    // DOM element에 hook context 연결
    const originalCreateElement = document.createElement.bind(document);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).createElement = function (tagName: any) {
      const element = originalCreateElement(tagName);
      // @ts-ignore: Preact 내부 속성
      element.__$f = mockHookContext;
      return element;
    };
  });
}

// Mock HTML element factory with Preact context
export function createMockElementWithContext(tagName: string = 'div'): HTMLElement {
  const element = document.createElement(tagName);

  // Preact hook context 주입
  const mockContext = {
    __hooks: [],
    __h: 0,
    __H: null,
    __S: [],
    constructor: {
      __b: vi.fn(),
      __r: vi.fn(),
      __e: vi.fn(),
      __c: vi.fn(),
      __h: vi.fn(),
    },
  };

  // @ts-ignore: Preact 내부 속성
  element.__$f = mockContext;

  return element;
}
