// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import installedGalleryHtml from '../../../../e2e/fixtures/installed-gallery-page.html?raw';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import type { TweetInfo } from '@shared/types/media.types';
import { afterEach, describe, expect, it } from 'vite-plus/test';

const tweetId = '1234567890123456789';
const owner: TweetInfo = {
  tweetId,
  username: 'testuser',
  tweetUrl: `https://x.com/testuser/status/${tweetId}`,
  extractionMethod: 'fixture',
  confidence: 1,
};

function installFixture() {
  document.body.innerHTML = new DOMParser().parseFromString(
    installedGalleryHtml,
    'text/html'
  ).body.innerHTML;
}

async function namesForPhase(phase: string) {
  const article = document.querySelector<HTMLElement>(`article[data-phase="${phase}"]`);
  expect(article).not.toBeNull();
  const target = article!.querySelector('img');
  expect(target).not.toBeNull();
  const result = await new DOMFallbackExtractor().extract(owner, target!, {}, 'installed-gallery');
  expect(result.success).toBe(true);
  return result.mediaItems.map((media) => generateMediaFilename(media));
}

describe('installed classic gallery filename contract', () => {
  afterEach(() => document.body.replaceChildren());

  it('retains source-bound positions for all four known three-photo phases', async () => {
    installFixture();
    const expected = [
      'testuser_1234567890123456789_0.jpg',
      'testuser_1234567890123456789_1.jpg',
      'testuser_1234567890123456789_2.jpg',
    ];
    for (const phase of ['normal', 'failure', 'partial', 'held']) {
      const article = document.querySelector<HTMLElement>(`article[data-phase="${phase}"]`);
      expect(article?.querySelectorAll('[data-testid="tweetPhoto"] > a[href]')).toHaveLength(3);
      expect(await namesForPhase(phase)).toEqual(expected);
    }
  });

  it('uses literal stable source identities if the same fixture lacks photo-position links', async () => {
    installFixture();
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      'article[data-route="classic"] [data-testid="tweetPhoto"] > a[href]'
    )) {
      link.replaceWith(...Array.from(link.childNodes));
    }
    expect((await namesForPhase('normal'))[0]).toBe(
      `testuser_${tweetId}_source-b44cfa31f709d13f.jpg`
    );
    expect((await namesForPhase('failure'))[0]).toBe(
      `testuser_${tweetId}_source-dc0e3809cf9968aa.jpg`
    );
    expect((await namesForPhase('partial'))[0]).toBe(
      `testuser_${tweetId}_source-eef3b4acbd4dcb74.jpg`
    );
    expect((await namesForPhase('held'))[0]).toBe(
      `testuser_${tweetId}_source-6709d267f3b49acc.jpg`
    );
  });
});
