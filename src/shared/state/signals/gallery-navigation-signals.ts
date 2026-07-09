// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Gallery navigation state management signals.
 *
 * Tracks navigation source, timestamp, and focused index for gallery
 * item transitions. Separated from core gallery signals to keep the
 * main signal file focused on gallery lifecycle.
 */

import { createSignal } from 'solid-js';

/** Navigation source type - tracks what triggered the navigation */
export type NavigationSource =
  | 'button'
  | 'click'
  | 'keyboard'
  | 'programmatic'
  | 'scroll'
  | 'auto-focus';

export const INITIAL_NAV_SOURCE: NavigationSource = 'auto-focus';

// Internal signal state — exported for use by disposeGallerySignals
export const [_navSource, setNavSource] = createSignal<NavigationSource>(INITIAL_NAV_SOURCE);
export const [_navTimestamp, setNavTimestamp] = createSignal<number>(0);
export const [_navIndex, setNavIndex] = createSignal<number | null>(null);

const isManualSource = (source: NavigationSource): boolean =>
  source === 'button' || source === 'keyboard';

/**
 * Records a navigation event with target index, source, and timestamp.
 * Skips duplicate manual-source navigations to the same index (only updates timestamp).
 *
 * @param targetIndex - The navigation target item index
 * @param source - How the navigation was triggered (button, keyboard, scroll, etc.)
 * @param nowMs - Optional timestamp in milliseconds for determinism.
 *   Pass for test reproducibility. Defaults to performance.now() (non-RT).
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

  setNavSource(source);
  setNavTimestamp(timestamp);
  setNavIndex(targetIndex);
}

/**
 * Resets navigation state to initial values.
 * Typically called on gallery open/close to clear the previous session's navigation history.
 *
 * @param nowMs - Optional timestamp in milliseconds for determinism.
 *   Pass for test reproducibility. Defaults to performance.now() (non-RT).
 */
export function resetNavigation(nowMs?: number): void {
  setNavSource(INITIAL_NAV_SOURCE);
  setNavTimestamp(nowMs ?? performance.now());
  setNavIndex(null);
}
