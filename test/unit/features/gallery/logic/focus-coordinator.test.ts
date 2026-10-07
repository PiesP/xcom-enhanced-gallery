// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';
import { SharedObserver } from '@shared/utils/performance/observer-pool';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('FocusCoordinator for mixed-size media', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('republishes the selected video after a stale observer update, then follows real scroll', () => {
    const observerCallbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();
    vi.spyOn(SharedObserver, 'observe').mockImplementation((element, callback) => {
      observerCallbacks.set(element, callback);
      return () => observerCallbacks.delete(element);
    });
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
    vi.spyOn(container, 'getBoundingClientRect').mockImplementation(() =>
      ({ top: 0, height: 800 }) as DOMRect
    );
    vi.spyOn(photo, 'getBoundingClientRect').mockImplementation(() =>
      ({ top: 0, height: 330 }) as DOMRect
    );
    vi.spyOn(video, 'getBoundingClientRect').mockImplementation(() =>
      ({ top: videoTop, height: 180 }) as DOMRect
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
    observerCallbacks.get(photo)?.({ isIntersecting: true } as IntersectionObserverEntry);
    // The video observer has not delivered its post-load visibility entry yet.
    coordinator.updateFocus(true);
    frames.shift()?.(0);
    expect(onFocusChange).toHaveBeenLastCalledWith(1, 'auto');

    videoTop = 770;
    coordinator.updateFocus(true);
    frames.shift()?.(0);
    expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');
    coordinator.cleanup();
  });
});
