// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'vite-plus/test';
import type { BrowserContext } from '@playwright/test';
import { directOwnerForSource, observeLiveUrls } from './live-page.ts';
import {
  inspectLiveStoredZip,
  parseActualSiteAcceptanceSelector,
  verifyLiveArchiveSources,
} from './live-acceptance.ts';

const STORED_ZIP_HEX =
  '504b0304140000080000000000002639f4cb09000000090000000900000066697273742e747874313233343536373839504b0304140000080000000000002438b23f04000000040000000a0000007365636f6e642e62696e000102ff504b01021400140000080000000000002639f4cb090000000900000009000000000000000000000000000000000066697273742e747874504b01021400140000080000000000002438b23f04000000040000000a00000000000000000000000000300000007365636f6e642e62696e504b050600000000020002006f0000005c0000000000';

const context = {
  liveUrls: ['https://x.com/NASA/status/2041557036274475228'],
  installation: 'extension',
  otherFocusedInput: false,
};

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
