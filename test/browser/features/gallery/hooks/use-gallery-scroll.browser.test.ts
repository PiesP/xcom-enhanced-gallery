// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { useGalleryScroll } from '@features/gallery/hooks/use-gallery-scroll';
import {
  closeGallery,
  disposeGallerySignals,
  openGallery,
} from '@shared/state/signals/gallery.signals';
import { createRoot } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

function startTracking(programmaticScrollTimestamp = () => 0) {
  const container = document.createElement('div');
  container.className = 'xeg-gallery-container';
  const items = document.createElement('div');
  items.dataset.galleryElement = 'items';
  container.append(items);
  document.body.append(container);
  openGallery([{ id: 'image-1', type: 'image', url: 'https://pbs.twimg.com/media/image-1.jpg' }]);
  const onScrollEnd = vi.fn();
  const result = createRoot((dispose) => ({
    tracking: useGalleryScroll({
      container,
      scrollTarget: items,
      enabled: () => true,
      onScrollEnd,
      programmaticScrollTimestamp,
    }),
    dispose,
  }));
  return { container, items, onScrollEnd, ...result };
}

describe('gallery native scroll completion', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    disposeGallerySignals();
    document.body.replaceChildren();
  });

  it('settles actual displacement only on scrollend and ignores a later stale completion', () => {
    vi.useFakeTimers();
    const { items, tracking, onScrollEnd, dispose } = startTracking();
    items.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 40 }));
    expect(tracking.isScrolling()).toBe(true);
    items.dispatchEvent(new Event('scroll'));
    items.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 40 }));
    vi.runAllTimers();
    expect(tracking.isScrolling()).toBe(true);
    expect(onScrollEnd).not.toHaveBeenCalled();

    items.dispatchEvent(new Event('scrollend'));
    expect(tracking.isScrolling()).toBe(false);
    expect(onScrollEnd).toHaveBeenCalledOnce();
    items.dispatchEvent(new Event('scrollend'));
    expect(onScrollEnd).toHaveBeenCalledOnce();
    dispose();
  });

  it('bounds wheel input without displacement and retains its user timestamp', () => {
    vi.useFakeTimers();
    const { items, tracking, onScrollEnd, dispose } = startTracking();
    items.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 40 }));
    const wheelAt = tracking.lastScrollTime();
    expect(tracking.isScrolling()).toBe(true);
    items.dispatchEvent(new Event('scrollend'));
    expect(tracking.isScrolling()).toBe(true);
    vi.runAllTimers();
    expect(tracking.isScrolling()).toBe(false);
    expect(tracking.lastScrollTime()).toBe(wheelAt);
    expect(onScrollEnd).toHaveBeenCalledOnce();
    dispose();
  });

  it('ignores nested toolbar wheel input and clears state on dispose', () => {
    vi.useFakeTimers();
    const { items, container, tracking, onScrollEnd, dispose } = startTracking();
    const toolbar = document.createElement('div');
    toolbar.dataset.galleryElement = 'toolbar';
    items.append(toolbar);
    toolbar.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 50 }));
    expect(tracking.isScrolling()).toBe(false);
    items.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 50 }));
    expect(tracking.isScrolling()).toBe(true);
    dispose();
    vi.runAllTimers();
    expect(tracking.isScrolling()).toBe(false);
    expect(onScrollEnd).not.toHaveBeenCalled();
    expect(container.isConnected).toBe(true);
    closeGallery();
  });

  it('keeps programmatic scroll excluded while a newer wheel owns real displacement', () => {
    vi.useFakeTimers();
    const now = vi.spyOn(performance, 'now').mockReturnValue(105);
    const { items, tracking, onScrollEnd, dispose } = startTracking(() => 100);
    items.dispatchEvent(new Event('scroll'));
    now.mockReturnValue(300);
    items.dispatchEvent(new Event('scroll'));
    items.dispatchEvent(new Event('scrollend'));
    expect(tracking.isScrolling()).toBe(false);
    expect(tracking.lastScrollTime()).toBe(0);
    expect(onScrollEnd).not.toHaveBeenCalled();

    items.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 40 }));
    items.dispatchEvent(new Event('scroll'));
    vi.runAllTimers();
    expect(tracking.isScrolling()).toBe(true);
    items.dispatchEvent(new Event('scrollend'));
    expect(tracking.isScrolling()).toBe(false);
    expect(onScrollEnd).toHaveBeenCalledOnce();
    dispose();
  });
});
