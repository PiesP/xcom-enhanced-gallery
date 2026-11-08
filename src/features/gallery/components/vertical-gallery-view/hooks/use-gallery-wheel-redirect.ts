// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Wheel redirect hook — intercepts wheel events on the gallery
 * container and redirects them to the items container when the event
 * originates outside of it. Prevents the underlying Twitter page from
 * scrolling while the gallery is open.
 */

import { getEventManager } from '@shared/services/event-manager';
import { createEffect, onCleanup } from 'solid-js';

/**
 * Parameters for useGalleryWheelRedirect hook
 */
interface UseGalleryWheelRedirectOptions {
  /** Gallery container element ref */
  readonly containerEl: () => HTMLDivElement | null;
  /** Scrollable items container element ref */
  readonly itemsContainerEl: () => HTMLElement | null;
  /** Notify the scroll owner before a background wheel mutates the scrollport. */
  readonly onRedirectedWheel: () => void;
}

/**
 * Handles wheel event redirection from gallery container to items container.
 * When the user scrolls empty gallery space outside the items and toolbar
 * panels, the scroll is redirected to the items container.
 */
function handleContainerWheel(
  event: WheelEvent,
  itemsContainerEl: () => HTMLElement | null,
  onRedirectedWheel: () => void
): void {
  const itemsContainer = itemsContainerEl();
  if (!itemsContainer) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  // Let the items container handle its own scroll naturally
  if (itemsContainer.contains(target)) {
    return;
  }

  // Nested toolbar/panel controls own their wheel activity. Their listeners
  // normally stop propagation; retain this guard at the redirect boundary.
  if (
    target.closest(
      '[data-gallery-element="toolbar"], [data-gallery-element="settings-panel"], [data-gallery-element="tweet-panel"], [data-gallery-element="keyboard-help-panel"]'
    )
  ) {
    event.stopPropagation();
    return;
  }

  // For events outside the items container, redirect scroll to items container
  event.preventDefault();
  event.stopPropagation();

  // MED-5: Guard with scrollable overflow check + normalize deltaY.
  // Skip when container has no overflow (not scrollable) and cap deltaY
  // to avoid excessive jumps on high-resolution scroll devices.
  const overflow = itemsContainer.scrollHeight - itemsContainer.clientHeight;
  if (overflow <= 1) {
    return;
  } // not scrollable
  const clampedDelta = Math.max(-150, Math.min(150, event.deltaY));
  if (clampedDelta === 0) {
    return;
  }
  onRedirectedWheel();
  itemsContainer.scrollTop += clampedDelta;
}

/**
 * Sets up wheel event redirection from the gallery container to the
 * items container. Empty gallery space redirects to the items container;
 * toolbar and nested-panel wheel input remains owned by those controls.
 *
 * Uses a non-passive event listener via EventManager to allow
 * preventDefault() on the wheel event.
 *
 * @param options - Hook configuration with element refs
 */
export function useGalleryWheelRedirect(options: UseGalleryWheelRedirectOptions): void {
  const { containerEl, itemsContainerEl, onRedirectedWheel } = options;

  createEffect(() => {
    const container = containerEl();
    if (!container) {
      return;
    }

    const eventManager = getEventManager();
    const listener: EventListener = (event) => {
      handleContainerWheel(event as WheelEvent, itemsContainerEl, onRedirectedWheel);
    };

    eventManager.addEventListener(container, 'wheel', listener, {
      passive: false,
      context: 'gallery:wheel:container-redirect',
    });
    onCleanup(() => eventManager.removeByContext('gallery:wheel:container-redirect'));
  });
}
