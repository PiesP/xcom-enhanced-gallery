// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { resolveAdjacentNavigationTarget } from '@shared/state/signals/gallery-navigation';
import {
  disposeGallerySignals,
  galleryIndexEvents,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  navigateToItem,
  openGallery,
  setFocusedIndexOnly,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { afterEach, describe, expect, it, vi } from 'vitest';

function media(id: string): MediaInfo {
  return { id, url: `https://example.com/${id}.jpg`, type: 'image' };
}

afterEach(() => {
  disposeGallerySignals();
});

describe('resolveAdjacentNavigationTarget', () => {
  it.each([
    [0, 1, 3, 1],
    [2, -1, 3, 1],
    [2, 1, 3, null],
    [0, -1, 3, null],
    [0, 1, 1, null],
  ] as const)('resolves anchor %i, direction %i, count %i to %s', (anchor, direction, count, expected) => {
    expect(resolveAdjacentNavigationTarget(anchor, direction, count)).toBe(expected);
  });
});

describe('gallery navigation transitions', () => {
  it('uses the focused item as the next-navigation anchor and emits the committed target', () => {
    const listener = vi.fn();
    galleryIndexEvents.on('navigate:complete', listener);
    openGallery([media('a'), media('b'), media('c')]);
    setFocusedIndexOnly(1);

    navigateNext('button');

    expect(gallerySignals.currentIndex).toBe(2);
    expect(gallerySignals.focusedIndex).toBe(2);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ index: 2, trigger: 'button' });
  });

  it('commits previous navigation once and ignores an out-of-bounds repeat', () => {
    const listener = vi.fn();
    galleryIndexEvents.on('navigate:complete', listener);
    openGallery([media('a'), media('b')], 1);

    navigatePrevious('keyboard');
    navigatePrevious('keyboard');

    expect(gallerySignals.currentIndex).toBe(0);
    expect(gallerySignals.focusedIndex).toBe(0);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ index: 0, trigger: 'keyboard' });
  });

  it('clamps a direct target and does not emit when the committed index is unchanged', () => {
    const listener = vi.fn();
    galleryIndexEvents.on('navigate:complete', listener);
    openGallery([media('a'), media('b'), media('c')], 1);

    navigateToItem(99, 'programmatic');
    navigateToItem(2, 'programmatic');

    expect(gallerySignals.currentIndex).toBe(2);
    expect(gallerySignals.focusedIndex).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ index: 2, trigger: 'programmatic' });
  });
});
