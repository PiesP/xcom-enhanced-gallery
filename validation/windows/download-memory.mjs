// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';

const LIVE_BUDGET_SOURCE = 'src/shared/services/download/live-byte-budget.ts';
const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_SIGNATURE = 0x06054b50;
const LOCAL_HEADER_BYTES = 30;
const CENTRAL_HEADER_BYTES = 46;
const EOCD_BYTES = 22;
const MAX_FIXTURE_FILE_BYTES = 4 * 1024 * 1024;

/** Read exactly one small owned download through a single regular-file handle. */
export async function readExactDownloadFile(path, expectedBytes) {
  assert(Number.isSafeInteger(expectedBytes) && expectedBytes > 0 &&
    expectedBytes <= MAX_FIXTURE_FILE_BYTES, 'Expected fixture size is out of bounds');
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = await handle.stat();
    assert(before.isFile(), 'Native download must be a regular file');
    assert.equal(before.size, expectedBytes, 'Native download has an unexpected size');
    const bounded = Buffer.alloc(expectedBytes + 1);
    let offset = 0;
    while (offset < bounded.length) {
      const { bytesRead } = await handle.read(bounded, offset, bounded.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    assert.equal(offset, expectedBytes, 'Native download changed size while reading');
    const after = await handle.stat();
    assert(after.isFile() && after.dev === before.dev && after.ino === before.ino &&
      after.size === before.size && after.mtimeMs === before.mtimeMs &&
      after.ctimeMs === before.ctimeMs, 'Native download changed while reading');
    return { bytes: bounded.subarray(0, offset), identity: {
      dev: after.dev, ino: after.ino, size: after.size,
      mtimeMs: after.mtimeMs, ctimeMs: after.ctimeMs,
    } };
  } finally {
    await handle.close();
  }
}

/** Observe deletion of the exact verified path without deleting it by pathname. */
export async function waitForRemovedDownloadFile(path, identity, timeoutMs = 5_000) {
  const started = Date.now();
  const deadline = started + timeoutMs;
  do {
    let current;
    try {
      current = await lstat(path);
    } catch (error) {
      if (error?.code === 'ENOENT') return { absent: true, waitMs: Date.now() - started };
      throw error;
    }
    assert(current.isFile() && current.dev === identity.dev && current.ino === identity.ino &&
      current.size === identity.size && current.mtimeMs === identity.mtimeMs &&
      current.ctimeMs === identity.ctimeMs,
    'Verified memory download path changed before native removal completed');
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
  } while (Date.now() < deadline);
  throw new Error('Verified memory download file remained after native removal');
}

export async function readDownloadLiveLimit(root) {
  const source = await readFile(join(root, LIVE_BUDGET_SOURCE), 'utf8');
  const definition = source.match(
    /^export const DOWNLOAD_LIVE_BYTE_LIMIT = (\d+) \* (\d+) \* (\d+);$/mu
  );
  assert(definition, 'Packaged download budget source must declare the canonical limit');
  const factors = definition.slice(1).map(Number);
  const limitBytes = factors.reduce((product, factor) => product * factor, 1);
  assert(Number.isSafeInteger(limitBytes) && limitBytes > 0,
    'Packaged live download limit must be a positive safe integer');
  return { limitBytes, source: LIVE_BUDGET_SOURCE,
    sourceSha256: createHash('sha256').update(source).digest('hex') };
}

export function expectedStoredZipBytes(entries) {
  assert(entries.length > 0, 'ZIP fixture requires at least one expected file');
  return EOCD_BYTES + entries.reduce((total, entry) =>
    total + LOCAL_HEADER_BYTES + CENTRAL_HEADER_BYTES +
      Buffer.byteLength(entry.filename, 'utf8') * 2 + entry.bytes.length, 0);
}

function within(bytes, offset, size, boundary, label) {
  assert(Number.isSafeInteger(offset) && Number.isSafeInteger(size) &&
    offset >= 0 && size >= 0 && offset + size <= boundary && boundary <= bytes.length,
  `${label} exceeds ZIP bounds`);
}

/** Verify the stored-entry ZIP emitted by the production writer, without expanding data. */
export function verifyStoredZip(bytes, expectedEntries) {
  assert(Buffer.isBuffer(bytes), 'ZIP input must be a Buffer');
  assert.equal(bytes.length, expectedStoredZipBytes(expectedEntries),
    'ZIP byte length differs from its exact stored-entry fixture contract');
  const eocd = bytes.length - EOCD_BYTES;
  assert.equal(bytes.readUInt32LE(eocd), EOCD_SIGNATURE, 'Missing ZIP EOCD');
  assert.equal(bytes.readUInt16LE(eocd + 4), 0, 'Multi-disk ZIP is unsupported');
  assert.equal(bytes.readUInt16LE(eocd + 6), 0, 'Multi-disk ZIP is unsupported');
  const entryCount = bytes.readUInt16LE(eocd + 10);
  assert.equal(bytes.readUInt16LE(eocd + 8), entryCount, 'ZIP entry counts differ');
  assert.equal(entryCount, expectedEntries.length, 'Unexpected ZIP entry count');
  assert.equal(bytes.readUInt16LE(eocd + 20), 0, 'ZIP comment is unexpected');
  const centralBytes = bytes.readUInt32LE(eocd + 12);
  const centralOffset = bytes.readUInt32LE(eocd + 16);
  assert.equal(centralOffset + centralBytes, eocd, 'ZIP central directory boundary differs');

  const expected = new Map(expectedEntries.map((entry) => [entry.filename, entry.bytes]));
  assert.equal(expected.size, expectedEntries.length, 'Fixture ZIP names must be unique');
  const actual = [];
  let localOffset = 0;
  while (localOffset < centralOffset) {
    within(bytes, localOffset, LOCAL_HEADER_BYTES, centralOffset, 'Local header');
    assert.equal(bytes.readUInt32LE(localOffset), LOCAL_SIGNATURE, 'Invalid local entry signature');
    assert.equal(bytes.readUInt16LE(localOffset + 6), 0x0800, 'Expected UTF-8 ZIP entry');
    assert.equal(bytes.readUInt16LE(localOffset + 8), 0, 'Expected stored ZIP entry');
    const crc = bytes.readUInt32LE(localOffset + 14);
    const storedBytes = bytes.readUInt32LE(localOffset + 18);
    assert.equal(bytes.readUInt32LE(localOffset + 22), storedBytes,
      'Stored and original ZIP sizes differ');
    const nameBytes = bytes.readUInt16LE(localOffset + 26);
    assert.equal(bytes.readUInt16LE(localOffset + 28), 0, 'Unexpected local extra field');
    const nameOffset = localOffset + LOCAL_HEADER_BYTES;
    within(bytes, nameOffset, nameBytes + storedBytes, centralOffset, 'Local entry');
    const filename = bytes.toString('utf8', nameOffset, nameOffset + nameBytes);
    assert(expected.has(filename), `Unexpected ZIP entry ${filename}`);
    assert(!actual.some((entry) => entry.filename === filename), `Duplicate ZIP entry ${filename}`);
    const data = bytes.subarray(nameOffset + nameBytes, nameOffset + nameBytes + storedBytes);
    assert(data.equals(expected.get(filename)), `ZIP contents differ for ${filename}`);
    assert.equal(crc32(data) >>> 0, crc, `ZIP CRC differs for ${filename}`);
    actual.push({ filename, offset: localOffset, crc32: crc, bytes: storedBytes,
      sha256: createHash('sha256').update(data).digest('hex') });
    localOffset = nameOffset + nameBytes + storedBytes;
  }
  assert.equal(localOffset, centralOffset, 'Local entries do not end at central directory');
  assert.equal(actual.length, entryCount, 'Local ZIP entry count differs');

  let centralCursor = centralOffset;
  for (const local of actual) {
    within(bytes, centralCursor, CENTRAL_HEADER_BYTES, eocd, 'Central entry');
    assert.equal(bytes.readUInt32LE(centralCursor), CENTRAL_SIGNATURE,
      'Invalid central directory signature');
    assert.equal(bytes.readUInt16LE(centralCursor + 8), 0x0800, 'Central UTF-8 flag differs');
    assert.equal(bytes.readUInt16LE(centralCursor + 10), 0, 'Central compression differs');
    assert.equal(bytes.readUInt32LE(centralCursor + 16), local.crc32,
      'Central CRC differs from local header');
    assert.equal(bytes.readUInt32LE(centralCursor + 20), local.bytes,
      'Central size differs from local header');
    assert.equal(bytes.readUInt32LE(centralCursor + 24), local.bytes,
      'Central original size differs');
    const nameBytes = bytes.readUInt16LE(centralCursor + 28);
    const extras = bytes.readUInt16LE(centralCursor + 30);
    const comment = bytes.readUInt16LE(centralCursor + 32);
    assert.equal(extras, 0, 'Unexpected central extra field');
    assert.equal(comment, 0, 'Unexpected central comment');
    assert.equal(bytes.readUInt32LE(centralCursor + 42), local.offset,
      'Central order or local offset differs');
    const nameOffset = centralCursor + CENTRAL_HEADER_BYTES;
    within(bytes, nameOffset, nameBytes, eocd, 'Central name');
    assert.equal(bytes.toString('utf8', nameOffset, nameOffset + nameBytes), local.filename,
      'Central entry order differs from local entry order');
    centralCursor = nameOffset + nameBytes;
  }
  assert.equal(centralCursor, eocd, 'Central records do not end at EOCD');
  assert.deepEqual(actual.map((entry) => entry.filename),
    expectedEntries.map((entry) => entry.filename), 'ZIP entry order differs from fixture order');
  return { bytes: bytes.length, entryOrder: actual.map((entry) => entry.filename), entries: actual };
}
