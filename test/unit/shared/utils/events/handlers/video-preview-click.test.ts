// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import type { VideoClickMode } from '@shared/types/settings.types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { unanchoredVideoPreview } from '../../../../../fixtures/unanchored-video-preview';

const settings = vi.hoisted(() => ({ mode: 'block-controls-only' as VideoClickMode }));
vi.mock('@shared/container/settings-registry', () => ({
  tryGetSettings: () => ({}),
  getTypedSettingOr: () => settings.mode,
}));
vi.mock('@shared/state/signals/gallery.signals', () => ({ gallerySignals: { isOpen: false } }));

describe('video preview event routing', () => {
  afterEach(() => document.body.replaceChildren());

  it('does not classify ordinary photo interstitials as video under block-all', () => {
    settings.mode = 'block-all';
    document.body.innerHTML =
      '<article><div data-testid="tweetPhoto"><div data-testid="previewInterstitial"><img id="photo" src="https://pbs.twimg.com/media/ordinary.jpg"></div></div></article>';
    const onMediaClick = vi.fn(async () => undefined);
    const capture = (event: MouseEvent): void => {
      void handleMediaClick(
        event,
        { onMediaClick, onGalleryClose: vi.fn() },
        {
          enableKeyboard: true,
          enableMediaDetection: true,
          debugMode: false,
          preventBubbling: true,
          context: 'photo-regression',
        }
      );
    };
    document.body.addEventListener('click', capture, true);
    try {
      document
        .querySelector('#photo')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(onMediaClick).toHaveBeenCalledOnce();
    } finally {
      document.body.removeEventListener('click', capture, true);
    }
  });

  for (const initialized of [false, true]) {
    for (const mode of ['block-all', 'block-controls-only', 'allow-all'] as const) {
      it.each(['poster', 'overlay', 'play', 'seek', 'volume'])(
        `${mode}, initialized=${initialized}: %s`,
        (targetName) => {
          settings.mode = mode;
          document.body.innerHTML = unanchoredVideoPreview;
          const preview = document.querySelector<HTMLElement>(
            '[data-testid="previewInterstitial"]'
          )!;
          if (initialized) {
            preview.dataset.testid = 'videoPlayer';
            preview.querySelector('img')!.outerHTML =
              '<video id="main-poster" poster="https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg"></video>';
          }
          preview.insertAdjacentHTML(
            'beforeend',
            '<div id="overlay"></div><input id="seek" type="range" data-testid="seek"><input id="volume" type="range" data-testid="volume">'
          );
          const selectors = {
            poster: '#main-poster',
            overlay: '#overlay',
            play: '[data-testid="playButton"]',
            seek: '#seek',
            volume: '#volume',
          };
          const target = document.querySelector<HTMLElement>(
            selectors[targetName as keyof typeof selectors]
          )!;
          const nativeClick = vi.fn();
          const onMediaClick = vi.fn(async () => undefined);
          target.addEventListener('click', nativeClick);
          const capture = (event: MouseEvent): void => {
            void handleMediaClick(
              event,
              { onMediaClick, onGalleryClose: vi.fn() },
              {
                enableKeyboard: true,
                enableMediaDetection: true,
                debugMode: false,
                preventBubbling: true,
                context: 'preview-regression',
              }
            );
          };
          document.body.addEventListener('click', capture, true);
          try {
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            target.dispatchEvent(event);
            const gallery =
              (targetName === 'poster' || targetName === 'overlay') && mode !== 'block-all';
            expect(event.defaultPrevented).toBe(gallery);
            expect(onMediaClick).toHaveBeenCalledTimes(gallery ? 1 : 0);
            expect(nativeClick).toHaveBeenCalledTimes(gallery ? 0 : 1);
          } finally {
            document.body.removeEventListener('click', capture, true);
          }
        }
      );
    }
  }
});
