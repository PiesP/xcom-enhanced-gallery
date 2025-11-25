/**
 * @fileoverview Focus Coordinator - Scroll-Based Focus Tracking
 * @description Determines which gallery item should be focused based on viewport position.
 * Uses IntersectionObserver for efficient visibility detection.
 *
 * Key behaviors:
 * - Observes gallery items for visibility changes
 * - Selects item closest to viewport top when scroll stops
 * - Updates toolbar progress bar via callback
 * - Does NOT trigger auto-scroll (tracking only)
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

/** Tracked item with optional intersection data */
interface TrackedItem {
  element: HTMLElement;
  entry?: IntersectionObserverEntry;
}

/** Configuration defaults */
const DEFAULTS = {
  THRESHOLD: 0,
  ROOT_MARGIN: '0px',
  MIN_VISIBLE_RATIO: 0.05,
  PRIORITY_VISIBLE_RATIO: 0.3, // Items with ≥30% visibility get priority
  DEBOUNCE_TIME: 50,
} as const;

/**
 * Coordinates focus tracking for gallery items based on scroll position.
 * Selects the most visible item closest to viewport top.
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
    if (prev) {
      SharedObserver.unobserve(prev.element);
    }

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
        if (item) {
          item.entry = entry;
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

    const viewportTop = container.getBoundingClientRect().top;
    const bestCandidate = this.findBestCandidate(viewportTop);

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
   * Find best item to focus.
   * Priority 1: Items with ≥30% visibility - closest to viewport top
   * Priority 2: Any visible item - closest to viewport top
   */
  private findBestCandidate(viewportTop: number): number | null {
    const candidates: Array<{ index: number; topDistance: number; ratio: number }> = [];

    for (const [index, item] of this.items) {
      if (!item.entry || item.entry.intersectionRatio < this.minVisibleRatio) {
        continue;
      }

      const rect = item.element.getBoundingClientRect();
      candidates.push({
        index,
        topDistance: Math.abs(rect.top - viewportTop),
        ratio: item.entry.intersectionRatio,
      });
    }

    if (candidates.length === 0) return null;

    // Priority 1: High visibility items (≥30%)
    const highVisibility = candidates.filter(c => c.ratio >= DEFAULTS.PRIORITY_VISIBLE_RATIO);
    if (highVisibility.length > 0) {
      highVisibility.sort((a, b) => a.topDistance - b.topDistance);
      return highVisibility[0]!.index;
    }

    // Priority 2: Any visible item
    candidates.sort((a, b) => a.topDistance - b.topDistance);
    return candidates[0]!.index;
  }
}
