// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { closeGallery } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function renderTarget(markup: string, selector: string): HTMLElement {
  document.body.innerHTML = markup;
  const target = document.querySelector(selector);
  if (!(target instanceof HTMLElement)) throw new Error(`Missing test target: ${selector}`);
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
      const target = renderUnmarkedQuote(`<video src="blob:https://x.com/started" poster="${thumb}"></video>`);
      expect(target.closest('article')?.id).toBe('quoted');
      expect(isProcessableMedia(target)).toBe(mode === 'allow-all');
    }
  );

  it('delivers the quoted native button click to the gallery handler under allow-all', () => {
    setVideoMode('allow-all');
    renderUnmarkedQuote(`<video src="blob:https://x.com/started" poster="${thumb}"></video>`);
    const button = document.getElementById('control');
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) throw new Error('Missing video control');
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
