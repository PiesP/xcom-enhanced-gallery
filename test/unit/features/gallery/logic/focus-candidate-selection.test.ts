// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import {
  type FocusItemRect,
  selectBestFocusCandidate,
} from '@features/gallery/logic/focus-candidate-selection';

interface SelectionCase {
  readonly name: string;
  readonly itemRects: readonly FocusItemRect[];
  readonly expected: { readonly index: number; readonly distance: number } | null;
}

describe('selectBestFocusCandidate', () => {
  const viewport = { top: 0, height: 100 };

  it.each<SelectionCase>([
    {
      name: 'returns null when no items are eligible',
      itemRects: [],
      expected: null,
    },
    {
      name: 'prefers the closest top-aligned item over a more visible item',
      itemRects: [
        { index: 1, top: 40, height: 100 },
        { index: 2, top: 60, height: 40 },
      ],
      expected: { index: 1, distance: 40 },
    },
    {
      name: 'chooses the closest of multiple top-aligned items',
      itemRects: [
        { index: 1, top: 40, height: 100 },
        { index: 2, top: 10, height: 100 },
      ],
      expected: { index: 2, distance: 10 },
    },
    {
      name: 'chooses the item with the highest visibility ratio',
      itemRects: [
        { index: 1, top: 60, height: 40 },
        { index: 2, top: 70, height: 100 },
      ],
      expected: { index: 1, distance: 0 },
    },
    {
      name: 'breaks equal visibility ties by center distance',
      itemRects: [
        { index: 1, top: 60, height: 100 },
        { index: 2, top: 80, height: 50 },
      ],
      expected: { index: 2, distance: 0 },
    },
    {
      name: 'falls back to the closest center below the visibility threshold',
      itemRects: [
        { index: 1, top: 95, height: 100 },
        { index: 2, top: -100, height: 105 },
      ],
      expected: { index: 1, distance: 95 },
    },
  ])('$name', ({ itemRects, expected }) => {
    expect(selectBestFocusCandidate(viewport, itemRects)).toEqual(expected);
  });
});
