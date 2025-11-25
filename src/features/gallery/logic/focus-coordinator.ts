/**
 * @fileoverview Focus Coordinator - Natural Scroll-Based Focus Selection
 * @description Selects the most naturally visible gallery item after scroll stops.
 *
 * Selection algorithm (weighted heuristics):
 * 1. Viewport coverage: How much of the visible viewport the item currently occupies
 * 2. Element visibility: How much of the media itself is visible (guards tall crops)
 * 3. Center proximity + focus band overlap: Prefers media intersecting the central viewing lane
 * 4. Center-line anchor bonus: Keeps items straddling the exact center sticky when scores are close
 */

import { SharedObserver } from '@shared/utils/performance/observer-pool';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { clamp01 } from '@shared/utils/types/safety';
import type { Accessor } from 'solid-js';

import { scoreFocusCandidate } from './focus-score';
import type { FocusScoreResult } from './focus-score';

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
  FOCUS_ZONE_TOP_RATIO: 0.35,
  FOCUS_ZONE_BOTTOM_RATIO: 0.65,
  STICKY_SCORE_DELTA: 0.08,
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
  private lastAutoFocus: FocusScoreResult | null = null;

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
      if (this.lastAutoFocus?.index === index) {
        this.lastAutoFocus = null;
      }
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
    const selection = this.selectBestCandidate(containerRect);

    if (!selection) {
      return;
    }

    const hasChanged = this.lastAutoFocus?.index !== selection.index;
    this.lastAutoFocus = selection;

    if (hasChanged) {
      this.options.onFocusChange(selection.index, 'auto');
    }
  }

  /** Cleanup observers and timers */
  cleanup(): void {
    for (const item of this.items.values()) {
      SharedObserver.unobserve(item.element);
    }
    this.items.clear();
    this.lastAutoFocus = null;

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

  /** Select best candidate using weighted scoring with hysteresis */
  private selectBestCandidate(containerRect: DOMRect): FocusScoreResult | null {
    const viewportHeight = Math.max(containerRect.height, 1);
    const viewportTop = containerRect.top;
    const viewportCenter = viewportTop + viewportHeight / 2;

    const focusBandTop = viewportTop + viewportHeight * DEFAULTS.FOCUS_ZONE_TOP_RATIO;
    const focusBandBottom = viewportTop + viewportHeight * DEFAULTS.FOCUS_ZONE_BOTTOM_RATIO;
    const focusBandHeight = focusBandBottom - focusBandTop;
    const maxCenterDistance = viewportHeight / 2;

    const candidates: FocusScoreResult[] = [];

    for (const [index, item] of this.items) {
      if (!item.isVisible) continue;

      const rect = item.element.getBoundingClientRect();
      const intersectionTop = Math.max(rect.top, viewportTop);
      const intersectionBottom = Math.min(rect.bottom, containerRect.bottom);
      const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);

      if (intersectionHeight === 0) continue;

      const viewportCoverage = intersectionHeight / viewportHeight;
      if (viewportCoverage < this.minVisibleRatio) continue;

      const sourceHeight =
        rect.height || item.entry?.boundingClientRect?.height || intersectionHeight || 1;
      const elementVisibility = clamp01(
        item.entry?.intersectionRatio ?? intersectionHeight / sourceHeight,
      );

      const visibleCenter = intersectionTop + intersectionHeight / 2;
      const centerProximity = 1 - Math.abs(visibleCenter - viewportCenter) / maxCenterDistance;

      const focusBandOverlap = Math.max(
        0,
        Math.min(intersectionBottom, focusBandBottom) - Math.max(intersectionTop, focusBandTop),
      );
      const focusBandCoverage = focusBandOverlap / focusBandHeight;

      const intersectsCenterLine = rect.top <= viewportCenter && rect.bottom >= viewportCenter;

      const candidate = scoreFocusCandidate({
        index,
        viewportCoverage,
        elementVisibility,
        centerProximity,
        focusBandCoverage,
        intersectsCenterLine,
      });

      candidates.push(candidate);
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0]!;

    // Apply hysteresis: keep previous focus if score delta is small
    if (this.lastAutoFocus && this.lastAutoFocus.index !== best.index) {
      const prev = this.items.get(this.lastAutoFocus.index);
      if (prev?.isVisible && best.score - this.lastAutoFocus.score < DEFAULTS.STICKY_SCORE_DELTA) {
        return this.lastAutoFocus;
      }
    }

    return best;
  }
}
