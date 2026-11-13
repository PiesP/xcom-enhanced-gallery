// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { BrowserContext, Page, Request, Response } from '@playwright/test';
import { readOwnedNativeBytes } from './firefox-install.ts';
import {
  inspectLiveStoredZip,
  openCurrentStatusImage,
  queryDownloads,
  readOwnedFile,
  waitForOwnedDownload,
} from './live-acceptance.ts';
import { summarizeTweetResultResponse } from './live-page.ts';
import { fetchBoundedLiveOriginal } from './live-original-fetch.ts';

declare const chrome: {
  runtime: { id: string };
  downloads: {
    search(query: { id: number }): Promise<
      Array<{
        id: number;
        byExtensionId?: string;
        url?: string;
        finalUrl?: string;
      }>
    >;
  };
};

/** The caller must first establish these counts from current source-bound X evidence. */
export type PhotoOwner = { handle: string; statusId: string; count: 20 };
export type PhotoExpectedReference = {
  ownerId: string;
  ordinal: number;
  sourceKey: string;
  originalUrl: string;
  filename: string;
  bytes: number;
  sha256: string;
};
export type PhotoCollectionContract = {
  requested: PhotoOwner;
  directQuote: PhotoOwner | null;
  expected: readonly PhotoExpectedReference[];
};

export function parsePhotoCollectionSelector(
  value: unknown,
  installation: string,
  liveUrls: readonly string[]
): PhotoCollectionContract {
  assert(value && typeof value === 'object' && !Array.isArray(value));
  const input = value as Record<string, unknown>;
  assert.deepEqual(Object.keys(input).sort(), ['directQuote', 'expected', 'requested', 'scenario']);
  assert.equal(input.scenario, 'photo-collection-20-40');
  assert(
    installation === 'extension' || installation === 'userscript',
    'Photo collection route requires an installed extension or manager userscript'
  );
  const parseOwner = (raw: unknown): PhotoOwner => {
    assert(raw && typeof raw === 'object' && !Array.isArray(raw));
    const owner = raw as Record<string, unknown>;
    assert.deepEqual(Object.keys(owner).sort(), ['count', 'handle', 'statusId']);
    assert(typeof owner.handle === 'string' && typeof owner.statusId === 'string');
    assert.equal(owner.count, 20);
    const parsed = { handle: owner.handle, statusId: owner.statusId, count: 20 as const };
    validateOwner(parsed);
    return parsed;
  };
  const requested = parseOwner(input.requested);
  const directQuote = input.directQuote === null ? null : parseOwner(input.directQuote);
  assert(!directQuote || directQuote.statusId !== requested.statusId);
  assert(Array.isArray(input.expected), 'Photo selector must pin every independent original');
  const expected = input.expected.map((raw: unknown, index: number): PhotoExpectedReference => {
    assert(raw && typeof raw === 'object' && !Array.isArray(raw));
    const entry = raw as Record<string, unknown>;
    assert.deepEqual(Object.keys(entry).sort(), [
      'bytes',
      'filename',
      'ordinal',
      'originalUrl',
      'ownerId',
      'sha256',
      'sourceKey',
    ]);
    const owner = directQuote && index < 20 ? directQuote : requested;
    const ordinal = index % 20;
    assert.equal(entry.ownerId, owner.statusId, 'Pinned photo owner differs from ordered group');
    assert.equal(entry.ordinal, ordinal, 'Pinned photo ordinal differs from owner-local order');
    assert(typeof entry.sourceKey === 'string' && /^[A-Za-z0-9_-]{1,80}$/u.test(entry.sourceKey));
    assert(typeof entry.originalUrl === 'string' && stem(entry.originalUrl) === entry.sourceKey);
    const original = new URL(entry.originalUrl);
    const format = original.searchParams.get('format');
    assert(format && /^(?:jpg|jpeg|png|gif|webp)$/u.test(format));
    assert.deepEqual([...original.searchParams.keys()].sort(), ['format', 'name']);
    assert.equal(original.searchParams.get('name'), 'orig');
    assert(typeof entry.filename === 'string');
    assert.equal(entry.filename, `${owner.handle}_${owner.statusId}_${ordinal}.${format}`);
    assert(
      typeof entry.bytes === 'number' &&
        Number.isSafeInteger(entry.bytes) &&
        entry.bytes > 0 &&
        entry.bytes <= 4 * 1024 * 1024
    );
    assert(typeof entry.sha256 === 'string' && /^[a-f0-9]{64}$/u.test(entry.sha256));
    return {
      ownerId: entry.ownerId as string,
      ordinal,
      sourceKey: entry.sourceKey,
      originalUrl: entry.originalUrl,
      filename: entry.filename,
      bytes: entry.bytes,
      sha256: entry.sha256,
    };
  });
  assert.equal(expected.length, requested.count + (directQuote?.count ?? 0));
  const url = (owner: PhotoOwner) => `https://x.com/${owner.handle}/status/${owner.statusId}`;
  assert.deepEqual(
    liveUrls,
    directQuote ? [url(requested), url(directQuote)] : [url(requested)],
    'Photo collection URLs must match the exact declared owners'
  );
  return { requested, directQuote, expected };
}

export type PhotoProviderTrace = NonNullable<ReturnType<typeof summarizeTweetResultResponse>>;
export type PhotoGalleryEntry = {
  index: number;
  mediaId: string;
  displayUrl: string;
};
export type VerifiedPhoto = {
  index: number;
  owner: PhotoOwner;
  /** Product gallery identity; distinct from the provider entity ID. */
  mediaId: string;
  providerMediaId: string | null;
  attachmentOrdinal: number;
  displayStem: string;
  expected: PhotoExpectedReference;
};

export type SelectedPhotoSnapshot = {
  total: number;
  currentIndex: number;
  focusedIndex: number;
  counterPosition: number;
  itemIndex: number;
  active: boolean;
  focused: boolean;
  mediaId: string;
  declaredUrl: string;
  renderedUrl: string;
  imageLoaded: boolean;
  imageVisible: boolean;
};

/** Inspect only the selected photo; other gallery items need not be visible or mounted. */
export function inspectSelectedPhotoDocument(gallery: Element): SelectedPhotoSnapshot | null {
  const toolbar = gallery.querySelector('[data-gallery-element="toolbar"]');
  const counter = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const currentIndex = Number(toolbar?.getAttribute('data-current-index'));
  const selected = [...gallery.querySelectorAll('[data-gallery-element="item"]')].filter(
    (item) => item.getAttribute('data-index') === String(currentIndex)
  );
  const item = selected.length === 1 ? selected[0] : null;
  const image = item?.querySelector('img');
  if (!(item instanceof HTMLElement) || !(image instanceof HTMLImageElement)) {
    return null;
  }
  const style = getComputedStyle(image);
  const bounds = image.getBoundingClientRect();
  return {
    total: Number(counter?.getAttribute('data-total')),
    currentIndex,
    focusedIndex: Number(toolbar?.getAttribute('data-focused-index')),
    counterPosition: Number(counter?.getAttribute('data-position')),
    itemIndex: Number(item.getAttribute('data-index')),
    active: item.getAttribute('data-media-active') === 'true',
    focused: item.getAttribute('data-media-focused') === 'true',
    mediaId: item.getAttribute('data-media-id') ?? '',
    declaredUrl: item.getAttribute('data-media-display-url') ?? '',
    renderedUrl: image.currentSrc || image.src,
    imageLoaded:
      item.getAttribute('data-media-loaded') === 'true' && image.complete && image.naturalWidth > 0,
    imageVisible:
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      bounds.bottom > 0 &&
      bounds.top < innerHeight &&
      bounds.right > 0 &&
      bounds.left < innerWidth,
  };
}

/** A correct counter and model cannot mask a stale or wrong rendered image. */
export function verifySelectedPhoto(
  expected: VerifiedPhoto,
  expectedTotal: number,
  snapshot: SelectedPhotoSnapshot | null
): void {
  assert(snapshot, `Selected gallery position ${expected.index} was not rendered`);
  assert.equal(snapshot.total, expectedTotal, 'Selected photo total differs');
  assert.equal(snapshot.currentIndex, expected.index, 'Selected photo index differs');
  assert.equal(snapshot.focusedIndex, expected.index, 'Selected photo focus differs');
  assert.equal(snapshot.counterPosition, expected.index + 1, 'Selected photo counter differs');
  assert.equal(snapshot.itemIndex, expected.index, 'Selected item index differs');
  assert(
    snapshot.active && snapshot.focused && snapshot.imageLoaded && snapshot.imageVisible,
    'Selected photo is not active, focused, loaded and visible'
  );
  assert.equal(snapshot.mediaId, expected.mediaId, 'Selected photo media ID differs');
  assert.equal(stem(snapshot.declaredUrl), expected.displayStem, 'Selected model source differs');
  assert.equal(
    stem(snapshot.renderedUrl),
    expected.displayStem,
    'Selected rendered source differs'
  );
}

export function requiredPhotoPositions(total: 20 | 40): readonly number[] {
  return total === 20
    ? [0, 3, 4, 9, 11, 12, 19]
    : [0, 3, 4, 9, 11, 12, 19, 20, 23, 24, 29, 31, 32, 39];
}

const MEDIA_PATH = /^\/media\/([A-Za-z0-9_-]+)(?:\.(?:jpe?g|png|webp|gif))?$/iu;
const HANDLE = /^[A-Za-z0-9_]{1,15}$/u;
const STATUS = /^[1-9]\d{1,39}$/u;

function stem(value: string): string {
  const url = new URL(value);
  const match = MEDIA_PATH.exec(url.pathname);
  assert(
    url.protocol === 'https:' &&
      url.hostname === 'pbs.twimg.com' &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash &&
      match?.[1],
    'Photo source is not one admitted pbs media identity'
  );
  return match[1];
}

function validateOwner(owner: PhotoOwner): void {
  assert(HANDLE.test(owner.handle) && STATUS.test(owner.statusId) && owner.count === 20);
}

/** A product gallery count and the separately observed identity list are both required. */
export function verifyPhotoCollection(
  contract: PhotoCollectionContract,
  observations: readonly PhotoProviderTrace[],
  gallery: {
    total: number;
    entries: readonly PhotoGalleryEntry[];
    truncated: boolean;
  }
): VerifiedPhoto[] {
  validateOwner(contract.requested);
  if (contract.directQuote) {
    validateOwner(contract.directQuote);
    assert.notEqual(contract.directQuote.statusId, contract.requested.statusId);
  }
  const expectedCount = contract.requested.count + (contract.directQuote?.count ?? 0);
  assert.equal(gallery.total, expectedCount, 'Gallery total differs from declared owner counts');
  assert.equal(gallery.truncated, false, 'Gallery identity observation was truncated');
  assert.equal(gallery.entries.length, expectedCount, 'Full gallery identities were not retained');
  assert.equal(contract.expected.length, expectedCount, 'Pinned originals are incomplete');

  const candidates = observations.filter(
    (entry) =>
      entry.operation === 'TweetResultByRestId' &&
      entry.requestedTweetId === contract.requested.statusId &&
      entry.httpStatus === 200 &&
      !entry.providerErrors &&
      entry.result?.id === contract.requested.statusId
  );
  assert(candidates.length > 0, 'Requested post has no exact successful provider trace');
  const mapOwner = (
    owner: PhotoOwner,
    value: NonNullable<PhotoProviderTrace['result']> | null
  ): Array<Omit<VerifiedPhoto, 'expected'>> => {
    assert(value && value.id === owner.statusId, 'Provider media belongs to another post');
    assert.equal(value.collectionCount, owner.count, 'Provider reported a different owner count');
    assert.equal(value.media.length, owner.count, 'Provider identities are truncated');
    return value.media.map((item, ordinal) => {
      assert.equal(item.type, 'photo', 'Declared photo collection contains another media kind');
      assert(item.id && /^\d{1,40}$/u.test(item.id), 'Provider media ID is absent');
      assert.equal(item.entityOrdinal, ordinal, 'Provider owner-local ordinal changed');
      assert(item.poster?.host === 'pbs.twimg.com', 'Provider photo poster is absent');
      const displayStem = stem(`https://pbs.twimg.com${item.poster.path}`);
      return {
        index: -1,
        owner,
        mediaId: item.id,
        providerMediaId: item.id,
        attachmentOrdinal: ordinal,
        displayStem,
      };
    });
  };
  const mappings = candidates.map((entry) => {
    const ordered = [
      ...(contract.directQuote ? mapOwner(contract.directQuote, entry.directQuote) : []),
      ...mapOwner(contract.requested, entry.result),
    ];
    assert.equal(ordered.length, expectedCount);
    assert.equal(
      new Set(ordered.map((item) => `${item.owner.statusId}:${item.providerMediaId}`)).size,
      expectedCount,
      'Provider media identities are duplicated'
    );
    return ordered.map((item, index) => {
      const pinned = contract.expected[index]!;
      assert.equal(pinned.ownerId, item.owner.statusId, `Pinned owner differs at ${index}`);
      assert.equal(pinned.ordinal, item.attachmentOrdinal, `Pinned ordinal differs at ${index}`);
      assert.equal(pinned.sourceKey, item.displayStem, `Pinned source differs at ${index}`);
      return { ...item, index, mediaId: `${item.owner.statusId}_api_${index}`, expected: pinned };
    });
  });
  const expected = mappings[0]!;
  assert(
    mappings.every((mapping) => JSON.stringify(mapping) === JSON.stringify(expected)),
    'Conflicting exact provider traces'
  );
  for (const [index, actual] of gallery.entries.entries()) {
    const item = expected[index]!;
    assert.equal(actual.index, index, `Gallery position ${index} is absent or reordered`);
    assert.equal(actual.mediaId, item.mediaId, `Gallery position ${index} has another media ID`);
    assert.equal(
      stem(actual.displayUrl),
      item.displayStem,
      `Gallery position ${index} has another source`
    );
  }
  return expected;
}

/** DOM identity is bounded by observed owned links; it does not establish the post total. */
export function verifyDomPhotoCollection(
  contract: PhotoCollectionContract,
  tiles: readonly { href: string; displayUrl: string }[],
  gallery: { total: number; entries: readonly PhotoGalleryEntry[]; truncated: boolean }
): VerifiedPhoto[] {
  assert.equal(contract.directQuote, null, 'DOM fixture must have one directly observed owner');
  validateOwner(contract.requested);
  assert.equal(tiles.length, contract.requested.count, 'Owned DOM tiles are incomplete');
  assert.equal(gallery.total, tiles.length, 'Gallery count differs from observed DOM tiles');
  assert(!gallery.truncated && gallery.entries.length === tiles.length);
  assert.equal(contract.expected.length, tiles.length, 'Independent originals are incomplete');
  return tiles.map((tile, index) => {
    const pinned = contract.expected[index]!;
    const expectedHref = `https://x.com/${contract.requested.handle}/status/${contract.requested.statusId}/photo/${index + 1}`;
    assert.equal(tile.href, expectedHref, `DOM owner/ordinal differs at ${index}`);
    assert.equal(pinned.ownerId, contract.requested.statusId);
    assert.equal(pinned.ordinal, index);
    assert.equal(stem(tile.displayUrl), pinned.sourceKey);
    const actual = gallery.entries[index]!;
    const mediaId = `${contract.requested.statusId}_dom_${index}`;
    assert.equal(actual.index, index, 'DOM gallery entry is missing or reordered');
    assert.equal(actual.mediaId, mediaId, 'DOM gallery media identity differs');
    assert.equal(stem(actual.displayUrl), pinned.sourceKey, 'DOM gallery source differs');
    return {
      index,
      owner: contract.requested,
      mediaId,
      providerMediaId: null,
      attachmentOrdinal: index,
      displayStem: pinned.sourceKey,
      expected: pinned,
    };
  });
}

/** The installed DOM fixture runs in English; require scope and quality independently. */
export function assertDomPhotoSourceDetails(
  observed: readonly string[],
  quality: 'pending' | 'verified'
): void {
  assert.deepEqual(observed, [
    '20 collected items · the post may contain more',
    ...(quality === 'pending' ? ['Original image will be checked when saving'] : []),
  ]);
}

/** Context-level observation includes manager workers but admits only this owned X request. */
export function photoProviderRequestMatches(source: URL, requestedId: string): boolean {
  if (
    source.origin !== 'https://x.com' ||
    source.username ||
    source.password ||
    source.port ||
    source.hash ||
    !/^\/i\/api\/graphql\/[^/]+\/TweetResultByRestId$/u.test(source.pathname)
  ) {
    return false;
  }
  try {
    const variables: unknown = JSON.parse(source.searchParams.get('variables') ?? '{}');
    return Boolean(
      variables &&
      typeof variables === 'object' &&
      'tweetId' in variables &&
      variables.tweetId === requestedId
    );
  } catch {
    return false;
  }
}

/** Bind this selected scenario to the exact requested and completed native source. */
export function assertExactPhotoNativeSource(
  source: { url: string | null; finalUrl: string | null } | null,
  expectedSource: string
): void {
  assert(source, 'Native single source observation is unavailable');
  assert.equal(source.url, expectedSource, 'Native single requested another original URL');
  assert.equal(
    source.finalUrl,
    expectedSource,
    'Native single final URL differs from its original'
  );
}

/** Saved bytes and the user-visible collected/saved/omitted result are separate obligations. */
export function assertDomPhotoZipOutcome(
  title: string,
  paragraphs: readonly string[],
  partialBody: string
): void {
  assert.equal(title, 'ZIP handed off to browser');
  assert.deepEqual(paragraphs, [
    'ZIP includes 20; left out 0.',
    'Scope: 20 media items shown in this gallery.',
    partialBody,
    'The browser accepted the ZIP request. Completion on disk is not confirmed.',
  ]);
}

export type PhotoOriginalReference = {
  index: number;
  ownerId: string;
  attachmentOrdinal: number;
  sourceUrl: string;
  filename: string;
  bytes: Buffer;
};
type DomNativeEvent = {
  sourceUrl?: string;
  method: string;
  status?: number;
  result: string;
};
type DomNativeSnapshot = {
  domProbePeak?: number;
  events: readonly DomNativeEvent[];
};

/** A completed probe must preserve its requested encoding and exact source path. */
export function verifyDomNativeProbes(
  before: DomNativeSnapshot,
  after: DomNativeSnapshot,
  ordinal: number,
  expectTransfer: boolean
): void {
  assert(Number.isSafeInteger(ordinal) && ordinal >= 0 && ordinal < 20);
  assert(before.events.length <= after.events.length);
  const key = `XegDom${String(ordinal).padStart(2, '0')}`;
  const events = after.events.slice(before.events.length);
  for (const [format, status] of [
    ['webp', 404],
    ['jpg', 200],
  ] as const) {
    assert(
      events.some(
        (event) =>
          event.sourceUrl === `/media/${key}?format=${format}&name=orig` &&
          event.method === 'HEAD' &&
          event.status === status &&
          (status === 404
            ? event.result === 'http-404' || event.result === 'http-failure'
            : event.result === 'served')
      ),
      `DOM original ${ordinal} ${format} probe was not observed at its exact URL/status`
    );
  }
  if (expectTransfer) {
    assert(
      events.some(
        (event) =>
          event.sourceUrl === `/media/${key}?format=jpg&name=orig` &&
          event.method === 'GET' &&
          event.status === 200 &&
          event.result === 'served'
      ),
      `DOM original ${ordinal} JPEG bytes were not transferred`
    );
  }
  assert(
    (after.domProbePeak ?? Number.POSITIVE_INFINITY) <= 4,
    'DOM probe queue exceeded four active sources'
  );
}

/** A displayed preview is allowed; no original format may be touched before this save. */
export function assertDeferredDomOriginalAbsent(
  events: readonly DomNativeEvent[],
  ordinal: number
): void {
  assert(Number.isSafeInteger(ordinal) && ordinal >= 0 && ordinal < 20);
  const key = `XegDom${String(ordinal).padStart(2, '0')}`;
  assert(
    !events.some(
      (event) =>
        event.sourceUrl?.startsWith(`/media/${key}?`) &&
        /(?:^|&)name=orig(?:&|$)/u.test(event.sourceUrl.slice(event.sourceUrl.indexOf('?') + 1))
    ),
    `Deferred DOM ordinal ${ordinal} had an original probe or transfer before its save request`
  );
}
export type OwnedPhotoDownload = {
  nativeId: number | string;
  state: 'complete';
  ownedPath: string;
  filename: string;
  bytesReceived: number;
  bytes: Buffer;
};

/** Compare actual files with independent GET bodies; archive entry order is immaterial. */
export function verifyPhotoCollectionDownloads(
  expected: readonly VerifiedPhoto[],
  references: readonly PhotoOriginalReference[],
  selectedIndex: number,
  single: OwnedPhotoDownload,
  zip: OwnedPhotoDownload
): {
  selected: { index: number; ownerId: string; ordinal: number; filename: string; sha256: string };
  zipEntries: Array<{
    index: number;
    ownerId: string;
    ordinal: number;
    filename: string;
    sha256: string;
  }>;
} {
  assert(expected.length === 20 || expected.length === 40, 'Photo proof requires 20 or 40 items');
  assert.equal(references.length, expected.length, 'Independent originals are incomplete');
  assert(
    Number.isSafeInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < expected.length
  );
  const validId = (value: number | string) =>
    (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
    (typeof value === 'string' && /^[A-Za-z0-9-]{8,80}$/u.test(value));
  assert(
    validId(single.nativeId) && validId(zip.nativeId) && single.nativeId !== zip.nativeId,
    'Distinct new native download IDs are required'
  );
  for (const download of [single, zip]) {
    assert.equal(download.state, 'complete', 'Native download is incomplete');
    assert.equal(basename(download.ownedPath), download.filename, 'Native file path/name differs');
    assert.equal(download.bytesReceived, download.bytes.length, 'Native byte count differs');
  }
  const byName = new Map<string, PhotoOriginalReference>();
  for (const [index, reference] of references.entries()) {
    const item = expected[index]!;
    assert.equal(reference.index, item.index, 'Reference gallery index differs');
    assert.equal(reference.ownerId, item.owner.statusId, 'Reference owner differs');
    assert.equal(reference.attachmentOrdinal, item.attachmentOrdinal, 'Reference ordinal differs');
    assert(reference.bytes.length > 0 && reference.bytes.length <= 64 * 1024 * 1024);
    assert.equal(stem(reference.sourceUrl), item.displayStem, 'Reference source identity differs');
    assert.equal(
      reference.sourceUrl,
      item.expected.originalUrl,
      'Reference original URL differs from frozen input'
    );
    assert.equal(
      reference.bytes.length,
      item.expected.bytes,
      'Reference byte size differs from frozen input'
    );
    assert.equal(
      createHash('sha256').update(reference.bytes).digest('hex'),
      item.expected.sha256,
      'Reference bytes differ from frozen input'
    );
    const expectedStem = `${item.owner.handle}_${item.owner.statusId}_${item.attachmentOrdinal}`;
    assert.equal(reference.filename.slice(0, reference.filename.lastIndexOf('.')), expectedStem);
    assert.equal(
      reference.filename,
      item.expected.filename,
      'Reference filename differs from frozen input'
    );
    assert(!byName.has(reference.filename.toLowerCase()), 'Duplicate ZIP filename stem');
    byName.set(reference.filename.toLowerCase(), reference);
  }
  const selected = references[selectedIndex]!;
  assert.equal(single.filename, selected.filename, 'Single filename changed from selected source');
  assert(
    single.bytes.equals(selected.bytes),
    'Single saved bytes differ from independent original'
  );
  const archive = inspectLiveStoredZip(zip.bytes, expected.length, 40);
  const found = new Set<string>();
  const zipEntries = archive.entries.map((entry) => {
    const key = entry.filename.toLowerCase();
    const reference = byName.get(key);
    assert(reference && !found.has(key), 'ZIP has an unknown or duplicate member');
    found.add(key);
    assert.equal(entry.filename, reference.filename, 'ZIP entry filename differs from source plan');
    assert.equal(entry.bytes, reference.bytes.length, 'ZIP member size differs from original');
    assert.equal(
      entry.sha256,
      createHash('sha256').update(reference.bytes).digest('hex'),
      'ZIP member bytes differ from original'
    );
    return {
      index: reference.index,
      ownerId: reference.ownerId,
      ordinal: reference.attachmentOrdinal,
      filename: entry.filename,
      sha256: entry.sha256,
    };
  });
  assert.equal(found.size, expected.length, 'ZIP is missing an owner-local media item');
  return {
    selected: {
      index: selected.index,
      ownerId: selected.ownerId,
      ordinal: selected.attachmentOrdinal,
      filename: selected.filename,
      sha256: createHash('sha256').update(selected.bytes).digest('hex'),
    },
    zipEntries,
  };
}

export async function observePhotoGallery(page: Page, expectedCount: number) {
  const gallery = page.locator('[data-xeg-gallery-container]');
  const snapshot = () =>
    gallery.evaluate((element) => {
      const toolbar = element.querySelector('[data-gallery-element="toolbar"]');
      const counter = toolbar?.querySelector(
        '#xeg-toolbar-counter[data-gallery-element="position"]'
      );
      const total = Number(counter?.getAttribute('data-total'));
      const currentIndex = Number(toolbar?.getAttribute('data-current-index'));
      const entries = [...element.querySelectorAll('[data-gallery-element="item"]')].map(
        (item) => ({
          index: Number(item.getAttribute('data-index')),
          mediaId: item.getAttribute('data-media-id') ?? '',
          displayUrl: item.getAttribute('data-media-display-url') ?? '',
        })
      );
      return { total, currentIndex, entries };
    });
  const first = await snapshot();
  assert.equal(first.total, expectedCount, 'Gallery total differs from declared owner counts');
  assert(
    Number.isSafeInteger(first.currentIndex) &&
      first.currentIndex >= 0 &&
      first.currentIndex < expectedCount
  );
  const observed = new Map(first.entries.map((entry) => [entry.index, entry]));
  const navigate = async (index: number, direction: 'Next' | 'Previous') => {
    await gallery
      .locator(`[data-gallery-element="toolbar"] button[aria-label="${direction}"]`)
      .click();
    await page.waitForFunction(
      (expected) =>
        document
          .querySelector('[data-xeg-gallery-container] [data-gallery-element="toolbar"]')
          ?.getAttribute('data-current-index') === String(expected),
      index,
      { timeout: 10_000 }
    );
    const selected = (await snapshot()).entries.filter((entry) => entry.index === index);
    assert.equal(selected.length, 1, `Selected gallery position ${index} has no unique media`);
    observed.set(index, selected[0]!);
  };
  if (observed.size !== expectedCount) {
    for (let index = first.currentIndex - 1; index >= 0; index--) {
      await navigate(index, 'Previous');
    }
    for (let index = 1; index < expectedCount; index++) {
      await navigate(index, 'Next');
    }
  }
  return {
    total: first.total,
    initialIndex: first.currentIndex,
    mountedCount: first.entries.length,
    entries: [...observed.values()].sort((a, b) => a.index - b.index),
    truncated: observed.size !== expectedCount,
  };
}

export async function verifyBoundaryPhotoSelections(
  page: Page,
  expected: readonly VerifiedPhoto[]
) {
  assert(expected.length === 20 || expected.length === 40);
  const gallery = page.locator('[data-xeg-gallery-container]');
  const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
  let current = Number(await toolbar.getAttribute('data-current-index'));
  assert(Number.isSafeInteger(current) && current >= 0 && current < expected.length);
  const visits: Array<SelectedPhotoSnapshot & { ownerId: string; ordinal: number }> = [];
  const moves: Array<{ from: number; to: number; direction: 'Next' | 'Previous' }> = [];
  for (const index of requiredPhotoPositions(expected.length as 20 | 40)) {
    while (current !== index) {
      const direction = current < index ? 'Next' : 'Previous';
      const from = current;
      await toolbar.locator(`button[aria-label="${direction}"]`).click();
      current += direction === 'Next' ? 1 : -1;
      await page.waitForFunction(
        (target) =>
          document
            .querySelector('[data-xeg-gallery-container] [data-gallery-element="toolbar"]')
            ?.getAttribute('data-current-index') === String(target),
        current,
        { timeout: 10_000 }
      );
      moves.push({ from, to: current, direction });
    }
    const item = expected[index]!;
    let selected: SelectedPhotoSnapshot | null = null;
    let lastFailure: unknown = new Error(`Selected photo ${index} did not settle`);
    const deadline = Date.now() + 10_000;
    do {
      selected = await gallery.evaluate(inspectSelectedPhotoDocument);
      try {
        verifySelectedPhoto(item, expected.length, selected);
        break;
      } catch (error) {
        lastFailure = error;
      }
      await new Promise((done) => setTimeout(done, 100));
    } while (Date.now() < deadline);
    if (!selected || !selected.imageLoaded || !selected.imageVisible) {
      throw lastFailure;
    }
    verifySelectedPhoto(item, expected.length, selected);
    visits.push({ ...selected, ownerId: item.owner.statusId, ordinal: item.attachmentOrdinal });
  }
  if (expected.length === 40) {
    assert(
      moves.some((move) => move.from === 19 && move.to === 20 && move.direction === 'Next'),
      'Requested-owner transition 19 to 20 was not navigated'
    );
  }
  return { visits, moves };
}

/** A separate photo-only installed-extension route. It does not satisfy full actual-site acceptance. */
export async function runLivePhotoCollection({
  context,
  extensionId,
  contract,
  downloads,
  output,
  managerObserver = null,
  fixture = null,
}: {
  context: BrowserContext;
  extensionId: string;
  contract: PhotoCollectionContract;
  downloads: string;
  output: string;
  managerObserver?: {
    snapshot(): number;
    beginsSince(since: number): Array<{ guid: string; url: string; suggestedFilename: string }>;
    flush(): Promise<void>;
    waitForCompletion(
      since: number,
      ...expectedNames: string[]
    ): Promise<{
      guid: string;
      url: string;
      suggestedFilename: string;
      receivedBytes: number;
      filePath?: string | null;
    }>;
  } | null;
  fixture?: {
    originals: ReadonlyMap<string, Buffer>;
    receiptFile: string;
    retainedPrefix: string;
    scope: string;
    observation?: 'dom';
    nativeSnapshot?: () => DomNativeSnapshot;
  } | null;
}) {
  const receipt: Record<string, unknown> = {
    status: 'failed',
    startedAt: new Date().toISOString(),
    scope:
      fixture?.scope ??
      'installed extension public photo collection and native single/ZIP bytes only',
    requested: contract.requested.statusId,
    directQuote: contract.directQuote?.statusId ?? null,
    visits: [],
  };
  const visits: Record<string, unknown>[] = [];
  receipt.visits = visits;
  const extensionPage = await context.newPage();
  let retainedTotal = 0;
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    for (const owner of [contract.directQuote, contract.requested]) {
      if (!owner) {
        continue;
      }
      const target =
        owner.statusId === contract.requested.statusId
          ? contract
          : { requested: owner, directQuote: null, expected: contract.expected.slice(0, 20) };
      const page = await context.newPage();
      const visit: Record<string, unknown> = {
        statusId: owner.statusId,
        status: 'failed',
        startedAt: new Date().toISOString(),
      };
      visits.push(visit);
      const productErrors: string[] = [];
      const pageErrors: string[] = [];
      const sourceRequestFailures: Array<Record<string, unknown>> = [];
      const sourceHttpNonSuccess: Array<Record<string, unknown>> = [];
      visit.sourceRequestFailures = sourceRequestFailures;
      visit.sourceHttpNonSuccess = sourceHttpNonSuccess;
      const isExpectedSource = (source: URL) =>
        source.hostname === 'pbs.twimg.com' &&
        source.pathname.startsWith('/media/') &&
        target.expected.some((item) => item.sourceKey === stem(source.href));
      const onRequestFailed = (request: Request) => {
        const source = new URL(request.url());
        if (!isExpectedSource(source)) {
          return;
        }
        if (sourceRequestFailures.length >= 40) {
          visit.sourceRequestFailureOverflow = true;
          return;
        }
        sourceRequestFailures.push({
          path: source.pathname.slice(0, 160),
          format: source.searchParams.get('format')?.slice(0, 20) ?? null,
          name: source.searchParams.get('name')?.slice(0, 20) ?? null,
          method: request.method(),
          resourceType: request.resourceType(),
          error: request.failure()?.errorText.slice(0, 240) ?? null,
        });
      };
      context.on('requestfailed', onRequestFailed);
      visit.productErrors = productErrors;
      visit.pageErrors = pageErrors;
      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          (message.text().startsWith('[XEG]') ||
            message.location().url.startsWith(`chrome-extension://${extensionId}/`))
        ) {
          if (productErrors.length < 20) {
            productErrors.push(message.text().slice(0, 240));
          } else {
            visit.productErrorOverflow = true;
          }
        }
      });
      page.on('pageerror', (error) => {
        if (pageErrors.length < 20) {
          pageErrors.push(error.message.slice(0, 240));
        } else {
          visit.pageErrorOverflow = true;
        }
      });
      const retain = async (kind: 'zip' | 'single', bytes: Buffer) => {
        retainedTotal += bytes.length;
        assert(
          retainedTotal <= 64 * 1024 * 1024,
          'Owned photo evidence exceeds flat-stage transfer budget'
        );
        const name = `${fixture?.retainedPrefix ?? 'photo-collection'}-${owner.statusId}-${kind}.bin`;
        const path = join(output, name);
        await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
        const retained = await readFile(path);
        assert(retained.equals(bytes), 'Retained native file copy differs');
        return {
          file: name,
          bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex'),
        };
      };
      const observations: PhotoProviderTrace[] = [];
      const providerStatuses: Array<{ requestedId: string | null; status: number }> = [];
      const pending = new Set<Promise<void>>();
      const captureErrors: unknown[] = [];
      let overflow = false;
      let admittedProviderResponses = 0;
      const providerChannels: Array<Record<string, unknown>> = [];
      visit.providerChannels = providerChannels;
      visit.apiObservationChannel = 'owned-browser-context (frame and service-worker responses)';
      const onResponse = (response: Response) => {
        const source = new URL(response.url());
        if (isExpectedSource(source) && response.status() >= 400) {
          if (sourceHttpNonSuccess.length >= 40) {
            visit.sourceHttpObservationOverflow = true;
          } else {
            sourceHttpNonSuccess.push({
              path: source.pathname.slice(0, 160),
              format: source.searchParams.get('format')?.slice(0, 20) ?? null,
              name: source.searchParams.get('name')?.slice(0, 20) ?? null,
              status: response.status(),
            });
          }
        }
        if (!photoProviderRequestMatches(source, target.requested.statusId)) {
          return;
        }
        const requestedId = target.requested.statusId;
        if (admittedProviderResponses >= 12) {
          overflow = true;
          return;
        }
        admittedProviderResponses += 1;
        const request = response.request();
        const worker = request.serviceWorker();
        let producerOrigin: string | null = null;
        try {
          const producer = new URL(worker ? worker.url() : request.frame().url());
          producerOrigin =
            producer.protocol === 'chrome-extension:'
              ? `chrome-extension://${producer.host}`
              : producer.origin;
        } catch {
          /* Keep unavailable producer origin explicit. */
        }
        providerChannels.push({
          requestedId,
          observedAt: new Date().toISOString(),
          status: response.status(),
          kind: worker ? 'service-worker' : 'frame',
          origin: producerOrigin,
        });
        const capture = (async () => {
          const length = Number(response.headers()['content-length']);
          assert(
            !Number.isFinite(length) || length <= 2_000_000,
            'Provider response exceeds bounded trace'
          );
          const bytes = await response.body();
          assert(bytes.length <= 2_000_000, 'Provider response exceeds bounded trace');
          const variables: unknown = JSON.parse(
            new URL(response.url()).searchParams.get('variables') ?? '{}'
          );
          const requestedId =
            variables && typeof variables === 'object' && 'tweetId' in variables
              ? String(variables.tweetId)
              : null;
          providerStatuses.push({ requestedId, status: response.status() });
          const observation = summarizeTweetResultResponse(
            response.url(),
            response.status(),
            JSON.parse(bytes.toString('utf8')),
            40
          );
          if (observation) {
            observations.push(observation);
          }
        })().catch((error: unknown) => {
          captureErrors.push(error);
        });
        pending.add(capture);
        void capture.finally(() => pending.delete(capture));
      };
      context.on('response', onResponse);
      try {
        const url = `https://x.com/${owner.handle}/status/${owner.statusId}`;
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        assert.equal(response?.status(), 200, 'Public post did not return HTTP 200');
        await page
          .locator('html[data-xeg-gallery-ready="true"]')
          .waitFor({ state: 'attached', timeout: 20_000 });
        const domObservation = fixture?.observation === 'dom';
        const domTiles = domObservation
          ? await page
              .locator('article[data-testid="tweet"] a[href*="/photo/"]:has(img)')
              .evaluateAll((anchors) =>
                anchors.map((anchor) => ({
                  href: (anchor as HTMLAnchorElement).href,
                  displayUrl: anchor.querySelector('img')?.getAttribute('src') ?? '',
                }))
              )
          : null;
        if (domObservation) {
          assert.equal(domTiles?.length, 20, 'DOM fixture did not expose twenty owned tiles');
          await page.locator('article[data-testid="tweet"] a[href$="/photo/20"] img').click();
          await page
            .locator('[data-xeg-gallery-container]')
            .waitFor({ state: 'attached', timeout: 20_000 });
        } else {
          await openCurrentStatusImage(page, url, visit);
        }
        const providerDeadline = Date.now() + 10_000;
        while (
          !(domObservation
            ? providerStatuses.some(
                (entry) => entry.requestedId === target.requested.statusId && entry.status === 403
              )
            : observations.some(
                (entry) =>
                  entry.requestedTweetId === target.requested.statusId &&
                  entry.httpStatus === 200 &&
                  entry.result?.id === target.requested.statusId
              )) &&
          Date.now() < providerDeadline
        ) {
          await new Promise((done) => setTimeout(done, 100));
        }
        await Promise.all([...pending]);
        assert.equal(captureErrors.length, 0, 'Provider trace capture failed');
        assert(!overflow, 'Provider trace exceeded observation budget');
        if (domObservation) {
          assert(
            providerStatuses.some(
              (entry) => entry.requestedId === target.requested.statusId && entry.status === 403
            ),
            'Fresh exact-owner API 403 was not observed'
          );
          assert(
            !providerStatuses.some(
              (entry) => entry.requestedId === target.requested.statusId && entry.status === 200
            ),
            'Successful API response would invalidate the DOM-only fixture'
          );
          visit.apiFailure = providerStatuses;
        }
        const gallery = await observePhotoGallery(
          page,
          target.requested.count + (target.directQuote?.count ?? 0)
        );
        const verified = domObservation
          ? verifyDomPhotoCollection(target, domTiles!, gallery)
          : verifyPhotoCollection(target, observations, gallery);
        const clickedSource = domObservation
          ? verified[19]?.displayStem
          : (visit.readiness as { target?: { imageSource?: { path?: string } } } | undefined)
              ?.target?.imageSource?.path;
        const clickedIndex = domObservation
          ? 19
          : Number(
              (visit.displayedSelection as { currentIndex?: unknown } | undefined)?.currentIndex
            );
        assert(
          Number.isSafeInteger(clickedIndex) && clickedIndex >= 0 && clickedIndex < verified.length
        );
        assert(
          clickedSource &&
            (domObservation ? clickedSource : stem(`https://pbs.twimg.com${clickedSource}`)) ===
              verified[clickedIndex]?.displayStem,
          'Clicked source did not select its pinned gallery item'
        );
        assert.equal(
          gallery.initialIndex,
          clickedIndex,
          'Clicked photo selected another gallery index'
        );
        visit.clicked = {
          index: clickedIndex,
          ownerId: verified[clickedIndex]!.owner.statusId,
          mediaId: verified[clickedIndex]!.mediaId,
          providerMediaId: verified[clickedIndex]!.providerMediaId,
          ordinal: verified[clickedIndex]!.attachmentOrdinal,
        };
        visit.collection = {
          total: gallery.total,
          mountedCount: gallery.mountedCount,
          identities: verified.map((item) => ({
            index: item.index,
            ownerId: item.owner.statusId,
            mediaId: item.mediaId,
            providerMediaId: item.providerMediaId,
            ordinal: item.attachmentOrdinal,
            sourceStem: item.displayStem,
          })),
        };
        visit.selectedPositions = await verifyBoundaryPhotoSelections(page, verified);
        if (domObservation) {
          const details = page.locator(
            '[data-xeg-gallery-container] [data-gallery-element="source-details"]'
          );
          await details.waitFor({ state: 'visible', timeout: 10_000 });
          const summaryParts = (await details.locator('summary span').allTextContents()).map(
            (part) => part.trim()
          );
          assertDomPhotoSourceDetails(summaryParts, 'verified');
          const partialBody = (await details.locator('p').first().textContent())?.trim() ?? '';
          assert.equal(
            partialBody,
            'Only currently available media was collected. The post may contain more; bulk download includes only collected items.'
          );
          visit.unknownTotal = { summaryParts, partialBody };
        }
        const beforeDomSingle = domObservation ? fixture?.nativeSnapshot?.() : null;
        if (beforeDomSingle) {
          const eagerWebp = beforeDomSingle.events.filter(
            (event) =>
              /^\/media\/XegDom\d{2}\?format=webp&name=orig$/u.test(event.sourceUrl ?? '') &&
              event.method === 'HEAD'
          );
          assert(
            eagerWebp.length > 0 && new Set(eagerWebp.map((event) => event.sourceUrl)).size <= 4,
            'DOM eager probe count exceeded its initial budget'
          );
          verifyDomNativeProbes({ events: [] }, beforeDomSingle, 19, false);
          assertDeferredDomOriginalAbsent(beforeDomSingle.events, 12);
          visit.initialDomProbes = beforeDomSingle.events.filter((event) =>
            event.sourceUrl?.startsWith('/media/XegDom')
          );
        }
        const toolbar = page.locator(
          '[data-xeg-gallery-container] [data-gallery-element="toolbar"]'
        );
        const references: PhotoOriginalReference[] = [];
        let referenceTotal = 0;
        for (const item of verified) {
          const filename = item.expected.filename;
          const format = new URL(item.expected.originalUrl).searchParams.get('format');
          assert(format);
          const original = fixture
            ? { bytes: fixture.originals.get(item.expected.originalUrl) }
            : await fetchBoundedLiveOriginal(item.expected.originalUrl, format);
          assert(original.bytes, 'Synthetic fixture original is absent');
          referenceTotal += original.bytes.length;
          assert(
            referenceTotal <= 128 * 1024 * 1024,
            'Independent photo references exceeded budget'
          );
          references.push({
            index: item.index,
            ownerId: item.owner.statusId,
            attachmentOrdinal: item.attachmentOrdinal,
            sourceUrl: item.expected.originalUrl,
            filename,
            bytes: original.bytes,
          });
        }
        visit.references = references.map((entry) => ({
          index: entry.index,
          ownerId: entry.ownerId,
          ordinal: entry.attachmentOrdinal,
          sourceUrl: entry.sourceUrl,
          filename: entry.filename,
          bytes: entry.bytes.length,
          sha256: createHash('sha256').update(entry.bytes).digest('hex'),
        }));
        const selectedIndex = domObservation ? 12 : target.directQuote ? 20 : 19;
        const saveSelected = async () => {
          const selected = verified[selectedIndex]!;
          const current = await toolbar.getAttribute('data-current-index');
          let position = Number(current);
          assert(Number.isSafeInteger(position));
          while (position !== selectedIndex) {
            const direction = position < selectedIndex ? 'Next' : 'Previous';
            await toolbar.locator(`button[aria-label="${direction}"]`).click();
            position += direction === 'Next' ? 1 : -1;
            await page.waitForFunction(
              (index) =>
                document
                  .querySelector('[data-xeg-gallery-container] [data-gallery-element="toolbar"]')
                  ?.getAttribute('data-current-index') === String(index),
              position,
              { timeout: 10_000 }
            );
          }
          const selectedId = await page
            .locator(
              `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${selectedIndex}"]`
            )
            .getAttribute('data-media-id');
          assert.equal(selectedId, selected.mediaId, 'Selected media changed before single save');
          const sourceDetails = domObservation
            ? page.locator('[data-xeg-gallery-container] [data-gallery-element="source-details"]')
            : null;
          const qualityBefore = sourceDetails
            ? (await sourceDetails.locator('p').last().textContent())?.trim()
            : null;
          if (sourceDetails) {
            assert.equal(await sourceDetails.getAttribute('data-media-id'), selected.mediaId);
            const parts = (await sourceDetails.locator('summary span').allTextContents()).map(
              (part) => part.trim()
            );
            assertDomPhotoSourceDetails(parts, 'pending');
            assert.equal(
              qualityBefore,
              'This image has not been checked yet. Saving it or the ZIP will check the original source first.'
            );
            visit.deferredSourceDetail = qualityBefore;
          }
          const beforeSingle = new Set(
            (await queryDownloads(extensionPage, extensionId)).map((item) => item.id)
          );
          const cdpSingleSince = managerObserver?.snapshot() ?? 0;
          await toolbar.locator('button[aria-label="Download"]').click();
          const singleProgress: Array<{
            id: number;
            state: string;
            bytesReceived: number;
            totalBytes: number;
          }> = [];
          const singleItem = await waitForOwnedDownload(
            extensionPage,
            extensionId,
            beforeSingle,
            64 * 1024 * 1024,
            singleProgress
          );
          if (!managerObserver) {
            const nativeSource = await extensionPage.evaluate(
              async ({ id, extensionId }) => {
                if (chrome.runtime.id !== extensionId) {
                  return null;
                }
                const matches = await chrome.downloads.search({ id });
                const item = matches.length === 1 ? matches[0] : null;
                return item?.id === id && item.byExtensionId === extensionId
                  ? { url: item.url ?? null, finalUrl: item.finalUrl ?? null }
                  : null;
              },
              { id: singleItem.id, extensionId }
            );
            assertExactPhotoNativeSource(nativeSource, references[selectedIndex]!.sourceUrl);
            visit.extensionSingleSource = nativeSource;
          } else {
            const nativeSource = await extensionPage.evaluate(
              async ({ id, managerId }) => {
                const matches = await chrome.downloads.search({ id });
                const item = matches.length === 1 ? matches[0] : null;
                return item?.id === id && item.byExtensionId === managerId
                  ? { url: item.url ?? null, finalUrl: item.finalUrl ?? null }
                  : null;
              },
              { id: singleItem.id, managerId: extensionId }
            );
            assert(nativeSource?.url, 'Manager single native source is unavailable');
            assert(
              nativeSource.url === references[selectedIndex]!.sourceUrl ||
                nativeSource.url.startsWith('blob:https://x.com/'),
              'Manager single native URL is not the selected original or owned Blob'
            );
            if (nativeSource.url === references[selectedIndex]!.sourceUrl) {
              assertExactPhotoNativeSource(nativeSource, references[selectedIndex]!.sourceUrl);
            } else {
              assert(
                nativeSource.finalUrl === null || nativeSource.finalUrl === nativeSource.url,
                'Owned manager Blob redirected to another source'
              );
            }
            visit.managerSingleSource = nativeSource;
          }
          const singleBytes = await readOwnedFile(singleItem, downloads, 64 * 1024 * 1024);
          visit.retainedSingle = await retain('single', singleBytes);
          if (sourceDetails) {
            await page.waitForFunction(
              (previous) => {
                const details = document.querySelector(
                  '[data-xeg-gallery-container] [data-gallery-element="source-details"]'
                );
                const detail = details?.querySelector('p:last-of-type')?.textContent?.trim();
                return Boolean(detail && detail !== previous);
              },
              qualityBefore,
              { timeout: 10_000 }
            );
            const qualityAfter = (await sourceDetails.locator('p').last().textContent())?.trim();
            assert.equal(qualityAfter, 'Save source: verified original image from X’s CDN.');
            assert.equal(await sourceDetails.getAttribute('data-media-id'), selected.mediaId);
            const parts = (await sourceDetails.locator('summary span').allTextContents()).map(
              (part) => part.trim()
            );
            assertDomPhotoSourceDetails(parts, 'verified');
            visit.verifiedSourceDetail = qualityAfter;
          }
          await managerObserver?.flush();
          const cdpSingleBegins = managerObserver?.beginsSince(cdpSingleSince) ?? [];
          assert(
            cdpSingleBegins.length <= 1,
            'One manager single save created multiple CDP downloads'
          );
          const cdpSingle = cdpSingleBegins.length
            ? await managerObserver!.waitForCompletion(
                cdpSingleSince,
                basename(singleItem.filename)
              )
            : null;
          if (cdpSingle) {
            assert.equal(
              cdpSingle.receivedBytes,
              singleBytes.length,
              'Manager single CDP completion size differs'
            );
          }
          return { singleItem, singleBytes, singleProgress, cdpSingle };
        };
        const earlySingle = domObservation ? await saveSelected() : null;
        if (beforeDomSingle && fixture?.nativeSnapshot) {
          const afterDomSingle = fixture.nativeSnapshot();
          verifyDomNativeProbes(beforeDomSingle, afterDomSingle, 12, true);
          visit.singleDomProbes = afterDomSingle.events.slice(beforeDomSingle.events.length);
        }
        const beforeZip = managerObserver
          ? null
          : new Set((await queryDownloads(extensionPage, extensionId)).map((item) => item.id));
        const cdpZipSince = managerObserver?.snapshot() ?? 0;
        await toolbar
          .locator(`button[aria-label="Download ${verified.length} shown files as ZIP"]`)
          .click();
        const zipProgress: Array<{
          id: number;
          state: string;
          bytesReceived: number;
          totalBytes: number;
        }> = [];
        const cdpZip = managerObserver
          ? await managerObserver.waitForCompletion(cdpZipSince)
          : null;
        const zipItem = beforeZip
          ? await waitForOwnedDownload(
              extensionPage,
              extensionId,
              beforeZip,
              128 * 1024 * 1024,
              zipProgress
            )
          : null;
        const zipPath = cdpZip
          ? (cdpZip.filePath ?? join(downloads, cdpZip.suggestedFilename))
          : zipItem?.filename;
        assert(zipPath, 'Native ZIP file path is unavailable');
        const zipBytes = zipItem
          ? await readOwnedFile(zipItem, downloads, 128 * 1024 * 1024)
          : (await readOwnedNativeBytes(downloads, zipPath, 128 * 1024 * 1024)).bytes;
        visit.retainedZip = await retain('zip', zipBytes);
        if (cdpZip) {
          assert.equal(
            cdpZip.receivedBytes,
            zipBytes.length,
            'Manager ZIP CDP completion size differs'
          );
          assert(
            cdpZip.url.startsWith('blob:https://x.com/'),
            'Manager ZIP did not use an owned page Blob'
          );
        }
        const archive = inspectLiveStoredZip(zipBytes, verified.length, 40);
        if (domObservation && fixture?.nativeSnapshot) {
          const afterDomZip = fixture.nativeSnapshot();
          for (let ordinal = 0; ordinal < 20; ordinal++) {
            verifyDomNativeProbes({ events: [] }, afterDomZip, ordinal, true);
          }
          visit.zipDomProbePeak = afterDomZip.domProbePeak;
        }
        for (const item of verified) {
          assert.equal(
            archive.entries.filter((entry) => entry.filename === item.expected.filename).length,
            1,
            'ZIP lacks one pinned owner-local filename'
          );
        }
        if (domObservation) {
          const outcome = page.locator(
            '[data-xeg-gallery-container] [data-gallery-element="bulk-download-outcome"]'
          );
          await outcome.waitFor({ state: 'visible', timeout: 10_000 });
          await page.waitForFunction(
            () =>
              document
                .querySelector('[data-gallery-element="bulk-download-outcome"] strong')
                ?.textContent?.trim() === 'ZIP handed off to browser',
            undefined,
            { timeout: 10_000 }
          );
          const title = (await outcome.locator('strong').textContent())?.trim() ?? '';
          const paragraphs = (await outcome.locator('p').allTextContents()).map((text) =>
            text.trim()
          );
          const partialBody = (visit.unknownTotal as { partialBody: string }).partialBody;
          assertDomPhotoZipOutcome(title, paragraphs, partialBody);
          assert.equal(
            await outcome
              .getByRole('button', { name: /Download [0-9]+ missing items as a separate ZIP/u })
              .count(),
            0
          );
          visit.unknownTotalZip = { title, paragraphs };
        }
        const { singleItem, singleBytes, singleProgress, cdpSingle } =
          earlySingle ?? (await saveSelected());
        assert(
          singleBytes.length + referenceTotal + zipBytes.length <= 128 * 1024 * 1024,
          'Photo proof exceeded retained byte budget'
        );
        const proof = verifyPhotoCollectionDownloads(
          verified,
          references,
          selectedIndex,
          {
            nativeId: singleItem.id,
            state: 'complete',
            ownedPath: singleItem.filename,
            filename: basename(singleItem.filename),
            bytesReceived: singleItem.bytesReceived,
            bytes: singleBytes,
          },
          {
            nativeId: zipItem?.id ?? cdpZip!.guid,
            state: 'complete',
            ownedPath: zipPath,
            filename: basename(zipPath),
            bytesReceived: zipItem?.bytesReceived ?? cdpZip!.receivedBytes,
            bytes: zipBytes,
          }
        );
        visit.downloads = {
          proof,
          zipNativeId: zipItem?.id ?? cdpZip!.guid,
          singleNativeId: singleItem.id,
          managerZipGuid: cdpZip?.guid ?? null,
          managerSingleGuid: cdpSingle?.guid ?? null,
          retainedZip: visit.retainedZip,
          retainedSingle: visit.retainedSingle,
          zipProgress,
          singleProgress,
        };
        assert(
          productErrors.length === 0 &&
            pageErrors.length === 0 &&
            !visit.productErrorOverflow &&
            !visit.pageErrorOverflow &&
            !visit.sourceRequestFailureOverflow &&
            !visit.sourceHttpObservationOverflow,
          'Photo collection introduced product/page errors or lost source diagnostics'
        );
        await page.keyboard.press('Escape');
        await page
          .locator('[data-xeg-gallery-container]')
          .waitFor({ state: 'detached', timeout: 10_000 });
      } catch (error) {
        visit.selectionAtFailure = await page
          .evaluate(() => {
            const gallery = document.querySelector('[data-xeg-gallery-container]');
            const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
            const counter = gallery?.querySelector('#xeg-toolbar-counter');
            const index = toolbar?.getAttribute('data-current-index');
            const item = gallery?.querySelector(
              `[data-gallery-element="item"][data-index="${index}"]`
            );
            const image = item?.querySelector('img');
            let source: Record<string, unknown> | null = null;
            if (image instanceof HTMLImageElement) {
              try {
                const url = new URL(image.currentSrc || image.src);
                source = {
                  protocol: url.protocol,
                  host: url.hostname,
                  path:
                    url.protocol === 'https:' && url.hostname === 'pbs.twimg.com'
                      ? url.pathname.slice(0, 160)
                      : null,
                  format: url.searchParams.get('format')?.slice(0, 20) ?? null,
                  name: url.searchParams.get('name')?.slice(0, 20) ?? null,
                };
              } catch {
                source = { invalid: true };
              }
            }
            return {
              total: counter?.getAttribute('data-total') ?? null,
              position: counter?.getAttribute('data-position') ?? null,
              currentIndex: index ?? null,
              focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
              counterCurrentIndex: counter?.getAttribute('data-current-index') ?? null,
              counterFocusedIndex: counter?.getAttribute('data-focused-index') ?? null,
              loaded: item?.getAttribute('data-media-loaded') ?? null,
              active: item?.getAttribute('data-media-active') ?? null,
              focused: item?.getAttribute('data-media-focused') ?? null,
              complete: image instanceof HTMLImageElement ? image.complete : null,
              naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : null,
              source,
            };
          })
          .catch(() => null);
        throw error;
      } finally {
        context.off('requestfailed', onRequestFailed);
        context.off('response', onResponse);
        await page.close();
        visit.pageClosed = true;
        visit.finishedAt = new Date().toISOString();
      }
      visit.status = 'observed';
    }
    receipt.status = 'observed';
  } catch (error) {
    receipt.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      await extensionPage.close();
      receipt.extensionPageClosed = true;
      receipt.finishedAt = new Date().toISOString();
    } catch (error) {
      receipt.status = 'failed';
      receipt.extensionPageCloseError = error instanceof Error ? error.message : String(error);
    }
    await writeFile(
      join(output, fixture?.receiptFile ?? 'live-photo-collection.json'),
      JSON.stringify(receipt, null, 2),
      {
        flag: 'wx',
        mode: 0o600,
      }
    );
  }
  return receipt;
}
