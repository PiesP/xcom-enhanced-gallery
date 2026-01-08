/**
 * @fileoverview Focus Coordinator - Natural Scroll-Based Focus Selection
 * @description Selects the most naturally visible gallery item after scroll stops.
 */

import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';

/** Configuration for FocusCoordinator (IntersectionObserver-based focus selection) */
interface FocusCoordinatorOptions {
  readonly isEnabled: Accessor<boolean>;
  readonly container: Accessor<HTMLElement | null>;
  readonly activeIndex: Accessor<number>;
  readonly onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
  readonly threshold?: number | readonly number[];
  readonly rootMargin?: string;
}

/** Tracked item with visibility state and observer unsubscribe */
interface TrackedItem {
  readonly element: HTMLElement;
  isVisible: boolean;
  entry?: IntersectionObserverEntry;
  unsubscribe?: () => void;
}

/** Focus candidate with distance metric */
interface FocusCandidate {
  readonly index: number;
  readonly distance: number;
}

/** IntersectionObserver configuration */
interface ObserverOptions {
  readonly threshold: number | number[];
  readonly rootMargin: string;
}

const DEFAULTS = {
  THRESHOLD: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  ROOT_MARGIN: '0px',
} as const;

export class FocusCoordinator {
  private readonly items = new Map<number, TrackedItem>();
  private readonly observerOptions: ObserverOptions;

  constructor(private readonly options: FocusCoordinatorOptions) {
    const threshold = options.threshold;
    let resolvedThreshold: number | number[];
    if (typeof threshold === 'number') {
      resolvedThreshold = threshold;
    } else if (Array.isArray(threshold)) {
      resolvedThreshold = [...threshold];
    } else {
      resolvedThreshold = [...DEFAULTS.THRESHOLD];
    }
    this.observerOptions = {
      threshold: resolvedThreshold,
      rootMargin: options.rootMargin ?? DEFAULTS.ROOT_MARGIN,
    };
  }

  registerItem(index: number, element: HTMLElement | null): void {
    const prev = this.items.get(index);
    prev?.unsubscribe?.();

    if (!element) {
      this.items.delete(index);
      return;
    }

    const trackedItem: TrackedItem = { element, isVisible: false };
    trackedItem.unsubscribe = SharedObserver.observe(
      element,
      (entry) => {
        const item = this.items.get(index);
        if (item) {
          item.entry = entry;
          item.isVisible = entry.isIntersecting;
        }
      },
      this.observerOptions
    );

    this.items.set(index, trackedItem);
  }

  updateFocus(force: boolean = false): void {
    if (!force && !this.options.isEnabled()) return;

    const container = this.options.container();
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const selection = this.selectBestCandidate(containerRect);

    if (!selection) return;

    const currentIndex = this.options.activeIndex();
    const hasChanged = currentIndex !== selection.index;

    if (hasChanged) {
      this.options.onFocusChange(selection.index, 'auto');
    }
  }

  cleanup(): void {
    for (const item of this.items.values()) {
      item.unsubscribe?.();
    }
    this.items.clear();
  }

  private selectBestCandidate(containerRect: DOMRect): FocusCandidate | null {
    const viewportHeight = Math.max(containerRect.height, 1);
    const viewportTop = containerRect.top;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportCenter = viewportTop + viewportHeight / 2;

    // Threshold for considering an image top as "very close" to viewport top (in pixels)
    const topProximityThreshold = 50;

    let bestCandidate: FocusCandidate | null = null;
    let topAlignedCandidate: FocusCandidate | null = null;
    let highestVisibilityCandidate: {
      index: number;
      ratio: number;
      centerDistance: number;
    } | null = null;

    for (const [index, item] of this.items) {
      if (!item.isVisible || !item.element.isConnected) continue;

      const rect = item.element.getBoundingClientRect();
      const itemTop = rect.top;
      const itemHeight = rect.height;
      const itemBottom = itemTop + itemHeight;
      const itemCenter = itemTop + itemHeight / 2;

      // Calculate actual visible portion within viewport
      const visibleTop = Math.max(itemTop, viewportTop);
      const visibleBottom = Math.min(itemBottom, viewportBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = itemHeight > 0 ? visibleHeight / itemHeight : 0;
      const centerDistance = Math.abs(itemCenter - viewportCenter);

      // Check if image top is very close to viewport top
      const topDistance = Math.abs(itemTop - viewportTop);
      if (topDistance <= topProximityThreshold && visibilityRatio > 0.1) {
        if (!topAlignedCandidate || topDistance < topAlignedCandidate.distance) {
          topAlignedCandidate = { index, distance: topDistance };
        }
      }

      // Track highest visibility candidate (most visible item in viewport)
      // On equal visibility ratio, prefer the one closer to center
      if (visibilityRatio > 0.1) {
        const isBetterVisibility =
          !highestVisibilityCandidate ||
          visibilityRatio > highestVisibilityCandidate.ratio ||
          (visibilityRatio === highestVisibilityCandidate.ratio &&
            centerDistance < highestVisibilityCandidate.centerDistance);

        if (isBetterVisibility) {
          highestVisibilityCandidate = { index, ratio: visibilityRatio, centerDistance };
        }
      }

      // Center-based candidate as final fallback
      if (!bestCandidate || centerDistance < bestCandidate.distance) {
        bestCandidate = { index, distance: centerDistance };
      }
    }

    // Priority: top-aligned > highest visibility > center-based
    if (topAlignedCandidate) {
      return topAlignedCandidate;
    }
    if (highestVisibilityCandidate) {
      return { index: highestVisibilityCandidate.index, distance: 0 };
    }
    return bestCandidate;
  }
}
