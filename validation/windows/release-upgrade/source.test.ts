// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { BigIntStats } from 'node:fs';
import { mkdir, mkdtemp, open, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  extensionInventorySha256,
  hashInventoryFile,
  readUpgradeInput,
  requireManagerEditorSource,
  sha256,
  userscriptVersion,
} from './source.ts';

const script = (version: string) =>
  [
    '// ==UserScript==',
    '// @name X.com Enhanced Gallery',
    '// @namespace https://github.com/PiesP/xcom-enhanced-gallery',
    `// @version ${version}`,
    '// @updateURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.meta.js',
    `// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/${version === '2.3.6' ? 'download/v2.3.6' : 'latest/download'}/xcom-enhanced-gallery.user.js`,
    '// ==/UserScript==',
    '',
  ].join('\n');

test('inventory reads the inspected file handle and rejects a replacement', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-upgrade-inventory-'));
  const file = join(root, 'content.js');
  const replacementPath = join(root, 'replacement.js');
  try {
    const original = Buffer.from('original content');
    await writeFile(file, original);
    await writeFile(replacementPath, 'replacement content is different');
    const originalHandle = await open(file, 'r');
    let inspected: BigIntStats;
    try {
      inspected = await originalHandle.stat({ bigint: true });
    } finally {
      await originalHandle.close();
    }
    assert.equal(await hashInventoryFile(file, inspected), sha256(original));
    await rm(file);
    await rename(replacementPath, file);
    await assert.rejects(hashInventoryFile(file, inspected), /changed since inspection/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('upgrade inputs require the public asset hash, fixed paths and candidate versions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-upgrade-input-'));
  try {
    assert.equal(await readUpgradeInput(root), null);
    const assets = join(root, 'validation/windows/release-upgrade');
    const extension = join(assets, 'v2.3.6-extension');
    await mkdir(extension, { recursive: true });
    await mkdir(join(root, 'dist'), { recursive: true });
    await mkdir(join(root, 'dist-extension'), { recursive: true });
    const publicUser = script('2.3.6');
    await writeFile(join(assets, 'v2.3.6.user.js'), publicUser);
    await writeFile(join(extension, 'manifest.json'), JSON.stringify({ version: '2.3.6' }));
    await writeFile(join(root, 'dist/xcom-enhanced-gallery.user.js'), script('2.3.7'));
    await writeFile(
      join(root, 'dist-extension/manifest.json'),
      JSON.stringify({ version: '2.3.7' })
    );
    const input = {
      schema: 1,
      previousVersion: '2.3.6',
      candidateVersion: '2.3.7',
      previousUserscript: {
        path: 'validation/windows/release-upgrade/v2.3.6.user.js',
        sha256: sha256(Buffer.from(publicUser)),
        url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.6/xcom-enhanced-gallery.user.js',
      },
      previousExtension: {
        path: 'validation/windows/release-upgrade/v2.3.6-extension',
        inventorySha256: await extensionInventorySha256(extension),
        url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.6/xcom-enhanced-gallery-chrome.zip',
      },
    };
    const inputPath = join(assets, 'input.json');
    await writeFile(inputPath, JSON.stringify(input));
    const accepted = await readUpgradeInput(root);
    assert(accepted, 'Upgrade input must be available');
    assert.equal(accepted.candidateUserSha256, sha256(Buffer.from(script('2.3.7'))));
    const pinnedCandidate = script('2.3.7').replace(
      '/releases/latest/download/xcom-enhanced-gallery.user.js',
      '/releases/download/v2.3.7/xcom-enhanced-gallery.user.js'
    );
    await writeFile(join(root, 'dist/xcom-enhanced-gallery.user.js'), pinnedCandidate);
    await assert.rejects(readUpgradeInput(root), /Manager editor download URL changed/u);
    await writeFile(join(root, 'dist/xcom-enhanced-gallery.user.js'), script('2.3.7'));
    await writeFile(
      inputPath,
      JSON.stringify({
        ...input,
        previousUserscript: {
          ...input.previousUserscript,
          sha256: '0'.repeat(64),
        },
      })
    );
    await assert.rejects(readUpgradeInput(root), /Public userscript hash mismatch/u);
    await writeFile(
      inputPath,
      JSON.stringify({
        ...input,
        previousUserscript: {
          ...input.previousUserscript,
          path: '../other.user.js',
        },
      })
    );
    await assert.rejects(readUpgradeInput(root), /declared asset path/u);
    await writeFile(inputPath, JSON.stringify(input));
    await writeFile(
      join(root, 'dist-extension/manifest.json'),
      JSON.stringify({ version: '2.3.8' })
    );
    await assert.rejects(readUpgradeInput(root), /2\.3\.8.*2\.3\.7/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('userscript version parser fails on ambiguous metadata', () => {
  assert.equal(userscriptVersion(Buffer.from(script('2.3.6'))), '2.3.6');
  assert.throws(
    () =>
      userscriptVersion(
        Buffer.from(
          script('2.3.6').replace('// ==/UserScript==', '// @version 2.3.4\n// ==/UserScript==')
        )
      ),
    /exactly one/u
  );
});

test('manager editor readback requires exact bytes and stable script identity', () => {
  const source = [
    '// ==UserScript==',
    '// @name X.com Enhanced Gallery',
    '// @namespace https://github.com/PiesP/xcom-enhanced-gallery',
    '// @version 2.3.7',
    '// @updateURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.meta.js',
    '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js',
    '// ==/UserScript==',
    'const observable = true;',
    '',
  ].join('\n');
  const expectedSha256 = sha256(Buffer.from(source));
  assert.equal(
    requireManagerEditorSource(source, expectedSha256, '2.3.7').editorSha256,
    expectedSha256
  );
  assert.throws(
    () => requireManagerEditorSource(undefined, expectedSha256, '2.3.7'),
    /source is unavailable/u
  );
  assert.throws(
    () => requireManagerEditorSource(`${source}// extra`, expectedSha256, '2.3.7'),
    /bytes differ/u
  );
  const wrongUpdate = source.replace('/releases/latest/download/', '/releases/other/download/');
  assert.throws(
    () => requireManagerEditorSource(wrongUpdate, sha256(Buffer.from(wrongUpdate)), '2.3.7'),
    /update URL changed/u
  );
  const pinnedDownload = source.replace(
    '/releases/latest/download/xcom-enhanced-gallery.user.js',
    '/releases/download/v2.3.7/xcom-enhanced-gallery.user.js'
  );
  assert.throws(
    () => requireManagerEditorSource(pinnedDownload, sha256(Buffer.from(pinnedDownload)), '2.3.7'),
    /download URL changed/u
  );
  assert.equal(
    requireManagerEditorSource(script('2.3.6'), sha256(Buffer.from(script('2.3.6'))), '2.3.6')
      .version,
    '2.3.6'
  );
});
