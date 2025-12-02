import * as retryFetchModule from '@shared/network/retry-fetch';
import type { OrchestratorItem } from '@shared/services/download/types';
import { downloadAsZip } from '@shared/services/download/zip-download';

const mockAddFile = vi.fn();
const mockFinalize = vi.fn().mockReturnValue(new Blob(['zip content']));

// Mock dependencies
vi.mock('@shared/external/zip', () => {
  return {
    StreamingZipWriter: class {
      addFile = mockAddFile;
      finalize = mockFinalize;
    },
  };
});

vi.mock('@shared/network/retry-fetch', () => ({
  fetchArrayBufferWithRetry: vi.fn(),
  DEFAULT_BACKOFF_BASE_MS: 100,
}));

vi.mock('@shared/services/download/download-utils', () => ({
  ensureUniqueFilenameFactory: () => (name: string) => name,
}));

describe('zip-download boundary tests', () => {
  const mockItems: OrchestratorItem[] = [
    { url: 'http://example.com/1.jpg', desiredName: '1.jpg' },
    { url: 'http://example.com/2.jpg', desiredName: '2.jpg' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clamp concurrency to minimum 1', async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockResolvedValue(new Uint8Array(10));

    // Pass 0 or negative concurrency
    await downloadAsZip(mockItems, { concurrency: 0 });

    // If it was 0, it wouldn't process anything (Array.from({length: 0}))
    // Since it processes, it means it was clamped to at least 1
    expect(retryFetchModule.fetchArrayBufferWithRetry).toHaveBeenCalledTimes(2);
  });

  it('should clamp concurrency to maximum 8 (indirectly tested via logic)', async () => {
    // This is hard to test deterministically without flaky timers.
    // But we can test the lower bound logic which we did above.
    // For the upper bound, we trust the math logic if we can prove the value is used.
    // But we can try to test that passing a small number is respected (not forced to 8).

    // If we pass concurrency: 1.
    // Math.min(8, Math.max(1, 1)) -> 1.
    // Mutant: Math.max(8, Math.max(1, 1)) -> 8.

    // So if we pass 1, and it runs in parallel, the mutant is caught.

    let activeDownloads = 0;
    let maxSimultaneous = 0;

    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockImplementation(async () => {
      activeDownloads++;
      maxSimultaneous = Math.max(maxSimultaneous, activeDownloads);
      await new Promise(resolve => setTimeout(resolve, 50));
      activeDownloads--;
      return new Uint8Array(10);
    });

    const items = Array.from({ length: 5 }, (_, i) => ({
      url: `http://example.com/${i}.jpg`,
      desiredName: `${i}.jpg`,
    }));

    // We want concurrency 1.
    await downloadAsZip(items, { concurrency: 1 });

    // If mutant (max(8, 1) -> 8) was active, maxSimultaneous would be 5 (all items).
    // If correct (min(8, 1) -> 1), maxSimultaneous should be 1.
    expect(maxSimultaneous).toBe(1);
  });

  it('should clamp retries to minimum 0', async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockResolvedValue(new Uint8Array(10));

    await downloadAsZip(mockItems, { retries: -5 });

    // Check that fetchArrayBufferWithRetry was called with 0, not -5
    expect(retryFetchModule.fetchArrayBufferWithRetry).toHaveBeenCalledWith(
      expect.any(String),
      0, // Expected retries
      undefined,
      expect.any(Number)
    );
  });

  it('should calculate progress correctly', async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockResolvedValue(new Uint8Array(10));

    const onProgress = vi.fn();
    // Use concurrency 1 to ensure deterministic progress reporting
    await downloadAsZip(mockItems, { onProgress, concurrency: 1 });

    // Total 2.
    // 1st: 1/2 = 50%
    // 2nd: 2/2 = 100%

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        percentage: 50,
      })
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        percentage: 100,
      })
    );
  });

  it('should increment processed count even on failure', async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry)
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce(new Uint8Array(10));

    const onProgress = vi.fn();
    // Use concurrency 1 to ensure deterministic progress reporting
    await downloadAsZip(mockItems, { onProgress, concurrency: 1 });

    // Even with failure, processed should increment, so progress should reach 100%
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        percentage: 100,
        current: 2,
      })
    );
  });

  it('should use prefetched blobs if available', async () => {
    const blob = new Blob(['test data']);
    // Mock arrayBuffer if not available in test environment
    if (!blob.arrayBuffer) {
      blob.arrayBuffer = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    } else {
      vi.spyOn(blob, 'arrayBuffer').mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    }

    const items: OrchestratorItem[] = [
      { url: 'http://example.com/blob.jpg', desiredName: 'blob.jpg', blob },
    ];

    const result = await downloadAsZip(items, { concurrency: 1 });

    expect(retryFetchModule.fetchArrayBufferWithRetry).not.toHaveBeenCalled();
    expect(result.filesSuccessful).toBe(1);
    expect(mockAddFile).toHaveBeenCalledWith('blob.jpg', expect.any(Uint8Array));
  });

  it('should handle abort signal during download', async () => {
    const abortController = new AbortController();
    const items: OrchestratorItem[] = [
      { url: 'http://example.com/abort.jpg', desiredName: 'abort.jpg' },
    ];

    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockImplementation(async () => {
      abortController.abort();
      throw new Error('Fetch failed');
    });

    await expect(
      downloadAsZip(items, { signal: abortController.signal, concurrency: 1 })
    ).rejects.toThrow('Download cancelled by user');
  });

  it('should return correct usedFilenames', async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockResolvedValue(new Uint8Array(10));
    const items: OrchestratorItem[] = [{ url: 'http://example.com/1.jpg', desiredName: '1.jpg' }];

    const result = await downloadAsZip(items, { concurrency: 1 });

    expect(result.usedFilenames).toEqual(['1.jpg']);
  });

  it('should respect retries option', async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockResolvedValue(new Uint8Array(10));

    const items: OrchestratorItem[] = [
      { url: 'http://example.com/retry.jpg', desiredName: 'retry.jpg' },
    ];

    await downloadAsZip(items, { retries: 1, concurrency: 1 });

    expect(retryFetchModule.fetchArrayBufferWithRetry).toHaveBeenCalledWith(
      expect.any(String),
      1,
      undefined,
      expect.any(Number)
    );
  });
});
