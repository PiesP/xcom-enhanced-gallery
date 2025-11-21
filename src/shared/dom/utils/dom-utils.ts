// Lightweight DOM helpers shared across features and tests.

function createEmptyNodeList<T extends Element>(): NodeListOf<T> {
  const fragment = document.createDocumentFragment();
  return fragment.querySelectorAll('*') as NodeListOf<T>;
}

export function querySelector<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): T | null {
  try {
    return container.querySelector<T>(selector);
  } catch {
    return null;
  }
}

export function querySelectorAll<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): NodeListOf<T> {
  try {
    return container.querySelectorAll<T>(selector);
  } catch {
    return createEmptyNodeList<T>();
  }
}

export function elementExists(selector: string, container: ParentNode = document): boolean {
  return querySelector(selector, container) !== null;
}

export interface DOMElementCreationOptions {
  attributes?: Record<string, string>;
  classes?: string[];
  textContent?: string;
  styles?: Record<string, string>;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: DOMElementCreationOptions = {}
): HTMLElementTagNameMap[K] | null {
  try {
    const element = document.createElement(tagName);

    if (options.attributes) {
      for (const [key, value] of Object.entries(options.attributes)) {
        element.setAttribute(key, value);
      }
    }

    if (options.classes) {
      element.classList.add(...options.classes.filter(Boolean));
    }

    if (options.textContent !== undefined) {
      element.textContent = options.textContent;
    }

    if (options.styles) {
      for (const [key, value] of Object.entries(options.styles)) {
        element.style.setProperty(key, value);
      }
    }

    return element;
  } catch {
    return null;
  }
}

export function removeElement(element: Element | null | undefined): boolean {
  if (!element?.parentNode) {
    return false;
  }
  element.parentNode.removeChild(element);
  return true;
}

export function isElement(value: unknown): value is Element {
  return value instanceof Element;
}

export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

function getComputedElementStyle(element: Element): CSSStyleDeclaration {
  return window.getComputedStyle(element);
}

export function isElementVisible(element: Element | null | undefined): boolean {
  if (!element || !isElement(element)) {
    return false;
  }

  const style = getComputedElementStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const width = Number.parseFloat(style.width ?? '');
  const height = Number.parseFloat(style.height ?? '');
  const hasExplicitSize =
    (Number.isFinite(width) && width > 0) || (Number.isFinite(height) && height > 0);
  const hasBox = rect.width > 0 || rect.height > 0 || hasExplicitSize;
  return hasBox;
}

export function isElementInViewport(element: Element | null | undefined): boolean {
  if (!element || !isElement(element)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth;
}

interface DebugViewportInfo {
  width: number;
  height: number;
}

interface DebugDocumentInfo {
  readyState: DocumentReadyState;
  URL: string;
}

interface DebugScrollInfo {
  x: number;
  y: number;
}

interface DebugInfo {
  viewport: DebugViewportInfo;
  document: DebugDocumentInfo;
  scroll: DebugScrollInfo;
}

export function getDebugInfo(): DebugInfo {
  return {
    viewport: {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight,
    },
    document: {
      readyState: document.readyState,
      URL: document.URL,
    },
    scroll: {
      x: window.scrollX || 0,
      y: window.scrollY || 0,
    },
  };
}
