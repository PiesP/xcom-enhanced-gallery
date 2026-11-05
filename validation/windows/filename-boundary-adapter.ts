// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { lstat, open } from 'node:fs/promises';
import { fileIdentity, nativeFilePath, type OwnedNativeFile } from './native-file-cleanup.ts';

let ownedDirectory: string | null = null;
const savedFiles: OwnedNativeFile[] = [];

export function setNativeFixtureDirectory(directory: string | null) {
  assert(
    directory === null || ownedDirectory === null,
    'Native fixture directory already configured'
  );
  ownedDirectory = directory;
  if (directory !== null) {
    savedFiles.length = 0;
  }
}

export function getNativeFixtureSavedNames(): readonly string[] {
  return savedFiles.map((file) => file.filename);
}

export function getNativeFixtureSavedFiles(): readonly OwnedNativeFile[] {
  return savedFiles.map((file) => ({ filename: file.filename, identity: { ...file.identity } }));
}

export function getDownloadAdapter() {
  return {
    async download() {
      throw new Error('Native boundary fixture forbids URL downloads');
    },
    needsBlobFallback: () => false,
    async downloadBlob(
      blob: Blob,
      filename: string,
      signal?: AbortSignal,
      onReleased?: () => void
    ) {
      try {
        assert(ownedDirectory, 'Native fixture directory is not configured');
        const path = nativeFilePath(ownedDirectory, filename);
        assert(
          blob.size > 0 && blob.size <= 4 * 1024 * 1024,
          'Native fixture Blob is out of bounds'
        );
        if (signal?.aborted) {
          throw signal.reason;
        }
        const bytes = Buffer.from(await blob.arrayBuffer());
        if (signal?.aborted) {
          throw signal.reason;
        }
        const handle = await open(path, 'wx', 0o600);
        let writtenIdentity: ReturnType<typeof fileIdentity> | undefined;
        try {
          await handle.writeFile(bytes);
          writtenIdentity = fileIdentity(await handle.stat());
        } finally {
          await handle.close();
        }
        assert(writtenIdentity, 'Native fixture write did not finish');
        const onDisk = fileIdentity(await lstat(path));
        assert.equal(onDisk.dev, writtenIdentity.dev, 'Native fixture file replaced after write');
        assert.equal(onDisk.ino, writtenIdentity.ino, 'Native fixture file replaced after write');
        assert.equal(onDisk.size, writtenIdentity.size, 'Native fixture file changed after write');
        savedFiles.push({ filename, identity: onDisk });
      } finally {
        onReleased?.();
      }
    },
  };
}

export function getHttpRequestAdapter() {
  throw new Error('Native boundary fixture forbids HTTP requests');
}
