/**
 * @fileoverview Focus Coordinator - Natural Scroll-Based Focus Selection
 * @description Selects the most naturally visible gallery item after scroll stops.
 *
 * Selection algorithm:
 * 1. Primary: Item with highest screen coverage (most screen space occupied)
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
  /** IntersectionObserver threshold (default: granular steps) */
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
  isVisible: boolean;
}

/** Default configuration values */
const DEFAULTS = {
  // Granular thresholds for smoother tracking
  THRESHOLD: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
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
      threshold: options.threshold ?? [...DEFAULTS.THRESHOLD],
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

    this.items.set(index, { element, isVisible: false });
    SharedObserver.observe(
      element,
      entry => {
        const item = this.items.get(index);
        if (item) {
          item.entry = entry;
          item.isVisible = entry.isIntersecting;
        }
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
    const viewportHeight = rect.height;

    const bestCandidate = this.findBestCandidate(viewportCenter, viewportHeight, rect);

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
   * Primary: Highest screen coverage (most screen space occupied)
   * Tiebreaker: Center closest to viewport center
   */
  private findBestCandidate(
    viewportCenter: number,
    viewportHeight: number,
    containerRect: DOMRect,
  ): number | null {
    type Candidate = { index: number; coverage: number; centerDistance: number };
    const candidates: Candidate[] = [];

    for (const [index, item] of this.items) {
      if (!item.isVisible) continue;

      const rect = item.element.getBoundingClientRect();

      // Calculate vertical intersection
      const intersectionTop = Math.max(rect.top, containerRect.top);
      const intersectionBottom = Math.min(rect.bottom, containerRect.bottom);
      const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);

      if (intersectionHeight === 0) continue;

      // Screen coverage = intersection height / viewport height
      const coverage = intersectionHeight / viewportHeight;

      if (coverage < this.minVisibleRatio) continue;

      const itemCenter = rect.top + rect.height / 2;
      const centerDistance = Math.abs(itemCenter - viewportCenter);

      candidates.push({
        index,
        coverage,
        centerDistance,
      });
    }

    if (candidates.length === 0) return null;

    // Sort: highest coverage first, then closest to center
    candidates.sort((a, b) => {
      const coverageDiff = b.coverage - a.coverage;
      // Use center distance as tiebreaker when coverage is similar (within 10%)
      if (Math.abs(coverageDiff) < 0.1) {
        return a.centerDistance - b.centerDistance;
      }
      return coverageDiff;
    });

    return candidates[0]!.index;
  }
}
