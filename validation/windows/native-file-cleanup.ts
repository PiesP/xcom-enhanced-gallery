// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { Stats } from 'node:fs';
import { lstat, readdir, realpath, rmdir, unlink } from 'node:fs/promises';
import { isAbsolute, join, toNamespacedPath } from 'node:path';
import type { DownloadFileIdentity } from './download-memory.ts';

export type OwnedDirectoryIdentity = {
  dev: number;
  ino: number;
  birthtimeMs: number;
  realPath: string;
};

export type OwnedNativeFile = { filename: string; identity: DownloadFileIdentity };

export function fileIdentity(state: Stats): DownloadFileIdentity {
  assert(state.isFile() && !state.isSymbolicLink(), 'Native fixture output is not a regular file');
  return {
    dev: state.dev,
    ino: state.ino,
    size: state.size,
    mtimeMs: state.mtimeMs,
    ctimeMs: state.ctimeMs,
  };
}

export function nativeFilePath(directory: string, filename: string): string {
  assert(isAbsolute(directory), 'Native fixture directory must be absolute');
  assert(
    filename && filename !== '.' && filename !== '..' && !/[\\/]/.test(filename),
    'Native fixture filename is not a basename'
  );
  return toNamespacedPath(join(directory, filename));
}

/** Snapshot the directory returned by mkdtemp before any fixture writes. */
export async function captureOwnedDirectory(directory: string): Promise<OwnedDirectoryIdentity> {
  assert(isAbsolute(directory), 'Native fixture directory must be absolute');
  const state = await lstat(toNamespacedPath(directory));
  assert(state.isDirectory() && !state.isSymbolicLink(), 'Owned directory is a reparse point');
  return {
    dev: state.dev,
    ino: state.ino,
    birthtimeMs: state.birthtimeMs,
    realPath: await realpath(toNamespacedPath(directory)),
  };
}

export async function assertOwnedDirectory(directory: string, expected: OwnedDirectoryIdentity) {
  const state = await lstat(toNamespacedPath(directory));
  assert(
    state.isDirectory() &&
      !state.isSymbolicLink() &&
      state.dev === expected.dev &&
      state.ino === expected.ino &&
      state.birthtimeMs === expected.birthtimeMs &&
      (await realpath(toNamespacedPath(directory))) === expected.realPath,
    'Owned native fixture directory changed or became a reparse point'
  );
}

/** Refuse replacement, mutation, or a symlink before unlinking an owned file. */
export async function assertOwnedFile(directory: string, file: OwnedNativeFile): Promise<void> {
  const state = await lstat(nativeFilePath(directory, file.filename));
  const observed = fileIdentity(state);
  assert.deepEqual(observed, file.identity, 'Owned native fixture file changed');
}

/** Preflight the whole inventory, then recheck each identity immediately before deletion. */
export async function removeOwnedNativeDirectory(
  directory: string,
  directoryIdentity: OwnedDirectoryIdentity,
  files: readonly OwnedNativeFile[]
) {
  const names = files.map((file) => file.filename);
  assert.equal(new Set(names).size, names.length, 'Duplicate native fixture file record');
  await assertOwnedDirectory(directory, directoryIdentity);
  assert.deepEqual(
    (await readdir(directory)).sort(),
    [...names].sort(),
    'Foreign native fixture file'
  );
  for (const file of files) {
    await assertOwnedFile(directory, file);
  }
  for (const file of files) {
    await assertOwnedDirectory(directory, directoryIdentity);
    await assertOwnedFile(directory, file);
    await unlink(nativeFilePath(directory, file.filename));
  }
  await assertOwnedDirectory(directory, directoryIdentity);
  await rmdir(toNamespacedPath(directory));
}
