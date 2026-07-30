// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Minimal type guards used by the runtime.
 * Keep this module small; prefer inlining simple instanceof checks.
 */

/**
 * Create a typed EventListener wrapper.
 * @template T - Event type to narrow to
 * @param handler - Handler with narrowed event type
 * @returns EventListener compatible with DOM event binding
 */
export function createEventListener<T extends Event = Event>(
  handler: (event: T) => void
): EventListener {
  return (event: Event) => {
    handler(event as T);
  };
}

export { isHTMLElement, isRecord } from '@piesp/browser-core/util';
