// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaInfo } from '@shared/types/media.types';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@features/gallery/components/vertical-gallery-view/hooks/use-gallery-fit-mode', () => ({
  useGalleryFitMode: () => ({
    imageFitMode: () => 'fitWidth',
    handleFitOriginal: vi.fn(),
    handleFitWidth: vi.fn(),
    handleFitHeight: vi.fn(),
    handleFitContainer: vi.fn(),
  }),
}));

vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-navigation-handlers',
  () => ({
    useGalleryNavigationHandlers: () => ({
      handlePrevious: vi.fn(),
      handleNext: vi.fn(),
      handleBackgroundClick: vi.fn(),
      handleMediaItemClick: vi.fn(),
    }),
  })
);

vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-scroll-correction',
  () => ({
    useGalleryScrollCorrection: () => ({ debouncedScrollCorrection: vi.fn() }),
  })
);

vi.mock('@features/gallery/components/vertical-gallery-view/hooks/use-gallery-wheel-redirect', () => ({
  useGalleryWheelRedirect: vi.fn(),
}));

vi.mock('@features/gallery/components/vertical-gallery-view/hooks/use-vertical-gallery', () => ({
  useVerticalGallery: () => ({
    scroll: {
      isScrolling: () => false,
      lastUserScrollTime: () => 0,
      scrollToItem: vi.fn(),
      scrollToCurrentItem: vi.fn(),
    },
    navigation: {
      lastNavigationTrigger: () => 'programmatic',
      setLastNavigationTrigger: vi.fn(),
      programmaticScrollTimestamp: () => 0,
      setProgrammaticScrollTimestamp: vi.fn(),
    },
    focus: {
      focusedIndex: () => null,
      registerItem: vi.fn(),
      handleItemFocus: vi.fn(),
      forceSync: vi.fn(),
    },
    toolbar: {
      isInitialToolbarVisible: () => false,
      setIsInitialToolbarVisible: vi.fn(),
    },
  }),
}));

vi.mock('@features/gallery/components/vertical-gallery-view/hooks/use-video-visibility', () => ({
  useVideoVisibility: vi.fn(),
}));

vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence',
  () => ({
    useVideoVolumePersistence: () => ({
      applyMutedProgrammatically: vi.fn(),
      handleVolumeChange: vi.fn(),
    }),
  })
);

vi.mock('@shared/components/ui/Toolbar/Toolbar', () => ({ Toolbar: () => null }));
vi.mock('@shared/container/settings-registry', () => ({
  getTypedSettingOr: (key: string, fallback: unknown) =>
    key === 'gallery.preloadCount' ? 1 : fallback,
}));
vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import {
  disposeGallerySignals,
  navigateToItem,
  openGallery,
} from '@shared/state/signals/gallery.signals';

function media(id: string): MediaInfo {
  return {
    id,
    type: 'image',
    url: `https://pbs.twimg.com/media/${id}.jpg`,
    width: 100,
    height: 100,
  };
}

function image(container: HTMLElement, id: string): HTMLImageElement {
  const element = container.querySelector<HTMLImageElement>(
    `img[src="https://pbs.twimg.com/media/${id}.jpg"]`
  );
  if (!element) throw new Error(`Missing image ${id}`);
  return element;
}

async function flushEffects(): Promise<void> {
  await Promise.resolve();
}

describe('VerticalGalleryView preload reactivity', () => {
  let container: HTMLDivElement;
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    disposeGallerySignals();
    container.remove();
  });

  it('moves eager loading and fetch priority with the active index', async () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map(media);
    openGallery(items, 0);
    dispose = render(() => createComponent(VerticalGalleryView, {}), container);
    await flushEffects();

    expect(image(container, 'a').getAttribute('loading')).toBe('eager');
    expect(image(container, 'b').getAttribute('loading')).toBe('eager');
    expect(image(container, 'c').getAttribute('loading')).toBe('lazy');

    navigateToItem(3, 'programmatic');
    await flushEffects();

    expect(image(container, 'a').getAttribute('loading')).toBe('lazy');
    expect(image(container, 'b').getAttribute('loading')).toBe('lazy');
    expect(image(container, 'c').getAttribute('loading')).toBe('eager');
    expect(image(container, 'd').getAttribute('loading')).toBe('eager');
    expect(image(container, 'e').getAttribute('loading')).toBe('eager');
    expect(image(container, 'c').getAttribute('fetchpriority')).toBe('high');
    expect(image(container, 'b').getAttribute('fetchpriority')).toBe('low');
  });

  it('updates item indices and preload state when keyed items reorder', async () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map(media);
    openGallery(items, 0);
    dispose = render(() => createComponent(VerticalGalleryView, {}), container);
    await flushEffects();

    openGallery([items[4]!, items[0]!, items[1]!, items[2]!, items[3]!], 1);
    await flushEffects();

    const renderedItems = [...container.querySelectorAll<HTMLElement>('[data-gallery-element="item"]')];
    expect(renderedItems.map((item) => item.dataset.index)).toEqual(['0', '1', '2', '3', '4']);
    expect(image(container, 'e').getAttribute('loading')).toBe('eager');
    expect(image(container, 'e').getAttribute('fetchpriority')).toBe('high');
    expect(image(container, 'd').getAttribute('loading')).toBe('lazy');
  });
});
