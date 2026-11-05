// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import fixtureHtml from '../../e2e/fixtures/installed-video-save-format-page.html?raw';
import { planBulkDownload } from '@shared/core/download/download-plan';
import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

async function extract(kind: string) {
  const target = document.querySelector<HTMLElement>(`[data-format-case="${kind}"] video`)!;
  const owner = new TweetInfoExtractor().extract(target)!;
  expect(owner?.tweetId).toMatch(/^466600000000000048[4-7]$/);
  return new DOMFallbackExtractor().extract(owner, target, {}, `installed-${kind}`);
}

describe('owned installed video-format fixture', () => {
  beforeEach(() => {
    document.body.innerHTML = fixtureHtml;
  });
  afterEach(() => document.body.replaceChildren());

  it('keeps the owned direct MP4 and image in their actual ZIP order', async () => {
    const result = await extract('direct-mp4');
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems.map(({ type }) => type)).toEqual(['image', 'video']);
    expect(
      planBulkDownload({ mediaItems: result.mediaItems }).items.map(
        ({ desiredName }) => desiredName
      )
    ).toEqual([
      'format_fixture_4666000000000000484_source-b44cfa31f709d13f.jpg',
      'format_fixture_4666000000000000484_source-433f260a01b3e905.mp4',
    ]);
  });

  it.each(['playlist', 'unknown', 'conflict'])('does not offer %s as a save item', async (kind) => {
    const result = await extract(kind);
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
  });
});
