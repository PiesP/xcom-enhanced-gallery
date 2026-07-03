// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Wheel redirect hook — intercepts wheel events on the gallery
 * container and redirects them to the items container when the event
 * originates outside of it. Prevents the underlying Twitter page from
 * scrolling while the gallery is open.
 */

import { getEventManager } from '@shared/container/container';
import { createEffect, onCleanup } from 'solid-js';

/**
 * Parameters for useGalleryWheelRedirect hook
 */
interface UseGalleryWheelRedirectOptions {
  /** Gallery container element ref */
  readonly containerEl: () => HTMLDivElement | null;
  /** Scrollable items container element ref */
  readonly itemsContainerEl: () => HTMLDivElement | null;
}

/**
 * Handles wheel event redirection from gallery container to items container.
 * When the user scrolls outside the items area (e.g. on the toolbar or
 * empty space), the scroll is redirected to prevent the underlying Twitter
 * page from scrolling.
 */
function handleContainerWheel(
  event: WheelEvent,
  itemsContainerEl: () => HTMLDivElement | null
): void {
  const itemsContainer = itemsContainerEl();
  if (!itemsContainer) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  // Let the items container handle its own scroll naturally
  if (itemsContainer.contains(target)) return;

  // For events outside the items container, redirect scroll to items container
  event.preventDefault();
  event.stopPropagation();

  // MED-5: Guard with scrollable overflow check + normalize deltaY.
  // Skip when container has no overflow (not scrollable) and cap deltaY
  // to avoid excessive jumps on high-resolution scroll devices.
  const overflow = itemsContainer.scrollHeight - itemsContainer.clientHeight;
  if (overflow <= 1) return; // not scrollable
  const clampedDelta = Math.max(-150, Math.min(150, event.deltaY));
  itemsContainer.scrollTop += clampedDelta;
}

/**
 * Sets up wheel event redirection from the gallery container to the
 * items container. When the user scrolls outside the items area
 * (e.g. on the toolbar or empty space), the scroll is redirected so
 * the underlying Twitter page does not scroll.
 *
 * Uses a non-passive event listener via EventManager to allow
 * preventDefault() on the wheel event.
 *
 * @param options - Hook configuration with element refs
 */
export function useGalleryWheelRedirect(options: UseGalleryWheelRedirectOptions): void {
  const { containerEl, itemsContainerEl } = options;

  createEffect(() => {
    const container = containerEl();
    if (!container) return;

    const eventManager = getEventManager();
    const listener: EventListener = (event) => {
      handleContainerWheel(event as WheelEvent, itemsContainerEl);
    };

    eventManager.addEventListener(container, 'wheel', listener, {
      passive: false,
      context: 'gallery:wheel:container-redirect',
    });
    onCleanup(() => eventManager.removeByContext('gallery:wheel:container-redirect'));
  });
}
