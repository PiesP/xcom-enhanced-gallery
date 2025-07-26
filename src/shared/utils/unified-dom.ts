/**
 * @fileoverview DOM + CSS 선택자 유틸리티 통합
 * @description dom-utils.ts와 selector-utils.ts를 통합한 단일 모듈
 * @version 1.0.0 - Phase 1 Consolidation
 */

import { logger } from '@shared/logging/logger';

// ================================
// 갤러리 요소 감지 (dom-utils)
// ================================

const GALLERY_SELECTORS = [
  '.xeg-gallery-container',
  '[data-gallery-element]',
  '#xeg-gallery-root',
  '.vertical-gallery-view',
  '[data-xeg-gallery-container]',
  '[data-xeg-gallery]',
  '.xeg-vertical-gallery',
  '.xeg-gallery',
  '.gallery-container',
  '[data-gallery]',
  '.xeg-toolbar',
  '.xeg-button',
  '.gallery-controls',
  '.gallery-toolbar',
  '.gallery-header',
  '.gallery-footer',
  '.gallery-content',
  '.gallery-item',
  '.media-viewer',
  '.xeg-toast-container',
  '.xeg-toast',
  '.toast-container',
  '.notification',
] as const;

export function isInsideGallery(element: HTMLElement | null): boolean {
  if (!element) return false;
  return GALLERY_SELECTORS.some(sel => element.closest(sel));
}

export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;
  return GALLERY_SELECTORS.some(sel => element.matches(sel));
}

export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target as HTMLElement;
  return isInsideGallery(target);
}

export function shouldBlockGalleryEvent(event: Event): boolean {
  return isGalleryInternalEvent(event);
}

// ================================
// 안전한 DOM 접근/조작 (dom-utils)
// ================================

export function safeQuerySelector<T extends Element = Element>(
  root: ParentNode,
  selector: string
): T | null {
  try {
    return root.querySelector(selector) as T | null;
  } catch {
    return null;
  }
}

export function safeQuerySelectorAll<T extends Element = Element>(
  root: ParentNode,
  selector: string
): T[] {
  try {
    return Array.from(root.querySelectorAll(selector)) as T[];
  } catch {
    return [];
  }
}

export function safeGetAttribute(el: Element | null, attr: string): string | null {
  try {
    return el?.getAttribute(attr) ?? null;
  } catch {
    return null;
  }
}

export function safeSetAttribute(el: Element | null, attr: string, value: string): void {
  try {
    el?.setAttribute(attr, value);
  } catch {}
}

export function safeAddClass(el: Element | null, className: string): void {
  try {
    el?.classList.add(className);
  } catch {}
}

export function safeRemoveClass(el: Element | null, className: string): void {
  try {
    el?.classList.remove(className);
  } catch {}
}

export function safeSetStyle(el: HTMLElement | null, style: Partial<CSSStyleDeclaration>): void {
  if (!el) return;
  try {
    Object.assign(el.style, style);
  } catch {}
}

export function safeRemoveElement(el: Element | null): void {
  try {
    el?.parentElement?.removeChild(el);
  } catch {}
}

export function safeAddEventListener(
  el: EventTarget | null,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void {
  try {
    el?.addEventListener(type, listener, options);
  } catch {}
}

export function safeRemoveEventListener(
  el: EventTarget | null,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): void {
  try {
    el?.removeEventListener(type, listener, options);
  } catch {}
}

export function isElementConnected(el: Element | null): boolean {
  try {
    return !!el && (el.isConnected ?? document.body.contains(el));
  } catch {
    return false;
  }
}

export function safeGetBoundingClientRect(el: Element | null): DOMRect | null {
  try {
    return el?.getBoundingClientRect() ?? null;
  } catch {
    return null;
  }
}

// ================================
// CSS 선택자 유틸리티 (selector-utils)
// ================================

export function isValidCSSSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') return false;
  try {
    const testElement = document.createElement('div');
    testElement.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

export function parseAttributeSelector(selector: string): {
  attribute: string;
  operator: string;
  value: string;
} | null {
  const attributePattern = /\[([^=~|^$*]+)([*^$~|]?=)"?([^"]+)"?\]/;
  const match = selector.match(attributePattern);
  if (!match?.[1] || !match?.[3]) return null;
  return {
    attribute: match[1].trim(),
    operator: match[2] || '=',
    value: match[3].trim(),
  };
}

// ... selector-utils의 나머지 함수들도 동일하게 추가 ...
