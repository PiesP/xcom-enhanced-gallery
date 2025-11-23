import { logger } from "@shared/logging";
import { isGalleryInternalElement } from "./dom";
// Import from new modular layers
import {
  initializeGalleryEvents as _initializeGalleryEvents,
  cleanupGalleryEvents as _cleanupGalleryEvents,
  updateGalleryEventOptions as _updateGalleryEventOptions,
  getGalleryEventSnapshot as _getGalleryEventSnapshot,
} from "./events/lifecycle/gallery-lifecycle";
import {
  addListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeAllEventListeners,
  getEventListenerStatus,
} from "./events/core/listener-manager";
import type {
  EventContext,
  EventHandlers,
  GalleryEventOptions,
} from "./events/core/event-context";
// Phase 420.3: Import listener profiler for diagnostics

// Re-export core functions and types for backward compatibility
export {
  addListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeAllEventListeners,
  getEventListenerStatus,
};
export type { EventContext, EventHandlers, GalleryEventOptions };
// Phase 420.3: Export profiler for diagnostics and monitoring

// Re-export lifecycle functions with original signatures
export const initializeGalleryEvents = _initializeGalleryEvents;
export const cleanupGalleryEvents = _cleanupGalleryEvents;
export const updateGalleryEventOptions = _updateGalleryEventOptions;
export const getGalleryEventSnapshot = _getGalleryEventSnapshot;

/**
 * PC-only policy: Explicitly block Touch/Pointer events
 * CodeQL `forbidden-touch-events.ql` validation target
 *
 * Touch events: touchstart, touchmove, touchend, touchcancel
 * Pointer events: pointerdown, pointermove, pointerup, pointercancel, pointerenter, pointerleave
 *
 * Phase 229: Pointer event policy change
 * - Touch events: Block only within gallery root scope (core of PC-only policy)
 * - Pointer events:
 *   - Inside gallery: Block (use gallery-specific Mouse events)
 *   - Form controls: Allow (select/input/textarea/button, etc.)
 */
const FORM_CONTROL_SELECTORS =
  'select, input, textarea, button, [role="listbox"], [role="combobox"]';

/**
 * Check if element is a form control
 * Phase 243: Extract explicit function to prevent regression
 */
function isFormControlElement(element: HTMLElement): boolean {
  return Boolean(
    element.matches?.(FORM_CONTROL_SELECTORS) ||
      element.closest?.(FORM_CONTROL_SELECTORS),
  );
}

/**
 * Determine pointer event policy
 * Phase 243: Separate policy decision logic into clear function
 *
 * @returns 'allow' | 'block' | 'log'
 */
function getPointerEventPolicy(
  target: HTMLElement,
  pointerType: string,
): "allow" | "block" | "log" {
  // 1. Mouse + form control → Allow (Phase 242)
  if (pointerType === "mouse" && isFormControlElement(target)) {
    return "allow";
  }

  // 2. Inside gallery → Block
  if (isGalleryInternalElement(target)) {
    return "block";
  }

  // 3. Other → Log only
  return "log";
}

export function applyGalleryPointerPolicy(root: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  const touchEvents: Array<keyof HTMLElementEventMap> = [
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
  ];

  const pointerEvents: Array<keyof HTMLElementEventMap> = [
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "pointerenter",
    "pointerleave",
  ];

  const touchHandler = (evt: Event) => {
    logger.debug("[PC-only policy] Blocked touch event", {
      type: evt.type,
      target: (evt.target as Element | null)?.tagName,
    });
    evt.preventDefault?.();
    evt.stopPropagation?.();
    evt.stopImmediatePropagation?.();
  };

  touchEvents.forEach((eventType) => {
    root.addEventListener(eventType, touchHandler, {
      capture: true,
      passive: false,
      signal,
    });
  });

  const pointerHandler = (evt: Event) => {
    const pointerEvent = evt as PointerEvent;
    const rawTarget = evt.target;
    const pointerType =
      typeof pointerEvent.pointerType === "string" &&
      pointerEvent.pointerType.length > 0
        ? pointerEvent.pointerType
        : "mouse";

    if (!(rawTarget instanceof HTMLElement)) {
      return;
    }

    const policy = getPointerEventPolicy(rawTarget, pointerType);

    if (policy === "allow") {
      return;
    }

    if (policy === "block") {
      evt.preventDefault?.();
      evt.stopPropagation?.();
      evt.stopImmediatePropagation?.();
      logger.debug("[PC-only policy] Blocked pointer event in gallery", {
        type: evt.type,
        pointerType,
        target: rawTarget.tagName,
      });
      return;
    }

    // log only
    logger.trace?.("[PC-only policy] Pointer event allowed (logged)", {
      type: evt.type,
      pointerType,
      target: rawTarget.tagName,
    });
  };

  pointerEvents.forEach((eventType) => {
    root.addEventListener(eventType, pointerHandler, {
      capture: true,
      passive: false,
      signal,
    });
  });

  return () => {
    controller.abort();
  };
}
