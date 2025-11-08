/**
 * @fileoverview Simple DOM Batch Update Utility
 * @description Simple DOM batch processing suitable for userscripts
 * @version 1.0.0 - Phase C2: Simplified
 */

import { logger } from '@shared/logging';

/**
 * DOM update task definition
 */
export interface DOMUpdate {
  element: HTMLElement;
  styles?: Partial<CSSStyleDeclaration>;
  classes?: { add?: string[]; remove?: string[] };
  attributes?: Record<string, string>;
  textContent?: string;
}

/**
 * Simple DOM batch update manager
 */
export class DOMBatcher {
  private readonly updates: DOMUpdate[] = [];
  private rafId: number | null = null;

  /**
   * Add a single DOM update
   */
  add(update: DOMUpdate): void {
    this.updates.push(update);
    this.scheduleFlush();
  }

  /**
   * Add multiple DOM updates
   */
  addMany(updates: DOMUpdate[]): void {
    this.updates.push(...updates);
    this.scheduleFlush();
  }

  /**
   * Apply all pending updates immediately
   */
  flush(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const updates = this.updates.splice(0);
    if (updates.length === 0) return;

    try {
      updates.forEach(update => this.applyUpdate(update));
      logger.debug(`DOMBatcher: Applied ${updates.length} updates`);
    } catch (error) {
      logger.error('DOMBatcher: Update failed', error);
    }
  }

  /**
   * Cancel all pending updates
   */
  clear(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates.length = 0;
  }

  private scheduleFlush(): void {
    if (this.rafId) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.flush();
    });
  }

  private applyUpdate(update: DOMUpdate): void {
    const { element, styles, classes, attributes, textContent } = update;

    if (styles) {
      Object.assign(element.style, styles);
    }

    if (classes) {
      if (classes.add) {
        element.classList.add(...classes.add);
      }
      if (classes.remove) {
        element.classList.remove(...classes.remove);
      }
    }

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (textContent !== undefined) {
      element.textContent = textContent;
    }
  }
}

/**
 * Global DOMBatcher instance
 */
export const globalDOMBatcher = new DOMBatcher();

/**
 * Convenience function: Batch update styles for multiple elements
 */
export function updateElementsInBatch(updates: DOMUpdate[]): void {
  globalDOMBatcher.addMany(updates);
}

/**
 * Convenience function: Update a single element
 */
export function updateElement(element: HTMLElement, update: Omit<DOMUpdate, 'element'>): void {
  globalDOMBatcher.add({ element, ...update });
}

// Backward compatibility aliases
export { DOMBatcher as BatchDOMUpdateManager };
export { globalDOMBatcher as batchDOMUpdateManager };
