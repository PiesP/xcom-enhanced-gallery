// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

describe('FocusCoordinator for mixed-size media', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('selects the visible item from current geometry when observer delivery would lag scrollend', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const container = document.createElement('div');
    const photo = document.createElement('div');
    const video = document.createElement('div');
    container.append(photo, video);
    document.body.append(container);
    let videoTop = 363;
    vi.spyOn(container, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 0, height: 800 }) as DOMRect
    );
    vi.spyOn(photo, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 0, height: 330 }) as DOMRect
    );
    vi.spyOn(video, 'getBoundingClientRect').mockImplementation(
      () => ({ top: videoTop, height: 180 }) as DOMRect
    );

    const onFocusChange = vi.fn();
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => 1,
      onFocusChange,
    });
    coordinator.registerItem(0, photo);
    coordinator.registerItem(1, video);
    coordinator.updateFocus(true);
    frames.shift()?.(0);
    expect(onFocusChange).toHaveBeenLastCalledWith(1, 'auto');

    videoTop = 770;
    coordinator.updateFocus(true);
    frames.shift()?.(0);
    expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');
    coordinator.cleanup();
  });

  it('selects a newly visible last item after wheel scrolling without waiting for an observer entry', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    const container = document.createElement('div');
    const first = document.createElement('div');
    const last = document.createElement('div');
    container.append(first, last);
    document.body.append(container);
    vi.spyOn(container, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 0, height: 800 }) as DOMRect
    );
    vi.spyOn(first, 'getBoundingClientRect').mockImplementation(
      () => ({ top: -900, height: 600 }) as DOMRect
    );
    vi.spyOn(last, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 100, height: 600 }) as DOMRect
    );

    const onFocusChange = vi.fn();
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => 0,
      onFocusChange,
    });
    coordinator.registerItem(0, first);
    coordinator.registerItem(2, last);
    coordinator.updateFocus(true);
    frames.shift()?.(0);
    expect(onFocusChange).toHaveBeenLastCalledWith(2, 'auto');
    coordinator.cleanup();
  });
});
