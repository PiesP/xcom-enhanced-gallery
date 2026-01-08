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
const getStyleElementFromDom = (id: string): HTMLStyleElement | null => {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el instanceof HTMLStyleElement) return el;
  return el instanceof HTMLElement && el.tagName === 'STYLE' ? (el as HTMLStyleElement) : null;
};

/**
 * Gets an existing style element from the map or DOM.
 * Cleans up stale references from the map if the element is not connected.
 * @param id - The style element's id
 * @returns The style element if found, null otherwise
 */
const getExistingStyleElement = (id: string): HTMLStyleElement | null => {
  const inMap = styleMap.get(id);
  if (inMap?.isConnected) return inMap;
  if (inMap) styleMap.delete(id);
  return getStyleElementFromDom(id);
};

/**
 * Clears all registered styles from the map and DOM.
 */
export const clearStyleMap = (): void => {
  for (const id of Array.from(styleMap.keys())) {
    removeStyle(id);
  }
  styleMap.clear();
};

/**
 * Gets the number of currently registered styles.
 * @returns The count of styles in the map
 */
export const getRegisteredStyleCount = (): number => styleMap.size;

/**
 * Checks if a style with the given id is registered.
 * @param id - The style id
 * @returns True if the style exists, false otherwise
 */
export const hasStyle = (id: string): boolean => getExistingStyleElement(id) !== null;

/**
 * Retrieves a registered style element by id.
 * @param id - The style id
 * @returns The HTMLStyleElement if found, null otherwise
 */
export const getStyleElement = (id: string): HTMLStyleElement | null => getExistingStyleElement(id);

/**
 * Applies attributes to an element.
 * @param el - The element to modify
 * @param attributes - Key-value pairs to set as attributes
 */
const applyAttributes = (el: HTMLElement, attributes: StyleAttributes | undefined): void => {
  if (!attributes) return;
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== undefined) el.setAttribute(name, String(value));
  }
};

/**
 * Creates a style element and injects it into the DOM.
 * @param cssText - The CSS content
 * @param id - The style element id
 * @param attributes - Optional attributes to set on the element
 * @returns The created HTMLStyleElement
 */
const createDomStyle = (
  cssText: string,
  id: string,
  attributes: StyleAttributes | undefined
): HTMLStyleElement => {
  const el = document.createElement('style');
  el.id = id;
  el.textContent = cssText;
  applyAttributes(el, attributes);
  document.head.appendChild(el);
  return el;
};

/**
 * Attempts to inject a style using the userscript's addStyle API.
 * Falls back to null if not available.
 * @param cssText - The CSS content
 * @returns The style element if successful, null otherwise
 */
const tryUserscriptAddStyle = (cssText: string): HTMLStyleElement | null => {
  try {
    const api = getUserscript() as { addStyle?: (cssText: string) => unknown };
    if (typeof api.addStyle !== 'function') return null;

    const el = api.addStyle(cssText);
    if (el instanceof HTMLStyleElement) return el;
    return el instanceof HTMLElement && el.tagName === 'STYLE' ? (el as HTMLStyleElement) : null;
  } catch {
    return null;
  }
};

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
  const { id, cssText, replaceExisting = true, attributes } = options;

  const normalizedCss = cssText.trim();
  if (!normalizedCss) return null;

  const existing = getExistingStyleElement(id);
  const hadExisting = existing !== null;

  if (existing && !replaceExisting) {
    return { id, element: existing, replaced: false };
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
export const removeStyle = (id: string): void => {
  const existing = styleMap.get(id);
  if (existing) {
    existing.remove();
    styleMap.delete(id);
  }

  const inDom = getStyleElementFromDom(id);
  if (inDom) {
    inDom.remove();
  }
};
