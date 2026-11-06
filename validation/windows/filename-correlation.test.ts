// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  compareObservedFilenames,
  assertReportedLiveFilenameTarget,
  isReportedLiveDownloadSource,
  resolveFilenameCaptureLine,
  selectedLivePreferredSource,
  verifyFilenameCorrelation,
} from './filename-correlation.ts';

const expectedUrl = 'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=orig';
const urlHash = createHash('sha256').update(expectedUrl).digest('hex');
const source = `function other() {
  const filename = generateMediaFilename(media, { nowMs: Date.now() });
}
async function downloadSingleFile(media, options = {}) {
  const filename = generateMediaFilename(media, { nowMs: Date.now() });
  if (options.blob) return filename;
}
function next() {}
`;

describe('filename correlation diagnostic', () => {
  it('uses an explicit Jeppi target without admitting the historical attachment', () => {
    const target = {
      pageUrl: 'https://x.com/Jeppi_tan/status/2118423501095030841',
      mediaBasename: 'HWYmWugaUAAi_4m',
    };
    const source = 'https://pbs.twimg.com/media/HWYmWugaUAAi_4m?format=jpg&name=orig';
    expect(() => assertReportedLiveFilenameTarget(target.pageUrl, source, target)).not.toThrow();
    expect(isReportedLiveDownloadSource(source, target)).toBe(true);
    expect(isReportedLiveDownloadSource(source)).toBe(false);
    expect(() => assertReportedLiveFilenameTarget(target.pageUrl, source)).toThrow();
    expect(selectedLivePreferredSource({ downloadSource: { url: source } }, target)).toBe(source);
  });

  it('confines live correlation to the reported public page and original photo', () => {
    const page = 'https://x.com/yukurach/status/2118323627615785399';
    const source = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?format=webp&name=orig';
    expect(() => assertReportedLiveFilenameTarget(page, source)).not.toThrow();
    for (const format of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
      expect(
        isReportedLiveDownloadSource(
          `https://pbs.twimg.com/media/HWXMF0bbcAEnfk6.${format}?format=${format}&name=orig`
        )
      ).toBe(true);
    }
    for (const [target, url] of [
      [page + '/photo/1', source],
      [page, source.replace('HWXMF0bbcAEnfk6', 'OtherPhoto')],
      [page, source + '&format=png'],
      [page, source.replace('name=orig', 'name=small')],
      [page, source.replace('format=webp', 'format=svg')],
      [page, source.replace('HWXMF0bbcAEnfk6?', 'HWXMF0bbcAEnfk6.jpg?')],
      [page, source.replace('https://', 'https://user@')],
      [page, source + '#fragment'],
    ]) {
      expect(() => assertReportedLiveFilenameTarget(target!, url!)).toThrow();
    }
  });

  it('uses the exact selected original URL even when its query order differs from the rendered image', () => {
    const preferred = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?name=orig&format=webp';
    const media = {
      url: 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6.jpg?format=jpg&name=medium',
      originalUrl: 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?format=jpg&name=large',
      downloadSource: { url: preferred, quality: 'original' },
    };
    expect(selectedLivePreferredSource(media)).toBe(preferred);
    expect(isReportedLiveDownloadSource(preferred)).toBe(true);
    expect(() => selectedLivePreferredSource({ ...media, downloadSource: null })).toThrow();
    expect(isReportedLiveDownloadSource(preferred + '&token=private')).toBe(false);
    expect(isReportedLiveDownloadSource(preferred.replace('https://', 'https://user@'))).toBe(
      false
    );
  });

  it('binds to the line after the sole downloadSingleFile generation site', () => {
    expect(resolveFilenameCaptureLine(source).lineNumber).toBe(5);
    expect(() =>
      resolveFilenameCaptureLine(source.replace('if (options.blob)', 'if (options.other)'))
    ).toThrow();
    expect(() =>
      resolveFilenameCaptureLine(
        source.replace(
          'function next() {}',
          `async function downloadSingleFile(media) {\n  const filename = generateMediaFilename(media, { nowMs: Date.now() });\n  if (options.blob) return filename;\n}`
        )
      )
    ).toThrow();
  });

  it('proves ownership through the observed request, native ID, and persisted binding even when names diverge', () => {
    const input = {
      expectedUrl,
      extensionId: 'installed-extension',
      expectedOwnerTabId: 42,
      requests: [
        {
          url: expectedUrl,
          requestId: 'actual-request',
          senderTabId: 42,
          filename: 'intended.jpg',
          mode: 'direct',
        },
      ],
      native: [{ url: expectedUrl, filename: 'different.jpg', saveAs: false, downloadId: 7 }],
      tracking: { 'actual-request': { route: 'direct', downloadId: 7, ownerTabId: 42, urlHash } },
      nativeItem: { id: 7, url: expectedUrl, byExtensionId: 'installed-extension' },
    };
    expect(verifyFilenameCorrelation(input)).toEqual({
      requestId: 'actual-request',
      downloadId: 7,
      ownerTabId: 42,
      urlHash,
    });
    expect(() =>
      verifyFilenameCorrelation({
        ...input,
        tracking: { 'actual-request': { route: 'direct', downloadId: 8, ownerTabId: 42, urlHash } },
      })
    ).toThrow();
    expect(() =>
      verifyFilenameCorrelation({
        ...input,
        nativeItem: { ...input.nativeItem, byExtensionId: 'other-extension' },
      })
    ).toThrow();
    expect(() =>
      verifyFilenameCorrelation({ ...input, requests: [...input.requests, input.requests[0]!] })
    ).toThrow();
    expect(() => verifyFilenameCorrelation({ ...input, expectedOwnerTabId: 99 })).toThrow();
    expect(() =>
      verifyFilenameCorrelation({
        ...input,
        native: [{ ...input.native[0]!, url: 'https://pbs.twimg.com/media/other.jpg' }],
      })
    ).toThrow();
  });

  it('requires all four real names while allowing their values to differ', () => {
    const names = {
      generated: 'wanted.jpg',
      requested: 'wanted.jpg',
      nativeOption: 'cdn.jpg',
      finalBasename: 'cdn (1).jpg',
    };
    expect(compareObservedFilenames(names)).toEqual({
      generatedEqualsRequest: true,
      requestEqualsNativeOption: false,
      nativeOptionEqualsFinal: false,
    });
    for (const key of Object.keys(names) as Array<keyof typeof names>) {
      expect(() => compareObservedFilenames({ ...names, [key]: '' })).toThrow();
      expect(() => compareObservedFilenames({ ...names, [key]: undefined })).toThrow();
    }
  });
});
