/**
 * @fileoverview Navigation State Management
 *
 * Navigation state extracted from gallery.signals.ts for modularity.
 * Uses fine-grained signals instead of state machine for simplicity.
 */

import { createSignalSafe } from '@shared/state/signals/signal-factory';
import type { NavigationSource } from '@shared/types/navigation.types';

export type NavigationTrigger = 'button' | 'click' | 'keyboard' | 'scroll';

interface NavigationStateData {
  readonly lastSource: NavigationSource;
  readonly lastTimestamp: number;
  readonly lastNavigatedIndex: number | null;
}

interface NavigationResult {
  readonly isDuplicate: boolean;
}

const INITIAL_NAVIGATION_STATE: NavigationStateData = {
  lastSource: 'auto-focus',
  lastTimestamp: 0,
  lastNavigatedIndex: null,
};

const VALID_NAVIGATION_SOURCES = [
  'button',
  'keyboard',
  'scroll',
  'auto-focus',
] as const satisfies readonly NavigationSource[];

const VALID_NAVIGATION_TRIGGERS = [
  'button',
  'click',
  'keyboard',
  'scroll',
] as const satisfies readonly NavigationTrigger[];

const navigationSignals = {
  lastSource: createSignalSafe<NavigationSource>(INITIAL_NAVIGATION_STATE.lastSource),
  lastTimestamp: createSignalSafe<number>(INITIAL_NAVIGATION_STATE.lastTimestamp),
  lastNavigatedIndex: createSignalSafe<number | null>(INITIAL_NAVIGATION_STATE.lastNavigatedIndex),
};

const resolveNowMs = (nowMs?: number): number => nowMs ?? Date.now();

const isValidNavigationSource = (value: unknown): value is NavigationSource =>
  typeof value === 'string' && VALID_NAVIGATION_SOURCES.includes(value as NavigationSource);

const isValidNavigationTrigger = (value: unknown): value is NavigationTrigger =>
  typeof value === 'string' && VALID_NAVIGATION_TRIGGERS.includes(value as NavigationTrigger);

const isManualSource = (source: NavigationSource): boolean =>
  source === 'button' || source === 'keyboard';

const createNavigationActionError = (context: string, reason: string): Error =>
  new Error(`[Gallery] Invalid navigation action (${context}): ${reason}`);

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

export function recordNavigation(
  targetIndex: number,
  source: NavigationSource,
  nowMs?: number
): NavigationResult {
  const timestamp = resolveNowMs(nowMs);
  const currentIndex = navigationSignals.lastNavigatedIndex.value;
  const currentSource = navigationSignals.lastSource.value;

  const isDuplicate =
    targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource);

  if (isDuplicate) {
    navigationSignals.lastTimestamp.value = timestamp;
    return { isDuplicate: true };
  }

  navigationSignals.lastSource.value = source;
  navigationSignals.lastTimestamp.value = timestamp;
  navigationSignals.lastNavigatedIndex.value = targetIndex;

  return { isDuplicate: false };
}

export function recordFocusChange(source: NavigationSource, nowMs?: number): void {
  const timestamp = resolveNowMs(nowMs);
  navigationSignals.lastSource.value = source;
  navigationSignals.lastTimestamp.value = timestamp;
}

export function resetNavigation(nowMs?: number): void {
  navigationSignals.lastSource.value = INITIAL_NAVIGATION_STATE.lastSource;
  navigationSignals.lastTimestamp.value = resolveNowMs(nowMs);
  navigationSignals.lastNavigatedIndex.value = INITIAL_NAVIGATION_STATE.lastNavigatedIndex;
}

export function resolveNavigationSource(trigger: NavigationTrigger): NavigationSource {
  if (trigger === 'scroll') {
    return 'scroll';
  }
  if (trigger === 'keyboard') {
    return 'keyboard';
  }
  return 'button';
}
