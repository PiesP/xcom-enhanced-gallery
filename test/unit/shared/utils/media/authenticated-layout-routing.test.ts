// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type CapturedShape =
  | 'timeline-image'
  | 'card'
  | 'reply'
  | 'inline-multi-media'
  | 'native-viewer-carousel'
  | 'timeline-after-mutation'
  | 'detail'
  | 'quote'
  | 'profile-media-tile'
  | 'video-before-interaction'
  | 'video-after-native-interaction'
  | 'x-article-media-ancestry';

const options: GalleryEventOptions = {
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'authenticated-layout-routing',
};

function loadCapturedShape(name: CapturedShape): void {
  const path = resolve('test/fixtures/authenticated-x-layouts', `${name}.html`);
  document.body.innerHTML = readFileSync(path, 'utf8');
}

function requireTarget(selector: string): HTMLElement {
  const target = document.querySelector(selector);
  if (!(target instanceof HTMLElement)) throw new Error(`Missing captured target: ${selector}`);
  return target;
}

function clickThroughHandler(target: HTMLElement): {
  event: MouseEvent;
  delivered: boolean;
  onMediaClick: ReturnType<typeof vi.fn>;
  nativeClick: ReturnType<typeof vi.fn>;
} {
  const onMediaClick = vi.fn(async () => undefined);
  const nativeClick = vi.fn();
  const handlers: EventHandlers = { onMediaClick, onGalleryClose: vi.fn() };
  const capture = (event: MouseEvent): void => {
    void handleMediaClick(event, handlers, options);
  };
  target.addEventListener('click', nativeClick);
  document.body.addEventListener('click', capture, true);
  try {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const delivered = target.dispatchEvent(event);
    return { event, delivered, onMediaClick, nativeClick };
  } finally {
    document.body.removeEventListener('click', capture, true);
    target.removeEventListener('click', nativeClick);
  }
}

function expectClickRouting(target: HTMLElement, gallery: boolean): void {
  expect(isProcessableMedia(target)).toBe(gallery);
  const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
  expect(delivered).toBe(!gallery);
  expect(event.defaultPrevented).toBe(gallery);
  expect(onMediaClick).toHaveBeenCalledTimes(gallery ? 1 : 0);
  expect(nativeClick).toHaveBeenCalledTimes(gallery ? 0 : 1);
}

describe('authenticated X layout click routing', () => {
  beforeEach(() => closeGallery());

  afterEach(() => {
    clearSettings();
    closeGallery();
    document.body.replaceChildren();
  });

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'opens the gallery for the captured inline photo under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('timeline-image');
      const target = requireTarget(
        '[data-testid="tweetPhoto"] img[src*="pbs.twimg.com/media/"]'
      );
      expect(target.closest('a[href$="/photo/2"]')).not.toBeNull();
      expect(isProcessableMedia(target)).toBe(true);

      const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
      expect(delivered).toBe(false);
      expect(event.defaultPrevented).toBe(true);
      expect(onMediaClick).toHaveBeenCalledOnce();
      expect(onMediaClick).toHaveBeenCalledWith(target, event);
      expect(nativeClick).not.toHaveBeenCalled();
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'preserves the captured Korean carousel controls under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('timeline-image');
      for (const label of ['이전', '다음']) {
        const target = requireTarget(`nav button[aria-label="${label}"]`);
        const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
        expect(delivered).toBe(true);
        expect(event.defaultPrevented).toBe(false);
        expect(onMediaClick).not.toHaveBeenCalled();
        expect(nativeClick).toHaveBeenCalledOnce();
      }
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'leaves the captured external card image on its native link under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('card');
      const target = requireTarget('[data-testid="card.wrapper"] a img');
      expect(target.closest('a')?.getAttribute('href')).toBe('https://example.invalid/other-link');
      expect(isProcessableMedia(target)).toBe(false);

      const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
      expect(delivered).toBe(true);
      expect(event.defaultPrevented).toBe(false);
      expect(onMediaClick).not.toHaveBeenCalled();
      expect(nativeClick).toHaveBeenCalledOnce();
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'leaves the captured reply action on its native handler under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('reply');
      const target = requireTarget('button[data-testid="reply"] div div');
      expect(isProcessableMedia(target)).toBe(false);

      const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
      expect(delivered).toBe(true);
      expect(event.defaultPrevented).toBe(false);
      expect(onMediaClick).not.toHaveBeenCalled();
      expect(nativeClick).toHaveBeenCalledOnce();
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'opens both photos in the captured inline multimedia row under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('inline-multi-media');
      const row = requireTarget('nav[role="navigation"]');
      expect(row.closest('[aria-roledescription="carousel"]')).toBeNull();
      const photos = row.querySelectorAll<HTMLElement>('[data-testid="tweetPhoto"] img');
      expect(photos).toHaveLength(2);
      for (const [index, target] of Array.from(photos).entries()) {
        expect(target.closest('a')?.getAttribute('href')).toMatch(
          new RegExp(`/photo/${index + 1}$`)
        );
        expect(isProcessableMedia(target)).toBe(true);
        const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
        expect(delivered).toBe(false);
        expect(event.defaultPrevented).toBe(true);
        expect(onMediaClick).toHaveBeenCalledExactlyOnceWith(target, event);
        expect(nativeClick).not.toHaveBeenCalled();
      }
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'keeps the captured inline previous and next buttons native under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('inline-multi-media');
      for (const label of ['이전', '다음']) {
        const target = requireTarget(`nav button[aria-label="${label}"]`);
        const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
        expect(delivered).toBe(true);
        expect(event.defaultPrevented).toBe(false);
        expect(onMediaClick).not.toHaveBeenCalled();
        expect(nativeClick).toHaveBeenCalledOnce();
      }
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'preserves native viewer images, nested backgrounds, and its unnamed button under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('native-viewer-carousel');
      const carousel = requireTarget('[aria-roledescription="carousel"]');
      expect(carousel.querySelectorAll('[data-testid="swipe-to-dismiss"]')).toHaveLength(2);
      const targets = carousel.querySelectorAll<HTMLElement>(
        'li img, li [data-capture-background-url], button[role="button"]'
      );
      expect(targets).toHaveLength(5);
      for (const target of targets) {
        expect(isProcessableMedia(target)).toBe(false);
        const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
        expect(delivered).toBe(true);
        expect(event.defaultPrevented).toBe(false);
        expect(onMediaClick).not.toHaveBeenCalled();
        expect(nativeClick).toHaveBeenCalledOnce();
      }
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'opens the photo in the captured timeline after an X DOM mutation under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('timeline-after-mutation');
      const target = requireTarget('[data-testid="tweetPhoto"] img');
      expect(target.closest('a')?.getAttribute('href')).toMatch(/\/status\/224\/photo\/1$/u);
      expect(isProcessableMedia(target)).toBe(true);

      const { event, delivered, onMediaClick, nativeClick } = clickThroughHandler(target);
      expect(delivered).toBe(false);
      expect(event.defaultPrevented).toBe(true);
      expect(onMediaClick).toHaveBeenCalledExactlyOnceWith(target, event);
      expect(nativeClick).not.toHaveBeenCalled();
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'opens the captured profile media tile under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('profile-media-tile');
      const target = requireTarget('[data-testid="tweetPhoto"] img');
      expect(target.closest('a')?.getAttribute('href')).toMatch(/\/status\/222\/photo\/1$/u);
      expectClickRouting(target, true);
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'keeps the captured detail page external card link native under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('detail');
      expect(document.querySelector('[data-testid="tweetPhoto"]')).toBeNull();
      const target = requireTarget('[data-testid="card.wrapper"] a img');
      expect(target.closest('a')?.getAttribute('href')).toBe('https://example.invalid/other-link');
      expectClickRouting(target, false);
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'opens both captured quote photos while preserving the quote owner under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('quote');
      const targets = document.querySelectorAll<HTMLElement>(
        'a[href*="/status/223/photo/"] [data-testid="tweetPhoto"] img'
      );
      expect(targets).toHaveLength(2);
      for (const target of targets) {
        expect(target.closest('article[data-testid="tweet"]')).not.toBeNull();
        expectClickRouting(target, true);
      }
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'keeps the captured X Article image and link native under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('x-article-media-ancestry');
      const image = requireTarget('[data-testid="twitterArticleReadView"] img');
      const link = image.closest('a[href]');
      expect(link?.getAttribute('href')).toBe('https://example.invalid/other-link');
      expectClickRouting(image, false);
      if (!(link instanceof HTMLElement)) throw new Error('Missing captured Article link');
      expectClickRouting(link, false);
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'routes captured pre-player poster and overlay, but preserves play button under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('video-before-interaction');
      const poster = requireTarget('img[src*="amplify_video_thumb"]');
      const overlay = requireTarget(
        '[data-testid="videoComponent"] > div:nth-child(2) > div > div > div:first-child'
      );
      const playButton = requireTarget('[data-testid="videoPlayer"] button[role="button"]');
      expect(poster.closest('[data-testid="videoPlayer"]')).not.toBeNull();
      expect(overlay.closest('[data-testid="videoPlayer"]')).not.toBeNull();
      const opensGallery = mode !== 'block-all';
      expectClickRouting(poster, opensGallery);
      expectClickRouting(overlay, opensGallery);
      expectClickRouting(playButton, false);
    }
  );

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'routes captured playing video surface while preserving its controls under %s',
    (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
      loadCapturedShape('video-after-native-interaction');
      const video = requireTarget('[data-testid="videoPlayer"] video');
      const overlay = requireTarget(
        '[data-testid="videoComponent"] > div:nth-child(2) > div > div > div:first-child'
      );
      const opensGallery = mode !== 'block-all';
      expectClickRouting(video, opensGallery);
      expectClickRouting(overlay, opensGallery);

      const controls = document.querySelectorAll<HTMLElement>(
        '[data-testid="videoPlayer"] [role="slider"], [data-testid="videoPlayer"] button'
      );
      expect(controls.length).toBeGreaterThanOrEqual(3);
      expect(document.querySelector('button[aria-label="전체 화면"]')).not.toBeNull();
      for (const control of controls) expectClickRouting(control, false);
    }
  );
});
