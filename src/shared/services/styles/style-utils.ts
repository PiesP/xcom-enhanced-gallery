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

function getStyleElementFromDom(id: string): HTMLStyleElement | null {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el instanceof HTMLStyleElement) return el;
  if (el instanceof HTMLElement && el.tagName === 'STYLE') return el as HTMLStyleElement;
  return null;
}

function getExistingStyleElement(id: string): HTMLStyleElement | null {
  const inMap = styleMap.get(id);
  if (inMap) {
    if (inMap.isConnected) return inMap;
    styleMap.delete(id);
  }

  return getStyleElementFromDom(id);
}

export function clearStyleMap(): void {
  for (const id of Array.from(styleMap.keys())) {
    removeStyle(id);
  }
  styleMap.clear();
}

export function getRegisteredStyleCount(): number {
  return styleMap.size;
}

export function hasStyle(id: string): boolean {
  return getExistingStyleElement(id) !== null;
}

export function getStyleElement(id: string): HTMLStyleElement | null {
  return getExistingStyleElement(id);
}

function applyAttributes(el: HTMLElement, attributes: StyleAttributes | undefined): void {
  if (!attributes) return;

  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined) continue;
    el.setAttribute(name, String(value));
  }
}

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
