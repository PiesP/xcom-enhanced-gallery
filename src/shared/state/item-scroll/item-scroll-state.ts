/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Management
 * @description 갤러리 아이템 스크롤 상태를 shared/state로 정규화한 모듈
 */

/**
 * 갤러리 아이템 스크롤 상태 타입 정의
 */
export interface ItemScrollState {
  /** 마지막으로 스크롤된 아이템 인덱스 */
  lastScrolledIndex: number;
  /** 대기 중인 스크롤 인덱스 */
  pendingIndex: number | null;
  /** 사용자가 수동으로 스크롤 중인지 여부 */
  userScrollDetected: boolean;
  /** 자동 스크롤 중인지 여부 (scroll 애니메이션 진행 중) */
  isAutoScrolling: boolean;
  /** 마지막 스크롤 시간 (타임아웃 추적용) */
  lastScrollTime: number;
  /** 마지막 사용자 스크롤 시간 */
  lastUserScrollTime: number;
  /** Retry count (on scroll failure) */
  retryCount: number;
  /** 스크롤 타임아웃 ID */
  scrollTimeoutId: number | null;
  /** 사용자 스크롤 타임아웃 ID */
  userScrollTimeoutId: number | null;
  /** 인덱스 감시 타이머 ID */
  indexWatcherId: number | null;
}

/**
 * 초기 상태 값
 */
export const INITIAL_ITEM_SCROLL_STATE: ItemScrollState = {
  lastScrolledIndex: -1,
  pendingIndex: null,
  userScrollDetected: false,
  isAutoScrolling: false,
  lastScrollTime: 0,
  lastUserScrollTime: 0,
  retryCount: 0,
  scrollTimeoutId: null,
  userScrollTimeoutId: null,
  indexWatcherId: null,
};

/**
 * ItemScrollState 생성 헬퍼 함수
 * @param overrides - 초기값에서 오버라이드할 속성들
 * @returns 생성된 ItemScrollState
 */
export function createItemScrollState(overrides?: Partial<ItemScrollState>): ItemScrollState {
  return {
    ...INITIAL_ITEM_SCROLL_STATE,
    ...overrides,
  };
}

/**
 * ItemScrollState 업데이트 헬퍼 함수
 * @param state - 현재 상태
 * @param updates - 업데이트할 속성들
 * @returns 업데이트된 새로운 상태
 */
export function updateItemScrollState(
  state: ItemScrollState,
  updates: Partial<ItemScrollState>
): ItemScrollState {
  return {
    ...state,
    ...updates,
  };
}

/**
 * ItemScrollState 초기화 함수 (정리용)
 * @param _state - 현재 상태
 * @returns 초기화된 상태
 */
export function resetItemScrollState(_state: ItemScrollState): ItemScrollState {
  return INITIAL_ITEM_SCROLL_STATE;
}

/**
 * 타임아웃 ID 정리 함수
 * @param state - 현재 상태
 * @returns 타임아웃이 정리된 상태
 */
export function clearItemScrollTimeouts(state: ItemScrollState): ItemScrollState {
  return {
    ...state,
    scrollTimeoutId: null,
    userScrollTimeoutId: null,
    indexWatcherId: null,
  };
}

/**
 * 상태 동일성 검사 함수
 * @param stateA - 비교할 상태 A
 * @param stateB - 비교할 상태 B
 * @returns 두 상태가 동일한지 여부
 */
export function isSameItemScrollState(stateA: ItemScrollState, stateB: ItemScrollState): boolean {
  return (
    stateA.lastScrolledIndex === stateB.lastScrolledIndex &&
    stateA.pendingIndex === stateB.pendingIndex &&
    stateA.userScrollDetected === stateB.userScrollDetected &&
    stateA.isAutoScrolling === stateB.isAutoScrolling &&
    stateA.retryCount === stateB.retryCount
  );
}
