/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Focus State & Tracking Type Definitions
 * @description Phase 150.2: 포커스 관리 시스템 핵심 타입 및 유틸리티
 *
 * 포커스 시스템은 두 가지 주요 개념을 관리합니다:
 *
 * 1. **FocusState**: 현재 포커스 상태 (어떤 아이템이 포커스되어 있는가?)
 *    - index: 포커스된 아이템 인덱스
 *    - source: 포커스 출처 (자동/수동/외부)
 *    - timestamp: 상태 업데이트 시간 (중복 방지)
 *
 * 2. **FocusTracking**: 포커스 추적 메타데이터 (포커스 변경 이력)
 *    - lastAutoFocusedIndex: 마지막 자동 포커스된 인덱스
 *    - lastAppliedIndex: 마지막으로 실제 적용된 인덱스 (중복 방지)
 *    - hasPendingRecompute: 스크롤 중 보류된 재계산 요청 여부
 *    - lastUpdateTime: 추적 마지막 업데이트 시간
 */

/**
 * 포커스 출처 타입
 *
 * - `auto`: 자동 감지 (IntersectionObserver)
 * - `manual`: 사용자 수동 입력 (키보드/마우스)
 * - `external`: 외부 시스템 강제 (프로그래매틱)
 */
export type FocusSource = 'auto' | 'manual' | 'external';

/**
 * 포커스 상태 인터페이스
 *
 * 현재 갤러리에서 포커스된 아이템의 상태를 나타냅니다.
 * Phase 150.2에서 도입된 정규화된 포커스 상태 관리 구조입니다.
 */
export interface FocusState {
  /**
   * 포커스된 아이템 인덱스 (0 이상)
   * null이면 포커스 없음
   */
  index: number | null;

  /**
   * 포커스 출처 (자동/수동/외부)
   * 출처 추적으로 우선순위 결정 및 중복 방지
   */
  source: FocusSource;

  /**
   * 상태 업데이트 타임스탬프 (Unix ms)
   * 중복된 포커스 업데이트 감지용
   */
  timestamp: number;
}

/**
 * 포커스 추적 메타데이터 인터페이스
 *
 * 포커스 변경 이력과 보류 중인 업데이트를 추적합니다.
 * 스크롤 중 포커스 변경 최적화에 사용됩니다.
 */
export interface FocusTracking {
  /**
   * 마지막 자동 포커스된 아이템 인덱스
   * IntersectionObserver로 자동 감지된 최종 인덱스
   */
  lastAutoFocusedIndex: number | null;

  /**
   * 마지막으로 실제 적용된 인덱스
   * 중복 포커스 업데이트 방지용 (타임스탬프보다 정확)
   */
  lastAppliedIndex: number | null;

  /**
   * 스크롤 중 보류된 재계산 요청 여부
   * 스크롤 완료 후 재계산이 필요할 경우 true
   */
  hasPendingRecompute: boolean;

  /**
   * 추적 메타데이터 마지막 업데이트 시간 (Unix ms)
   */
  lastUpdateTime: number;
}

/* ============================================================================
 * Constants
 * ============================================================================ */

/**
 * 초기 포커스 상태
 * - 포커스 없음
 * - 자동 감지 출처
 * - 타임스탬프 0
 */
export const INITIAL_FOCUS_STATE: FocusState = {
  index: null,
  source: 'auto',
  timestamp: 0,
};

/**
 * 초기 포커스 추적 상태
 * - 이력 없음
 * - 재계산 미보류
 * - 타임스탬프 0
 */
export const INITIAL_FOCUS_TRACKING: FocusTracking = {
  lastAutoFocusedIndex: null,
  lastAppliedIndex: null,
  hasPendingRecompute: false,
  lastUpdateTime: 0,
};

/* ============================================================================
 * Validators
 * ============================================================================ */

/**
 * 포커스 상태 검증
 *
 * 상태 무결성 보장:
 * - index는 null 또는 0 이상의 정수
 * - source는 유효한 FocusSource
 * - timestamp는 0 이상의 숫자
 *
 * @param state - 검증할 포커스 상태
 * @returns true이면 유효한 상태
 */
export function isValidFocusState(state: FocusState): boolean {
  // index 검증: null 또는 유효한 숫자
  if (state.index !== null) {
    if (typeof state.index !== 'number' || Number.isNaN(state.index) || state.index < 0) {
      return false;
    }
  }

  // source 검증
  if (!(['auto', 'manual', 'external'] as const).includes(state.source as FocusSource)) {
    return false;
  }

  // timestamp 검증
  if (typeof state.timestamp !== 'number' || state.timestamp < 0) {
    return false;
  }

  return true;
}

/* ============================================================================
 * Factories
 * ============================================================================ */

/**
 * 포커스 상태 생성 팩토리
 *
 * @param index - 포커스할 아이템 인덱스 (null이면 포커스 없음)
 * @param source - 포커스 출처 (기본값: auto)
 * @returns 새로운 FocusState 객체 (현재 타임스탬프 포함)
 */
export function createFocusState(index: number | null, source: FocusSource = 'auto'): FocusState {
  return {
    index,
    source,
    timestamp: Date.now(),
  };
}

/**
 * 포커스 추적 상태 생성 팩토리
 *
 * @param overrides - 기본값을 덮어쓸 속성 (선택사항)
 * @returns 새로운 FocusTracking 객체 (현재 타임스탬프 포함)
 */
export function createFocusTracking(
  overrides?: Partial<Omit<FocusTracking, 'lastUpdateTime'>>
): FocusTracking {
  return {
    ...INITIAL_FOCUS_TRACKING,
    lastUpdateTime: performance.now?.() ?? Date.now(),
    ...overrides,
  };
}

/* ============================================================================
 * Comparators
 * ============================================================================ */

/**
 * 포커스 상태 비교 (타임스탬프 제외)
 *
 * index와 source만 비교하여 실질적인 상태 변경 여부 판단
 *
 * @param state1 - 비교할 첫 번째 상태
 * @param state2 - 비교할 두 번째 상태
 * @returns true이면 실질적으로 동일한 포커스 상태
 */
export function isSameFocusState(state1: FocusState, state2: FocusState): boolean {
  return state1.index === state2.index && state1.source === state2.source;
}

/**
 * 포커스 추적 상태 비교 (시간 제외)
 *
 * 메타데이터만 비교하여 실질적인 추적 변경 여부 판단
 *
 * @param tracking1 - 비교할 첫 번째 추적 상태
 * @param tracking2 - 비교할 두 번째 추적 상태
 * @returns true이면 실질적으로 동일한 추적 상태
 */
export function isSameFocusTracking(tracking1: FocusTracking, tracking2: FocusTracking): boolean {
  return (
    tracking1.lastAutoFocusedIndex === tracking2.lastAutoFocusedIndex &&
    tracking1.lastAppliedIndex === tracking2.lastAppliedIndex &&
    tracking1.hasPendingRecompute === tracking2.hasPendingRecompute
  );
}

/* ============================================================================
 * Updaters
 * ============================================================================ */

/**
 * 포커스 추적 상태 업데이트
 *
 * 선택적 속성만 업데이트하고 타임스탐프를 자동으로 갱신합니다.
 *
 * @param tracking - 현재 추적 상태
 * @param updates - 업데이트할 속성 (lastUpdateTime 제외)
 * @returns 업데이트된 FocusTracking 객체
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

/**
 * 포커스 추적 상태 리셋
 *
 * 포커스 추적을 초기 상태로 복원합니다 (현재 타임스탬프 포함).
 *
 * @returns 초기화된 FocusTracking 객체
 */
export function resetFocusTracking(): FocusTracking {
  return createFocusTracking();
}
