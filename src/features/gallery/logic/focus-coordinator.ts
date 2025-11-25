/**
 * @fileoverview Focus Coordinator - Natural Scroll-Based Focus Selection
 * @description Selects the most naturally visible gallery item after scroll stops.
 */

import { SharedObserver } from '@shared/utils/performance/observer-pool';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { clamp01 } from '@shared/utils/types/safety';
import type { Accessor } from 'solid-js';

export interface FocusCoordinatorOptions {
  isEnabled: Accessor<boolean>;
  container: Accessor<HTMLElement | null>;
  onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
  threshold?: number | number[];
  rootMargin?: string;
  minimumVisibleRatio?: number;
  debounceTime?: number;
}

interface TrackedItem {
  element: HTMLElement;
  isVisible: boolean;
  entry?: IntersectionObserverEntry;
}

interface FocusCandidate {
  index: number;
  score: number;
}

const DEFAULTS = {
  THRESHOLD: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  ROOT_MARGIN: '0px',
  MIN_VISIBLE_RATIO: 0.05,
  DEBOUNCE_TIME: 50,
  STICKY_SCORE_DELTA: 0.08,
} as const;

export class FocusCoordinator {
  private readonly items = new Map<number, TrackedItem>();
  private debounceTimerId: number | null = null;
  private readonly minVisibleRatio: number;
  private readonly debounceTime: number;
  private readonly observerOptions: { threshold: number | number[]; rootMargin: string };
  private lastAutoFocus: FocusCandidate | null = null;

  constructor(private readonly options: FocusCoordinatorOptions) {
    this.minVisibleRatio = options.minimumVisibleRatio ?? DEFAULTS.MIN_VISIBLE_RATIO;
    this.debounceTime = options.debounceTime ?? DEFAULTS.DEBOUNCE_TIME;
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

  recompute(): void {
    this.performRecomputation(false);
  }

  forceRecompute(): void {
    if (this.debounceTimerId !== null) {
      globalTimerManager.clearTimeout(this.debounceTimerId);
      this.debounceTimerId = null;
    }
    this.performRecomputation(true);
  }

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

  private scheduleRecompute(): void {
    if (this.debounceTimerId !== null) {
      globalTimerManager.clearTimeout(this.debounceTimerId);
    }
    this.debounceTimerId = globalTimerManager.setTimeout(() => {
      this.debounceTimerId = null;
      this.performRecomputation(false);
    }, this.debounceTime);
  }

  private performRecomputation(ignoreHysteresis: boolean): void {
    if (!this.options.isEnabled()) return;

    const container = this.options.container();
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const selection = this.selectBestCandidate(containerRect, ignoreHysteresis);

    if (!selection) return;

    const hasChanged = this.lastAutoFocus?.index !== selection.index;
    this.lastAutoFocus = selection;

    if (hasChanged) {
      this.options.onFocusChange(selection.index, 'auto');
    }
  }

  private selectBestCandidate(
    containerRect: DOMRect,
    ignoreHysteresis: boolean,
  ): FocusCandidate | null {
    const viewportHeight = Math.max(containerRect.height, 1);
    const viewportCenter = containerRect.top + viewportHeight / 2;
    const candidates: FocusCandidate[] = [];

    for (const [index, item] of this.items) {
      if (!item.isVisible) continue;

      const rect = item.element.getBoundingClientRect();
      const intersectionTop = Math.max(rect.top, containerRect.top);
      const intersectionBottom = Math.min(rect.bottom, containerRect.bottom);
      const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);

      if (intersectionHeight === 0) continue;

      const viewportCoverage = intersectionHeight / viewportHeight;
      if (viewportCoverage < this.minVisibleRatio) continue;

      // Calculate score
      // 1. Center Proximity (0-1): How close is the item center to viewport center?
      const itemCenter = rect.top + rect.height / 2;
      const distToCenter = Math.abs(itemCenter - viewportCenter);
      // Normalize distance: 0 at center, 1 at (viewportHeight/2 + itemHeight/2)
      const maxDist = viewportHeight / 2 + rect.height / 2;
      const centerProximity = clamp01(1 - distToCenter / maxDist);

      // 2. Element Visibility (0-1): How much of the element is visible?
      const elementVisibility = clamp01(intersectionHeight / rect.height);

      // 3. Viewport Dominance (0-1): How much of the viewport does it occupy?
      const viewportDominance = clamp01(intersectionHeight / viewportHeight);

      // Weighted Score
      // Prioritize center proximity heavily for gallery feel
      const score = centerProximity * 0.5 + elementVisibility * 0.3 + viewportDominance * 0.2;

      candidates.push({ index, score });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0]!;

    // Hysteresis: stick to current focus if score difference is small
    if (!ignoreHysteresis && this.lastAutoFocus && this.lastAutoFocus.index !== best.index) {
      const prev = this.items.get(this.lastAutoFocus.index);
      if (prev?.isVisible) {
        const prevCandidate = candidates.find(c => c.index === this.lastAutoFocus!.index);
        if (prevCandidate && best.score - prevCandidate.score < DEFAULTS.STICKY_SCORE_DELTA) {
          return prevCandidate;
        }
      }
    }

    return best;
  }
}
