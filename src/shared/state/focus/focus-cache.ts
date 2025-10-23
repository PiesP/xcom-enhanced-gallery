/**
 * Phase 150.2 Step 2: Cache layer 통합
 *
 * 목표: visibleIndices, itemIndexToKey, keyToItemIndex 3개 상태 → 1개 구조로 통합
 * 67% 상태 감소 목표
 */

/**
 * ItemEntry: Item 별 캐시 정보를 통합하는 구조
 * - index: 아이템의 인덱스 (Map key)
 * - element: 아이템 DOM 요소 참조
 * - entry: IntersectionObserver 진입 정보 캐시
 * - isVisible: 현재 가시 여부
 */
export interface ItemEntry {
  /** 아이템 인덱스 */
  index: number;
  /** DOM 요소 참조 */
  element: HTMLElement | null;
  /** IntersectionObserver 진입 정보 (최신) */
  entry: IntersectionObserverEntry | null;
  /** 현재 가시 여부 (derived) */
  isVisible: boolean;
}

/**
 * ItemCache: Map 기반 캐시 관리
 * - index -> ItemEntry 단일 Map으로 통합
 * - 역 매핑(element -> index)은 WeakMap 유지 (GC 효율성)
 */
export class ItemCache {
  /** index -> ItemEntry 맵 */
  private readonly entries: Map<number, ItemEntry> = new Map();

  /** element -> index 역 매핑 (WeakMap으로 메모리 효율성) */
  private readonly elementToIndex: WeakMap<HTMLElement, number> = new WeakMap();

  /**
   * 아이템 등록 또는 업데이트
   * @param index 아이템 인덱스
   * @param element 아이템 DOM 요소
   */
  setItem(index: number, element: HTMLElement | null): void {
    if (element) {
      this.elementToIndex.set(element, index);
    }

    const existing = this.entries.get(index);
    if (existing && !element) {
      // element가 null인 경우는 기존 진입 정보만 유지
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
   * IntersectionObserver 진입 정보 업데이트
   * @param element 대상 요소
   * @param entry IntersectionObserver 진입 정보
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
   * 가시 인덱스 배열 반환
   * @returns 현재 가시 상태의 아이템 인덱스 배열
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
   * 특정 인덱스의 ItemEntry 반환
   */
  getItem(index: number): ItemEntry | undefined {
    return this.entries.get(index);
  }

  /**
   * 특정 요소로부터 인덱스 조회
   */
  getIndexByElement(element: HTMLElement): number | undefined {
    return this.elementToIndex.get(element);
  }

  /**
   * 모든 ItemEntry 반복
   */
  forEach(callback: (item: ItemEntry, index: number) => void): void {
    this.entries.forEach((item, index) => {
      callback(item, index);
    });
  }

  /**
   * 아이템 제거
   */
  deleteItem(index: number): void {
    const item = this.entries.get(index);
    if (item?.element) {
      // WeakMap은 자동 정리되므로 명시적 삭제 불필요
    }
    this.entries.delete(index);
  }

  /**
   * 모든 아이템 정리
   */
  clear(): void {
    this.entries.clear();
    // WeakMap은 자동 정리되므로 명시적 삭제 불필요
  }

  /**
   * 캐시 크기 반환
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
