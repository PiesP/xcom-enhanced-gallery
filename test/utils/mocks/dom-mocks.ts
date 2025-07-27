/**
 * DOM 환경 모킹 유틸리티
 * DOM API, 브라우저 환경 등을 테스트용으로 모킹
 */

import { vi } from 'vitest';

// ================================
// DOM Element Mock Factory
// ================================

export interface MockElementConfig {
  tagName?: string;
  attributes?: Record<string, string>;
  children?: MockElement[];
  textContent?: string;
}

export interface MockElement extends Partial<HTMLElement> {
  tagName: string;
  setAttribute: ReturnType<typeof vi.fn>;
  getAttribute: ReturnType<typeof vi.fn>;
  appendChild: ReturnType<typeof vi.fn>;
  removeChild: ReturnType<typeof vi.fn>;
  querySelector: ReturnType<typeof vi.fn>;
  querySelectorAll: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  click: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  blur: ReturnType<typeof vi.fn>;
  dataset: Record<string, string>;
  style: Record<string, string>;
  children: MockElement[];
  parentNode: MockElement | null;
}

/**
 * Mock DOM 요소 생성
 */
export function createMockElement(config: MockElementConfig = {}): MockElement {
  const { tagName = 'div', attributes = {}, children = [], textContent = '' } = config;

  const storedAttributes = new Map<string, string>();
  const storedDataset = { ...attributes };

  const element: MockElement = {
    tagName: tagName.toUpperCase(),
    textContent,
    dataset: storedDataset,
    style: {},
    children,
    parentNode: null,

    setAttribute: vi.fn().mockImplementation((name: string, value: string) => {
      storedAttributes.set(name, value);
      if (name.startsWith('data-')) {
        const dataKey = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        storedDataset[dataKey] = value;
      }
    }),

    getAttribute: vi.fn().mockImplementation((name: string) => {
      return storedAttributes.get(name) ?? null;
    }),

    appendChild: vi.fn().mockImplementation((child: MockElement) => {
      children.push(child);
      child.parentNode = element;
      return child;
    }),

    removeChild: vi.fn().mockImplementation((child: MockElement) => {
      const index = children.indexOf(child);
      if (index > -1) {
        children.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    }),

    querySelector: vi.fn().mockImplementation((selector: string) => {
      // 간단한 선택자 시뮬레이션
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        return children.find(child => child.getAttribute?.('id') === id) ?? null;
      }
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return children.find(child => child.getAttribute?.('class')?.includes(className)) ?? null;
      }
      if (selector.startsWith('[data-testid=')) {
        const testId = selector.match(/\[data-testid="([^"]+)"\]/)?.[1];
        return children.find(child => child.getAttribute?.('data-testid') === testId) ?? null;
      }
      return (
        children.find(child => child.tagName?.toLowerCase() === selector.toLowerCase()) ?? null
      );
    }),

    querySelectorAll: vi.fn().mockImplementation((selector: string) => {
      const results: MockElement[] = [];
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        results.push(
          ...children.filter(child => child.getAttribute?.('class')?.includes(className))
        );
      } else {
        results.push(
          ...children.filter(child => child.tagName?.toLowerCase() === selector.toLowerCase())
        );
      }
      return results;
    }),

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
  };

  // 초기 속성 설정
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

/**
 * Mock Image 요소 생성
 */
export function createMockImageElement(
  src: string,
  overrides: Partial<MockElement> = {}
): MockElement {
  return {
    ...createMockElement({ tagName: 'IMG', attributes: { src } }),
    src,
    alt: '',
    width: 1200,
    height: 800,
    naturalWidth: 1200,
    naturalHeight: 800,
    complete: true,
    ...overrides,
  };
}

/**
 * Mock Video 요소 생성
 */
export function createMockVideoElement(
  src: string,
  overrides: Partial<MockElement> = {}
): MockElement {
  return {
    ...createMockElement({ tagName: 'VIDEO', attributes: { src } }),
    src,
    poster: '',
    currentSrc: src,
    videoWidth: 1280,
    videoHeight: 720,
    duration: 30,
    currentTime: 0,
    paused: true,
    muted: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    ...overrides,
  };
}

// ================================
// DOM Environment Setup
// ================================

/**
 * 기본 DOM 환경 설정
 */
export function setupDOMEnvironment(): void {
  const mockDocument = createMockDocument();

  Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'window', {
    value: {
      document: mockDocument,
      location: {
        hostname: 'x.com',
        href: 'https://x.com/user/status/123456789',
        pathname: '/user/status/123456789',
        search: '?lang=en',
        hash: '',
        protocol: 'https:',
        port: '',
        host: 'x.com',
      },
      navigator: {
        language: 'en-US',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        vendor: 'Google Inc.',
        platform: 'Win32',
      },
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      setTimeout: vi.fn().mockImplementation((callback, delay) => setTimeout(callback, delay)),
      clearTimeout: vi.fn().mockImplementation(clearTimeout),
      setInterval: vi.fn().mockImplementation((callback, delay) => setInterval(callback, delay)),
      clearInterval: vi.fn().mockImplementation(clearInterval),
      scrollTo: vi.fn(),
      requestAnimationFrame: vi.fn().mockImplementation(callback => setTimeout(callback, 16)),
      cancelAnimationFrame: vi.fn(),
      matchMedia: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    },
    writable: true,
    configurable: true,
  });
}

/**
 * Mock Document 생성
 */
function createMockDocument(): Document {
  const bodyElement = createMockElement({ tagName: 'body' });
  const headElement = createMockElement({ tagName: 'head' });
  const documentElement = createMockElement({
    tagName: 'html',
    children: [headElement, bodyElement],
  });

  return {
    createElement: vi.fn().mockImplementation((tagName: string) => createMockElement({ tagName })),

    getElementById: vi
      .fn()
      .mockImplementation((id: string) => documentElement.querySelector?.(`#${id}`) ?? null),

    querySelector: vi
      .fn()
      .mockImplementation((selector: string) => documentElement.querySelector?.(selector) ?? null),

    querySelectorAll: vi
      .fn()
      .mockImplementation((selector: string) => documentElement.querySelectorAll?.(selector) ?? []),

    body: bodyElement,
    head: headElement,
    documentElement,

    readyState: 'complete',
    URL: 'https://x.com/user/status/123456789',

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as Document;
}

/**
 * Twitter/X.com 특화 DOM 구조 생성
 */
export function setupTwitterDOMStructure(): MockElement {
  const container = createMockElement({
    tagName: 'div',
    attributes: { id: 'test-container' },
  });

  // 트윗 구조 생성
  const article = createMockElement({
    tagName: 'article',
    attributes: {
      'data-testid': 'tweet',
      role: 'article',
    },
  });

  // 미디어 컨테이너
  const mediaContainer = createMockElement({
    tagName: 'div',
    attributes: { 'data-testid': 'tweetPhoto' },
  });

  const image = createMockImageElement(
    'https://pbs.twimg.com/media/test.jpg?format=jpg&name=large'
  );

  mediaContainer.appendChild(image);
  article.appendChild(mediaContainer);
  container.appendChild(article);

  return container;
}

/**
 * DOM 환경 정리
 */
export function cleanupDOMEnvironment(): void {
  Object.defineProperty(global, 'document', {
    value: undefined,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true,
    configurable: true,
  });
}
