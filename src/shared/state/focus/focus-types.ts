/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Focus State & Tracking Type Definitions
 * @description Phase 150.2: Core types and utilities for focus management system
 *
 * The focus system manages two major concepts:
 *
 * 1. **FocusState**: Current focus state (which item is focused?)
 *    - index: Index of focused item
 *    - source: Focus source (auto/manual/external)
 *    - timestamp: State update time (for duplicate prevention)
 *
 * 2. **FocusTracking**: Focus tracking metadata (focus change history)
 *    - lastAutoFocusedIndex: Last automatically focused item index
 *    - lastAppliedIndex: Last actually applied index (for duplicate prevention)
 *    - hasPendingRecompute: Whether pending recompute during scroll
 *    - lastUpdateTime: Last update time for tracking metadata
 */

import { safePerformanceNow } from '../../utils/timer-management';

/**
 * Focus source type
 *
 * - `auto`: Auto-detected (IntersectionObserver)
 * - `manual`: User manual input (keyboard/mouse)
 * - `external`: External system enforcement (programmatic)
 */
export type FocusSource = 'auto' | 'manual' | 'external';

/**
 * Focus state interface
 *
 * Represents the state of the currently focused item in the gallery.
 * Normalized focus state management structure introduced in Phase 150.2.
 */
export interface FocusState {
  /**
   * Index of focused item (0 or above)
   * null means no focus
   */
  index: number | null;

  /**
   * Focus source (auto/manual/external)
   * Determines priority and prevents duplicates by tracking source
   */
  source: FocusSource;

  /**
   * State update timestamp (Unix ms)
   * Used for detecting duplicate focus updates
   */
  timestamp: number;
}

/**
 * Focus tracking metadata interface
 *
 * Tracks focus change history and pending updates.
 * Used for optimizing focus changes during scrolling.
 */
export interface FocusTracking {
  /**
   * Last automatically focused item index
   * Final index auto-detected by IntersectionObserver
   */
  lastAutoFocusedIndex: number | null;

  /**
   * Last actually applied index
   * Used to prevent duplicate focus updates (more precise than timestamp)
   */
  lastAppliedIndex: number | null;

  /**
   * Whether pending recompute during scroll
   * Set to true if recompute is needed after scroll completes
   */
  hasPendingRecompute: boolean;

  /**
   * Last update time for tracking metadata (Unix ms)
   */
  lastUpdateTime: number;
}

/* ============================================================================
 * Constants
 * ============================================================================ */

/**
 * Initial focus state
 * - No focus
 * - Auto-detect source
 * - Timestamp 0
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
    lastUpdateTime: safePerformanceNow(),
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
    lastUpdateTime: safePerformanceNow(),
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
