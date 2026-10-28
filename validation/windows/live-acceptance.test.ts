// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test, vi } from 'vite-plus/test';
import type { BrowserContext, ElementHandle, Page } from '@playwright/test';
import {
  closeObservedLivePage,
  directOwnerForSource,
  liveCompletionPassed,
  observeLiveUrls,
  validateOwnedCandidateInBorrowedBrowser,
} from './live-page.ts';
import {
  canonicalOwnedPhotoSources,
  inspectLiveStoredZip,
  nativeSingleSourceMatchesDocument,
  observeActualSiteVideoNavigation,
  parseActualSiteAcceptanceSelector,
  runActualSiteAcceptance,
  taskOwnedDownloadsDocument,
  verifyLiveArchiveSources,
  waitForOwnedDownload,
} from './live-acceptance.ts';
import {
  inspectLiveMixedGallerySelectionDocument,
  inspectSelectedGalleryVideoDocument,
} from './live-page-document.ts';
import type { ImageTarget } from './live-page-document.ts';

const STORED_ZIP_HEX =
  '504b0304140000080000000000002639f4cb09000000090000000900000066697273742e747874313233343536373839504b0304140000080000000000002438b23f04000000040000000a0000007365636f6e642e62696e000102ff504b01021400140000080000000000002639f4cb090000000900000009000000000000000000000000000000000066697273742e747874504b01021400140000080000000000002438b23f04000000040000000a00000000000000000000000000300000007365636f6e642e62696e504b050600000000020002006f0000005c0000000000';

const context = {
  liveUrls: ['https://x.com/NASA/status/2041557036274475228'],
  installation: 'extension',
  otherFocusedInput: false,
};

test('return navigation waits for the exact original media and all other players to pause', async () => {
  const original = {
    index: 0,
    total: 2,
    kind: 'video' as const,
    source: { host: 'video.twimg.com', path: '/original.mp4' },
    otherPlayingVideos: 0,
  };
  const neighbor = {
    ...original,
    index: 1,
    source: { host: 'video.twimg.com', path: '/neighbor.mp4' },
  };
  let position = 0;
  let returnReads = 0;
  let failOnSecondReturnRead = false;
  const page = {
    evaluate: async (fn: unknown) => {
      if (fn === inspectSelectedGalleryVideoDocument) {
        return { total: 2 };
      }
      assert.equal(fn, inspectLiveMixedGallerySelectionDocument);
      if (position === 0) {
        return original;
      }
      if (position === 1) {
        return neighbor;
      }
      if (failOnSecondReturnRead && returnReads === 1) {
        throw new Error('return inspection failed');
      }
      return (
        [
          { ...original, source: neighbor.source },
          { ...original, kind: 'image' },
          { ...original, otherPlayingVideos: 1 },
          original,
        ][returnReads++] ?? original
      );
    },
    locator: () => ({
      locator: (selector: string) => ({
        click: async () => {
          assert.match(selector, /aria-label/u);
          position += 1;
        },
      }),
    }),
    waitForFunction: async () => true,
  } as unknown as Page;
  const receipt = await observeActualSiteVideoNavigation(page);
  assert.equal(receipt.status, 'observed');
  assert.deepEqual(receipt.returned, original);
  assert.equal(returnReads, 4);

  position = 0;
  returnReads = 0;
  failOnSecondReturnRead = true;
  const failed = await observeActualSiteVideoNavigation(page);
  assert.equal(failed.status, 'failed');
  assert.match(failed.error ?? '', /return inspection failed/u);
  assert.deepEqual(failed.returned, { ...original, source: neighbor.source });
});

test('owned-photo navigation reports the played video before returning to the photo', async () => {
  const photo = {
    index: 0,
    total: 2,
    kind: 'image' as const,
    source: { host: 'pbs.twimg.com', path: '/media/photo.jpg' },
    otherPlayingVideos: 0,
  };
  const neighbor = {
    ...photo,
    index: 1,
    kind: 'video' as const,
    source: { host: 'video.twimg.com', path: '/amplify_video/456/vid/clip.mp4' },
  };
  let position = 0;
  let videoReads = 0;
  let controlReads = 0;
  const events: string[] = [];
  const videoControl = {
    focus: async () => undefined,
    evaluate: async () => [true, 0, 0.2][controlReads++],
  };
  const page = {
    evaluate: async (fn: unknown) => {
      if (fn === inspectLiveMixedGallerySelectionDocument) {
        return position === 0 ? photo : neighbor;
      }
      assert.equal(fn, inspectSelectedGalleryVideoDocument);
      return {
        index: 1,
        total: 2,
        itemLoaded: true,
        visible: true,
        readyState: 4,
        width: 720,
        height: 1280,
        mediaErrorCode: null,
        source: neighbor.source,
        currentTime: videoReads++ === 0 ? 0 : 0.2,
      };
    },
    locator: (selector: string) =>
      selector.includes('toolbar')
        ? {
            locator: (button: string) => ({
              click: async () => {
                events.push(button.includes('Next') ? 'next' : 'return');
                position = button.includes('Next') ? 1 : 0;
              },
            }),
          }
        : { nth: () => ({ locator: () => videoControl }) },
    waitForFunction: async () => true,
    keyboard: { press: async () => events.push('space') },
  } as unknown as Page;
  const receipt = await observeActualSiteVideoNavigation(page, 'owned-photo', async (video) => {
    events.push('selected-video');
    assert.deepEqual(video.source, neighbor.source);
    assert.equal(video.currentTime, 0.2);
  });
  assert.equal(receipt.status, 'observed');
  assert.equal(receipt.playback?.progressed, true);
  assert.deepEqual(receipt.returned, photo);
  assert.deepEqual(events, ['next', 'space', 'selected-video', 'return']);
});

test('actual-site acceptance restores the owned X tab before revalidating and clicking', async () => {
  const output = await mkdtemp(join(tmpdir(), 'xeg-live-acceptance-'));
  const events: string[] = [];
  const extensionPage = {
    goto: async () => undefined,
    close: async () => {
      events.push('close-extension');
    },
  } as unknown as Page;
  const page = {
    bringToFront: async () => {
      events.push('focus-owned-page');
    },
    screenshot: async () => {
      throw new Error('test screenshot unavailable');
    },
  } as unknown as Page;
  let imageChecks = 0;
  const image = {
    evaluate: async () => {
      events.push('validate-image');
      return ++imageChecks === 1
        ? true
        : { actionIndex: 0, actionPath: '/NASA/status/123/photo/1' };
    },
    evaluateHandle: async () => ({ dispose: async () => undefined }),
  } as unknown as ElementHandle<HTMLImageElement>;
  const action = {
    evaluate: async () => {
      events.push('validate-action');
      return true;
    },
    click: async () => {
      events.push('click');
      throw new Error('stop after click');
    },
  } as unknown as ElementHandle<HTMLAnchorElement>;
  try {
    const receipt = await runActualSiteAcceptance({
      context: { newPage: async () => extensionPage } as unknown as BrowserContext,
      page,
      action,
      image,
      imageOwner: {} as ElementHandle<HTMLElement>,
      target: {} as ImageTarget,
      actionPath: '/NASA/status/123/photo/1',
      extensionId: 'm'.repeat(32),
      targetUrl: 'https://x.com/NASA/status/123',
      navigationUrl: 'https://x.com/NASA/status/456',
      downloads: output,
      output,
      index: 1,
      readSettings: async () => ({ exists: true, value: {}, settings: {} }),
      restoreSettings: async () => true,
      readProviderObservations: async () => [],
    });
    assert.equal(receipt.status, 'failed');
    assert.match(receipt.error ?? '', /stop after click/u);
    assert.deepEqual(events, [
      'focus-owned-page',
      'validate-image',
      'validate-image',
      'validate-action',
      'click',
      'close-extension',
    ]);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('live completion requires cleanup from both initial and controlled pages', () => {
  const retry = {
    status: 'core-flow-observed',
    observation: { status: 'core-flow-observed', cleanup: { pageClosed: true } },
    cleanup: { restored: true, extensionPageClosed: true },
  };
  assert.equal(
    liveCompletionPassed({
      status: 'failed',
      cleanup: { pageClosed: false },
      controlledProbe: retry,
    }),
    false
  );
  assert.equal(
    liveCompletionPassed({
      status: 'failed',
      controlledProbe: {
        ...retry,
        cleanup: { ...retry.cleanup, extensionPageClosed: false },
      },
    }),
    false
  );
  assert.equal(liveCompletionPassed({ status: 'failed', controlledProbe: retry }), true);
  assert.equal(
    liveCompletionPassed({
      status: 'failed',
      cleanup: { pageClosed: true },
      controlledProbe: retry,
    }),
    true
  );
  assert.equal(
    liveCompletionPassed({ status: 'core-flow-observed', cleanup: { pageClosed: true } }),
    true
  );
  assert.equal(
    liveCompletionPassed({ status: 'core-flow-observed', cleanup: { pageClosed: false } }),
    false
  );
});

test('borrowed browser acceptance requires the newly owned candidate and download directory', async () => {
  const extensionId = 'm'.repeat(32);
  const proof = {
    kind: 'task-owned-extension-in-borrowed-browser' as const,
    extensionId,
    installedPathSha256: 'a'.repeat(64),
    newlyLoaded: true as const,
    sourcePathVerified: true as const,
    runtimeResourceCount: 12 as const,
    runtimeResourceBinding: 'matched' as const,
    newPagesOnly: true as const,
    downloadsPath: resolve('task-owned-downloads'),
    downloadsDirectoryOwned: true as const,
  };
  assert.equal(
    validateOwnedCandidateInBorrowedBrowser(proof, extensionId, proof.downloadsPath),
    true
  );
  assert.equal(
    validateOwnedCandidateInBorrowedBrowser(proof, 'n'.repeat(32), proof.downloadsPath),
    false
  );
  assert.equal(
    validateOwnedCandidateInBorrowedBrowser(
      { ...proof, newlyLoaded: false as never },
      extensionId,
      proof.downloadsPath
    ),
    false
  );
  assert.equal(
    validateOwnedCandidateInBorrowedBrowser(proof, extensionId, resolve('other-downloads')),
    false
  );
  await assert.rejects(
    () =>
      observeLiveUrls({
        context: null as unknown as BrowserContext,
        extensionId,
        liveUrls: context.liveUrls,
        output: '/tmp/unused',
        session: 'borrowed',
        actualSiteAcceptance: { downloads: proof.downloadsPath },
      }),
    /task-owned extension/u
  );
  await assert.rejects(
    () =>
      observeLiveUrls({
        context: null as unknown as BrowserContext,
        extensionId,
        liveUrls: context.liveUrls,
        output: '/tmp/unused',
        session: 'borrowed-browser-owned-extension',
        actualSiteAcceptance: { downloads: proof.downloadsPath },
      }),
    /attested task-owned candidate/u
  );
  await assert.rejects(
    () =>
      observeLiveUrls({
        context: null as unknown as BrowserContext,
        extensionId,
        liveUrls: context.liveUrls,
        output: '/tmp/unused',
        session: 'borrowed-browser-owned-extension',
        ownedCandidateProof: proof,
        actualSiteAcceptance: { downloads: proof.downloadsPath },
      }),
    /validated host baseline/u
  );
});

test('download ownership stays inside the extension page and returns only task fields', async () => {
  const extensionId = 'm'.repeat(32);
  const item = (id: number, byExtensionId?: string) => ({
    id,
    ...(byExtensionId ? { byExtensionId } : {}),
    state: 'complete',
    filename: '/tmp/task-owned-downloads/file',
    url: 'https://pbs.twimg.com/media/photo.jpg?name=orig',
    finalUrl: 'https://pbs.twimg.com/media/photo.jpg?name=orig',
    referrer: 'https://private.example/secret',
    bytesReceived: 10,
    totalBytes: 10,
    exists: true,
  });
  const all = [item(1), item(2, 'n'.repeat(32)), item(3, extensionId)];
  vi.stubGlobal('chrome', {
    runtime: { id: extensionId },
    downloads: {
      search: async (query: { id?: number }) =>
        query.id === undefined ? all : all.filter((entry) => entry.id === query.id),
    },
  });
  try {
    const selected = await taskOwnedDownloadsDocument(extensionId);
    assert.deepEqual(
      selected.map(({ id }) => id),
      [3]
    );
    assert.deepEqual(Object.keys(selected[0] ?? {}).sort(), [
      'byExtensionId',
      'bytesReceived',
      'exists',
      'filename',
      'id',
      'state',
      'totalBytes',
    ]);
    assert.equal(
      await nativeSingleSourceMatchesDocument({
        id: 3,
        extensionId,
        expectedSource: item(3, extensionId).url,
      }),
      true
    );
    assert.equal(
      await nativeSingleSourceMatchesDocument({
        id: 2,
        extensionId,
        expectedSource: item(2, extensionId).url,
      }),
      false
    );
    await assert.rejects(
      () => taskOwnedDownloadsDocument('n'.repeat(32)),
      /owned extension origin/u
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

test('ambiguous and oversized task downloads fail without cancelling any ID', async () => {
  const extensionId = 'm'.repeat(32);
  let cancelled = 0;
  let items = [
    {
      id: 1,
      byExtensionId: extensionId,
      state: 'in_progress',
      filename: '/tmp/a',
      bytesReceived: 1,
      totalBytes: 10,
      exists: false,
    },
    {
      id: 2,
      byExtensionId: extensionId,
      state: 'in_progress',
      filename: '/tmp/b',
      bytesReceived: 1,
      totalBytes: 10,
      exists: false,
    },
  ];
  vi.stubGlobal('chrome', {
    runtime: { id: extensionId },
    downloads: {
      search: async () => items,
      cancel: async () => {
        cancelled += 1;
      },
    },
  });
  const page = {
    evaluate: async (callback: (value: string) => unknown, value: string) => callback(value),
  } as unknown as Page;
  try {
    await assert.rejects(
      () => waitForOwnedDownload(page, extensionId, new Set(), 100, []),
      /Ambiguous/u
    );
    items = [items[0]!];
    items[0] = { ...items[0]!, bytesReceived: 101 };
    await assert.rejects(
      () => waitForOwnedDownload(page, extensionId, new Set(), 100, []),
      /budget/u
    );
    assert.equal(cancelled, 0);
  } finally {
    vi.unstubAllGlobals();
  }
});

test('borrowed-browser task page close errors remain terminal', async () => {
  const page = {
    close: async () => {
      throw new Error('owned tab still open');
    },
  } as unknown as Page;
  await assert.rejects(() => closeObservedLivePage(page, true), /owned tab still open/u);
  await closeObservedLivePage(page, false);
});

test('canonical photo references require exact owned provider order and format', () => {
  const displays = [
    'https://pbs.twimg.com/media/PHOTO_one?format=webp&name=small',
    'https://pbs.twimg.com/media/PHOTO_two?format=webp&name=small',
  ];
  const media = [
    { id: '101', type: 'photo', poster: { host: 'pbs.twimg.com', path: '/media/PHOTO_one.jpg' } },
    { id: '102', type: 'photo', poster: { host: 'pbs.twimg.com', path: '/media/PHOTO_two.png' } },
  ];
  const entry = {
    operation: 'TweetResultByRestId',
    requestedTweetId: '123',
    httpStatus: 200,
    providerErrors: false,
    result: { id: '123', media },
  };
  assert.deepEqual(canonicalOwnedPhotoSources(displays, [entry], '123'), {
    mediaIds: ['101', '102'],
    sources: [
      'https://pbs.twimg.com/media/PHOTO_one.jpg?format=jpg&name=orig',
      'https://pbs.twimg.com/media/PHOTO_two.png?format=png&name=orig',
    ],
  });
  assert.throws(
    () =>
      canonicalOwnedPhotoSources(
        displays,
        [{ ...entry, result: { ...entry.result, id: 'other' } }],
        '123'
      ),
    /provider evidence is missing/u
  );
  assert.throws(
    () => canonicalOwnedPhotoSources(displays, [{ ...entry, httpStatus: 403 }], '123'),
    /provider evidence is missing/u
  );
  assert.throws(
    () =>
      canonicalOwnedPhotoSources(
        displays,
        [
          {
            ...entry,
            result: {
              ...entry.result,
              media: [
                { ...media[0]!, poster: { host: 'pbs.twimg.com', path: '/media/PHOTO_one' } },
                media[1]!,
              ],
            },
          },
        ],
        '123'
      ),
    /identity or order/u
  );
  assert.throws(
    () =>
      canonicalOwnedPhotoSources(
        displays,
        [{ ...entry, result: { ...entry.result, media: [media[1]!, media[0]!] } }],
        '123'
      ),
    /identity or order/u
  );
  assert.throws(
    () =>
      canonicalOwnedPhotoSources(
        displays,
        [
          {
            ...entry,
            result: { ...entry.result, media: [media[0]!, { ...media[1]!, id: '101' }] },
          },
        ],
        '123'
      ),
    /media ID duplicated/u
  );
  assert.throws(
    () =>
      canonicalOwnedPhotoSources(
        displays,
        [
          entry,
          {
            ...entry,
            result: { ...entry.result, media: [media[0]!, { ...media[1]!, id: '103' }] },
          },
        ],
        '123'
      ),
    /Conflicting/u
  );
});

test('direct-owned video requires a unique exact provider variant and an unmarked boundary', () => {
  const source = { host: 'video.twimg.com', path: '/amplify_video/123/vid/clip.mp4' };
  const media = (id: string) => ({
    id,
    type: 'video',
    poster: null,
    playableVariants: [source],
  });
  const entry = {
    operation: 'TweetResultByRestId',
    requestedTweetId: '123',
    httpStatus: 200,
    providerErrors: false,
    result: { id: '123', media: [media('video-1')] },
    directQuote: null,
    nestedQuoteId: null,
  };
  const direct = { quoteBoundary: 'unmarked-candidate', quoteStatusIds: [] };
  assert.deepEqual(directOwnerForSource([entry], '123', source, direct), {
    status: 'matched-direct-owner-variant',
    ownerId: '123',
    mediaId: 'video-1',
    mediaIndex: 0,
  });
  assert.equal(
    directOwnerForSource([entry, entry], '123', source, direct).status,
    'matched-direct-owner-variant'
  );
  assert.equal(
    directOwnerForSource(
      [entry, { ...entry, result: { ...entry.result, media: [media('conflicting-video')] } }],
      '123',
      source,
      direct
    ).status,
    'ambiguous-media'
  );
  assert.equal(
    directOwnerForSource(
      [{ ...entry, result: { ...entry.result, id: '456' } }],
      '123',
      source,
      direct
    ).status,
    'no-direct-owner-variant'
  );
  assert.equal(
    directOwnerForSource(
      [{ ...entry, result: { ...entry.result, media: [media('video-1'), media('video-2')] } }],
      '123',
      source,
      direct
    ).status,
    'ambiguous-media'
  );
  assert.equal(
    directOwnerForSource([entry], '123', source, {
      quoteBoundary: 'quoteTweet',
      quoteStatusIds: ['456'],
    }).status,
    'not-direct-owner-candidate'
  );
  assert.equal(
    directOwnerForSource([entry], '123', { ...source, path: '/other.mp4' }, direct).status,
    'no-direct-owner-variant'
  );
});

test('actual-site acceptance requires one exact ignored selector and an owned live lane', () => {
  assert.equal(parseActualSiteAcceptanceSelector(null, context), false);
  assert.equal(
    parseActualSiteAcceptanceSelector('{"scenario":"actual-site-acceptance"}', context),
    true
  );
  for (const text of [
    '{"scenario":"actual-site-acceptance","extra":true}',
    '{"scenario":"gallery-experience"}',
    '{}',
  ]) {
    assert.throws(() => parseActualSiteAcceptanceSelector(text, context));
  }
  assert.throws(() =>
    parseActualSiteAcceptanceSelector('{"scenario":"actual-site-acceptance"}', {
      ...context,
      liveUrls: [],
    })
  );
  assert.throws(() =>
    parseActualSiteAcceptanceSelector('{"scenario":"actual-site-acceptance"}', {
      ...context,
      installation: 'userscript',
    })
  );
  assert.throws(() =>
    parseActualSiteAcceptanceSelector('{"scenario":"actual-site-acceptance"}', {
      ...context,
      otherFocusedInput: true,
    })
  );
});

test('direct actual-site observation rejects an empty URL set before opening a browser', async () => {
  await assert.rejects(
    () =>
      observeLiveUrls({
        context: null as unknown as BrowserContext,
        extensionId: 'unused',
        liveUrls: [],
        output: 'unused',
        actualSiteAcceptance: { downloads: 'unused' },
      }),
    /requires at least one public status URL/u
  );
});

test('actual-site ZIP inspection admits two stored media and rejects unsafe entries', () => {
  const bytes = Buffer.from(STORED_ZIP_HEX, 'hex');
  assert.deepEqual(inspectLiveStoredZip(bytes, 2).entryOrder, ['first.txt', 'second.bin']);
  assert.throws(() => inspectLiveStoredZip(bytes, 3), /item count/u);
  const changed = Buffer.from(bytes);
  changed[40] = (changed[40] ?? 0) ^ 1;
  assert.throws(() => inspectLiveStoredZip(changed, 2));

  const unsafe = Buffer.from(bytes);
  unsafe.write('../bad.tx', 30, 'utf8');
  assert.throws(() => inspectLiveStoredZip(unsafe, 2), /unsafe/u);
});

test('each ZIP item and the single file match independent public originals', () => {
  const archive = inspectLiveStoredZip(Buffer.from(STORED_ZIP_HEX, 'hex'), 2);
  const single = Buffer.from('123456789');
  const second = Buffer.from([0, 1, 2, 255]);
  const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  const originals = [
    { bytes: single.length, sha256: sha256(single) },
    { bytes: second.length, sha256: sha256(second) },
  ];
  assert.doesNotThrow(() => verifyLiveArchiveSources(archive, originals, single, 0));
  assert.throws(() =>
    verifyLiveArchiveSources(
      archive,
      [{ ...originals[0]! }, { ...originals[1]!, sha256: sha256(Buffer.from('different')) }],
      single,
      0
    )
  );
  assert.throws(() => verifyLiveArchiveSources(archive, originals, Buffer.from('other'), 0));
});
