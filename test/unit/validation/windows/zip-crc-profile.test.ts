// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';

import { describe, it } from 'vite-plus/test';

import { createExtensionNativeFixtureHandler } from '../../../../validation/windows/extension-native-loopback.ts';
import { classifyOwnedMediaAbort } from '../../../../validation/windows/zip-crc-profile.ts';

describe('ZIP CRC owned fixture bounds', () => {
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
      classifyOwnedMediaAbort({ ...cached, failure: { ...failure, url: `${url}?other=1` } }),
      null
    );
    assert.equal(
      classifyOwnedMediaAbort({ ...cached, video: { ...video, transitions: [] } }),
      null
    );
  });
});
