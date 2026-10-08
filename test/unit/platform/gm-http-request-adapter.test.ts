// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const xmlHttpRequest = vi.hoisted(() => vi.fn());

vi.mock('@shared/external/userscript/adapter', () => ({
  getUserscript: () => ({ xmlHttpRequest }),
}));

import { GMHttpRequestAdapter } from '@platform/gm-http-request-adapter';

function invokeTrustedPageHide(persisted: boolean): void {
  const event = { isTrusted: true, persisted } as PageTransitionEvent;
  for (const [type, listener] of vi.mocked(window.addEventListener).mock.calls) {
    if (type === 'pagehide' && typeof listener === 'function') {
      (listener as (event: PageTransitionEvent) => void)(event);
    }
  }
}

beforeEach(() => {
  vi.spyOn(window, 'addEventListener');
});

afterEach(() => {
  invokeTrustedPageHide(false);
  xmlHttpRequest.mockReset();
  vi.restoreAllMocks();
});

describe('GMHttpRequestAdapter response bounds', () => {
  it('keeps an ambiguous synchronous throw unsettled until a late real terminal callback', () => {
    const onerror = vi.fn();
    const onsettled = vi.fn();
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    let gmDetails: GMXMLHttpRequestDetails | undefined;
    xmlHttpRequest.mockImplementation((details: GMXMLHttpRequestDetails) => {
      gmDetails = details;
      throw new Error('GM manager threw after dispatch');
    });

    new GMHttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/example.jpg',
      responseType: 'blob',
      maxResponseBytes: 4,
      onerror,
      onsettled,
    });
    expect(onerror).toHaveBeenCalledWith(expect.objectContaining({ statusText: 'NETWORK_ERROR' }));
    expect(onsettled).not.toHaveBeenCalled();
    expect(addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function));
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    expect(onsettled).not.toHaveBeenCalled();
    gmDetails?.onload?.({
      finalUrl: 'https://pbs.twimg.com/media/example.jpg',
      readyState: 4,
      status: 200,
      statusText: 'OK',
      responseHeaders: '',
      response: new Blob(['late']),
      responseText: '',
      context: undefined,
    });
    expect(onsettled).toHaveBeenCalledOnce();
    expect(removeEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function));
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    expect(onsettled).toHaveBeenCalledOnce();
  });

  it('does not keep a page lifetime observer for a request without an owner callback', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    xmlHttpRequest.mockImplementation(() => { throw new Error('GM manager unavailable'); });
    new GMHttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/example.jpg',
      onerror: vi.fn(),
    });
    expect(addEventListener).not.toHaveBeenCalledWith('pagehide', expect.any(Function));
  });

  it('retains ambiguous ownership through BFCache and settles on ordinary pagehide', () => {
    const onsettled = vi.fn();
    let gmDetails: GMXMLHttpRequestDetails | undefined;
    xmlHttpRequest.mockImplementation((details: GMXMLHttpRequestDetails) => {
      gmDetails = details;
      throw new Error('GM manager threw after dispatch');
    });
    new GMHttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/example.jpg',
      maxResponseBytes: 4,
      onsettled,
    });

    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    expect(onsettled).not.toHaveBeenCalled();
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    expect(onsettled).not.toHaveBeenCalled();
    invokeTrustedPageHide(true);
    expect(onsettled).not.toHaveBeenCalled();
    invokeTrustedPageHide(false);
    expect(onsettled).toHaveBeenCalledOnce();
    gmDetails?.onabort?.({} as never);
    expect(onsettled).toHaveBeenCalledOnce();
  });

  it('reports a progress failure before the native abort and settles only on its terminal callback', () => {
    const abort = vi.fn();
    const onerror = vi.fn();
    const onsettled = vi.fn();
    let gmDetails: GMXMLHttpRequestDetails | undefined;
    xmlHttpRequest.mockImplementation((details: GMXMLHttpRequestDetails) => {
      gmDetails = details;
      return { abort };
    });
    new GMHttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/example.jpg',
      responseType: 'blob',
      maxResponseBytes: 2,
      onerror,
      onsettled,
    });
    const event = {
      finalUrl: 'https://pbs.twimg.com/media/example.jpg',
      readyState: 3,
      status: 200,
      statusText: 'OK',
      responseHeaders: '',
      response: null,
      responseText: '',
      context: undefined,
      lengthComputable: false,
      loaded: 3,
      total: 0,
    };
    gmDetails?.onprogress?.(event);
    expect(onerror).toHaveBeenCalledWith(expect.objectContaining({ statusText: 'RESOURCE_LIMIT' }));
    expect(abort).toHaveBeenCalledOnce();
    expect(onsettled).not.toHaveBeenCalled();
    gmDetails?.onabort?.(event);
    gmDetails?.onload?.({ ...event, readyState: 4, response: new Blob(['abc']) });
    expect(onsettled).toHaveBeenCalledOnce();
  });

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
