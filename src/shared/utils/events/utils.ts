/**
 * @fileoverview Event Utilities
 * @description Safe event handling utilities for consistent event management
 * @version 1.0.0 - Phase 326
 */

/**
 * Safely prevent default and stop propagation on an event
 *
 * @description
 * Unified event handling pattern for consistent behavior across components.
 * Handles optional events gracefully (useful for handlers that can be called
 * programmatically or from DOM events).
 *
 * @param event - Optional Event object
 *
 * @example
 * ```typescript
 * const handleClick = (event?: Event) => {
 *   safeEventPrevent(event);
 *   // ... your logic
 * };
 * ```
 */
export function safeEventPrevent(event?: Event): void {
  if (!event) return;
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Safely prevent default, stop propagation, and stop immediate propagation
 *
 * @description
 * Enhanced event prevention that also stops immediate propagation.
 * Useful when multiple handlers are attached to the same element and you want
 * to ensure no other handlers execute.
 *
 * @param event - Optional Event object
 *
 * @example
 * ```typescript
 * const handleCriticalClick = (event?: Event) => {
 *   safeEventPreventAll(event);
 *   // ... critical logic that must not be interrupted
 * };
 * ```
 */
export function safeEventPreventAll(event?: Event): void {
  if (!event) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}
