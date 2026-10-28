// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { test } from 'vite-plus/test';
import { inspectLiveStoredZip, parseActualSiteAcceptanceSelector } from './live-acceptance.ts';

const STORED_ZIP_HEX =
  '504b0304140000080000000000002639f4cb09000000090000000900000066697273742e747874313233343536373839504b0304140000080000000000002438b23f04000000040000000a0000007365636f6e642e62696e000102ff504b01021400140000080000000000002639f4cb090000000900000009000000000000000000000000000000000066697273742e747874504b01021400140000080000000000002438b23f04000000040000000a00000000000000000000000000300000007365636f6e642e62696e504b050600000000020002006f0000005c0000000000';

const context = {
  liveUrls: ['https://x.com/NASA/status/2041557036274475228'],
  installation: 'extension',
  otherFocusedInput: false,
};

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
