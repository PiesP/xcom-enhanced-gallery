/**
 * @fileoverview Focus Coordinator for Gallery Scroll-Based Focus Tracking
 * @description Tracks visible gallery items and determines which item should be focused
 * based on viewport position. Uses IntersectionObserver for efficient visibility detection.
 *
 * Key behaviors:
 * - Observes all registered gallery items for visibility changes
 * - Finds the item closest to the viewport center when scroll stops
 * - Triggers focus change callback for toolbar progress updates
 * - Does NOT trigger auto-scroll (focus tracking only)
 */

import { SharedObserver } from '@shared/utils/performance/observer-pool';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import type { Accessor } from 'solid-js';

/** Configuration options for FocusCoordinator */
export interface FocusCoordinatorOptions {
  /** Whether focus tracking is enabled (accessor for reactivity) */
  isEnabled: Accessor<boolean>;
  /** IntersectionObserver threshold(s) for visibility detection */
  threshold?: number | number[];
  /** IntersectionObserver root margin */
  rootMargin?: string;
  /** Minimum intersection ratio to consider an item as a candidate */
  minimumVisibleRatio?: number;
  /** Container element accessor for viewport reference */
  container: Accessor<HTMLElement | null>;
  /** Debounce time for recomputation (ms) */
  debounceTime?: number;
  /** Callback when focused item changes */
  onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
}

/** Internal item tracking structure */
interface TrackedItem {
  element: HTMLElement;
  entry?: IntersectionObserverEntry;
}

/** Default configuration values */
const DEFAULTS = {
  THRESHOLD: 0,
  ROOT_MARGIN: '0px',
  MIN_VISIBLE_RATIO: 0.05,
  DEBOUNCE_TIME: 50,
} as const;

/**
 * Coordinates focus tracking for gallery items based on scroll position.
 * Determines which item is most visible/centered in the viewport.
 */
export class FocusCoordinator {
  private readonly items = new Map<number, TrackedItem>();
  private debounceTimerId: number | null = null;
  private readonly minVisibleRatio: number;
  private readonly debounceTime: number;

  constructor(private readonly options: FocusCoordinatorOptions) {
    this.minVisibleRatio = options.minimumVisibleRatio ?? DEFAULTS.MIN_VISIBLE_RATIO;
    this.debounceTime = options.debounceTime ?? DEFAULTS.DEBOUNCE_TIME;
  }

  /**
   * Register or unregister a gallery item for focus tracking.
   * @param index - Item index in the gallery
   * @param element - DOM element to track, or null to unregister
   */
  registerItem(index: number, element: HTMLElement | null): void {
    // Cleanup previous registration for this index
    const prev = this.items.get(index);
    if (prev) {
      SharedObserver.unobserve(prev.element);
    }

    // Unregister if element is null
    if (!element) {
      this.items.delete(index);
      this.scheduleRecompute();
      return;
    }

    // Register new element
    this.items.set(index, { element });
    SharedObserver.observe(
      element,
      entry => {
        const item = this.items.get(index);
        if (item) {
          item.entry = entry;
        }
        this.scheduleRecompute();
      },
      {
        threshold: this.options.threshold ?? DEFAULTS.THRESHOLD,
        rootMargin: this.options.rootMargin ?? DEFAULTS.ROOT_MARGIN,
      },
    );
  }

  /** Schedule a debounced recomputation of the focused item */
  private scheduleRecompute(): void {
    if (this.debounceTimerId !== null) {
      globalTimerManager.clearTimeout(this.debounceTimerId);
    }
    this.debounceTimerId = globalTimerManager.setTimeout(() => {
      this.debounceTimerId = null;
      this.recompute();
    }, this.debounceTime);
  }

  /**
   * Recompute which item should be focused based on current visibility.
   * Finds the item closest to the viewport center.
   */
  recompute(): void {
    if (!this.options.isEnabled()) {
      return;
    }

    const container = this.options.container();
    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    const bestCandidate = this.findBestCandidate(containerCenter);

    if (bestCandidate !== null) {
      this.options.onFocusChange(bestCandidate, 'auto');
    }
  }

  /**
   * Find the item closest to the viewport center.
   * @param containerCenter - Y coordinate of the viewport center
   * @returns Index of the best candidate, or null if none found
   */
  private findBestCandidate(containerCenter: number): number | null {
    let bestIndex: number | null = null;
    let bestDistance = Infinity;
    let bestRatio = 0;

    for (const [index, item] of this.items) {
      // Skip items with insufficient visibility
      if (!item.entry || item.entry.intersectionRatio < this.minVisibleRatio) {
        continue;
      }

      // Use fresh rect for accurate position (entry.boundingClientRect is stale)
      const rect = item.element.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distance = Math.abs(itemCenter - containerCenter);
      const ratio = item.entry.intersectionRatio;

      // Prefer closer items, or higher ratio if equidistant
      const isBetter = distance < bestDistance || (distance === bestDistance && ratio > bestRatio);

      if (isBetter) {
        bestIndex = index;
        bestDistance = distance;
        bestRatio = ratio;
      }
    }

    return bestIndex;
  }

  /** Cleanup all observers and timers */
  cleanup(): void {
    for (const item of this.items.values()) {
      SharedObserver.unobserve(item.element);
    }
    this.items.clear();

    if (this.debounceTimerId !== null) {
      globalTimerManager.clearTimeout(this.debounceTimerId);
      this.debounceTimerId = null;
    }
  }
}
