/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Type Definitions
 * @description Phase 150.2: 아이템 스크롤 상태 정규화
 *
 * 갤러리의 개별 아이템 스크롤(예: 특정 아이템으로 스크롤 이동)을
 * 정규화하는 상태 모듈입니다.
 *
 * 주요 추적 항목:
 * - 마지막으로 스크롤된 아이템 인덱스
 * - 대기 중인 스크롤 요청 (pendingIndex)
 * - 사용자 vs 자동 스크롤 구분
 * - 스크롤 실패 재시도 횟수
 * - 타이머 ID (정리 목적)
 */

/**
 * 아이템 스크롤 상태 인터페이스
 *
 * 갤러리의 개별 아이템으로 스크롤 이동 상태를 추적합니다.
 * 사용자 주도 vs 자동(포커스 변경) 스크롤을 구분 관리합니다.
 */
export interface ItemScrollState {
  /**
   * 마지막으로 스크롤된 아이템 인덱스 (0 이상)
   * -1이면 스크롤 이력 없음
   */
  lastScrolledIndex: number;

  /**
   * 대기 중인 스크롤 인덱스
   * 이전 스크롤이 완료되지 않았을 때 보류되는 다음 스크롤 대상
   */
  pendingIndex: number | null;

  /**
   * 사용자가 수동으로 스크롤 중인지 여부
   * true면 사용자 입력으로 스크롤 중 (wheelEvent 등)
   */
  userScrollDetected: boolean;

  /**
   * 자동 스크롤(포커스 변경 기반) 애니메이션 진행 중 여부
   * true면 scrollIntoView() 애니메이션 진행 중
   */
  isAutoScrolling: boolean;

  /**
   * 마지막 스크롤 이벤트 발생 시간 (Unix ms)
   * 타임아웃 추적 및 스크롤 완료 대기용
   */
  lastScrollTime: number;

  /**
   * 마지막 사용자 스크롤(wheel) 시간 (Unix ms)
   * 사용자 상호작용 감지 및 자동 스크롤 재개 판단용
   */
  lastUserScrollTime: number;

  /**
   * 스크롤 실패 재시도 횟수
   * scrollIntoView() 실패 시 증가, 일정 횟수 초과 시 포기
   */
  retryCount: number;

  /**
   * 스크롤 타임아웃 ID (정리용)
   * 컴포넌트 언마운트 시 이 타이머를 정리해야 함
   */
  scrollTimeoutId: number | null;

  /**
   * 사용자 스크롤 타임아웃 ID (정리용)
   * 사용자 스크롤 감지 후 복구 타이머 정리용
   */
  userScrollTimeoutId: number | null;

  /**
   * 인덱스 감시 타이머 ID (정리용)
   * 스크롤 중 아이템 인덱스 모니터링 타이머 정리용
   */
  indexWatcherId: number | null;
}

/* ============================================================================
 * Constants
 * ============================================================================ */

/**
 * 초기 아이템 스크롤 상태
 * - 스크롤 이력 없음 (lastScrolledIndex: -1)
 * - 대기 요청 없음
 * - 사용자/자동 스크롤 미진행
 * - 재시도 횟수 0
 * - 모든 타이머 ID 초기화
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

/* ============================================================================
 * Factories
 * ============================================================================ */

/**
 * 아이템 스크롤 상태 생성 팩토리
 *
 * 초기 상태에서 선택적 속성만 오버라이드합니다.
 *
 * @param overrides - 초기값에서 덮어쓸 속성 (선택사항)
 * @returns 생성된 ItemScrollState 객체
 *
 * @example
 * const state = createItemScrollState({ lastScrolledIndex: 5 });
 */
export function createItemScrollState(overrides?: Partial<ItemScrollState>): ItemScrollState {
  return {
    ...INITIAL_ITEM_SCROLL_STATE,
    ...overrides,
  };
}

/* ============================================================================
 * Updaters
 * ============================================================================ */

/**
 * 아이템 스크롤 상태 업데이트
 *
 * 현재 상태에서 선택적 속성만 업데이트합니다.
 *
 * @param state - 현재 상태
 * @param updates - 업데이트할 속성
 * @returns 업데이트된 새로운 ItemScrollState 객체
 *
 * @example
 * const newState = updateItemScrollState(state, { lastScrolledIndex: 10 });
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
 * 아이템 스크롤 상태 초기화
 *
 * 상태를 초기값으로 완전히 리셋합니다 (정리/재시작 목적).
 *
 * @param _state - 현재 상태 (사용하지 않음, 호환성용)
 * @returns 초기화된 ItemScrollState 객체
 */
export function resetItemScrollState(_state: ItemScrollState): ItemScrollState {
  return INITIAL_ITEM_SCROLL_STATE;
}

/**
 * 스크롤 타이머 ID 정리
 *
 * 컴포넌트 언마운트 또는 정리 시 모든 타이머를 null로 설정합니다.
 * 실제 타이머 정리는 호출자가 담당해야 함 (clearTimeout 등).
 *
 * @param state - 현재 상태
 * @returns 타이머 ID가 정리된 ItemScrollState 객체
 *
 * @example
 * const cleanedState = clearItemScrollTimeouts(state);
 * // 그 후 필요하면:
 * if (state.scrollTimeoutId) clearTimeout(state.scrollTimeoutId);
 */
export function clearItemScrollTimeouts(state: ItemScrollState): ItemScrollState {
  return {
    ...state,
    scrollTimeoutId: null,
    userScrollTimeoutId: null,
    indexWatcherId: null,
  };
}

/* ============================================================================
 * Comparators
 * ============================================================================ */

/**
 * 아이템 스크롤 상태 비교 (타이머 ID 제외)
 *
 * 실질적인 스크롤 상태 변경 여부를 판단합니다.
 * 타이머 ID는 비교에서 제외됩니다 (구현 세부사항).
 *
 * @param stateA - 비교할 첫 번째 상태
 * @param stateB - 비교할 두 번째 상태
 * @returns true이면 실질적으로 동일한 스크롤 상태
 *
 * @example
 * if (isSameItemScrollState(oldState, newState)) {
 *   // 실질적 변화 없음
 * }
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
