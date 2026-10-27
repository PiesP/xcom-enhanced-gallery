// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { test } from 'vite-plus/test';
import { createExtensionNativeFixtureHandler } from './extension-native-loopback.ts';

test('experience originals use the exact owned bytes and reject other qualities', async () => {
  const fixture = createExtensionNativeFixtureHandler();
  const images = ['tall', 'panorama', 'small'].map((label) => Buffer.from(label));
  fixture.setPayloads(
    [Buffer.from('base'), Buffer.from('base'), Buffer.from('base')],
    Object.fromEntries(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
        name,
        Buffer.from('video'),
      ])
    )
  );
  fixture.setExperienceImages(images);
  assert.throws(() => fixture.setExperienceImages(images), /already installed/u);
  const server = createServer(fixture.handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const read = (path: string) =>
    new Promise<{ status: number | undefined; bytes: Buffer }>((resolve, reject) => {
      const outgoing = request(
        { hostname: '127.0.0.1', port: address.port, path, headers: { Host: 'pbs.twimg.com' } },
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
    for (const [index, path] of ['Tall', 'Panorama', 'Small'].entries()) {
      assert.deepEqual(await read(`/media/XegExperience${path}.jpg?format=jpg&name=orig`), {
        status: 200,
        bytes: images[index],
      });
    }
    assert.deepEqual(await read('/media/XegExperienceTall.jpg?format=jpg&name=large'), {
      status: 404,
      bytes: Buffer.alloc(0),
    });
    assert.equal(fixture.snapshot().unexpectedCount, 1);
  } finally {
    fixture.destroyActive();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

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

test('a held video range overlaps a second owned video and later resumes', async () => {
  const fixture = createExtensionNativeFixtureHandler();
  const video = Buffer.alloc(200, 7);
  const adjacent = Buffer.alloc(80, 8);
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
  fixture.setRecoveryPayloads({ tweetId, validMp4: video, badMp4: video, adjacentMp4: adjacent });
  const firstPath = `/ext_tw_video/${tweetId}/pu/vid/320x180/video-0-best.mp4`;
  const secondPath = `/ext_tw_video/${tweetId}/pu/vid/320x180/video-1-best.mp4`;
  fixture.armFirstVideoHold(firstPath, 100);
  const server = createServer(fixture.handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const options = {
    hostname: '127.0.0.1',
    port: address.port,
    headers: { Host: 'video.twimg.com' },
  };
  const readRange = (path: string, range: string) =>
    new Promise<{ status: number | undefined; bytes: Buffer; range: string; length: string }>(
      (resolve, reject) => {
        const outgoing = request(
          { ...options, path, headers: { ...options.headers, Range: range } },
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
      }
    );
  const first = request({
    ...options,
    path: firstPath,
    headers: { ...options.headers, Range: 'bytes=0-199' },
  });
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
  try {
    first.end();
    assert.deepEqual(await firstPrefix, {
      bytes: video.subarray(0, 100),
      range: 'bytes 0-199/200',
      length: '200',
    });
    assert.equal(fixture.videoHeld(), true);
    assert.deepEqual(await readRange(secondPath, 'bytes=0-79'), {
      status: 206,
      bytes: adjacent,
      range: 'bytes 0-79/80',
      length: '80',
    });
    assert.equal(fixture.videoHeld(), true);
    first.destroy();
    const deadline = Date.now() + 2_000;
    while (fixture.videoHeld() && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(fixture.videoHeld(), false);
    assert.deepEqual(await readRange(firstPath, 'bytes=100-199'), {
      status: 206,
      bytes: video.subarray(100),
      range: 'bytes 100-199/200',
      length: '100',
    });
    const ranges = fixture
      .snapshot()
      .events.filter((event) => [firstPath, secondPath].includes(event.path));
    assert.deepEqual(
      ranges.map(({ path, range, status, result }) => ({ path, range, status, result })),
      [
        { path: firstPath, range: { start: 0, end: 199 }, status: 206, result: 'aborted' },
        { path: secondPath, range: { start: 0, end: 79 }, status: 206, result: 'served' },
        { path: firstPath, range: { start: 100, end: 199 }, status: 206, result: 'served' },
      ]
    );
    assert(ranges[0]!.atMs < ranges[1]!.finishedAtMs!);
    assert(ranges[1]!.atMs < ranges[0]!.closedAtMs!);
  } finally {
    first.destroy();
    fixture.abortVideoHold();
    fixture.destroyActive();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
