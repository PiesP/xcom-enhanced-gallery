// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { HttpRequestDetails, HttpRequestResponse } from '@platform/types';
import { downloadSingleFile } from '@shared/services/download/single-download';
import {
  markDomImageOriginalProbeLimit,
  resolveDomImageOriginal,
  resolveDomImagesForDownload,
} from '@shared/services/media-extraction/extractors/dom-image-original';
import type { MediaInfo } from '@shared/types/media.types';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const mock = vi.hoisted(() => ({
  request: vi.fn<(details: HttpRequestDetails) => { abort(): void }>(),
  download: vi.fn(),
}));
vi.mock('@platform/index', () => ({
  getHttpRequestAdapter: () => ({ request: mock.request }),
  getDownloadAdapter: () => ({ download: mock.download }),
}));

const display = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?format=webp&name=small&foo=bar';
const original = 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6?foo=bar&format=webp&name=orig';
const media: MediaInfo = {
  id: '222_dom_0',
  type: 'image',
  url: display,
  originalUrl: original,
  tweetId: '222',
  attachmentSourceKey: 'source-80dbfba0ee5b14fb',
  downloadSource: { url: original, quality: 'cdn-original', provenance: 'dom' },
};

function response(url: string, status: number, mime: string, finalUrl = url): HttpRequestResponse {
  return {
    finalUrl,
    readyState: 4,
    status,
    statusText: '',
    responseHeaders: `Content-Type: ${mime}`,
    response: '',
    responseText: '',
    readable: true,
  };
}

afterEach(() => {
  mock.request.mockReset();
  mock.download.mockReset();
  vi.useRealTimers();
});

describe('DOM WebP original resolution', () => {
  it.each([
    ['WebP exists', [200], ['image/webp'], 'webp'],
    ['missing WebP has JPEG', [404, 200], ['text/html', 'image/jpeg'], 'jpg'],
    ['missing JPEG has PNG', [404, 404, 200], ['text/html', 'text/html', 'image/png'], 'png'],
  ])('%s', async (_label, statuses, mimes, selected) => {
    mock.request.mockImplementation((details) => {
      const index = mock.request.mock.calls.length - 1;
      queueMicrotask(() =>
        details.onload?.(response(details.url, statuses[index]!, mimes[index]!))
      );
      return { abort: vi.fn() };
    });
    const resolved = await resolveDomImageOriginal(media);
    expect(mock.request).toHaveBeenCalledTimes(statuses.length);
    expect(
      mock.request.mock.calls.every(
        ([details]) => details.method === 'HEAD' && details.timeout === 1_500
      )
    ).toBe(true);
    expect(resolved.url).toBe(display);
    expect(resolved.tweetId).toBe('222');
    expect(resolved.attachmentSourceKey).toBe(media.attachmentSourceKey);
    expect(resolved.downloadSource).toEqual({
      url: original.replace('format=webp', `format=${selected}`),
      quality: 'cdn-original',
      provenance: 'dom',
    });
    expect(resolved.metadata?.originalSourceResolution).toMatchObject({
      requestedUrl: original,
      selectedUrl: resolved.downloadSource?.url,
    });
  });

  it.each([
    ['forbidden', 403, 'image/webp', undefined],
    ['wrong MIME', 200, 'image/jpeg', undefined],
    [
      'foreign redirect',
      404,
      'text/html',
      'https://pbs.twimg.com/media/OTHER?format=webp&name=orig',
    ],
  ])('does not authorize %s', async (_label, status, mime, redirect) => {
    mock.request.mockImplementation((details) => {
      queueMicrotask(() => details.onload?.(response(details.url, status, mime, redirect)));
      return { abort: vi.fn() };
    });
    const resolved = await resolveDomImageOriginal(media);
    expect(mock.request).toHaveBeenCalledTimes(1);
    expect(resolved.downloadSource).toEqual({
      url: '',
      quality: 'unverified-original',
      provenance: 'dom',
    });
    expect(resolved.metadata?.originalSourceResolution).toMatchObject({ reason: 'probe-failed' });
  });

  it('stops on abort and ignores a late success callback', async () => {
    const controller = new AbortController();
    const abort = vi.fn();
    let details: HttpRequestDetails | undefined;
    mock.request.mockImplementation((request) => {
      details = request;
      return { abort };
    });
    const pending = resolveDomImageOriginal(media, controller.signal);
    controller.abort();
    details?.onload?.(response(original, 200, 'image/webp'));
    const resolved = await pending;
    expect(abort).toHaveBeenCalledOnce();
    expect(resolved.downloadSource?.quality).toBe('unverified-original');
    expect(mock.request).toHaveBeenCalledTimes(1);
  });

  it('settles a timed-out probe even when the manager abort method throws', async () => {
    vi.useFakeTimers();
    const abort = vi.fn(() => {
      throw new Error('Manager abort failed');
    });
    mock.request.mockReturnValue({ abort });
    const pending = resolveDomImageOriginal(media);
    await vi.advanceTimersByTimeAsync(1_500);
    expect((await pending).downloadSource?.quality).toBe('unverified-original');
    expect(abort).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not dispatch a probe for an already cancelled extraction', async () => {
    const controller = new AbortController();
    controller.abort();
    await resolveDomImageOriginal(media, controller.signal);
    expect(mock.request).not.toHaveBeenCalled();
  });

  it.each([
    ['missing final URL', '', 'Content-Type: image/webp'],
    ['duplicate MIME', original, 'Content-Type: image/webp\r\nContent-Type: image/png'],
    ['combined MIME', original, 'Content-Type: image/webp;foo=bar, image/png'],
  ])('keeps %s unverified', async (_label, finalUrl, headers) => {
    mock.request.mockImplementation((details) => {
      queueMicrotask(() =>
        details.onload?.({
          ...response(details.url, 200, 'image/webp'),
          finalUrl,
          responseHeaders: headers,
        })
      );
      return { abort: vi.fn() };
    });
    expect((await resolveDomImageOriginal(media)).downloadSource?.quality).toBe(
      'unverified-original'
    );
    expect(mock.request).toHaveBeenCalledOnce();
  });

  it('leaves JPEG and direct WebP paths untouched', async () => {
    const jpeg = {
      ...media,
      downloadSource: { ...media.downloadSource!, url: original.replace('webp', 'jpg') },
    } as MediaInfo;
    const direct = {
      ...media,
      downloadSource: {
        ...media.downloadSource!,
        url: 'https://pbs.twimg.com/media/HWXMF0bbcAEnfk6.webp?name=orig',
      },
    } as MediaInfo;
    expect(await resolveDomImageOriginal(jpeg)).toBe(jpeg);
    expect(await resolveDomImageOriginal(direct)).toBe(direct);
    expect(mock.request).not.toHaveBeenCalled();
  });

  it('resolves all 20 deferred sources in a bounded queue and names a late single save from JPEG', async () => {
    const items = Array.from({ length: 20 }, (_, index) => {
      const source = original.replace('HWXMF0bbcAEnfk6', `PHOTO${index}`);
      return markDomImageOriginalProbeLimit(
        {
          ...media,
          id: `222_dom_${index}`,
          originalUrl: source,
          tweetUsername: 'author',
          attachmentOrdinal: index,
          downloadSource: { url: source, quality: 'cdn-original', provenance: 'dom' },
        },
        source
      );
    });
    let active = 0;
    let maxActive = 0;
    mock.request.mockImplementation((details) => {
      active++;
      maxActive = Math.max(active, maxActive);
      const format = new URL(details.url).searchParams.get('format');
      const timer = setTimeout(() => {
        active--;
        details.onload?.(
          response(
            details.url,
            format === 'webp' ? 404 : 200,
            format === 'webp' ? 'text/html' : 'image/jpeg'
          )
        );
      }, 0);
      return {
        abort: () => {
          clearTimeout(timer);
          active--;
          details.onabort?.(response(details.url, 0, ''));
        },
      };
    });
    const resolved = await resolveDomImagesForDownload(items);
    expect(maxActive).toBeLessThanOrEqual(4);
    expect(mock.request).toHaveBeenCalledTimes(40);
    expect(resolved).toHaveLength(20);
    expect(resolved.map((item) => item.attachmentOrdinal)).toEqual(
      Array.from({ length: 20 }, (_, i) => i)
    );
    expect(resolved[19]?.downloadSource).toMatchObject({
      url: original.replace('HWXMF0bbcAEnfk6', 'PHOTO19').replace('format=webp', 'format=jpg'),
      quality: 'cdn-original',
    });
    mock.download.mockResolvedValue(undefined);
    const result = await downloadSingleFile(items[19]!);
    expect(result).toMatchObject({ success: true, filename: 'author_222_19.jpg' });
    expect(mock.download).toHaveBeenCalledWith(
      expect.stringContaining('/media/PHOTO19?'),
      'author_222_19.jpg',
      undefined,
      undefined
    );
  });

  it('shares a source probe without merging owner identities and does not cache an aborted attempt', async () => {
    const first = markDomImageOriginalProbeLimit(media, original);
    const second = { ...first, id: '333_dom_9', tweetId: '333', attachmentOrdinal: 9 };
    const controller = new AbortController();
    mock.request.mockImplementation((details) => ({
      abort: () => details.onabort?.(response(details.url, 0, '')),
    }));
    const abandoned = resolveDomImagesForDownload([first, second], controller.signal);
    controller.abort();
    expect(await abandoned).toEqual([first, second]);
    expect(mock.request).toHaveBeenCalledOnce();
    mock.request.mockImplementation((details) => {
      queueMicrotask(() => details.onload?.(response(details.url, 200, 'image/webp')));
      return { abort: vi.fn() };
    });
    const resolved = await resolveDomImagesForDownload([first, second]);
    expect(mock.request).toHaveBeenCalledTimes(2);
    expect(resolved.map((item) => [item.id, item.tweetId, item.attachmentOrdinal])).toEqual([
      ['222_dom_0', '222', undefined],
      ['333_dom_9', '333', 9],
    ]);
    expect(resolved[0]?.downloadSource?.quality).toBe('cdn-original');
    expect(resolved[1]?.downloadSource?.quality).toBe('cdn-original');
  });

  it('retries a failed explicit save check without trusting mismatched deferred metadata', async () => {
    const deferred = markDomImageOriginalProbeLimit(media, original);
    mock.request.mockImplementation((details) => {
      queueMicrotask(() => details.onload?.(response(details.url, 403, 'text/html')));
      return { abort: vi.fn() };
    });
    const failed = (await resolveDomImagesForDownload([deferred]))[0]!;
    expect(failed.downloadSource?.quality).toBe('unverified-original');
    expect(failed.metadata?.originalSourceResolution).toMatchObject({
      requestedUrl: original,
      selectedUrl: null,
      attempts: [{ status: 403 }],
    });
    mock.request.mockImplementation((details) => {
      queueMicrotask(() => details.onload?.(response(details.url, 200, 'image/webp')));
      return { abort: vi.fn() };
    });
    expect((await resolveDomImagesForDownload([failed]))[0]?.downloadSource?.quality).toBe(
      'cdn-original'
    );
    expect(mock.request).toHaveBeenCalledTimes(2);

    const mismatched = {
      ...deferred,
      originalUrl: 'https://pbs.twimg.com/media/DIFFERENT?format=webp&name=orig',
    };
    expect((await resolveDomImagesForDownload([mismatched]))[0]).toBe(mismatched);
    expect(mock.request).toHaveBeenCalledTimes(2);
  });

  it('reports absence only when every same-source encoding is missing', async () => {
    mock.request.mockImplementation((details) => {
      queueMicrotask(() => details.onload?.(response(details.url, 404, 'text/html')));
      return { abort: vi.fn() };
    });
    const resolved = await resolveDomImageOriginal(media);
    expect(mock.request).toHaveBeenCalledTimes(3);
    expect(resolved.metadata?.originalSourceResolution).toMatchObject({ reason: 'not-found' });
  });
});
