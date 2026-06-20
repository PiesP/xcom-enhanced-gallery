// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Navigation state — tracks what triggered the last navigation event.
 */

import { batch, createSignal } from 'solid-js';

export type NavigationSource =
  | 'button'
  | 'click'
  | 'keyboard'
  | 'programmatic'
  | 'scroll'
  | 'auto-focus';

const INITIAL_NAV_SOURCE: NavigationSource = 'auto-focus';

const [_navSource, setNavSource] = createSignal<NavigationSource>(INITIAL_NAV_SOURCE);
const [_navTimestamp, setNavTimestamp] = createSignal<number>(0);
const [_navIndex, setNavIndex] = createSignal<number | null>(null);

const isManualSource = (source: NavigationSource): boolean =>
  source === 'button' || source === 'keyboard';

/**
 * Records a navigation event with target index, source, and timestamp.
 */
export function recordNavigation(
  targetIndex: number,
  source: NavigationSource,
  nowMs?: number
): void {
  const timestamp = nowMs ?? performance.now();
  const currentIndex = _navIndex();
  const currentSource = _navSource();

  if (targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource)) {
    setNavTimestamp(timestamp);
    return;
  }

  batch(() => {
    setNavSource(source);
    setNavTimestamp(timestamp);
    setNavIndex(targetIndex);
  });
}

/**
 * Resets navigation state to initial values.
 */
export function resetNavigation(nowMs?: number): void {
  setNavSource(INITIAL_NAV_SOURCE);
  setNavTimestamp(nowMs ?? performance.now());
  setNavIndex(null);
}

export function resolveNavigationSource(trigger: NavigationSource): NavigationSource {
  if (trigger === 'scroll') return 'scroll';
  if (trigger === 'keyboard') return 'keyboard';
  return 'button';
}

// Re-export for consumers that import from this module
export { _navIndex as navIndex, _navSource as navSource, _navTimestamp as navTimestamp };
