// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaInfo } from '@shared/types/media.types';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const observers = new Map<string, (entry: IntersectionObserverEntry) => void>();
const observerOptions = new Map<string, IntersectionObserverInit>();

vi.mock('@shared/utils/performance/observer-pool', () => ({
  SharedObserver: {
    observe: (
      _element: Element,
      callback: (entry: IntersectionObserverEntry) => void,
      options: IntersectionObserverInit
    ) => {
      observers.set(options.rootMargin ?? '', callback);
      observerOptions.set(options.rootMargin ?? '', options);
      return () => {
        observers.delete(options.rootMargin ?? '');
        observerOptions.delete(options.rootMargin ?? '');
      };
    },
  },
}));
vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence',
  () => ({
    useVideoVolumePersistence: (options: {
      onUserVolumeChange?: (video: HTMLVideoElement) => void;
    }) => ({
      applyMutedProgrammatically: (video: HTMLVideoElement, muted: boolean) => {
        video.muted = muted;
      },
      applyVolumeProgrammatically: (video: HTMLVideoElement, volume: number) => {
        video.volume = volume;
      },
      handleVolumeChange: (event: Event & { currentTarget: HTMLVideoElement }) =>
        options.onUserVolumeChange?.(event.currentTarget),
    }),
  })
);
vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

import {
  MAX_VIDEO_PLAYBACK_ATTEMPTS,
  nextVideoPlaybackSource,
} from '@features/gallery/components/vertical-gallery-view/utils/video-playback-recovery';
import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { closeGallery, openGallery } from '@shared/state/signals/gallery.signals';
import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';
import { executeVideoControl } from '@shared/utils/events/handlers/video-control-helper';

const source = (name: string): string =>
  `https://video.twimg.com/ext_tw_video/222/pu/vid/${name}.mp4`;
const poster = 'https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/poster.jpg';
const variants = ['best', 'middle', 'low', 'fourth'].map((name) => ({
  url: source(name),
  contentType: 'video/mp4' as const,
}));

function media(id = '222_api_0'): MediaInfo {
  return {
    id,
    type: 'video',
    url: source('best'),
    thumbnailUrl: poster,
    width: 640,
    height: 360,
    videoVariants: variants,
    downloadSource: { url: source('best'), quality: 'best-mp4', provenance: 'api' },
  };
}

function mediaEvent(video: HTMLVideoElement, type: string): void {
  video.dispatchEvent(new Event(type));
}

function setMediaError(video: HTMLVideoElement, code: number | null): void {
  Object.defineProperty(video, 'error', {
    configurable: true,
    get: () => (code === null ? null : { code }),
  });
}

describe('VerticalImageItem video admission and playback', () => {
  let host: HTMLDivElement;
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    observers.clear();
    observerOptions.clear();
  });

  afterEach(() => {
    closeGallery();
    dispose?.();
    dispose = undefined;
    host.remove();
    vi.restoreAllMocks();
    observers.clear();
    observerOptions.clear();
  });

  function mount(
    initial: {
      media?: MediaInfo;
      active?: boolean;
      focused?: boolean;
      forceVisible?: boolean;
      index?: number;
      root?: HTMLElement;
      rootHeight?: number;
    } = {}
  ) {
    const item = initial.media ?? media();
    const [state, setState] = createSignal({
      media: item,
      active: initial.active ?? false,
      focused: initial.focused ?? false,
      forceVisible: initial.forceVisible ?? false,
      index: initial.index ?? 3,
      root: initial.root ?? host,
      rootHeight: initial.rootHeight ?? 480,
    });
    const onMediaLoad = vi.fn();
    dispose = render(
      () => (
        <VerticalImageItem
          media={state().media}
          index={state().index}
          isActive={state().active}
          isFocused={state().focused}
          forceVisible={state().forceVisible}
          onClick={vi.fn()}
          onMediaLoad={onMediaLoad}
          scrollRoot={() => state().root}
          scrollRootHeight={() => state().rootHeight}
        />
      ),
      host
    );
    const video = host.querySelector('video')!;
    const row = host.querySelector<HTMLElement>('[data-gallery-element="item"]')!;
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    return { item, video, row, setState, onMediaLoad };
  }

  it('keeps a distant video source-free, then admits it one viewport near via the shared observer', () => {
    const root = document.createElement('ul');
    host.append(root);
    const { video, row } = mount({ forceVisible: true, root, rootHeight: 480 });
    expect(video.hasAttribute('src')).toBe(false);
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.getAttribute('poster')).toBe(poster);
    expect(video.getAttribute('width')).toBe('640');
    expect(video.getAttribute('height')).toBe('360');
    expect(row.dataset.videoAdmitted).toBe('false');
    const near = observers.get('480px 0px')!;
    expect(observerOptions.get('480px 0px')?.root).toBe(root);
    expect(observerOptions.get('0px')?.root).toBe(root);
    near({ isIntersecting: false } as IntersectionObserverEntry);
    expect(video.hasAttribute('src')).toBe(false);
    near({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.getAttribute('src')).toBe(source('best'));
    expect(video.getAttribute('preload')).toBe('metadata');
    expect(row.dataset.videoAdmitted).toBe('true');
  });

  it('does not restore obsolete playback or mute while recovery finishes outside the scrollport', async () => {
    const root = document.createElement('ul');
    host.append(root);
    const { video } = mount({ active: true, root, rootHeight: 480 });
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
    let paused = false;
    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    const play = vi.spyOn(video, 'play').mockImplementation(() => {
      paused = false;
      mediaEvent(video, 'play');
      return Promise.resolve();
    });
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
      mediaEvent(video, 'pause');
    });
    mediaEvent(video, 'loadstart');
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    mediaEvent(video, 'play');
    video.muted = false;
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('middle'));
    observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
    expect(video.paused).toBe(true);
    expect(video.muted).toBe(true);
    setMediaError(video, null);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    await Promise.resolve();
    expect(video.paused).toBe(true);
    expect(video.muted).toBe(true);
    expect(play).not.toHaveBeenCalled();
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(play).toHaveBeenCalledOnce();
  });

  it('does not turn temporary scroll-out mute into user intent across two fallbacks', () => {
    const { video } = mount({ active: true });
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
    let paused = false;
    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    const play = vi.spyOn(video, 'play').mockImplementation(() => {
      paused = false;
      mediaEvent(video, 'play');
      return Promise.resolve();
    });
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
      mediaEvent(video, 'pause');
    });
    video.muted = false;
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'play');

    setMediaError(video, 3);
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('middle'));
    observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
    expect(video.muted).toBe(true);
    setMediaError(video, null);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    expect(play).not.toHaveBeenCalled();

    setMediaError(video, 3);
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('low'));
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.muted).toBe(false);
    expect(play).not.toHaveBeenCalled();
    setMediaError(video, null);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    expect(video.muted).toBe(false);
    expect(play).toHaveBeenCalledOnce();
  });

  it('replaces admission margins after resize and discards callbacks from a retired root', () => {
    const firstRoot = document.createElement('ul');
    const secondRoot = document.createElement('ul');
    host.append(firstRoot, secondRoot);
    const { video, setState } = mount({ root: firstRoot, rootHeight: 480 });
    const oldAdmission = observers.get('480px 0px')!;
    const oldVisibility = observers.get('0px')!;
    setState((current) => ({ ...current, rootHeight: 720 }));
    expect(observerOptions.get('720px 0px')?.root).toBe(firstRoot);
    oldAdmission({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.hasAttribute('src')).toBe(false);
    setState((current) => ({ ...current, root: secondRoot }));
    expect(observerOptions.get('720px 0px')?.root).toBe(secondRoot);
    oldVisibility({ isIntersecting: true } as IntersectionObserverEntry);
    oldAdmission({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.hasAttribute('src')).toBe(false);
    observers.get('720px 0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.getAttribute('src')).toBe(source('best'));
  });

  it('ignores a queued admission from the previous media object', () => {
    const { video, setState } = mount();
    const oldAdmission = observers.get('480px 0px')!;
    const replacement = media('333_api_1');
    setState((current) => ({ ...current, media: replacement }));
    oldAdmission({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.hasAttribute('src')).toBe(false);
    observers.get('480px 0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.getAttribute('src')).toBe(replacement.url);
  });

  it('keeps a later native-control pause during recovery after the replacement metadata arrives', () => {
    const { video } = mount({ active: true });
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
    let paused = false;
    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    const play = vi.spyOn(video, 'play').mockResolvedValue(undefined);
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
    });
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'play');
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    setMediaError(video, null);
    video.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    mediaEvent(video, 'pause');
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(play).not.toHaveBeenCalled();
  });

  it.each([
    { laterPlay: false, caseName: 'pause', rejectedName: null },
    { laterPlay: true, caseName: 'pause then play', rejectedName: null },
    { laterPlay: true, caseName: 'pause then blocked play', rejectedName: 'NotAllowedError' },
    { laterPlay: true, caseName: 'pause then unsupported play', rejectedName: 'NotSupportedError' },
    { laterPlay: true, caseName: 'pause then source-aborted play', rejectedName: 'AbortError' },
  ])(
    'keeps a body-captured Space $caseName as latest intent during pending fallback',
    async ({ laterPlay, rejectedName }) => {
      const item = media();
      openGallery([item]);
      resetKeyboardDebounceState();
      const { video } = mount({ media: item, active: true });
      Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
      let paused = false;
      Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
      const play = vi.spyOn(video, 'play').mockResolvedValue(undefined);
      const pause = vi.spyOn(video, 'pause').mockImplementation(() => {
        paused = true;
        mediaEvent(video, 'pause');
      });
      mediaEvent(video, 'loadstart');
      mediaEvent(video, 'play');
      setMediaError(video, 3);
      mediaEvent(video, 'error');
      expect(video.getAttribute('src')).toBe(source('middle'));
      setMediaError(video, null);
      play.mockClear();
      const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);

      const capture = (event: KeyboardEvent) =>
        handleKeyboardEvent(
          event,
          { onGalleryClose: vi.fn(), onMediaClick: vi.fn(async () => undefined) },
          {
            enableKeyboard: true,
            enableMediaDetection: true,
            debugMode: false,
            preventBubbling: true,
            context: 'test',
          }
        );
      document.body.addEventListener('keydown', capture, { capture: true });
      try {
        const keydownAtVideo = vi.fn();
        video.addEventListener('keydown', keydownAtVideo);
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        video.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(keydownAtVideo).not.toHaveBeenCalled();
        expect(video.paused).toBe(true);
        video.dispatchEvent(
          new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
        );
        expect(pause).toHaveBeenCalledOnce();
        expect(play).not.toHaveBeenCalled();
        if (laterPlay) {
          if (rejectedName) {
            play.mockRejectedValueOnce(new DOMException('Playback rejected', rejectedName));
          }
          clock.mockReturnValue(1200);
          video.dispatchEvent(
            new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
          );
          expect(play).toHaveBeenCalledOnce();
        }
      } finally {
        document.body.removeEventListener('keydown', capture, { capture: true });
      }
      await Promise.resolve();
      mediaEvent(video, 'loadstart');
      mediaEvent(video, 'loadedmetadata');
      const shouldResume = laterPlay && (rejectedName === null || rejectedName === 'AbortError');
      const beforeVisibility = shouldResume ? 2 : laterPlay ? 1 : 0;
      expect(play).toHaveBeenCalledTimes(beforeVisibility);
      observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
      observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
      expect(play).toHaveBeenCalledTimes(shouldResume ? 3 : beforeVisibility);
    }
  );

  it.each(['newer command', 'source replacement', 'media replacement'] as const)(
    'ignores an older rejected play after %s during fallback',
    async (change) => {
      const { video, row, setState } = mount({ active: true });
      Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
      let paused = false;
      Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
      let rejectOld!: (error: Error) => void;
      const play = vi
        .spyOn(video, 'play')
        .mockImplementationOnce(
          () =>
            new Promise<void>((_resolve, reject) => {
              rejectOld = reject;
            })
        )
        .mockResolvedValue(undefined);
      vi.spyOn(video, 'pause').mockImplementation(() => {
        paused = true;
      });
      mediaEvent(video, 'loadstart');
      mediaEvent(video, 'play');
      setMediaError(video, 3);
      mediaEvent(video, 'error');
      setMediaError(video, null);
      mediaEvent(video, 'loadstart');
      executeVideoControl('pause', { video });
      executeVideoControl('play', { video });
      expect(play).toHaveBeenCalledOnce();

      if (change === 'newer command') {
        executeVideoControl('pause', { video });
        executeVideoControl('play', { video });
      } else if (change === 'source replacement') {
        setMediaError(video, 3);
        mediaEvent(video, 'error');
        expect(video.getAttribute('src')).toBe(source('low'));
        setMediaError(video, null);
      } else {
        setState((current) => ({ ...current, media: media('333_api_1') }));
        await Promise.resolve();
        expect(host.querySelector('video')).toBe(video);
        observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
        mediaEvent(video, 'loadstart');
        mediaEvent(video, 'play');
        setMediaError(video, 3);
        mediaEvent(video, 'error');
        expect(video.getAttribute('src')).toBe(source('middle'));
        setMediaError(video, null);
        executeVideoControl('play', { video });
      }
      rejectOld(new DOMException('Old request blocked', 'NotAllowedError'));
      await Promise.resolve();
      mediaEvent(video, 'loadstart');
      mediaEvent(video, 'loadedmetadata');
      expect(row.dataset.mediaLoaded).toBe('true');
      expect(play).toHaveBeenCalledTimes(change === 'source replacement' ? 2 : 3);
    }
  );

  it('keeps later native-control volume and mute changes during recovery', () => {
    const { video } = mount({ active: true });
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
    Object.defineProperty(video, 'paused', { configurable: true, get: () => false });
    vi.spyOn(video, 'play').mockResolvedValue(undefined);
    video.volume = 0.4;
    video.muted = false;
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'play');
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    setMediaError(video, null);
    video.volume = 0.8;
    video.muted = true;
    mediaEvent(video, 'volumechange');
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    expect(video.volume).toBe(0.8);
    expect(video.muted).toBe(true);
  });

  it('restores automatic mute after an off-screen volume-only change', () => {
    const { video } = mount({ active: true });
    let paused = false;
    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
    });
    video.muted = false;
    observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
    expect(video.muted).toBe(true);
    video.volume = 0.7;
    mediaEvent(video, 'volumechange');
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.muted).toBe(false);
    expect(video.volume).toBe(0.7);
  });

  it('restores temporary mute when the item is replaced', () => {
    const { video, setState } = mount({ active: true });
    let paused = false;
    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
    });
    video.muted = false;
    observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
    expect(video.muted).toBe(true);
    setState((current) => ({ ...current, media: media('333_api_1') }));
    expect(video.muted).toBe(false);
  });

  it('waits for replacement metadata after re-entry and requests play only once', () => {
    const { video } = mount({ active: true });
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
    let paused = false;
    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    const play = vi.spyOn(video, 'play').mockImplementation(() => {
      paused = false;
      mediaEvent(video, 'play');
      return Promise.resolve();
    });
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
      mediaEvent(video, 'pause');
    });
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'play');
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(play).not.toHaveBeenCalled();
    setMediaError(video, null);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    mediaEvent(video, 'loadedmetadata');
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(play).toHaveBeenCalledOnce();
  });

  it('retains visible-play intent if an earlier play promise rejects after scroll-out', async () => {
    const { video } = mount({ active: true });
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
    let paused = false;
    Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
    vi.spyOn(video, 'pause').mockImplementation(() => {
      paused = true;
    });
    let rejectFirst: ((error: Error) => void) | undefined;
    const play = vi
      .spyOn(video, 'play')
      .mockImplementationOnce(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectFirst = reject;
          })
      )
      .mockResolvedValue(undefined);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'play');
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    setMediaError(video, null);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    expect(play).toHaveBeenCalledOnce();
    observers.get('0px')?.({ isIntersecting: false } as IntersectionObserverEntry);
    rejectFirst?.(new DOMException('Interrupted', 'AbortError'));
    await Promise.resolve();
    observers.get('0px')?.({ isIntersecting: true } as IntersectionObserverEntry);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('admits non-first active and keyboard-focused videos before observer delivery', () => {
    const { video, row, setState } = mount({ index: 4, active: true });
    expect(video.getAttribute('src')).toBe(source('best'));
    setState((current) => ({ ...current, active: false }));
    expect(video.getAttribute('src')).toBe(source('best'));
    expect(row.dataset.videoAdmitted).toBe('true');
    const second = media('333_api_1');
    setState((current) => ({ ...current, media: second, focused: false }));
    expect(video.hasAttribute('src')).toBe(false);
    setState((current) => ({ ...current, focused: true }));
    expect(video.getAttribute('src')).toBe(source('best'));
    expect(row.dataset.videoAdmitted).toBe('true');
  });

  it('keeps controls visible for metadata-only readiness and reports a first frame separately', () => {
    const { video, row, onMediaLoad } = mount({ active: true });
    let readyState = 1;
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => readyState });
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    expect(row.dataset.mediaLoaded).toBe('true');
    expect(row.dataset.videoFirstFrame).toBe('false');
    expect(video.controls).toBe(true);
    expect(video.className).not.toContain('loading');
    expect(onMediaLoad).toHaveBeenCalledOnce();
    readyState = 2;
    mediaEvent(video, 'loadeddata');
    expect(row.dataset.videoFirstFrame).toBe('true');
    expect(onMediaLoad).toHaveBeenCalledOnce();
  });

  it('switches only owned MP4 playback sources and preserves the preferred download and playback state', async () => {
    const item = media();
    const { video, row, setState, onMediaLoad } = mount({ media: item, active: true });
    let readyState = 1;
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => readyState });
    Object.defineProperty(video, 'paused', { configurable: true, get: () => false });
    const play = vi.spyOn(video, 'play').mockResolvedValue(undefined);
    video.currentTime = 12;
    video.volume = 0.4;
    video.muted = true;
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    mediaEvent(video, 'play');
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('middle'));
    expect(item.url).toBe(source('best'));
    expect(item.downloadSource?.url).toBe(source('best'));
    expect(row.textContent).toContain('msg.gal.video.playbackFallback');
    setMediaError(video, null);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    await Promise.resolve();
    expect(video.currentTime).toBe(12);
    expect(video.volume).toBe(0.4);
    expect(video.muted).toBe(true);
    expect(play).toHaveBeenCalledOnce();
    expect(onMediaLoad).toHaveBeenCalledOnce();
    readyState = 2;
    mediaEvent(video, 'loadeddata');
    expect(row.dataset.videoFirstFrame).toBe('true');
    setState((current) => ({ ...current, index: 1 }));
    expect(video.getAttribute('src')).toBe(source('middle'));
    expect(row.dataset.mediaLoaded).toBe('true');
    expect(row.dataset.videoFirstFrame).toBe('true');
  });

  it('does not force play after a user pause or a blocked play promise', async () => {
    const { video } = mount({ active: true });
    Object.defineProperty(video, 'readyState', { configurable: true, get: () => 1 });
    const play = vi
      .spyOn(video, 'play')
      .mockRejectedValue(new DOMException('Blocked', 'NotAllowedError'));
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'play');
    mediaEvent(video, 'pause');
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    setMediaError(video, null);
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'loadedmetadata');
    await Promise.resolve();
    expect(play).not.toHaveBeenCalled();
  });

  it('stops after three distinct attempts and ignores stale source and teardown events', () => {
    const { video, row } = mount({ active: true });
    let currentSrc = source('best');
    Object.defineProperty(video, 'currentSrc', { configurable: true, get: () => currentSrc });
    mediaEvent(video, 'loadstart');
    setMediaError(video, 3);
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('middle'));
    mediaEvent(video, 'error'); // Old source still selected: no second switch.
    expect(video.getAttribute('src')).toBe(source('middle'));
    currentSrc = source('middle');
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('low'));
    currentSrc = source('low');
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'error');
    expect(row.querySelector('[role="alert"]')).not.toBeNull();
    expect(video.getAttribute('src')).toBe(source('low'));
    dispose?.();
    dispose = undefined;
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('low'));
  });

  it('keeps an exposed 403 on the current attempt from selecting another rendition', () => {
    const { video, row } = mount({ active: true });
    mediaEvent(video, 'loadstart');
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([
      {
        startTime: performance.now(),
        responseStatus: 403,
      } as unknown as PerformanceResourceTiming,
    ]);
    setMediaError(video, 4);
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('best'));
    expect(row.querySelector('[role="alert"]')).not.toBeNull();
  });

  it.each([1, 2])('does not switch a media error code %i', (code) => {
    const { video } = mount({ active: true });
    mediaEvent(video, 'loadstart');
    setMediaError(video, code);
    mediaEvent(video, 'error');
    expect(video.getAttribute('src')).toBe(source('best'));
  });

  it('does not switch an ordinary stalled source', () => {
    const { video } = mount({ active: true });
    mediaEvent(video, 'loadstart');
    mediaEvent(video, 'stalled');
    expect(video.getAttribute('src')).toBe(source('best'));
  });
});

describe('video recovery candidate contract', () => {
  it('caps attempts and rejects untrusted, repeated, and manifest candidates', () => {
    const item = {
      ...media(),
      videoVariants: [
        { url: source('best'), contentType: 'video/mp4' as const },
        {
          url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/stream.m3u8',
          contentType: 'video/mp4' as const,
        },
        { url: 'https://evil.example/clip.mp4', contentType: 'video/mp4' as const },
        { url: source('middle'), contentType: 'video/mp4' as const },
      ],
    };
    expect(nextVideoPlaybackSource(item, new Set([source('best')]))).toBe(source('middle'));
    expect(
      nextVideoPlaybackSource(item, new Set([source('best'), source('middle'), source('low')]))
    ).toBeNull();
    expect(MAX_VIDEO_PLAYBACK_ATTEMPTS).toBe(3);
  });
});
