// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { closeGallery } from '@shared/state/signals/gallery.signals';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
