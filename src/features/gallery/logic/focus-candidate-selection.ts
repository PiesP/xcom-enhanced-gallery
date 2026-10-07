// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { FOCUS_VISIBILITY_RATIO_THRESHOLD } from '@constants/media';
import { FOCUS_TOP_PROXIMITY_PX } from '@constants/performance';

export interface FocusItemRect {
  readonly index: number;
  readonly top: number;
  readonly height: number;
}

export interface FocusViewportRect {
  readonly top: number;
  readonly height: number;
}

export interface FocusCandidate {
  readonly index: number;
  readonly distance: number;
}

/** Rank premeasured visible items without reading or mutating DOM state. */
export function selectBestFocusCandidate(
  viewportRect: FocusViewportRect,
  itemRects: readonly FocusItemRect[],
  activeIndex?: number
): FocusCandidate | null {
  const viewportHeight = Math.max(viewportRect.height, 1);
  const viewportTop = viewportRect.top;
  const viewportBottom = viewportTop + viewportHeight;
  const viewportCenter = viewportTop + viewportHeight / 2;

  // A short collection can show both the selected item and its neighbor in
  // full. In that ambiguous geometry, keep explicit navigation instead of
  // letting a preceding top-aligned item retarget current-item actions.
  const activeRect = itemRects.find((item) => item.index === activeIndex);
  if (
    activeRect &&
    activeRect.height > 0 &&
    activeRect.top >= viewportTop &&
    activeRect.top + activeRect.height <= viewportBottom
  ) {
    return { index: activeRect.index, distance: 0 };
  }

  let bestCandidate: FocusCandidate | null = null;
  let topAlignedCandidate: FocusCandidate | null = null;
  let highestVisibilityCandidate: {
    readonly index: number;
    readonly ratio: number;
    readonly centerDistance: number;
  } | null = null;

  for (const itemRect of itemRects) {
    const itemBottom = itemRect.top + itemRect.height;
    const itemCenter = itemRect.top + itemRect.height / 2;
    const visibleTop = Math.max(itemRect.top, viewportTop);
    const visibleBottom = Math.min(itemBottom, viewportBottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibilityRatio = itemRect.height > 0 ? visibleHeight / itemRect.height : 0;
    const centerDistance = Math.abs(itemCenter - viewportCenter);

    const topDistance = Math.abs(itemRect.top - viewportTop);
    if (
      topDistance <= FOCUS_TOP_PROXIMITY_PX &&
      visibilityRatio > FOCUS_VISIBILITY_RATIO_THRESHOLD &&
      (!topAlignedCandidate || topDistance < topAlignedCandidate.distance)
    ) {
      topAlignedCandidate = { index: itemRect.index, distance: topDistance };
    }

    if (visibilityRatio > FOCUS_VISIBILITY_RATIO_THRESHOLD) {
      const isBetter =
        !highestVisibilityCandidate ||
        visibilityRatio > highestVisibilityCandidate.ratio ||
        (visibilityRatio === highestVisibilityCandidate.ratio &&
          centerDistance < highestVisibilityCandidate.centerDistance);
      if (isBetter) {
        highestVisibilityCandidate = {
          index: itemRect.index,
          ratio: visibilityRatio,
          centerDistance,
        };
      }
    }

    if (!bestCandidate || centerDistance < bestCandidate.distance) {
      bestCandidate = { index: itemRect.index, distance: centerDistance };
    }
  }

  if (topAlignedCandidate) return topAlignedCandidate;
  if (highestVisibilityCandidate) return { index: highestVisibilityCandidate.index, distance: 0 };
  return bestCandidate;
}
