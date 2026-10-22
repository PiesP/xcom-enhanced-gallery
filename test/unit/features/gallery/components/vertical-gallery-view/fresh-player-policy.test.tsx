// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { useVideoVolumePersistence } from '@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence';
import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { closeGallery, openGallery } from '@shared/state/signals/gallery.signals';
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, expect, it, vi } from 'vite-plus/test';

vi.mock('@shared/utils/performance/observer-pool', () => ({
  SharedObserver: { observe: () => () => undefined },
}));
vi.mock('@shared/hooks/use-translation', () => ({ useTranslation: () => (key: string) => key }));

afterEach(() => {
  clearSettings();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('persists an immediate native volume return to the pre-restore level', async () => {
  vi.useFakeTimers();
  const set = vi.fn().mockResolvedValue(undefined);
  registerSettings({
    get: (key) =>
      key === 'gallery.videoVolume' ? 0.9 : key === 'gallery.videoMuted' ? false : undefined,
    set,
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = render(
    () => (
      <VerticalImageItem
        media={{
          id: '222_api_0',
          type: 'video',
          url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/one.mp4',
        }}
        index={0}
        isActive={true}
        isFocused={true}
        onClick={() => undefined}
        scrollRoot={() => host}
        scrollRootHeight={() => 480}
      />
    ),
    host
  );
  try {
    const video = host.querySelector('video');
    expect(video).not.toBeNull();
    if (!video) {
      throw new Error('Gallery video was not rendered');
    }
    expect(video.volume).toBe(0.9);
    expect(video.muted).toBe(false);

    video.volume = 1;
    video.dispatchEvent(new Event('volumechange'));
    await vi.advanceTimersByTimeAsync(300);

    expect(set).toHaveBeenCalledWith('gallery.videoVolume', 1);
  } finally {
    dispose();
    host.remove();
  }
});

it('ignores actual programmatic changes and persists user volume and mute changes', async () => {
  vi.useFakeTimers();
  const set = vi.fn().mockResolvedValue(undefined);
  const onUserVolumeChange = vi.fn();
  registerSettings({
    get: (key) =>
      key === 'gallery.videoVolume' ? 0.4 : key === 'gallery.videoMuted' ? true : undefined,
    set,
  });
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = render(() => {
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);
    const { handleVolumeChange } = useVideoVolumePersistence({
      videoRef,
      isVideo: () => true,
      onUserVolumeChange,
    });
    // biome-ignore lint/a11y/useMediaCaption: This test-only video has no media source or audio.
    return <video ref={setVideoRef} onVolumeChange={handleVolumeChange} />;
  }, host);
  try {
    const video = host.querySelector('video');
    expect(video).not.toBeNull();
    if (!video) {
      throw new Error('Gallery video was not rendered');
    }
    expect(video.volume).toBe(0.4);
    expect(video.muted).toBe(true);

    video.dispatchEvent(new Event('volumechange'));
    await vi.advanceTimersByTimeAsync(300);
    expect(set).not.toHaveBeenCalled();
    expect(onUserVolumeChange).not.toHaveBeenCalled();

    video.muted = false;
    video.dispatchEvent(new Event('volumechange'));
    await vi.advanceTimersByTimeAsync(300);
    expect(onUserVolumeChange).toHaveBeenCalledWith(video);
    expect(set).toHaveBeenCalledWith('gallery.videoMuted', false);

    set.mockClear();
    video.volume = 0.6;
    video.dispatchEvent(new Event('volumechange'));
    await vi.advanceTimersByTimeAsync(300);
    expect(set).toHaveBeenCalledWith('gallery.videoVolume', 0.6);
    expect(set).toHaveBeenCalledWith('gallery.videoMuted', false);
  } finally {
    dispose();
    host.remove();
  }
});

it('starts a separate player at zero with saved XEG preferences and never resumes the host on disposal', () => {
  registerSettings({
    get: (key) =>
      key === 'gallery.videoVolume' ? 0.42 : key === 'gallery.videoMuted' ? false : undefined,
    set: async () => undefined,
  });
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  const native = document.createElement('video');
  native.currentTime = 12;
  native.volume = 0.91;
  native.muted = true;
  document.body.append(native);
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = render(
    () => (
      <VerticalImageItem
        media={{
          id: '222_api_0',
          type: 'video',
          url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/one.mp4',
        }}
        index={0}
        isActive={true}
        isFocused={true}
        onClick={() => undefined}
        scrollRoot={() => host}
        scrollRootHeight={() => 480}
      />
    ),
    host
  );
  try {
    const galleryVideo = host.querySelector('video');
    expect(galleryVideo).not.toBe(native);
    expect(galleryVideo?.currentTime).toBe(0);
    expect(galleryVideo?.paused).toBe(true);
    expect(galleryVideo?.volume).toBe(0.42);
    expect(galleryVideo?.muted).toBe(false);
    expect(play).not.toHaveBeenCalled();
  } finally {
    dispose();
  }
  expect(native.currentTime).toBe(12);
  expect(native.volume).toBe(0.91);
  expect(native.muted).toBe(true);
  expect(play).not.toHaveBeenCalled();
});

it('flushes the last live volume choice but ignores retired video events after reopening', async () => {
  vi.useFakeTimers();
  const stored = new Map<string, unknown>([
    ['gallery.videoVolume', 0.9],
    ['gallery.videoMuted', false],
  ]);
  const set = vi.fn(async (key: string, value: unknown) => {
    stored.set(key, value);
  });
  registerSettings({ get: (key) => stored.get(key), set });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  const host = document.createElement('div');
  document.body.append(host);
  const mountPlayer = (post: string) => {
    const item = {
      id: `${post}_api_0`,
      type: 'video' as const,
      url: `https://video.twimg.com/ext_tw_video/${post}/pu/vid/one.mp4`,
    };
    openGallery([item]);
    const dispose = render(
      () => (
        <VerticalImageItem
          media={item}
          index={0}
          isActive={true}
          isFocused={true}
          onClick={() => undefined}
          scrollRoot={() => host}
          scrollRootHeight={() => 480}
        />
      ),
      host
    );
    const video = host.querySelector('video');
    if (!video) {
      throw new Error('Gallery video was not rendered');
    }
    return { video, dispose };
  };
  let disposeOld: (() => void) | undefined;
  let disposeCurrent: (() => void) | undefined;
  try {
    const old = mountPlayer('222');
    disposeOld = old.dispose;
    old.video.volume = 0.6;
    old.video.muted = true;
    old.video.dispatchEvent(new Event('volumechange'));
    expect(set).not.toHaveBeenCalled();
    closeGallery();
    disposeOld();
    disposeOld = undefined;
    expect(old.video.isConnected).toBe(false);
    expect(set.mock.calls).toEqual([
      ['gallery.videoVolume', 0.6],
      ['gallery.videoMuted', true],
    ]);

    const current = mountPlayer('333');
    disposeCurrent = current.dispose;
    expect(current.video.volume).toBe(0.6);
    expect(current.video.muted).toBe(true);
    current.video.volume = 0.25;
    current.video.muted = false;
    current.video.dispatchEvent(new Event('volumechange'));
    await vi.advanceTimersByTimeAsync(300);
    expect(stored.get('gallery.videoVolume')).toBe(0.25);
    set.mockClear();

    old.video.volume = 0.8;
    old.video.muted = false;
    old.video.dispatchEvent(new Event('volumechange'));
    await vi.advanceTimersByTimeAsync(300);
    expect(set).not.toHaveBeenCalled();
    expect(stored.get('gallery.videoVolume')).toBe(0.25);
    expect(stored.get('gallery.videoMuted')).toBe(false);
    expect(current.video.volume).toBe(0.25);
    expect(current.video.muted).toBe(false);

    current.video.volume = 0.4;
    current.video.muted = true;
    current.video.dispatchEvent(new Event('volumechange'));
    await vi.advanceTimersByTimeAsync(300);
    expect(set.mock.calls).toEqual([
      ['gallery.videoVolume', 0.4],
      ['gallery.videoMuted', true],
    ]);
  } finally {
    closeGallery();
    disposeOld?.();
    disposeCurrent?.();
    host.remove();
  }
});
