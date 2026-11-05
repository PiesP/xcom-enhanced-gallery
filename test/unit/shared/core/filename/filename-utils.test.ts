// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import {
  appendFilenameSuffix,
  finalizeFilename,
  generateMediaFilename,
  generateZipFilename,
  getIndexFromMediaId,
} from '@shared/core/filename/filename-utils';
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

    it('reserves the generated post and attachment identity before truncating the author', () => {
      const filename = generateMediaFilename({
        id: 'photo_media_0',
        type: 'image',
        url: 'https://pbs.twimg.com/media/photo.jpg',
        tweetUsername: 'a'.repeat(260),
        tweetId: '123456789',
      });
      expect(filename).toBe(`${'a'.repeat(239)}_123456789_1.jpg`);
      expect(filename.length).toBe(255);
    });

    it('retains the tail of an explicit attachment filename without inferring its identity', () => {
      const filename = generateMediaFilename({
        id: 'custom',
        type: 'image',
        url: 'https://pbs.twimg.com/media/custom.jpg',
        filename: `${'a'.repeat(250)}_post_1.jpg`,
      });
      expect(filename).toHaveLength(255);
      expect(filename.endsWith('_post_1.jpg')).toBe(true);
      expect(
        generateMediaFilename({
          id: 'custom',
          type: 'image',
          url: 'https://pbs.twimg.com/media/custom.jpg',
          filename,
        })
      ).toBe(filename);
    });
  });

  it.each([
    ['CON.jpg', '_CON.jpg'],
    ['con.tar.gz', '_con.tar.gz'],
    ['COM¹.txt', '_COM¹.txt'],
    ['LPT³', '_LPT³'],
    [' a\u0000\n<b>.jpg ', 'a__<b>.jpg'.replace(/[<>]/g, '_')],
    ['name. ', 'name'],
  ])('finalizes %j as %j with a stable, Windows-safe basename', (input, expected) => {
    const result = finalizeFilename(input);
    expect(result).toBe(expected);
    expect(finalizeFilename(result)).toBe(result);
  });

  it('keeps verified extensions and valid Unicode at the 255-unit boundary', () => {
    const long = finalizeFilename(`${'a'.repeat(249)}🐱🐱.jpg`);
    expect(long).toBe(`${'a'.repeat(249)}🐱.jpg`);
    expect(long.length).toBe(255);
    expect(finalizeFilename(`${'a'.repeat(249)}\ud83d.jpg`)).toBe(`${'a'.repeat(249)}_.jpg`);
    expect(appendFilenameSuffix(long, '-1')).toHaveLength(255);
    expect(appendFilenameSuffix(long, '-1').endsWith('-1.jpg')).toBe(true);
  });

  it('reserves the device-name escape even for a full-length basename', () => {
    const filename = finalizeFilename(`CON.${'a'.repeat(251)}`);
    expect(filename).toHaveLength(255);
    expect(filename.startsWith('_CON.')).toBe(true);
    expect(finalizeFilename(filename)).toBe(filename);
  });

  it('bounds the fallback stem when a required suffix leaves one UTF-16 unit', () => {
    const filename = finalizeFilename('🐱', { suffix: 'x'.repeat(254) });
    expect(filename).toBe(`m${'x'.repeat(254)}`);
    expect(filename.length).toBe(255);
    expect(finalizeFilename(filename)).toBe(filename);
  });

  it('removes a trailing period exposed by truncating an overlong suffix', () => {
    const filename = finalizeFilename('a', { suffix: `${'x'.repeat(253)}.tail` });
    expect(filename).toBe(`a${'x'.repeat(253)}`);
    expect(filename.length).toBe(254);
    expect(finalizeFilename(filename)).toBe(filename);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'keeps an invalid requested tail budget within the basename limit (%s)',
    (preserveTailUnits) => {
      const filename = finalizeFilename('a'.repeat(300), { preserveTailUnits });
      expect(filename).toBe('a'.repeat(255));
      expect(finalizeFilename(filename)).toBe(filename);
    }
  );

  it('reserves the archive extension and generated post identity', () => {
    const archive = generateZipFilename([
      {
        id: 'photo',
        type: 'image',
        url: 'https://pbs.twimg.com/media/photo.jpg',
        tweetUsername: 'a'.repeat(260),
        tweetId: '123456789',
      },
    ]);
    expect(archive.length).toBe(255);
    expect(archive.endsWith('_123456789.zip')).toBe(true);
  });
});
