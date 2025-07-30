/**
 * @fileoverview 간단한 스크롤 헬퍼
 * @description 유저스크립트에 적합한 기본적인 스크롤 관리 기능
 * @version 1.0.0 - Phase C2: 단순화
 */

import { logger } from '@shared/logging';

/**
 * 기본 스크롤 설정
 */
export interface SimpleScrollConfig {
  /** 각 아이템의 높이 (px) */
  itemHeight: number;
  /** 뷰포트 높이 (px) */
  viewportHeight: number;
  /** 표시할 추가 아이템 수 */
  bufferSize?: number;
  /** 가상 스크롤링 활성화 임계값 */
  threshold?: number;
  /** 가상 스크롤링 전역 활성화 여부 */
  enabled?: boolean;
}

/**
 * 표시 범위 정보
 */
export interface ScrollVisibleRange {
  start: number;
  end: number;
}

/**
 * 렌더링 범위 정보
 */
export interface ScrollRenderRange extends ScrollVisibleRange {
  totalHeight: number;
  offsetTop: number;
}

/**
 * 간단한 스크롤 헬퍼
 */
export class ScrollHelper {
  private config: Required<SimpleScrollConfig>;

  constructor(config: SimpleScrollConfig) {
    this.config = {
      bufferSize: 5,
      threshold: 50,
      enabled: true,
      ...config,
    };

    logger.debug('ScrollHelper 초기화', this.config);
  }

  /**
   * 현재 보이는 아이템 범위 계산
   */
  getVisibleRange(scrollTop: number, totalItems: number): ScrollVisibleRange {
    const { itemHeight, viewportHeight } = this.config;

    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const end = Math.min(start + visibleCount, totalItems);

    return { start: Math.max(0, start), end: Math.max(0, end) };
  }

  /**
   * 렌더링 범위 계산 (버퍼 포함)
   */
  getRenderRange(scrollTop: number, totalItems: number): ScrollRenderRange {
    const { bufferSize, itemHeight } = this.config;
    const visible = this.getVisibleRange(scrollTop, totalItems);

    const start = Math.max(0, visible.start - bufferSize);
    const end = Math.min(totalItems, visible.end + bufferSize);
    const offsetTop = start * itemHeight;
    const totalHeight = totalItems * itemHeight;

    return { start, end, totalHeight, offsetTop };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<SimpleScrollConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('ScrollHelper 설정 업데이트', this.config);
  }

  /**
   * 전체 높이 계산
   */
  getTotalHeight(totalItems: number): number {
    return totalItems * this.config.itemHeight;
  }

  /**
   * 스크롤 위치로 아이템 인덱스 계산
   */
  getItemIndex(scrollTop: number): number {
    return Math.floor(scrollTop / this.config.itemHeight);
  }

  /**
   * 아이템 인덱스로 스크롤 위치 계산
   */
  getScrollPosition(itemIndex: number): number {
    return itemIndex * this.config.itemHeight;
  }

  /**
   * 가상 스크롤링 사용 여부 결정
   */
  shouldUseVirtualScrolling(itemCount: number): boolean {
    return this.config.enabled && itemCount >= this.config.threshold;
  }
}

// 하위 호환성을 위한 별칭
export { ScrollHelper as VirtualScrollManager };
export type { SimpleScrollConfig as VirtualScrollConfig };

// 기존 타입과 호환성을 위한 별칭
export type VisibleRange = ScrollVisibleRange;
export type RenderRange = ScrollRenderRange;
