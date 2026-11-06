// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { selectedLivePreferredSource } from './filename-correlation.ts';
import {
  expectedLiveFilename,
  liveFilenameConforms,
  onlyNewLiveDownload,
  writeLiveFilenameEvidence,
} from './live-filename.ts';

const expectedJpegFilename = (media: Record<string, unknown>) => expectedLiveFilename(media, 'jpg');

describe('reported live filename qualification expectations', () => {
  it('preserves the captured WebP save format and DOM attachment key', () => {
    expect(
      expectedLiveFilename(
        {
          tweetUsername: 'yukurach',
          tweetId: '2118323627615785399',
          attachmentSourceKey: 'source-80dbfba0ee5b14fb',
          filename: '',
        },
        'webp'
      )
    ).toBe('yukurach_2118323627615785399_source-80dbfba0ee5b14fb.webp');
    expect(liveFilenameConforms('owner_222_3 (1).webp', 'owner_222_3.webp')).toBe(true);
    expect(liveFilenameConforms('owner_222_3.webp', 'owner_222_3.jpg')).toBe(false);
  });
  it('uses the captured preferred save URL instead of the display URL', () => {
    const url = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6.jpg?name=orig&format=jpg';
    expect(
      selectedLivePreferredSource({
        url: 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?format=webp&name=small',
        downloadSource: { url },
      })
    ).toBe(url);
    expect(() =>
      selectedLivePreferredSource({ url: url.replace('format=jpg', 'format=webp') })
    ).toThrow();
    expect(() =>
      selectedLivePreferredSource({
        downloadSource: { url: url.replace('HWXMF0bbcAEnfk6', 'another') },
      })
    ).toThrow();
  });

  it('detects additional native saves even when they use a different URL', () => {
    const item = {
      id: 1,
      state: 'complete',
      filename: 'image.jpg',
      url: 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?format=jpg&name=orig',
    };
    expect(onlyNewLiveDownload([item], new Set())).toBe(item);
    expect(() =>
      onlyNewLiveDownload(
        [item, { ...item, id: 2, url: 'https://pbs.twimg.com/media/another.jpg' }],
        new Set()
      )
    ).toThrow();
  });

  it('uses captured quoted ownership and attachment identity rather than the outer status or gallery index', () => {
    expect(
      expectedJpegFilename({
        sourceLocation: 'quoted',
        tweetUsername: 'outer',
        tweetId: '111',
        quotedUsername: 'actual_owner',
        quotedTweetId: '222',
        attachmentOrdinal: 3,
        filename: '',
      })
    ).toBe('actual_owner_222_3.jpg');
    expect(
      expectedJpegFilename({
        tweetUsername: 'dom_owner',
        tweetId: '333',
        attachmentSourceKey: 'source-0123456789abcdef',
        filename: '',
      })
    ).toBe('dom_owner_333_source-0123456789abcdef.jpg');
  });

  it('keeps an explicit safe name and rejects unknown attachment or owner metadata', () => {
    expect(expectedJpegFilename({ filename: 'explicit-original.jpg' })).toBe(
      'explicit-original.jpg'
    );
    expect(() => expectedJpegFilename({ tweetUsername: 'owner', tweetId: '111' })).toThrow();
    expect(() =>
      expectedJpegFilename({ tweetUsername: 'unknown', tweetId: '111', attachmentOrdinal: 0 })
    ).toThrow();
    expect(() => expectedJpegFilename({ filename: '../outside.jpg' })).toThrow();
  });

  it('reports both positive numeric native conflict spellings without accepting unrelated names', () => {
    const requested = 'owner_222_3.jpg';
    for (const actual of [requested, 'owner_222_3 (1).jpg', 'owner_222_3(12).jpg']) {
      expect(liveFilenameConforms(actual, requested)).toBe(true);
    }
    for (const actual of ['HWXMF0bbcAEnfk6.jpg', 'owner_222_3 (0).jpg', 'owner_222_3 (x).jpg']) {
      expect(liveFilenameConforms(actual, requested)).toBe(false);
    }
  });
});

it('retains private evidence once and refuses to overwrite an existing receipt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xeg-live-evidence-'));
  try {
    const path = join(root, 'native.bin');
    const bytes = Buffer.from([0xff, 0xd8, 1, 2, 3]);
    await writeLiveFilenameEvidence(path, bytes);
    expect(await readFile(path)).toEqual(bytes);
    if (process.platform !== 'win32') {
      expect((await stat(path)).mode & 0o777).toBe(0o600);
    }
    await expect(writeLiveFilenameEvidence(path, 'replacement')).rejects.toMatchObject({
      code: 'EEXIST',
    });
    expect(await readFile(path)).toEqual(bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
