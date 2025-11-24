/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Simplified Gallery Item Scroll Hook
 * @description Uses Solid.js reactivity and native scrollIntoView
 */

import { getSolid } from "@shared/external/vendors";
import { toAccessor } from "@shared/utils/solid-helpers";

const { createEffect, untrack, on } = getSolid();

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

export interface UseGalleryItemScrollOptions {
  enabled?: MaybeAccessor<boolean>;
  behavior?: MaybeAccessor<ScrollBehavior>;
  block?: MaybeAccessor<ScrollLogicalPosition>;
  alignToCenter?: MaybeAccessor<boolean>;
}

export interface UseGalleryItemScrollReturn {
  scrollToItem: (index: number) => void;
  scrollToCurrentItem: () => void;
}

export function useGalleryItemScroll(
  containerRef: { current: HTMLElement | null } | Accessor<HTMLElement | null>,
  currentIndex: MaybeAccessor<number>,
  totalItems: MaybeAccessor<number>,
  options: UseGalleryItemScrollOptions = {},
): UseGalleryItemScrollReturn {
  const containerAccessor =
    typeof containerRef === "function"
      ? containerRef
      : () => containerRef.current;
  const enabled = toAccessor(options.enabled ?? true);
  const behavior = toAccessor(options.behavior ?? "auto");
  const block = toAccessor(options.block ?? "start");
  const alignToCenter = toAccessor(options.alignToCenter ?? false);
  const currentIndexAccessor = toAccessor(currentIndex);
  const totalItemsAccessor = toAccessor(totalItems);

  const scrollToItem = (index: number) => {
    const container = containerAccessor();
    if (!enabled() || !container || index < 0 || index >= totalItemsAccessor())
      return;

    const itemsRoot = container.querySelector(
      '[data-xeg-role="items-list"], [data-xeg-role="items-container"]',
    );
    if (!itemsRoot) return;

    const items = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
    const target = items[index] as HTMLElement;

    if (target) {
      target.scrollIntoView({
        behavior: behavior(),
        block: alignToCenter() ? "center" : block(),
        inline: "nearest",
      });
    } else {
      // Retry once if not found (e.g. virtual scrolling or render delay)
      requestAnimationFrame(() => {
        const retryItems = itemsRoot.querySelectorAll(
          '[data-xeg-role="gallery-item"]',
        );
        const retryTarget = retryItems[index] as HTMLElement;
        if (retryTarget) {
          retryTarget.scrollIntoView({
            behavior: behavior(),
            block: alignToCenter() ? "center" : block(),
            inline: "nearest",
          });
        }
      });
    }
  };

  // Auto-scroll when index changes
  createEffect(
    on(currentIndexAccessor, (index) => {
      if (untrack(enabled)) {
        scrollToItem(index);
      }
    }),
  );

  return {
    scrollToItem,
    scrollToCurrentItem: () => scrollToItem(currentIndexAccessor()),
  };
}
