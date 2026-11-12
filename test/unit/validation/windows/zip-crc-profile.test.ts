// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';

import { describe, it } from 'vite-plus/test';

import { createExtensionNativeFixtureHandler } from '../../../../validation/windows/extension-native-loopback.ts';

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
