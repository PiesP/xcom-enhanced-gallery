/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Style Registry - Functional API
 * @description Runtime style management for dynamically injected stylesheets
 * @version 4.0.0 - Functional refactor from StyleRegistry class
 */

// ============================================================================
// Types
// ============================================================================

export interface StyleRegistrationOptions {
  readonly id: string;
  readonly cssText: string;
  readonly attributes?: Record<string, string | number | boolean | undefined>;
  readonly replaceExisting?: boolean;
}

export interface RegistrationResult {
  readonly id: string;
  readonly element: HTMLStyleElement;
  readonly replaced: boolean;
}

// ============================================================================
// Module State
// ============================================================================

const styleMap = new Map<string, HTMLStyleElement>();

// ============================================================================
// Internal Utilities
// ============================================================================

function isBrowserEnvironment(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

function getExistingElement(id: string): HTMLStyleElement | null {
  const entry = styleMap.get(id);
  if (entry) {
    return entry;
  }

  if (!isBrowserEnvironment()) {
    return null;
  }

  const domEntry = document.getElementById(id);
  if (domEntry instanceof HTMLStyleElement) {
    styleMap.set(id, domEntry);
    return domEntry;
  }

  return null;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Register a style with the given options.
 * Injects a <style> element into the document.
 */
export function registerStyle(options: StyleRegistrationOptions): RegistrationResult | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const trimmedCss = options.cssText.trim();
  if (!trimmedCss) {
    return null;
  }

  const existing = getExistingElement(options.id);
  if (existing && options.replaceExisting !== false) {
    existing.textContent = trimmedCss;
    return { id: options.id, element: existing, replaced: true };
  }

  if (existing) {
    return { id: options.id, element: existing, replaced: false };
  }

  const styleElement = document.createElement('style');
  styleElement.textContent = trimmedCss;
  (document.head || document.documentElement).appendChild(styleElement);

  styleElement.id = options.id;

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      if (value === undefined) return;
      styleElement.setAttribute(key, String(value));
    });
  }

  styleMap.set(options.id, styleElement);

  return { id: options.id, element: styleElement, replaced: false };
}

/**
 * Remove a registered style by ID.
 */
export function removeStyle(id: string): void {
  const element = getExistingElement(id);
  if (!element) {
    return;
  }

  element.remove();
  styleMap.delete(id);
}

/**
 * Check if a style with the given ID exists.
 */
export function hasStyle(id: string): boolean {
  return styleMap.has(id) || Boolean(getExistingElement(id));
}

/**
 * Get the style element by ID.
 */
export function getStyleElement(id: string): HTMLStyleElement | null {
  return getExistingElement(id);
}

/**
 * Clear all registered styles from the internal map.
 * Note: This does not remove the style elements from the DOM.
 * @internal For testing purposes only.
 */
export function clearStyleMap(): void {
  styleMap.clear();
}

/**
 * Get the number of registered styles.
 * @internal For testing and debugging purposes.
 */
export function getRegisteredStyleCount(): number {
  return styleMap.size;
}
