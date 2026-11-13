// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { BrowserContext } from '@playwright/test';
import { createServer, request, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import {
  assertPhotoFixtureIdle,
  assertLargePhotoNativeTransport,
  createInstalledLargePhotoFixture,
  createInstalledLargePhotoRouteBudget,
  largePhotoFixtureMedia,
} from './installed-large-photo-fixture.ts';
import { createExtensionNativeFixtureHandler } from './extension-native-loopback.ts';
import { createUserscriptFixtureHandler } from './userscript-loopback.ts';
import {
  assertNoAdditionalIngressNotifications,
  assertSourceDetailsSummary,
  requireVisibleArticleRecoveryNotification,
} from './install-profile.ts';
import { summarizeTweetResultResponse } from './live-page.ts';
import { test } from 'vite-plus/test';
import { StreamingZipWriter } from '../../src/shared/external/zip/streaming-zip-writer.ts';
import {
  verifyFixtureServerApiResponses,
  finishManagerPhotoApiCapture,
  runLivePhotoCollection,
  photoProviderRequestMatches,
  summarizeSuccessfulPhotoProviderResponse,
  assertExactPhotoNativeSource,
  assertDomPhotoZipOutcome,
  parsePhotoCollectionSelector,
  requiredPhotoPositions,
  settlePhotoTransportProbeDownloads,
  verifyPhotoCollection,
  verifyPhotoCollectionDownloads,
  verifySelectedPhoto,
  type PhotoCollectionContract,
  type PhotoGalleryEntry,
  type PhotoOriginalReference,
  type PhotoProviderTrace,
  type SelectedPhotoSnapshot,
} from './live-photo-collection.ts';

const requested = { handle: 'shinchilla_', statusId: '2121025509215850557', count: 20 } as const;
const directQuote = { handle: 'shinchilla_', statusId: '2121007970545017041', count: 20 } as const;

test('source details require the exact unknown-total scope and selected quality', () => {
  const scope = '2 collected items · the post may contain more';
  assert.doesNotThrow(() =>
    assertSourceDetailsSummary([scope, 'Original image could not be confirmed'], {
      scope: 'unknown-total',
      quality: 'retryable',
      count: 2,
    })
  );
  assert.throws(() =>
    assertSourceDetailsSummary([], { scope: 'unknown-total', quality: 'verified', count: 2 })
  );
  assert.throws(() =>
    assertSourceDetailsSummary([scope, 'Original image unavailable for saving'], {
      scope: 'unknown-total',
      quality: 'retryable',
      count: 2,
    })
  );
  assert.throws(() =>
    assertSourceDetailsSummary(['1 collected items · the post may contain more'], {
      scope: 'unknown-total',
      quality: 'verified',
      count: 2,
    })
  );
});

test('complete verified API results reject unexpected source details', () => {
  assert.doesNotThrow(() =>
    assertSourceDetailsSummary([], { scope: 'complete', quality: 'verified' })
  );
  assert.throws(() =>
    assertSourceDetailsSummary(['2 collected items · the post may contain more'], {
      scope: 'complete',
      quality: 'verified',
    })
  );
});

function fixture(withQuote: boolean) {
  const media = (owner: 'A' | 'B') =>
    Array.from({ length: 20 }, (_, ordinal) => ({
      id: `${owner === 'A' ? '8' : '9'}${String(ordinal).padStart(2, '0')}`,
      type: 'photo',
      entityOrdinal: ordinal,
      sourceFormat: 'jpg' as const,
      poster: { host: 'pbs.twimg.com', path: `/media/${owner}${ordinal}.jpg` },
      playableVariants: [],
    }));
  const trace: PhotoProviderTrace = {
    operation: 'TweetResultByRestId',
    requestedTweetId: requested.statusId,
    httpStatus: 200,
    providerErrors: false,
    result: { id: requested.statusId, collectionCount: 20, media: media('A') },
    directQuote: withQuote
      ? { id: directQuote.statusId, collectionCount: 20, media: media('B') }
      : null,
    nestedQuoteId: null,
  };
  const ordered = withQuote ? [...media('B'), ...media('A')] : media('A');
  const expected = ordered.map((_, index) => {
    const owner = withQuote && index < 20 ? directQuote : requested;
    const ordinal = index % 20;
    const sourceKey = `${withQuote && index < 20 ? 'B' : 'A'}${ordinal}`;
    const bytes = Buffer.from(`reference-${owner.statusId}-${ordinal}`);
    return {
      ownerId: owner.statusId,
      ordinal,
      sourceKey,
      originalUrl: `https://pbs.twimg.com/media/${sourceKey}.jpg?format=jpg&name=orig`,
      filename: `${owner.handle}_${owner.statusId}_${ordinal}.jpg`,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  });
  const contract: PhotoCollectionContract = {
    requested,
    directQuote: withQuote ? directQuote : null,
    expected,
  };
  const entries: PhotoGalleryEntry[] = ordered.map((item, index) => ({
    index,
    mediaId: `${withQuote && index < 20 ? directQuote.statusId : requested.statusId}_api_${index}`,
    displayUrl: `https://pbs.twimg.com${item.poster.path}?name=medium`,
  }));
  return { contract, trace, gallery: { total: ordered.length, entries, truncated: false } };
}

test('photo collection checks all B-then-A identities and each owner-local ordinal', () => {
  const { contract, trace, gallery } = fixture(true);
  assert.deepEqual(
    parsePhotoCollectionSelector({ scenario: 'photo-collection-20-40', ...contract }, 'extension', [
      `https://x.com/${requested.handle}/status/${requested.statusId}`,
      `https://x.com/${directQuote.handle}/status/${directQuote.statusId}`,
    ]),
    contract
  );
  assert.deepEqual(
    parsePhotoCollectionSelector(
      { scenario: 'photo-collection-20-40', ...contract },
      'userscript',
      [
        `https://x.com/${requested.handle}/status/${requested.statusId}`,
        `https://x.com/${directQuote.handle}/status/${directQuote.statusId}`,
      ]
    ),
    contract
  );
  const urls = [
    `https://x.com/${requested.handle}/status/${requested.statusId}`,
    `https://x.com/${directQuote.handle}/status/${directQuote.statusId}`,
  ];
  assert.throws(() =>
    parsePhotoCollectionSelector(
      { scenario: 'photo-collection-20-40', ...contract, expected: contract.expected.slice(0, 12) },
      'extension',
      urls
    )
  );
  assert.throws(() =>
    parsePhotoCollectionSelector(
      {
        scenario: 'photo-collection-20-40',
        ...contract,
        expected: contract.expected.map((entry, index) =>
          index === 20 ? { ...entry, ownerId: directQuote.statusId } : entry
        ),
      },
      'extension',
      urls
    )
  );
  assert.throws(() =>
    parsePhotoCollectionSelector(
      {
        scenario: 'photo-collection-20-40',
        ...contract,
        expected: contract.expected.map((entry, index) =>
          index === 39 ? { ...entry, originalUrl: contract.expected[0]!.originalUrl } : entry
        ),
      },
      'extension',
      urls
    )
  );
  const verified = verifyPhotoCollection(contract, [trace], gallery);
  assert.equal(verified.length, 40);
  assert.equal(verified[20]!.mediaId, `${requested.statusId}_api_20`);
  assert.equal(verified[20]!.providerMediaId, trace.result!.media[0]!.id);
  assert.notEqual(verified[20]!.mediaId, verified[20]!.providerMediaId);
  assert.deepEqual(
    requiredPhotoPositions(40).map((index) => ({
      index,
      ownerId: verified[index]?.owner.statusId,
      ordinal: verified[index]?.attachmentOrdinal,
    })),
    requiredPhotoPositions(40).map((index) => ({
      index,
      ownerId: index < 20 ? directQuote.statusId : requested.statusId,
      ordinal: index % 20,
    }))
  );
  assert.equal(
    verifyPhotoCollection(fixture(false).contract, [fixture(false).trace], fixture(false).gallery)
      .length,
    20
  );
  assert.throws(
    () =>
      verifyPhotoCollection(contract, [trace], {
        ...gallery,
        entries: gallery.entries.slice(0, 12),
      }),
    /retained/u
  );
  assert.throws(
    () => verifyPhotoCollection(contract, [trace], { ...gallery, truncated: true }),
    /truncated/u
  );
  assert.throws(
    () =>
      verifyPhotoCollection(contract, [trace], {
        ...gallery,
        entries: gallery.entries.map((entry, index) =>
          index === 20 ? { ...entry, mediaId: gallery.entries[0]!.mediaId } : entry
        ),
      }),
    /another media ID/u
  );
  assert.throws(
    () => verifyPhotoCollection(contract, [{ ...trace, directQuote: null }], gallery),
    /another post/u
  );
});

test('transport probe is extension-only and cannot visit public X', () => {
  const { contract } = fixture(true);
  const selector = { scenario: 'photo-collection-20-40', ...contract, transportProbe: true };
  assert.deepEqual(parsePhotoCollectionSelector(selector, 'extension', []), {
    ...contract,
    transportProbe: true,
  });
  assert.throws(() => parsePhotoCollectionSelector(selector, 'userscript', []));
  assert.throws(() =>
    parsePhotoCollectionSelector(selector, 'extension', [
      `https://x.com/${requested.handle}/status/${requested.statusId}`,
      `https://x.com/${directQuote.handle}/status/${directQuote.statusId}`,
    ])
  );
  assert.throws(() =>
    parsePhotoCollectionSelector({ ...selector, transportProbe: false }, 'extension', [])
  );
});

test('transport probe waits for canceled native downloads to become terminal', async () => {
  let canceled = false;
  let observations = 0;
  const query = async () => {
    observations += 1;
    return [{ id: 17, state: canceled && observations >= 3 ? 'interrupted' : 'in_progress' }];
  };
  const canceledIds: number[][] = [];
  assert.deepEqual(
    await settlePhotoTransportProbeDownloads(
      query,
      async (ids) => {
        canceledIds.push(ids);
        canceled = true;
      },
      async () => {}
    ),
    [17]
  );
  assert.deepEqual(canceledIds, [[17]]);
  assert(observations >= 3);
});

test('transport probe fails closed while a native download remains pending', async () => {
  let canceled = 0;
  const query = async () => [{ id: 17, state: 'in_progress' }];
  await assert.rejects(
    settlePhotoTransportProbeDownloads(
      query,
      async () => {
        canceled += 1;
      },
      async () => {}
    ),
    /terminal state/u
  );
  assert.equal(canceled, 1);
  await assert.rejects(settlePhotoTransportProbeDownloads(query, null, async () => {}));
});

test('boundary selection verifies the rendered source even when counter and model are correct', () => {
  const { contract, trace, gallery } = fixture(true);
  const expected = verifyPhotoCollection(contract, [trace], gallery);
  assert.deepEqual(requiredPhotoPositions(20), [0, 3, 4, 9, 11, 12, 19]);
  assert.deepEqual(
    requiredPhotoPositions(40),
    [0, 3, 4, 9, 11, 12, 19, 20, 23, 24, 29, 31, 32, 39]
  );
  const selected: SelectedPhotoSnapshot = {
    total: 40,
    currentIndex: 20,
    focusedIndex: 20,
    counterPosition: 21,
    itemIndex: 20,
    active: true,
    focused: true,
    mediaId: expected[20]!.mediaId,
    declaredUrl: gallery.entries[20]!.displayUrl,
    renderedUrl: gallery.entries[20]!.displayUrl,
    imageLoaded: true,
    imageVisible: true,
  };
  assert.doesNotThrow(() => verifySelectedPhoto(expected[20]!, 40, selected));
  assert.throws(
    () =>
      verifySelectedPhoto(expected[20]!, 40, {
        ...selected,
        renderedUrl: gallery.entries[19]!.displayUrl,
      }),
    /rendered source differs/u
  );
  assert.throws(
    () => verifySelectedPhoto(expected[20]!, 40, { ...selected, imageVisible: false }),
    /visible/u
  );
  assert.throws(
    () => verifySelectedPhoto(expected[20]!, 40, { ...selected, mediaId: expected[19]!.mediaId }),
    /media ID differs/u
  );
});

test('photo ZIP proof compares every owner and byte body independent of archive order', async () => {
  const { contract, trace, gallery } = fixture(true);
  const verified = verifyPhotoCollection(contract, [trace], gallery);
  const references: PhotoOriginalReference[] = verified.map((item) => ({
    index: item.index,
    ownerId: item.owner.statusId,
    attachmentOrdinal: item.attachmentOrdinal,
    sourceUrl: item.expected.originalUrl,
    filename: item.expected.filename,
    bytes: Buffer.from(`reference-${item.owner.statusId}-${item.attachmentOrdinal}`),
  }));
  const writer = new StreamingZipWriter();
  for (const entry of [...references].reverse()) {
    await writer.addFile(entry.filename, entry.bytes);
  }
  const zipBytes = Buffer.from(await new Blob(writer.finalize()).arrayBuffer());
  const selected = references[20]!;
  const single = {
    nativeId: 101,
    state: 'complete' as const,
    ownedPath: `/owned/${selected.filename}`,
    filename: selected.filename,
    bytesReceived: selected.bytes.length,
    bytes: selected.bytes,
  };
  const zip = {
    nativeId: 102,
    state: 'complete' as const,
    ownedPath: '/owned/gallery.zip',
    filename: 'gallery.zip',
    bytesReceived: zipBytes.length,
    bytes: zipBytes,
  };
  const proof = verifyPhotoCollectionDownloads(verified, references, 20, single, zip);
  assert.equal(proof.selected.ordinal, 0);
  assert.equal(proof.selected.ownerId, requested.statusId);
  assert.equal(proof.zipEntries.length, 40);
  assert.equal(proof.zipEntries[0]?.index, 39);
  assert.equal(proof.zipEntries[39]?.index, 0);
  assert.throws(
    () => verifyPhotoCollectionDownloads(verified, references.slice(0, 12), 20, single, zip),
    /incomplete/u
  );
  assert.throws(
    () =>
      verifyPhotoCollectionDownloads(
        verified,
        references,
        20,
        { ...single, nativeId: zip.nativeId },
        zip
      ),
    /Distinct/u
  );
  assert.throws(
    () =>
      verifyPhotoCollectionDownloads(
        verified,
        references,
        20,
        { ...single, bytes: references[0]!.bytes },
        zip
      ),
    /byte count|saved bytes/u
  );
  assert.throws(
    () =>
      verifyPhotoCollectionDownloads(
        verified,
        references.map((entry, index) =>
          index === 20 ? { ...entry, ownerId: directQuote.statusId } : entry
        ),
        20,
        single,
        zip
      ),
    /Reference owner/u
  );
  assert.throws(() =>
    verifyPhotoCollectionDownloads(
      verified,
      references.map((entry, index) =>
        index === 39 ? { ...entry, bytes: Buffer.from('wrong-original') } : entry
      ),
      20,
      single,
      zip
    )
  );
  const wrongArchive = Buffer.from(zipBytes);
  wrongArchive[40] = wrongArchive[40]! ^ 1;
  assert.throws(
    () =>
      verifyPhotoCollectionDownloads(verified, references, 20, single, {
        ...zip,
        bytes: wrongArchive,
      }),
    /ZIP|CRC|byte count|Central entry/u
  );
});

const source = readFileSync(
  join(import.meta.dirname, '../../test/e2e/fixtures/large-photo-narrow.jpg')
);

test('source-known 20/40 fixture has distinct marked JPEG references and pinned B then A ownership', () => {
  const sof = source.indexOf(Buffer.from([0xff, 0xc0]));
  assert(sof >= 0, 'Narrow source JPEG lacks baseline frame dimensions');
  assert.deepEqual([source.readUInt16BE(sof + 7), source.readUInt16BE(sof + 5)], [54, 1080]);
  const fixture = createInstalledLargePhotoFixture(source);
  assert.equal(fixture.originals.size, 40);
  assert.equal(
    new Set([...fixture.originals.values()].map((bytes) => bytes.toString('hex'))).size,
    40
  );
  for (const [url, bytes] of fixture.originals) {
    assert(bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xd8])));
    assert(bytes.subarray(-2).equals(Buffer.from([0xff, 0xd9])));
    assert.equal(bytes[2], 0xff);
    assert.equal(bytes[3], 0xfe);
    assert(url.endsWith('?format=jpg&name=orig'));
  }
  for (const photo of fixture.photos) {
    assert.equal(fixture.originals.get(photo.reference.originalUrl), photo.bytes);
    assert.equal(photo.displayUrl.replace('name=large', 'name=orig'), photo.reference.originalUrl);
    assert(!photo.previewBytes.equals(photo.bytes), 'Displayed preview must differ from original');
    assert.notEqual(
      createHash('sha256').update(photo.previewBytes).digest('hex'),
      photo.reference.sha256
    );
    assert.deepEqual(largePhotoFixtureMedia(fixture.photos, photo.reference.originalUrl, 'other'), {
      purpose: 'original',
      key: photo.reference.sourceKey,
      bytes: photo.bytes,
    });
    assert.deepEqual(largePhotoFixtureMedia(fixture.photos, photo.displayUrl, 'image'), {
      purpose: 'preview',
      key: photo.reference.sourceKey,
      bytes: photo.previewBytes,
    });
  }
  assert.throws(() =>
    largePhotoFixtureMedia(fixture.photos, fixture.photos[0]!.displayUrl, 'other')
  );
  const { requested, directQuote, expected } = fixture.contract;
  assert(directQuote);
  assert.deepEqual(
    parsePhotoCollectionSelector(
      { scenario: 'photo-collection-20-40', requested, directQuote, expected },
      'extension',
      [
        `https://x.com/${requested.handle}/status/${requested.statusId}`,
        `https://x.com/${directQuote.handle}/status/${directQuote.statusId}`,
      ]
    ),
    fixture.contract
  );
  assert.deepEqual(
    expected.map((item) => item.ownerId),
    [...Array(20).fill(directQuote.statusId), ...Array(20).fill(requested.statusId)]
  );
  const traces = [...fixture.apiResponses].map(([id, body]) => {
    assert.equal(
      body.toString('utf8').match(/"original_info":\{"width":54,"height":1080\}/gu)?.length,
      id === requested.statusId ? 40 : 20
    );
    const summary = summarizeTweetResultResponse(
      `https://x.com/i/api/graphql/fixture/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: id }))}`,
      200,
      JSON.parse(body.toString('utf8')),
      40
    );
    assert(summary);
    return summary;
  });
  const entries = fixture.photos.map((photo, index) => ({
    index,
    mediaId: `${photo.owner.statusId}_api_${index}`,
    displayUrl: photo.displayUrl,
  }));
  const verified = verifyPhotoCollection(fixture.contract, traces, {
    total: 40,
    entries,
    truncated: false,
  });
  const bOnly = verifyPhotoCollection(
    { requested: directQuote, directQuote: null, expected: expected.slice(0, 20) },
    traces,
    { total: 20, entries: entries.slice(0, 20), truncated: false }
  );
  assert.equal(bOnly.length, 20);
  assert.equal(bOnly[19]?.attachmentOrdinal, 19);
  assert.equal(verified[19]?.owner.statusId, directQuote.statusId);
  assert.equal(verified[20]?.owner.statusId, requested.statusId);
  assert.equal(verified[39]?.attachmentOrdinal, 19);
  assert(
    fixture.pages
      .get(`https://x.com/${requested.handle}/status/${requested.statusId}`)
      ?.includes('data-testid="quoteTweet"')
  );
  for (const [url, html] of fixture.pages) {
    assert.equal(
      (html.match(/width="54" height="1080"/gu) ?? []).length,
      url.includes(requested.statusId) ? 40 : 20
    );
    assert(html.includes('max-width:54px;width:auto;height:auto'));
  }
});

test('large-photo route and native budgets reject overflow instead of passing it', async () => {
  const budget = createInstalledLargePhotoRouteBudget(2);
  let aborted = 0;
  const route = {
    abort: async () => {
      aborted += 1;
    },
  };
  const document = await budget.admit(route);
  assert(document);
  document.kind = 'document';
  const api = await budget.admit(route);
  assert(api);
  api.kind = 'api';
  assert.equal(await budget.admit(route), null);
  assert.equal(aborted, 1);
  assert.equal(budget.overflow, true);
  assert.deepEqual(
    budget.events.map((event) => event.kind),
    ['document', 'api']
  );
  const before = { overflow: false, unexpectedCount: 2, activeCount: 0 };
  assertLargePhotoNativeTransport(before, before);
  assert.throws(() => assertLargePhotoNativeTransport(before, { ...before, overflow: true }));
  assert.throws(() => assertLargePhotoNativeTransport(before, { ...before, unexpectedCount: 3 }));
  assert.throws(() => assertLargePhotoNativeTransport(before, { ...before, activeCount: 1 }));
});

test('installed recovery notice permits one identified opening call and rejects later calls', () => {
  const opening = {
    id: 'xeg-123456789-1',
    title: 'Visible media only',
    message:
      'Only currently available media was collected. The post may contain more; bulk download includes only collected items.',
  };
  const baseline = { calls: [opening], overflow: false };
  assert.deepEqual(requireVisibleArticleRecoveryNotification(baseline), opening);
  assert.doesNotThrow(() => assertNoAdditionalIngressNotifications(baseline, opening));
  assert.throws(() => requireVisibleArticleRecoveryNotification({ ...baseline, calls: [] }));
  assert.throws(() =>
    requireVisibleArticleRecoveryNotification({ ...baseline, calls: [opening, opening] })
  );
  assert.throws(() =>
    requireVisibleArticleRecoveryNotification({
      ...baseline,
      calls: [{ ...opening, title: 'Other notice' }],
    })
  );
  assert.throws(() =>
    requireVisibleArticleRecoveryNotification({
      ...baseline,
      calls: [{ ...opening, message: 'Other message' }],
    })
  );
  assert.throws(() => requireVisibleArticleRecoveryNotification({ ...baseline, overflow: true }));
  assert.throws(() =>
    assertNoAdditionalIngressNotifications({ ...baseline, calls: [opening, opening] }, opening)
  );
});

async function readHosted(
  handle: (request: IncomingMessage, response: ServerResponse) => void,
  path: string,
  host: string
): Promise<{ status: number | undefined; bytes: Buffer }> {
  const server = createServer(handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  try {
    return await new Promise((resolve, reject) => {
      const outgoing = request(
        { hostname: '127.0.0.1', port: address.port, path, headers: { Host: host } },
        (incoming) => {
          const chunks: Buffer[] = [];
          incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
          incoming.once('error', reject);
          incoming.once('end', () =>
            resolve({ status: incoming.statusCode, bytes: Buffer.concat(chunks) })
          );
        }
      );
      outgoing.once('error', reject);
      outgoing.end();
    });
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test('both installed native transports serve exact original bytes and reject another quality', async () => {
  const fixture = createInstalledLargePhotoFixture(source);
  const base = Buffer.from('base');
  const extension = createExtensionNativeFixtureHandler();
  extension.setPayloads(
    [base, base, base],
    Object.fromEntries(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
        name,
        base,
      ])
    )
  );
  extension.setLargePhotos(fixture.originals);
  const userscript = createUserscriptFixtureHandler(
    Object.fromEntries(
      ['normal', 'failure', 'partial', 'held'].map((name, cohort) => [
        name,
        [0, 1, 2].map(
          (index) => `Abc${String(cohort).padStart(2, '0')}${String(index).padStart(2, '0')}123456`
        ),
      ])
    ),
    '/profile_images/123456789/public-avatar.jpg'
  );
  userscript.setImages([base, base, base]);
  userscript.setLargePhotos(fixture.originals, fixture.apiResponses);
  const selected = fixture.contract.expected[39]!;
  const original = new URL(selected.originalUrl);
  for (const transport of [extension, userscript]) {
    assert.deepEqual(
      await readHosted(transport.handle, original.pathname + original.search, original.hostname),
      { status: 200, bytes: fixture.originals.get(selected.originalUrl) }
    );
    assert.equal(
      (
        await readHosted(
          transport.handle,
          original.pathname + '?format=jpg&name=large',
          original.hostname
        )
      ).status,
      404
    );
    assert.equal(transport.snapshot().unexpectedCount, 1);
  }
  const apiPath = `/i/api/graphql/fixture/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: fixture.contract.requested.statusId }))}`;
  assert.deepEqual(await readHosted(userscript.handle, apiPath, 'x.com'), {
    status: 200,
    bytes: fixture.apiResponses.get(fixture.contract.requested.statusId),
  });
});

test('native single binds the exact original query and observed final URL', () => {
  const url = 'https://pbs.twimg.com/media/PIN.jpg?format=jpg&name=orig';
  assert.doesNotThrow(() => assertExactPhotoNativeSource({ url, finalUrl: url }, url));
  for (const source of [
    null,
    { url: url.replace('format=jpg', 'format=webp'), finalUrl: url },
    { url: `${url}&extra=1`, finalUrl: url },
    { url, finalUrl: url.replace('name=orig', 'name=small') },
    { url, finalUrl: null },
  ]) {
    assert.throws(() => assertExactPhotoNativeSource(source, url));
  }
});

test('DOM ZIP status reports all collected items saved with unknown post total', () => {
  const body =
    'Only currently available media was collected. The post may contain more; bulk download includes only collected items.';
  const paragraphs = [
    'ZIP includes 20; left out 0.',
    'Scope: 20 media items shown in this gallery.',
    body,
    'The browser accepted the ZIP request. Completion on disk is not confirmed.',
  ];
  assert.doesNotThrow(() =>
    assertDomPhotoZipOutcome('ZIP handed off to browser', paragraphs, body)
  );
  assert.throws(() => assertDomPhotoZipOutcome('No ZIP handed off', paragraphs, body));
  for (const changed of [
    paragraphs.map((text, index) => (index === 0 ? 'ZIP includes 19; left out 1.' : text)),
    paragraphs.map((text, index) =>
      index === 1 ? 'Scope: 4 media items shown in this gallery.' : text
    ),
    paragraphs.filter((_, index) => index !== 2),
    paragraphs.map((text, index) => (index === 3 ? 'No ZIP was handed off to the browser.' : text)),
  ]) {
    assert.throws(() => assertDomPhotoZipOutcome('ZIP handed off to browser', changed, body));
  }
});

test('context API observation excludes foreign origins and other requested owners', () => {
  const url = new URL('https://x.com/i/api/graphql/frozen/TweetResultByRestId');
  url.searchParams.set('variables', JSON.stringify({ tweetId: requested.statusId }));
  assert(photoProviderRequestMatches(url, requested.statusId));
  assert(!photoProviderRequestMatches(url, directQuote.statusId));
  const foreign = new URL(url);
  foreign.hostname = 'unrelated.invalid';
  assert(!photoProviderRequestMatches(foreign, requested.statusId));
  const malformed = new URL(url);
  malformed.searchParams.set('variables', '{');
  assert(!photoProviderRequestMatches(malformed, requested.statusId));
});

test('an empty HTTP refusal stays distinct from invalid successful provider JSON', () => {
  const url = `https://x.com/i/api/graphql/frozen/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: requested.statusId }))}`;
  for (const status of [403, 404, 429, 500]) {
    assert.equal(summarizeSuccessfulPhotoProviderResponse(url, status, ''), null);
    assert.equal(
      summarizeSuccessfulPhotoProviderResponse(url, status, '<html>denied</html>'),
      null
    );
  }
  assert.throws(() => summarizeSuccessfulPhotoProviderResponse(url, 200, ''));
  assert.throws(() => summarizeSuccessfulPhotoProviderResponse(url, 200, '<html>denied</html>'));
  assert.throws(() => summarizeSuccessfulPhotoProviderResponse(url, 403, 'x'.repeat(2_000_001)));
  const body = { data: {} };
  assert.deepEqual(
    summarizeSuccessfulPhotoProviderResponse(url, 200, `\uFEFF${JSON.stringify(body)}`),
    summarizeTweetResultResponse(url, 200, body, 40)
  );
});

test('fixture visit failures retain both owners and cleanup while public observation fails fast', async () => {
  for (const [sourceKnown, pendingNative, unverifiedBrowser] of [
    [true, false, false],
    [false, false, false],
    [true, true, false],
    [true, false, true],
    [false, false, true],
  ] as const) {
    const output = await mkdtemp(join(tmpdir(), 'xeg-photo-visits-'));
    const navigated: string[] = [];
    const closed: string[] = [];
    const context = {
      newPage: async () => {
        let current = 'observer';
        return {
          goto: async (url: string) => {
            current = url;
            if (url.startsWith('https://x.com/')) {
              navigated.push(url);
              throw new Error('injected visit failure');
            }
          },
          on: () => undefined,
          evaluate: async () =>
            pendingNative
              ? [{ id: 1, state: 'in_progress', bytesReceived: 0, totalBytes: 1, exists: false }]
              : [],
          close: async () => {
            closed.push(current);
          },
        };
      },
      on: () => undefined,
      off: () => undefined,
      cookies: async () => [],
    } as unknown as BrowserContext;
    try {
      const receipt = await runLivePhotoCollection({
        context,
        extensionId: 'owned-test-extension',
        contract: fixture(true).contract,
        downloads: output,
        output,
        managerObserver: unverifiedBrowser
          ? {
              snapshot: () => 0,
              beginsSince: () => [
                {
                  guid: 'unverified-guid',
                  url: 'blob:https://x.com/owned',
                  suggestedFilename: 'owned.zip',
                },
              ],
              flush: async () => {},
              waitForCompletion: async () => {
                throw new Error('unreached');
              },
            }
          : null,
        fixture: sourceKnown
          ? {
              originals: new Map(),
              receiptFile: 'fixture.json',
              retainedPrefix: 'injected-fixture',
              scope: 'source-known injected failures',
            }
          : null,
      });
      assert.equal(receipt.status, 'failed');
      assert.equal(
        receipt.scope,
        sourceKnown
          ? 'source-known injected failures'
          : unverifiedBrowser
            ? 'installed manager userscript public photo collection and native single/ZIP bytes only'
            : 'installed extension public photo collection and native single/ZIP bytes only'
      );
      assert(receipt.error);
      assert(Array.isArray(receipt.visits));
      assert.equal(
        receipt.visits.length,
        sourceKnown && !pendingNative && !unverifiedBrowser ? 2 : 1
      );
      assert.equal(navigated.length, sourceKnown && !pendingNative && !unverifiedBrowser ? 2 : 1);
      assert(
        receipt.visits.every(
          (visit) =>
            visit.status === 'failed' &&
            visit.pageClosed === true &&
            visit.operationError === 'injected visit failure'
        )
      );
      assert.equal(closed.length, navigated.length + 1);
      assert.equal(receipt.extensionPageClosed, true);
      if (sourceKnown && unverifiedBrowser) {
        assert.match(String(receipt.error), /Browser-owned download terminal state is unverified/u);
      }
      if (pendingNative) {
        assert.match(String(receipt.error), /native transfer is still pending/u);
      }
      if (sourceKnown && !pendingNative && !unverifiedBrowser) {
        assertPhotoFixtureIdle(
          receipt,
          { activeCount: 0, overflow: false, unexpectedCount: 0 },
          false
        );
      }
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  }
});

test('independent DOM evidence requires all API pages closed and idle bounded transport', () => {
  const failed = {
    status: 'failed',
    extensionPageClosed: true,
    visits: [
      { status: 'failed', pageClosed: true },
      { status: 'observed', pageClosed: true },
    ],
  };
  const idle = { activeCount: 0, overflow: false, unexpectedCount: 0 };
  assert.doesNotThrow(() => assertPhotoFixtureIdle(failed, idle, false));
  assert.throws(() =>
    assertPhotoFixtureIdle({ ...failed, extensionPageClosed: false }, idle, false)
  );
  assert.throws(() =>
    assertPhotoFixtureIdle({ ...failed, visits: failed.visits.slice(0, 1) }, idle, false)
  );
  assert.throws(() =>
    assertPhotoFixtureIdle(
      { ...failed, visits: [{ pageClosed: true }, { pageClosed: false }] },
      idle,
      false
    )
  );
  assert.throws(() => assertPhotoFixtureIdle(failed, { ...idle, activeCount: 1 }, false));
  assert.throws(() => assertPhotoFixtureIdle(failed, { ...idle, overflow: true }, false));
  assert.throws(() => assertPhotoFixtureIdle(failed, { ...idle, unexpectedCount: 1 }, false));
  assert.throws(() => assertPhotoFixtureIdle(failed, idle, true));
});

test('fixture API server evidence requires an exact finished response and never implies client receipt', () => {
  const body = Buffer.from('{"data":{}}');
  const event = {
    requestedId: requested.statusId,
    host: 'x.com',
    operation: 'TweetResultByRestId',
    method: 'GET',
    purpose: 'metadata',
    cohort: 'large-api',
    status: 200,
    result: 'served',
    bytes: body.length,
    sha256: createHash('sha256').update(body).digest('hex'),
    atMs: 10,
    finishedAtMs: 11,
  };
  assert.equal(verifyFixtureServerApiResponses([event], requested.statusId, body, 200).length, 1);
  assert.deepEqual(
    verifyFixtureServerApiResponses(
      [{ ...event, requestedId: directQuote.statusId }],
      requested.statusId,
      body,
      200
    ),
    []
  );
  assert.deepEqual(
    verifyFixtureServerApiResponses(
      [{ ...event, result: 'started', bytes: 0, sha256: null, finishedAtMs: undefined }],
      requested.statusId,
      body,
      200
    ),
    []
  );
  assert.deepEqual(
    verifyFixtureServerApiResponses(
      [{ ...event, result: 'aborted', bytes: 0, sha256: null, finishedAtMs: undefined }],
      requested.statusId,
      body,
      200
    ),
    []
  );
  for (const patch of [
    { host: 'foreign.invalid' },
    { operation: 'OtherOperation' },
    { method: 'POST' },
    { purpose: 'media' },
    { cohort: 'other-api' },
    { status: 403 },
    { bytes: body.length - 1 },
    { sha256: '0'.repeat(64) },
    { finishedAtMs: undefined },
    { finishedAtMs: 9 },
  ]) {
    assert.throws(() =>
      verifyFixtureServerApiResponses([{ ...event, ...patch }], requested.statusId, body, 200)
    );
  }
  assert.throws(() =>
    verifyFixtureServerApiResponses(Array(13).fill(event), requested.statusId, body, 200)
  );
  const forbidden = Buffer.from('{}');
  assert.equal(
    verifyFixtureServerApiResponses(
      [
        {
          ...event,
          cohort: 'large-dom-api',
          status: 403,
          result: 'http-403',
          bytes: 2,
          sha256: createHash('sha256').update(forbidden).digest('hex'),
        },
      ],
      requested.statusId,
      forbidden,
      403
    ).length,
    1
  );
});

test('metadata closure waits for delayed client capture and reconciles only after drain', async () => {
  let captured = false;
  let stopped = false;
  let reconciled = false;
  const delayed = new Promise<void>((resolve) =>
    setTimeout(() => {
      captured = true;
      resolve();
    }, 10)
  );
  const trace = {
    snapshot: () => ({ errors: [], responses: captured ? [{ status: 200 }] : [] }),
    stop: async () => {
      await delayed;
      stopped = true;
    },
  };
  const snapshot = await finishManagerPhotoApiCapture(trace, Date.now() + 1000, async () => {
    assert(stopped && captured);
    reconciled = true;
  });
  assert(reconciled && Array.isArray(snapshot.responses) && snapshot.responses.length === 1);
  let payload = 'fixture-input';
  const lateConflict = {
    snapshot: () => ({ errors: [], responses: [{ status: 200 }] }),
    stop: async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      payload = 'different-client-payload';
    },
  };
  await assert.rejects(
    finishManagerPhotoApiCapture(lateConflict, Date.now() + 1000, async () => {
      assert.equal(
        payload,
        'fixture-input',
        'Client and source-known payload conflict after drain'
      );
    }),
    /payload conflict after drain/u
  );
});
