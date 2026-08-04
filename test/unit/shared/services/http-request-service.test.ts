// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { HttpRequestControl, HttpRequestDetails } from '@platform/types';
import { HttpRequestService } from '@shared/services/http-request-service';

const mocks = vi.hoisted(() => ({
  request: vi.fn<(details: HttpRequestDetails) => HttpRequestControl>(),
}));

vi.mock('@platform/index', () => ({
  getHttpRequestAdapter: () => ({ request: mocks.request }),
}));

describe('HttpRequestService', () => {
  beforeEach(() => {
    mocks.request.mockReset();
  });

  it('removes the abort listener after a successful response', async () => {
    const controller = new AbortController();
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');
    mocks.request.mockImplementation((details) => {
      details.onload?.({
        finalUrl: 'https://api.x.com/2/example',
        readyState: 4,
        status: 200,
        statusText: 'OK',
        responseHeaders: '',
        response: { value: 1 },
        responseText: '',
      });
      return { abort: vi.fn() };
    });

    await expect(
      new HttpRequestService().get<{ value: number }>('https://api.x.com/2/example', {
        signal: controller.signal,
      })
    ).resolves.toEqual({ ok: true, status: 200, data: { value: 1 } });
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('preserves a pre-aborted signal reason and removes its listener', async () => {
    const controller = new AbortController();
    const reason = new Error('already cancelled');
    controller.abort(reason);
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');

    await expect(
      new HttpRequestService().get('https://api.x.com/2/example', {
        signal: controller.signal,
      })
    ).rejects.toBe(reason);
    expect(mocks.request).not.toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('removes the abort listener when the adapter throws synchronously', async () => {
    const controller = new AbortController();
    const error = new Error('invalid request');
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');
    mocks.request.mockImplementation(() => {
      throw error;
    });

    await expect(
      new HttpRequestService().get('https://invalid.example/path', {
        signal: controller.signal,
      })
    ).rejects.toBe(error);
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('aborts the active request and preserves the live signal reason', async () => {
    const controller = new AbortController();
    const reason = new DOMException('cancelled by caller', 'AbortError');
    const abort = vi.fn();
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');
    mocks.request.mockReturnValue({ abort });

    const rejection = expect(
      new HttpRequestService().get('https://api.x.com/2/example', {
        signal: controller.signal,
      })
    ).rejects.toBe(reason);
    controller.abort(reason);

    await rejection;
    expect(abort).toHaveBeenCalledOnce();
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});
