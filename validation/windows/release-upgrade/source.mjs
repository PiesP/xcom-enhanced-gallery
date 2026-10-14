// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const DIRECTORY = 'validation/windows/release-upgrade';
const USER_PATH = `${DIRECTORY}/v2.3.5.user.js`;
const EXTENSION_PATH = `${DIRECTORY}/v2.3.5-extension`;
const CANDIDATE_USER_PATH = 'dist/xcom-enhanced-gallery.user.js';
const SCRIPT_NAME = 'X.com Enhanced Gallery';
const SCRIPT_NAMESPACE = 'https://github.com/PiesP/xcom-enhanced-gallery';
const SCRIPT_UPDATE_URL = `${SCRIPT_NAMESPACE}/releases/latest/download/xcom-enhanced-gallery.meta.js`;
const MAX_MANAGER_EDITOR_BYTES = 4 * 1024 * 1024;

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function userscriptVersion(bytes) {
  const header = bytes.toString('utf8').split('// ==/UserScript==', 1)[0];
  const matches = [...header.matchAll(/^\/\/ @version ([0-9]+\.[0-9]+\.[0-9]+)$/gmu)];
  assert.equal(matches.length, 1, 'Expected exactly one userscript metadata version');
  return matches[0][1];
}

/** Inspect bytes returned by the manager's visible script editor, not its storage API. */
export function requireManagerEditorSource(source, expectedSha256, version) {
  assert(typeof source === 'string' && source.length > 0, 'Manager editor source is unavailable');
  const bytes = Buffer.from(source, 'utf8');
  assert(bytes.length <= MAX_MANAGER_EDITOR_BYTES, 'Manager editor source exceeds bounded size');
  const observedSha256 = sha256(bytes);
  assert.equal(observedSha256, expectedSha256, 'Manager editor bytes differ from imported file');
  const header = /^\/\/ ==UserScript==\r?\n([\s\S]*?)^\/\/ ==\/UserScript==/mu.exec(source);
  assert(header, 'Manager editor metadata header is missing');
  const fields = new Map();
  for (const line of header[1].split(/\r?\n/u)) {
    const match = /^\/\/\s+@([A-Za-z-]+)\s+(.+)$/u.exec(line);
    if (!match) {
      continue;
    }
    const values = fields.get(match[1]) ?? [];
    values.push(match[2].trim());
    fields.set(match[1], values);
  }
  const exactlyOne = (key) => {
    const values = fields.get(key) ?? [];
    assert.equal(values.length, 1, `Manager editor requires one @${key}`);
    return values[0];
  };
  assert.equal(exactlyOne('name'), SCRIPT_NAME, 'Manager editor script name changed');
  assert.equal(exactlyOne('namespace'), SCRIPT_NAMESPACE, 'Manager editor namespace changed');
  assert.equal(exactlyOne('version'), version, 'Manager editor version changed');
  assert.equal(exactlyOne('updateURL'), SCRIPT_UPDATE_URL, 'Manager editor update URL changed');
  assert.equal(
    exactlyOne('downloadURL'),
    `${SCRIPT_NAMESPACE}/releases/download/v${version}/xcom-enhanced-gallery.user.js`,
    'Manager editor download URL changed'
  );
  return {
    editorSha256: observedSha256,
    version,
    scriptName: SCRIPT_NAME,
    namespace: SCRIPT_NAMESPACE,
    updateUrl: SCRIPT_UPDATE_URL,
  };
}

export async function hashInventoryFile(path, inspected) {
  const flags =
    process.platform === 'win32' ? constants.O_RDONLY : constants.O_RDONLY | constants.O_NOFOLLOW;
  const handle = await open(path, flags);
  try {
    const opened = await handle.stat({ bigint: true });
    assert(
      opened.isFile() &&
        inspected.ino > 0n &&
        opened.dev === inspected.dev &&
        opened.ino === inspected.ino &&
        opened.size === inspected.size &&
        opened.mtimeNs === inspected.mtimeNs,
      'Upgrade extension file changed since inspection'
    );
    return sha256(await handle.readFile());
  } finally {
    await handle.close();
  }
}

async function inventory(root) {
  const entries = [];
  async function visit(directory) {
    for (const child of (await readdir(directory)).sort()) {
      const path = join(directory, child);
      const info = await lstat(path, { bigint: true });
      assert(!info.isSymbolicLink(), 'Upgrade extension contains a symlink');
      if (info.isDirectory()) {
        await visit(path);
      } else {
        assert(info.isFile(), 'Upgrade extension contains a special file');
        entries.push(
          `${relative(root, path).replaceAll('\\', '/')} ${await hashInventoryFile(path, info)}`
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
