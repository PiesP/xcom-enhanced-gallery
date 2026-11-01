// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { test } from 'vite-plus/test';
import { isOperable44CssPxControl } from '../../../validation/windows/control-geometry.ts';

function control(width: number, height: number, hit = true, withinViewport = true) {
  return { rect: { width, height }, hit, withinViewport };
}

test('accepts an exact 44px target and the observed transformed DOMRect precision', () => {
  assert.equal(isOperable44CssPxControl(control(44, 44)), true);
  assert.equal(isOperable44CssPxControl(control(44, 43.999996185302734)), true);
  assert.equal(isOperable44CssPxControl(control(43.999996185302734, 44)), true);
});

test('rejects undersized and nonfinite dimensions', () => {
  for (const size of [43.99, 43, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(isOperable44CssPxControl(control(size, 44)), false, `width ${size}`);
    assert.equal(isOperable44CssPxControl(control(44, size)), false, `height ${size}`);
  }
});

test('still requires a center hit and full viewport containment', () => {
  assert.equal(isOperable44CssPxControl(control(44, 44, false, true)), false);
  assert.equal(isOperable44CssPxControl(control(44, 44, true, false)), false);
});
