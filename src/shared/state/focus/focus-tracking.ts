/**
 * Phase 150.2 Step 4: Tracking 상태 정규화
 *
 * 목표: lastAutoFocusedIndex, lastAppliedIndex, hasPendingRecompute 등 4+개 상태 → 1-2개로 통합
 */

/**
 * FocusTracking: 포커스 추적 메타데이터를 통합하는 구조
 *
 * 이전 상태:
 * - lastAutoFocusedIndex: number | null (마지막 자동 포커스된 인덱스)
 * - lastAppliedIndex: number | null (마지막 적용된 인덱스)
 * - hasPendingRecompute: boolean (재계산 보류 플래그)
 * - pendingFocusIndex?: number | null (보류된 포커스 인덱스)
 *
 * 통합 후:
 * - tracking: FocusTracking (단일 객체)
 */
export interface FocusTracking {
  /** 마지막 자동 포커스된 인덱스 */
  lastAutoFocusedIndex: number | null;

  /** 마지막 적용된 인덱스 (중복 방지) */
  lastAppliedIndex: number | null;

  /** 스크롤 중 보류된 재계산 요청 여부 */
  hasPendingRecompute: boolean;

  /** 추적 마지막 업데이트 시간 (타임스탬프) */
  lastUpdateTime: number;
}

/**
 * 초기 FocusTracking 상태
 */
export const INITIAL_FOCUS_TRACKING: FocusTracking = {
  lastAutoFocusedIndex: null,
  lastAppliedIndex: null,
  hasPendingRecompute: false,
  lastUpdateTime: 0,
};

/**
 * FocusTracking 생성 헬퍼
 */
export function createFocusTracking(overrides?: Partial<FocusTracking>): FocusTracking {
  return {
    ...INITIAL_FOCUS_TRACKING,
    lastUpdateTime: performance.now?.() ?? Date.now(),
    ...overrides,
  };
}

/**
 * FocusTracking 비교 헬퍼 (시간 제외)
 */
export function isSameFocusTracking(tracking1: FocusTracking, tracking2: FocusTracking): boolean {
  return (
    tracking1.lastAutoFocusedIndex === tracking2.lastAutoFocusedIndex &&
    tracking1.lastAppliedIndex === tracking2.lastAppliedIndex &&
    tracking1.hasPendingRecompute === tracking2.hasPendingRecompute
  );
}

/**
 * FocusTracking 재설정 헬퍼
 */
export function resetFocusTracking(): FocusTracking {
  return createFocusTracking();
}

/**
 * FocusTracking 업데이트 헬퍼
 * @param tracking 현재 추적 상태
 * @param updates 업데이트할 속성
 */
export function updateFocusTracking(
  tracking: FocusTracking,
  updates: Partial<Omit<FocusTracking, 'lastUpdateTime'>>
): FocusTracking {
  return {
    ...tracking,
    ...updates,
    lastUpdateTime: performance.now?.() ?? Date.now(),
  };
}
