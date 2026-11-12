// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it } from 'vite-plus/test';

import { createExtensionNativeFixtureHandler } from '../../../../validation/windows/extension-native-loopback.ts';
import {
  classifyOwnedMediaAbort,
  loadZipCrcClips,
  unionCrcKernelUpperBoundMs,
  zipCrcPerformanceEligibility,
} from '../../../../validation/windows/zip-crc-profile.ts';

describe('ZIP CRC owned fixture bounds', () => {
  it('requires exact original files only when the larger workload is selected', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xeg-crc-input-test-'));
    try {
      assert.deepEqual(await loadZipCrcClips(root, 'small'), []);
      await assert.rejects(loadZipCrcClips(root, 'large'), { code: 'ENOENT' });
      const inputs = join(root, 'validation/windows/inputs');
      await mkdir(inputs, { recursive: true });
      for (const [name, bytes] of [
        ['clip', 2_857_140],
        ['motion', 98_399],
        ['small', 5_184],
        ['markers', 31_813],
      ] as const) {
        await writeFile(join(inputs, `crc-owned-${name}.mp4`), Buffer.alloc(bytes));
      }
      await assert.rejects(loadZipCrcClips(root, 'large'), /Owned clip hash differs/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves the small JPEG fixture without any large MP4 routes', async () => {
    const fixture = createExtensionNativeFixtureHandler();
    fixture.setZipCrcProfile({
      smallHtml: '<!doctype html><title>small</title>',
      smallApi: {},
      largeHtml: '<!doctype html><title>large</title>',
      largeApi: {},
      images: [Buffer.from('a'), Buffer.from('b'), Buffer.from('c')],
      displayImages: [Buffer.from('a'), Buffer.from('b'), Buffer.from('c')],
      clips: [],
    });
    const server = createServer(fixture.handle);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const getStatus = (host: string, path: string) =>
      new Promise<number | undefined>((resolve, reject) => {
        const outgoing = request(
          { hostname: '127.0.0.1', port: address.port, path, headers: { Host: host } },
          (incoming) => {
            incoming.resume();
            incoming.once('end', () => resolve(incoming.statusCode));
            incoming.once('error', reject);
          }
        );
        outgoing.once('error', reject);
        outgoing.end();
      });
    try {
      assert.equal(await getStatus('x.com', '/testuser/status/1234567890123456789'), 200);
      assert.equal(
        await getStatus('pbs.twimg.com', '/media/GkE1234ABCDEF.jpg?format=jpg&name=orig'),
        200
      );
      assert.equal(await getStatus('x.com', '/crc_fixture/status/4666000000000000534'), 404);
      assert.equal(
        await getStatus(
          'video.twimg.com',
          '/ext_tw_video/4666000000000000534/pu/vid/640x360/crc-0.mp4'
        ),
        404
      );
      assert.equal(fixture.snapshot().unexpectedCount, 2);
    } finally {
      fixture.destroyActive();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });

  it('rejects an oversized or wrong-hash clip before admitting any native route', () => {
    const fixture = createExtensionNativeFixtureHandler();
    const input = {
      smallHtml: '<!doctype html><title>small</title>',
      smallApi: {},
      largeHtml: '<!doctype html><title>large</title>',
      largeApi: {},
      images: [Buffer.from('a'), Buffer.from('b'), Buffer.from('c')],
      displayImages: [Buffer.from('a'), Buffer.from('b'), Buffer.from('c')],
    };
    assert.throws(
      () =>
        fixture.setZipCrcProfile({
          ...input,
          clips: [
            Buffer.alloc(2_857_141),
            Buffer.alloc(98_399),
            Buffer.alloc(5_184),
            Buffer.alloc(31_813),
          ],
        }),
      /2857140/u
    );
    assert.throws(
      () =>
        fixture.setZipCrcProfile({
          ...input,
          clips: [
            Buffer.alloc(2_857_140),
            Buffer.alloc(98_399),
            Buffer.alloc(5_184),
            Buffer.alloc(31_813),
          ],
        }),
      /352daf37/u
    );
    assert.equal(fixture.snapshot().requests, 0);
    assert.equal(fixture.snapshot().servedBytes, 0);
  });
});

describe('ZIP CRC sample admission', () => {
  it('requires observed warm-cache qualification after functional success', () => {
    assert.deepEqual(zipCrcPerformanceEligibility(0, true, null), {
      eligible: true,
      reason: 'first-use',
    });
    assert.deepEqual(zipCrcPerformanceEligibility(1, true, true), {
      eligible: true,
      reason: 'warm-cache-qualified',
    });
    assert.deepEqual(zipCrcPerformanceEligibility(1, true, false), {
      eligible: false,
      reason: 'warm-cache-unqualified',
    });
    assert.equal(zipCrcPerformanceEligibility(2, true, null).eligible, false);
    assert.equal(zipCrcPerformanceEligibility(0, false, true).eligible, false);
  });

  it('unions CRC table and active intervals without double counting overlap', () => {
    assert.equal(
      unionCrcKernelUpperBoundMs([
        { phase: 'crc-table', startMs: 0, endMs: 2, bytes: 0 },
        { phase: 'crc-active', startMs: 1, endMs: 5, bytes: 4 },
        { phase: 'crc-active', startMs: 4, endMs: 8, bytes: 4 },
        { phase: 'network-fetch', startMs: 0, endMs: 100, bytes: 8 },
      ]),
      8
    );
  });
});

describe('ZIP CRC media abort attribution', () => {
  const url = 'https://video.twimg.com/ext_tw_video/4666000000000000534/pu/vid/640x360/crc-0.mp4';
  const expected = {
    url,
    bytes: 2_857_140,
    sha256: '352daf37b350f50a069c3911b32248c5adb7684ade30b525f6c25685c3b80f5e',
  };
  const servedRange = {
    host: 'video.twimg.com',
    path: new URL(url).pathname,
    method: 'GET',
    status: 206,
    range: { start: 0, end: expected.bytes - 1 },
    bytes: expected.bytes,
    sha256: expected.sha256,
    result: 'served',
  };
  const failure = {
    url,
    method: 'GET',
    resourceType: 'media',
    range: 'bytes=0-',
    startedAtMs: 1,
    phase: 'before-action',
    error: 'net::ERR_ABORTED',
  };
  const video = {
    initial: [{ src: url, currentSrc: url, readyState: 0 }],
    transitions: [{ event: 'loadedmetadata', src: url, currentSrc: url, readyState: 4 }],
    final: [{ src: url, currentSrc: url, readyState: 4 }],
  };
  const input = {
    failure,
    expected,
    video,
    currentBeforeAction: [servedRange],
    currentAfterAction: [],
    priorFromSameFixtureRun: [],
    cacheQualified: false,
  };

  it('distinguishes a current full-range response from a verified cached prior response', () => {
    assert.equal(classifyOwnedMediaAbort(input), 'fresh-206');
    assert.equal(
      classifyOwnedMediaAbort({
        ...input,
        failure: { ...failure, phase: 'gallery-opening' },
        video: {
          initial: [{ src: url, currentSrc: url, readyState: 4 }],
          transitions: [],
          final: [{ src: url, currentSrc: url, readyState: 4 }],
        },
      }),
      'fresh-206'
    );
    assert.equal(
      classifyOwnedMediaAbort({
        ...input,
        currentBeforeAction: [],
        priorFromSameFixtureRun: [servedRange],
        cacheQualified: true,
      }),
      'cached-prior-206'
    );
  });

  it('keeps connection, source, range, and cache mismatches unexplained', () => {
    const cached = {
      ...input,
      currentBeforeAction: [],
      priorFromSameFixtureRun: [servedRange],
      cacheQualified: true,
    };
    assert.equal(classifyOwnedMediaAbort({ ...cached, cacheQualified: false }), null);
    assert.equal(classifyOwnedMediaAbort({ ...cached, currentAfterAction: [servedRange] }), null);
    assert.equal(
      classifyOwnedMediaAbort({
        ...cached,
        priorFromSameFixtureRun: [{ ...servedRange, sha256: 'wrong' }],
      }),
      null
    );
    assert.equal(
      classifyOwnedMediaAbort({
        ...cached,
        failure: { ...failure, error: 'net::ERR_CONNECTION_ABORTED' },
      }),
      null
    );
    assert.equal(
      classifyOwnedMediaAbort({ ...cached, failure: { ...failure, phase: 'action' } }),
      null
    );
    assert.equal(
      classifyOwnedMediaAbort({ ...cached, failure: { ...failure, phase: 'verification' } }),
      null
    );
    assert.equal(
      classifyOwnedMediaAbort({ ...cached, failure: { ...failure, phase: 'navigation' } }),
      null
    );
    assert.equal(
      classifyOwnedMediaAbort({ ...cached, failure: { ...failure, url: `${url}?other=1` } }),
      null
    );
    assert.equal(
      classifyOwnedMediaAbort({ ...cached, video: { ...video, transitions: [] } }),
      null
    );
  });
});
