// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { readOwnedNativeBytes } from './firefox-install.ts';

const STAGE_PREFIX = 'xeg-userscript-live-stage-';
const OUTPUT_PREFIX = 'userscript-live-';
const INDEX_NAME = 'userscript-live-artifacts.json';
const MAX_OUTPUT_FILES = 64;
const MAX_STAGE_FILES = 16;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_STAGE_BYTES = 64 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 256 * 1024 * 1024;
const RESERVED_RESULT_BYTES = 1024 * 1024;
const safeName = (name: string) => /^[A-Za-z0-9][A-Za-z0-9_.-]{0,159}$/u.test(name);
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/**
 * Flatten a completed or failed live phase before the controller scans the flat output root.
 * The stage remains untouched on any copy or verification failure.
 */
export async function flattenUserscriptLiveEvidence(options: {
  root: string;
  stage: string;
  output: string;
  phaseStatus: 'observed' | 'failed';
}) {
  const { root, stage, output, phaseStatus } = options;
  assert.equal(dirname(resolve(stage)), resolve(root), 'Live stage is outside the task root');
  assert(basename(stage).startsWith(STAGE_PREFIX), 'Live stage prefix differs');
  assert.equal(resolve(output), resolve(root, 'output'), 'Live output is not the flat task output');
  const [stageStat, outputStat] = await Promise.all([lstat(stage), lstat(output)]);
  assert(stageStat.isDirectory() && !stageStat.isSymbolicLink(), 'Unsafe live stage directory');
  assert(outputStat.isDirectory() && !outputStat.isSymbolicLink(), 'Unsafe flat output directory');
  const [stageEntries, outputEntries] = await Promise.all([
    readdir(stage, { withFileTypes: true }),
    readdir(output, { withFileTypes: true }),
  ]);
  assert(stageEntries.length <= MAX_STAGE_FILES, 'Too many live stage artifacts');
  assert(
    stageEntries.every((entry) => entry.isFile()),
    'Live stage contains a non-file entry'
  );
  assert(
    outputEntries.every((entry) => entry.isFile()),
    'Flat output contains a non-file entry'
  );
  const existingStats = await Promise.all(
    outputEntries.map((entry) => lstat(join(output, entry.name)))
  );
  assert(
    existingStats.every((item) => item.isFile() && item.size <= MAX_FILE_BYTES),
    'Flat output contains an unsafe or oversized file'
  );
  const existingBytes = existingStats.reduce((sum, item) => sum + item.size, 0);
  assert(
    existingBytes + RESERVED_RESULT_BYTES <= MAX_OUTPUT_BYTES,
    'Flat output already exceeds collection size'
  );
  // guest.mjs adds result.json after the installation entry returns.
  assert(
    outputEntries.length + stageEntries.length + 2 <= MAX_OUTPUT_FILES,
    'Live stage would exceed the controller output file limit'
  );
  const planned = stageEntries.map((entry) => {
    assert(safeName(entry.name), 'Unsafe live stage artifact basename');
    const name = entry.name.startsWith(OUTPUT_PREFIX) ? entry.name : OUTPUT_PREFIX + entry.name;
    assert(safeName(name) && name !== INDEX_NAME, 'Unsafe flattened live artifact name');
    assert(
      !outputEntries.some((existing) => existing.name === name),
      'Flattened live artifact collides with fixture output'
    );
    return { originalName: entry.name, name };
  });
  assert(
    new Set(planned.map((entry) => entry.name)).size === planned.length,
    'Flattened live artifact names collide'
  );
  assert(
    !outputEntries.some((entry) => entry.name === INDEX_NAME),
    'Live artifact index already exists'
  );
  let total = 0;
  const files: Array<{ source: string; file: string; bytes: number; sha256: string }> = [];
  for (const item of planned) {
    const source = join(stage, item.originalName);
    const read = await readOwnedNativeBytes(stage, source, MAX_FILE_BYTES);
    total += read.bytes.length;
    assert(total <= MAX_STAGE_BYTES, 'Live stage exceeds bounded transfer size');
    assert(
      existingBytes + total + RESERVED_RESULT_BYTES <= MAX_OUTPUT_BYTES,
      'Live stage would exceed collection byte limit'
    );
    const target = join(output, item.name);
    await writeFile(target, read.bytes, { flag: 'wx', mode: 0o600 });
    const verified = await readOwnedNativeBytes(output, target, MAX_FILE_BYTES);
    assert.equal(
      sha256(verified.bytes),
      sha256(read.bytes),
      'Flattened live artifact copy differs from stage'
    );
    files.push({
      source: item.originalName,
      file: item.name,
      bytes: read.bytes.length,
      sha256: sha256(read.bytes),
    });
  }
  const index = { schemaVersion: 1, phaseStatus, files };
  const encoded = Buffer.from(JSON.stringify(index, null, 2));
  assert(encoded.length <= 64 * 1024, 'Live artifact index exceeded its bound');
  const indexPath = join(output, INDEX_NAME);
  await writeFile(indexPath, encoded, { flag: 'wx', mode: 0o600 });
  assert.equal(
    sha256(await readFile(indexPath)),
    sha256(encoded),
    'Live artifact index copy differs'
  );
  return index;
}
