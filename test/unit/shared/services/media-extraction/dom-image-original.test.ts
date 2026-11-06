// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { HttpRequestDetails, HttpRequestResponse } from '@platform/types';
import { resolveDomImageOriginal } from '@shared/services/media-extraction/extractors/dom-image-original';
import type { MediaInfo } from '@shared/types/media.types';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const mock = vi.hoisted(() => ({
  request: vi.fn<(details: HttpRequestDetails) => { abort(): void }>(),
}));
vi.mock('@platform/index', () => ({ getHttpRequestAdapter: () => ({ request: mock.request }) }));

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
});
