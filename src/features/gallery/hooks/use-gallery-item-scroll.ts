// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Scrolls gallery item into view using Solid.js reactivity and scrollIntoView.
 */

import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';
import { toAccessor } from '@shared/utils/solid/accessor-utils';
import type { Accessor } from 'solid-js';
import { createEffect, onCleanup, untrack } from 'solid-js';

/** Configuration for item scroll behavior. */
interface UseGalleryItemScrollOptions {
  readonly enabled?: MaybeAccessor<boolean>;
  readonly behavior?: MaybeAccessor<ScrollBehavior>;
  readonly block?: MaybeAccessor<ScrollLogicalPosition>;
  readonly alignToCenter?: MaybeAccessor<boolean>;
  readonly isScrolling?: MaybeAccessor<boolean>;
  readonly onScrollStart?: () => void;
}

/** Return type for useGalleryItemScroll. */
interface UseGalleryItemScrollReturn {
  readonly scrollToItem: (index: number) => void;
  readonly scrollToCurrentItem: () => void;
}

/**
 * Hook for programmatic scrolling to a specific gallery item.
 *
 * Smooth-scrolls the container to bring the target item into view, with
 * configurable duration and easing. Tracks programmatic scrolls to
 * distinguish them from user-initiated scrolling.
 *
 * @param containerRef - Container element ref or accessor
 * @param currentIndex - Reactive current index
 * @param totalItems - Reactive total item count
 * @param options - Scroll behavior configuration
 * @returns Scroll control functions
 */
export function useGalleryItemScroll(
  containerRef: { current: HTMLElement | null } | Accessor<HTMLElement | null>,
  currentIndex: MaybeAccessor<number>,
  totalItems: MaybeAccessor<number>,
  options: UseGalleryItemScrollOptions = {}
): UseGalleryItemScrollReturn {
  const containerAccessor =
    typeof containerRef === 'function' ? containerRef : () => containerRef.current;
  const enabled = toAccessor(options.enabled ?? true);
  const behavior = toAccessor(options.behavior ?? 'auto');
  const block = toAccessor(options.block ?? 'start');
  const alignToCenter = toAccessor(options.alignToCenter ?? false);
  const isScrolling = toAccessor(options.isScrolling ?? false);
  const currentIndexAccessor = toAccessor(currentIndex);
  const totalItemsAccessor = toAccessor(totalItems);

  // DOM query cache using WeakRef to prevent memory leaks
  const itemsCache = new Map<number, WeakRef<HTMLElement>>();
  onCleanup(() => itemsCache.clear());

  const getCachedItem = (index: number, itemsRoot: Element): HTMLElement | null => {
    // 1. Check cache
    const cached = itemsCache.get(index)?.deref();
    if (cached?.isConnected) return cached;

    // 2. Cache miss: query DOM
    const items = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
    const element = items[index] as HTMLElement | undefined;

    // 3. Store in cache using WeakRef
    if (element) {
      itemsCache.set(index, new WeakRef(element));
    }

    return element ?? null;
  };

  const scrollToItem = (index: number) => {
    const container = containerAccessor();
    if (!enabled() || !container || index < 0 || index >= totalItemsAccessor()) return;

    const itemsRoot = container.querySelector('[data-xeg-role="items-container"]');
    if (!itemsRoot) return;

    const target = getCachedItem(index, itemsRoot);

    if (target) {
      options.onScrollStart?.();
      target.scrollIntoView({
        behavior: behavior(),
        block: alignToCenter() ? 'center' : block(),
        inline: 'nearest',
      });
    } else {
      // Retry once if not found (e.g. virtual scrolling or render delay)
      requestAnimationFrame(() => {
        const retryTarget = getCachedItem(index, itemsRoot);
        if (retryTarget) {
          options.onScrollStart?.();
          retryTarget.scrollIntoView({
            behavior: behavior(),
            block: alignToCenter() ? 'center' : block(),
            inline: 'nearest',
          });
        }
      });
    }
  };

  // Auto-scroll when index changes
  createEffect(() => {
    const index = currentIndexAccessor();
    const container = containerAccessor();
    const total = totalItemsAccessor();

    if (!container || total <= 0) {
      return;
    }

    if (untrack(enabled) && !untrack(isScrolling)) {
      scrollToItem(index);
    }
  });

  return {
    scrollToItem,
    scrollToCurrentItem: () => scrollToItem(currentIndexAccessor()),
  };
}
