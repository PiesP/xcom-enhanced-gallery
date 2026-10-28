// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, open, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Page, Request } from '@playwright/test';
import { test } from 'vite-plus/test';
import { attachDiagnostics, finishObservedLivePage, liveCompletionPassed } from './live-page.ts';

function request(url = 'https://api.x.com/live_pipeline/events?owned=1') {
  return { url: () => url, failure: () => ({ errorText: 'net::ERR_ABORTED' }) } as Request;
}

function observation(): Parameters<typeof attachDiagnostics>[1] {
  return {
    schemaVersion: 2,
    kind: 'public-x-status-observation',
    requestedUrl: 'https://x.com/owner/status/123',
    finalUrl: 'https://x.com/owner/status/123',
    responseStatus: 200,
    extension: { id: 'owned', readinessMarker: true },
    videoClickMode: 'default',
    target: null,
    gallery: { status: 'observed' },
    api: { tweetResultByRestId: { requests: 0, responses: [] }, observations: [], overflow: 0 },
    productErrors: [],
    productErrorOverflow: 0,
    pageErrors: [],
    pageErrorOverflow: 0,
    hostDiagnostics: [],
    hostDiagnosticOverflow: 0,
    screenshots: {},
    missingAssertions: [],
    status: 'core-flow-observed',
    evidenceStatus: 'observed',
    requiredAssertions: {
      exactFinalStatus: true,
      extensionInjected: true,
      loadedTargetImage: true,
      topActionIdentity: true,
      galleryDialog: true,
      galleryHostImage: true,
      escapeClosed: true,
      exactFocusRestored: true,
      nonzeroScrollPrepared: true,
      scrollRestored: true,
      scrollRestorationRestored: true,
      bodyStylesRestored: true,
      noProductErrors: true,
      noPageErrors: true,
    },
  };
}

async function exercise(
  arrange: (events: EventEmitter, pending: Request) => void,
  closing: (events: EventEmitter, pending: Request) => void,
  prepare?: (result: Parameters<typeof attachDiagnostics>[1]) => void
) {
  const root = await mkdtemp(join(tmpdir(), 'xeg-live-close-'));
  const events = new EventEmitter();
  const pending = request();
  const page = Object.assign(events, {
    close: async () => {
      closing(events, pending);
    },
  }) as unknown as Page;
  const result = observation();
  prepare?.(result);
  const diagnostics = attachDiagnostics(page, result);
  const file = await open(join(root, 'receipt.json'), 'wx', 0o600);
  try {
    arrange(events, pending);
    await finishObservedLivePage(page, true, result, diagnostics, null, file);
    const written = JSON.parse(await readFile(join(root, 'receipt.json'), 'utf8'));
    const before = result.hostDiagnostics.length;
    events.emit('requestfailed', request('https://other.example/late'));
    assert.equal(events.listenerCount('requestfailed'), 0);
    assert.equal(result.hostDiagnostics.length, before);
    assert.equal(written.evidenceStatus, result.evidenceStatus);
    return { written, result };
  } finally {
    diagnostics.seal();
    await file.close();
    await rm(root, { recursive: true, force: true });
  }
}

test('retains and qualifies only the same in-flight request aborted during successful owned close', async () => {
  const { written } = await exercise(
    (events, pending) => events.emit('request', pending),
    (events, pending) => events.emit('requestfailed', pending)
  );
  assert.equal(written.ownedPageCloseAbortCount, 1);
  assert.equal(written.hostDiagnostics[0].ownedPageCloseAssociation, 'same-inflight-request');
  assert.equal(written.evidenceStatus, 'observed');
  assert.equal(liveCompletionPassed(written), true);
});

test('an in-flight request with a URL fragment is not close-qualified', async () => {
  const fragmented = request('https://api.x.com/events?owned=1#fragment');
  const { written } = await exercise(
    (events) => events.emit('request', fragmented),
    (events) => events.emit('requestfailed', fragmented)
  );
  assert.equal(written.ownedPageCloseAbortCount, 0);
  assert.equal(written.evidenceStatus, 'unverified');
});

for (const kind of [
  'pre-close',
  'new-request',
  'different-object',
  'already-finished',
  'finished-during-close',
] as const) {
  test(`keeps ${kind} abort unverified in the final receipt despite completed interaction flow`, async () => {
    const { written } = await exercise(
      (events, pending) => {
        if (kind !== 'new-request') {
          events.emit('request', pending);
        }
        if (kind === 'pre-close') {
          events.emit('requestfailed', pending);
        }
        if (kind === 'already-finished') {
          events.emit('requestfinished', pending);
        }
      },
      (events, pending) => {
        if (kind !== 'pre-close') {
          if (kind === 'finished-during-close') {
            events.emit('requestfinished', pending);
          }
          events.emit('requestfailed', kind === 'different-object' ? request() : pending);
        }
      }
    );
    assert.equal(written.ownedPageCloseAbortCount, 0);
    assert.equal(written.evidenceStatus, 'unverified');
    assert.equal(liveCompletionPassed(written), true);
  });
}

test('does not qualify any close abort after bounded in-flight tracking overflows', async () => {
  const { written } = await exercise(
    (events, pending) => {
      events.emit('request', pending);
      for (let index = 0; index < 201; index++) {
        events.emit('request', request(`https://x.com/asset/${index}`));
      }
    },
    (events, pending) => events.emit('requestfailed', pending)
  );
  assert.equal(written.evidenceStatus, 'unverified');
  assert.equal(written.hostDiagnostics[0].ownedPageCloseAssociation, undefined);
});

test('a failed close never qualifies its associated abort', async () => {
  const { written } = await exercise(
    (events, pending) => events.emit('request', pending),
    (events, pending) => {
      events.emit('requestfailed', pending);
      throw new Error('owned close rejected');
    }
  );
  assert.equal(written.cleanup.pageClosed, false);
  assert.equal(written.status, 'failed');
  assert.equal(written.evidenceStatus, 'unverified');
});

test('extension failures during close remain product errors', async () => {
  const extension = request('chrome-extension://owned/content.js');
  const { written } = await exercise(
    (events) => events.emit('request', extension),
    (events) => events.emit('requestfailed', extension)
  );
  assert.equal(written.productErrors.length, 1);
  assert.equal(written.requiredAssertions.noProductErrors, false);
  assert.equal(written.evidenceStatus, 'unverified');
});

test('unknown host console errors emitted by close invalidate the final receipt', async () => {
  const { written } = await exercise(
    () => {},
    (events) =>
      events.emit('console', {
        type: () => 'error',
        text: () => 'unknown late host failure',
        location: () => ({ url: 'https://x.com/unknown.js' }),
      })
  );
  assert.equal(written.hostDiagnostics.length, 1);
  assert.equal(written.evidenceStatus, 'unverified');
});

test('page errors emitted by close refresh final required assertions', async () => {
  const { written } = await exercise(
    () => {},
    (events) => events.emit('pageerror', new Error('late page failure'))
  );
  assert.equal(written.pageErrors.length, 1);
  assert.equal(written.requiredAssertions.noPageErrors, false);
  assert.equal(written.status, 'failed');
  assert.equal(written.evidenceStatus, 'unverified');
});

test('a provider response settled during close invalidates native preview proof', async () => {
  const apiUrl =
    'https://x.com/i/api/graphql/hash/TweetResultByRestId?variables=%7B%22tweetId%22%3A%22456%22%7D';
  const body = {
    data: {
      tweetResult: {
        result: {
          result: {
            rest_id: '456',
            legacy: {
              extended_entities: {
                media: [
                  {
                    id_str: '789',
                    type: 'photo',
                    media_url_https: 'https://pbs.twimg.com/media/c.png',
                  },
                ],
              },
            },
          },
        },
      },
    },
  };
  const { written } = await exercise(
    () => {},
    (events) => {
      events.emit('request', request(apiUrl));
      events.emit('response', {
        url: () => apiUrl,
        status: () => 200,
        headers: () => ({}),
        body: async () => Buffer.from(JSON.stringify(body)),
      });
    },
    (result) => {
      Object.assign(result, {
        target: {
          kind: 'native-preview-photo',
          ownerHandle: 'inner',
          ownerStatusId: '456',
          photoNumber: 1,
        },
        gallery: {
          status: 'observed',
          opened: {
            selectedGallery: {
              imageSource: { host: 'pbs.twimg.com', path: '/media/c.png' },
              itemIndex: 0,
              itemVisible: true,
              positionValue: 1,
            },
          },
          ownerPath: '/inner/status/456',
        },
        api: {
          tweetResultByRestId: { requests: 1, responses: [200] },
          observations: [
            {
              operation: 'TweetResultByRestId',
              requestedTweetId: '456',
              httpStatus: 200,
              providerErrors: false,
              result: {
                id: '456',
                media: [
                  {
                    id: '789',
                    type: 'photo',
                    poster: { host: 'pbs.twimg.com', path: '/media/c.png' },
                    playableVariants: [],
                  },
                ],
              },
              directQuote: null,
              nestedQuoteId: null,
            },
          ],
          overflow: 0,
        },
        requiredAssertions: {
          ...result.requiredAssertions,
          exactCProviderPhoto: true,
          selectedCPhoto: true,
          canonicalCOwner: true,
        },
      });
    }
  );
  assert.equal(written.api.observations.length, 2);
  assert.equal(written.requiredAssertions.exactCProviderPhoto, false);
  assert.equal(written.status, 'failed');
  assert.equal(written.evidenceStatus, 'unverified');
  assert.equal(liveCompletionPassed(written), false);
});
