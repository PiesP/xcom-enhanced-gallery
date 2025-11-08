/**
 * Item Cache Management
 *
 * Unified management of gallery item index, DOM element, and IntersectionObserver state.
 * Provides bidirectional mapping using WeakMap for memory efficiency.
 */

/**
 * Cache entry: Structure to integrate per-item information
 */
export interface ItemEntry {
  /** Item index */
  index: number;
  /** DOM element reference */
  element: HTMLElement | null;
  /** IntersectionObserver entry information */
  entry: IntersectionObserverEntry | null;
  /** Current visibility state */
  isVisible: boolean;
}

/**
 * Item cache manager class
 * Provides index -> ItemEntry map and element -> index reverse mapping (WeakMap)
 */
export class ItemCache {
  /** index -> ItemEntry map */
  private readonly entries: Map<number, ItemEntry> = new Map();

  /** element -> index reverse mapping (WeakMap for memory efficiency) */
  private readonly elementToIndex: WeakMap<HTMLElement, number> = new WeakMap();

  /**
   * Register or update item
   * @param index Item index
   * @param element Item DOM element
   */
  setItem(index: number, element: HTMLElement | null): void {
    if (element) {
      this.elementToIndex.set(element, index);
    }

    const existing = this.entries.get(index);
    if (existing && !element) {
      // When element is null, keep only existing entry information
      return;
    }

    this.entries.set(index, {
      index,
      element,
      entry: existing?.entry ?? null,
      isVisible: existing?.isVisible ?? false,
    });
  }

  /**
   * Update IntersectionObserver entry information
   * @param element Target element
   * @param entry IntersectionObserver entry information
   */
  setEntry(element: HTMLElement, entry: IntersectionObserverEntry): void {
    const index = this.elementToIndex.get(element);
    if (index === undefined) {
      return;
    }

    const item = this.entries.get(index);
    if (!item) {
      return;
    }

    item.entry = entry;
    item.isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
  }

  /**
   * Return array of visible indices
   * @returns Array of item indices currently in visible state
   */
  getVisibleIndices(): number[] {
    const visible: number[] = [];
    this.entries.forEach((item, index) => {
      if (item.isVisible) {
        visible.push(index);
      }
    });
    return visible;
  }

  /**
   * Get ItemEntry for specific index
   */
  getItem(index: number): ItemEntry | undefined {
    return this.entries.get(index);
  }

  /**
   * Query index from specific element
   */
  getIndexByElement(element: HTMLElement): number | undefined {
    return this.elementToIndex.get(element);
  }

  /**
   * Iterate all ItemEntries
   */
  forEach(callback: (item: ItemEntry, index: number) => void): void {
    this.entries.forEach((item, index) => {
      callback(item, index);
    });
  }

  /**
   * Delete item
   */
  deleteItem(index: number): void {
    const item = this.entries.get(index);
    if (item?.element) {
      // WeakMap is automatically cleaned up, so explicit deletion is not necessary
    }
    this.entries.delete(index);
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.entries.clear();
    // WeakMap is automatically cleaned up, so explicit deletion is not necessary
  }

  /**
   * Return cache size
   */
  get size(): number {
    return this.entries.size;
  }
}

/**
 * ItemCache 생성 헬퍼
 */
export function createItemCache(): ItemCache {
  return new ItemCache();
}

/**
 * 가시 비율 계산 헬퍼
 * @param entry IntersectionObserver 진입 정보
 * @param minimumRatio 최소 비율 (기본값 0.05)
 */
export function isItemVisibleEnough(
  entry: IntersectionObserverEntry | null,
  minimumRatio: number = 0.05
): boolean {
  if (!entry?.isIntersecting) return false;
  return entry.intersectionRatio >= minimumRatio;
}

/**
 * 중심 거리 계산 헬퍼 (점수 계산용)
 */
export function calculateCenterDistance(entry: IntersectionObserverEntry): number {
  const { top, height } = entry.boundingClientRect;
  const centerY = top + height / 2;
  const viewportCenter = (window.innerHeight ?? 800) / 2;
  return Math.abs(centerY - viewportCenter);
}
