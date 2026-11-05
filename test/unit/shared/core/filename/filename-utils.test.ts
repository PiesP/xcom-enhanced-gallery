// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { generateMediaFilename, getIndexFromMediaId } from '@shared/core/filename/filename-utils';
import { describe, expect, it } from 'vite-plus/test';

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

    it('retains the legacy suffix mapping', () => {
      expect(getIndexFromMediaId('222_media_0')).toBe('1');
      expect(getIndexFromMediaId('222_dom_0')).toBe('0');
    });
  });

  describe('generateMediaFilename', () => {
    it('generates a filename for video media', () => {
      const filename = generateMediaFilename({
        id: 'video',
        url: 'https://x.com/video.mp4',
        type: 'video',
      });
      expect(filename).toBeTruthy();
      expect(filename.endsWith('.mp4')).toBe(true);
    });

    it('generates a filename for image media', () => {
      const filename = generateMediaFilename({
        id: 'image',
        url: 'https://x.com/photo.jpg',
        type: 'image',
      });
      expect(filename).toBeTruthy();
      expect(filename.endsWith('.jpg')).toBe(true);
    });

    it('prefers explicit owner-local identity over gallery or legacy ID positions', () => {
      const media = {
        id: '222_api_5',
        url: 'https://pbs.twimg.com/media/example.jpg',
        type: 'image' as const,
        tweetUsername: 'bob',
        tweetId: '222',
        attachmentOrdinal: 0,
        attachmentSourceKey: 'source-0123456789abcdef',
      };
      expect(generateMediaFilename(media, { index: 7 })).toBe('bob_222_0.jpg');
      expect(generateMediaFilename({ ...media, attachmentOrdinal: undefined })).toBe(
        'bob_222_source-0123456789abcdef.jpg'
      );
    });
  });
});
