/**
 * DOM 환경 모킹 유틸리티
 * DOM API, 브라우저 환경 등을 테스트용으로 모킹
 */

import { vi } from 'vitest';

/**
 * Mock DOM 요소 생성
 */
export function createMockElement(tagName = 'div') {
  return {
    tagName: tagName.toUpperCase(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    hasAttribute: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    replaceChild: vi.fn(),
    contains: vi.fn(),
    closest: vi.fn(),
    matches: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn(),
    },
    style: {},
    dataset: {},
    innerHTML: '',
    textContent: '',
    className: '',
    id: '',
    parentNode: null,
    childNodes: [],
    children: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
  };
}

/**
 * Mock 이미지 요소 생성
 */
export function createMockImageElement(src = 'https://example.com/image.jpg') {
  const element = createMockElement('img');
  return {
    ...element,
    src,
    alt: '',
    width: 0,
    height: 0,
    naturalWidth: 100,
    naturalHeight: 100,
    complete: true,
    loading: 'eager',
    onload: null,
    onerror: null,
  };
}

/**
 * Mock 비디오 요소 생성
 */
export function createMockVideoElement(src = 'https://example.com/video.mp4') {
  const element = createMockElement('video');
  return {
    ...element,
    src,
    controls: false,
    autoplay: false,
    muted: false,
    loop: false,
    duration: 0,
    currentTime: 0,
    paused: true,
    ended: false,
    play: vi.fn(),
    pause: vi.fn(),
    load: vi.fn(),
  };
}

/**
 * Mock 이벤트 생성
 */
export function createMockEvent(eventType = 'click', options = {}) {
  return {
    type: eventType,
    bubbles: false,
    cancelable: false,
    target: null,
    currentTarget: null,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...options,
  };
}

/**
 * DOM 환경 설정
 */
export function setupMockDOM() {
  const mockDocument = {
    createElement: vi.fn(tagName => createMockElement(tagName)),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    getElementById: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    body: createMockElement('body'),
    documentElement: createMockElement('html'),
  };

  const mockWindow = {
    document: mockDocument,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    location: {
      href: 'https://example.com',
      hostname: 'example.com',
      pathname: '/',
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Test)',
    },
  };

  // globalThis에 설정
  Object.defineProperty(globalThis, 'document', {
    value: mockDocument,
    writable: true,
  });

  Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    writable: true,
  });

  return { mockDocument, mockWindow };
}

/**
 * DOM 환경 정리
 */
export function cleanupMockDOM() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).window;
}

/**
 * DOM 환경 설정 (통합 함수)
 */
export function setupDOMEnvironment() {
  return setupMockDOM();
}
