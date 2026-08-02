// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Pure navigation calculations shared by gallery transition commands. */

export type NavigationDirection = -1 | 1;

export function resolveAdjacentNavigationTarget(
  anchorIndex: number,
  direction: NavigationDirection,
  itemCount: number
): number | null {
  if (itemCount <= 1) return null;

  const targetIndex = anchorIndex + direction;
  return targetIndex >= 0 && targetIndex < itemCount ? targetIndex : null;
}
