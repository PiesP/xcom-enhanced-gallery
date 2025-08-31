/**
 * 가상 스크롤링 컴포넌트
 * 대량의 데이터를 효율적으로 렌더링하기 위한 가상화 구현
 */

export interface VirtualScrollOptions {
  containerHeight: number;
  itemHeight: number;
  overscan?: number; // 추가로 렌더링할 아이템 수
  scrollThreshold?: number; // 스크롤 임계값
}

export interface VirtualScrollItem {
  index: number;
  top: number;
  height: number;
  visible: boolean;
}

export interface VirtualScrollState {
  scrollTop: number;
  visibleStart: number;
  visibleEnd: number;
  totalHeight: number;
  items: VirtualScrollItem[];
}

/**
 * 가상 스크롤링 상태 관리 클래스
 */
export class VirtualScroll {
  private readonly options: Required<VirtualScrollOptions>;
  private readonly state: VirtualScrollState;
  private itemCount: number = 0;

  constructor(options: VirtualScrollOptions) {
    this.options = {
      overscan: 5,
      scrollThreshold: 10,
      ...options,
    };

    this.state = {
      scrollTop: 0,
      visibleStart: 0,
      visibleEnd: 0,
      totalHeight: 0,
      items: [],
    };
  }

  /**
   * 아이템 개수 설정
   */
  setItemCount(count: number): void {
    this.itemCount = count;
    this.state.totalHeight = count * this.options.itemHeight;
    this.updateVisibleRange();
  }

  /**
   * 스크롤 위치 업데이트
   */
  updateScrollTop(scrollTop: number): void {
    if (Math.abs(this.state.scrollTop - scrollTop) < this.options.scrollThreshold) {
      return;
    }

    this.state.scrollTop = scrollTop;
    this.updateVisibleRange();
  }

  /**
   * 현재 상태 반환
   */
  getState(): Readonly<VirtualScrollState> {
    return { ...this.state };
  }

  /**
   * 보이는 범위 계산 및 업데이트
   */
  private updateVisibleRange(): void {
    const { containerHeight, itemHeight, overscan } = this.options;
    const { scrollTop } = this.state;

    // 보이는 첫 번째 아이템 인덱스
    const startIndex = Math.floor(scrollTop / itemHeight);

    // 보이는 마지막 아이템 인덱스
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      this.itemCount - 1
    );

    // overscan을 고려한 실제 렌더링 범위
    this.state.visibleStart = Math.max(0, startIndex - overscan);
    this.state.visibleEnd = Math.min(this.itemCount - 1, endIndex + overscan);

    // 보이는 아이템들 생성
    this.state.items = this.generateVisibleItems();
  }

  /**
   * 보이는 아이템 목록 생성
   */
  private generateVisibleItems(): VirtualScrollItem[] {
    const items: VirtualScrollItem[] = [];
    const { visibleStart, visibleEnd } = this.state;
    const { itemHeight } = this.options;

    for (let i = visibleStart; i <= visibleEnd; i++) {
      items.push({
        index: i,
        top: i * itemHeight,
        height: itemHeight,
        visible: true,
      });
    }

    return items;
  }

  /**
   * 특정 인덱스로 스크롤
   */
  scrollToIndex(index: number): number {
    const targetScrollTop = index * this.options.itemHeight;
    this.updateScrollTop(targetScrollTop);
    return targetScrollTop;
  }

  /**
   * 컨테이너 크기 변경 처리
   */
  updateContainerHeight(height: number): void {
    this.options.containerHeight = height;
    this.updateVisibleRange();
  }

  /**
   * 아이템 높이 변경 처리
   */
  updateItemHeight(height: number): void {
    this.options.itemHeight = height;
    this.state.totalHeight = this.itemCount * height;
    this.updateVisibleRange();
  }

  /**
   * 메모리 정리
   */
  dispose(): void {
    this.state.items = [];
    this.itemCount = 0;
  }
}

/**
 * 가상 스크롤링 훅 인터페이스
 */
export interface VirtualScrollHook {
  state: VirtualScrollState;
  scrollToIndex: (index: number) => void;
  updateScrollTop: (scrollTop: number) => void;
  setItemCount: (count: number) => void;
}

/**
 * 글로벌 가상 스크롤 인스턴스
 */
let globalVirtualScroll: VirtualScroll | null = null;

/**
 * 가상 스크롤 인스턴스 생성/반환
 */
export function createVirtualScroll(options: VirtualScrollOptions): VirtualScroll {
  return new VirtualScroll(options);
}

/**
 * 글로벌 가상 스크롤 인스턴스 초기화
 */
export function initializeGlobalVirtualScroll(options: VirtualScrollOptions): VirtualScroll {
  globalVirtualScroll = new VirtualScroll(options);
  return globalVirtualScroll;
}

/**
 * 글로벌 가상 스크롤 인스턴스 반환
 */
export function getGlobalVirtualScroll(): VirtualScroll | null {
  return globalVirtualScroll;
}

/**
 * 가상 스크롤 정리
 */
export function cleanupVirtualScroll(): void {
  if (globalVirtualScroll) {
    globalVirtualScroll.dispose();
    globalVirtualScroll = null;
  }
}
