// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

function renderTarget(markup: string, selector: string): HTMLElement {
  document.body.innerHTML = markup;
  const target = document.querySelector(selector);
  if (!(target instanceof HTMLElement)) {
    throw new Error(`Missing test target: ${selector}`);
  }
  return target;
}

describe('media click detector plain article boundaries', () => {
  beforeEach(() => {
    closeGallery();
  });

  afterEach(() => {
    clearSettings();
    document.body.replaceChildren();
  });

  it('allows a native media overlay in a plain public post article', () => {
    const target = renderTarget(
      `
        <article>
          <div class="media-cell">
            <img src="https://pbs.twimg.com/media/public-photo.jpg" alt="Public photo">
            <a id="target" aria-label="View media" href="/author/status/333/photo/1"></a>
          </div>
        </article>
      `,
      '#target'
    );

    expect(isProcessableMedia(target)).toBe(true);
  });

  it.each(['twitterArticleReadView', 'article-cover-image'])(
    'blocks valid media inside the %s X Article context',
    (testId) => {
      const target = renderTarget(
        `
          <article>
            <div data-testid="${testId}">
              <img id="target" src="https://pbs.twimg.com/media/article-photo.jpg" alt="Article photo">
            </div>
          </article>
        `,
        '#target'
      );

      expect(isProcessableMedia(target)).toBe(false);
    }
  );

  it('blocks a valid image in a card that preserves external navigation', () => {
    const target = renderTarget(
      `
        <article>
          <div data-testid="card.wrapper">
            <a href="https://example.com/story">
              <img id="target" src="https://pbs.twimg.com/card_img/123/story.jpg" alt="Story card">
            </a>
          </div>
        </article>
      `,
      '#target'
    );

    expect(isProcessableMedia(target)).toBe(false);
  });
});

describe('compact quote photo hit boundary', () => {
  const compactQuote = `<article><div role="link" id="quote">
    <div id="photo-row"><div class="preview">
      <a href="/inner/status/333"><img id="photo" src="https://pbs.twimg.com/media/inner.jpg"></a>
      <a id="overlay" href="/inner/status/333" aria-label="Open photo"></a>
    </div></div>
  </div></article>`;

  beforeEach(() => closeGallery());

  afterEach(() => {
    clearSettings();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('leaves photo-row padding to the native quote click outside its image', () => {
    const row = renderTarget(compactQuote, '#photo-row');
    const photo = document.getElementById('photo');
    expect(photo).toBeInstanceOf(HTMLImageElement);
    if (!(photo instanceof HTMLImageElement)) {
      throw new Error('Missing photo');
    }
    vi.spyOn(photo, 'getBoundingClientRect').mockReturnValue(new DOMRect(316, 427, 62, 62));

    const onMediaClick = vi.fn(async () => undefined);
    const nativeClick = vi.fn();
    const handlers: EventHandlers = { onMediaClick, onGalleryClose: vi.fn() };
    const options: GalleryEventOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'compact-quote-photo-row',
    };
    const capture = (event: MouseEvent): void => {
      void handleMediaClick(event, handlers, options);
    };
    row.addEventListener('click', nativeClick);
    document.body.addEventListener('click', capture, true);
    try {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 440,
        clientY: 450,
        detail: 1,
      });
      expect(row.dispatchEvent(event)).toBe(true);
      expect(event.defaultPrevented).toBe(false);
      expect(onMediaClick).not.toHaveBeenCalled();
      expect(nativeClick).toHaveBeenCalledOnce();
    } finally {
      document.body.removeEventListener('click', capture, true);
      row.removeEventListener('click', nativeClick);
    }
  });

  it('opens the photo and same-bounds overlay, including keyboard activation', () => {
    const photo = renderTarget(compactQuote, '#photo');
    const overlay = document.getElementById('overlay');
    const quote = document.getElementById('quote');
    expect(photo).toBeInstanceOf(HTMLImageElement);
    expect(overlay).toBeInstanceOf(HTMLAnchorElement);
    expect(quote).toBeInstanceOf(HTMLElement);
    if (!(photo instanceof HTMLImageElement) || !overlay || !quote) {
      throw new Error('Missing compact quote target');
    }
    let bounds = new DOMRect(316, 427, 62, 62);
    vi.spyOn(photo, 'getBoundingClientRect').mockImplementation(() => bounds);
    vi.spyOn(overlay, 'getBoundingClientRect').mockReturnValue(new DOMRect(316, 427, 62, 62));

    const onMediaClick = vi.fn(async () => undefined);
    const handlers: EventHandlers = { onMediaClick, onGalleryClose: vi.fn() };
    const options: GalleryEventOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'compact-quote-photo-hit',
    };
    const capture = (event: MouseEvent): void => {
      void handleMediaClick(event, handlers, options);
    };
    document.body.addEventListener('click', capture, true);
    try {
      let overlayPointer: MouseEvent | null = null;
      for (const target of [photo, overlay]) {
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 320,
          clientY: 450,
          detail: 1,
        });
        expect(target.dispatchEvent(event)).toBe(false);
        expect(onMediaClick).toHaveBeenCalledWith(target, event);
        if (target === overlay) {
          overlayPointer = event;
        }
      }
      const keyboardPhoto = new MouseEvent('click', { bubbles: true, cancelable: true });
      expect(overlay.dispatchEvent(keyboardPhoto)).toBe(false);
      expect(onMediaClick).toHaveBeenCalledWith(overlay, keyboardPhoto);

      const keyboardQuote = new MouseEvent('click', { bubbles: true, cancelable: true });
      expect(quote.dispatchEvent(keyboardQuote)).toBe(true);
      expect(keyboardQuote.defaultPrevented).toBe(false);
      expect(onMediaClick).toHaveBeenCalledTimes(3);

      bounds = new DOMRect(600, 427, 62, 62);
      expect(isProcessableMedia(overlay, keyboardPhoto)).toBe(false);
      if (!overlayPointer) {
        throw new Error('Missing retained pointer event');
      }
      expect(isProcessableMedia(overlay, overlayPointer)).toBe(false);
    } finally {
      document.body.removeEventListener('click', capture, true);
    }
  });

  it('keeps a textual status link beside a photo native on keyboard activation', () => {
    const link = renderTarget(
      `<article><div>
         <img src="https://pbs.twimg.com/media/inner.jpg" alt="Photo">
         <a id="story-link" href="/inner/status/333" aria-label="Read inner post">Read the inner post</a>
       </div></article>`,
      '#story-link'
    );
    const onMediaClick = vi.fn(async () => undefined);
    const handlers: EventHandlers = { onMediaClick, onGalleryClose: vi.fn() };
    const options: GalleryEventOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'compact-quote-story-link',
    };
    const capture = (event: MouseEvent): void => {
      void handleMediaClick(event, handlers, options);
    };
    document.body.addEventListener('click', capture, true);
    try {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      expect(link.dispatchEvent(event)).toBe(true);
      expect(event.defaultPrevented).toBe(false);
      expect(onMediaClick).not.toHaveBeenCalled();
    } finally {
      document.body.removeEventListener('click', capture, true);
    }
  });

  it('keeps a wider quote overlay native when it does not match the photo bounds', () => {
    const overlay = renderTarget(compactQuote, '#overlay');
    const photo = document.getElementById('photo');
    if (!(photo instanceof HTMLImageElement)) {
      throw new Error('Missing photo');
    }
    vi.spyOn(photo, 'getBoundingClientRect').mockReturnValue(new DOMRect(316, 427, 62, 62));
    vi.spyOn(overlay, 'getBoundingClientRect').mockReturnValue(new DOMRect(300, 420, 320, 80));
    expect(isProcessableMedia(overlay)).toBe(false);
  });

  it('keeps story text inside a mixed image link native on keyboard activation', () => {
    const text = renderTarget(
      `<article><a href="/inner/status/333">
         <img src="https://pbs.twimg.com/media/inner.jpg" alt="Photo">
         <span id="story-text">Read the inner post</span>
       </a></article>`,
      '#story-text'
    );
    expect(isProcessableMedia(text)).toBe(false);
  });

  it('routes an SVG control inside an explicit photo link beyond its image bounds', () => {
    const link = renderTarget(
      `<article><div data-testid="tweetPhoto">
         <a id="photo-link" href="/inner/status/333/photo/1">
           <img id="photo" src="https://pbs.twimg.com/media/inner.jpg" alt="Photo">
           <svg width="24" height="24"><path id="photo-path" d="M0 0h24v24H0z"></path></svg>
         </a>
       </div></article>`,
      '#photo-link'
    );
    const photo = document.getElementById('photo');
    const path = document.getElementById('photo-path');
    if (!(photo instanceof HTMLImageElement) || !(path instanceof SVGElement)) {
      throw new Error('Missing photo action');
    }
    vi.spyOn(photo, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 24, 24));

    const onMediaClick = vi.fn(async () => undefined);
    const handlers: EventHandlers = { onMediaClick, onGalleryClose: vi.fn() };
    const options: GalleryEventOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'explicit-photo-svg-control',
    };
    const capture = (event: MouseEvent): void => {
      void handleMediaClick(event, handlers, options);
    };
    document.body.addEventListener('click', capture, true);
    try {
      const photoClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 36,
        clientY: 12,
        detail: 1,
      });
      expect(path.dispatchEvent(photoClick)).toBe(false);
      expect(onMediaClick).toHaveBeenCalledExactlyOnceWith(link, photoClick);

      link.setAttribute('href', '/inner/status/333');
      const statusClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 36,
        clientY: 12,
        detail: 1,
      });
      expect(path.dispatchEvent(statusClick)).toBe(true);
      expect(onMediaClick).toHaveBeenCalledTimes(1);
    } finally {
      document.body.removeEventListener('click', capture, true);
    }
  });
});

const thumb = 'https://pbs.twimg.com/amplify_video_thumb/2105931566874804224/img/2YzarPB8wETCDgJo';

function setVideoMode(mode: VideoClickMode): void {
  registerSettings({ get: () => mode, set: async () => undefined });
}

function renderUnmarkedQuote(video: string, extra = ''): HTMLElement {
  return renderTarget(
    `<article id="outer">
       <div role="link"><article id="quoted">
         <div class="media"><div class="frame">
           ${video}
           <button id="control"><span>Play</span></button>
         </div></div>
         ${extra}
       </article></div>
     </article>`,
    '#control span'
  );
}

describe('unmarked native video controls in quoted posts', () => {
  beforeEach(() => closeGallery());

  afterEach(() => {
    clearSettings();
    closeGallery();
    document.body.replaceChildren();
  });

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'routes a same-scope quote video control only in explicit allow-all mode (%s)',
    (mode) => {
      setVideoMode(mode);
      const target = renderUnmarkedQuote(
        `<video src="blob:https://x.com/started" poster="${thumb}"></video>`
      );
      expect(target.closest('article')?.id).toBe('quoted');
      expect(isProcessableMedia(target)).toBe(mode === 'allow-all');
    }
  );

  it('delivers the quoted native button click to the gallery handler under allow-all', () => {
    setVideoMode('allow-all');
    renderUnmarkedQuote(`<video src="blob:https://x.com/started" poster="${thumb}"></video>`);
    const button = document.getElementById('control');
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Missing video control');
    }
    const onMediaClick = vi.fn(async () => undefined);
    const handlers: EventHandlers = { onMediaClick, onGalleryClose: vi.fn() };
    const options: GalleryEventOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'quoted-unmarked-video-control',
    };
    const capture = (event: MouseEvent): void => {
      void handleMediaClick(event, handlers, options);
    };
    document.body.addEventListener('click', capture, true);
    try {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      expect(button.dispatchEvent(event)).toBe(false);
      expect(event.defaultPrevented).toBe(true);
      expect(onMediaClick).toHaveBeenCalledExactlyOnceWith(button, event);
    } finally {
      document.body.removeEventListener('click', capture, true);
    }
  });

  it('accepts an unstarted video with one matching trusted thumbnail in its scope', () => {
    setVideoMode('allow-all');
    const target = renderUnmarkedQuote(`<video></video><img src="${thumb}" alt="Video preview">`);
    expect(isProcessableMedia(target)).toBe(true);
  });

  it.each(['block-all', 'block-controls-only', 'allow-all'] as const)(
    'accepts a pre-player thumbnail beside ordinary images only under %s when configured',
    (mode) => {
      setVideoMode(mode);
      const target = renderUnmarkedQuote(
        `<img src="https://pbs.twimg.com/profile_images/one.jpg">
         <img src="https://pbs.twimg.com/media/ordinary-photo.jpg">
         <img src="${thumb}">`
      );
      expect(isProcessableMedia(target)).toBe(mode === 'allow-all');
    }
  );

  it('accepts one video and one trusted thumbnail among ordinary images', () => {
    setVideoMode('allow-all');
    const target = renderUnmarkedQuote(
      `<img src="https://pbs.twimg.com/profile_images/one.jpg">
       <video src="blob:https://x.com/started"></video>
       <img src="${thumb}"><img src="https://pbs.twimg.com/media/ordinary-photo.jpg">`
    );
    expect(isProcessableMedia(target)).toBe(true);
  });

  it.each([
    'data-testid="card.wrapper"',
    'data-testid="reply"',
    'role="link"',
    'data-testid="quoteTweet"',
  ])('does not borrow a trusted candidate from a sibling %s boundary', (boundary) => {
    setVideoMode('allow-all');
    for (const candidate of [`<img src="${thumb}">`, `<video poster="${thumb}"></video>`]) {
      const target = renderUnmarkedQuote(`<div ${boundary}>${candidate}</div>`);
      expect(isProcessableMedia(target)).toBe(false);
    }
  });

  it('accepts a unique direct trusted MP4 video without a poster', () => {
    setVideoMode('allow-all');
    const target = renderUnmarkedQuote(
      '<video src="https://video.twimg.com/ext_tw_video/222/pu/vid/640x360/clip.mp4"></video>'
    );
    expect(isProcessableMedia(target)).toBe(true);
  });

  it.each([
    '<video src="https://evil.example/video.mp4"></video>',
    '<video src="blob:https://x.com/started" poster="https://evil.example/poster.jpg"></video>',
    '<video src="blob:https://x.com/started"></video>',
    '<video></video>',
    '<video></video><img src="https://pbs.twimg.com/media/ordinary-photo.jpg">',
    '<video src="https://video.twimg.com/ext_tw_video/222/pu/vid/clip.mp4"></video><img src="https://pbs.twimg.com/media/ordinary-photo.jpg">',
    `<img src="https://pbs.twimg.com/media/ordinary-photo.jpg"><video poster="${thumb}"></video>`,
    '<img src="https://pbs.twimg.com/media/ordinary-photo.jpg">',
    `<img src="${thumb}"><img src="${thumb}">`,
    `<video></video><img src="${thumb}"><img src="https://pbs.twimg.com/video_thumb/other/frame.jpg">`,
    `<video poster="${thumb}"></video><video poster="${thumb}"></video>`,
  ])('rejects a control without one trustworthy video owner: %s', (video) => {
    setVideoMode('allow-all');
    const target = renderUnmarkedQuote(video);
    expect(isProcessableMedia(target)).toBe(false);
  });

  it('keeps adjacent controls, quote navigation, reply, and card actions native', () => {
    setVideoMode('allow-all');
    renderUnmarkedQuote(
      `<video poster="${thumb}"></video>`,
      `<button id="adjacent">Adjacent action</button>
       <nav><button id="nav">Next</button></nav>
       <button id="reply" data-testid="reply">Reply</button>
       <a href="/other/status/88"><button id="link">Navigate</button></a>
       <div data-testid="card.wrapper"><button id="card">Card</button></div>`
    );
    for (const id of ['adjacent', 'nav', 'reply', 'link', 'card']) {
      const target = document.getElementById(id);
      expect(target).toBeInstanceOf(HTMLElement);
      expect(isProcessableMedia(target)).toBe(false);
    }
  });

  it('does not borrow video evidence from a nested reply article', () => {
    setVideoMode('allow-all');
    const target = renderTarget(
      `<article><div class="frame"><button id="target">Action</button>
         <article><video poster="${thumb}"></video></article>
       </div></article>`,
      '#target'
    );
    expect(isProcessableMedia(target)).toBe(false);
  });

  it('does not search past three shared ancestors for an unmarked control', () => {
    setVideoMode('allow-all');
    const target = renderTarget(
      `<article><div class="frame"><video poster="${thumb}"></video>
         <div><div><div><button id="target">Distant action</button></div></div></div>
       </div></article>`,
      '#target'
    );
    expect(isProcessableMedia(target)).toBe(false);
  });
});
