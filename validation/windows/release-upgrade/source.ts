// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir, readFile } from 'node:fs/promises';
import type { BigIntStats } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const DIRECTORY = 'validation/windows/release-upgrade';
const USER_PATH = `${DIRECTORY}/v2.3.7.user.js`;
const EXTENSION_PATH = `${DIRECTORY}/v2.3.7-extension`;
const CANDIDATE_USER_PATH = 'dist/xcom-enhanced-gallery.user.js';
const SCRIPT_NAME = 'X.com Enhanced Gallery';
const SCRIPT_NAMESPACE = 'https://github.com/PiesP/xcom-enhanced-gallery';
const SCRIPT_UPDATE_URL = `${SCRIPT_NAMESPACE}/releases/latest/download/xcom-enhanced-gallery.meta.js`;
const SCRIPT_LATEST_DOWNLOAD_URL = `${SCRIPT_NAMESPACE}/releases/latest/download/xcom-enhanced-gallery.user.js`;
const MAX_MANAGER_EDITOR_BYTES = 4 * 1024 * 1024;
const SAME_VERSION_INPUT_PATH = `${DIRECTORY}/same-version-input.json`;
const SAME_VERSION = '2.3.8';
const SAME_VERSION_ASSETS = {
  public: {
    path: `${DIRECTORY}/same-version-public-extension`,
    sourceSha: '8a410efb02837933f8e4798ddcc2501b502c4005',
    coreSha: '77d30da018089be7e2a5e3b2197a200890547aee',
    inventorySha256: '7aeb360ea63d1604e1ad236553245645fb20d171ca5e81fb83e58e16ca05553d',
    contentSha256: 'ccf18442db7bcac5276346a5537fcfb36d6ad78b57cb23a500035586b5aceb04',
  },
  stale: {
    path: `${DIRECTORY}/same-version-stale-extension`,
    sourceSha: 'c803a04013468734885df0ecaaad90ae239de07c',
    coreSha: '588dce5dce2a79c2ed926626b5c97824d63a5203',
    inventorySha256: '15b1eb4a5facd817759440ddf09dcf6b9b5e42e9475bf16eddeba3ca65e8c748',
    contentSha256: 'f82fa21a57cb6dd19de8273c0cc874ec27c41331b7caa5d39e5372bab7fe08da',
  },
  candidate: {
    path: 'dist-extension',
    coreSha: '588dce5dce2a79c2ed926626b5c97824d63a5203',
    contentSha256: '0a433fdd5d0a536912dfe5709c596c8c24c26f117bc26431d9b511a5e9d1132c',
  },
} as const;
type SameVersionRole = keyof typeof SAME_VERSION_ASSETS;

type SameVersionInput = {
  schema: 1;
  role: SameVersionRole;
  version: string;
  sourceSha: string;
  coreSha: string;
  extension: { path: string; inventorySha256: string; contentSha256: string };
};

type UpgradeInput = {
  schema: number;
  candidateVersion: string;
  previousVersion: string;
  previousUserscript: { path: string; sha256: string; url: string };
  previousExtension: { path: string; inventorySha256: string; url: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUpgradeInput(value: unknown): value is UpgradeInput {
  if (
    !isRecord(value) ||
    !isRecord(value.previousUserscript) ||
    !isRecord(value.previousExtension)
  ) {
    return false;
  }
  return (
    typeof value.schema === 'number' &&
    typeof value.candidateVersion === 'string' &&
    typeof value.previousVersion === 'string' &&
    typeof value.previousUserscript.path === 'string' &&
    typeof value.previousUserscript.sha256 === 'string' &&
    typeof value.previousUserscript.url === 'string' &&
    typeof value.previousExtension.path === 'string' &&
    typeof value.previousExtension.inventorySha256 === 'string' &&
    typeof value.previousExtension.url === 'string'
  );
}

export function sha256(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function userscriptVersion(bytes: Buffer): string {
  const header = bytes.toString('utf8').split('// ==/UserScript==', 1)[0] ?? '';
  const matches = [...header.matchAll(/^\/\/ @version ([0-9]+\.[0-9]+\.[0-9]+)$/gmu)];
  assert.equal(matches.length, 1, 'Expected exactly one userscript metadata version');
  const version = matches[0]?.[1];
  assert(version, 'Userscript metadata version is unavailable');
  return version;
}

/** Inspect bytes returned by the manager's visible script editor, not its storage API. */
export function requireManagerEditorSource(
  source: unknown,
  expectedSha256: string,
  version: string
) {
  assert(typeof source === 'string' && source.length > 0, 'Manager editor source is unavailable');
  const bytes = Buffer.from(source, 'utf8');
  assert(bytes.length <= MAX_MANAGER_EDITOR_BYTES, 'Manager editor source exceeds bounded size');
  const observedSha256 = sha256(bytes);
  assert.equal(observedSha256, expectedSha256, 'Manager editor bytes differ from imported file');
  const header = /^\/\/ ==UserScript==\r?\n([\s\S]*?)^\/\/ ==\/UserScript==/mu.exec(source);
  assert(header, 'Manager editor metadata header is missing');
  const fields = new Map<string, string[]>();
  const metadata = header[1];
  assert(metadata, 'Manager editor metadata is unavailable');
  for (const line of metadata.split(/\r?\n/u)) {
    const match = /^\/\/\s+@([A-Za-z-]+)\s+(.+)$/u.exec(line);
    if (!match) {
      continue;
    }
    const key = match[1];
    const value = match[2];
    assert(key && value, 'Manager editor metadata field is invalid');
    const values = fields.get(key) ?? [];
    values.push(value.trim());
    fields.set(key, values);
  }
  const exactlyOne = (key: string) => {
    const values = fields.get(key) ?? [];
    assert.equal(values.length, 1, `Manager editor requires one @${key}`);
    const value = values[0];
    assert(value, `Manager editor @${key} is unavailable`);
    return value;
  };
  assert.equal(exactlyOne('name'), SCRIPT_NAME, 'Manager editor script name changed');
  assert.equal(exactlyOne('namespace'), SCRIPT_NAMESPACE, 'Manager editor namespace changed');
  assert.equal(exactlyOne('version'), version, 'Manager editor version changed');
  assert.equal(exactlyOne('updateURL'), SCRIPT_UPDATE_URL, 'Manager editor update URL changed');
  assert.equal(
    exactlyOne('downloadURL'),
    SCRIPT_LATEST_DOWNLOAD_URL,
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

export async function hashInventoryFile(path: string, inspected: BigIntStats) {
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

async function inventory(root: string) {
  const entries: string[] = [];
  async function visit(directory: string): Promise<void> {
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

function fixedPath(root: string, value: string, expected: string) {
  assert.equal(value, expected, 'Upgrade input must use the declared asset path');
  const path = resolve(root, value);
  assert.equal(relative(resolve(root), path).replaceAll('\\', '/'), expected);
  return path;
}

export async function readUpgradeInput(root: string) {
  const path = join(root, DIRECTORY, 'input.json');
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
  const value: unknown = JSON.parse(raw);
  assert(isUpgradeInput(value), 'Upgrade input is invalid');
  assert.deepEqual(Object.keys(value).sort(), [
    'candidateVersion',
    'previousExtension',
    'previousUserscript',
    'previousVersion',
    'schema',
  ]);
  assert.equal(value.schema, 1);
  assert.equal(value.previousVersion, '2.3.7');
  assert.equal(value.candidateVersion, '2.3.8');
  assert.deepEqual(Object.keys(value.previousUserscript).sort(), ['path', 'sha256', 'url']);
  assert.deepEqual(Object.keys(value.previousExtension).sort(), ['inventorySha256', 'path', 'url']);
  assert.equal(
    value.previousUserscript.url,
    'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.7/xcom-enhanced-gallery.user.js'
  );
  assert.equal(
    value.previousExtension.url,
    'https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.7/xcom-enhanced-gallery-chrome.zip'
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
  requireManagerEditorSource(
    previous.toString('utf8'),
    value.previousUserscript.sha256,
    value.previousVersion
  );
  assert.equal(
    await inventory(extensionPath),
    value.previousExtension.inventorySha256,
    'Public extension inventory mismatch'
  );
  const publicManifest = JSON.parse(await readFile(join(extensionPath, 'manifest.json'), 'utf8'));
  assert.equal(publicManifest.version, value.previousVersion);
  const candidate = await readFile(join(root, CANDIDATE_USER_PATH));
  assert.equal(userscriptVersion(candidate), value.candidateVersion);
  requireManagerEditorSource(candidate.toString('utf8'), sha256(candidate), value.candidateVersion);
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

export async function readSameVersionInput(root: string) {
  let raw: string;
  try {
    raw = await readFile(join(root, SAME_VERSION_INPUT_PATH), 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
  const value: unknown = JSON.parse(raw);
  assert(isRecord(value), 'Same-version input must be an object');
  assert.deepEqual(Object.keys(value).sort(), [
    'coreSha',
    'extension',
    'role',
    'schema',
    'sourceSha',
    'version',
  ]);
  assert(value.role === 'public' || value.role === 'stale' || value.role === 'candidate');
  assert(isRecord(value.extension), 'Same-version extension declaration is invalid');
  assert.deepEqual(Object.keys(value.extension).sort(), [
    'contentSha256',
    'inventorySha256',
    'path',
  ]);
  assert.equal(value.schema, 1);
  assert.equal(value.version, SAME_VERSION);
  const input = value as SameVersionInput;
  const expected = SAME_VERSION_ASSETS[input.role];
  assert.equal(input.extension.path, expected.path, 'Same-version asset path must be fixed');
  assert.equal(input.coreSha, expected.coreSha, 'Same-version core source is mismatched');
  assert.match(input.sourceSha, /^[0-9a-f]{40}$/u);
  assert.match(input.extension.inventorySha256, /^[0-9a-f]{64}$/u);
  assert.equal(
    input.extension.contentSha256,
    expected.contentSha256,
    'Same-version content source is mismatched'
  );
  if (input.role !== 'candidate') {
    const historical = SAME_VERSION_ASSETS[input.role];
    assert.equal(
      input.sourceSha,
      historical.sourceSha,
      'Same-version historical source is mismatched'
    );
    assert.equal(
      input.extension.inventorySha256,
      historical.inventorySha256,
      'Same-version historical inventory is mismatched'
    );
  }
  const bundle: unknown = JSON.parse(await readFile(join(root, 'bundle.json'), 'utf8'));
  assert(isRecord(bundle), 'Same-version bundle identity is invalid');
  assert.equal(bundle.project, 'xcom-enhanced-gallery');
  assert.equal(bundle.profile, 'xeg-gallery');
  assert.equal(bundle.installation, 'extension');
  assert.match(String(bundle.source_sha), /^[0-9a-f]{40}$/u);
  assert.equal(
    bundle.core_sha,
    SAME_VERSION_ASSETS.candidate.coreSha,
    'Same-version harness core is mismatched'
  );
  if (input.role === 'candidate') {
    assert.equal(
      input.sourceSha,
      bundle.source_sha,
      'Candidate source must match the current bundle'
    );
    assert.equal(input.coreSha, bundle.core_sha, 'Candidate core must match the current bundle');
  }
  const path = fixedPath(root, input.extension.path, expected.path);
  const directory = await lstat(path, { bigint: true });
  assert(
    directory.isDirectory() && !directory.isSymbolicLink(),
    'Same-version extension root must be a real directory'
  );
  assert.equal(
    await inventory(path),
    input.extension.inventorySha256,
    'Same-version extension inventory mismatch'
  );
  for (const [name, expectedSha] of [
    ['content.js', input.extension.contentSha256],
    ['manifest.json', '5d6b6e1488ad5396c4430e9785b340a7c024fe72828f70a0de1fea743e55f6f2'],
  ] as const) {
    const file = join(path, name);
    const inspected = await lstat(file, { bigint: true });
    assert(
      inspected.isFile() && !inspected.isSymbolicLink(),
      `Same-version ${name} must be a regular file`
    );
    assert.equal(
      await hashInventoryFile(file, inspected),
      expectedSha,
      `Same-version ${name} hash mismatch`
    );
  }
  const manifest = JSON.parse(await readFile(join(path, 'manifest.json'), 'utf8'));
  assert.equal(manifest.version, SAME_VERSION, 'Same-version manifest version mismatch');
  return {
    ...input,
    extensionPath: path,
    harnessSourceSha: bundle.source_sha as string,
    harnessCoreSha: bundle.core_sha as string,
  };
}

export { inventory as extensionInventorySha256 };
