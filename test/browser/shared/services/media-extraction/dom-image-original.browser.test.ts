// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { HttpRequestDetails, HttpRequestResponse } from '@platform/types';
import { planBulkDownload } from '@shared/core/download/download-plan';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import type { TweetInfo } from '@shared/types/media.types';
import { afterEach, expect, it, vi } from 'vite-plus/test';

const mock = vi.hoisted(() => ({
  request: vi.fn<(details: HttpRequestDetails) => { abort(): void }>(),
}));
vi.mock('@platform/index', () => ({ getHttpRequestAdapter: () => ({ request: mock.request }) }));

const owner: TweetInfo = {
  tweetId: '222',
  username: 'author',
  tweetUrl: 'https://x.com/author/status/222',
  extractionMethod: 'fixture',
  confidence: 1,
};
const display = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?format=webp&name=small';

afterEach(() => {
  document.body.replaceChildren();
  mock.request.mockReset();
});

function successfulWebp(details: HttpRequestDetails): HttpRequestResponse {
  return {
    finalUrl: details.url,
    readyState: 4,
    status: 200,
    statusText: '',
    responseHeaders: 'Content-Type: image/webp',
    response: '',
    responseText: '',
    readable: true,
  };
}

it('selects confirmed same-photo JPEG before single and ZIP source naming', async () => {
  document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><a href="/author/status/222/photo/1"><img id="target" src="${display}"></a></article>`;
  mock.request.mockImplementation((details) => {
    const format = new URL(details.url).searchParams.get('format');
    const status = format === 'webp' ? 404 : 200;
    const response: HttpRequestResponse = {
      finalUrl: details.url,
      readyState: 4,
      status,
      statusText: '',
      responseHeaders: `Content-Type: ${format === 'jpg' ? 'image/jpeg' : 'text/html'}`,
      response: '',
      responseText: '',
      readable: true,
    };
    queueMicrotask(() => details.onload?.(response));
    return { abort: vi.fn() };
  });
  const result = await new DOMFallbackExtractor().extract(
    owner,
    document.getElementById('target')!,
    {},
    'original-source-contract'
  );
  expect(result.success).toBe(true);
  const selected = result.mediaItems[0]!;
  const jpeg = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?format=jpg&name=orig';
  expect(selected).toMatchObject({
    url: display,
    originalUrl: jpeg,
    attachmentOrdinal: 0,
    downloadSource: { url: jpeg, quality: 'cdn-original', provenance: 'dom' },
  });
  expect(selected.attachmentSourceKey).toMatch(/^source-/u);
  expect(generateMediaFilename(selected)).toBe('author_222_0.jpg');
  expect(planBulkDownload({ mediaItems: result.mediaItems }).items[0]).toMatchObject({
    url: jpeg,
    desiredName: 'author_222_0.jpg',
  });
  expect(mock.request).toHaveBeenCalledTimes(2);
});

it('prioritizes the clicked attachment and bounds distinct source probes', async () => {
  document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a>${Array.from({ length: 6 }, (_, index) => `<a href="/author/status/222/photo/${index + 1}"><img id="photo-${index}" src="https://pbs.twimg.com/media/PHOTO${index}?format=webp&name=small"></a>`).join('')}</article>`;
  mock.request.mockImplementation((details) => {
    queueMicrotask(() => details.onload?.(successfulWebp(details)));
    return { abort: vi.fn() };
  });
  const result = await new DOMFallbackExtractor().extract(
    owner,
    document.getElementById('photo-5')!,
    {},
    'probe-limit'
  );
  expect(result.success).toBe(true);
  expect(result.clickedIndex).toBe(5);
  expect(result.mediaItems.map((media) => media.attachmentOrdinal)).toEqual([0, 1, 2, 3, 4, 5]);
  expect(result.mediaItems[5]?.downloadSource?.quality).toBe('cdn-original');
  expect(result.mediaItems[3]?.downloadSource?.quality).toBe('unverified-original');
  expect(result.mediaItems[4]?.downloadSource?.quality).toBe('unverified-original');
  expect(mock.request).toHaveBeenCalledTimes(4);
  expect(mock.request.mock.calls[0]?.[0].url).toContain('/media/PHOTO5?');
});

it('shares one original probe across display variants without changing attachment positions', async () => {
  document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><a href="/author/status/222/photo/1"><img id="target" src="${display}"></a><a href="/author/status/222/photo/2"><img src="${display.replace('name=small', 'name=large')}"></a></article>`;
  mock.request.mockImplementation((details) => {
    queueMicrotask(() => details.onload?.(successfulWebp(details)));
    return { abort: vi.fn() };
  });
  const result = await new DOMFallbackExtractor().extract(
    owner,
    document.getElementById('target')!,
    {},
    'duplicate-original'
  );
  expect(result.success).toBe(true);
  expect(result.mediaItems.map((media) => media.attachmentOrdinal)).toEqual([0, 1]);
  expect(result.mediaItems.map((media) => media.tweetId)).toEqual(['222', '222']);
  expect(mock.request).toHaveBeenCalledOnce();
});

it('rejects a clicked subtree detached while its original probe is pending', async () => {
  document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><a href="/author/status/222/photo/1"><img id="target" src="${display}"></a></article>`;
  let request: HttpRequestDetails | undefined;
  mock.request.mockImplementation((details) => {
    request = details;
    return { abort: vi.fn() };
  });
  const target = document.getElementById('target')!;
  const pending = new DOMFallbackExtractor().extract(owner, target, {}, 'detached-original');
  document.body.replaceChildren();
  expect(request).toBeDefined();
  request?.onload?.(successfulWebp(request));
  const result = await pending;
  expect(result.success).toBe(false);
  expect(result.metadata?.strategy).toBe('dom-clicked-media-unavailable');
});
