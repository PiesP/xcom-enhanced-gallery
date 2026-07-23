import { describe, expect, it, vi } from 'vitest';
import { waitForDownloadComplete } from '@extension/download-completion';

function createDownloads() {
  let listener: ((delta: { id: number; state?: string; error?: string }) => void) | null = null;
  return {
    onChanged: {
      addListener: vi.fn((next) => {
        listener = next;
      }),
      removeListener: vi.fn((next) => {
        if (listener === next) listener = null;
      }),
    },
    search: vi.fn(async () => [{ id: 7, state: 'in_progress' }]),
    emit(delta: { id: number; state?: string; error?: string }): void {
      listener?.(delta);
    },
  };
}

describe('waitForDownloadComplete', () => {
  it('resolves from the current state when the completion event was missed', async () => {
    const downloads = createDownloads();
    downloads.search.mockResolvedValueOnce([{ id: 7, state: 'complete' }]);

    await expect(waitForDownloadComplete(downloads, 7)).resolves.toBeUndefined();
    expect(downloads.onChanged.removeListener).toHaveBeenCalledTimes(1);
  });

  it('continues waiting when the lookup reports an in-progress download', async () => {
    const downloads = createDownloads();
    const pending = waitForDownloadComplete(downloads, 7);

    downloads.emit({ id: 99, state: 'complete' });
    downloads.emit({ id: 7, state: 'complete' });

    await expect(pending).resolves.toBeUndefined();
  });

  it('rejects when the download is interrupted', async () => {
    const downloads = createDownloads();
    const pending = waitForDownloadComplete(downloads, 7);
    downloads.emit({ id: 7, state: 'interrupted', error: 'NETWORK_FAILED' });

    await expect(pending).rejects.toThrow('NETWORK_FAILED');
  });
});
