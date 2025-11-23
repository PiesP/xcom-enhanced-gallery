/**
 * Toolbar ViewModel helpers
 */

import { getSolid } from "@shared/external/vendors";
import type { ToolbarViewModel } from "@shared/types";

export interface ToolbarViewModelParams {
  readonly totalCount: number;
  readonly currentIndex: number;
  readonly focusedIndex?: number | null;
  readonly tweetText?: string | null;
  readonly tweetTextHTML?: string | null;
}

export interface ToolbarViewModelSignals {
  readonly totalCount: () => number;
  readonly currentIndex: () => number;
  readonly focusedIndex?: () => number | null;
  readonly tweetText?: () => string | null | undefined;
  readonly tweetTextHTML?: () => string | null | undefined;
}

const clampToolbarIndex = (index: number, total: number): number => {
  if (!Number.isFinite(index) || total <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), total - 1);
};

const roundProgress = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 1000) / 1000;
};

export function resolveToolbarViewModel(
  params: ToolbarViewModelParams,
): ToolbarViewModel {
  const totalCount = Math.max(0, params.totalCount);
  const hasItems = totalCount > 0;
  const normalizedCurrentIndex = clampToolbarIndex(
    params.currentIndex,
    totalCount,
  );
  const normalizedFocusedIndex =
    typeof params.focusedIndex === "number"
      ? clampToolbarIndex(params.focusedIndex, totalCount)
      : normalizedCurrentIndex;
  const displayedIndex = hasItems ? normalizedFocusedIndex : 0;

  const progressPercent = hasItems
    ? roundProgress(((displayedIndex + 1) / totalCount) * 100)
    : 0;

  const tweetText = params.tweetText ?? null;
  const tweetTextHTML = params.tweetTextHTML ?? null;
  const hasTweetText = Boolean(tweetTextHTML ?? tweetText);

  return {
    totalCount,
    currentIndex: hasItems ? normalizedCurrentIndex : 0,
    focusedIndex: hasItems ? normalizedFocusedIndex : 0,
    displayedIndex,
    hasItems,
    hasMultipleItems: totalCount > 1,
    hasTweetText,
    progressPercent,
    progressWidth: `${progressPercent}%`,
    tweetText,
    tweetTextHTML,
  };
}

export function createToolbarViewModel(
  signals: ToolbarViewModelSignals,
): () => ToolbarViewModel {
  const { createMemo } = getSolid();

  return createMemo(() =>
    resolveToolbarViewModel({
      totalCount: signals.totalCount(),
      currentIndex: signals.currentIndex(),
      focusedIndex: signals.focusedIndex?.() ?? null,
      tweetText: signals.tweetText?.() ?? null,
      tweetTextHTML: signals.tweetTextHTML?.() ?? null,
    }),
  );
}

export { clampToolbarIndex };
