/**
 * @fileoverview Navigation State Management
 * @version 1.0.0 - Phase: State Management Simplification
 *
 * Navigation state extracted from gallery.signals.ts for modularity.
 * Uses fine-grained signals instead of state machine for simplicity.
 *
 * Key features:
 * - Tracks navigation source and timing
 * - Detects duplicate navigation
 * - Signal-based state management (time can be injected for deterministic tests)
 */

import { createSignalSafe } from '@shared/state/signals/signal-factory';
import type { NavigationSource } from '@shared/types/navigation.types';

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation trigger types representing user interaction methods
 */
export type NavigationTrigger = 'button' | 'click' | 'keyboard' | 'scroll';

/**
 * Navigation state data structure
 *
 * @property lastSource - Most recent navigation source type
 * @property lastTimestamp - Timestamp of last navigation in milliseconds
 * @property lastNavigatedIndex - Index of last navigated item, null if none
 */
interface NavigationStateData {
  readonly lastSource: NavigationSource;
  readonly lastTimestamp: number;
  readonly lastNavigatedIndex: number | null;
}

/**
 * Navigation transition result
 *
 * @property isDuplicate - True if navigation was duplicate and ignored
 */
interface NavigationResult {
  readonly isDuplicate: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Initial navigation state values
 */
const INITIAL_NAVIGATION_STATE: NavigationStateData = {
  lastSource: 'auto-focus',
  // Avoid non-deterministic timestamps at module evaluation time.
  // Callers can provide `nowMs` to reset/record functions when needed.
  lastTimestamp: 0,
  lastNavigatedIndex: null,
};

/**
 * Valid navigation source values
 */
const VALID_NAVIGATION_SOURCES = [
  'button',
  'keyboard',
  'scroll',
  'auto-focus',
] as const satisfies readonly NavigationSource[];

/**
 * Valid navigation trigger values
 */
const VALID_NAVIGATION_TRIGGERS = [
  'button',
  'click',
  'keyboard',
  'scroll',
] as const satisfies readonly NavigationTrigger[];

// ============================================================================
// Fine-grained Signals
// ============================================================================

/**
 * Navigation state signals
 * @internal
 */
const navigationSignals = {
  lastSource: createSignalSafe<NavigationSource>(INITIAL_NAVIGATION_STATE.lastSource),
  lastTimestamp: createSignalSafe<number>(INITIAL_NAVIGATION_STATE.lastTimestamp),
  lastNavigatedIndex: createSignalSafe<number | null>(INITIAL_NAVIGATION_STATE.lastNavigatedIndex),
};

/**
 * Resolve timestamp parameter to current time if not provided
 *
 * @param nowMs - Optional timestamp in milliseconds
 * @returns Resolved timestamp (provided value or Date.now())
 */
const resolveNowMs = (nowMs?: number): number => nowMs ?? Date.now();

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if value is a valid navigation source
 *
 * @param value - Value to validate
 * @returns True if value is a valid NavigationSource
 */
const isValidNavigationSource = (value: unknown): value is NavigationSource =>
  typeof value === 'string' && VALID_NAVIGATION_SOURCES.includes(value as NavigationSource);

/**
 * Check if value is a valid navigation trigger
 *
 * @param value - Value to validate
 * @returns True if value is a valid NavigationTrigger
 */
const isValidNavigationTrigger = (value: unknown): value is NavigationTrigger =>
  typeof value === 'string' && VALID_NAVIGATION_TRIGGERS.includes(value as NavigationTrigger);

/**
 * Check if source is a manual navigation (button or keyboard)
 *
 * @param source - Navigation source to check
 * @returns True if source is button or keyboard
 */
const isManualSource = (source: NavigationSource): boolean =>
  source === 'button' || source === 'keyboard';

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Create navigation action error
 *
 * @param context - Context where error occurred
 * @param reason - Reason for the error
 * @returns Formatted error object
 */
const createNavigationActionError = (context: string, reason: string): Error =>
  new Error(`[Gallery] Invalid navigation action (${context}): ${reason}`);

/**
 * Validate navigation parameters
 *
 * @param targetIndex - Target navigation index
 * @param source - Navigation source type
 * @param trigger - Navigation trigger type
 * @param context - Context for error messages
 * @throws {Error} If any parameter is invalid
 */
export function validateNavigationParams(
  targetIndex: number,
  source: NavigationSource,
  trigger: NavigationTrigger,
  context: string
): void {
  if (typeof targetIndex !== 'number' || Number.isNaN(targetIndex)) {
    throw createNavigationActionError(context, 'Navigate payload targetIndex invalid');
  }

  if (!isValidNavigationSource(source)) {
    throw createNavigationActionError(
      context,
      `Navigate payload source invalid: ${String(source)}`
    );
  }

  if (!isValidNavigationTrigger(trigger)) {
    throw createNavigationActionError(
      context,
      `Navigate payload trigger invalid: ${String(trigger)}`
    );
  }
}

/**
 * Validate focus parameters
 *
 * @param focusIndex - Target focus index (null to clear focus)
 * @param source - Navigation source type
 * @param context - Context for error messages
 * @throws {Error} If any parameter is invalid
 */
export function validateFocusParams(
  focusIndex: number | null,
  source: NavigationSource,
  context: string
): void {
  if (!(focusIndex === null || typeof focusIndex === 'number')) {
    throw createNavigationActionError(context, 'Set focus payload focusIndex invalid');
  }

  if (!isValidNavigationSource(source)) {
    throw createNavigationActionError(
      context,
      `Set focus payload source invalid: ${String(source)}`
    );
  }
}

// ============================================================================
// State Accessors
// ============================================================================

// ============================================================================
// Actions
// ============================================================================

/**
 * Record a navigation action
 *
 * @param targetIndex - Target navigation index
 * @param source - Navigation source type
 * @param nowMs - Optional timestamp in milliseconds (uses Date.now() if not provided)
 * @returns Navigation result indicating if this was a duplicate
 */
export function recordNavigation(
  targetIndex: number,
  source: NavigationSource,
  nowMs?: number
): NavigationResult {
  const timestamp = resolveNowMs(nowMs);
  const currentIndex = navigationSignals.lastNavigatedIndex.value;
  const currentSource = navigationSignals.lastSource.value;

  // Detect duplicate navigation: same index, both manual sources
  const isDuplicate =
    targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource);

  if (isDuplicate) {
    // Update timestamp only
    navigationSignals.lastTimestamp.value = timestamp;
    return { isDuplicate: true };
  }

  // Update full state
  navigationSignals.lastSource.value = source;
  navigationSignals.lastTimestamp.value = timestamp;
  navigationSignals.lastNavigatedIndex.value = targetIndex;

  return { isDuplicate: false };
}

/**
 * Record a focus change (doesn't affect navigation history)
 *
 * @param source - Navigation source type
 * @param nowMs - Optional timestamp in milliseconds (uses Date.now() if not provided)
 */
export function recordFocusChange(source: NavigationSource, nowMs?: number): void {
  const timestamp = resolveNowMs(nowMs);
  navigationSignals.lastSource.value = source;
  navigationSignals.lastTimestamp.value = timestamp;
}

/**
 * Reset navigation state to initial values
 *
 * @param nowMs - Optional timestamp in milliseconds (uses Date.now() if not provided)
 */
export function resetNavigation(nowMs?: number): void {
  navigationSignals.lastSource.value = INITIAL_NAVIGATION_STATE.lastSource;
  navigationSignals.lastTimestamp.value = resolveNowMs(nowMs);
  navigationSignals.lastNavigatedIndex.value = INITIAL_NAVIGATION_STATE.lastNavigatedIndex;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Resolve navigation trigger to navigation source
 *
 * @param trigger - Navigation trigger type
 * @returns Corresponding NavigationSource for the trigger
 */
export function resolveNavigationSource(trigger: NavigationTrigger): NavigationSource {
  if (trigger === 'scroll') {
    return 'scroll';
  }
  if (trigger === 'keyboard') {
    return 'keyboard';
  }
  // Treat both button and click triggers as button sourced interactions
  return 'button';
}
