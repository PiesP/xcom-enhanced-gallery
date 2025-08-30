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

  const el: any = {
    tagName: tagName.toUpperCase(),
    textContent,
    dataset,
    style: {},
    children: childrenColl,
    parentNode: null,
    childElementCount: children.length,
    firstElementChild: children.length ? (children[0] as any) : null,
    lastElementChild: children.length ? (children[children.length - 1] as any) : null,

    setAttribute: vi.fn().mockImplementation((n: string, v: string) => {
      stored.set(n, v);
      if (n.startsWith('data-')) {
        const key = n.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        dataset[key] = v;
      }
    }),

    getAttribute: vi.fn().mockImplementation((n: string) => stored.get(n) ?? null),

    appendChild: vi.fn().mockImplementation((c: MockElement) => {
      childrenColl.push(c);
      c.parentNode = el;
      return c;
    }),

    removeChild: vi.fn().mockImplementation((c: MockElement) => {
      const idx = childrenColl.indexOf(c);
      if (idx > -1) childrenColl.splice(idx, 1);
      c.parentNode = null;
      return c;
    }),

    querySelector: vi
      .fn()
      .mockImplementation(
        (s: string) =>
          childrenColl.find(ch => ch.tagName?.toLowerCase() === s.toLowerCase()) ?? null
      ),
    querySelectorAll: vi
      .fn()
      .mockImplementation((s: string) =>
        childrenColl.filter(ch => ch.tagName?.toLowerCase() === s.toLowerCase())
      ),

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
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
        href: '',
        pathname: '/',
        search: '',
        hash: '',
        protocol: 'https:',
        port: '',
        host: 'x.com',
      },
      navigator: { language: 'en-US', userAgent: '', vendor: '', platform: '' },
      innerWidth: 1024,
      innerHeight: 768,
      devicePixelRatio: 1,
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
    },
    writable: true,
    configurable: true,
  });
}

function createMockDocument(): Document {
  const body = createMockElement({ tagName: 'body' });
  const head = createMockElement({ tagName: 'head' });
  const html = createMockElement({ tagName: 'html', children: [head, body] });
  const doc: Partial<Document> = {
    createElement: vi.fn().mockImplementation((tag: string) => createMockElement({ tagName: tag })),
    getElementById: vi
      .fn()
      .mockImplementation((id: string) => html.querySelector?.(`#${id}`) ?? null),
    querySelector: vi.fn().mockImplementation((s: string) => html.querySelector?.(s) ?? null),
    querySelectorAll: vi.fn().mockImplementation((s: string) => html.querySelectorAll?.(s) ?? []),
    body,
    head,
    documentElement: html,
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
