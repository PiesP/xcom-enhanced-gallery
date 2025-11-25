/**
 * @fileoverview Focus Coordinator - Natural Scroll-Based Focus Selection
 * @description Selects the most naturally visible gallery item after scroll stops.
 */

import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';

export interface FocusCoordinatorOptions {
  isEnabled: Accessor<boolean>;
  container: Accessor<HTMLElement | null>;
  onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
  threshold?: number | number[];
  rootMargin?: string;
}

interface TrackedItem {
  element: HTMLElement;
  isVisible: boolean;
  entry?: IntersectionObserverEntry;
}

interface FocusCandidate {
  index: number;
  distance: number;
}

const DEFAULTS = {
  THRESHOLD: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  ROOT_MARGIN: '0px',
} as const;

export class FocusCoordinator {
  private readonly items = new Map<number, TrackedItem>();
  private readonly observerOptions: { threshold: number | number[]; rootMargin: string };
  private lastAutoFocusIndex: number | null = null;

  constructor(private readonly options: FocusCoordinatorOptions) {
    this.observerOptions = {
      threshold: options.threshold ?? [...DEFAULTS.THRESHOLD],
      rootMargin: options.rootMargin ?? DEFAULTS.ROOT_MARGIN,
    };
  }

  registerItem(index: number, element: HTMLElement | null): void {
    const prev = this.items.get(index);
    if (prev) SharedObserver.unobserve(prev.element);

    if (!element) {
      this.items.delete(index);
      if (this.lastAutoFocusIndex === index) {
        this.lastAutoFocusIndex = null;
      }
      return;
    }

    this.items.set(index, { element, isVisible: false });
    SharedObserver.observe(
      element,
      entry => {
        const item = this.items.get(index);
        if (item) {
          item.entry = entry;
          item.isVisible = entry.isIntersecting;
        }
      },
      this.observerOptions,
    );
  }

  updateFocus(): void {
    if (!this.options.isEnabled()) return;

    const container = this.options.container();
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const selection = this.selectBestCandidate(containerRect);

    if (!selection) return;

    const hasChanged = this.lastAutoFocusIndex !== selection.index;
    this.lastAutoFocusIndex = selection.index;

    if (hasChanged) {
      this.options.onFocusChange(selection.index, 'auto');
    }
  }

  cleanup(): void {
    for (const item of this.items.values()) {
      SharedObserver.unobserve(item.element);
    }
    this.items.clear();
    this.lastAutoFocusIndex = null;
  }

  private selectBestCandidate(containerRect: DOMRect): FocusCandidate | null {
    const viewportHeight = Math.max(containerRect.height, 1);
    const viewportCenter = containerRect.top + viewportHeight / 2;

    let bestCandidate: FocusCandidate | null = null;

    for (const [index, item] of this.items) {
      if (!item.isVisible || !item.element.isConnected) continue;

      const rect = item.element.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distance = Math.abs(itemCenter - viewportCenter);

      if (!bestCandidate || distance < bestCandidate.distance) {
        bestCandidate = { index, distance };
      }
    }

    return bestCandidate;
  }
}
