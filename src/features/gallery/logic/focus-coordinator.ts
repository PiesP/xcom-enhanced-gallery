import { SharedObserver } from '@shared/utils/performance/observer-pool';
import type { Accessor } from 'solid-js';

export interface FocusCoordinatorOptions {
  isEnabled: Accessor<boolean>;
  threshold?: number | number[];
  rootMargin?: string;
  minimumVisibleRatio?: number;
  container: Accessor<HTMLElement | null>;
  debounceTime?: number;
  onFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
}

export class FocusCoordinator {
  private items = new Map<number, { element: HTMLElement; entry?: IntersectionObserverEntry }>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private options: FocusCoordinatorOptions) {}

  registerItem(index: number, element: HTMLElement | null) {
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
      {
        threshold: this.options.threshold ?? 0,
        rootMargin: this.options.rootMargin || '0px',
      },
    );
  }

  private scheduleRecompute() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const delay = this.options.debounceTime ?? 50;
    this.debounceTimer = setTimeout(() => this.recompute(), delay);
  }

  public recompute() {
    if (!this.options.isEnabled()) return;

    const container = this.options.container();
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    const minRatio = this.options.minimumVisibleRatio || 0.05;

    let bestCandidate: {
      index: number;
      distance: number;
      ratio: number;
    } | null = null;

    for (const [index, item] of this.items) {
      if (!item.entry || item.entry.intersectionRatio < minRatio) continue;

      // Phase 430: Use fresh rect for accurate position during scroll
      // entry.boundingClientRect is stale (snapshot at intersection time)
      const rect = item.element.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - containerCenter);
      const ratio = item.entry.intersectionRatio;

      if (
        !bestCandidate ||
        distance < bestCandidate.distance ||
        (distance === bestCandidate.distance && ratio > bestCandidate.ratio)
      ) {
        bestCandidate = { index, distance, ratio };
      }
    }

    if (bestCandidate) {
      this.options.onFocusChange(bestCandidate.index, 'auto');
    }
  }

  cleanup() {
    this.items.forEach(i => SharedObserver.unobserve(i.element));
    this.items.clear();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
