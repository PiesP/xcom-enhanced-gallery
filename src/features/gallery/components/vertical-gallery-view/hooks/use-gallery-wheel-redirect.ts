/**
 * @fileoverview Wheel redirect hook — intercepts wheel events on the gallery
 * container and redirects them to the items container when the event
 * originates outside of it. Prevents the underlying Twitter page from
 * scrolling while the gallery is open.
 */

import { EventManager } from '@shared/services/event-manager';
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

    const controller = new AbortController();

    const handleContainerWheel = (event: WheelEvent): void => {
      const itemsContainer = itemsContainerEl();
      if (!itemsContainer) return;

      // Check if the wheel event target is inside the items container
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (itemsContainer.contains(target)) {
        // Let the items container handle its own scroll naturally
        return;
      }

      // For events outside the items container, redirect scroll to items container
      event.preventDefault();
      event.stopPropagation();
      itemsContainer.scrollTop += event.deltaY;
    };

    const eventManager = EventManager.getInstance();
    const listener: EventListener = (event) => {
      handleContainerWheel(event as WheelEvent);
    };

    eventManager.addEventListener(container, 'wheel', listener, {
      passive: false,
      signal: controller.signal,
      context: 'gallery:wheel:container-redirect',
    });
    onCleanup(() => controller.abort());
  });
}
