// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrowserContext, Route } from '@playwright/test';
import {
  runLivePhotoCollection,
  verifyFixtureServerApiResponses,
  type PhotoCollectionContract,
  type PhotoExpectedReference,
  type PhotoOwner,
} from './live-photo-collection.ts';

const A: PhotoOwner = { handle: 'fixture_owner_', statusId: '9666600000000000001', count: 20 };
const B: PhotoOwner = { handle: 'fixture_owner_', statusId: '9666600000000000002', count: 20 };
const DOM: PhotoOwner = { handle: 'fixture_owner_', statusId: '9666600000000000003', count: 20 };
const PHOTO_WIDTH = 54;
const PHOTO_HEIGHT = 1080;
const ownerUrl = (owner: PhotoOwner) => `https://x.com/${owner.handle}/status/${owner.statusId}`;
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** A JPEG comment changes source bytes without changing image decodability. */
export function markedLargePhotoJpeg(
  source: Buffer,
  marker: string,
  variant: 'original' | 'preview' = 'original'
): Buffer {
  assert(source.length >= 4 && source[0] === 0xff && source[1] === 0xd8);
  assert(/^[ABC](?:0[0-9]|1[0-9])$/u.test(marker));
  const comment = Buffer.from(`XEG installed large photo ${marker} ${variant}`, 'ascii');
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
  previewBytes: Buffer;
};

function photoHtml(item: FixturePhoto): string {
  const href = `/${item.owner.handle}/status/${item.owner.statusId}/photo/${item.ordinal + 1}`;
  return `<div data-testid="tweetPhoto" class="photo"><a href="${href}"><img src="${item.displayUrl.replaceAll('&', '&amp;')}" alt="Installed photo ${item.owner.handle} ${item.ordinal + 1}" width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT}" tabindex="0"></a></div>`;
}

function pageHtml(
  owner: PhotoOwner,
  photos: readonly FixturePhoto[],
  quote?: readonly FixturePhoto[]
): string {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Installed large photo fixture</title><style>
    body{margin:0;padding:20px;background:#000;color:#e7e9ea;font-family:Segoe UI,sans-serif}
    main{max-width:600px;margin:auto}.photo{margin:8px 0}.photo a{display:block;width:max-content}.photo img{display:block;max-width:54px;width:auto;height:auto}
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
          rest_id: '9666600000000099999',
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
          original_info: { width: PHOTO_WIDTH, height: PHOTO_HEIGHT },
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
      const previewBytes = markedLargePhotoJpeg(source, marker, 'preview');
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
        previewBytes,
      };
    });
  const requested = make(A, 'A');
  const quoted = make(B, 'B');
  const domPhotos = quoted.map((photo, ordinal) => {
    const marker = `C${String(ordinal).padStart(2, '0')}`;
    const sourceKey = `XegDom${String(ordinal).padStart(2, '0')}`;
    const bytes = markedLargePhotoJpeg(source, marker);
    return {
      ...photo,
      owner: DOM,
      mediaId: `${DOM.statusId}_dom_${ordinal}`,
      displayUrl: `https://pbs.twimg.com/media/${sourceKey}?format=webp&name=large`,
      bytes,
      previewBytes: markedLargePhotoJpeg(source, marker, 'preview'),
      reference: {
        ...photo.reference,
        ownerId: DOM.statusId,
        sourceKey,
        originalUrl: `https://pbs.twimg.com/media/${sourceKey}?format=jpg&name=orig`,
        filename: `${DOM.handle}_${DOM.statusId}_${ordinal}.jpg`,
        bytes: bytes.length,
        sha256: hash(bytes),
      },
    };
  });
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
    dom: {
      contract: {
        requested: DOM,
        directQuote: null,
        expected: domPhotos.map((item) => item.reference),
      },
      originals: new Map(domPhotos.map((item) => [item.reference.originalUrl, item.bytes])),
      pages: new Map([[ownerUrl(DOM), pageHtml(DOM, domPhotos)]]),
      photos: domPhotos,
    },
  };
}

type NativeFixture = ReturnType<typeof createInstalledLargePhotoFixture>;

type FixtureRouteEvent = {
  kind: string;
  status: number;
  key?: string;
  purpose?: string;
  method?: string;
  resourceType?: string;
};
type NativeSnapshot = {
  overflow: boolean;
  unexpectedCount: number;
  activeCount: number;
  domProbePeak?: number;
  events?: readonly { sourceUrl?: string; method: string; status?: number; result: string }[];
};

/** Resolve display and original responses from the same identity but different bytes. */
export function largePhotoFixtureMedia(
  photos: readonly FixturePhoto[],
  source: string,
  resourceType: string,
  method = 'GET'
): {
  purpose: 'display-original' | 'original' | 'missing-original' | 'preview';
  key: string;
  bytes: Buffer;
} {
  const url = new URL(source);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'pbs.twimg.com');
  assert.match(url.pathname, /^\/media\/(?:XegLarge[AB]\d{2}\.jpg|XegDom\d{2})$/u);
  const key = url.pathname.slice('/media/'.length).replace(/\.jpg$/u, '');
  const photo = photos.find((item) => item.reference.sourceKey === key);
  assert(photo, 'Undeclared large-photo source');
  if (source === photo.reference.originalUrl) {
    return {
      purpose: resourceType === 'image' && method === 'GET' ? 'display-original' : 'original',
      key,
      bytes: photo.bytes,
    };
  }
  if (key.startsWith('XegDom') && url.search === '?format=webp&name=orig') {
    return { purpose: 'missing-original', key, bytes: Buffer.alloc(0) };
  }
  assert.deepEqual([...url.searchParams.keys()], ['format', 'name']);
  assert.equal(url.searchParams.get('format'), key.startsWith('XegDom') ? 'webp' : 'jpg');
  assert(
    ['large', 'medium', 'small', 'thumb'].includes(url.searchParams.get('name') ?? ''),
    'Undeclared large-photo preview'
  );
  assert.equal(resourceType, 'image', 'Large-photo preview has another request purpose');
  return { purpose: 'preview', key, bytes: photo.previewBytes };
}

/** A failed evidence phase may yield to independent work only after owned cleanup. */
export function assertPhotoFixtureIdle(
  proof: Record<string, unknown>,
  native: NativeSnapshot,
  routeOverflow: boolean
): void {
  assert.equal(proof.extensionPageClosed, true, 'API observer page did not close');
  assert(
    Array.isArray(proof.visits) &&
      proof.visits.length === 2 &&
      proof.visits.every(
        (visit) => visit && typeof visit === 'object' && visit.pageClosed === true
      ),
    'API visits did not all finish owned-page cleanup'
  );
  assert.equal(native.activeCount, 0, 'Original transport remained active before DOM phase');
  assert.equal(native.overflow, false, 'Original transport overflowed before DOM phase');
  assert.equal(native.unexpectedCount, 0, 'Unexpected original transport request before DOM phase');
  assert.equal(routeOverflow, false, 'Fixture route overflowed before DOM phase');
}

/** Every routed request consumes one bounded slot before it can be served. */
export function createInstalledLargePhotoRouteBudget(limit = 512) {
  assert(Number.isSafeInteger(limit) && limit > 0 && limit <= 512);
  const events: FixtureRouteEvent[] = [];
  let overflow = false;
  return {
    events,
    get overflow() {
      return overflow;
    },
    async admit(route: Pick<Route, 'abort'>): Promise<FixtureRouteEvent | null> {
      if (events.length >= limit) {
        overflow = true;
        await route.abort();
        return null;
      }
      const event: FixtureRouteEvent = { kind: 'pending', status: 0 };
      events.push(event);
      return event;
    },
  };
}

/** Compare this phase with its own preflight, preserving earlier controlled faults. */
export function assertLargePhotoNativeTransport(
  before: NativeSnapshot,
  after: NativeSnapshot
): void {
  assert.equal(after.overflow, false, 'Large-photo HTTPS fixture overflowed');
  assert.equal(
    after.unexpectedCount,
    before.unexpectedCount,
    'Large-photo HTTPS fixture received an undeclared request'
  );
  assert.equal(after.activeCount, 0, 'Large-photo HTTPS fixture retained an active response');
}

/** Runs inside the already installed distribution and its fresh owned profile. */
export async function runInstalledLargePhotoFixture({
  context,
  extensionId,
  downloads,
  output,
  root,
  installNative,
  installDomNative,
  nativeSnapshot,
  managerObserver = null,
}: {
  context: BrowserContext;
  extensionId: string;
  downloads: string;
  output: string;
  root: string;
  installNative: (fixture: NativeFixture) => void;
  installDomNative?: (fixture: NativeFixture) => void;
  nativeSnapshot: () => NativeSnapshot;
  managerObserver?: Parameters<typeof runLivePhotoCollection>[0]['managerObserver'];
}) {
  const fixture = createInstalledLargePhotoFixture(
    await readFile(join(root, 'test/e2e/fixtures/large-photo-narrow.jpg'))
  );
  const readNative = (): NativeSnapshot => {
    const { overflow, unexpectedCount, activeCount } = nativeSnapshot();
    return { overflow, unexpectedCount, activeCount };
  };
  const beforeNative = readNative();
  installNative(fixture);
  const budget = createInstalledLargePhotoRouteBudget();
  const route = async (requestRoute: Route) => {
    const event = await budget.admit(requestRoute);
    if (!event) {
      return;
    }
    const request = requestRoute.request();
    const url = new URL(request.url());
    if (url.protocol === 'chrome-extension:') {
      event.kind = 'extension';
      await requestRoute.continue();
      return;
    }
    const page = fixture.pages.get(url.href) ?? fixture.dom.pages.get(url.href);
    if (page && request.isNavigationRequest() && request.method() === 'GET') {
      event.kind = 'document';
      event.status = 200;
      await requestRoute.fulfill({ status: 200, contentType: 'text/html', body: page });
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
      assert(request.method() === 'GET', 'Undeclared large-photo API method');
      if (id === fixture.dom.contract.requested.statusId) {
        event.kind = 'dom-api-denied';
        event.status = 403;
        await requestRoute.fulfill({
          status: 403,
          contentType: 'application/json',
          headers: { 'Cache-Control': 'no-store' },
          body: '{}',
        });
        return;
      }
      const body = id ? fixture.apiResponses.get(id) : undefined;
      assert(body, 'Undeclared large-photo API request');
      event.kind = 'api';
      event.status = 200;
      await requestRoute.fulfill({ status: 200, contentType: 'application/json', body });
      return;
    }
    if (
      url.hostname === 'pbs.twimg.com' &&
      /^\/media\/(?:XegLarge[AB]\d{2}\.jpg|XegDom\d{2})$/u.test(url.pathname)
    ) {
      const media = largePhotoFixtureMedia(
        [...fixture.photos, ...fixture.dom.photos],
        url.href,
        request.resourceType(),
        request.method()
      );
      event.kind = 'media';
      event.key = media.key;
      event.purpose = media.purpose;
      event.method = request.method();
      event.resourceType = request.resourceType();
      if (media.purpose !== 'preview' && media.purpose !== 'display-original') {
        await requestRoute.continue();
      } else {
        event.status = 200;
        await requestRoute.fulfill({ status: 200, contentType: 'image/jpeg', body: media.bytes });
      }
      return;
    }
    if (url.hostname === 'x.com' && url.pathname === '/favicon.ico') {
      event.kind = 'favicon';
      event.status = 204;
      await requestRoute.fulfill({ status: 204, body: '' });
      return;
    }
    if (url.hostname === 'x.com' || url.hostname === 'pbs.twimg.com') {
      event.kind = 'unexpected';
      throw new Error('Undeclared large-photo fixture request');
    }
    event.kind = 'blocked';
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
        ...(managerObserver
          ? {
              providerEvidence: {
                snapshot: () => nativeSnapshot().events ?? [],
                bodies: fixture.apiResponses,
              },
            }
          : {}),
      },
    });
    receipt.proof = proof;
    const idleDeadline = Date.now() + 3_000;
    while (nativeSnapshot().activeCount > 0 && Date.now() < idleDeadline) {
      await new Promise((done) => setTimeout(done, 50));
    }
    assertPhotoFixtureIdle(proof, nativeSnapshot(), budget.overflow);
    assert(installDomNative, 'Installed DOM phase requires its own native original route');
    installDomNative(fixture);
    const beforeDomNative = nativeSnapshot();
    assert(beforeDomNative.events, 'DOM original transport observations are unavailable');
    const domProof = await runLivePhotoCollection({
      context,
      extensionId,
      contract: fixture.dom.contract,
      downloads,
      output,
      managerObserver,
      fixture: {
        observation: 'dom',
        ...(managerObserver
          ? {
              providerEvidence: {
                snapshot: () => nativeSnapshot().events ?? [],
                bodies: new Map([[fixture.dom.contract.requested.statusId, Buffer.from('{}')]]),
              },
            }
          : {}),
        originals: fixture.dom.originals,
        receiptFile: 'installed-dom-photo-collection.json',
        retainedPrefix: 'installed-dom-photo',
        scope:
          'source-known installed DOM 20 photo fixture after exact-owner API 403; unknown post total',
        nativeSnapshot: () => {
          const snapshot = nativeSnapshot();
          assert(snapshot.events, 'DOM original transport observations are unavailable');
          return {
            events: snapshot.events,
            ...(snapshot.domProbePeak === undefined ? {} : { domProbePeak: snapshot.domProbePeak }),
          };
        },
      },
    });
    receipt.domProof = domProof;
    assert.equal(proof.status, 'observed', 'Installed 20/40 fixture proof is incomplete');
    assert.equal(domProof.status, 'observed', 'Installed DOM 20 fixture proof is incomplete');
    const afterDomNative = nativeSnapshot();
    assert(afterDomNative.events, 'DOM original transport observations are unavailable');
    receipt.domNativeTransport = {
      eventStart: beforeDomNative.events.length,
      events: afterDomNative.events.slice(beforeDomNative.events.length),
      peakActiveProbes: afterDomNative.domProbePeak,
    };
    assert(
      budget.events.some((event) => event.kind === 'dom-api-denied' && event.status === 403) ||
        (managerObserver &&
          verifyFixtureServerApiResponses(
            afterDomNative.events.slice(beforeDomNative.events.length),
            fixture.dom.contract.requested.statusId,
            Buffer.from('{}'),
            403
          ).length > 0),
      'Installed DOM fixture did not observe a denied API request'
    );
    assert.equal(budget.overflow, false, 'Large-photo fixture route budget exceeded');
    const afterNative = readNative();
    receipt.nativeTransport = { before: beforeNative, after: afterNative };
    assertLargePhotoNativeTransport(beforeNative, afterNative);
    receipt.status = 'passed';
  } catch (error) {
    primaryError = error;
    receipt.error = error instanceof Error ? error.message : String(error);
  } finally {
    receipt.requests = budget.events;
    receipt.requestOverflow = budget.overflow;
    if (!receipt.nativeTransport) {
      receipt.nativeTransport = { before: beforeNative, after: readNative() };
    }
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
