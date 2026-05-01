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

const [_lastSource, setLastSource] = createSignalSafe<NavigationSource>(
  INITIAL_NAVIGATION_STATE.lastSource
);
const [_lastTimestamp, setLastTimestamp] = createSignalSafe<number>(
  INITIAL_NAVIGATION_STATE.lastTimestamp
);
const [_lastNavigatedIndex, setLastNavigatedIndex] = createSignalSafe<number | null>(
  INITIAL_NAVIGATION_STATE.lastNavigatedIndex
);

const navigationSignals = {
  get lastSource() {
    return _lastSource();
  },
  set lastSource(v: NavigationSource) {
    setLastSource(v);
  },
  get lastTimestamp() {
    return _lastTimestamp();
  },
  set lastTimestamp(v: number) {
    setLastTimestamp(v);
  },
  get lastNavigatedIndex() {
    return _lastNavigatedIndex();
  },
  set lastNavigatedIndex(v: number | null) {
    setLastNavigatedIndex(v);
  },
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
  const currentIndex = navigationSignals.lastNavigatedIndex;
  const currentSource = navigationSignals.lastSource;

  const isDuplicate =
    targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource);

  if (isDuplicate) {
    navigationSignals.lastTimestamp = timestamp;
    return { isDuplicate: true };
  }

  navigationSignals.lastSource = source;
  navigationSignals.lastTimestamp = timestamp;
  navigationSignals.lastNavigatedIndex = targetIndex;

  return { isDuplicate: false };
}

export function recordFocusChange(source: NavigationSource, nowMs?: number): void {
  const timestamp = resolveNowMs(nowMs);
  navigationSignals.lastSource = source;
  navigationSignals.lastTimestamp = timestamp;
}

export function resetNavigation(nowMs?: number): void {
  navigationSignals.lastSource = INITIAL_NAVIGATION_STATE.lastSource;
  navigationSignals.lastTimestamp = resolveNowMs(nowMs);
  navigationSignals.lastNavigatedIndex = INITIAL_NAVIGATION_STATE.lastNavigatedIndex;
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
