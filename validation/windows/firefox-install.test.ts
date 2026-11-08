// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdtemp, mkdir, open, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, vi } from 'vitest';
import {
  fixtureNetworkEvent,
  ownsBlockedIntercept,
  ownedNativeHistory,
  prepareFirefoxInstallation,
  readOwnedNativeBytes,
  readOwnedNativeFile,
  selectOwnedDownload,
  shouldContinueFirefoxOriginal,
  validateFirefoxSelectors,
} from './firefox-install.ts';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, open: vi.fn(actual.open) };
});

test('Firefox native originals continue to owned HTTPS transport instead of BiDi response', () => {
  assert(
    shouldContinueFirefoxOriginal(
      new URL('https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig')
    )
  );
  for (const value of [
    'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=large',
    'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=orig',
    'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig&extra=1',
    'https://pbs.twimg.com/media/foreign.jpg?format=jpg&name=orig',
    'https://example.org/media/GkE1234ABCDEF.jpg?format=jpg&name=orig',
  ]) {
    assert.equal(shouldContinueFirefoxOriginal(new URL(value)), false);
  }
});

test('Firefox BiDi fixture event serializer keeps unblocked requests and bounded correlation fields', () => {
  const event = fixtureNetworkEvent(
    'beforeRequestSent',
    {
      request: {
        request: 'native-42',
        url: 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig',
        destination: 'image',
        initiatorType: 'img',
      },
      context: null,
      userContext: 'profile-1',
      isBlocked: false,
      intercepts: ['fixture-intercept'],
      navigation: null,
    },
    123.5
  );
  assert.deepEqual(event, {
    event: 'beforeRequestSent',
    atMs: 123.5,
    requestId: 'native-42',
    url: 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig',
    context: null,
    userContext: 'profile-1',
    isBlocked: false,
    intercepts: ['fixture-intercept'],
    navigation: null,
    destination: 'image',
    initiatorType: 'img',
    status: undefined,
    error: undefined,
  });
  assert.equal(
    fixtureNetworkEvent(
      'beforeRequestSent',
      {
        request: { request: 'other', url: 'https://example.org/private' },
      },
      125
    ),
    null
  );
  const failed = fixtureNetworkEvent(
    'fetchError',
    {
      request: { request: 'native-42', url: event?.url ?? '' },
      errorText: 'NETWORK_FAILED'.repeat(40),
    },
    126
  );
  assert.equal(failed?.error?.length, 300);
});

test('Firefox native history reports only exact extension and original URL without absolute paths', () => {
  const original = 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig';
  const extensionId = 'xcom-enhanced-gallery@piesp.dev';
  const owned = {
    id: 7,
    byExtensionId: extensionId,
    filename: '/private/downloads/testuser_1234567890123456789_0.jpg',
    state: 'interrupted',
    error: 'NETWORK_FAILED',
    url: original,
    finalUrl: original,
    bytesReceived: 0,
    totalBytes: -1,
    mime: 'image/jpeg',
  };
  const observed = ownedNativeHistory(
    [
      { ...owned, id: 4, byExtensionId: 'foreign' },
      {
        ...owned,
        id: 5,
        url: 'https://pbs.twimg.com/other',
        finalUrl: 'https://pbs.twimg.com/other',
      },
      owned,
    ],
    extensionId
  );
  assert.equal(observed.length, 1);
  assert.equal(observed[0]?.id, 7);
  assert.equal(observed[0]?.error, 'NETWORK_FAILED');
  assert.equal(observed[0]?.basename, 'testuser_1234567890123456789_0.jpg');
  assert(!JSON.stringify(observed).includes('/private/downloads'));
});

test('Firefox response fulfillment belongs to the blocked task intercept', () => {
  assert.equal(ownsBlockedIntercept({ isBlocked: true, intercepts: ['owned'] }, 'owned'), true);
  assert.equal(ownsBlockedIntercept({ isBlocked: false, intercepts: ['owned'] }, 'owned'), false);
  assert.equal(ownsBlockedIntercept({ isBlocked: true, intercepts: ['foreign'] }, 'owned'), false);
  assert.equal(ownsBlockedIntercept({ isBlocked: true }, 'owned'), false);
});

test('Firefox native ID selection requires one new completed extension-owned original', () => {
  const original = 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig';
  const before = [
    { id: 3, byExtensionId: 'foreign', state: 'complete', filename: 'old.jpg', url: original },
  ];
  const owned = {
    id: 4,
    byExtensionId: 'xcom-enhanced-gallery@piesp.dev',
    state: 'complete',
    filename: 'new.jpg',
    url: original,
  };
  assert.equal(selectOwnedDownload(before, [...before, owned], owned.byExtensionId), owned);
  assert.throws(() =>
    selectOwnedDownload(
      before,
      [...before, { ...owned, byExtensionId: 'foreign' }],
      owned.byExtensionId
    )
  );
  assert.throws(() =>
    selectOwnedDownload(
      before,
      [...before, { ...owned, state: 'interrupted' }],
      owned.byExtensionId
    )
  );
  assert.throws(() =>
    selectOwnedDownload(before, [...before, owned, { ...owned, id: 5 }], owned.byExtensionId)
  );
});

test('Firefox native bytes must stay under owned directory and match original before retention', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-firefox-native-test-'));
  try {
    const downloads = join(root, 'downloads');
    await mkdir(downloads);
    const native = join(downloads, 'image.jpg');
    const bytes = Buffer.from('expected original JPEG bytes');
    await writeFile(native, bytes);
    const result = await readOwnedNativeFile(downloads, native, bytes);
    assert.equal(result.basename, 'image.jpg');
    assert.equal(result.bytes, bytes.length);
    await assert.rejects(readOwnedNativeFile(downloads, native, Buffer.from('wrong')));
    const foreign = join(root, 'foreign.jpg');
    await writeFile(foreign, bytes);
    await assert.rejects(readOwnedNativeFile(downloads, foreign, bytes));
    await symlink(foreign, join(downloads, 'linked.jpg'));
    await assert.rejects(readOwnedNativeFile(downloads, join(downloads, 'linked.jpg'), bytes));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Firefox failure retention rejects oversized files and links within the owned directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-firefox-retention-test-'));
  try {
    const native = join(root, 'original.jpg');
    const bytes = Buffer.from('native original bytes');
    await writeFile(native, bytes);
    assert.deepEqual((await readOwnedNativeBytes(root, native, bytes.length)).bytes, bytes);
    await assert.rejects(readOwnedNativeBytes(root, native, bytes.length - 1), /bounded read/);
    const link = join(root, 'linked.jpg');
    await symlink(native, link);
    await assert.rejects(readOwnedNativeBytes(root, link, bytes.length), /regular file/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Firefox rejects a path replaced after open before reading or retaining any bytes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-firefox-replacement-test-'));
  try {
    const native = join(root, 'original.jpg');
    const bytes = Buffer.from('native original bytes');
    await writeFile(native, bytes);
    const handle = await open(native, 'r');
    const read = vi.spyOn(handle, 'read');
    const close = vi.spyOn(handle, 'close');
    vi.mocked(open).mockImplementationOnce(async () => {
      await rename(native, join(root, 'old-original.jpg'));
      await writeFile(native, bytes);
      return handle;
    });
    await assert.rejects(readOwnedNativeBytes(root, native, bytes.length), /identity changed/);
    assert.equal(read.mock.calls.length, 0);
    assert.equal(close.mock.calls.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Firefox install copy retains every production byte and isolates diagnostic page', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-firefox-copy-test-'));
  try {
    const source = join(root, 'source');
    const output = join(root, 'output');
    await mkdir(source);
    await mkdir(output);
    await writeFile(join(source, 'manifest.json'), '{"name":"fixture"}\n');
    await writeFile(join(source, 'background.js'), 'production bytes\n');
    const prepared = await prepareFirefoxInstallation(source, output);
    assert.deepEqual(
      await readFile(join(prepared.copy, 'background.js')),
      await readFile(join(source, 'background.js'))
    );
    assert.equal(
      await readFile(join(source, 'firefox-download-diagnostic.html')).catch(() => null),
      null
    );
    assert.equal(Object.keys(prepared.sourceInventory).length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Firefox selector gate accepts exact isolated filename or native UI input', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-firefox-selector-test-'));
  try {
    assert.equal(await validateFirefoxSelectors(root), 'default');
    const inputs = join(root, 'validation/windows/inputs');
    await mkdir(inputs, { recursive: true });
    await writeFile(
      join(inputs, 'attachment-filenames.json'),
      '{"scenario":"attachment-filenames"}\n'
    );
    assert.equal(await validateFirefoxSelectors(root), 'attachment-filenames');
    await rm(join(inputs, 'attachment-filenames.json'));
    await writeFile(join(inputs, 'native-browser-ui.json'), '{"scenario":"native-browser-ui"}\n');
    assert.equal(await validateFirefoxSelectors(root), 'native-browser-ui');
    await writeFile(
      join(inputs, 'native-browser-ui.json'),
      '{"scenario":"native-browser-ui","extra":true}\n'
    );
    await assert.rejects(validateFirefoxSelectors(root), /unsupported options/u);
    await rm(join(inputs, 'native-browser-ui.json'));
    await writeFile(
      join(inputs, 'attachment-filenames.json'),
      '{"scenario":"attachment-filenames"}\n'
    );
    await writeFile(join(inputs, 'gallery-experience.json'), '{"scenario":"gallery-experience"}\n');
    await assert.rejects(validateFirefoxSelectors(root));
    await rm(join(inputs, 'gallery-experience.json'));
    await writeFile(
      join(inputs, 'attachment-filenames.json'),
      '{"scenario":"attachment-filenames","diagnosticOnly":true}\n'
    );
    await assert.rejects(validateFirefoxSelectors(root));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
