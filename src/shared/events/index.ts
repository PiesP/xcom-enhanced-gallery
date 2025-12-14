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
 * **Usage Patterns**:
 *
 * 1. **Unified EventBus (backward compatibility)**:
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
 *
 * 2. **Direct module imports (recommended for new code)**:
 * ```typescript
 * import { DOMEventManager, type DOMListenerOptions } from '@shared/events/dom-events';
 * import { AppEventManager, type AppEventMap } from '@shared/events/app-events';
 * import { SubscriptionManager } from '@shared/events/event-context';
 *
 * const subscriptions = new SubscriptionManager();
 * const domEvents = new DOMEventManager(subscriptions);
 * const appEvents = new AppEventManager(subscriptions);
 *
 * // Better tree-shaking and explicit dependencies
 * ```
 */

// Specialized modules for direct imports (new code)
export { AppEventManager } from './app-events';
export { DOMEventManager } from './dom-events';
// Main EventBus facade (backward compatibility)
export {
  type AppEventMap,
  type AppEventOptions,
  type DOMListenerOptions,
  EventBus,
  getEventBus,
} from './event-bus';
export { type Subscription, SubscriptionManager, type SubscriptionStats } from './event-context';
