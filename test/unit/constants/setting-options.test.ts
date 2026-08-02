// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import {
  IMAGE_FIT_MODES,
  THEME_OPTIONS,
  VIDEO_CLICK_MODES,
  isImageFitMode,
  isThemeSetting,
  isVideoClickMode,
} from '@constants/setting-options';
import { describe, expect, it } from 'vitest';

describe('setting-options', () => {
  it('keeps the canonical option order used by settings controls', () => {
    expect(THEME_OPTIONS).toEqual(['auto', 'light', 'dark']);
    expect(IMAGE_FIT_MODES).toEqual(['original', 'fitWidth', 'fitHeight', 'fitContainer']);
    expect(VIDEO_CLICK_MODES).toEqual(['block-all', 'block-controls-only', 'allow-all']);
  });

  it.each(THEME_OPTIONS)('accepts theme option %s', (value) => {
    expect(isThemeSetting(value)).toBe(true);
  });

  it.each(IMAGE_FIT_MODES)('accepts image fit mode %s', (value) => {
    expect(isImageFitMode(value)).toBe(true);
  });

  it.each(VIDEO_CLICK_MODES)('accepts video click mode %s', (value) => {
    expect(isVideoClickMode(value)).toBe(true);
  });

  it.each([
    ['theme', isThemeSetting],
    ['image fit', isImageFitMode],
    ['video click', isVideoClickMode],
  ] as const)('rejects invalid %s values', (_name, guard) => {
    expect(guard('unsupported')).toBe(false);
    expect(guard(1)).toBe(false);
    expect(guard(null)).toBe(false);
  });
});
