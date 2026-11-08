// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Scroll-based focus selection from current item geometry. */

import {
  type FocusItemRect,
  selectBestFocusCandidate,
} from '@features/gallery/logic/focus-candidate-selection';
import type { Accessor } from 'solid-js';

interface FocusCoordinatorOptions {
  readonly isEnabled: Accessor<boolean>;
  readonly container: Accessor<HTMLElement | null>;
  readonly activeIndex: Accessor<number>;
  readonly onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
}

interface TrackedItem {
  readonly element: HTMLElement;
}

export class FocusCoordinator {
  private readonly items = new Map<number, TrackedItem>();
  private _rafId: number | null = null;

  constructor(private readonly options: FocusCoordinatorOptions) {}

  registerItem(index: number, element: HTMLElement | null): void {
    if (!element) {
      this.items.delete(index);
      return;
    }

    this.items.set(index, { element });
  }

  /**
   * Request a focus update. Throttled via requestAnimationFrame —
   * multiple calls within the same frame are coalesced into one.
   * NOT idempotent across frames (by design).
   */
  updateFocus(force: boolean = false): void {
    if (!force && !this.options.isEnabled()) {
      return;
    }
    if (this._rafId !== null) {
      return;
    } // already throttled
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      const container = this.options.container();
      if (!container) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const selection = selectBestFocusCandidate(
        { top: containerRect.top, height: containerRect.height },
        this.collectItemRects(),
        this.options.activeIndex()
      );
      if (!selection) {
        return;
      }
      // currentIndex and focusedIndex intentionally diverge after user scroll.
      // Always publish the measured choice: comparing only with currentIndex
      // leaves a stale focusedIndex unchanged when navigation returns to it.
      this.options.onFocusChange(selection.index, 'auto');
    });
  }

  cleanup(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.items.clear();
  }

  /** Batch DOM reads before passing immutable measurements to the pure ranker. */
  private collectItemRects(): FocusItemRect[] {
    const itemRects: FocusItemRect[] = [];
    for (const [index, item] of this.items) {
      // Observer entries can lag the final position at scrollend. Measure the
      // connected items directly; the ranker decides which intersect the viewport.
      if (!item.element.isConnected) {
        continue;
      }
      const rect = item.element.getBoundingClientRect();
      itemRects.push({ index, top: rect.top, height: rect.height });
    }
    return itemRects;
  }
}
