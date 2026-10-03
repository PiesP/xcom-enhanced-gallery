// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { afterEach, describe, expect, it } from 'vitest';
import { unanchoredVideoPreview } from '../../../../fixtures/unanchored-video-preview';

describe('unanchored preview ownership', () => {
  const extractor = new TweetInfoExtractor();
  afterEach(() => document.body.replaceChildren());

  function mount(markup = unanchoredVideoPreview): HTMLImageElement {
    document.body.innerHTML = markup;
    return document.querySelector<HTMLImageElement>('#main-poster')!;
  }

  it('keeps main and enclosing quote owners separate', () => {
    const main = mount();
    expect(extractor.extract(main)?.tweetId).toBe('222');
    const quote = document.querySelector<HTMLImageElement>('#quoted-photo')!;
    expect(extractor.extract(quote)?.tweetId).toBe('111');
    expect(extractor.extract(quote)?.extractionMethod).toBe('media-grid-item');
  });

  it('never uses the thumbnail media ID as the post owner', () => {
    const main = mount();
    main.src = 'https://pbs.twimg.com/amplify_video_thumb/333/img/poster.jpg';
    expect(extractor.extract(main)?.tweetId).toBe('222');
  });

  it.each([true, false])('excludes quoted timestamps with semantic wrapper=%s', (semantic) => {
    const main = mount();
    const quote = document.querySelector('[data-testid="quoteTweet"]')!;
    if (!semantic) {
      quote.removeAttribute('role');
      quote.removeAttribute('data-testid');
    }
    quote.insertAdjacentHTML(
      'afterbegin',
      '<a role="link" href="/original_author/status/111"><time>Quote</time></a>'
    );
    expect(extractor.extract(main)?.tweetId).toBe('222');
    quote.parentElement!.prepend(quote);
    expect(extractor.extract(main)?.tweetId).toBe('222');
  });

  it('does not borrow a quote owner when the own permalink is missing', () => {
    const main = mount();
    document.querySelector('a[href="/quote_author/status/222"]')!.remove();
    expect(extractor.extract(main)).toBeNull();
  });

  it.each(['marked', 'unmarked', 'no-time', 'unmarked-no-time'])(
    'resolves an unanchored quoted video in %s scope',
    (layout) => {
      mount();
      const quote = document.querySelector('[data-testid="quoteTweet"]')!;
      quote.innerHTML =
        '<div data-testid="tweetPhoto"><div data-testid="previewInterstitial"><img id="quote-poster" src="https://pbs.twimg.com/amplify_video_thumb/333/img/quote.jpg"><button data-testid="playButton">Play</button></div></div><a role="link" href="/original_author/status/111"><time>Quoted time</time></a>';
      if (layout.startsWith('unmarked')) {
        quote.removeAttribute('role');
        quote.removeAttribute('data-testid');
      }
      if (layout.endsWith('no-time')) quote.querySelector('time')!.replaceWith('Quoted permalink');
      expect(
        extractor.extract(document.querySelector<HTMLImageElement>('#quote-poster')!)?.tweetId
      ).toBe('111');
      expect(
        extractor.extract(document.querySelector<HTMLImageElement>('#main-poster')!)?.tweetId
      ).toBe('222');
    }
  );

  it('excludes timestamp-only quote media branches without semantic markers', () => {
    const main = mount();
    const quote = document.querySelector('[data-testid="quoteTweet"]')!;
    quote.removeAttribute('role');
    quote.removeAttribute('data-testid');
    quote.innerHTML =
      '<div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/amplify_video_thumb/333/img/quote.jpg"></div><a role="link" href="/original_author/status/111"><time>Quoted time</time></a>';
    expect(extractor.extract(main)?.tweetId).toBe('222');
    document.querySelector('a[href="/quote_author/status/222"]')!.remove();
    expect(extractor.extract(main)).toBeNull();
  });

  it('does not confuse a generic clickable media wrapper with a quote owner', () => {
    const main = mount();
    const media = main.closest('[data-testid="tweetPhoto"]')!;
    const wrapper = document.createElement('div');
    wrapper.setAttribute('role', 'link');
    media.replaceWith(wrapper);
    wrapper.append(media);
    expect(extractor.extract(main)?.tweetId).toBe('222');
  });

  it('does not promote a nested quote timestamp to a clickable main wrapper owner', () => {
    const main = mount();
    const article = main.closest('article')!;
    const wrapper = document.createElement('div');
    wrapper.setAttribute('role', 'link');
    article.prepend(wrapper);
    wrapper.append(
      main.closest('[data-testid="tweetPhoto"]')!,
      document.querySelector('[data-testid="quoteTweet"]')!
    );
    document
      .querySelector('[data-testid="quoteTweet"]')!
      .insertAdjacentHTML(
        'beforeend',
        '<a role="link" href="/original_author/status/111"><time>Quote</time></a>'
      );
    expect(extractor.extract(main)?.tweetId).toBe('222');
  });

  it('rejects ambiguous own permalinks and ignores hostile links', () => {
    const main = mount();
    main
      .closest('article')!
      .insertAdjacentHTML(
        'beforeend',
        '<a role="link" href="https://evil.test/a/status/444"><time>Hostile</time></a>'
      );
    expect(extractor.extract(main)?.tweetId).toBe('222');
    main
      .closest('article')!
      .insertAdjacentHTML(
        'beforeend',
        '<a role="link" href="/other/status/444"><time>Ambiguous</time></a>'
      );
    expect(extractor.extract(main)).toBeNull();
  });

  it('scopes reply and nested article links independently of the page URL', () => {
    const main = mount();
    main
      .closest('article')!
      .insertAdjacentHTML(
        'beforeend',
        '<article><a role="link" href="/nested/status/555"><time>Nested</time></a></article>'
      );
    document.body.insertAdjacentHTML(
      'beforeend',
      '<article><div data-testid="tweetPhoto"><img id="reply" src="https://pbs.twimg.com/amplify_video_thumb/333/img/reply.jpg"></div><a role="link" href="/reply/status/444"><time>Reply</time></a></article>'
    );
    expect(extractor.extract(main)?.tweetId).toBe('222');
    expect(extractor.extract(document.querySelector<HTMLImageElement>('#reply')!)?.tweetId).toBe(
      '444'
    );
  });
});
