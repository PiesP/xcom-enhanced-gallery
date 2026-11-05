// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { lstat, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'vite-plus/test';
import { readExactDownloadFile } from './download-memory.ts';
import { captureOwnedDirectory, removeOwnedNativeDirectory } from './native-file-cleanup.ts';

const roots: string[] = [];

async function ownedFile() {
  const root = await mkdtemp(join(tmpdir(), 'xeg-native-cleanup-test-'));
  roots.push(root);
  const directory = join(root, 'owned');
  await mkdir(directory);
  const directoryIdentity = await captureOwnedDirectory(directory);
  const filename = 'expected.bin';
  const path = join(directory, filename);
  await writeFile(path, 'owned bytes');
  const file = { filename, identity: (await readExactDownloadFile(path, 11)).identity };
  return { root, directory, directoryIdentity, path, file };
}

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await rm(root, { recursive: true, force: true });
  }
});

describe('owned native fixture cleanup', () => {
  it('removes the exact verified file and directory', async () => {
    const fixture = await ownedFile();
    await removeOwnedNativeDirectory(fixture.directory, fixture.directoryIdentity, [fixture.file]);
    await assert.rejects(lstat(fixture.directory), { code: 'ENOENT' });
  });

  it('preserves a same-name, same-size replacement after the original moves away', async () => {
    const fixture = await ownedFile();
    const original = join(fixture.root, 'original.bin');
    await rename(fixture.path, original);
    await writeFile(fixture.path, 'other bytes');
    const replacement = await readExactDownloadFile(fixture.path, fixture.file.identity.size);
    assert.equal(replacement.bytes.toString('utf8'), 'other bytes');
    await assert.rejects(
      removeOwnedNativeDirectory(fixture.directory, fixture.directoryIdentity, [fixture.file]),
      /Owned native fixture file changed/
    );
    const preserved = await readExactDownloadFile(fixture.path, fixture.file.identity.size);
    assert.equal(preserved.bytes.toString('utf8'), 'other bytes');
    assert.equal(await readFile(original, 'utf8'), 'owned bytes');
  });

  it.skipIf(process.platform === 'win32')(
    'preserves a file symlink and its outside target',
    async () => {
      const fixture = await ownedFile();
      const target = join(fixture.root, 'outside.bin');
      await rename(fixture.path, join(fixture.root, 'original.bin'));
      await writeFile(target, 'outside bytes');
      await symlink(target, fixture.path, 'file');
      await assert.rejects(
        removeOwnedNativeDirectory(fixture.directory, fixture.directoryIdentity, [fixture.file]),
        /not a regular file/
      );
      assert.equal(await readFile(target, 'utf8'), 'outside bytes');
      assert((await lstat(fixture.path)).isSymbolicLink());
    }
  );

  it('preserves an owned directory replaced by a reparse point', async () => {
    const fixture = await ownedFile();
    const moved = join(fixture.root, 'moved-owned');
    await rename(fixture.directory, moved);
    await symlink(moved, fixture.directory, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(
      removeOwnedNativeDirectory(fixture.directory, fixture.directoryIdentity, [fixture.file]),
      /reparse point/
    );
    assert.equal(await readFile(join(moved, fixture.file.filename), 'utf8'), 'owned bytes');
    assert((await lstat(fixture.directory)).isSymbolicLink());
  });
});
