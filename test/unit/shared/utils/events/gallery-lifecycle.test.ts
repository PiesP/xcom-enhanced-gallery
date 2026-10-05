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

describe('gallery lifecycle with X document capture interception', () => {
  afterEach(() => {
    clearSettings();
    closeGallery();
    document.body.replaceChildren();
  });

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'routes the captured video overlay under %s despite host stopPropagation',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      document.body.innerHTML = capturedVideoPlayer;
      const hostDocumentCapture = vi.fn((event: Event) => event.stopPropagation());
      document.addEventListener('click', hostDocumentCapture, true);
      const onMediaClick = vi.fn(async () => undefined);
      const lifecycle = createGalleryLifecycle();
      const listenersBefore = getEventManager().getListenerStatus();
      lifecycle.initialize({ onMediaClick, onGalleryClose: vi.fn() });
      expect(getEventManager().getListenerStatus()).toBe(listenersBefore + 2);
      try {
        const overlay = requireTarget('[data-capture-event-target="true"]');
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        const delivered = overlay.dispatchEvent(event);

        expect(hostDocumentCapture).toHaveBeenCalledOnce();
        const opensGallery = mode !== 'block-all';
        expect(delivered).toBe(!opensGallery);
        expect(event.defaultPrevented).toBe(opensGallery);
        expect(onMediaClick).toHaveBeenCalledTimes(opensGallery ? 1 : 0);
      } finally {
        lifecycle.cleanup();
        document.removeEventListener('click', hostDocumentCapture, true);
      }
      expect(getEventManager().getListenerStatus()).toBe(listenersBefore);
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'does not cancel the captured Korean fullscreen control under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      document.body.innerHTML = capturedVideoPlayer;
      const hostDocumentCapture = (event: Event): void => event.stopPropagation();
      document.addEventListener('click', hostDocumentCapture, true);
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
        document.removeEventListener('click', hostDocumentCapture, true);
      }
    }
  );
});
