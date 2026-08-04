// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { describe, expect, it } from 'vitest';

function renderTarget(markup: string, selector: string): HTMLElement {
  document.body.innerHTML = markup;
  const target = document.querySelector(selector);
  if (!(target instanceof HTMLElement)) {
    throw new Error(`Missing test target: ${selector}`);
  }
  return target;
}

describe('TweetInfoExtractor hostile DOM boundaries', () => {
  const extractor = new TweetInfoExtractor();

  it.each([
    {
      label: 'direct attacker-owned status link',
      markup:
        '<a id="target" href="https://attacker.example/alice/status/123">spoofed status</a>',
      selector: '#target',
    },
    {
      label: 'lookalike host selected from a tweet container',
      markup:
        '<article data-testid="tweet"><a href="https://x.com.attacker.example/alice/status/123">spoofed status</a><span id="target">media</span></article>',
      selector: '#target',
    },
    {
      label: 'trusted hostname hidden in attacker URL credentials',
      markup:
        '<a href="https://x.com@attacker.example/alice/status/123"><img id="target" alt="media"></a>',
      selector: '#target',
    },
    {
      label: 'status-shaped path embedded only in an attacker query',
      markup:
        '<a id="target" href="https://attacker.example/redirect?next=/alice/status/123">redirect</a>',
      selector: '#target',
    },
  ])('rejects $label', ({ markup, selector }) => {
    const target = renderTarget(markup, selector);

    expect(extractor.extract(target)).toBeNull();
  });

  it.each([
    {
      href: '/alice/status/123/photo/1',
      expected: 'https://x.com/alice/status/123/photo/1',
    },
    {
      href: '//twitter.com/alice/status/123',
      expected: 'https://x.com/alice/status/123',
    },
  ])('normalizes a trusted status link without changing its status path', ({ href, expected }) => {
    const target = renderTarget(`<a id="target" href="${href}">status</a>`, '#target');

    expect(extractor.extract(target)).toMatchObject({
      tweetId: '123',
      username: 'alice',
      tweetUrl: expected,
    });
  });

  it('prefers the status link containing the clicked quote-tweet video', () => {
    const target = renderTarget(
      [
        '<article data-testid="tweet">',
        '  <a href="/original/status/111/photo/1">',
        '    <img src="https://pbs.twimg.com/media/original.jpg" alt="quoted original image">',
        '  </a>',
        '  <a href="/author/status/222/video/1">',
        '    <div data-testid="videoPlayer">',
        '      <video id="target" poster="https://pbs.twimg.com/ext_tw_video_thumb/video.jpg"></video>',
        '    </div>',
        '  </a>',
        '</article>',
      ].join(''),
      '#target'
    );

    expect(extractor.extract(target)).toMatchObject({
      tweetId: '222',
      username: 'author',
      tweetUrl: 'https://x.com/author/status/222/video/1',
      extractionMethod: 'media-grid-item',
    });
  });
});
