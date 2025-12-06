/**
 * @fileoverview Unified Event System
 * @description Central export point for event management utilities
 *
 * This module provides a unified interface for:
 * - DOM event listeners with automatic cleanup
 * - Type-safe application events
 * - AbortController-based subscription management
 * - Context-based batch operations
 *
 * @example
 * ```typescript
 * import { getEventBus, type AppEventMap } from '@shared/events';
 *
 * const bus = getEventBus();
 * const controller = new AbortController();
 *
 * // DOM events
 * bus.addDOMListener(element, 'click', handler, {
 *   signal: controller.signal,
 *   context: 'my-component'
 * });
 *
 * // App events
 * bus.on('navigation:change', ({ index }) => {
 *   console.log('Navigated to:', index);
 * }, { signal: controller.signal });
 *
 * bus.emit('navigation:change', { index: 5, total: 10 });
 *
 * // Cleanup
 * controller.abort();
 * ```
 */

export {
  type AppEventMap,
  type AppEventOptions,
  createTypedEventEmitter,
  type DOMListenerOptions,
  EventBus,
  getEventBus,
} from './event-bus';
