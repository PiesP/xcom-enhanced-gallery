// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Pure navigation calculations shared by gallery transition commands. */

export type NavigationDirection = -1 | 1;

/** Resolve the item shown by the gallery when scroll focus differs from manual navigation. */
export function resolveDisplayedIndex(
  currentIndex: number,
  focusedIndex: number | null,
  itemCount: number
): number | null {
  if (itemCount <= 0) return null;
  if (focusedIndex !== null && focusedIndex >= 0 && focusedIndex < itemCount) {
    return focusedIndex;
  }
  return Math.min(Math.max(currentIndex, 0), itemCount - 1);
}

export function resolveAdjacentNavigationTarget(
  anchorIndex: number,
  direction: NavigationDirection,
  itemCount: number
): number | null {
  if (itemCount <= 1) return null;

  const targetIndex = anchorIndex + direction;
  return targetIndex >= 0 && targetIndex < itemCount ? targetIndex : null;
}
