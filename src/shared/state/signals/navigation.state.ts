/**
 * @fileoverview Navigation State Management
 */

import type { NavigationSource } from '@shared/types/navigation.types';
import { createSignal } from 'solid-js';

const INITIAL_SOURCE: NavigationSource = 'auto-focus';

const [_lastSource, setLastSource] = createSignal<NavigationSource>(INITIAL_SOURCE);
const [_lastTimestamp, setLastTimestamp] = createSignal<number>(0);
const [_lastNavigatedIndex, setLastNavigatedIndex] = createSignal<number | null>(null);

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

const isManualSource = (source: NavigationSource): boolean =>
  source === 'button' || source === 'keyboard';

export function recordNavigation(
  targetIndex: number,
  source: NavigationSource,
  nowMs?: number
): void {
  const timestamp = nowMs ?? performance.now();
  const currentIndex = navigationSignals.lastNavigatedIndex;
  const currentSource = navigationSignals.lastSource;

  if (targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource)) {
    navigationSignals.lastTimestamp = timestamp;
    return;
  }

  navigationSignals.lastSource = source;
  navigationSignals.lastTimestamp = timestamp;
  navigationSignals.lastNavigatedIndex = targetIndex;
}

export function resetNavigation(nowMs?: number): void {
  navigationSignals.lastSource = INITIAL_SOURCE;
  navigationSignals.lastTimestamp = nowMs ?? performance.now();
  navigationSignals.lastNavigatedIndex = null;
}

export function resolveNavigationSource(trigger: NavigationSource): NavigationSource {
  if (trigger === 'scroll') return 'scroll';
  if (trigger === 'keyboard') return 'keyboard';
  return 'button';
}
