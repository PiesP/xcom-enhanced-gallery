// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import { selectedLivePreferredSource } from './filename-correlation.ts';
import {
  expectedLiveFilename,
  liveFilenameConforms,
  onlyNewLiveDownload,
} from './live-filename.ts';

describe('reported live filename qualification expectations', () => {
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
      expectedLiveFilename({
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
      expectedLiveFilename({
        tweetUsername: 'dom_owner',
        tweetId: '333',
        attachmentSourceKey: 'source-0123456789abcdef',
        filename: '',
      })
    ).toBe('dom_owner_333_source-0123456789abcdef.jpg');
  });

  it('keeps an explicit safe name and rejects unknown attachment or owner metadata', () => {
    expect(expectedLiveFilename({ filename: 'explicit-original.jpg' })).toBe(
      'explicit-original.jpg'
    );
    expect(() => expectedLiveFilename({ tweetUsername: 'owner', tweetId: '111' })).toThrow();
    expect(() =>
      expectedLiveFilename({ tweetUsername: 'unknown', tweetId: '111', attachmentOrdinal: 0 })
    ).toThrow();
    expect(() => expectedLiveFilename({ filename: '../outside.jpg' })).toThrow();
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
