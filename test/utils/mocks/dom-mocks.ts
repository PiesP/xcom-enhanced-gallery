// Minimal DOM mocks for tests. Written in TypeScript and exported as a single
// module so test transformers (Vite/Babel) don't encounter nested exports.

type Attrs = Record<string, string>;

let __createdWindow = false;

export function createMockStyle(): Record<string, any> {
  return {};
}

export function createMockElement(options?: { tagName?: string; attributes?: Attrs }) {
  options = options || {};
  const tagName = (options.tagName || 'div').toUpperCase();

  // Prefer real DOM elements when running under jsdom so native APIs work.
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const el = document.createElement(options.tagName || 'div');
    if (options.attributes) {
      Object.keys(options.attributes).forEach(k => {
        try {
          el.setAttribute(k, options!.attributes![k]);
        } catch (_) {
          // ignore
        }
      });
      if ((options.attributes as any).class)
        el.className = (options.attributes as any).class as string;
    }
    return el as any;
  }

  // Lightweight fallback element-like object for non-jsdom environments.
  const attrs: Attrs = Object.assign({}, options.attributes || {});
  let className = (attrs.class as string) || (attrs as any).className || '';

  const el: any = {
    tagName,
    className,
    _attributes: attrs,
    getAttribute(name: string) {
      if (name === 'class') return this.className || null;
      return typeof this._attributes[name] !== 'undefined' ? this._attributes[name] : null;
    },
    setAttribute(name: string, value: string) {
      if (name === 'class') {
        className = String(value);
        this.className = className;
      }
      this._attributes[name] = String(value);
    },
    removeAttribute(name: string) {
      if (name === 'class') {
        className = '';
        this.className = '';
      }
      delete this._attributes[name];
    },
    matches(selector?: string) {
      try {
        if (!selector) return false;
        if (selector[0] === '.') {
          const cls = selector.slice(1);
          return (this.className || '').split(/\s+/).filter(Boolean).includes(cls);
        }
        return selector.toUpperCase() === this.tagName;
      } catch (_) {
        return false;
      }
    },
    appendChild() {
      return null;
    },
    style: {},
    classList: {
      add: (c: string) => {
        const parts = (className || '').split(/\s+/).filter(Boolean);
        if (!parts.includes(c)) parts.push(c);
        className = parts.join(' ');
        el.className = className;
      },
      remove: (c: string) => {
        const parts = (className || '')
          .split(/\s+/)
          .filter(Boolean)
          .filter((x: string) => x !== c);
        className = parts.join(' ');
        el.className = className;
      },
      contains: (c: string) => {
        return (className || '').split(/\s+/).filter(Boolean).includes(c);
      },
    },
  };

  return el;
}

export function createMockHTMLElement(options?: { tagName?: string; attributes?: Attrs }) {
  return createMockElement(options);
}

export function createMockImageElement(src?: string) {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const img = document.createElement('img');
    if (src) (img as any).src = src;
    return img as any;
  }
  const el: any = createMockElement({ tagName: 'img' });
  if (src) el._attributes.src = src;
  return el;
}

export function createMockVideoElement(src?: string) {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const v = document.createElement('video');
    if (src) (v as any).src = src;
    return v as any;
  }
  const el: any = createMockElement({ tagName: 'video' });
  if (src) el._attributes.src = src;
  return el;
}

/**
 * Create or augment a minimal window/document environment for tests. If a real
 * jsdom window exists this augments it; otherwise it creates a small one and
 * marks it for cleanup.
 */
export function setupDOMEnvironment() {
  try {
    if (typeof (globalThis as any).window === 'undefined' || (globalThis as any).window === null) {
      const win: any = {};
      win.document = {
        createElement: (tag: string) => ({
          tagName: tag.toUpperCase(),
          style: {},
          classList: { add() {}, remove() {} },
          getAttribute: () => null,
          setAttribute() {},
          removeAttribute() {},
        }),
      };

      win.location = {
        href: 'https://x.com/user/status/123456789?lang=en',
        pathname: '/user/status/123456789',
        hostname: 'x.com',
        search: '?lang=en',
      };

      win.navigator = {};
      win.innerWidth = 1024;
      win.innerHeight = 768;
      win.devicePixelRatio = 1;

      win.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        addListener() {},
        removeListener() {},
      });

      win.scrollTo = () => {};
      win.setTimeout = () => 123 as any;
      win.clearTimeout = () => {};

      (globalThis as any).window = win as any;
      (globalThis as any).document = win.document;
      __createdWindow = true;
    } else {
      const w: any = (globalThis as any).window;
      w.location = {
        href: 'https://x.com/user/status/123456789?lang=en',
        pathname: '/user/status/123456789',
        hostname: 'x.com',
        search: '?lang=en',
      };
      if (!w.navigator) w.navigator = {};
      if (!w.matchMedia)
        w.matchMedia = (q: string) => ({
          matches: false,
          media: q,
          addListener() {},
          removeListener() {},
        });
      if (!w.setTimeout) w.setTimeout = () => 123 as any;
      if (!w.clearTimeout) w.clearTimeout = () => {};
      if (!w.scrollTo) w.scrollTo = () => {};
      if (
        typeof (globalThis as any).document === 'undefined' ||
        (globalThis as any).document === null
      ) {
        (globalThis as any).document = (w.document = {
          createElement: (tag: string) => ({
            tagName: tag.toUpperCase(),
            style: {},
            classList: { add() {} },
          }),
        }) as any;
      }
    }
  } catch (_) {
    // swallowing errors in test helper setup is intentional
  }
}

export function setupTwitterDOMStructure() {
  const el: any = createMockHTMLElement();
  try {
    if (el && el.classList && typeof el.classList.add === 'function') {
      el.classList.add('tweet');
    }
  } catch (_) {}
  return el;
}

/** Remove any mock window/document created by setupDOMEnvironment. */
export function cleanupDOMEnvironment() {
  try {
    if (__createdWindow) {
      try {
        delete (globalThis as any).window;
      } catch {}
      try {
        delete (globalThis as any).document;
      } catch {}
      __createdWindow = false;
      return;
    }

    try {
      (globalThis as any).window = undefined;
    } catch (_) {}
    try {
      (globalThis as any).document = undefined;
    } catch (_) {}
  } catch (_) {}
}
