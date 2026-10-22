// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { test } from 'node:test';
import { createExtensionNativeFixtureHandler } from './extension-native-loopback.ts';

test('original availability faults retain the allowlist and restore the exact healthy bytes', async () => {
  const fixture = createExtensionNativeFixtureHandler();
  const original = Buffer.from('bounded-original');
  fixture.setPayloads(
    [original, original, original],
    Object.fromEntries(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
        name,
        Buffer.from('bounded-video'),
      ])
    )
  );
  const url = 'https://pbs.twimg.com/media/GkE1234ABCDEF?format=jpg&name=orig';
  const server = createServer(fixture.handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const port = address.port;
  const read = (path = new URL(url).pathname + new URL(url).search) =>
    new Promise<{ status: number | undefined; bytes: Buffer }>((resolve, reject) => {
      const outgoing = request(
        { hostname: '127.0.0.1', port, path, headers: { Host: 'pbs.twimg.com' } },
        (incoming) => {
          const parts: Buffer[] = [];
          incoming.on('data', (part: Buffer) => parts.push(part));
          incoming.once('error', reject);
          incoming.once('end', () =>
            resolve({ status: incoming.statusCode, bytes: Buffer.concat(parts) })
          );
        }
      );
      outgoing.once('error', reject);
      outgoing.end();
    });
  try {
    assert.deepEqual(await read(), { status: 200, bytes: original });
    for (const status of [403, 404] as const) {
      fixture.armHttpFailure(url, status);
      assert.deepEqual(await read(), { status, bytes: Buffer.alloc(0) });
      assert.throws(() => fixture.armHttpFailure(url, status), /Only one/u);
      fixture.clearHttpFailure();
      assert.deepEqual(await read(), { status: 200, bytes: original });
    }
    for (const invalid of [
      url.replace('https:', 'http:'),
      url.replace('pbs.twimg.com', 'pbs.twimg.com:444'),
      url.replace('pbs.twimg.com', 'user@pbs.twimg.com'),
      `${url}#fragment`,
      url.replace('name=orig', 'name=small'),
      url.replace('GkE1234ABCDEF', 'Undeclared'),
    ]) {
      assert.throws(() => fixture.armHttpFailure(invalid, 403));
    }
    assert.deepEqual(await read('/media/Undeclared?format=jpg&name=orig'), {
      status: 404,
      bytes: Buffer.alloc(0),
    });
    const snapshot = fixture.snapshot();
    assert(snapshot.events.every((event) => typeof event.finishedAtMs === 'number'));
    assert(
      snapshot.events
        .filter(({ status }) => status === 403 || status === 404)
        .every(({ result }) => result === 'http-failure')
    );
    assert.equal(snapshot.unexpectedCount, 1);
    assert.equal(snapshot.overflow, false);
    assert.equal(snapshot.activeCount, 0);
    assert.deepEqual(
      snapshot.events.map(({ status }) => status),
      [200, 403, 200, 404, 200]
    );
  } finally {
    fixture.clearHttpFailure();
    fixture.destroyActive();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test('a canceled bootstrap range leaves a resumed held 206 overlapping an independent range', async () => {
  const fixture = createExtensionNativeFixtureHandler();
  const video = Buffer.alloc(200, 7);
  fixture.setPayloads(
    [Buffer.from('image'), Buffer.from('image'), Buffer.from('image')],
    Object.fromEntries(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
        name,
        video,
      ])
    )
  );
  const tweetId = '4666000111222333888';
  fixture.setRecoveryPayloads({ tweetId, validMp4: video, badMp4: video });
  const path = `/ext_tw_video/${tweetId}/pu/vid/320x180/video-0-best.mp4`;
  assert.throws(() => fixture.armFirstTwoVideoHolds(path, 150, 149), /subrange/u);
  assert.throws(() => fixture.armFirstTwoVideoHolds(path, 120, 200), /subrange/u);
  fixture.armFirstTwoVideoHolds(path, 120, 149);
  const server = createServer(fixture.handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const options = {
    hostname: '127.0.0.1',
    port: address.port,
    path,
    headers: { Host: 'video.twimg.com' },
  };
  const first = request({ ...options, headers: { ...options.headers, Range: 'bytes=0-199' } });
  first.on('error', () => undefined);
  const firstPrefix = new Promise<{ bytes: Buffer; range: string; length: string }>(
    (resolve, reject) => {
      first.once('response', (response) => {
        assert.equal(response.statusCode, 206);
        response.once('data', (part: Buffer) =>
          resolve({
            bytes: part,
            range: String(response.headers['content-range']),
            length: String(response.headers['content-length']),
          })
        );
        response.once('error', reject);
      });
      first.once('error', reject);
    }
  );
  const second = request({ ...options, headers: { ...options.headers, Range: 'bytes=100-199' } });
  second.on('error', () => undefined);
  const secondPrefix = new Promise<{ bytes: Buffer; range: string; length: string }>(
    (resolve, reject) => {
      second.once('response', (response) => {
        assert.equal(response.statusCode, 206);
        response.once('data', (part: Buffer) =>
          resolve({
            bytes: part,
            range: String(response.headers['content-range']),
            length: String(response.headers['content-length']),
          })
        );
        response.once('error', reject);
      });
      second.once('error', reject);
    }
  );
  try {
    first.end();
    assert.deepEqual(await firstPrefix, {
      bytes: video.subarray(0, 120),
      range: 'bytes 0-149/200',
      length: '150',
    });
    assert.equal(fixture.videoHeld(), true);
    first.destroy();
    const firstDeadline = Date.now() + 2_000;
    while (fixture.snapshot().events[0]?.result !== 'aborted' && Date.now() < firstDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(fixture.snapshot().events[0]?.result, 'aborted');
    second.end();
    assert.deepEqual(await secondPrefix, {
      bytes: video.subarray(100, 120),
      range: 'bytes 100-149/200',
      length: '50',
    });
    assert.equal(fixture.videoHeld(), true);
    const third = await new Promise<{
      status: number | undefined;
      bytes: Buffer;
      range: string;
      length: string;
    }>((resolve, reject) => {
      const outgoing = request(
        { ...options, headers: { ...options.headers, Range: 'bytes=150-199' } },
        (incoming) => {
          const parts: Buffer[] = [];
          incoming.on('data', (part: Buffer) => parts.push(part));
          incoming.once('end', () =>
            resolve({
              status: incoming.statusCode,
              bytes: Buffer.concat(parts),
              range: String(incoming.headers['content-range']),
              length: String(incoming.headers['content-length']),
            })
          );
          incoming.once('error', reject);
        }
      );
      outgoing.once('error', reject);
      outgoing.end();
    });
    assert.deepEqual(third, {
      status: 206,
      bytes: video.subarray(150),
      range: 'bytes 150-199/200',
      length: '50',
    });
    second.destroy();
    const deadline = Date.now() + 2_000;
    while (fixture.videoHeld() && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const ranges = fixture.snapshot().events.filter((event) => event.path === path);
    assert.deepEqual(
      ranges.map(({ range, status, result }) => ({ range, status, result })),
      [
        { range: { start: 0, end: 149 }, status: 206, result: 'aborted' },
        { range: { start: 100, end: 149 }, status: 206, result: 'aborted' },
        { range: { start: 150, end: 199 }, status: 206, result: 'served' },
      ]
    );
    assert(ranges[1]!.atMs < ranges[2]!.atMs);
    assert(ranges[2]!.atMs < ranges[1]!.closedAtMs!);
  } finally {
    first.destroy();
    second.destroy();
    fixture.abortVideoHold();
    fixture.destroyActive();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
