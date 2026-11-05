// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';
import {
  prepareFirefoxInstallation,
  readOwnedNativeFile,
  selectOwnedDownload,
  validateFirefoxSelectors,
} from './firefox-install.ts';

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

test('Firefox selector gate accepts only the implemented isolated filename input', async () => {
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
