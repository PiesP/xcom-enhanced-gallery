// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'vite-plus/test';
import { StreamingZipWriter } from '../../src/shared/external/zip/streaming-zip-writer.ts';
import {
  parsePhotoCollectionSelector,
  requiredPhotoPositions,
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
    mediaId: item.id,
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
  assert.deepEqual(
    [0, 3, 4, 9, 12, 13, 19, 20, 23, 24, 29, 32, 33, 39].map((index) => ({
      index,
      ownerId: verified[index]?.owner.statusId,
      ordinal: verified[index]?.attachmentOrdinal,
    })),
    [0, 3, 4, 9, 12, 13, 19, 20, 23, 24, 29, 32, 33, 39].map((index) => ({
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

test('boundary selection verifies the rendered source even when counter and model are correct', () => {
  const { contract, trace, gallery } = fixture(true);
  const expected = verifyPhotoCollection(contract, [trace], gallery);
  assert.deepEqual(requiredPhotoPositions(20), [0, 3, 4, 9, 11, 12, 19]);
  assert.deepEqual(requiredPhotoPositions(40), [0, 3, 4, 9, 11, 12, 19, 20, 39]);
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
