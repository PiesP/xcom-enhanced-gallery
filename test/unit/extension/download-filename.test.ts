// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { observeDownloadFilename } from '@extension/download-filename';
import { describe, expect, it } from 'vite-plus/test';

const NAME = 'owner_123_1.jpg';

describe('observed native basename', () => {
  it('recognizes the no-space numeric suffix observed in Firefox native collision saves', () => {
    expect(observeDownloadFilename(NAME, 'C:\\Private\\owner_123_1(1).jpg')).toMatchObject({
      filenameConforms: true,
    });
    for (const observed of [
      'owner_123_1(0).jpg',
      'owner_123_1(01).jpg',
      'owner_123_1(extra).jpg',
      'owner_123_1(1).png',
      'other_123_1(1).jpg',
    ]) {
      expect(observeDownloadFilename(NAME, observed)).toMatchObject({ filenameConforms: false });
    }
  });

  it('separates requested and observed names and permits only native numeric conflict suffixes', () => {
    expect(observeDownloadFilename(NAME, `C:\\Private\\${NAME}`)).toEqual({
      requestedFilename: NAME,
      observedFilename: NAME,
      filenameConforms: true,
    });
    expect(observeDownloadFilename(NAME, 'C:\\Private\\owner_123_1 (2).jpg')).toMatchObject({
      filenameConforms: true,
    });
    expect(observeDownloadFilename(NAME, 'C:\\Private\\fixture.jpg')).toEqual({
      requestedFilename: NAME,
      observedFilename: 'fixture.jpg',
      filenameConforms: false,
    });
    expect(observeDownloadFilename(NAME, 'owner_123_1 (extra).jpg')).toMatchObject({
      filenameConforms: false,
    });
    expect(observeDownloadFilename(NAME, undefined)).toEqual({ requestedFilename: NAME });
  });
});
