// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { BigIntStats } from 'node:fs';
import { cp, mkdir, mkdtemp, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  extensionInventorySha256,
  hashInventoryFile,
  readSameVersionInput,
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
    '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js',
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
    const extension = join(assets, 'v2.3.7-extension');
    await mkdir(extension, { recursive: true });
    await mkdir(join(root, 'dist'), { recursive: true });
    await mkdir(join(root, 'dist-extension'), { recursive: true });
    const publicUser = script('2.3.7');
    await writeFile(join(assets, 'v2.3.7.user.js'), publicUser);
    await writeFile(join(extension, 'manifest.json'), JSON.stringify({ version: '2.3.7' }));
    await writeFile(join(root, 'dist/xcom-enhanced-gallery.user.js'), script('2.3.8'));
    await writeFile(
      join(root, 'dist-extension/manifest.json'),
      JSON.stringify({ version: '2.3.8' })
    );
    const input = {
      schema: 1,
      previousVersion: '2.3.7',
      candidateVersion: '2.3.8',
      previousUserscript: {
        path: 'validation/windows/release-upgrade/v2.3.7.user.js',
        sha256: sha256(Buffer.from(publicUser)),
        url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.7/xcom-enhanced-gallery.user.js',
      },
      previousExtension: {
        path: 'validation/windows/release-upgrade/v2.3.7-extension',
        inventorySha256: await extensionInventorySha256(extension),
        url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.7/xcom-enhanced-gallery-chrome.zip',
      },
    };
    const inputPath = join(assets, 'input.json');
    await writeFile(inputPath, JSON.stringify(input));
    const accepted = await readUpgradeInput(root);
    assert(accepted, 'Upgrade input must be available');
    assert.equal(accepted.candidateUserSha256, sha256(Buffer.from(script('2.3.8'))));
    for (const [changed, error] of [
      [{ ...input, previousVersion: '2.3.6' }, /2\.3\.6/u],
      [{ ...input, candidateVersion: '2.3.7' }, /2\.3\.7/u],
      [
        {
          ...input,
          previousUserscript: {
            ...input.previousUserscript,
            url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js',
          },
        },
        /releases\/latest\/download/u,
      ],
      [
        {
          ...input,
          previousExtension: {
            ...input.previousExtension,
            url: 'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.6/xcom-enhanced-gallery-chrome.zip',
          },
        },
        /releases\/download\/v2\.3\.6/u,
      ],
    ] as const) {
      await writeFile(inputPath, JSON.stringify(changed));
      await assert.rejects(readUpgradeInput(root), error);
    }
    await writeFile(inputPath, JSON.stringify(input));
    const pinnedPublic = publicUser.replace(
      '/releases/latest/download/xcom-enhanced-gallery.user.js',
      '/releases/download/v2.3.7/xcom-enhanced-gallery.user.js'
    );
    await writeFile(join(assets, 'v2.3.7.user.js'), pinnedPublic);
    await writeFile(
      inputPath,
      JSON.stringify({
        ...input,
        previousUserscript: {
          ...input.previousUserscript,
          sha256: sha256(Buffer.from(pinnedPublic)),
        },
      })
    );
    await assert.rejects(readUpgradeInput(root), /Manager editor download URL changed/u);
    await writeFile(join(assets, 'v2.3.7.user.js'), publicUser);
    await writeFile(inputPath, JSON.stringify(input));
    const pinnedCandidate = script('2.3.8').replace(
      '/releases/latest/download/xcom-enhanced-gallery.user.js',
      '/releases/download/v2.3.8/xcom-enhanced-gallery.user.js'
    );
    await writeFile(join(root, 'dist/xcom-enhanced-gallery.user.js'), pinnedCandidate);
    await assert.rejects(readUpgradeInput(root), /Manager editor download URL changed/u);
    await writeFile(join(root, 'dist/xcom-enhanced-gallery.user.js'), script('2.3.8'));
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
        previousExtension: {
          ...input.previousExtension,
          inventorySha256: '0'.repeat(64),
        },
      })
    );
    await assert.rejects(readUpgradeInput(root), /Public extension inventory mismatch/u);
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
      JSON.stringify({ version: '2.3.9' })
    );
    await assert.rejects(readUpgradeInput(root), /2\.3\.9/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('same-version attribution is absent by default and rejects changed identities and paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-same-version-input-'));
  try {
    assert.equal(await readSameVersionInput(root), null);
    const assets = join(root, 'validation/windows/release-upgrade');
    await mkdir(assets, { recursive: true });
    await writeFile(
      join(root, 'bundle.json'),
      JSON.stringify({
        project: 'xcom-enhanced-gallery',
        profile: 'xeg-gallery',
        installation: 'extension',
        source_sha: 'a'.repeat(40),
        core_sha: '588dce5dce2a79c2ed926626b5c97824d63a5203',
      })
    );
    const input = {
      schema: 1,
      role: 'public',
      version: '2.3.8',
      sourceSha: '8a410efb02837933f8e4798ddcc2501b502c4005',
      coreSha: '77d30da018089be7e2a5e3b2197a200890547aee',
      extension: {
        path: 'validation/windows/release-upgrade/same-version-public-extension',
        inventorySha256: '7aeb360ea63d1604e1ad236553245645fb20d171ca5e81fb83e58e16ca05553d',
        contentSha256: 'ccf18442db7bcac5276346a5537fcfb36d6ad78b57cb23a500035586b5aceb04',
      },
    };
    const path = join(assets, 'same-version-input.json');
    for (const [changed, error] of [
      [{ ...input, version: '2.3.7' }, /2\.3\.7/u],
      [{ ...input, role: 'unknown' }, /value\.role/u],
      [{ ...input, sourceSha: '0'.repeat(40) }, /historical source/u],
      [{ ...input, extension: { ...input.extension, path: '../other' } }, /asset path/u],
      [
        { ...input, extension: { ...input.extension, contentSha256: '0'.repeat(64) } },
        /content source/u,
      ],
      [{ ...input, extra: true }, /extra/u],
      [
        {
          ...input,
          role: 'candidate',
          sourceSha: 'b'.repeat(40),
          coreSha: '588dce5dce2a79c2ed926626b5c97824d63a5203',
          extension: {
            path: 'dist-extension',
            inventorySha256: 'c7c3e6140b7f37eff302950282464187bf1e1c2c39498ede074c67b835ad6afa',
            contentSha256: 'cee3872d0a5d929d56909cb801c4680090ea39d641939610d59d0c6acd156b2e',
          },
        },
        /current bundle/u,
      ],
    ] as const) {
      await writeFile(path, JSON.stringify(changed));
      await assert.rejects(readSameVersionInput(root), error);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('same-version candidate requires the pinned complete extension inventory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-same-version-candidate-'));
  const extension = join(root, 'dist-extension');
  const inputPath = join(root, 'validation/windows/release-upgrade/same-version-input.json');
  try {
    await cp(resolve(import.meta.dirname, '../../../dist-extension'), extension, {
      recursive: true,
    });
    const originalInventory = await extensionInventorySha256(extension);
    const background = join(extension, 'background.js');
    const backgroundBytes = await readFile(background);
    await rm(background);
    assert.notEqual(await extensionInventorySha256(extension), originalInventory);
    await writeFile(background, backgroundBytes);
    const unexpected = join(extension, 'unexpected.txt');
    await writeFile(unexpected, 'unexpected file');
    assert.notEqual(await extensionInventorySha256(extension), originalInventory);
    await rm(unexpected);
    assert.equal(await extensionInventorySha256(extension), originalInventory);
    await mkdir(join(root, 'validation/windows/release-upgrade'), { recursive: true });
    await writeFile(
      join(root, 'bundle.json'),
      JSON.stringify({
        project: 'xcom-enhanced-gallery',
        profile: 'xeg-gallery',
        installation: 'extension',
        source_sha: 'a'.repeat(40),
        core_sha: '588dce5dce2a79c2ed926626b5c97824d63a5203',
      })
    );
    const input = {
      schema: 1,
      role: 'candidate',
      version: '2.3.8',
      sourceSha: 'a'.repeat(40),
      coreSha: '588dce5dce2a79c2ed926626b5c97824d63a5203',
      extension: {
        path: 'dist-extension',
        inventorySha256: originalInventory,
        contentSha256: sha256(await readFile(join(extension, 'content.js'))),
      },
    };
    await writeFile(inputPath, JSON.stringify(input));
    // The pinned same-version candidate is a historical artifact, not this build.
    await assert.rejects(readSameVersionInput(root), /extension inventory is mismatched/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('userscript version parser fails on ambiguous metadata', () => {
  assert.equal(userscriptVersion(Buffer.from(script('2.3.7'))), '2.3.7');
  assert.throws(
    () =>
      userscriptVersion(
        Buffer.from(
          script('2.3.7').replace('// ==/UserScript==', '// @version 2.3.4\n// ==/UserScript==')
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
    '// @version 2.3.8',
    '// @updateURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.meta.js',
    '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js',
    '// ==/UserScript==',
    'const observable = true;',
    '',
  ].join('\n');
  const expectedSha256 = sha256(Buffer.from(source));
  assert.equal(
    requireManagerEditorSource(source, expectedSha256, '2.3.8').editorSha256,
    expectedSha256
  );
  assert.throws(
    () => requireManagerEditorSource(undefined, expectedSha256, '2.3.8'),
    /source is unavailable/u
  );
  assert.throws(
    () => requireManagerEditorSource(`${source}// extra`, expectedSha256, '2.3.8'),
    /bytes differ/u
  );
  const wrongUpdate = source.replace('/releases/latest/download/', '/releases/other/download/');
  assert.throws(
    () => requireManagerEditorSource(wrongUpdate, sha256(Buffer.from(wrongUpdate)), '2.3.8'),
    /update URL changed/u
  );
  const pinnedDownload = source.replace(
    '/releases/latest/download/xcom-enhanced-gallery.user.js',
    '/releases/download/v2.3.8/xcom-enhanced-gallery.user.js'
  );
  assert.throws(
    () => requireManagerEditorSource(pinnedDownload, sha256(Buffer.from(pinnedDownload)), '2.3.8'),
    /download URL changed/u
  );
  assert.equal(
    requireManagerEditorSource(script('2.3.7'), sha256(Buffer.from(script('2.3.7'))), '2.3.7')
      .version,
    '2.3.7'
  );
});
