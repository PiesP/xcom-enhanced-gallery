import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { HttpRequestService, HttpError } from '../../../src/shared/services/http-request-service';

describe('HttpRequestService error handling (Phase 318)', () => {
  setupGlobalTestIsolation();

  const service = HttpRequestService.getInstance();
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }
  });

  it('preserves HttpError metadata', () => {
    const error = new HttpError('Timeout', 504, 'Gateway Timeout');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('HttpError');
    expect(error.status).toBe(504);
    expect(error.statusText).toBe('Gateway Timeout');
    expect(error.message).toBe('Timeout');
  });

  it('wraps fetch failures in HttpError', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down'));

    await expect(service.get('https://example.com/api')).rejects.toMatchObject({
      name: 'HttpError',
      message: 'Fetch error: Network down',
      status: 0,
      statusText: 'Network Error',
    });
  });

  it('returns parsed JSON data on success', async () => {
    const responsePayload = { data: 'ok' };
    const mockHeaders = new Map<string, string>([['content-type', 'application/json']]);
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        forEach: (callback: (value: string, key: string) => void) => {
          mockHeaders.forEach((value, key) => callback(value, key));
        },
      },
      json: vi.fn().mockResolvedValue(responsePayload),
      text: vi.fn().mockResolvedValue(JSON.stringify(responsePayload)),
    };

    globalThis.fetch = vi.fn().mockResolvedValue(response) as unknown as typeof globalThis.fetch;

    const result = await service.get<typeof responsePayload>('https://example.com/api');

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual(responsePayload);
    expect(result.headers['content-type']).toBe('application/json');
  });
});
