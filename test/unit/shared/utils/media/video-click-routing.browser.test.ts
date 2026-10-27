// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { isVideoClickAllowed } from '@shared/dom/utils';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { getMediaClickTarget } from '@shared/utils/media/media-click-target';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const options: GalleryEventOptions = {
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'video-click-routing',
};

function setMode(mode: VideoClickMode): void {
  registerSettings({ get: () => mode, set: async () => undefined });
}

function click(target: Element): {
  event: MouseEvent;
  productDefaultPrevented: boolean;
  originalTarget: EventTarget | null;
  onMediaClick: ReturnType<typeof vi.fn>;
  nativeClick: ReturnType<typeof vi.fn>;
} {
  const onMediaClick = vi.fn(async () => undefined);
  const nativeClick = vi.fn();
  const handlers: EventHandlers = { onMediaClick, onGalleryClose: vi.fn() };
  let originalTarget: EventTarget | null = null;
  const capture = (event: MouseEvent): void => {
    originalTarget = event.target;
    void handleMediaClick(event, handlers, options);
  };
  document.body.addEventListener('click', capture, true);
  target.addEventListener('click', nativeClick);
  let productDefaultPrevented: boolean | undefined;
  const preventFixtureNavigation = (event: MouseEvent): void => {
    productDefaultPrevented = event.defaultPrevented;
    if (target.closest('a[href]')) event.preventDefault();
  };
  document.addEventListener('click', preventFixtureNavigation);
  try {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
    target.dispatchEvent(event);
    return {
      event,
      productDefaultPrevented: productDefaultPrevented ?? event.defaultPrevented,
      originalTarget,
      onMediaClick,
      nativeClick,
    };
  } finally {
    document.removeEventListener('click', preventFixtureNavigation);
    document.body.removeEventListener('click', capture, true);
    target.removeEventListener('click', nativeClick);
  }
}

function requireElement(selector: string): Element {
  const result = document.querySelector(selector);
  if (!result) {
    throw new Error(`Missing element: ${selector}`);
  }
  return result;
}

describe('unmarked video and icon click routing', () => {
  afterEach(() => {
    clearSettings();
    closeGallery();
    document.body.replaceChildren();
  });

  it.each(['playing', 'paused', 'ended'] as const)(
    'routes %s video surfaces by mode for marked and unmarked players',
    (state) => {
      for (const marked of [false, true]) {
        for (const mode of ['block-all', 'block-controls-only', 'allow-all'] as const) {
          setMode(mode);
          document.body.innerHTML = `<article><a href="/author/status/333"><time>Post</time></a>
          <div ${marked ? 'data-testid="videoPlayer"' : ''}>
            <video id="state-video" src="https://video.twimg.com/ext_tw_video/333/pu/vid/one.mp4"></video>
          </div></article>`;
          const video = requireElement('#state-video');
          Object.defineProperty(video, 'paused', { get: () => state !== 'playing' });
          Object.defineProperty(video, 'ended', { get: () => state === 'ended' });
          const routed = click(video);
          expect(routed.productDefaultPrevented).toBe(mode !== 'block-all');
          expect(routed.onMediaClick).toHaveBeenCalledTimes(mode === 'block-all' ? 0 : 1);
          expect(routed.nativeClick).toHaveBeenCalledTimes(mode === 'block-all' ? 1 : 0);
        }
      }
    }
  );

  it('uses the default mode when no settings are registered', () => {
    clearSettings();
    document.body.innerHTML =
      '<article><a href="/author/status/333"><time>Post</time></a><video id="default-video" src="blob:https://x.com/playing"></video></article>';
    const routed = click(requireElement('#default-video'));
    expect(routed.productDefaultPrevented).toBe(true);
    expect(routed.onMediaClick).toHaveBeenCalledOnce();
  });

  it('rejects a detached HTML target when an early event is resumed', () => {
    const image = document.createElement('img');
    document.body.append(image);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    let duringDispatch: HTMLElement | null = null;
    image.addEventListener('click', (clickEvent) => {
      duringDispatch = getMediaClickTarget(clickEvent as MouseEvent);
    });
    image.dispatchEvent(event);
    expect(duringDispatch).toBe(image);

    image.remove();
    expect(getMediaClickTarget(event)).toBeNull();
  });

  it('keeps a direct unmarked video native in block-all without classifying sibling media or links', () => {
    setMode('block-all');
    document.body.innerHTML = `<article><a href="/author/status/333"><time>Post</time></a>
      <div class="media"><video id="video" src="blob:https://x.com/playing"></video></div>
      <div data-testid="tweetPhoto"><img id="photo" src="https://pbs.twimg.com/media/other.jpg"></div>
      <a id="external" href="https://example.invalid/story">External</a>
    </article>`;
    const video = requireElement('#video');
    const photo = requireElement('#photo');
    const external = requireElement('#external');
    if (!(video instanceof HTMLVideoElement) || !(photo instanceof HTMLElement)) {
      throw new Error('Missing HTML fixture');
    }
    expect(video.closest('[data-testid="videoPlayer"]')).toBeNull();
    expect(isVideoClickAllowed(video, undefined, 'block-all')).toBe(false);
    expect(isProcessableMedia(video)).toBe(false);
    const routedVideo = click(video);
    expect(routedVideo.productDefaultPrevented).toBe(false);
    expect(routedVideo.nativeClick).toHaveBeenCalledOnce();
    expect(routedVideo.onMediaClick).not.toHaveBeenCalled();
    expect(isProcessableMedia(photo)).toBe(true);
    expect(click(photo).onMediaClick).toHaveBeenCalledExactlyOnceWith(
      photo,
      expect.any(MouseEvent)
    );
    expect(click(external).onMediaClick).not.toHaveBeenCalled();
  });

  it('keeps a marked video and ordinary player button native in block-all', () => {
    setMode('block-all');
    document.body.innerHTML = `<article><div data-testid="videoPlayer">
      <video id="marked" src="blob:https://x.com/playing"></video>
      <button id="ordinary" type="button"><svg><path id="ordinary-path"></path></svg></button>
    </div></article>`;
    for (const selector of ['#marked', '#ordinary-path']) {
      const routed = click(requireElement(selector));
      expect(routed.productDefaultPrevented).toBe(false);
      expect(routed.onMediaClick).not.toHaveBeenCalled();
      expect(routed.nativeClick).toHaveBeenCalledOnce();
    }
  });

  it.each(['block-controls-only', 'allow-all'] as const)(
    'opens a direct unmarked video surface in %s',
    (mode) => {
      setMode(mode);
      document.body.innerHTML = `<article><a href="/author/status/333"><time>Post</time></a>
        <video id="video" src="blob:https://x.com/playing"></video></article>`;
      const video = requireElement('#video');
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Missing video fixture');
      }
      expect(isProcessableMedia(video)).toBe(true);
      const routed = click(video);
      expect(routed.productDefaultPrevented).toBe(true);
      expect(routed.onMediaClick).toHaveBeenCalledExactlyOnceWith(video, routed.event);
      expect(routed.nativeClick).not.toHaveBeenCalled();
    }
  );

  it.each(['allow-all', 'block-controls-only', 'block-all'] as const)(
    'routes padding, text, SVG and path consistently for a bounded native button in %s',
    (mode) => {
      setMode(mode);
      document.body.innerHTML = `<article><a href="/author/status/333"><time>Post</time></a>
        <div class="frame"><video poster="https://pbs.twimg.com/amplify_video_thumb/333/img/poster.jpg"></video>
          <button id="native" type="button">Text <span id="text">Play</span><svg id="svg"><path id="path"></path></svg></button>
        </div>
      </article>`;
      const button = requireElement('#native');
      for (const selector of ['#native', '#text', '#svg', '#path']) {
        const target = requireElement(selector);
        const routed = click(target);
        expect(routed.originalTarget).toBe(target);
        expect(routed.productDefaultPrevented).toBe(mode === 'allow-all');
        expect(routed.onMediaClick).toHaveBeenCalledTimes(mode === 'allow-all' ? 1 : 0);
        if (mode === 'allow-all') {
          expect(routed.onMediaClick).toHaveBeenCalledWith(
            target instanceof HTMLElement ? target : button,
            routed.event
          );
          expect(routed.nativeClick).not.toHaveBeenCalled();
        } else {
          expect(routed.nativeClick).toHaveBeenCalledOnce();
        }
      }
    }
  );
});
