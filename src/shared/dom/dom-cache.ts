const EMPTY_LIST_SELECTOR = '*';

interface DOMCacheEntry {
  element: Element | null;
  timestamp: number;
  ttl: number;
}

export class DOMCache {
  private readonly cache = new Map<string, DOMCacheEntry>();
  private readonly defaultTTL: number;
  private readonly maxCacheSize: number;

  constructor(options: { defaultTTL?: number; maxCacheSize?: number } = {}) {
    this.defaultTTL = options.defaultTTL ?? 20000;
    this.maxCacheSize = options.maxCacheSize ?? 150;
  }

  querySelector(
    selector: string,
    container: Document | Element = document,
    ttl?: number
  ): Element | null {
    const cacheKey = this.getCacheKey(selector, container);
    const now = Date.now();

    const cached = this.cache.get(cacheKey);
    if (cached && this.isValid(cached, now)) {
      return cached.element;
    }

    const element = container.querySelector(selector);

    this.cache.set(cacheKey, {
      element,
      timestamp: now,
      ttl: ttl ?? this.defaultTTL,
    });

    this.enforceMaxSize();
    return element;
  }

  querySelectorAll(
    selector: string,
    container: Document | Element = document,
    ttl?: number
  ): NodeListOf<Element> {
    if (!container || typeof (container as ParentNode).querySelectorAll !== 'function') {
      return this.createEmptyNodeList();
    }

    const cacheKey = this.getCacheKey(`${selector}:all`, container);
    const now = Date.now();

    const cached = this.cache.get(cacheKey);
    if (cached && this.isValid(cached, now)) {
      return cached.element as unknown as NodeListOf<Element>;
    }

    let elements: NodeListOf<Element>;
    try {
      elements = (container as ParentNode).querySelectorAll(selector);
    } catch {
      return this.createEmptyNodeList();
    }

    this.cache.set(cacheKey, {
      element: elements as unknown as Element,
      timestamp: now,
      ttl: ttl ?? this.defaultTTL,
    });

    this.enforceMaxSize();
    return elements;
  }

  clear(): void {
    this.cache.clear();
  }

  dispose(): void {
    this.clear();
  }

  private createEmptyNodeList(): NodeListOf<Element> {
    return document.createDocumentFragment().querySelectorAll(EMPTY_LIST_SELECTOR);
  }

  private getCacheKey(selector: string, container: Document | Element): string {
    if (container === document) {
      return `document::${selector}`;
    }

    const element = container as Element;
    const identifier = element.id || element.className || element.tagName || 'anonymous';
    return `${identifier}::${selector}`;
  }

  private isValid(entry: DOMCacheEntry, now: number): boolean {
    return now - entry.timestamp < entry.ttl;
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    const excess = this.cache.size - this.maxCacheSize;
    for (let i = 0; i < excess; i++) {
      const entry = entries[i];
      if (!entry) {
        break;
      }

      const [key] = entry;
      this.cache.delete(key);
    }
  }
}

export const globalDOMCache = new DOMCache();

export function cachedQuerySelector(
  selector: string,
  container?: Document | Element,
  ttl?: number
): Element | null {
  return globalDOMCache.querySelector(selector, container, ttl);
}

export function cachedQuerySelectorAll(
  selector: string,
  container?: Document | Element,
  ttl?: number
): NodeListOf<Element> {
  return globalDOMCache.querySelectorAll(selector, container, ttl);
}

export function cachedStableQuery(
  selectors: readonly string[],
  container?: Document | Element,
  ttl?: number
): Element | null {
  for (const selector of selectors) {
    const element = cachedQuerySelector(selector, container, ttl);
    if (element) {
      return element;
    }
  }

  return null;
}
