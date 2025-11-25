/**
 * @fileoverview Focus Coordinator - Natural Scroll-Based Focus Selection
 * @description Selects the most naturally visible gallery item after scroll stops.
 *
 * Selection algorithm (weighted scoring):
 * 1. Screen coverage score (60%): How much of the viewport the item occupies
 * 2. Center proximity score (40%): How close the item center is to viewport center
 *
 * This weighted approach naturally selects items that are both:
 * - Large enough to be the "main" content on screen
 * - Positioned near where the user is looking (center)
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
  // Weights for scoring
  COVERAGE_WEIGHT: 0.6,
  CENTER_WEIGHT: 0.4,
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

    const containerRect = container.getBoundingClientRect();
    const bestCandidate = this.findBestCandidate(containerRect);

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
   * Find best item to focus using weighted scoring.
   *
   * Algorithm:
   * 1. Calculate screen coverage (0-1): intersection height / viewport height
   * 2. Calculate center proximity (0-1): 1 - (distance from center / max distance)
   * 3. Combined score = coverage * 0.6 + proximity * 0.4
   *
   * This naturally prefers items that occupy more screen space
   * while also considering viewport center positioning.
   */
  private findBestCandidate(containerRect: DOMRect): number | null {
    const viewportHeight = containerRect.height;
    const viewportCenter = containerRect.top + viewportHeight / 2;
    const maxCenterDistance = viewportHeight / 2;

    type Candidate = { index: number; score: number; coverage: number };
    const candidates: Candidate[] = [];

    for (const [index, item] of this.items) {
      if (!item.isVisible) continue;

      const rect = item.element.getBoundingClientRect();

      // Calculate vertical intersection with container
      const intersectionTop = Math.max(rect.top, containerRect.top);
      const intersectionBottom = Math.min(rect.bottom, containerRect.bottom);
      const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);

      if (intersectionHeight === 0) continue;

      // Screen coverage score (0-1)
      const coverage = Math.min(intersectionHeight / viewportHeight, 1);
      if (coverage < this.minVisibleRatio) continue;

      // Center proximity score (0-1)
      // Calculate distance from item's visible center to viewport center
      const visibleCenter = intersectionTop + intersectionHeight / 2;
      const centerDistance = Math.abs(visibleCenter - viewportCenter);
      const centerProximity = 1 - Math.min(centerDistance / maxCenterDistance, 1);

      // Combined weighted score
      const score = coverage * DEFAULTS.COVERAGE_WEIGHT + centerProximity * DEFAULTS.CENTER_WEIGHT;

      candidates.push({ index, score, coverage });
    }

    if (candidates.length === 0) return null;

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    return candidates[0]!.index;
  }
}
