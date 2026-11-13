// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { test } from 'vite-plus/test';
import { createExtensionNativeFixtureHandler } from './extension-native-loopback.ts';
import {
  createInstalledLargePhotoFixture,
  largePhotoFixtureMedia,
} from './installed-large-photo-fixture.ts';
import {
  assertDeferredDomOriginalAbsent,
  assertDomPhotoSourceDetails,
  verifyDomNativeProbes,
  verifyDomPhotoCollection,
} from './live-photo-collection.ts';

test('DOM20 source detail requires exact unknown-total and pending/verified state', () => {
  const scope = '20 collected items · the post may contain more';
  assertDomPhotoSourceDetails([scope, 'Original image will be checked when saving'], 'pending');
  assertDomPhotoSourceDetails([scope], 'verified');
  assert.throws(() => assertDomPhotoSourceDetails(['20 photos'], 'verified'));
  assert.throws(() =>
    assertDomPhotoSourceDetails(['19 collected items · the post may contain more'], 'verified')
  );
  assert.throws(() =>
    assertDomPhotoSourceDetails([scope, 'Original image unavailable for saving'], 'pending')
  );
  assert.throws(() =>
    assertDomPhotoSourceDetails([scope, 'Video save quality is unverified'], 'verified')
  );
});

test('a deferred DOM item cannot have an earlier JPEG probe or transfer', () => {
  const event = { method: 'GET', status: 200, result: 'served' };
  assertDeferredDomOriginalAbsent(
    [{ ...event, sourceUrl: '/media/XegDom12?format=webp&name=large' }],
    12
  );
  for (const method of ['HEAD', 'GET']) {
    assert.throws(() =>
      assertDeferredDomOriginalAbsent(
        [{ ...event, method, sourceUrl: '/media/XegDom12?format=jpg&name=orig' }],
        12
      )
    );
  }
});
import { createUserscriptFixtureHandler } from './userscript-loopback.ts';

test('installed DOM20 source keeps owner-local identity and exact missing WebP/JPEG originals', async () => {
  const source = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const data = createInstalledLargePhotoFixture(source);
  assert.equal(data.contract.requested.handle, data.contract.directQuote?.handle);
  assert.notEqual(data.contract.requested.statusId, data.contract.directQuote?.statusId);
  assert(data.contract.expected.every((item) => item.filename.includes('__')));
  assert.equal(data.dom.photos.length, 20);
  for (const [ordinal, photo] of data.dom.photos.entries()) {
    const quoted = data.photos[ordinal]!;
    assert(!photo.bytes.equals(quoted.bytes), `DOM owner reused quote bytes at ${ordinal}`);
    assert(!photo.previewBytes.equals(quoted.previewBytes));
    assert.notEqual(photo.reference.sha256, quoted.reference.sha256);
    assert(!photo.previewBytes.equals(photo.bytes));
  }
  const owner = data.dom.contract.requested;
  const tiles = data.dom.photos.map((photo) => ({
    href: `https://x.com/${owner.handle}/status/${owner.statusId}/photo/${photo.ordinal + 1}`,
    displayUrl: photo.displayUrl,
  }));
  const gallery = {
    total: 20,
    truncated: false,
    entries: data.dom.photos.map((photo, index) => ({
      index,
      mediaId: photo.mediaId,
      displayUrl: photo.displayUrl,
    })),
  };
  assert.equal(verifyDomPhotoCollection(data.dom.contract, tiles, gallery).length, 20);
  assert.throws(() => verifyDomPhotoCollection(data.dom.contract, tiles.slice(0, 12), gallery));
  assert.throws(() =>
    verifyDomPhotoCollection(
      data.dom.contract,
      [
        ...tiles.slice(0, 12),
        {
          ...tiles[12]!,
          href: tiles[12]!.href.replace(owner.statusId, data.contract.requested.statusId),
        },
        ...tiles.slice(13),
      ],
      gallery
    )
  );
  assert.throws(() =>
    verifyDomPhotoCollection(data.dom.contract, tiles, {
      ...gallery,
      entries: [
        ...gallery.entries.slice(0, 12),
        { ...gallery.entries[12]!, displayUrl: gallery.entries[11]!.displayUrl },
        ...gallery.entries.slice(13),
      ],
    })
  );

  const missing = largePhotoFixtureMedia(
    data.dom.photos,
    'https://pbs.twimg.com/media/XegDom12?format=webp&name=orig',
    'fetch'
  );
  assert.equal(missing.purpose, 'missing-original');
  assert.equal(
    largePhotoFixtureMedia(
      data.dom.photos,
      'https://pbs.twimg.com/media/XegDom12?format=jpg&name=orig',
      'fetch'
    ).purpose,
    'original'
  );
  const preview = largePhotoFixtureMedia(
    data.dom.photos,
    'https://pbs.twimg.com/media/XegDom12?format=webp&name=large',
    'image'
  );
  assert.equal(preview.purpose, 'preview');
  assert(!preview.bytes.equals(data.dom.photos[12]!.bytes), 'Preview reused original bytes');
  assert.throws(() =>
    largePhotoFixtureMedia(
      data.dom.photos,
      'https://pbs.twimg.com/media/XegDom12?format=png&name=orig',
      'fetch'
    )
  );

  const native = createExtensionNativeFixtureHandler();
  native.setPayloads(
    [source, source, source],
    Object.fromEntries(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
        name,
        Buffer.from('video'),
      ])
    )
  );
  native.setLargePhotos(data.originals);
  native.setLargeDomPhotos(data.dom.originals);
  assert.throws(() => native.setLargeDomPhotos(data.dom.originals));
  const server = createServer(native.handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const read = (path: string, method: 'GET' | 'HEAD') =>
    new Promise<{ status: number | undefined; mime: string | undefined; bytes: Buffer }>(
      (resolve, reject) => {
        const outgoing = request(
          {
            hostname: '127.0.0.1',
            port: address.port,
            path,
            method,
            headers: { Host: 'pbs.twimg.com' },
          },
          (incoming) => {
            const parts: Buffer[] = [];
            incoming.on('data', (part: Buffer) => parts.push(part));
            incoming.once('error', reject);
            incoming.once('end', () =>
              resolve({
                status: incoming.statusCode,
                mime: incoming.headers['content-type'],
                bytes: Buffer.concat(parts),
              })
            );
          }
        );
        outgoing.once('error', reject);
        outgoing.end();
      }
    );
  try {
    for (let ordinal = 0; ordinal < 20; ordinal++) {
      const key = `XegDom${String(ordinal).padStart(2, '0')}`;
      assert.deepEqual(await read(`/media/${key}?format=webp&name=orig`, 'HEAD'), {
        status: 404,
        mime: undefined,
        bytes: Buffer.alloc(0),
      });
      assert.deepEqual(await read(`/media/${key}?format=jpg&name=orig`, 'HEAD'), {
        status: 200,
        mime: 'image/jpeg',
        bytes: Buffer.alloc(0),
      });
    }
    assert.deepEqual(await read('/media/XegDom12?format=jpg&name=orig', 'GET'), {
      status: 200,
      mime: 'image/jpeg',
      bytes: data.dom.photos[12]!.bytes,
    });
    const events = native.snapshot().events;
    verifyDomNativeProbes(
      { events: [] },
      { events, domProbePeak: native.snapshot().domProbePeak },
      12,
      true
    );
    assert.equal(native.snapshot().unexpectedCount, 0);
    assert.deepEqual(await read('/media/XegLargeA00.jpg?format=jpg&name=orig', 'GET'), {
      status: 404,
      mime: undefined,
      bytes: Buffer.alloc(0),
    });
    assert.equal(native.snapshot().unexpectedCount, 1, 'Retired API40 originals remain reachable');
  } finally {
    native.destroyActive();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test('DOM20 probe receipt rejects changed status, incomplete transfer, and an unbounded queue', () => {
  const base = {
    sourceUrl: '/media/XegDom12?format=webp&name=orig',
    method: 'HEAD',
    status: 404,
    result: 'http-failure',
  };
  const jpeg = {
    ...base,
    sourceUrl: '/media/XegDom12?format=jpg&name=orig',
    status: 200,
    result: 'served',
  };
  const transfer = { ...jpeg, method: 'GET' };
  verifyDomNativeProbes(
    { events: [] },
    { events: [base, jpeg, transfer], domProbePeak: 4 },
    12,
    true
  );
  assert.throws(() =>
    verifyDomNativeProbes({ events: [] }, { events: [base, jpeg], domProbePeak: 4 }, 12, true)
  );
  assert.throws(() =>
    verifyDomNativeProbes(
      { events: [] },
      { events: [{ ...base, status: 403 }, jpeg, transfer], domProbePeak: 4 },
      12,
      true
    )
  );
  assert.throws(() =>
    verifyDomNativeProbes(
      { events: [] },
      { events: [base, jpeg, transfer], domProbePeak: 5 },
      12,
      true
    )
  );
});

test('installed manager DOM20 transport denies its fresh API owner and probes exact original formats', async () => {
  const source = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const data = createInstalledLargePhotoFixture(source);
  const userscript = createUserscriptFixtureHandler(
    Object.fromEntries(
      ['normal', 'failure', 'partial', 'held'].map((name, cohort) => [
        name,
        [0, 1, 2].map(
          (index) => `Abc${String(cohort).padStart(2, '0')}${String(index).padStart(2, '0')}123456`
        ),
      ])
    ),
    '/profile_images/123456789/public-avatar.jpg'
  );
  userscript.setImages([source, source, source]);
  userscript.setLargePhotos(data.originals, data.apiResponses);
  userscript.setLargeDomPhotos(data.dom.originals, data.dom.contract.requested.statusId);
  const server = createServer(userscript.handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const read = (host: string, path: string, method: 'GET' | 'HEAD') =>
    new Promise<{ status: number | undefined; mime: string | undefined; bytes: Buffer }>(
      (resolve, reject) => {
        const outgoing = request(
          {
            hostname: '127.0.0.1',
            port: address.port,
            path,
            method,
            headers: { Host: host },
          },
          (incoming) => {
            const parts: Buffer[] = [];
            incoming.on('data', (part: Buffer) => parts.push(part));
            incoming.once('error', reject);
            incoming.once('end', () =>
              resolve({
                status: incoming.statusCode,
                mime: incoming.headers['content-type'],
                bytes: Buffer.concat(parts),
              })
            );
          }
        );
        outgoing.once('error', reject);
        outgoing.end();
      }
    );
  try {
    const id = data.dom.contract.requested.statusId;
    const path = `/i/api/graphql/fixture/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: id }))}`;
    assert.deepEqual(await read('x.com', path, 'GET'), {
      status: 403,
      mime: 'application/json',
      bytes: Buffer.from('{}'),
    });
    assert.deepEqual(await read('pbs.twimg.com', '/media/XegDom19?format=webp&name=orig', 'HEAD'), {
      status: 404,
      mime: undefined,
      bytes: Buffer.alloc(0),
    });
    assert.deepEqual(await read('pbs.twimg.com', '/media/XegDom19?format=jpg&name=orig', 'HEAD'), {
      status: 200,
      mime: 'image/jpeg',
      bytes: Buffer.alloc(0),
    });
    assert.deepEqual(await read('pbs.twimg.com', '/media/XegDom19?format=jpg&name=orig', 'GET'), {
      status: 200,
      mime: 'image/jpeg',
      bytes: data.dom.photos[19]!.bytes,
    });
    const snapshot = userscript.snapshot();
    assert.equal(snapshot.unexpectedCount, 0);
    verifyDomNativeProbes({ events: [] }, snapshot, 19, true);
    assert(
      snapshot.events.some(
        (event) => event.cohort === 'large-dom-api' && event.result === 'http-403'
      )
    );
  } finally {
    userscript.destroyActive();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

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
    assert.deepEqual(await read('/media/GkE1234ABCDEF.jpg?format=jpg&name=orig'), {
      status: 200,
      bytes: Buffer.from('base'),
    });
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

for (const adjacentFirst of [false, true]) {
  test(`owned ranges overlap when ${adjacentFirst ? 'B' : 'A'} reaches the server first`, async () => {
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
    const otherId = '4666000111222333889';
    fixture.setRecoveryPayloads({ tweetId, validMp4: video, badMp4: video, adjacentMp4: adjacent });
    fixture.setRecoveryPayloads({ tweetId: otherId, validMp4: video, badMp4: video });
    const firstPath = `/ext_tw_video/${tweetId}/pu/vid/320x180/video-0-best.mp4`;
    const secondPath = `/ext_tw_video/${tweetId}/pu/vid/320x180/video-1-best.mp4`;
    const wrongPath = `/ext_tw_video/${tweetId}/pu/vid/320x180/video-2-best.mp4`;
    const otherPath = `/ext_tw_video/${otherId}/pu/vid/320x180/video-1-best.mp4`;
    assert.throws(
      () => fixture.armFirstVideoHold(firstPath, 100, { afterRequestPath: otherPath }),
      /share the held video owner/u
    );
    fixture.armFirstVideoHold(firstPath, 100, { afterRequestPath: secondPath });
    const server = createServer(fixture.handle);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      headers: { Host: 'video.twimg.com' },
    };
    let onAdjacentHeaders = () => {};
    const readRange = (path: string, range: string, method = 'GET') =>
      new Promise<{ status: number | undefined; bytes: Buffer; range: string; length: string }>(
        (resolve, reject) => {
          const outgoing = request(
            { ...options, method, path, headers: { ...options.headers, Range: range } },
            (incoming) => {
              if (path === secondPath && method === 'GET') {
                onAdjacentHeaders();
              }
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
    try {
      let earlyAdjacent: ReturnType<typeof readRange> | undefined;
      if (adjacentFirst) {
        const headers = new Promise<void>((resolve) => {
          onAdjacentHeaders = resolve;
        });
        let completed = false;
        earlyAdjacent = readRange(secondPath, 'bytes=0-79').then((result) => {
          completed = true;
          return result;
        });
        await headers;
        assert.equal(fixture.snapshot().events[0]?.result, 'adjacent-held');
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.equal(completed, false, 'B must remain open until A arrives');
      }
      const firstResponse = new Promise<IncomingMessage>((resolve, reject) => {
        first.once('response', resolve);
        first.once('error', reject);
      });
      first.end();
      const incoming = await firstResponse;
      assert.equal(incoming.statusCode, 206);
      assert.equal(incoming.headers['content-range'], 'bytes 0-199/200');
      assert.equal(incoming.headers['content-length'], '200');
      let prefixReceived = false;
      const firstPrefix = new Promise<Buffer>((resolve, reject) => {
        incoming.once('data', (part: Buffer) => {
          prefixReceived = true;
          resolve(part);
        });
        incoming.once('error', reject);
      });
      assert.equal(fixture.videoHeld(), true);
      if (!adjacentFirst) {
        assert.deepEqual(await readRange(wrongPath, 'bytes=0-199'), {
          status: 206,
          bytes: video,
          range: 'bytes 0-199/200',
          length: '200',
        });
        assert.deepEqual(await readRange(otherPath, 'bytes=0-199'), {
          status: 206,
          bytes: video,
          range: 'bytes 0-199/200',
          length: '200',
        });
        assert.deepEqual(await readRange(secondPath, 'bytes=0-79', 'HEAD'), {
          status: 206,
          bytes: Buffer.alloc(0),
          range: 'bytes 0-79/80',
          length: '80',
        });
        assert.equal((await readRange(secondPath, 'bytes=80-81')).status, 416);
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.equal(prefixReceived, false);
        assert.equal(fixture.snapshot().events[0]?.prefixBytesQueued, undefined);
      }
      assert.deepEqual(await (earlyAdjacent ?? readRange(secondPath, 'bytes=0-79')), {
        status: 206,
        bytes: adjacent,
        range: 'bytes 0-79/80',
        length: '80',
      });
      assert.deepEqual(await firstPrefix, video.subarray(0, 100));
      assert.equal(fixture.videoHeld(), true);
      first.destroy();
      const deadline = Date.now() + 2_000;
      while (fixture.videoHeld() && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.equal(fixture.videoHeld(), false);
      const events = fixture.snapshot().events;
      const firstEvent = events.find((event) => event.path === firstPath);
      const adjacentEvent = events.find(
        (event) => event.path === secondPath && event.method === 'GET'
      );
      assert(firstEvent && adjacentEvent);
      assert.equal(firstEvent.result, 'aborted');
      assert.equal(firstEvent.prefixBytesQueued, 100);
      assert(firstEvent.atMs < adjacentEvent.finishedAtMs!);
      assert.equal(adjacentEvent.atMs < firstEvent.atMs, adjacentFirst);
      assert(adjacentEvent.atMs < firstEvent.firstByteQueuedAtMs!);
      assert(adjacentEvent.atMs < firstEvent.closedAtMs!);
      assert.equal(adjacentEvent.result, 'served');
      assert.equal(fixture.snapshot().activeCount, 0);
    } finally {
      first.destroy();
      fixture.abortVideoHold();
      fixture.destroyActive();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
}
