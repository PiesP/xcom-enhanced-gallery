// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { useGalleryWheelRedirect } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-wheel-redirect';
import { createRoot } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

describe('gallery background wheel redirection', () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    document.body.replaceChildren();
  });

  it('claims only background wheel before moving the scrollport', () => {
    const container = document.createElement('div');
    const items = document.createElement('div');
    items.style.cssText = 'height: 100px; overflow: auto';
    const content = document.createElement('div');
    content.style.height = '1000px';
    items.append(content);
    container.append(items);
    document.body.append(container);

    const observed = vi.fn(() => items.scrollTop);
    createRoot((stop) => {
      dispose = stop;
      useGalleryWheelRedirect({
        containerEl: () => container,
        itemsContainerEl: () => items,
        onRedirectedWheel: observed,
      });
    });

    const backgroundWheel = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 80,
    });
    container.dispatchEvent(backgroundWheel);
    expect(backgroundWheel.defaultPrevented).toBe(true);
    expect(observed).toHaveBeenCalledOnce();
    expect(observed).toHaveReturnedWith(0);
    expect(items.scrollTop).toBe(80);

    const panel = document.createElement('div');
    panel.dataset.galleryElement = 'settings-panel';
    container.append(panel);
    const hostWheel = vi.fn();
    document.addEventListener('wheel', hostWheel);
    const panelWheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 50 });
    panel.dispatchEvent(panelWheel);
    expect(panelWheel.defaultPrevented).toBe(false);
    expect(hostWheel).not.toHaveBeenCalled();
    expect(observed).toHaveBeenCalledOnce();
    expect(items.scrollTop).toBe(80);
    document.removeEventListener('wheel', hostWheel);
  });
});
