export interface ItemEntry {
  index: number;
  element: HTMLElement | null;
  entry: IntersectionObserverEntry | null;
  isVisible: boolean;
}

export class ItemCache {
  private readonly entries: Map<number, ItemEntry> = new Map();
  private readonly elementToIndex: WeakMap<HTMLElement, number> = new WeakMap();
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

  getVisibleIndices(): number[] {
    const visible: number[] = [];
    this.entries.forEach((item, index) => {
      if (item.isVisible) {
        visible.push(index);
      }
    });
    return visible;
  }

  getItem(index: number): ItemEntry | undefined {
    return this.entries.get(index);
  }

  getIndexByElement(element: HTMLElement): number | undefined {
    return this.elementToIndex.get(element);
  }

  forEach(callback: (item: ItemEntry, index: number) => void): void {
    this.entries.forEach((item, index) => {
      callback(item, index);
    });
  }

  deleteItem(index: number): void {
    const item = this.entries.get(index);
    if (item?.element) {
      // WeakMap is automatically cleaned up, so explicit deletion is not necessary
    }
    this.entries.delete(index);
  }

  clear(): void {
    this.entries.clear();
    // WeakMap is automatically cleaned up, so explicit deletion is not necessary
  }

  get size(): number {
    return this.entries.size;
  }
}

export function createItemCache(): ItemCache {
  return new ItemCache();
}

export function isItemVisibleEnough(
  entry: IntersectionObserverEntry | null,
  minimumRatio: number = 0.05
): boolean {
  if (!entry?.isIntersecting) return false;
  return entry.intersectionRatio >= minimumRatio;
}

export function calculateTopDistance(entry: IntersectionObserverEntry): number {
  const visibleTop = entry.intersectionRect?.top ?? entry.boundingClientRect.top;
  return Math.abs(visibleTop);
}
