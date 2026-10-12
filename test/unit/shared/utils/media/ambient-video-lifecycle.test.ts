// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { activateGalleryHostState, restoreActiveGalleryHostState } from '@shared/components/isolation/gallery-host-state';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Native media is a boundary in jsdom; real progression is checked in installed Edge.
function hostVideo(parent: HTMLElement = document.body) {
  const video = document.createElement('video');
  let paused = false;
  Object.defineProperty(video, 'paused', { get: () => paused });
  const pause = vi.spyOn(video, 'pause').mockImplementation(() => { paused = true; });
  const play = () => { paused = false; video.dispatchEvent(new Event('play')); };
  parent.append(video);
  return { video, pause, play };
}

function modal() {
  const container = document.createElement('div');
  container.className = 'xeg-gallery-container';
  container.tabIndex = -1;
  document.body.append(container);
  return { container, state: activateGalleryHostState(container) };
}

describe('modal-owned ambient playback suppression', () => {
  afterEach(() => {
    restoreActiveGalleryHostState();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('pauses on activation and subsequent play, leaving gallery media and host properties intact', () => {
    const host = hostVideo();
    host.video.src = 'https://video.twimg.com/ext_tw_video/222/pu/vid/one.mp4';
    host.video.currentTime = 12;
    host.video.volume = 0.3;
    host.video.muted = true;
    const { container, state } = modal();
    expect(host.video.paused).toBe(true);
    host.play();
    expect(host.video.paused).toBe(true);
    const own = hostVideo(container);
    own.play();
    expect(own.pause).not.toHaveBeenCalled();
    expect(host.video.currentTime).toBe(12);
    expect(host.video.volume).toBe(0.3);
    expect(host.video.muted).toBe(true);
    expect(host.video.src).toContain('/one.mp4');
    state.restore();
    host.play();
    expect(host.video.paused).toBe(false);
  });

  it('inspects inserted roots and subtrees already playing before insertion', async () => {
    const { state } = modal();
    const detached = document.createElement('div');
    const direct = hostVideo(detached);
    const nested = hostVideo(detached);
    direct.play();
    nested.play();
    document.body.append(direct.video, detached);
    await Promise.resolve();
    expect(direct.video.paused).toBe(true);
    expect(nested.video.paused).toBe(true);
    state.restore();
    direct.play();
    nested.play();
    expect(direct.video.paused).toBe(false);
    expect(nested.video.paused).toBe(false);
  });

  it('releases pending insertion and listeners on recovery and session replacement', async () => {
    const host = hostVideo();
    const first = modal();
    const detached = document.createElement('div');
    const added = hostVideo(detached);
    document.body.append(added.video);
    first.state.restore();
    await Promise.resolve();
    expect(added.pause).not.toHaveBeenCalled();
    const second = modal();
    const calls = host.pause.mock.calls.length;
    first.state.restore(); // A stale restore cannot release the current owner.
    host.play();
    expect(host.pause).toHaveBeenCalledTimes(calls + 1);
    second.state.restore();
    host.play();
    expect(host.video.paused).toBe(false);
    expect(host.pause).toHaveBeenCalledTimes(calls + 1);
  });
});
