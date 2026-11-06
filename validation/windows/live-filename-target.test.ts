// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import {
  admitReportedLiveFilenameInstall,
  isLiveFilenameOriginal,
  parseLiveFilenameSelector,
} from './live-filename-target.ts';

const jeppi = {
  pageUrl: 'https://x.com/Jeppi_tan/status/2118423501095030841',
  mediaBasename: 'HWYmWugaUAAi_4m',
};

describe('live filename target', () => {
  it('admits the exact Edge userscript target and preserves the old Chrome extension entry', () => {
    const explicit = { scenario: 'reported-live-filename', target: jeppi };
    expect(admitReportedLiveFilenameInstall({
      selector: explicit,
      browserName: 'msedge',
      installation: 'userscript',
      liveUrls: [jeppi.pageUrl],
    })).toEqual(jeppi);
    const legacy = { scenario: 'reported-live-filename' };
    expect(admitReportedLiveFilenameInstall({
      selector: legacy,
      browserName: 'chrome',
      installation: 'extension',
      liveUrls: ['https://x.com/yukurach/status/2118323627615785399'],
    }).mediaBasename).toBe('HWXMF0bbcAEnfk6');
    for (const options of [
      { selector: legacy, browserName: 'msedge', installation: 'userscript', liveUrls: [jeppi.pageUrl] },
      { selector: explicit, browserName: 'firefox', installation: 'userscript', liveUrls: [jeppi.pageUrl] },
      { selector: explicit, browserName: 'msedge', installation: 'userscript', liveUrls: [] },
      { selector: explicit, browserName: 'msedge', installation: 'userscript', liveUrls: [jeppi.pageUrl, jeppi.pageUrl] },
      { selector: explicit, browserName: 'msedge', installation: 'userscript', liveUrls: ['https://x.com/other/status/1'] },
    ]) {
      expect(() => admitReportedLiveFilenameInstall(options)).toThrow();
    }
  });

  it('keeps the historical no-target selector and admits one exact task target', () => {
    expect(parseLiveFilenameSelector({ scenario: 'reported-live-filename' }).mediaBasename).toBe(
      'HWXMF0bbcAEnfk6'
    );
    expect(
      parseLiveFilenameSelector({ scenario: 'reported-live-filename', target: jeppi })
    ).toEqual(jeppi);
    for (const target of [
      { ...jeppi, pageUrl: jeppi.pageUrl + '/photo/1' },
      { ...jeppi, pageUrl: 'http://x.com/Jeppi_tan/status/2118423501095030841' },
      { ...jeppi, mediaBasename: '../other' },
      { ...jeppi, extra: true },
    ]) {
      expect(() =>
        parseLiveFilenameSelector({ scenario: 'reported-live-filename', target })
      ).toThrow();
    }
  });

  it('matches the configured original without accepting another media or query', () => {
    const original = 'https://pbs.twimg.com/media/HWYmWugaUAAi_4m?format=jpg&name=orig';
    expect(isLiveFilenameOriginal(original, jeppi)).toBe(true);
    expect(isLiveFilenameOriginal(original.replace('HWYmWugaUAAi_4m', 'other'), jeppi)).toBe(false);
    expect(isLiveFilenameOriginal(original.replace('name=orig', 'name=large'), jeppi)).toBe(false);
    expect(isLiveFilenameOriginal(original + '&other=1', jeppi)).toBe(false);
  });
});
