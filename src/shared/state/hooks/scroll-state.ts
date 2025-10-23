/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 통합 스크롤 상태 인터페이스
 * @description Gallery Hook 상태 정규화 (Phase 153)에 따른 통합 State
 */

/**
 * 스크롤 방향 타입
 */
export type ScrollDirection = 'up' | 'down' | 'idle';

/**
 * 통합 스크롤 상태
 *
 * Phase 153: 3개 분산 Signal (isScrolling, lastScrollTime, scrollDirection)
 * → 1개 통합 Signal로 정규화
 *
 * 장점:
 * - 상태 관리 일관성 증대
 * - 배치 업데이트로 성능 개선
 * - 타입 안전성 향상
 */
export interface ScrollState {
  /** 현재 스크롤 중인지 여부 */
  isScrolling: boolean;

  /** 마지막 스크롤 이벤트 발생 시간 (ms) */
  lastScrollTime: number;

  /** 현재 스크롤 방향 */
  direction: ScrollDirection;

  /** 마지막 스크롤 델타값 (진행 중인 스크롤 활동 추적용) */
  lastDelta: number;
}

/**
 * 초기 스크롤 상태
 */
export const INITIAL_SCROLL_STATE: ScrollState = {
  isScrolling: false,
  lastScrollTime: 0,
  direction: 'idle',
  lastDelta: 0,
};
