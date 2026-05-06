/** @fileoverview Scroll-based focus selection via IntersectionObserver. Selects most visible gallery item. */

import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';

interface FocusCoordinatorOptions {
  readonly isEnabled: Accessor<boolean>;
  readonly container: Accessor<HTMLElement | null>;
  readonly activeIndex: Accessor<number>;
  readonly onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
  readonly threshold?: number | readonly number[];
  readonly rootMargin?: string;
}

interface TrackedItem {
  readonly element: HTMLElement;
  isVisible: boolean;
  entry?: IntersectionObserverEntry;
  unsubscribe?: () => void;
}

interface FocusCandidate {
  readonly index: number;
  readonly distance: number;
}

interface ObserverOptions {
  readonly threshold: number | number[];
  readonly rootMargin: string;
}

const DEFAULTS = {
  THRESHOLD: [0, 0.5, 1.0],
  ROOT_MARGIN: '0px',
} as const;

export class FocusCoordinator {
  private readonly items = new Map<number, TrackedItem>();
  private readonly observerOptions: ObserverOptions;
  private _rafId: number | null = null;

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
    if (this._rafId !== null) return; // already throttled
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      const container = this.options.container();
      if (!container) return;
      const selection = this.selectBestCandidate(container.getBoundingClientRect());
      if (!selection) return;
      if (this.options.activeIndex() !== selection.index) {
        this.options.onFocusChange(selection.index, 'auto');
      }
    });
  }

  cleanup(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    for (const item of this.items.values()) item.unsubscribe?.();
    this.items.clear();
  }

  private selectBestCandidate(containerRect: DOMRect): FocusCandidate | null {
    const viewportHeight = Math.max(containerRect.height, 1);
    const viewportTop = containerRect.top;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportCenter = viewportTop + viewportHeight / 2;
    const topProximityThreshold = 50;

    // Batch-read all rects first to avoid layout thrashing from individual
    // getBoundingClientRect() calls interleaved with computation.
    const itemRects = new Map<
      number,
      { top: number; height: number; bottom: number; center: number }
    >();
    for (const [index, item] of this.items) {
      if (!item.isVisible || !item.element.isConnected) continue;
      const rect = item.element.getBoundingClientRect();
      const top = rect.top;
      const height = rect.height;
      itemRects.set(index, { top, height, bottom: top + height, center: top + height / 2 });
    }

    let bestCandidate: FocusCandidate | null = null;
    let topAlignedCandidate: FocusCandidate | null = null;
    let highestVisibilityCandidate: {
      index: number;
      ratio: number;
      centerDistance: number;
    } | null = null;

    for (const [index, itemRect] of itemRects) {
      const itemTop = itemRect.top;
      const itemHeight = itemRect.height;
      const itemBottom = itemRect.bottom;
      const itemCenter = itemRect.center;

      const visibleTop = Math.max(itemTop, viewportTop);
      const visibleBottom = Math.min(itemBottom, viewportBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = itemHeight > 0 ? visibleHeight / itemHeight : 0;
      const centerDistance = Math.abs(itemCenter - viewportCenter);

      const topDistance = Math.abs(itemTop - viewportTop);
      if (topDistance <= topProximityThreshold && visibilityRatio > 0.1) {
        if (!topAlignedCandidate || topDistance < topAlignedCandidate.distance) {
          topAlignedCandidate = { index, distance: topDistance };
        }
      }

      if (visibilityRatio > 0.1) {
        const isBetter =
          !highestVisibilityCandidate ||
          visibilityRatio > highestVisibilityCandidate.ratio ||
          (visibilityRatio === highestVisibilityCandidate.ratio &&
            centerDistance < highestVisibilityCandidate.centerDistance);
        if (isBetter) {
          highestVisibilityCandidate = { index, ratio: visibilityRatio, centerDistance };
        }
      }

      if (!bestCandidate || centerDistance < bestCandidate.distance) {
        bestCandidate = { index, distance: centerDistance };
      }
    }

    if (topAlignedCandidate) return topAlignedCandidate;
    if (highestVisibilityCandidate) return { index: highestVisibilityCandidate.index, distance: 0 };
    return bestCandidate;
  }
}
