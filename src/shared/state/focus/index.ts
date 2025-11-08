/**
 * Focus Management Module
 *
 * Unified management module for focus state, cache, timer, and tracking.
 *
 * Main components:
 * - FocusState, FocusTracking: Core types
 * - ItemCache: Item cache management
 * - FocusTimerManager: Centralized timer management
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
