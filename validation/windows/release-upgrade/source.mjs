// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const DIRECTORY = 'validation/windows/release-upgrade';
const USER_PATH = `${DIRECTORY}/v2.3.5.user.js`;
const EXTENSION_PATH = `${DIRECTORY}/v2.3.5-extension`;
const CANDIDATE_USER_PATH = 'dist/xcom-enhanced-gallery.user.js';

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function userscriptVersion(bytes) {
  const header = bytes.toString('utf8').split('// ==/UserScript==', 1)[0];
  const matches = [...header.matchAll(/^\/\/ @version ([0-9]+\.[0-9]+\.[0-9]+)$/gmu)];
  assert.equal(matches.length, 1, 'Expected exactly one userscript metadata version');
  return matches[0][1];
}

async function inventory(root) {
  const entries = [];
  async function visit(directory) {
    for (const child of (await readdir(directory)).sort()) {
      const path = join(directory, child);
      const info = await lstat(path);
      assert(!info.isSymbolicLink(), 'Upgrade extension contains a symlink');
      if (info.isDirectory()) {
        await visit(path);
      } else {
        assert(info.isFile(), 'Upgrade extension contains a special file');
        entries.push(
          `${relative(root, path).replaceAll('\\', '/')} ${sha256(await readFile(path))}`
        );
      }
    }
  }
  await visit(root);
  assert(entries.length > 0 && entries.length <= 100, 'Unexpected upgrade extension inventory');
  return sha256(Buffer.from(`${entries.join('\n')}\n`));
}

function fixedPath(root, value, expected) {
  assert.equal(value, expected, 'Upgrade input must use the declared asset path');
  const path = resolve(root, value);
  assert.equal(relative(resolve(root), path).replaceAll('\\', '/'), expected);
  return path;
}

export async function readUpgradeInput(root) {
  const path = join(root, DIRECTORY, 'input.json');
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
  const value = JSON.parse(raw);
  assert.deepEqual(Object.keys(value).sort(), [
    'candidateVersion',
    'previousExtension',
    'previousUserscript',
    'previousVersion',
    'schema',
  ]);
  assert.equal(value.schema, 1);
  assert.equal(value.previousVersion, '2.3.5');
  assert.equal(value.candidateVersion, '2.3.6');
  assert.deepEqual(Object.keys(value.previousUserscript).sort(), ['path', 'sha256', 'url']);
  assert.deepEqual(Object.keys(value.previousExtension).sort(), ['inventorySha256', 'path', 'url']);
  assert.equal(
    value.previousUserscript.url,
    'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.5/xcom-enhanced-gallery.user.js'
  );
  assert.equal(
    value.previousExtension.url,
    'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.5/xcom-enhanced-gallery-chrome.zip'
  );
  const userPath = fixedPath(root, value.previousUserscript.path, USER_PATH);
  const extensionPath = fixedPath(root, value.previousExtension.path, EXTENSION_PATH);
  assert.match(value.previousUserscript.sha256, /^[0-9a-f]{64}$/u);
  assert.match(value.previousExtension.inventorySha256, /^[0-9a-f]{64}$/u);
  const previous = await readFile(userPath);
  assert.equal(
    sha256(previous),
    value.previousUserscript.sha256,
    'Public userscript hash mismatch'
  );
  assert.equal(userscriptVersion(previous), value.previousVersion);
  assert.equal(
    await inventory(extensionPath),
    value.previousExtension.inventorySha256,
    'Public extension inventory mismatch'
  );
  const publicManifest = JSON.parse(await readFile(join(extensionPath, 'manifest.json'), 'utf8'));
  assert.equal(publicManifest.version, value.previousVersion);
  const candidate = await readFile(join(root, CANDIDATE_USER_PATH));
  assert.equal(userscriptVersion(candidate), value.candidateVersion);
  const candidateManifest = JSON.parse(
    await readFile(join(root, 'dist-extension/manifest.json'), 'utf8')
  );
  assert.equal(candidateManifest.version, value.candidateVersion);
  return {
    ...value,
    previousUserPath: userPath,
    previousExtensionPath: extensionPath,
    previousExtensionInventorySha256: value.previousExtension.inventorySha256,
    candidateUserSha256: sha256(candidate),
    candidateExtensionInventorySha256: await inventory(join(root, 'dist-extension')),
  };
}

export { inventory as extensionInventorySha256 };
