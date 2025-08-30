// DOM mock utilities for tests
// Minimal, typesafe mocks to satisfy tests that expect HTMLElement/Document shapes.

import { vi } from 'vitest';

export interface MockElementConfig {
  tagName?: string;
  attributes?: Record<string, string>;
  children?: MockElement[];
  textContent?: string;
}

export interface MockHTMLCollection extends Array<MockElement> {
  namedItem(name: string): MockElement | null;
  item(index: number): MockElement | null;
}

export type MockElement = HTMLElement & {
  tagName: string;
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | null;
  appendChild: (child: MockElement) => MockElement;
  removeChild: (child: MockElement) => MockElement;
  querySelector: (selector: string) => MockElement | null;
  querySelectorAll: (selector: string) => MockElement[];
  addEventListener: (...args: any[]) => void;
  removeEventListener: (...args: any[]) => void;
  click: () => void;
  focus: () => void;
  blur: () => void;
  dataset: Record<string, string>;
  style: Partial<CSSStyleDeclaration>;
  children: MockHTMLCollection;
  parentNode: MockElement | null;
  childElementCount: number;
  firstElementChild: Element | null;
  lastElementChild: Element | null;
  src?: string;
  currentSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
  naturalWidth?: number;
  naturalHeight?: number;
  complete?: boolean;
  // video related
  videoWidth?: number;
  videoHeight?: number;
  duration?: number;
  currentTime?: number;
  paused?: boolean;
  muted?: boolean;
  play?: () => Promise<void> | void;
  pause?: () => void;
  load?: () => void;
};

export function createMockElement(config: MockElementConfig = {}): MockElement {
  const { tagName = 'div', attributes = {}, children = [], textContent = '' } = config;
  const stored = new Map<string, string>();
  const dataset: Record<string, string> = { ...attributes };

  const createCollection = (els: MockElement[] = []): MockHTMLCollection => {
    const coll = [...els] as MockHTMLCollection;
    coll.namedItem = (name: string) =>
      els.find(e => e.getAttribute?.('id') === name || e.getAttribute?.('name') === name) ?? null;
    coll.item = (i: number) => els[i] ?? null;
    return coll;
  };

  const childrenColl = createCollection(children);

  // classList 모의 구현
  const classList = {
    add: vi.fn().mockImplementation((...classNames: string[]) => {
      const current = stored.get('class') || '';
      const classes = new Set(current.split(' ').filter(Boolean));
      classNames.forEach(cls => classes.add(cls));
      stored.set('class', Array.from(classes).join(' '));
    }),
    remove: vi.fn().mockImplementation((...classNames: string[]) => {
      const current = stored.get('class') || '';
      const classes = new Set(current.split(' ').filter(Boolean));
      classNames.forEach(cls => classes.delete(cls));
      stored.set('class', Array.from(classes).join(' '));
    }),
    toggle: vi.fn().mockImplementation((className: string, force?: boolean) => {
      const current = stored.get('class') || '';
      const classes = new Set(current.split(' ').filter(Boolean));
      if (force === true) {
        classes.add(className);
        stored.set('class', Array.from(classes).join(' '));
        return true;
      } else if (force === false) {
        classes.delete(className);
        stored.set('class', Array.from(classes).join(' '));
        return false;
      } else {
        if (classes.has(className)) {
          classes.delete(className);
          stored.set('class', Array.from(classes).join(' '));
          return false;
        } else {
          classes.add(className);
          stored.set('class', Array.from(classes).join(' '));
          return true;
        }
      }
    }),
    contains: vi.fn().mockImplementation((className: string) => {
      const current = stored.get('class') || '';
      return current.split(' ').includes(className);
    }),
    replace: vi.fn().mockImplementation((oldClass: string, newClass: string) => {
      const current = stored.get('class') || '';
      const classes = current.split(' ').filter(Boolean);
      const index = classes.indexOf(oldClass);
      if (index !== -1) {
        classes[index] = newClass;
        stored.set('class', classes.join(' '));
        return true;
      }
      return false;
    }),
    item: vi.fn().mockImplementation((index: number) => {
      const current = stored.get('class') || '';
      const classes = current.split(' ').filter(Boolean);
      return classes[index] || null;
    }),
    get length() {
      const current = stored.get('class') || '';
      return current.split(' ').filter(Boolean).length;
    },
    toString: vi.fn().mockImplementation(() => stored.get('class') || ''),
    forEach: vi.fn().mockImplementation((callback: (value: string, index: number) => void) => {
      const current = stored.get('class') || '';
      const classes = current.split(' ').filter(Boolean);
      classes.forEach(callback);
    }),
  };

  const el: any = {
    tagName: tagName.toUpperCase(),
    nodeName: tagName.toUpperCase(),
    nodeType: 1, // ELEMENT_NODE
    nodeValue: null,
    localName: tagName.toLowerCase(),
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    prefix: null,
    ownerDocument: globalThis.document || null,
    textContent,
    innerHTML: '',
    outerHTML: `<${tagName.toLowerCase()}></${tagName.toLowerCase()}>`,
    id: '',
    className: '',
    dataset,
    style: Object.assign(document.createElement('div').style, {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      getPropertyValue: vi.fn().mockReturnValue(''),
      getPropertyPriority: vi.fn().mockReturnValue(''),
      item: vi.fn(),
      length: 0,
      cssText: '',
      parentRule: null,
      remove: vi.fn(), // Add remove method for style elements
    }),
    children: childrenColl,
    childNodes: childrenColl,
    parentNode: null,
    parentElement: null,
    childElementCount: children.length,
    firstChild: children.length ? (children[0] as any) : null,
    lastChild: children.length ? (children[children.length - 1] as any) : null,
    firstElementChild: children.length ? (children[0] as any) : null,
    lastElementChild: children.length ? (children[children.length - 1] as any) : null,
    nextSibling: null,
    previousSibling: null,
    nextElementSibling: null,
    previousElementSibling: null,
    classList,

    setAttribute: vi.fn().mockImplementation((n: string, v: string) => {
      stored.set(n, v);
      if (n.startsWith('data-')) {
        const key = n.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        dataset[key] = v;
      }
    }),

    getAttribute: vi.fn().mockImplementation((n: string) => stored.get(n) ?? null),

    removeAttribute: vi.fn().mockImplementation((n: string) => {
      stored.delete(n);
      if (n.startsWith('data-')) {
        const key = n.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        delete dataset[key];
      }
    }),

    appendChild: vi.fn().mockImplementation((c: MockElement) => {
      childrenColl.push(c);
      c.parentNode = el;
      return c;
    }),

    insertBefore: vi
      .fn()
      .mockImplementation((newNode: MockElement, referenceNode: MockElement | null) => {
        if (!referenceNode) {
          return el.appendChild(newNode);
        }
        const idx = childrenColl.indexOf(referenceNode);
        if (idx > -1) {
          childrenColl.splice(idx, 0, newNode);
          newNode.parentNode = el;
        }
        return newNode;
      }),

    removeChild: vi.fn().mockImplementation((c: MockElement) => {
      const idx = childrenColl.indexOf(c);
      if (idx > -1) childrenColl.splice(idx, 1);
      c.parentNode = null;
      return c;
    }),

    querySelector: vi.fn().mockImplementation((s: string) => {
      // data-testid 선택자 지원
      if (s.startsWith('[data-testid="') && s.endsWith('"]')) {
        const testid = s.slice(14, -2);
        return childrenColl.find(ch => ch.getAttribute?.('data-testid') === testid) ?? null;
      }
      // ID 선택자 지원
      if (s.startsWith('#')) {
        const id = s.slice(1);
        return childrenColl.find(ch => ch.getAttribute?.('id') === id) ?? null;
      }
      // 클래스 선택자 지원
      if (s.startsWith('.')) {
        const className = s.slice(1);
        return (
          childrenColl.find(ch => {
            const classList = ch.getAttribute?.('class') || '';
            return classList.split(' ').includes(className);
          }) ?? null
        );
      }
      // 태그 선택자 지원
      return childrenColl.find(ch => ch.tagName?.toLowerCase() === s.toLowerCase()) ?? null;
    }),
    querySelectorAll: vi.fn().mockImplementation((s: string) => {
      // data-testid 선택자 지원
      if (s.startsWith('[data-testid="') && s.endsWith('"]')) {
        const testid = s.slice(14, -2);
        return childrenColl.filter(ch => ch.getAttribute?.('data-testid') === testid);
      }
      // ID 선택자 지원
      if (s.startsWith('#')) {
        const id = s.slice(1);
        return childrenColl.filter(ch => ch.getAttribute?.('id') === id);
      }
      // 클래스 선택자 지원
      if (s.startsWith('.')) {
        const className = s.slice(1);
        return childrenColl.filter(ch => {
          const classList = ch.getAttribute?.('class') || '';
          return classList.split(' ').includes(className);
        });
      }
      // 태그 선택자 지원
      return childrenColl.filter(ch => ch.tagName?.toLowerCase() === s.toLowerCase());
    }),

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    remove: vi.fn().mockImplementation(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }),
    contains: vi.fn().mockImplementation((other: MockElement | null) => {
      if (!other) return false;
      let current = other.parentNode;
      while (current) {
        if (current === el) return true;
        current = current.parentNode;
      }
      return false;
    }),
  };

  Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));
  return el as unknown as MockElement;
}

export function createMockHTMLElement(config: MockElementConfig = {}): HTMLElement {
  const { tagName = 'div', attributes = {}, children = [], textContent = '' } = config;
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const el = document.createElement(tagName) as HTMLElement;
    if (textContent) el.textContent = textContent;
    Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));
    (children || []).forEach(child => {
      try {
        el.appendChild(child as unknown as Node);
      } catch (_) {
        // ignore
      }
    });
    return el;
  }
  return createMockElement(config) as unknown as HTMLElement;
}

export function createMockImageElement(
  src: string,
  overrides: Partial<MockElement> = {}
): MockElement {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const img = document.createElement('img') as HTMLImageElement;
    img.src = src;
    img.alt = '';
    img.width = 1200;
    img.height = 800;
    try {
      (img as any).naturalWidth = 1200;
      (img as any).naturalHeight = 800;
      (img as any).complete = true;
    } catch (_) {}
    Object.assign(img as any, overrides as any);
    return img as unknown as MockElement;
  }

  return {
    ...createMockElement({ tagName: 'img', attributes: { src } }),
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

export function createMockVideoElement(
  src: string,
  overrides: Partial<MockElement> = {}
): MockElement {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const v = document.createElement('video') as HTMLVideoElement;
    v.src = src;
    try {
      (v as any).currentSrc = src;
      (v as any).videoWidth = 1280;
      (v as any).videoHeight = 720;
      (v as any).duration = 30;
      (v as any).currentTime = 0;
      (v as any).paused = true;
      (v as any).muted = false;
    } catch (_) {}
    (v as any).play = vi.fn().mockResolvedValue(undefined);
    (v as any).pause = vi.fn();
    (v as any).load = vi.fn();
    Object.assign(v as any, overrides as any);
    return v as unknown as MockElement;
  }

  return {
    ...createMockElement({ tagName: 'video', attributes: { src } }),
    src,
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

export function setupDOMEnvironment(): void {
  const doc = createMockDocument();
  Object.defineProperty(global, 'document', { value: doc, writable: true, configurable: true });
  Object.defineProperty(global, 'window', {
    value: {
      document: doc,
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
      navigator: { language: 'en-US', userAgent: '', vendor: '', platform: '' },
      innerWidth: 1024,
      innerHeight: 768,
      devicePixelRatio: 1,
      scrollX: 0,
      scrollY: 0,
      setTimeout: vi.fn().mockImplementation((cb: any, t?: number) => setTimeout(cb, t)),
      clearTimeout: vi.fn().mockImplementation((id?: any) => clearTimeout(id)),
      setInterval: vi.fn().mockImplementation((cb: any, t?: number) => setInterval(cb, t)),
      clearInterval: vi.fn().mockImplementation((id?: any) => clearInterval(id)),
      requestAnimationFrame: vi
        .fn()
        .mockImplementation((cb: FrameRequestCallback) => setTimeout(cb as any, 16)),
      cancelAnimationFrame: vi.fn(),
      matchMedia: vi.fn().mockImplementation((q: string) => ({
        matches: false,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      getComputedStyle: vi.fn().mockImplementation((element: any) => ({
        getPropertyValue: vi.fn().mockReturnValue(''),
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
        getPropertyPriority: vi.fn().mockReturnValue(''),
        item: vi.fn(),
        length: 0,
        cssText: '',
        parentRule: null,
        // 자주 사용되는 CSS 속성들
        display: 'block',
        position: 'static',
        width: '100px',
        height: '100px',
        opacity: '1',
        transform: 'none',
        transition: 'none',
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible',
        'overflow-x': 'visible',
        'overflow-y': 'visible',
        'overscroll-behavior': 'auto',
        'overscroll-behavior-x': 'auto',
        'overscroll-behavior-y': 'auto',
      })),
      scrollTo: vi.fn().mockImplementation((xOrOptions: any, y?: number) => {
        if (typeof xOrOptions === 'number') {
          (globalThis.window as any).scrollX = xOrOptions || 0;
          (globalThis.window as any).scrollY = y || 0;
        } else if (xOrOptions && typeof xOrOptions === 'object') {
          (globalThis.window as any).scrollX = xOrOptions.left || 0;
          (globalThis.window as any).scrollY = xOrOptions.top || 0;
        }
      }),
    },
    writable: true,
    configurable: true,
  });
}

function createMockDocument(): Document {
  const body = createMockElement({ tagName: 'body' });
  const head = createMockElement({ tagName: 'head' });
  const html = createMockElement({ tagName: 'html', children: [head, body] });

  // SVG 네임스페이스 엘리먼트 생성을 위한 함수
  const createElementNS = vi
    .fn()
    .mockImplementation((namespaceURI: string, qualifiedName: string) => {
      if (namespaceURI === 'http://www.w3.org/2000/svg') {
        // SVG 엘리먼트용 특별한 mock
        const svgElement = createMockElement({ tagName: qualifiedName });
        // SVG 관련 속성 추가
        Object.assign(svgElement, {
          namespaceURI,
          setAttributeNS: vi.fn(),
          getAttributeNS: vi.fn().mockReturnValue(null),
          hasAttributeNS: vi.fn().mockReturnValue(false),
          removeAttributeNS: vi.fn(),
        });
        return svgElement;
      }
      return createMockElement({ tagName: qualifiedName });
    });

  // createTextNode 추가
  const createTextNode = vi.fn().mockImplementation((text: string) => {
    return {
      nodeType: 3, // TEXT_NODE
      textContent: text,
      nodeValue: text,
      data: text,
      wholeText: text,
      length: text.length,
      appendData: vi.fn(),
      deleteData: vi.fn(),
      insertData: vi.fn(),
      replaceData: vi.fn(),
      splitText: vi.fn(),
      substringData: vi.fn(),
      normalize: vi.fn(),
      cloneNode: vi.fn(),
      isEqualNode: vi.fn(),
      isSameNode: vi.fn(),
      compareDocumentPosition: vi.fn(),
      contains: vi.fn(),
      lookupPrefix: vi.fn(),
      lookupNamespaceURI: vi.fn(),
      isDefaultNamespace: vi.fn(),
      parentNode: null,
      parentElement: null,
      childNodes: [],
      firstChild: null,
      lastChild: null,
      previousSibling: null,
      nextSibling: null,
      ownerDocument: null,
    };
  });

  const doc: Partial<Document> = {
    createElement: vi.fn().mockImplementation((tag: string) => createMockElement({ tagName: tag })),
    createElementNS,
    createTextNode,
    getElementById: vi
      .fn()
      .mockImplementation((id: string) => html.querySelector?.(`#${id}`) ?? null),
    querySelector: vi.fn().mockImplementation((s: string) => {
      // 전체 문서에서 검색
      const searchInElement = (element: any): any => {
        // 현재 엘리먼트 체크
        if (element.querySelector) {
          const result = element.querySelector(s);
          if (result) return result;
        }
        // 자식들에서 재귀적으로 검색
        if (element.children) {
          for (const child of element.children) {
            const result = searchInElement(child);
            if (result) return result;
          }
        }
        return null;
      };
      return searchInElement(html);
    }),
    querySelectorAll: vi.fn().mockImplementation((s: string) => {
      // 전체 문서에서 검색
      const results: any[] = [];
      const searchInElement = (element: any): void => {
        // 현재 엘리먼트에서 검색
        if (element.querySelectorAll) {
          const elementResults = element.querySelectorAll(s);
          results.push(...elementResults);
        }
        // 자식들에서 재귀적으로 검색
        if (element.children) {
          for (const child of element.children) {
            searchInElement(child);
          }
        }
      };
      searchInElement(html);
      return results;
    }),
    body,
    head,
    documentElement: {
      ...html,
      style: Object.assign(document.createElement('div').style, {
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
        getPropertyValue: vi.fn().mockReturnValue(''),
      }),
    },
    readyState: 'complete',
    URL: 'https://x.com',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  return doc as unknown as Document;
}

export function setupTwitterDOMStructure(): MockElement {
  const container = createMockElement({ tagName: 'div', attributes: { id: 'test-container' } });
  const article = createMockElement({
    tagName: 'article',
    attributes: { 'data-testid': 'tweet', role: 'article' },
  });
  const media = createMockElement({ tagName: 'div', attributes: { 'data-testid': 'tweetPhoto' } });
  const img = createMockImageElement('https://pbs.twimg.com/media/test.jpg');
  media.appendChild(img);
  article.appendChild(media);
  container.appendChild(article);
  return container;
}

export function cleanupDOMEnvironment(): void {
  Object.defineProperty(global, 'document', {
    value: undefined,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(global, 'window', { value: undefined, writable: true, configurable: true });
}
