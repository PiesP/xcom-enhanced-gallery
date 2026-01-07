/**
 * Style registration helpers.
 *
 * These helpers provide a safe wrapper around userscript style injection.
 */

import { getUserscript } from '@shared/external/userscript/adapter';

export interface RegisteredStyle {
  readonly id: string;
  readonly element: HTMLStyleElement;
  readonly replaced: boolean;
}

type StyleAttributes = Record<string, string | number | boolean | undefined>;

const styleMap = new Map<string, HTMLStyleElement>();

/**
 * Retrieves an HTMLStyleElement from the DOM by id.
 * @param id - The style element's id attribute
 * @returns The style element if found and valid, null otherwise
 */
function getStyleElementFromDom(id: string): HTMLStyleElement | null {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el instanceof HTMLStyleElement) return el;
  if (el instanceof HTMLElement && el.tagName === 'STYLE') return el as HTMLStyleElement;
  return null;
}

/**
 * Gets an existing style element from the map or DOM.
 * Cleans up stale references from the map if the element is not connected.
 * @param id - The style element's id
 * @returns The style element if found, null otherwise
 */
function getExistingStyleElement(id: string): HTMLStyleElement | null {
  const inMap = styleMap.get(id);
  if (inMap) {
    if (inMap.isConnected) return inMap;
    styleMap.delete(id);
  }

  return getStyleElementFromDom(id);
}

/**
 * Clears all registered styles from the map and DOM.
 */
export function clearStyleMap(): void {
  for (const id of Array.from(styleMap.keys())) {
    removeStyle(id);
  }
  styleMap.clear();
}

/**
 * Gets the number of currently registered styles.
 * @returns The count of styles in the map
 */
export function getRegisteredStyleCount(): number {
  return styleMap.size;
}

/**
 * Checks if a style with the given id is registered.
 * @param id - The style id
 * @returns True if the style exists, false otherwise
 */
export function hasStyle(id: string): boolean {
  return getExistingStyleElement(id) !== null;
}

/**
 * Retrieves a registered style element by id.
 * @param id - The style id
 * @returns The HTMLStyleElement if found, null otherwise
 */
export function getStyleElement(id: string): HTMLStyleElement | null {
  return getExistingStyleElement(id);
}

/**
 * Applies attributes to an element.
 * @param el - The element to modify
 * @param attributes - Key-value pairs to set as attributes
 */
function applyAttributes(el: HTMLElement, attributes: StyleAttributes | undefined): void {
  if (!attributes) return;

  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined) continue;
    el.setAttribute(name, String(value));
  }
}

/**
 * Creates a style element and injects it into the DOM.
 * @param cssText - The CSS content
 * @param id - The style element id
 * @param attributes - Optional attributes to set on the element
 * @returns The created HTMLStyleElement
 */
function createDomStyle(
  cssText: string,
  id: string,
  attributes: StyleAttributes | undefined
): HTMLStyleElement {
  const el = document.createElement('style');
  el.id = id;
  applyAttributes(el, attributes);
  el.textContent = cssText;
  document.head.appendChild(el);
  return el;
}

/**
 * Attempts to inject a style using the userscript's addStyle API.
 * Falls back to null if not available.
 * @param cssText - The CSS content
 * @returns The style element if successful, null otherwise
 */
function tryUserscriptAddStyle(cssText: string): HTMLStyleElement | null {
  try {
    interface UserscriptAddStyleCapability {
      addStyle: (cssText: string) => unknown;
    }

    const apiUnknown: unknown = getUserscript();
    const maybeAddStyle = (apiUnknown as { addStyle?: unknown }).addStyle;
    const hasAddStyle = typeof maybeAddStyle === 'function';
    if (!hasAddStyle) return null;

    const api = apiUnknown as UserscriptAddStyleCapability;
    const el = api.addStyle(cssText);

    if (el instanceof HTMLStyleElement) return el;
    if (el instanceof HTMLElement && el.tagName === 'STYLE') return el as HTMLStyleElement;

    return null;
  } catch {
    return null;
  }
}

/**
 * Registers a style with the given options.
 * Either creates a new style element or replaces an existing one.
 * @param options - Configuration for style registration
 * @returns Details about the registered style, or null if CSS is empty
 */
export function registerStyle(options: {
  readonly id: string;
  readonly cssText: string;
  readonly replaceExisting?: boolean;
  readonly attributes?: StyleAttributes;
}): RegisteredStyle | null {
  const { id, cssText, replaceExisting, attributes } = options;

  const normalizedCss = cssText.trim();
  if (!normalizedCss) {
    return null;
  }

  const shouldReplace = replaceExisting !== false;
  const existing = getExistingStyleElement(id);
  const hadExisting = existing !== null;

  if (existing && !shouldReplace) {
    return {
      id,
      element: existing,
      replaced: false,
    };
  }

  if (existing) {
    existing.remove();
    styleMap.delete(id);
  }

  const injected =
    tryUserscriptAddStyle(normalizedCss) ?? createDomStyle(normalizedCss, id, attributes);

  injected.id = id;
  applyAttributes(injected, attributes);
  if (!injected.isConnected) {
    document.head.appendChild(injected);
  }

  styleMap.set(id, injected);

  return {
    id,
    element: injected,
    replaced: hadExisting,
  };
}

/**
 * Removes a registered style by id.
 * Cleans up both the internal map and DOM references.
 * @param id - The id of the style to remove
 */
export function removeStyle(id: string): void {
  const existing = styleMap.get(id);
  if (existing) {
    existing.remove();
    styleMap.delete(id);
  }

  const inDom = getStyleElementFromDom(id);
  if (inDom) {
    inDom.remove();
  }
}
