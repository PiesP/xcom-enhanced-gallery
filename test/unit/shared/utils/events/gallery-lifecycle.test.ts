// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { getEventManager } from '@shared/services/event-manager';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { createGalleryLifecycle } from '@shared/utils/events/lifecycle/gallery-lifecycle';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Exact sanitized videoPlayer subtree from the authenticated Edge click record.
const capturedVideoPlayer = readFileSync(
  resolve('test/fixtures/authenticated-x-layouts/video-surface-controls.html'),
  'utf8'
);

function requireTarget(selector: string): HTMLElement {
  const target = document.querySelector(selector);
  if (!(target instanceof HTMLElement)) throw new Error(`Missing captured target: ${selector}`);
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
