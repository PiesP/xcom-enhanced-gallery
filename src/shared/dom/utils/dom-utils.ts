/**
 * @fileoverview DOM Utilities - Tree-Shaking Friendly Pure Functions
 * @version 2.2.0 - Phase 195: Event management separation, Phase 403: Enhanced docs
 *
 * Provides safe, null-tolerant DOM query and manipulation utilities.
 * All functions gracefully handle errors (logging + null returns).
 *
 * **Design Pattern**: Pure functions with error handling
 * **Performance**: Tree-shaking friendly, no side effects, minimal logging overhead
 * **Error Handling**: Try-catch wrapping with logger warnings/errors
 * **Type Safety**: Generic type parameters for compile-time safety
 *
 * **Key Characteristics**:
 * - ✅ Safe null handling: All functions tolerate null inputs
 * - ✅ Tree-shakeable: Each function independent, unused ones removed
 * - ✅ Logged errors: Failures logged via @shared/logging
 * - ✅ Typed returns: Generic types for <HTMLElement>, <HTMLButtonElement>, etc.
 * - ✅ PC-only: No touch/pointer events (see DomEventManager for events)
 *
 * **Design Philosophy**:
 * ```
 * Failed queries/creation → return null (never throw)
 * Invalid selectors → logged + null
 * Type guards → enables conditional DOM operations
 * Visibility checks → useful for scroll optimization
 * ```
 *
 * **Architectural Role**:
 * - Layer: Shared/Utilities (no domain knowledge)
 * - Consumers: Features, UI components, services
 * - Siblings: DomEventManager (events), DomCache (caching)
 * - Not used for: Event binding (use DomEventManager), element caching (use DomCache)
 *
 * **Event Management Separation** (Phase 195):
 * ❌ Removed: addEventListener, removeEventListener (use DomEventManager)
 * ✅ Available: Safe querySelector, safe createElement, element creation helpers
 * 📍 Reference: [DomEventManager](../dom-event-manager.ts), [DomCache](../dom-cache.ts)
 *
 * @related [DomEventManager](../dom-event-manager.ts), [DomCache](../dom-cache.ts), [Logging](@shared/logging)
 */

import { logger } from '@shared/logging';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Options for createElement() function.
 *
 * **Supports**:
 * - attributes: Any HTML attribute (aria-*, data-*, etc.)
 * - textContent: Plain text only (no HTML markup)
 * - classes: CSS class names (added via classList.add)
 * - styles: Inline CSS properties (applied via style.setProperty)
 *
 * @example
 * // Create button with multiple options
 * const options: DOMElementCreationOptions = {
 *   attributes: { type: 'button', 'aria-label': 'Close' },
 *   classes: ['btn', 'btn-primary'],
 *   textContent: 'Click me',
 *   styles: { padding: '8px 16px', borderRadius: '4px' }
 * };
 */
export interface DOMElementCreationOptions {
  /** HTML attributes (data-*, aria-*, etc.) */
  attributes?: Record<string, string>;
  /** Text content (plain text, no HTML) */
  textContent?: string;
  /** CSS class names (added via classList.add) */
  classes?: string[];
  /** Inline styles (CSS properties) */
  styles?: Record<string, string>;
}

// ============================================================================
// Element Selection (Safe, Error-Tolerant Queries)
// ============================================================================

/**
 * Safe querySelector with error handling.
 *
 * **Guarantees**:
 * - Returns null for missing elements (never throws)
 * - Returns null for invalid selectors (never throws, logs warning)
 * - Type-safe generic return (e.g., HTMLButtonElement)
 * - Container scoping supported (defaults to document)
 *
 * **Performance**: O(n) where n = descendant count
 *
 * @template T - Element type for compile-time safety (defaults to Element)
 * @param selector - CSS selector string (will be validated)
 * @param container - Search scope (defaults to document)
 * @returns First matching element typed as T, or null if not found/invalid selector
 *
 * @example
 * const button = querySelector<HTMLButtonElement>('button.primary');
 * if (button) { button.click(); }
 *
 * // Scoped search
 * const nested = querySelector('span', element);
 */
export function querySelector<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): T | null {
  try {
    return container.querySelector<T>(selector);
  } catch (error) {
    logger.warn(`[DOM] Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * Safe querySelectorAll with error handling.
 *
 * **Guarantees**:
 * - Returns empty NodeList for missing elements (never throws)
 * - Returns empty NodeList for invalid selectors (never throws, logs warning)
 * - Type-safe generic return (e.g., HTMLButtonElement[])
 * - Container scoping supported (defaults to document)
 *
 * **Performance**: O(n) where n = descendant count
 *
 * @template T - Element type for compile-time safety (defaults to Element)
 * @param selector - CSS selector string (will be validated)
 * @param container - Search scope (defaults to document)
 * @returns NodeList of matching elements (empty if not found or invalid selector)
 *
 * @example
 * const buttons = querySelectorAll<HTMLButtonElement>('.btn');
 * buttons.forEach(btn => btn.disabled = true);
 *
 * // Conditional processing
 * if (buttons.length > 0) {
 *   console.log(`Found ${buttons.length} buttons`);
 * }
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): NodeListOf<T> {
  try {
    return container.querySelectorAll<T>(selector);
  } catch (error) {
    logger.warn(`[DOM] Invalid selector: ${selector}`, error);
    return document.createElement('div').querySelectorAll<T>('');
  }
}

/**
 * Check if element matching selector exists.
 *
 * **Convenience wrapper** around querySelector for boolean checks.
 * Safe: Never throws, always returns boolean.
 *
 * @param selector - CSS selector string
 * @param container - Search scope (defaults to document)
 * @returns true if element found and selector valid, false otherwise
 *
 * @example
 * if (elementExists('.modal.open')) {
 *   closeModal();
 * }
 */
export function elementExists(selector: string, container: ParentNode = document): boolean {
  return querySelector(selector, container) !== null;
}

// ============================================================================
// Element Creation & Manipulation
// ============================================================================

/**
 * Safe element creation with configuration.
 *
 * **Guarantees**:
 * - Returns null on failure (never throws)
 * - Applies attributes, classes, styles, text atomically
 * - Type-safe generic return (HTMLButtonElement, etc.)
 * - All options optional (create bare element with just tagName)
 *
 * **Applied in Order**:
 * 1. attributes (via setAttribute)
 * 2. textContent (via textContent property)
 * 3. classes (via classList.add)
 * 4. styles (via style.setProperty)
 *
 * @template K - HTML tag name for compile-time safety
 * @param tagName - HTML tag name (e.g., 'div', 'button', 'span')
 * @param options - Creation options (attributes, text, classes, styles)
 * @returns New element or null if creation failed
 *
 * @example
 * const btn = createElement('button', {
 *   classes: ['btn', 'btn-primary'],
 *   attributes: { type: 'button', 'aria-label': 'Close' },
 *   textContent: 'Click me',
 *   styles: { padding: '8px', borderRadius: '4px' }
 * });
 *
 * // Bare element
 * const div = createElement('div');
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: DOMElementCreationOptions = {}
): HTMLElementTagNameMap[K] | null {
  try {
    const element = document.createElement(tagName);

    // 속성 설정
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    // 텍스트 콘텐츠 설정
    if (options.textContent) {
      element.textContent = options.textContent;
    }

    // CSS 클래스 추가
    if (options.classes) {
      element.classList.add(...options.classes);
    }

    // 스타일 설정
    if (options.styles) {
      Object.entries(options.styles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
      });
    }

    return element;
  } catch (error) {
    logger.error(`[DOM] Failed to create element: ${tagName}`, error);
    return null;
  }
}

/**
 * Safe element removal from DOM.
 *
 * **Guarantees**:
 * - Returns false if element null or already removed
 * - Never throws (all errors caught and logged)
 * - Cleans up element reference (removes from DOM)
 *
 * @param element - Element to remove (null tolerance)
 * @returns true if removed, false if failed/not found
 *
 * @example
 * const removed = removeElement(element);
 * if (removed) {
 *   console.log('Element removed');
 * }
 *
 * // Safe with null
 * removeElement(null); // Returns false, no error
 */
export function removeElement(element: Element | null): boolean {
  try {
    if (element?.parentNode) {
      element.parentNode.removeChild(element);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[DOM] Failed to remove element:', error);
    return false;
  }
}

// ============================================================================
// Element Validation & Type Guards
// ============================================================================

/**
 * Type guard: Is object an Element?
 *
 * **Use Case**: Narrowing types from unknown/EventTarget/object
 * **Safety**: Checks instanceof Element (browser API)
 *
 * @param obj - Value to check
 * @returns true if obj is Element (TypeScript narrows to Element)
 *
 * @example
 * const maybe: unknown = something;
 * if (isElement(maybe)) {
 *   // TypeScript now knows maybe is Element
 *   maybe.getAttribute('data-id');
 * }
 */
export function isElement(obj: unknown): obj is Element {
  return obj instanceof Element;
}

/**
 * Type guard: Is object an HTMLElement?
 *
 * **Use Case**: Narrowing types when you need HTML-specific features
 * **More Specific**: HTMLElement extends Element (stricter check)
 *
 * @param obj - Value to check
 * @returns true if obj is HTMLElement (TypeScript narrows to HTMLElement)
 *
 * @example
 * if (isHTMLElement(target)) {
 *   target.style.display = 'none'; // HTMLElement has style
 * }
 */
export function isHTMLElement(obj: unknown): obj is HTMLElement {
  return obj instanceof HTMLElement;
}

/**
 * Check if element is visible (has rendered dimensions).
 *
 * **Visibility Checks**:
 * - getBoundingClientRect() called (dimensions computed)
 * - width > 0 AND height > 0 (element occupies space)
 * - ✅ Catches: hidden elements, display:none, zero-size
 * - ❌ Does NOT catch: opacity:0, visibility:hidden, overflow:hidden
 *
 * **Use Case**: Early exit optimization (skip invisible elements)
 * **Performance**: O(1) per call (reads computed style once)
 *
 * @param element - Element to check (null tolerance)
 * @returns true if element has rendered dimensions, false otherwise
 *
 * @example
 * if (isElementVisible(element)) {
 *   // Element is rendered and has size
 *   intersectionObserver.observe(element);
 * }
 */
export function isElementVisible(element: Element | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Check if element is fully within viewport.
 *
 * **Viewport Checks** (using getBoundingClientRect):
 * - top >= 0 (not above viewport)
 * - left >= 0 (not left of viewport)
 * - bottom <= window.innerHeight (not below viewport)
 * - right <= window.innerWidth (not right of viewport)
 *
 * **Definition**: "Fully within viewport" = entire element visible
 * ✅ Catches: Partially visible, off-screen elements
 * **Use Case**: Lazy loading trigger, animation trigger
 * **Performance**: O(1) per call (reads computed style once)
 *
 * @param element - Element to check (null tolerance)
 * @returns true if entire element in viewport, false if partially/fully off-screen
 *
 * @example
 * if (isElementInViewport(element)) {
 *   // Element fully visible
 *   startAnimation();
 * }
 */
export function isElementInViewport(element: Element | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ============================================================================
// Debugging & Diagnostics
// ============================================================================

/**
 * Get DOM debugging information.
 *
 * **Returns**:
 * - Viewport dimensions (window.innerWidth, window.innerHeight)
 * - Document state (readyState, URL)
 * - Scroll position (scrollX, scrollY)
 *
 * **Use Case**: Debugging layout issues, screenshot/replay systems
 * **Performance**: O(1) - just reads global properties
 *
 * @returns Object with viewport, document, and scroll diagnostics
 *
 * @example
 * const debug = getDebugInfo();
 * console.log('Viewport:', debug.viewport);
 * console.log('Document ready:', debug.document.readyState);
 * console.log('Scroll:', debug.scroll);
 */
export function getDebugInfo(): Record<string, unknown> {
  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    document: {
      readyState: document.readyState,
      URL: document.URL,
    },
    scroll: {
      x: window.scrollX,
      y: window.scrollY,
    },
  };
}
