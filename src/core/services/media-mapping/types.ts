/**
 * @fileoverview Media Mapping Strategy Interface
 * @description 미디어 매핑 전략의 공통 인터페이스 정의
 */

import type { MediaMapping, MediaPageType } from '@core/types/media.types';

/**
 * 미디어 매핑 전략 인터페이스
 */
export interface MediaMappingStrategy {
  /** 전략의 고유 이름 */
  readonly name: string;

  /** 우선순위 (낮을수록 먼저 실행) */
  readonly priority: number;

  /**
   * 미디어 매핑 실행
   * @param clickedElement 클릭된 요소
   * @param pageType 페이지 타입
   * @returns 매핑 결과 또는 null
   */
  execute(clickedElement: HTMLElement, pageType: MediaPageType): Promise<MediaMapping | null>;
}

/**
 * 전략 메트릭스
 */
export interface StrategyMetrics {
  successRate: number;
  avgProcessingTime: number;
  lastUsed: number;
  priority: number;
}

/**
 * 매핑 캐시 엔트리
 */
export interface MappingCacheEntry {
  result: MediaMapping;
  timestamp: number;
}
