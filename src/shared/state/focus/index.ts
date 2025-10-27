/**
 * Focus Management Module
 *
 * 포커스 상태, 캐시, 타이머, 추적을 통합 관리하는 모듈.
 *
 * 주요 구성:
 * - FocusState, FocusTracking: 핵심 타입
 * - ItemCache: 아이템 캐시 관리
 * - FocusTimerManager: 타이머 중앙화 관리
 */

/* ============================================================================
 * Types & Constants
 * ============================================================================ */

export type { FocusState, FocusTracking } from './focus-types';

export {
  INITIAL_FOCUS_STATE,
  INITIAL_FOCUS_TRACKING,
  isValidFocusState,
  createFocusState,
  isSameFocusState,
  createFocusTracking,
  isSameFocusTracking,
  resetFocusTracking,
  updateFocusTracking,
} from './focus-types';

/* ============================================================================
 * Cache
 * ============================================================================ */

export type { ItemEntry } from './focus-cache';

export {
  ItemCache,
  createItemCache,
  isItemVisibleEnough,
  calculateCenterDistance,
} from './focus-cache';

/* ============================================================================
 * Timer Management
 * ============================================================================ */

export type { FocusTimerRole } from './focus-timer-manager';

export {
  FocusTimerManager,
  createFocusTimerManager,
  useFocusTimerManager,
} from './focus-timer-manager';
