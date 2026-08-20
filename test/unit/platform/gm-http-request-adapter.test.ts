// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
import { afterEach, describe, expect, it, vi } from 'vitest';

const xmlHttpRequest = vi.hoisted(() => vi.fn());

vi.mock('@shared/external/userscript/adapter', () => ({
  getUserscript: () => ({ xmlHttpRequest }),
}));

import { GMHttpRequestAdapter } from '@platform/gm-http-request-adapter';

afterEach(() => {
  xmlHttpRequest.mockReset();
});

describe('GMHttpRequestAdapter response bounds', () => {
  it.each([
    { lengthComputable: true, loaded: 1, total: 8 },
    { lengthComputable: false, loaded: 5, total: 0 },
  ])('aborts when progress reports a response larger than the byte limit', (progress) => {
    const abort = vi.fn();
    let gmDetails: GMXMLHttpRequestDetails | undefined;
    xmlHttpRequest.mockImplementation((details: GMXMLHttpRequestDetails) => {
      gmDetails = details;
      return { abort };
    });
    const onload = vi.fn();
    const onerror = vi.fn();

    new GMHttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/example.jpg',
      responseType: 'arraybuffer',
      maxResponseBytes: 4,
      onload,
      onerror,
    });
    gmDetails?.onprogress?.({
      finalUrl: 'https://pbs.twimg.com/media/example.jpg',
      readyState: 3,
      status: 200,
      statusText: 'OK',
      responseHeaders: 'content-length: 8',
      response: null,
      responseText: '',
      context: undefined,
      ...progress,
    });

    expect(abort).toHaveBeenCalledOnce();
    expect(onerror).toHaveBeenCalledWith(
      expect.objectContaining({ statusText: 'RESOURCE_LIMIT' })
    );
    expect(onload).not.toHaveBeenCalled();
  });

  it('forwards progress and load callbacks for a response within the byte limit', () => {
    const abort = vi.fn();
    let gmDetails: GMXMLHttpRequestDetails | undefined;
    xmlHttpRequest.mockImplementation((details: GMXMLHttpRequestDetails) => {
      gmDetails = details;
      return { abort };
    });
    const onload = vi.fn();
    const onerror = vi.fn();
    const onprogress = vi.fn();

    new GMHttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/example.jpg',
      responseType: 'arraybuffer',
      maxResponseBytes: 4,
      onload,
      onerror,
      onprogress,
    });
    const progress = {
      finalUrl: 'https://pbs.twimg.com/media/example.jpg',
      readyState: 3,
      status: 200,
      statusText: 'OK',
      responseHeaders: 'content-length: 4',
      response: null,
      responseText: '',
      context: undefined,
      lengthComputable: true,
      loaded: 4,
      total: 4,
    };
    gmDetails?.onprogress?.(progress);
    gmDetails?.onload?.({
      ...progress,
      readyState: 4,
      response: new ArrayBuffer(4),
    });

    expect(onprogress).toHaveBeenCalledWith(progress);
    expect(onload).toHaveBeenCalledOnce();
    expect(onerror).not.toHaveBeenCalled();
    expect(abort).not.toHaveBeenCalled();
  });
});
