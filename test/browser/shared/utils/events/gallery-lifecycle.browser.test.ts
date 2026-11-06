// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import capturedVideoPlayer from '../../../../fixtures/authenticated-x-layouts/video-surface-controls.html?raw';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { getEventManager } from '@shared/services/event-manager';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { createGalleryLifecycle } from '@shared/utils/events/lifecycle/gallery-lifecycle';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser/context';

// Exact sanitized videoPlayer subtree from the authenticated Edge click record.

function requireTarget(selector: string): HTMLElement {
  const target = document.querySelector(selector);
  if (!(target instanceof HTMLElement)) {
    throw new Error(`Missing captured target: ${selector}`);
  }
  return target;
}

describe('gallery lifecycle with authenticated X video targets', () => {
  afterEach(() => {
    clearSettings();
    closeGallery();
    document.body.replaceChildren();
  });

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'ignores a page-synthetic video click under %s and cleans up its listeners',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      document.body.innerHTML = capturedVideoPlayer;
      const onMediaClick = vi.fn(async () => undefined);
      const lifecycle = createGalleryLifecycle();
      const listenersBefore = getEventManager().getListenerStatus();
      lifecycle.initialize({ onMediaClick, onGalleryClose: vi.fn() });
      expect(getEventManager().getListenerStatus()).toBe(listenersBefore + 2);
      try {
        const overlay = requireTarget('[data-capture-event-target="true"]');
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        const delivered = overlay.dispatchEvent(event);

        expect(delivered).toBe(true);
        expect(event.defaultPrevented).toBe(false);
        expect(onMediaClick).not.toHaveBeenCalled();
      } finally {
        lifecycle.cleanup();
      }
      expect(getEventManager().getListenerStatus()).toBe(listenersBefore);
    }
  );

  it('ignores synthetic keyboard and outside-click input at the registered listeners', () => {
    const onGalleryClose = vi.fn();
    const onMediaClick = vi.fn(async () => undefined);
    const lifecycle = createGalleryLifecycle();
    lifecycle.initialize({ onGalleryClose, onMediaClick });
    try {
      for (const key of ['Escape', '?', 'ArrowRight']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        document.body.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }
      document.body.click();
      expect(onGalleryClose).not.toHaveBeenCalled();
      expect(onMediaClick).not.toHaveBeenCalled();
    } finally {
      lifecycle.cleanup();
    }
  });

  it('reaches a trusted photo click after a preceding document capture listener stops propagation', async () => {
    const photo = document.createElement('div');
    photo.dataset.testid = 'tweetPhoto';
    const image = document.createElement('img');
    image.src = 'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=small';
    image.width = 48;
    image.height = 48;
    photo.append(image);
    document.body.append(photo);

    const bodyClick = vi.fn();
    const stopAtDocument = vi.fn((event: Event) => event.stopPropagation());
    const observed: MouseEvent[] = [];
    const captureEvent = (event: MouseEvent): void => {
      observed.push(event);
    };
    const onMediaClick = vi.fn(async () => undefined);
    const lifecycle = createGalleryLifecycle();
    const listenersBefore = getEventManager().getListenerStatus();
    window.addEventListener('click', captureEvent, true);
    document.addEventListener('click', stopAtDocument, true);
    document.body.addEventListener('click', bodyClick, true);
    try {
      await userEvent.click(image);
      expect(stopAtDocument).toHaveBeenCalledOnce();
      expect(bodyClick).not.toHaveBeenCalled();
      expect(observed.at(-1)?.isTrusted).toBe(true);
      expect(observed.at(-1)?.defaultPrevented).toBe(false);

      lifecycle.initialize({ onMediaClick, onGalleryClose: vi.fn() });
      expect(getEventManager().getListenerStatus()).toBe(listenersBefore + 2);
      await userEvent.click(image);

      expect(stopAtDocument).toHaveBeenCalledTimes(2);
      expect(bodyClick).not.toHaveBeenCalled();
      expect(observed.at(-1)?.isTrusted).toBe(true);
      expect(observed.at(-1)?.defaultPrevented).toBe(true);
      expect(onMediaClick).toHaveBeenCalledOnce();

      lifecycle.cleanup();
      await userEvent.click(image);
      expect(observed.at(-1)?.defaultPrevented).toBe(false);
      expect(onMediaClick).toHaveBeenCalledOnce();
    } finally {
      lifecycle.cleanup();
      document.body.removeEventListener('click', bodyClick, true);
      document.removeEventListener('click', stopAtDocument, true);
      window.removeEventListener('click', captureEvent, true);
    }
    expect(getEventManager().getListenerStatus()).toBe(listenersBefore);
  });

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'does not cancel the captured Korean fullscreen control under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      document.body.innerHTML = capturedVideoPlayer;
      const onMediaClick = vi.fn(async () => undefined);
      const lifecycle = createGalleryLifecycle();
      lifecycle.initialize({ onMediaClick, onGalleryClose: vi.fn() });
      try {
        const control = requireTarget('button[aria-label="전체 화면"]');
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        expect(control.dispatchEvent(event)).toBe(true);
        expect(event.defaultPrevented).toBe(false);
        expect(onMediaClick).not.toHaveBeenCalled();
      } finally {
        lifecycle.cleanup();
      }
    }
  );
});
