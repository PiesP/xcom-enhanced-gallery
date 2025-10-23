/**
 * Phase 150.2: 포커스 상태 통합 모듈
 *
 * 목표: manualFocusIndex + autoFocusIndex 두 개의 Signals를
 * 단일 FocusState Signal로 통합하여 상태 복잡도 감소
 *
 * - Signal 2개 → 1개 (50% 감소)
 * - 포커스 출처 추적 (auto/manual/external)
 * - 타임스탬프로 중복 방지 자동화
 */

/**
 * 포커스 상태 인터페이스
 * @property index - 포커스된 아이템 인덱스, null이면 포커스 없음
 * @property source - 포커스 출처 (auto: 자동 감지, manual: 사용자 수동, external: 외부 강제)
 * @property timestamp - 상태 업데이트 타임스탬프 (중복 방지용)
 */
export interface FocusState {
  index: number | null;
  source: 'auto' | 'manual' | 'external';
  timestamp: number;
}

/**
 * 초기 포커스 상태
 */
export const INITIAL_FOCUS_STATE: FocusState = {
  index: null,
  source: 'auto',
  timestamp: 0,
};

/**
 * 포커스 상태 검증 함수
 * @param state - 검증할 포커스 상태
 * @returns true이면 유효한 상태
 */
export function isValidFocusState(state: FocusState): boolean {
  // index가 유효한 숫자거나 null
  if (state.index !== null && (typeof state.index !== 'number' || Number.isNaN(state.index))) {
    return false;
  }

  // source 유효성
  if (!['auto', 'manual', 'external'].includes(state.source)) {
    return false;
  }

  // timestamp 유효성
  if (typeof state.timestamp !== 'number' || state.timestamp < 0) {
    return false;
  }

  return true;
}

/**
 * 포커스 상태 생성 헬퍼
 * @param index - 포커스 인덱스
 * @param source - 포커스 출처
 * @returns 새로운 FocusState 객체
 */
export function createFocusState(
  index: number | null,
  source: FocusState['source'] = 'auto'
): FocusState {
  return {
    index,
    source,
    timestamp: Date.now(),
  };
}

/**
 * 포커스 상태 비교 함수 (타임스탬프 제외)
 * @param state1 - 비교할 첫 번째 상태
 * @param state2 - 비교할 두 번째 상태
 * @returns true이면 index와 source가 동일
 */
export function isSameFocusState(state1: FocusState, state2: FocusState): boolean {
  return state1.index === state2.index && state1.source === state2.source;
}
