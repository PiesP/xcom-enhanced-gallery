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

function exposeScrollableSurface(items: HTMLElement): void {
  Object.defineProperties(items, {
    clientHeight: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, value: 300 },
  });
}

function pressScrollSurface(items: HTMLElement): void {
  items.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 50,
      clientY: 50,
      isPrimary: true,
      pointerType: 'mouse',
    })
  );
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

  it('lets explicit navigation supersede a boundary wheel before its idle deadline', () => {
    vi.useFakeTimers();
    const now = vi.spyOn(performance, 'now').mockReturnValue(100);
    let programmaticAt = 0;
    const { items, tracking, onScrollEnd, dispose } = startTracking(() => programmaticAt);
    items.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 40 }));
    expect(tracking.isScrolling()).toBe(true);
    expect(tracking.lastScrollTime()).toBe(100);

    tracking.beginProgrammaticScroll();
    programmaticAt = 110;
    now.mockReturnValue(115);
    items.dispatchEvent(new Event('scroll'));
    now.mockReturnValue(300);
    items.dispatchEvent(new Event('scroll'));
    items.dispatchEvent(new Event('scrollend'));
    vi.runAllTimers();

    expect(tracking.isScrolling()).toBe(false);
    expect(tracking.lastScrollTime()).toBeLessThan(programmaticAt);
    expect(onScrollEnd).not.toHaveBeenCalled();
    dispose();
  });

  it('lets redirected background wheel reclaim a smooth programmatic scroll', () => {
    vi.useFakeTimers();
    const now = vi.spyOn(performance, 'now').mockReturnValue(105);
    const programmaticAt = 100;
    const { items, tracking, onScrollEnd, dispose } = startTracking(() => programmaticAt);
    items.dispatchEvent(new Event('scroll'));
    expect(tracking.isScrolling()).toBe(false);

    now.mockReturnValue(120);
    tracking.claimRedirectedWheel();
    items.dispatchEvent(new Event('scroll'));
    vi.runAllTimers();
    expect(tracking.isScrolling()).toBe(true);
    expect(tracking.lastScrollTime()).toBeGreaterThan(programmaticAt);
    items.dispatchEvent(new Event('scrollend'));
    expect(tracking.isScrolling()).toBe(false);
    expect(onScrollEnd).toHaveBeenCalledOnce();
    dispose();
  });

  it('releases smooth navigation to direct scroll-surface input before cancellation scrollend', () => {
    vi.useFakeTimers();
    const now = vi.spyOn(performance, 'now').mockReturnValue(105);
    const { items, tracking, onScrollEnd, dispose } = startTracking(() => 100);
    exposeScrollableSurface(items);
    Object.defineProperty(items, 'scrollTop', { configurable: true, value: 60 });
    const stopAnimation = vi.spyOn(items, 'scrollTo').mockImplementation(() => {});
    items.dispatchEvent(new Event('scroll'));
    now.mockReturnValue(300); // Smooth navigation outlives the initial timestamp window.

    pressScrollSurface(items);
    expect(stopAnimation).toHaveBeenCalledWith({ left: 0, top: 60, behavior: 'instant' });
    expect(tracking.lastScrollTime()).toBe(300);
    items.dispatchEvent(new Event('scrollend')); // Cancellation before manual movement.
    expect(tracking.isScrolling()).toBe(true);
    expect(onScrollEnd).not.toHaveBeenCalled();

    now.mockReturnValue(320);
    items.dispatchEvent(new Event('scroll')); // User-selected position.
    vi.runAllTimers();
    expect(tracking.lastScrollTime()).toBe(320);
    expect(tracking.isScrolling()).toBe(true);
    items.dispatchEvent(new Event('scrollend'));
    items.dispatchEvent(new Event('scrollend')); // No duplicate completion.
    expect(tracking.isScrolling()).toBe(false);
    expect(onScrollEnd).toHaveBeenCalledOnce();
    dispose();
  });

  it('ignores descendant controls and bounds direct interruption without displacement', () => {
    vi.useFakeTimers();
    const now = vi.spyOn(performance, 'now').mockReturnValue(100);
    let programmaticAt = 0;
    const { items, tracking, onScrollEnd, dispose } = startTracking(() => programmaticAt);
    exposeScrollableSurface(items); // Includes engines with zero-width overlay scrollbars.
    const stopAnimation = vi.spyOn(items, 'scrollTo').mockImplementation(() => {});
    const button = document.createElement('button');
    items.append(button);
    pressScrollSurface(items); // Ordinary surface press has no scroll ownership.
    expect(tracking.isScrolling()).toBe(false);

    programmaticAt = 100;
    now.mockReturnValue(105);
    items.dispatchEvent(new Event('scroll'));
    now.mockReturnValue(200);
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 50,
        isPrimary: true,
        pointerType: 'mouse',
      })
    );
    expect(tracking.isScrolling()).toBe(false);
    expect(tracking.lastScrollTime()).toBe(0);
    expect(stopAnimation).not.toHaveBeenCalled();

    pressScrollSurface(items);
    expect(tracking.isScrolling()).toBe(true);
    expect(tracking.lastScrollTime()).toBe(200);
    expect(stopAnimation).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(tracking.isScrolling()).toBe(false);
    expect(onScrollEnd).toHaveBeenCalledOnce();

    programmaticAt = 300;
    now.mockReturnValue(305);
    items.dispatchEvent(new Event('scroll'));
    pressScrollSurface(items);
    tracking.beginProgrammaticScroll();
    vi.runAllTimers();
    expect(tracking.isScrolling()).toBe(false);
    expect(onScrollEnd).toHaveBeenCalledOnce();
    dispose();
  });
});
