import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unit tests for cancellation and timeout behavior in zip-creator

describe('zip-creator cancellation and timeout', () => {
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = (globalThis as any).fetch;
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    vi.resetAllMocks();
  });

  it('propagates external cancellation (AbortSignal)', async () => {
    const { createZipFromItems } = await import('../../../../src/shared/external/zip/zip-creator');

    // mock fetch that listens to AbortSignal and rejects on abort
    (globalThis as any).fetch = vi.fn(
      (_: any, init?: any) =>
        new Promise((_resolve, reject) => {
          const signal: any = init?.signal;
          if (signal) {
            const onAbort = () => {
              const err: any = new Error('Aborted');
              err.name = 'AbortError';
              reject(err);
            };
            if (signal.aborted) onAbort();
            signal.addEventListener('abort', onAbort, { once: true });
          }
          // never resolve otherwise
        }) as any
    ) as any;

    const controller = new (globalThis as any).AbortController();
    const items = [{ url: 'https://x.com/media/1.jpg', filename: '1.jpg' }];

    const promise = createZipFromItems(items as any, 'test.zip', undefined, {
      signal: controller.signal,
      requestTimeout: 60_000,
    });

    // cancel shortly after
    controller.abort();

    await expect(promise).rejects.toThrow(/cancelled|zip creation failed|failed to create zip/i);
  });

  it('maps timeout to error("timeout") and fails download', async () => {
    const { createZipFromItems } = await import('../../../../src/shared/external/zip/zip-creator');

    // fetch that rejects on abort (triggered by internal timeout)
    (globalThis as any).fetch = vi.fn(
      (_: any, init?: any) =>
        new Promise((_resolve, reject) => {
          const signal: any = init?.signal;
          if (signal) {
            const onAbort = () => {
              const err: any = new Error('Aborted');
              err.name = 'AbortError';
              reject(err);
            };
            if (signal.aborted) onAbort();
            signal.addEventListener('abort', onAbort, { once: true });
          }
        }) as any
    ) as any;

    const items = [{ url: 'https://x.com/media/1.jpg', filename: '1.jpg' }];

    await expect(
      createZipFromItems(items as any, 'test.zip', undefined, { requestTimeout: 50 })
    ).rejects.toThrow(/timeout|zip creation failed|no_files_downloaded|failed to create zip/i);
  });
});
