// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Scroll-based focus selection via IntersectionObserver. Selects most visible gallery item. */

import {
  type FocusItemRect,
  selectBestFocusCandidate,
} from '@features/gallery/logic/focus-candidate-selection';
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

  /**
   * Request a focus update. Throttled via requestAnimationFrame —
   * multiple calls within the same frame are coalesced into one.
   * NOT idempotent across frames (by design).
   */
  updateFocus(force: boolean = false): void {
    if (!force && !this.options.isEnabled()) return;
    if (this._rafId !== null) return; // already throttled
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      const container = this.options.container();
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const selection = selectBestFocusCandidate(
        { top: containerRect.top, height: containerRect.height },
        this.collectVisibleItemRects()
      );
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

  /** Batch DOM reads before passing immutable measurements to the pure ranker. */
  private collectVisibleItemRects(): FocusItemRect[] {
    const itemRects: FocusItemRect[] = [];
    for (const [index, item] of this.items) {
      if (!item.isVisible || !item.element.isConnected) continue;
      const rect = item.element.getBoundingClientRect();
      itemRects.push({ index, top: rect.top, height: rect.height });
    }
    return itemRects;
  }
}
