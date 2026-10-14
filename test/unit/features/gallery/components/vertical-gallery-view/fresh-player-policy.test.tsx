// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { render } from 'solid-js/web';
import { afterEach, expect, it, vi } from 'vitest';

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
