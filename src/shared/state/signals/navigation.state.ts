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
 * - Pure signal-based state management
 */

import { createSignalSafe } from '@shared/state/signals/signal-factory';
import type { NavigationSource } from '@shared/types/navigation.types';

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation trigger types
 */
export type NavigationTrigger = 'button' | 'click' | 'keyboard' | 'scroll';

/**
 * Navigation state interface
 */
export interface NavigationStateData {
  readonly lastSource: NavigationSource;
  readonly lastTimestamp: number;
  readonly lastNavigatedIndex: number | null;
}

/**
 * Navigation transition result
 */
export interface NavigationResult {
  readonly isDuplicate: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_NAVIGATION_STATE: NavigationStateData = {
  lastSource: 'auto-focus',
  lastTimestamp: Date.now(),
  lastNavigatedIndex: null,
};

const VALID_NAVIGATION_SOURCES: readonly NavigationSource[] = [
  'button',
  'keyboard',
  'scroll',
  'auto-focus',
];

const VALID_NAVIGATION_TRIGGERS: readonly NavigationTrigger[] = [
  'button',
  'click',
  'keyboard',
  'scroll',
];

// ============================================================================
// Fine-grained Signals
// ============================================================================

export const navigationSignals = {
  lastSource: createSignalSafe<NavigationSource>(INITIAL_NAVIGATION_STATE.lastSource),
  lastTimestamp: createSignalSafe<number>(INITIAL_NAVIGATION_STATE.lastTimestamp),
  lastNavigatedIndex: createSignalSafe<number | null>(INITIAL_NAVIGATION_STATE.lastNavigatedIndex),
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if value is a valid navigation source
 */
export function isValidNavigationSource(value: unknown): value is NavigationSource {
  return typeof value === 'string' && VALID_NAVIGATION_SOURCES.includes(value as NavigationSource);
}

/**
 * Check if value is a valid navigation trigger
 */
export function isValidNavigationTrigger(value: unknown): value is NavigationTrigger {
  return (
    typeof value === 'string' && VALID_NAVIGATION_TRIGGERS.includes(value as NavigationTrigger)
  );
}

/**
 * Check if source is a manual navigation (button or keyboard)
 */
function isManualSource(source: NavigationSource): boolean {
  return source === 'button' || source === 'keyboard';
}

// ============================================================================
// Error Handling
// ============================================================================

function createNavigationActionError(context: string, reason: string): Error {
  return new Error(`[Gallery] Invalid navigation action (${context}): ${reason}`);
}

/**
 * Validate navigation parameters
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

/**
 * Get current navigation state
 */
export function getNavigationState(): NavigationStateData {
  return {
    lastSource: navigationSignals.lastSource.value,
    lastTimestamp: navigationSignals.lastTimestamp.value,
    lastNavigatedIndex: navigationSignals.lastNavigatedIndex.value,
  };
}

/**
 * Get last navigation source
 */
export function getLastNavigationSource(): NavigationSource {
  return navigationSignals.lastSource.value;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Record a navigation action
 * @returns Navigation result indicating if this was a duplicate
 */
export function recordNavigation(targetIndex: number, source: NavigationSource): NavigationResult {
  const timestamp = Date.now();
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
 */
export function recordFocusChange(source: NavigationSource): void {
  const timestamp = Date.now();
  navigationSignals.lastSource.value = source;
  navigationSignals.lastTimestamp.value = timestamp;
}

/**
 * Reset navigation state to initial values
 */
export function resetNavigation(): void {
  navigationSignals.lastSource.value = INITIAL_NAVIGATION_STATE.lastSource;
  navigationSignals.lastTimestamp.value = Date.now();
  navigationSignals.lastNavigatedIndex.value = INITIAL_NAVIGATION_STATE.lastNavigatedIndex;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Resolve navigation trigger to navigation source
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
