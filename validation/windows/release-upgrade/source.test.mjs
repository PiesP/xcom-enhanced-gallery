// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  extensionInventorySha256,
  readUpgradeInput,
  requireManagerEditorSource,
  sha256,
  userscriptVersion,
} from './source.mjs';

const prefix = '// ==UserScript==\n// @name X.com Enhanced Gallery\n// @version ';
const script = (version) => `${prefix}${version}\n// ==/UserScript==\n`;

test('upgrade inputs require the public asset hash, fixed paths and candidate versions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-upgrade-input-'));
  try {
    assert.equal(await readUpgradeInput(root), null);
    const assets = join(root, 'validation/windows/release-upgrade');
    const extension = join(assets, 'v2.3.5-extension');
    await mkdir(extension, { recursive: true });
    await mkdir(join(root, 'dist'), { recursive: true });
    await mkdir(join(root, 'dist-extension'), { recursive: true });
    const publicUser = script('2.3.5');
    await writeFile(join(assets, 'v2.3.5.user.js'), publicUser);
    await writeFile(join(extension, 'manifest.json'), JSON.stringify({ version: '2.3.5' }));
    await writeFile(join(root, 'dist/xcom-enhanced-gallery.user.js'), script('2.3.6'));
    await writeFile(
      join(root, 'dist-extension/manifest.json'),
      JSON.stringify({ version: '2.3.6' })
    );
    const input = {
      schema: 1,
      previousVersion: '2.3.5',
      candidateVersion: '2.3.6',
      previousUserscript: {
        path: 'validation/windows/release-upgrade/v2.3.5.user.js',
        sha256: sha256(Buffer.from(publicUser)),
        url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.5/xcom-enhanced-gallery.user.js',
      },
      previousExtension: {
        path: 'validation/windows/release-upgrade/v2.3.5-extension',
        inventorySha256: await extensionInventorySha256(extension),
        url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.5/xcom-enhanced-gallery-chrome.zip',
      },
    };
    const inputPath = join(assets, 'input.json');
    await writeFile(inputPath, JSON.stringify(input));
    const accepted = await readUpgradeInput(root);
    assert.equal(accepted.candidateUserSha256, sha256(Buffer.from(script('2.3.6'))));
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
      JSON.stringify({ version: '2.3.7' })
    );
    await assert.rejects(readUpgradeInput(root), /2\.3\.7.*2\.3\.6/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('userscript version parser fails on ambiguous metadata', () => {
  assert.equal(userscriptVersion(Buffer.from(script('2.3.5'))), '2.3.5');
  assert.throws(
    () =>
      userscriptVersion(
        Buffer.from(
          script('2.3.5').replace('// ==/UserScript==', '// @version 2.3.4\n// ==/UserScript==')
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
    '// @version 2.3.6',
    '// @updateURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.meta.js',
    '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.6/xcom-enhanced-gallery.user.js',
    '// ==/UserScript==',
    'const observable = true;',
    '',
  ].join('\n');
  const expectedSha256 = sha256(Buffer.from(source));
  assert.equal(
    requireManagerEditorSource(source, expectedSha256, '2.3.6').editorSha256,
    expectedSha256
  );
  assert.throws(
    () => requireManagerEditorSource(undefined, expectedSha256, '2.3.6'),
    /source is unavailable/u
  );
  assert.throws(
    () => requireManagerEditorSource(`${source}// extra`, expectedSha256, '2.3.6'),
    /bytes differ/u
  );
  const wrongUpdate = source.replace('/releases/latest/download/', '/releases/other/download/');
  assert.throws(
    () => requireManagerEditorSource(wrongUpdate, sha256(Buffer.from(wrongUpdate)), '2.3.6'),
    /update URL changed/u
  );
});
