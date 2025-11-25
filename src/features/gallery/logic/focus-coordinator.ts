/**
 * @fileoverview Focus Coordinator - Natural Scroll-Based Focus Selection
 * @description Selects the most naturally visible gallery item after scroll stops.
 *
 * Selection algorithm:
 * 1. Primary: Item with highest visibility ratio (most visible wins)
 * 2. Tiebreaker: Item whose center is closest to viewport center
 *
 * This approach feels most natural because users perceive the item
 * that occupies the most screen space as the "current" item.
 */

import { SharedObserver } from '@shared/utils/performance/observer-pool';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import type { Accessor } from 'solid-js';

/** Configuration for FocusCoordinator */
export interface FocusCoordinatorOptions {
  /** Whether tracking is enabled */
  isEnabled: Accessor<boolean>;
  /** Container element for viewport reference */
  container: Accessor<HTMLElement | null>;
  /** Callback when focused item changes */
  onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
  /** IntersectionObserver threshold (default: 0) */
  threshold?: number | number[];
  /** IntersectionObserver root margin (default: '0px') */
  rootMargin?: string;
  /** Minimum visibility ratio to consider (default: 0.05) */
  minimumVisibleRatio?: number;
  /** Debounce time in ms (default: 50) */
  debounceTime?: number;
}

/** Tracked item state */
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
 * Coordinates focus tracking for gallery items.
 * Selects the most naturally visible item when scroll stops.
 */
export class FocusCoordinator {
  private readonly items = new Map<number, TrackedItem>();
  private debounceTimerId: number | null = null;
  private readonly minVisibleRatio: number;
  private readonly debounceTime: number;
  private readonly observerOptions: { threshold: number | number[]; rootMargin: string };

  constructor(private readonly options: FocusCoordinatorOptions) {
    this.minVisibleRatio = options.minimumVisibleRatio ?? DEFAULTS.MIN_VISIBLE_RATIO;
    this.debounceTime = options.debounceTime ?? DEFAULTS.DEBOUNCE_TIME;
    this.observerOptions = {
      threshold: options.threshold ?? DEFAULTS.THRESHOLD,
      rootMargin: options.rootMargin ?? DEFAULTS.ROOT_MARGIN,
    };
  }

  /** Register or unregister a gallery item for tracking */
  registerItem(index: number, element: HTMLElement | null): void {
    const prev = this.items.get(index);
    if (prev) SharedObserver.unobserve(prev.element);

    if (!element) {
      this.items.delete(index);
      this.scheduleRecompute();
      return;
    }

    this.items.set(index, { element });
    SharedObserver.observe(
      element,
      entry => {
        const item = this.items.get(index);
        if (item) item.entry = entry;
        this.scheduleRecompute();
      },
      this.observerOptions,
    );
  }

  /** Force immediate recomputation */
  recompute(): void {
    if (!this.options.isEnabled()) return;

    const container = this.options.container();
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const viewportCenter = rect.top + rect.height / 2;
    const bestCandidate = this.findBestCandidate(viewportCenter);

    if (bestCandidate !== null) {
      this.options.onFocusChange(bestCandidate, 'auto');
    }
  }

  /** Cleanup observers and timers */
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

  /** Schedule debounced recomputation */
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
   * Find best item to focus using natural selection.
   * Primary: Highest visibility ratio (most visible item)
   * Tiebreaker: Center closest to viewport center
   */
  private findBestCandidate(viewportCenter: number): number | null {
    type Candidate = { index: number; ratio: number; centerDistance: number };
    const candidates: Candidate[] = [];

    for (const [index, item] of this.items) {
      if (!item.entry || item.entry.intersectionRatio < this.minVisibleRatio) continue;

      const rect = item.element.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;

      candidates.push({
        index,
        ratio: item.entry.intersectionRatio,
        centerDistance: Math.abs(itemCenter - viewportCenter),
      });
    }

    if (candidates.length === 0) return null;

    // Sort: highest visibility first, then closest to center
    candidates.sort((a, b) => {
      const ratioDiff = b.ratio - a.ratio;
      // Use center distance as tiebreaker when visibility is similar (within 5%)
      if (Math.abs(ratioDiff) < 0.05) {
        return a.centerDistance - b.centerDistance;
      }
      return ratioDiff;
    });

    return candidates[0]!.index;
  }
}
