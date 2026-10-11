// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaInfo } from '@shared/types/media.types';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const observers = new Map<string, (entry: IntersectionObserverEntry) => void>();

vi.mock('@shared/utils/performance/observer-pool', () => ({
  SharedObserver: {
    observe: (_element: Element, callback: (entry: IntersectionObserverEntry) => void, options: IntersectionObserverInit) => {
      observers.set(options.rootMargin ?? '', callback);
      return () => { observers.delete(options.rootMargin ?? ''); };
    },
  },
}));
vi.mock('@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence', () => ({
  useVideoVolumePersistence: () => ({
    applyMutedProgrammatically: (video: HTMLVideoElement, muted: boolean) => { video.muted = muted; },
    applyVolumeProgrammatically: (video: HTMLVideoElement, volume: number) => { video.volume = volume; },
    handleVolumeChange: vi.fn(),
  }),
}));
vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { MAX_VIDEO_PLAYBACK_ATTEMPTS, nextVideoPlaybackSource } from '@features/gallery/components/vertical-gallery-view/utils/video-playback-recovery';

const source = (name: string): string => `https://video.twimg.com/ext_tw_video/222/pu/vid/${name}.mp4`;
const poster = 'https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/poster.jpg';
const variants = ['best', 'middle', 'low', 'fourth'].map((name) => ({ url: source(name), contentType: 'video/mp4' as const }));

function media(id = '222_api_0'): MediaInfo {
  return {
    id, type: 'video', url: source('best'), thumbnailUrl: poster,
    width: 640, height: 360, videoVariants: variants,
    downloadSource: { url: source('best'), quality: 'best-mp4', provenance: 'api' },
  };
}

function mediaEvent(video: HTMLVideoElement, type: string): void {
  video.dispatchEvent(new Event(type));
}

function setMediaError(video: HTMLVideoElement, code: number | null): void {
  Object.defineProperty(video, 'error', { configurable: true, get: () => code === null ? null : { code } });
}

describe('VerticalImageItem video admission and playback', () => {
  let host: HTMLDivElement;
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    observers.clear();
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    host.remove();
    vi.restoreAllMocks();
    observers.clear();
  });

  function mount(initial: { media?: MediaInfo; active?: boolean; focused?: boolean; forceVisible?: boolean; index?: number } = {}) {
    const item = initial.media ?? media();
    const [state, setState] = createSignal({
      media: item, active: initial.active ?? false, focused: initial.focused ?? false,
      forceVisible: initial.forceVisible ?? false,
      index: initial.index ?? 3,
    });
    const onMediaLoad = vi.fn();
    dispose = render(() => (
      <VerticalImageItem
        media={state().media}
        index={state().index}
        isActive={state().active}
        isFocused={state().focused}
        forceVisible={state().forceVisible}
        onClick={vi.fn()}
        onMediaLoad={onMediaLoad}
      />
    ), host);
    const video = host.querySelector('video')!;
    const row = host.querySelector<HTMLElement>('[data-gallery-element="item"]')!;
    return { item, video, row, setState, onMediaLoad };
  }

  it('keeps a distant video source-free, then admits it one viewport near via the shared observer', () => {
    const { video, row } = mount({ forceVisible: true });
    expect(video.hasAttribute('src')).toBe(false);
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.getAttribute('poster')).toBe(poster);
    expect(video.getAttribute('width')).toBe('640');
    expect(video.getAttribute('height')).toBe('360');
    expect(row.dataset.videoAdmitted).toBe('false');
    const near = observers.get('100% 0px')!;
    near({ isIntersecting: false } as IntersectionObserverEntry);
    expect(video.hasAttribute('src')).toBe(false);
    near({ isIntersecting: true } as IntersectionObserverEntry);
    expect(video.getAttribute('src')).toBe(source('best'));
    expect(video.getAttribute('preload')).toBe('metadata');
    expect(row.dataset.videoAdmitted).toBe('true');
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
    const play = vi.spyOn(video, 'play').mockRejectedValue(new DOMException('Blocked', 'NotAllowedError'));
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
    vi.spyOn(performance, 'getEntriesByName').mockReturnValue([{
      startTime: performance.now(), responseStatus: 403,
    } as unknown as PerformanceResourceTiming]);
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
    const item = { ...media(), videoVariants: [
      { url: source('best'), contentType: 'video/mp4' as const },
      { url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/stream.m3u8', contentType: 'video/mp4' as const },
      { url: 'https://evil.example/clip.mp4', contentType: 'video/mp4' as const },
      { url: source('middle'), contentType: 'video/mp4' as const },
    ] };
    expect(nextVideoPlaybackSource(item, new Set([source('best')]))).toBe(source('middle'));
    expect(nextVideoPlaybackSource(item, new Set([source('best'), source('middle'), source('low')]))).toBeNull();
    expect(MAX_VIDEO_PLAYBACK_ATTEMPTS).toBe(3);
  });
});
