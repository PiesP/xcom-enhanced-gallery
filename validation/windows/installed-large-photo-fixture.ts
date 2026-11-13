// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrowserContext, Route } from '@playwright/test';
import {
  runLivePhotoCollection,
  type PhotoCollectionContract,
  type PhotoExpectedReference,
  type PhotoOwner,
} from './live-photo-collection.ts';

const A: PhotoOwner = { handle: 'fixture_a', statusId: '9666600000000000001', count: 20 };
const B: PhotoOwner = { handle: 'fixture_b', statusId: '9666600000000000002', count: 20 };
const ownerUrl = (owner: PhotoOwner) => `https://x.com/${owner.handle}/status/${owner.statusId}`;
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** A JPEG comment changes source bytes without changing image decodability. */
export function markedLargePhotoJpeg(source: Buffer, marker: string): Buffer {
  assert(source.length >= 4 && source[0] === 0xff && source[1] === 0xd8);
  assert(/^[AB](?:0[0-9]|1[0-9])$/u.test(marker));
  const comment = Buffer.from(`XEG installed large photo ${marker}`, 'ascii');
  const segment = Buffer.alloc(comment.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xfe;
  segment.writeUInt16BE(comment.length + 2, 2);
  comment.copy(segment, 4);
  return Buffer.concat([source.subarray(0, 2), segment, source.subarray(2)]);
}

type FixturePhoto = {
  owner: PhotoOwner;
  ordinal: number;
  mediaId: string;
  displayUrl: string;
  reference: PhotoExpectedReference;
  bytes: Buffer;
};

function photoHtml(item: FixturePhoto): string {
  const href = `/${item.owner.handle}/status/${item.owner.statusId}/photo/${item.ordinal + 1}`;
  return `<div data-testid="tweetPhoto" class="photo"><a href="${href}"><img src="${item.displayUrl.replaceAll('&', '&amp;')}" alt="Installed photo ${item.owner.handle} ${item.ordinal + 1}" width="320" height="180" tabindex="0"></a></div>`;
}

function pageHtml(
  owner: PhotoOwner,
  photos: readonly FixturePhoto[],
  quote?: readonly FixturePhoto[]
): string {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Installed large photo fixture</title><style>
    body{margin:0;padding:20px;background:#000;color:#e7e9ea;font-family:Segoe UI,sans-serif}
    main{max-width:600px;margin:auto}.photo{margin:8px 0}.photo img{display:block;width:320px;height:180px}
    [data-testid="quoteTweet"]{margin:12px;padding:12px;border:1px solid #555}
  </style></head><body><main><article data-testid="tweet">
    <a href="/${owner.handle}/status/${owner.statusId}"><time datetime="2026-11-13T00:00:00Z">Fixture post</time></a>
    <div data-testid="tweetText"><p>Installed source-known 20 photo fixture.</p></div>
    ${photos.map(photoHtml).join('')}
    ${quote ? `<div data-testid="quoteTweet"><a href="/${B.handle}/status/${B.statusId}"><time>Quoted fixture</time></a>${quote.map(photoHtml).join('')}</div>` : ''}
  </article></main></body></html>`;
}

function providerTweet(owner: PhotoOwner, photos: readonly FixturePhoto[], quote?: unknown) {
  return {
    __typename: 'Tweet',
    rest_id: owner.statusId,
    core: {
      user_results: {
        result: {
          rest_id: owner.statusId,
          legacy: { screen_name: owner.handle, name: owner.handle },
        },
      },
    },
    legacy: {
      id_str: owner.statusId,
      full_text: 'Installed source-known photo fixture',
      extended_entities: {
        media: photos.map((item) => ({
          type: 'photo',
          id_str: item.mediaId,
          media_key: `3_${item.mediaId}`,
          media_url_https: `https://pbs.twimg.com/media/${item.reference.sourceKey}.jpg`,
          expanded_url: `${ownerUrl(owner)}/photo/${item.ordinal + 1}`,
          original_info: { width: 320, height: 180 },
        })),
      },
    },
    ...(quote ? { quoted_status_result: { result: quote } } : {}),
  };
}

export function createInstalledLargePhotoFixture(source: Buffer) {
  const make = (owner: PhotoOwner, letter: 'A' | 'B'): FixturePhoto[] =>
    Array.from({ length: 20 }, (_, ordinal) => {
      const marker = `${letter}${String(ordinal).padStart(2, '0')}`;
      const sourceKey = `XegLarge${marker}`;
      const originalUrl = `https://pbs.twimg.com/media/${sourceKey}.jpg?format=jpg&name=orig`;
      const bytes = markedLargePhotoJpeg(source, marker);
      return {
        owner,
        ordinal,
        mediaId: `${owner.statusId}${String(ordinal).padStart(2, '0')}`,
        displayUrl: `https://pbs.twimg.com/media/${sourceKey}.jpg?format=jpg&name=large`,
        reference: {
          ownerId: owner.statusId,
          ordinal,
          sourceKey,
          originalUrl,
          filename: `${owner.handle}_${owner.statusId}_${ordinal}.jpg`,
          bytes: bytes.length,
          sha256: hash(bytes),
        },
        bytes,
      };
    });
  const requested = make(A, 'A');
  const quoted = make(B, 'B');
  const originals = new Map(
    [...quoted, ...requested].map((item) => [item.reference.originalUrl, item.bytes])
  );
  const quoteTweet = providerTweet(B, quoted);
  const apiResponses = new Map([
    [B.statusId, Buffer.from(JSON.stringify({ data: { tweetResult: { result: quoteTweet } } }))],
    [
      A.statusId,
      Buffer.from(
        JSON.stringify({
          data: {
            tweetResult: {
              result: providerTweet(A, requested, quoteTweet),
            },
          },
        })
      ),
    ],
  ]);
  const contract: PhotoCollectionContract = {
    requested: A,
    directQuote: B,
    expected: [...quoted, ...requested].map((item) => item.reference),
  };
  return {
    contract,
    originals,
    apiResponses,
    pages: new Map([
      [ownerUrl(B), pageHtml(B, quoted)],
      [ownerUrl(A), pageHtml(A, requested, quoted)],
    ]),
    photos: [...quoted, ...requested],
  };
}

type NativeFixture = ReturnType<typeof createInstalledLargePhotoFixture>;

/** Runs inside the already installed distribution and its fresh owned profile. */
export async function runInstalledLargePhotoFixture({
  context,
  extensionId,
  downloads,
  output,
  root,
  installNative,
  managerObserver = null,
}: {
  context: BrowserContext;
  extensionId: string;
  downloads: string;
  output: string;
  root: string;
  installNative: (fixture: NativeFixture) => void;
  managerObserver?: Parameters<typeof runLivePhotoCollection>[0]['managerObserver'];
}) {
  const fixture = createInstalledLargePhotoFixture(
    await readFile(join(root, 'test/e2e/fixtures/large-photo-narrow.jpg'))
  );
  installNative(fixture);
  const bytesByStem = new Map(fixture.photos.map((item) => [item.reference.sourceKey, item.bytes]));
  const requests: Array<{ kind: string; status: number; key?: string }> = [];
  let overflow = false;
  const route = async (requestRoute: Route) => {
    const request = requestRoute.request();
    const url = new URL(request.url());
    if (url.protocol === 'chrome-extension:') {
      await requestRoute.continue();
      return;
    }
    const page = fixture.pages.get(url.href);
    if (page && request.isNavigationRequest() && request.method() === 'GET') {
      await requestRoute.fulfill({ status: 200, contentType: 'text/html', body: page });
      requests.push({ kind: 'document', status: 200 });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname.endsWith('/TweetResultByRestId')) {
      let id: string | undefined;
      try {
        const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? '{}');
        if (variables && typeof variables === 'object' && 'tweetId' in variables) {
          id = String(variables.tweetId);
        }
      } catch {
        /* Reject malformed fixture API input below. */
      }
      const body = id ? fixture.apiResponses.get(id) : undefined;
      assert(body && request.method() === 'GET', 'Undeclared large-photo API request');
      await requestRoute.fulfill({ status: 200, contentType: 'application/json', body });
      requests.push({ kind: 'api', status: 200 });
      return;
    }
    if (
      url.hostname === 'pbs.twimg.com' &&
      /^\/media\/XegLarge[AB]\d{2}\.jpg$/u.test(url.pathname)
    ) {
      const key = url.pathname.slice('/media/'.length, -'.jpg'.length);
      const bytes = bytesByStem.get(key);
      assert(bytes, 'Undeclared large-photo source');
      if (url.search === '?format=jpg&name=orig') {
        await requestRoute.continue();
      } else {
        assert(
          ['large', 'medium', 'small', 'thumb'].some(
            (name) => url.search === `?format=jpg&name=${name}`
          ) && request.resourceType() === 'image',
          'Undeclared large-photo preview'
        );
        await requestRoute.fulfill({ status: 200, contentType: 'image/jpeg', body: bytes });
      }
      if (requests.length < 512) {
        requests.push({ kind: 'media', status: 200, key });
      } else {
        overflow = true;
      }
      return;
    }
    if (url.hostname === 'x.com' && url.pathname === '/favicon.ico') {
      await requestRoute.fulfill({ status: 204, body: '' });
      return;
    }
    if (url.hostname === 'x.com' || url.hostname === 'pbs.twimg.com') {
      throw new Error('Undeclared large-photo fixture request');
    }
    await requestRoute.abort();
  };
  const receipt: Record<string, unknown> = {
    status: 'failed',
    scope: 'source-known installed 20/40 photo fixture; separate from actual public X',
    originals: fixture.contract.expected.map((item) => ({
      ownerId: item.ownerId,
      ordinal: item.ordinal,
      sourceKey: item.sourceKey,
      bytes: item.bytes,
      sha256: item.sha256,
    })),
  };
  let primaryError: unknown;
  await context.route('**/*', route);
  try {
    const proof = await runLivePhotoCollection({
      context,
      extensionId,
      contract: fixture.contract,
      downloads,
      output,
      managerObserver,
      fixture: {
        originals: fixture.originals,
        receiptFile: 'installed-large-photo-collection.json',
        retainedPrefix: 'installed-large-photo',
        scope: 'source-known installed photo fixture; not actual public X acceptance',
      },
    });
    receipt.proof = proof;
    assert.equal(proof.status, 'observed', 'Installed 20/40 fixture proof is incomplete');
    receipt.status = 'passed';
  } catch (error) {
    primaryError = error;
    receipt.error = error instanceof Error ? error.message : String(error);
  } finally {
    receipt.requests = requests;
    receipt.requestOverflow = overflow;
    try {
      await context.unroute('**/*', route);
      receipt.routeRemoved = true;
    } catch (error) {
      receipt.routeRemovalError = error instanceof Error ? error.message : String(error);
      if (!primaryError) {
        primaryError = error;
      }
      receipt.status = 'failed';
    }
    await writeFile(
      join(output, 'installed-large-photo-fixture.json'),
      JSON.stringify(receipt, null, 2),
      { flag: 'wx', mode: 0o600 }
    );
  }
  if (primaryError) {
    throw primaryError;
  }
  return receipt;
}
