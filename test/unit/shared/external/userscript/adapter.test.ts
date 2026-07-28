import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const abortDownload = vi.fn();
const modernDownload = vi.fn(() => ({ abort: abortDownload }));

beforeAll(() => {
  (globalThis as unknown as Record<string, unknown>).GM = { download: modernDownload };
});

afterAll(() => {
  delete (globalThis as unknown as Record<string, unknown>).GM;
});

import { getUserscript } from '@shared/external/userscript/adapter';

describe('modern GM.download cancellation', () => {
  it('aborts the native handle and removes the signal listener', async () => {
    const controller = new AbortController();
    const addEventListener = vi.spyOn(controller.signal, 'addEventListener');
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');

    const pending = getUserscript().download(
      'https://example.com/video.mp4',
      'video.mp4',
      controller.signal
    );
    const outcome = pending.then(
      () => 'resolved',
      (error: unknown) => (error instanceof Error ? error.name : String(error))
    );

    controller.abort();

    await expect(
      Promise.race([
        outcome,
        new Promise<string>((resolve) => setTimeout(() => resolve('still-pending'), 0)),
      ])
    ).resolves.toBe('AbortError');
    expect(abortDownload).toHaveBeenCalledOnce();
    expect(addEventListener).toHaveBeenCalledWith('abort', expect.any(Function), { once: true });
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});
