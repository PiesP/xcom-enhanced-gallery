// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import type { GMXMLHttpRequestDetails } from '../../../src/shared/types/core/userscript';
import { installGMMock } from './gm-mock';
import { injectDevUserscript, waitForGalleryApp } from './userscript-harness';

export const LARGE_PHOTO_HANDLE = 'fixture_owner_';
export const LARGE_PHOTO_OWNERS = [
  '9000000000000000001',
  '9000000000000000002',
  '9000000000000000003',
] as const;
const jpeg = readFileSync(resolve(import.meta.dirname, 'large-photo-narrow.jpg'));

export type PhotoExpectation = {
  ownerId: string;
  ordinal: number;
  sourceKey: string;
  mediaId: string;
  url: string;
  filename: string;
  bytes: Buffer;
};

/** Independent valid JPEG fixtures, distinguished by a bounded JPEG COM segment. */
export function photoExpectations(ownerIndex: number, count: number): PhotoExpectation[] {
  const ownerId = LARGE_PHOTO_OWNERS[ownerIndex]!;
  return Array.from({ length: count }, (_, ordinal) => {
    // B and C reuse one actual CDN source; identities and filenames still differ.
    const sourceKey =
      ownerIndex === 2 && ordinal === 3
        ? 'LargePhotoB3'
        : `LargePhoto${'ABC'[ownerIndex]}${ordinal}`;
    const comment = Buffer.from(sourceKey);
    const header = Buffer.alloc(4);
    header.writeUInt16BE(0xfffe, 0);
    header.writeUInt16BE(comment.length + 2, 2);
    return {
      ownerId,
      ordinal,
      sourceKey,
      mediaId: `${ownerId}-${ordinal}`,
      url: `https://pbs.twimg.com/media/${sourceKey}.jpg?format=jpg&name=orig`,
      filename: `${LARGE_PHOTO_HANDLE}_${ownerId}_${ordinal}.jpg`,
      bytes: Buffer.concat([jpeg.subarray(0, 2), header, comment, jpeg.subarray(2)]),
    };
  });
}

function tweet(
  items: readonly PhotoExpectation[],
  quote?: Record<string, unknown>
): Record<string, unknown> {
  const ownerId = items[0]!.ownerId;
  return {
    rest_id: ownerId,
    core: {
      user_results: {
        result: { legacy: { screen_name: LARGE_PHOTO_HANDLE, name: 'Fixture owner' } },
      },
    },
    legacy: {
      id_str: ownerId,
      full_text: 'Source-known bounded photo fixture',
      extended_entities: {
        media: items.map((item) => ({
          type: 'photo',
          id_str: item.mediaId,
          media_key: `3_${item.mediaId}`,
          media_url_https: `https://pbs.twimg.com/media/${item.sourceKey}.jpg`,
          expanded_url: `https://x.com/${LARGE_PHOTO_HANDLE}/status/${ownerId}/photo/${item.ordinal + 1}`,
          original_info: { width: 54, height: 1080 },
        })),
      },
    },
    ...(quote ? { quoted_status_result: { result: quote } } : {}),
  };
}

function article(items: readonly PhotoExpectation[], quote = '', webp = false): string {
  const ownerId = items[0]!.ownerId;
  return `<article data-testid="tweet"><a id="status-${ownerId}" href="/${LARGE_PHOTO_HANDLE}/status/${ownerId}"><time>Owned status</time></a><div class="tiles">${items.map((item) => `<a href="/${LARGE_PHOTO_HANDLE}/status/${ownerId}/photo/${item.ordinal + 1}"><div data-testid="tweetPhoto"><img id="photo-${ownerId}-${item.ordinal}" src="https://pbs.twimg.com/media/${item.sourceKey}${webp ? '?format=webp' : '.jpg?format=jpg'}&amp;name=medium" alt="Owned photo ${item.ordinal + 1}"></div></a>`).join('')}</div>${quote ? `<div role="link" class="quote">${quote}</div>` : ''}</article>`;
}

/** Controlled provider/DOM transport, never a live X or installed-manager receipt. */
export async function setupLargePhotoFixture(
  page: Page,
  options: {
    count: number;
    requestedOwner?: 0 | 1 | 2;
    quote?: boolean;
    nested?: boolean;
    domFallback?: boolean;
  }
): Promise<PhotoExpectation[]> {
  const groups = [
    photoExpectations(0, options.count),
    photoExpectations(1, options.count),
    photoExpectations(2, options.count),
  ];
  const requestedOwner = options.requestedOwner ?? 0;
  const nestedTweet = options.nested ? tweet(groups[2]!) : undefined;
  const middleTweet = tweet(groups[1]!, nestedTweet);
  const outerTweet = tweet(groups[0]!, options.quote ? middleTweet : undefined);
  const responses = Object.fromEntries(
    [outerTweet, middleTweet, tweet(groups[2]!)].map((value) => [
      String(value.rest_id),
      { data: { tweetResult: { result: value } } },
    ])
  );
  const nestedHtml = options.nested ? article(groups[2]!) : '';
  const quoteHtml = options.quote ? article(groups[1]!, nestedHtml) : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Large source-known photo fixture</title><style>body{margin:0;background:#222;color:white;font:16px sans-serif}article{padding:12px}.tiles{display:flex;flex-wrap:wrap;gap:8px}.tiles img{width:120px;height:90px;object-fit:cover}.quote{border:1px solid #888;padding:8px}</style></head><body>${article(groups[requestedOwner]!, requestedOwner === 0 ? quoteHtml : requestedOwner === 1 ? nestedHtml : '', options.domFallback)}</body></html>`;
  const all = groups.flat();
  const bySource = new Map(all.map((item) => [item.sourceKey, item.bytes]));
  await page.route('https://pbs.twimg.com/**', async (route) => {
    const url = new URL(route.request().url());
    const key = url.pathname
      .split('/')
      .at(-1)!
      .replace(/\.jpg$/u, '');
    const body = bySource.get(key);
    const missingWebp =
      options.domFallback &&
      url.searchParams.get('name') === 'orig' &&
      url.searchParams.get('format') === 'webp';
    await route.fulfill({
      status: body && !missingWebp ? 200 : 404,
      contentType: 'image/jpeg',
      headers: {
        'access-control-allow-origin': '*',
        'content-length': String(body && !missingWebp ? body.length : 0),
      },
      body: route.request().method() === 'HEAD' || missingWebp ? '' : (body ?? ''),
    });
  });
  await page.route('https://x.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html })
  );
  await page.goto(
    `https://x.com/${LARGE_PHOTO_HANDLE}/status/${LARGE_PHOTO_OWNERS[requestedOwner]}`,
    { waitUntil: 'domcontentloaded' }
  );
  await installGMMock(page, { downloadApi: false });
  await page.evaluate(
    ({ responses, apiFailure }) => {
      document.cookie = 'ct0=source-known-fixture-token; path=/';
      Object.defineProperty(window, 'GM_xmlhttpRequest', {
        configurable: true,
        value: (details: GMXMLHttpRequestDetails) => {
          const controller = new AbortController();
          let stopped = false;
          void (async () => {
            const parsed = new URL(details.url);
            const variables = JSON.parse(parsed.searchParams.get('variables') ?? '{}') as {
              tweetId?: string;
            };
            if (variables.tweetId) {
              const value = responses[variables.tweetId] ?? {};
              const text = JSON.stringify(value);
              if (!stopped) {
                details.onload?.({
                  finalUrl: details.url,
                  readyState: 4,
                  status: apiFailure ? 403 : 200,
                  statusText: apiFailure ? 'Forbidden' : 'OK',
                  responseHeaders: 'Content-Type: application/json',
                  response:
                    details.responseType === 'arraybuffer'
                      ? new TextEncoder().encode(text).buffer
                      : value,
                  responseText: text,
                  context: details.context,
                });
              }
              return;
            }
            try {
              const response = await fetch(details.url, {
                method: details.method ?? 'GET',
                signal: controller.signal,
              });
              const body = await response.arrayBuffer();
              if (!stopped) {
                details.onload?.({
                  finalUrl: response.url,
                  readyState: 4,
                  status: response.status,
                  statusText: response.statusText,
                  responseHeaders: Array.from(
                    response.headers,
                    ([key, value]) => `${key}: ${value}`
                  ).join('\r\n'),
                  response:
                    details.responseType === 'blob'
                      ? new Blob([body], { type: response.headers.get('content-type') ?? '' })
                      : details.responseType === 'arraybuffer'
                        ? body
                        : new TextDecoder().decode(body),
                  responseText: '',
                  context: details.context,
                });
              }
            } catch {
              if (!stopped) {
                details.onerror?.({
                  finalUrl: details.url,
                  readyState: 4,
                  status: 0,
                  statusText: 'Fixture transport failed',
                  responseHeaders: '',
                  response: null,
                  responseText: '',
                  context: details.context,
                });
              }
            }
          })();
          return {
            abort: () => {
              stopped = true;
              controller.abort();
            },
          };
        },
      });
    },
    { responses, apiFailure: options.domFallback ?? false }
  );
  await injectDevUserscript(page);
  await waitForGalleryApp(page);
  return requestedOwner === 0 && options.quote
    ? [...groups[1]!, ...groups[0]!]
    : requestedOwner === 1 && options.nested
      ? [...groups[2]!, ...groups[1]!]
      : groups[requestedOwner]!;
}
