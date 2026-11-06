// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdtemp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getNativeFixtureSavedFiles,
  getNativeFixtureSavedNames,
  setNativeFixtureDirectory,
} from './filename-boundary-adapter.ts';
import {
  assertOwnedDirectory,
  assertOwnedFile,
  captureOwnedDirectory,
  nativeFilePath,
  removeOwnedNativeDirectory,
} from './native-file-cleanup.ts';
import {
  expectedStoredZipBytes,
  readExactDownloadFile,
  type DownloadFileIdentity,
  verifyStoredZip,
} from './download-memory.ts';
import { DownloadOrchestrator } from '../../src/shared/services/download/download-orchestrator.ts';
import {
  LiveByteBudget,
  type OwnedBlob,
} from '../../src/shared/services/download/live-byte-budget.ts';
import type { MediaInfo } from '../../src/shared/types/media.types.ts';

const MAX_BYTES = 4 * 1024 * 1024;
const LONG_STEM = 'A'.repeat(300);
const FIRST_NAME = `${'A'.repeat(239)}_123456789_1.jpg`;
const DUPLICATE_NAME = `${'A'.repeat(237)}_123456789_1-1.jpg`;
const FAILED_NAME = `${'A'.repeat(239)}_123456789_2.jpg`;
const FIRST_ARCHIVE = `${'Z'.repeat(251)}.zip`;
const RECOVERED_ARCHIVE = `${'Z'.repeat(241)}-missing-2.zip`;

const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const safeErrorLabel = (value: string) =>
  /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value) ? value : 'Unknown';

function failureDetail(error: unknown, stage: string) {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? safeErrorLabel(error.code)
      : null;
  return { stage, type: error instanceof Error ? safeErrorLabel(error.name) : typeof error, code };
}

/** A deliberate utility-boundary input; no current gallery custom-name control is implied. */
function media(id: string, basename: string): MediaInfo {
  return {
    id,
    type: 'image',
    url: `https://pbs.twimg.com/media/${basename}.jpg?name=orig`,
    tweetUsername: LONG_STEM,
    tweetId: '123456789',
  };
}

/** Exercise production planner, allocator, ZIP writer, recovery, and save seam on native files. */
async function runFixture({ root, output }: { root: string; output: string }) {
  assert(root && output, 'Source root and evidence output are required');
  await mkdir(output, { recursive: true });
  const directory = await mkdtemp(join(tmpdir(), 'xeg-filename-boundary-'));
  const directoryIdentity = await captureOwnedDirectory(directory);
  setNativeFixtureDirectory(directory);
  const budget = new LiveByteBudget(MAX_BYTES);
  const owners: OwnedBlob[] = [];
  const orchestrator = new DownloadOrchestrator();
  orchestrator.initialize();
  const evidence: Array<{
    case: string;
    nativeName: string;
    artifact: string;
    bytes: number;
    sha256: string;
  }> = [];
  const verifiedFiles = new Map<string, DownloadFileIdentity>();
  let primaryError: unknown;
  let cleanupError: unknown;
  let stage = 'setup';
  let failedStage = 'none';
  let observations: Record<string, unknown> = {};
  const own = (bytes: Buffer): OwnedBlob => {
    const blob = new Blob([new Uint8Array(bytes)]);
    const owner = { value: blob, lease: budget.reserve(blob.size) };
    owners.push(owner);
    return owner;
  };
  const retain = async (
    caseName: string,
    nativeName: string,
    artifact: string,
    expected: Buffer
  ) => {
    assert(expected.length > 0 && expected.length <= MAX_BYTES);
    await assertOwnedDirectory(directory, directoryIdentity);
    const observed = await readExactDownloadFile(
      nativeFilePath(directory, nativeName),
      expected.length
    );
    const saved = getNativeFixtureSavedFiles().find((file) => file.filename === nativeName);
    assert(saved, `${caseName} was not saved by the native fixture adapter`);
    assert.deepEqual(observed.identity, saved.identity, `${caseName} native identity changed`);
    verifiedFiles.set(nativeName, observed.identity);
    assert.deepEqual(observed.bytes, expected, `${caseName} native bytes changed`);
    await writeFile(join(output, artifact), observed.bytes, { flag: 'wx' });
    evidence.push({
      case: caseName,
      nativeName,
      artifact,
      bytes: observed.bytes.length,
      sha256: hash(observed.bytes),
    });
  };
  try {
    for (const [caseName, supplied, expected, bytes] of [
      ['unicode', '한글🙂.jpg', '한글🙂.jpg', Buffer.from('unicode-fixture\n')],
      ['reserved-con', 'CON.jpg', '_CON.jpg', Buffer.from('reserved-con\n')],
      ['reserved-superscript', 'LPT¹.jpg', '_LPT¹.jpg', Buffer.from('reserved-lpt\n')],
      ['malformed', '\ud800bad?.jpg', '_bad_.jpg', Buffer.from('malformed-name\n')],
      ['trailing-dot-space', 'trail. ', 'trail', Buffer.from('trailing-name\n')],
    ] as const) {
      stage = `single:${caseName}`;
      const result = await orchestrator.downloadSingle(
        {
          id: caseName,
          type: 'image',
          url: `https://pbs.twimg.com/media/${caseName}.jpg`,
          filename: supplied,
        },
        { blob: new Blob([new Uint8Array(bytes)]), liveBudget: budget }
      );
      assert.equal(result.success, true, `${caseName}: ${result.error}`);
      assert.equal(result.filename, expected, `${caseName} final name`);
      await retain(caseName, expected, `filename-boundary-${caseName}.bin`, bytes);
    }

    stage = 'partial-zip';
    const items = [
      media('123456789_media_0', 'one'),
      media('123456789_media_0', 'two'),
      media('123456789_media_1', 'three'),
    ];
    const firstBytes = Buffer.from('original-one\n');
    const secondBytes = Buffer.from('original-two\n');
    const thirdBytes = Buffer.from('recovered-three\n');
    const cachedBlobs = new Map([
      [items[0]!.url, own(firstBytes)],
      [items[1]!.url, own(secondBytes)],
    ]);
    const failProvider = async () => {
      throw new Error('Deliberate failed source for recovery contract');
    };
    const first = await orchestrator.downloadBulk(items, {
      zipFilename: `${'Z'.repeat(300)}.zip`,
      cachedBlobs,
      mediaBlobProvider: failProvider,
      liveBudget: budget,
      concurrency: 1,
      retries: 0,
    });
    assert.equal(first.status, 'partial');
    assert.equal(first.filename, FIRST_ARCHIVE);
    assert.equal(first.filesSuccessful, 2);
    assert.equal(first.failedEntries?.length, 1);
    assert.equal(first.failedEntries[0]?.index, 2);
    assert.equal(first.failedEntries[0]?.filename, FAILED_NAME);
    const firstEntries = [
      { filename: FIRST_NAME, bytes: firstBytes },
      { filename: DUPLICATE_NAME, bytes: secondBytes },
    ];
    const firstNative = await readExactDownloadFile(
      nativeFilePath(directory, FIRST_ARCHIVE),
      expectedStoredZipBytes(firstEntries)
    );
    verifyStoredZip(firstNative.bytes, firstEntries);
    await retain('partial-zip', FIRST_ARCHIVE, 'filename-boundary-partial.zip', firstNative.bytes);

    stage = 'failed-retry';
    const failed = [
      {
        index: 2,
        media: items[2]!,
        url: items[2]!.url,
        filename: first.failedEntries[0]!.filename,
      },
    ];
    const savedBeforeRetry = getNativeFixtureSavedNames();
    const retry = await orchestrator.downloadFailedEntries(failed, FIRST_ARCHIVE, 1, {
      mediaBlobProvider: failProvider,
      liveBudget: budget,
      retries: 0,
    });
    assert.equal(retry.success, false);
    assert.equal(retry.saveAttempted, false);
    assert.equal(retry.failedEntries?.[0]?.filename, FAILED_NAME);
    assert.deepEqual(
      getNativeFixtureSavedNames(),
      savedBeforeRetry,
      'Failed retry must not save an archive'
    );
    stage = 'recovered-zip';
    const recovered = await orchestrator.downloadFailedEntries(failed, FIRST_ARCHIVE, 2, {
      cachedBlobs: new Map([[items[2]!.url, own(thirdBytes)]]),
      liveBudget: budget,
      concurrency: 1,
      retries: 0,
    });
    assert.equal(recovered.status, 'success');
    assert.equal(recovered.filename, RECOVERED_ARCHIVE);
    const recoveredEntries = [{ filename: FAILED_NAME, bytes: thirdBytes }];
    const recoveredNative = await readExactDownloadFile(
      nativeFilePath(directory, RECOVERED_ARCHIVE),
      expectedStoredZipBytes(recoveredEntries)
    );
    verifyStoredZip(recoveredNative.bytes, recoveredEntries);
    await retain(
      'recovered-zip',
      RECOVERED_ARCHIVE,
      'filename-boundary-recovered.zip',
      recoveredNative.bytes
    );
    stage = 'inventory';
    assert.deepEqual(
      [...getNativeFixtureSavedNames()].sort(),
      evidence.map((item) => item.nativeName).sort()
    );
    assert.deepEqual(
      (await readdir(directory)).sort(),
      evidence.map((item) => item.nativeName).sort()
    );
    observations = {
      profile: 'filename-boundaries',
      tier: 'Windows Node native filesystem and production utility boundary',
      scope:
        'deliberate utility inputs; no gallery custom-name UI, browser download, extension install, or live X.com',
      nativeFiles: evidence,
      failedEntry: { index: 2, filename: FAILED_NAME, firstRetrySaveAttempted: false },
      boundedNames: evidence.every((item) => item.nativeName.length <= 255),
    };
  } catch (error) {
    primaryError = error;
    failedStage = stage;
  } finally {
    orchestrator.destroy();
    for (const owner of owners) {
      owner.lease.release();
    }
    try {
      assert.equal(budget.usedBytes, 0, 'Fixture leaked download ownership');
      const saved = getNativeFixtureSavedFiles();
      if (primaryError) {
        for (const [index, file] of saved.entries()) {
          if (evidence.some((item) => item.nativeName === file.filename)) {
            continue;
          }
          await assertOwnedDirectory(directory, directoryIdentity);
          await assertOwnedFile(directory, file);
          const path = nativeFilePath(directory, file.filename);
          const state = await lstat(path);
          assert(state.isFile() && state.size > 0 && state.size <= MAX_BYTES);
          const observed = await readExactDownloadFile(path, state.size);
          assert.deepEqual(observed.identity, file.identity, 'Failed native output changed');
          verifiedFiles.set(file.filename, observed.identity);
          const artifact = `filename-boundary-failed-${index}.bin`;
          await writeFile(join(output, artifact), observed.bytes, { flag: 'wx' });
          evidence.push({
            case: 'failed-run',
            nativeName: file.filename,
            artifact,
            bytes: observed.bytes.length,
            sha256: hash(observed.bytes),
          });
        }
      }
      const cleanupFiles = saved.map((file) => {
        const identity = verifiedFiles.get(file.filename);
        assert(identity, 'Native output was not independently read before cleanup');
        assert.deepEqual(identity, file.identity, 'Native output changed after adapter save');
        return { filename: file.filename, identity };
      });
      await removeOwnedNativeDirectory(directory, directoryIdentity, cleanupFiles);
      setNativeFixtureDirectory(null);
    } catch (error) {
      cleanupError = error;
    }
    await writeFile(
      join(output, 'filename-boundary.json'),
      JSON.stringify(
        {
          status: primaryError || cleanupError ? 'failed' : 'passed',
          scope: observations.scope ?? 'utility-boundary native filesystem fixture',
          nativeFiles: evidence,
          cleanup: cleanupError
            ? { status: 'failed', ...failureDetail(cleanupError, 'cleanup') }
            : { status: 'removed' },
          failure: primaryError ? failureDetail(primaryError, failedStage) : null,
        },
        null,
        2
      ),
      { flag: 'wx' }
    );
  }
  if (primaryError || cleanupError) {
    throw new Error('Filename boundary native fixture failed');
  }
  return observations;
}

/** Keep any failure returned to the shared guest result free of local paths. */
export async function run(args: { root: string; output: string }) {
  try {
    return await runFixture(args);
  } catch {
    const failure = new Error('Filename boundary native fixture failed');
    failure.name = 'FilenameBoundaryFixtureError';
    failure.stack = `${failure.name}: ${failure.message}`;
    throw failure;
  }
}
