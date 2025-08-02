/**
 * 테스트 객체 팩토리 함수
 * 동적으로 테스트 데이터를 생성하는 팩토리 패턴
 */

import { mockImageInfo, mockVideoInfo, mockBrowserEnvironment } from './test-data';

// ================================
// Type Definitions
// ================================

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  info: ImageInfo | VideoInfo;
  downloadStatus: 'idle' | 'downloading' | 'completed' | 'failed';
  clickedIndex?: number;
}

export interface ImageInfo {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface VideoInfo {
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface BrowserEnvironment {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
}

// ================================
// Media URL Factories
// ================================

/**
 * Mock 미디어 URL 생성
 */
export function createMockMediaUrl(
  type: 'image' | 'video' = 'image',
  domain: string = 'pbs.twimg.com'
): string {
  const timestamp = Date.now();
  const formats = {
    image: ['jpg', 'png', 'webp'],
    video: ['mp4', 'webm'],
  };

  const format = formats[type][Math.floor(Math.random() * formats[type].length)];
  return `https://${domain}/media/${timestamp}_${type}.${format}`;
}

/**
 * Mock 트위터 URL 생성
 */
export function createMockTwitterUrl(username: string = 'testuser'): string {
  const statusId = Math.floor(Math.random() * 1000000000000000);
  return `https://twitter.com/${username}/status/${statusId}`;
}

// ================================
// Media Item Factories
// ================================

/**
 * Mock 이미지 아이템 생성
 */
export function createMockImageItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `img_${Date.now()}_${Math.random()}`,
    type: 'image',
    info: { ...mockImageInfo },
    downloadStatus: 'idle',
    ...overrides,
  };
}

/**
 * Mock 비디오 아이템 생성
 */
export function createMockVideoItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `vid_${Date.now()}_${Math.random()}`,
    type: 'video',
    info: { ...mockVideoInfo },
    downloadStatus: 'idle',
    ...overrides,
  };
}

/**
 * Mock 미디어 아이템 배열 생성
 */
export function createMockMediaItems(count: number = 5): MediaItem[] {
  return Array.from({ length: count }, (_, index) => {
    const type = index % 2 === 0 ? 'image' : 'video';
    return type === 'image'
      ? createMockImageItem({ clickedIndex: index })
      : createMockVideoItem({ clickedIndex: index });
  });
}

// ================================
// Browser Environment Factories
// ================================

/**
 * Mock 브라우저 환경 생성
 */
export function createMockBrowserEnvironment(
  overrides: Partial<BrowserEnvironment> = {}
): BrowserEnvironment {
  return {
    ...mockBrowserEnvironment,
    ...overrides,
  };
}

// ================================
// DOM Element Factories
// ================================

/**
 * Mock DOM 요소 생성
 */
export function createMockElement(
  tagName: string = 'div',
  attributes: Record<string, string> = {}
): HTMLElement {
  const element = {
    tagName: tagName.toUpperCase(),
    className: '',
    getAttribute: function (name: string) {
      return this.attributes[name] || null;
    },
    setAttribute: function (name: string, value: string) {
      this.attributes[name] = value;
      if (name === 'class') {
        this.className = value;
      }
    },
    hasAttribute: function (name: string) {
      return name in this.attributes;
    },
    classList: {
      contains: function (className: string) {
        return (element.className || '').split(' ').includes(className);
      },
      add: function (className: string) {
        const current = element.className || '';
        if (!this.contains(className)) {
          element.className = current ? `${current} ${className}` : className;
        }
      },
      remove: function (className: string) {
        const classes = (element.className || '').split(' ').filter(c => c !== className);
        element.className = classes.join(' ');
      },
      toggle: function (className: string, force?: boolean) {
        if (force !== undefined) {
          if (force) {
            this.add(className);
          } else {
            this.remove(className);
          }
        } else {
          if (this.contains(className)) {
            this.remove(className);
          } else {
            this.add(className);
          }
        }
      },
    },
    style: {} as CSSStyleDeclaration,
    textContent: '',
    innerHTML: '',
    attributes: {} as Record<string, string>,
    onclick: null,
    onkeydown: null,
    onkeypress: null,
    tabIndex: -1,
    querySelectorAll: function () {
      return [];
    },
    querySelector: function () {
      return null;
    },
    addEventListener: function () {
      return true;
    },
    removeEventListener: function () {
      return true;
    },
    click: function () {},
    focus: function () {},
    blur: function () {},
  } as any;

  // 속성 설정
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element as HTMLElement;
}

/**
 * Mock 이미지 요소 생성
 */
export function createMockImageElement(
  src: string,
  attributes: Record<string, string> = {}
): HTMLImageElement {
  const defaultAttrs = {
    src,
    alt: 'Test image',
    loading: 'lazy',
  };

  const element = createMockElement('img', { ...defaultAttrs, ...attributes }) as any;
  element.src = src;
  element.naturalWidth = parseInt(attributes.width || '1920', 10);
  element.naturalHeight = parseInt(attributes.height || '1080', 10);

  return element as HTMLImageElement;
}

/**
 * Mock 비디오 요소 생성
 */
export function createMockVideoElement(
  src: string,
  attributes: Record<string, string> = {}
): HTMLVideoElement {
  const defaultAttrs = {
    src,
    controls: 'true',
    muted: 'true',
  };

  const element = createMockElement('video', { ...defaultAttrs, ...attributes }) as any;
  element.src = src;
  element.duration = parseInt(attributes.duration || '30', 10);
  element.videoWidth = parseInt(attributes.width || '1920', 10);
  element.videoHeight = parseInt(attributes.height || '1080', 10);

  return element as HTMLVideoElement;
}

// ================================
// Event Factories
// ================================

/**
 * Mock 키보드 이벤트 생성
 */
export function createMockKeyboardEvent(
  type: string,
  options: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return {
    type,
    key: '',
    code: '',
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    preventDefault: () => {},
    stopPropagation: () => {},
    ...options,
  } as KeyboardEvent;
}

/**
 * Mock 마우스 이벤트 생성
 */
export function createMockMouseEvent(type: string, options: Partial<MouseEvent> = {}): MouseEvent {
  return {
    type,
    clientX: 0,
    clientY: 0,
    button: 0,
    buttons: 0,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    preventDefault: () => {},
    stopPropagation: () => {},
    ...options,
  } as MouseEvent;
}

// ================================
// Utility Functions
// ================================

/**
 * 랜덤 테스트 ID 생성
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mock Promise 생성
 */
export function createMockPromise<T>(
  value: T,
  delay: number = 0,
  shouldReject: boolean = false
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldReject) {
        reject(new Error(`Mock error for ${value}`));
      } else {
        resolve(value);
      }
    }, delay);
  });
}
