// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar.types';
import type { MediaInfo } from '@shared/types/media.types';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const preloadSetting = vi.hoisted(() => ({ count: 1 }));

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

vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-wheel-redirect',
  () => ({
    useGalleryWheelRedirect: vi.fn(),
  })
);

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
      applyVolumeProgrammatically: vi.fn(),
      handleVolumeChange: vi.fn(),
    }),
  })
);

vi.mock('@shared/components/ui/Toolbar/Toolbar', () => ({
  Toolbar: (props: ToolbarProps) => (
    <div data-toolbar-text={props.tweetText?.()} data-toolbar-url={props.tweetUrl?.()} />
  ),
}));
vi.mock('@shared/container/settings-registry', () => ({
  getTypedSettingOr: (key: string, fallback: unknown) =>
    key === 'gallery.preloadCount' ? preloadSetting.count : fallback,
}));
vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

import { useVideoVisibility } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-visibility';
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import {
  disposeGallerySignals,
  gallerySignals,
  getDisplayedMediaIndex,
  navigateToItem,
  openGallery,
  setFocusedIndexOnly,
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

function video(id: string): MediaInfo {
  return {
    id,
    type: 'video',
    url: `https://video.twimg.com/ext_tw_video/222/pu/vid/${id}.mp4`,
    width: 640,
    height: 360,
  };
}

function image(container: HTMLElement, id: string): HTMLImageElement {
  const element = container.querySelector<HTMLImageElement>(
    `img[src="https://pbs.twimg.com/media/${id}.jpg"]`
  );
  if (!element) {
    throw new Error(`Missing image ${id}`);
  }
  return element;
}

async function flushEffects(): Promise<void> {
  await Promise.resolve();
}

describe('VerticalGalleryView preload reactivity', () => {
  let container: HTMLDivElement;
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    preloadSetting.count = 1;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    disposeGallerySignals();
    container.remove();
    vi.mocked(useVideoVisibility).mockReset();
    vi.unstubAllGlobals();
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

    const renderedItems = [
      ...container.querySelectorAll<HTMLElement>('[data-gallery-element="item"]'),
    ];
    expect(renderedItems.map((item) => item.dataset.index)).toEqual(['0', '1', '2', '3', '4']);
    expect(image(container, 'e').getAttribute('loading')).toBe('eager');
    expect(image(container, 'e').getAttribute('fetchpriority')).toBe('high');
    expect(image(container, 'd').getAttribute('loading')).toBe('lazy');
  });

  it('keeps a keyed video element, fallback readiness, and attempt budget when reordered', async () => {
    vi.mocked(useVideoVisibility).mockReturnValue({
      isVisible: () => true,
      hasObservation: () => false,
      isAutoPaused: () => false,
      recoveryMuted: (element) => element.muted,
      noteUserVolumeChange: () => {},
      pauseIfHidden: () => {},
    });
    const target = {
      ...video('best'),
      videoVariants: ['best', 'middle', 'low', 'fourth'].map((name) => ({
        url: video(name).url,
        contentType: 'video/mp4' as const,
      })),
    };
    const sibling = video('other');
    openGallery([target, sibling], 0);
    dispose = render(() => createComponent(VerticalGalleryView, {}), container);
    await flushEffects();

    const element = container.querySelector('video')!;
    const row = element.closest<HTMLElement>('[data-gallery-element="item"]')!;
    let errorCode: number | null = null;
    Object.defineProperty(element, 'error', {
      configurable: true,
      get: () => (errorCode === null ? null : { code: errorCode }),
    });
    Object.defineProperty(element, 'readyState', { configurable: true, get: () => 2 });
    vi.spyOn(element, 'play').mockResolvedValue(undefined);
    element.dispatchEvent(new Event('loadstart'));
    element.dispatchEvent(new Event('play'));
    errorCode = 3;
    element.dispatchEvent(new Event('error'));
    expect(element.getAttribute('src')).toBe(video('middle').url);
    errorCode = null;
    element.dispatchEvent(new Event('loadstart'));
    element.dispatchEvent(new Event('loadedmetadata'));
    expect(row.dataset.mediaLoaded).toBe('true');
    expect(row.dataset.videoFirstFrame).toBe('true');

    openGallery([sibling, target], 1);
    await flushEffects();
    const rows = [...container.querySelectorAll<HTMLElement>('[data-gallery-element="item"]')];
    expect(rows[1]).toBe(row);
    expect(row.querySelector('video')).toBe(element);
    expect(row.dataset.index).toBe('1');
    expect(row.dataset.videoAdmitted).toBe('true');
    expect(row.dataset.mediaLoaded).toBe('true');
    expect(row.dataset.videoFirstFrame).toBe('true');
    expect(element.getAttribute('src')).toBe(video('middle').url);

    errorCode = 3;
    element.dispatchEvent(new Event('error'));
    expect(element.getAttribute('src')).toBe(video('low').url);
    element.dispatchEvent(new Event('loadstart'));
    element.dispatchEvent(new Event('error'));
    expect(element.getAttribute('src')).toBe(video('low').url);
    expect(row.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('does not attach all video sources when image preloadCount is high', async () => {
    preloadSetting.count = 20;
    const items = ['a', 'b', 'c', 'd', 'e', 'f'].map(video);
    openGallery(items, 0);
    dispose = render(() => createComponent(VerticalGalleryView, {}), container);
    await flushEffects();

    const rows = [...container.querySelectorAll<HTMLElement>('[data-gallery-element="item"]')];
    expect(rows).toHaveLength(items.length);
    expect(rows[0]!.querySelector('video')?.getAttribute('src')).toBe(items[0]!.url);
    for (const row of rows.slice(1)) {
      expect(row.dataset.videoAdmitted).toBe('false');
      expect(row.querySelector('video')?.hasAttribute('src')).toBe(false);
    }

    navigateToItem(5, 'programmatic');
    await flushEffects();
    expect(rows[5]!.querySelector('video')?.getAttribute('src')).toBe(items[5]!.url);
    expect(rows[1]!.querySelector('video')?.hasAttribute('src')).toBe(false);
  });

  it('measures the one shared gallery scrollport for every video on resize', async () => {
    vi.mocked(useVideoVisibility).mockClear();
    const instances: Array<{
      readonly observe: ReturnType<typeof vi.fn>;
      readonly disconnect: ReturnType<typeof vi.fn>;
      readonly fire: () => void;
    }> = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        readonly observe = vi.fn();
        readonly disconnect = vi.fn();
        constructor(private readonly callback: ResizeObserverCallback) {
          instances.push({
            observe: this.observe,
            disconnect: this.disconnect,
            fire: () => {
              this.callback([], this as unknown as ResizeObserver);
            },
          });
        }
      }
    );
    const items = ['a', 'b', 'c'].map(video);
    openGallery(items, 0);
    dispose = render(() => createComponent(VerticalGalleryView, {}), container);
    await flushEffects();
    const root = container.querySelector<HTMLElement>('[data-gallery-element="items"]')!;
    Object.defineProperty(root, 'clientHeight', { configurable: true, get: () => 620 });
    expect(instances).toHaveLength(1);
    expect(instances[0]?.observe).toHaveBeenCalledWith(root);
    instances[0]?.fire();
    const calls = vi.mocked(useVideoVisibility).mock.calls;
    expect(calls).toHaveLength(3);
    for (const [options] of calls) {
      expect(options.scrollRoot()).toBe(root);
      expect(options.scrollRootHeight()).toBe(620);
    }
    dispose();
    dispose = undefined;
    expect(instances[0]?.disconnect).toHaveBeenCalledOnce();
  });

  it('keeps toolbar attribution on the displayed download item after scroll changes focus', async () => {
    const items = ['a', 'b'].map((id) => ({
      ...media(id),
      tweetText: `Post ${id}`,
      tweetUrl: `https://x.com/author/status/${id === 'a' ? '111' : '222'}`,
    }));
    openGallery(items, 0);
    dispose = render(() => createComponent(VerticalGalleryView, {}), container);
    await flushEffects();
    const toolbar = container.querySelector('[data-toolbar-url]')!;
    expect(toolbar.getAttribute('data-toolbar-url')).toBe(items[0]!.tweetUrl);

    setFocusedIndexOnly(1);
    await flushEffects();
    expect(gallerySignals.currentIndex).toBe(0);
    expect(getDisplayedMediaIndex()).toBe(1);
    expect(toolbar.getAttribute('data-toolbar-text')).toBe('Post b');
    expect(toolbar.getAttribute('data-toolbar-url')).toBe(items[1]!.tweetUrl);

    setFocusedIndexOnly(null);
    await flushEffects();
    expect(toolbar.getAttribute('data-toolbar-url')).toBe(items[0]!.tweetUrl);
  });
});
