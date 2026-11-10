// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { useGalleryItemScroll } from '@features/gallery/hooks/use-gallery-item-scroll';
import { createRoot, createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('useGalleryItemScroll', () => {
  it('lets an explicit destination start while boundary wheel activity is pending', () => {
    const container = document.createElement('div');
    const items = document.createElement('div');
    items.dataset.galleryElement = 'items';
    const item = document.createElement('div');
    item.dataset.galleryElement = 'item';
    items.append(item);
    container.append(items);
    const scrollIntoView = vi.fn();
    item.scrollIntoView = scrollIntoView;
    const onScrollStart = vi.fn();
    let scrollToItem: (index: number) => void = () => {};

    const dispose = createRoot((rootDispose) => {
      ({ scrollToItem } = useGalleryItemScroll(
        () => container,
        () => 0,
        () => 1,
        {
          // Explicit navigation remains eligible; isScrolling reflects the
          // earlier wheel until onScrollStart transfers ownership.
          enabled: () => true,
          isScrolling: () => true,
          onScrollStart,
        }
      ));
      return rootDispose;
    });

    scrollToItem(0);
    expect(onScrollStart).toHaveBeenCalledOnce();
    expect(scrollIntoView).toHaveBeenCalledOnce();
    dispose();
  });

  it('realigns after layout changes without taking position from active user scrolling', () => {
    const container = document.createElement('div');
    const items = document.createElement('div');
    items.dataset.galleryElement = 'items';
    const item = document.createElement('div');
    item.dataset.galleryElement = 'item';
    items.append(item);
    container.append(items);

    const scrollIntoView = vi.fn();
    item.scrollIntoView = scrollIntoView;
    const onScrollStart = vi.fn();
    let setScrolling: (value: boolean) => void = () => {};
    let realignToItem: (index: number) => void = () => {};

    const dispose = createRoot((rootDispose) => {
      const [isScrolling, updateScrolling] = createSignal(true);
      setScrolling = updateScrolling;
      ({ realignToItem } = useGalleryItemScroll(
        () => container,
        () => 0,
        () => 1,
        {
          // Simulate a scroll-source navigation, which disables ordinary auto-alignment.
          enabled: () => false,
          isScrolling,
          onScrollStart,
        }
      ));
      return rootDispose;
    });

    realignToItem(0);
    expect(scrollIntoView).not.toHaveBeenCalled();

    setScrolling(false);
    realignToItem(0);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest',
    });
    expect(onScrollStart).toHaveBeenCalledOnce();

    dispose();
  });
});
