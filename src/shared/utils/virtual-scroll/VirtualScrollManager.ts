/**
 * @fileoverview 가상 스크롤링 관리자
 * @description 대용량 리스트의 성능 최적화를 위한 가상 스크롤링 시스템
 */

import { logger } from '@shared/logging';

/**
 * 가상 스크롤 설정
 */
export interface VirtualScrollConfig {
  /** 각 아이템의 높이 (px) */
  itemHeight: number;
  /** 뷰포트 높이 (px) */
  viewportHeight: number;
  /** 렌더링 버퍼 크기 (아이템 개수) */
  bufferSize: number;
  /** 가상 스크롤링 활성화 임계값 */
  threshold?: number;
  /** 가상 스크롤링 전역 활성화 여부 */
  enabled?: boolean;
}

/**
 * 가시 범위 정보
 */
export interface VisibleRange {
  /** 시작 인덱스 */
  start: number;
  /** 끝 인덱스 */
  end: number;
}

/**
 * 렌더링 범위 정보 (버퍼 포함)
 */
export interface RenderRange extends VisibleRange {
  /** 총 높이 */
  totalHeight: number;
  /** 상단 오프셋 */
  offsetTop: number;
}

/**
 * 가상 스크롤링 관리자
 * 대용량 리스트의 성능 최적화를 위한 가상 스크롤링 시스템을 제공합니다.
 */
export class VirtualScrollManager {
  private config: Required<VirtualScrollConfig>;

  constructor(config: VirtualScrollConfig) {
    // 하위 호환성을 위한 containerHeight 처리
    const viewportHeight =
      config.viewportHeight ||
      (config as unknown as { containerHeight?: number }).containerHeight ||
      800;

    this.config = {
      threshold: 50, // 기본값: 50개 이상일 때 가상 스크롤링 활성화
      enabled: true, // 기본값: 활성화
      ...config,
      viewportHeight,
    };

    logger.debug('VirtualScrollManager 초기화', this.config);
  }

  /**
   * 현재 스크롤 위치에서 보이는 아이템 범위 계산
   * @param scrollTop 현재 스크롤 위치
   * @param totalItems 전체 아이템 개수
   * @returns 가시 범위
   */
  getVisibleRange(scrollTop: number, totalItems: number): VisibleRange {
    const { itemHeight, viewportHeight } = this.config;

    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const end = Math.min(start + visibleCount, totalItems);

    const result = {
      start: Math.max(0, start),
      end: Math.max(0, end),
    };

    logger.debug('가시 범위 계산', {
      scrollTop,
      totalItems,
      visibleRange: result,
    });

    return result;
  }

  /**
   * 렌더링할 범위 계산 (버퍼 포함)
   * @param visibleStart 가시 시작 인덱스
   * @param visibleEnd 가시 끝 인덱스
   * @param totalItems 전체 아이템 개수
   * @returns 렌더링 범위
   */
  getRenderRange(visibleStart: number, visibleEnd: number, totalItems?: number): RenderRange {
    const { bufferSize, itemHeight } = this.config;
    const maxItems = totalItems || Number.MAX_SAFE_INTEGER;

    const start = Math.max(0, visibleStart - bufferSize);
    const end = Math.min(maxItems, visibleEnd + bufferSize);

    const result: RenderRange = {
      start,
      end,
      totalHeight: maxItems * itemHeight,
      offsetTop: start * itemHeight,
    };

    logger.debug('렌더링 범위 계산', {
      visible: { start: visibleStart, end: visibleEnd },
      render: result,
    });

    return result;
  }

  /**
   * 가상 스크롤링 사용 여부 결정
   * @param itemCount 아이템 개수
   * @returns 가상 스크롤링 사용 여부
   */
  shouldUseVirtualScrolling(itemCount: number): boolean {
    // 전역 설정에서 비활성화된 경우
    if (!this.config.enabled) {
      logger.debug('가상 스크롤링 비활성화됨 (설정)');
      return false;
    }

    const shouldUse = itemCount >= this.config.threshold;

    logger.debug('가상 스크롤링 사용 여부', {
      itemCount,
      threshold: this.config.threshold,
      enabled: this.config.enabled,
      shouldUse,
    });

    return shouldUse;
  }

  /**
   * 설정 업데이트
   * @param newConfig 새로운 설정
   */
  updateConfig(newConfig: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug('VirtualScrollManager 설정 업데이트', this.config);
  }

  /**
   * 특정 인덱스의 아이템 위치 계산
   * @param index 아이템 인덱스
   * @returns 아이템의 상단 위치 (px)
   */
  getItemOffset(index: number): number {
    return index * this.config.itemHeight;
  }

  /**
   * 특정 위치의 아이템 인덱스 계산
   * @param offset 위치 (px)
   * @returns 아이템 인덱스
   */
  getItemIndex(offset: number): number {
    return Math.floor(offset / this.config.itemHeight);
  }
}
