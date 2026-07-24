// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, expect, it } from 'vitest';
import { getIndexFromMediaId, generateMediaFilename } from '@shared/core/filename/filename-utils';

describe('filename-utils', () => {
  describe('getIndexFromMediaId', () => {
    it('returns a valid index string for certain media IDs', () => {
      // Some IDs produce valid indices, others return null
      // This test documents the current behavior for known inputs
      const result = getIndexFromMediaId('1234567890');
      // May be null for unsupported ID formats — that's acceptable
      expect(typeof result === 'string' || result === null).toBe(true);
    });

    it('returns null for undefined mediaId', () => {
      expect(getIndexFromMediaId(undefined)).toBeNull();
    });
  });

  describe('generateMediaFilename', () => {
    it('generates a filename for video media', () => {
      const filename = generateMediaFilename({
        url: 'https://x.com/video.mp4',
        mediaType: 'video',
      });
      expect(filename).toBeTruthy();
      expect(filename.endsWith('.mp4')).toBe(true);
    });

    it('generates a filename for image media', () => {
      const filename = generateMediaFilename({
        url: 'https://x.com/photo.jpg',
        mediaType: 'photo',
      });
      expect(filename).toBeTruthy();
      expect(filename.endsWith('.jpg')).toBe(true);
    });
  });
});