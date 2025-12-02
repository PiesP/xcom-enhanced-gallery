import { downloadSingleFile, getGMDownload } from '@shared/services/download/single-download';
import * as fallbackModule from '@shared/services/download/fallback-download';
import * as fileNamingModule from '@shared/services/filename-service';
import type { MediaInfo } from '@shared/types/media.types';
import { globalTimerManager } from '@shared/utils/time/timer-management';

// Mock dependencies
vi.mock('@shared/services/filename-service', () => ({
  generateMediaFilename: vi.fn(),
}));

vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: {
    setTimeout: vi.fn().mockReturnValue(123),
    clearTimeout: vi.fn(),
  },
}));

vi.mock('@shared/services/download/fallback-download', () => ({
  detectDownloadCapability: vi.fn(),
  downloadBlobWithAnchor: vi.fn(),
  downloadWithFetchBlob: vi.fn(),
}));

describe('single-download mutation tests', () => {
  const mockMedia: MediaInfo = {
    url: 'http://example.com/image.jpg',
  } as MediaInfo;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fileNamingModule.generateMediaFilename).mockReturnValue('image.jpg');
    // Reset global GM_download
    (globalThis as unknown as Record<string, unknown>).GM_download = undefined;
    // Reset timer mock to default behavior (return ID, no execution)
    vi.mocked(globalTimerManager.setTimeout).mockImplementation(() => 123);
    // Default: simulate GM_download available environment
    vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
      hasGMDownload: true,
      hasFetch: true,
      hasBlob: true,
      method: 'gm_download',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as unknown as Record<string, unknown>).GM_download;
  });

  describe('getGMDownload robustness', () => {
    it('should return undefined if GM_download is defined but not a function', () => {
      (globalThis as unknown as Record<string, unknown>).GM_download = 'not a function';
      expect(getGMDownload()).toBeUndefined();

      (globalThis as unknown as Record<string, unknown>).GM_download = {};
      expect(getGMDownload()).toBeUndefined();
    });

    it('should return GM_download when it is a valid function', () => {
      const mockFn = vi.fn();
      (globalThis as unknown as Record<string, unknown>).GM_download = mockFn;
      expect(getGMDownload()).toBe(mockFn);
    });

    it('should check typeof GM_download !== undefined condition (mutation test)', () => {
      // When GM_download is undefined, should return undefined
      (globalThis as unknown as Record<string, unknown>).GM_download = undefined;
      expect(getGMDownload()).toBeUndefined();

      // When GM_download is a function, should return it
      const mockFn = vi.fn();
      (globalThis as unknown as Record<string, unknown>).GM_download = mockFn;
      const result = getGMDownload();
      expect(result).toBe(mockFn);
      expect(typeof result).toBe('function');
    });
  });

  describe('downloadSingleFile with blob in fetch_blob mode', () => {
    it('should use downloadBlobWithAnchor when blob is provided in fetch_blob mode', async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: true,
        hasBlob: true,
        method: 'fetch_blob',
      });
      vi.mocked(fallbackModule.downloadBlobWithAnchor).mockResolvedValue({
        success: true,
        filename: 'image.jpg',
      });
      const blob = new Blob(['test']);
      const onProgress = vi.fn();

      const result = await downloadSingleFile(mockMedia, { blob, onProgress });

      expect(result.success).toBe(true);
      expect(fallbackModule.downloadBlobWithAnchor).toHaveBeenCalledWith(blob, 'image.jpg', {
        signal: undefined,
        onProgress,
      });
      // downloadWithFetchBlob should NOT be called
      expect(fallbackModule.downloadWithFetchBlob).not.toHaveBeenCalled();
    });

    it('should use downloadWithFetchBlob when no blob is provided in fetch_blob mode', async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: true,
        hasBlob: true,
        method: 'fetch_blob',
      });
      vi.mocked(fallbackModule.downloadWithFetchBlob).mockResolvedValue({
        success: true,
        filename: 'image.jpg',
      });
      const onProgress = vi.fn();

      const result = await downloadSingleFile(mockMedia, { onProgress });

      expect(result.success).toBe(true);
      expect(fallbackModule.downloadWithFetchBlob).toHaveBeenCalledWith(
        'http://example.com/image.jpg',
        'image.jpg',
        expect.objectContaining({
          onProgress,
          timeout: 30000,
        })
      );
      // downloadBlobWithAnchor should NOT be called
      expect(fallbackModule.downloadBlobWithAnchor).not.toHaveBeenCalled();
    });
  });

  describe('downloadSingleFile GM_download fallback when capability says gm_download but function missing', () => {
    it('should return error when detectDownloadCapability says gm_download but getGMDownload returns undefined', async () => {
      // detectDownloadCapability returns gm_download, but actual GM_download is undefined
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: true,
        hasFetch: true,
        hasBlob: true,
        method: 'gm_download',
      });
      // Ensure GM_download is NOT set
      (globalThis as unknown as Record<string, unknown>).GM_download = undefined;

      const result = await downloadSingleFile(mockMedia);

      expect(result.success).toBe(false);
      expect(result.error).toBe('GM_download not available');
    });
  });

  describe('downloadSingleFile catch block for GM_download throwing error', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();

    beforeEach(() => {
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;
      mockCreateObjectURL.mockReturnValue('blob:http://example.com/uuid');
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should handle GM_download throwing synchronous error', async () => {
      const mockGMDownload = vi.fn(() => {
        throw new Error('Sync error from GM_download');
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      const result = await downloadSingleFile(mockMedia);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sync error from GM_download');
    });

    it('should cleanup blob URL when GM_download throws and blob was provided', async () => {
      const mockGMDownload = vi.fn(() => {
        throw new Error('Sync error');
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const blob = new Blob(['test']);

      await downloadSingleFile(mockMedia, { blob });

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://example.com/uuid');
    });

    it('should NOT revoke blob URL when GM_download throws and no blob was provided', async () => {
      const mockGMDownload = vi.fn(() => {
        throw new Error('Sync error');
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      await downloadSingleFile(mockMedia);

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('downloadSingleFile progress without callback', () => {
    it('should handle timeout without onProgress callback (optional chaining)', async () => {
      let timeoutCallback: (() => void) | undefined;
      vi.mocked(globalTimerManager.setTimeout).mockImplementation(fn => {
        timeoutCallback = fn as () => void;
        return 123;
      });
      const mockGMDownload = vi.fn();
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      const promise = downloadSingleFile(mockMedia); // No onProgress
      await new Promise(resolve => setTimeout(resolve, 0));
      if (timeoutCallback) timeoutCallback();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download timeout');
    });

    it('should handle GM_download onerror without onProgress callback', async () => {
      const mockGMDownload = vi.fn(opts => opts.onerror('fail'));
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      const result = await downloadSingleFile(mockMedia); // No onProgress

      expect(result.success).toBe(false);
    });

    it('should handle GM_download ontimeout without onProgress callback', async () => {
      const mockGMDownload = vi.fn(opts => opts.ontimeout());
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      const result = await downloadSingleFile(mockMedia); // No onProgress

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download timeout');
    });

    it('should handle GM_download onload without onProgress callback', async () => {
      const mockGMDownload = vi.fn(opts => opts.onload());
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      const result = await downloadSingleFile(mockMedia); // No onProgress

      expect(result.success).toBe(true);
      expect(result.filename).toBe('image.jpg');
    });
  });

  describe('downloadSingleFile cleanup logic', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();

    beforeEach(() => {
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;
      mockCreateObjectURL.mockReturnValue('blob:http://example.com/uuid');
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should NOT revoke object URL if no blob was provided', async () => {
      const mockGMDownload = vi.fn(opts => opts.onload());
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      await downloadSingleFile(mockMedia);

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('should revoke object URL if blob WAS provided', async () => {
      const mockGMDownload = vi.fn(opts => opts.onload());
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const blob = new Blob(['test']);

      await downloadSingleFile(mockMedia, { blob });

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://example.com/uuid');
    });
  });

  describe('downloadSingleFile progress reporting', () => {
    it('should report exact progress structure on success', async () => {
      const mockGMDownload = vi.fn(opts => opts.onload());
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const onProgress = vi.fn();

      await downloadSingleFile(mockMedia, { onProgress });

      expect(onProgress).toHaveBeenCalledWith({
        phase: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
      });
    });

    it('should report exact progress structure on error', async () => {
      const mockGMDownload = vi.fn(opts => opts.onerror('fail'));
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const onProgress = vi.fn();

      await downloadSingleFile(mockMedia, { onProgress });

      expect(onProgress).toHaveBeenCalledWith({
        phase: 'complete',
        current: 1,
        total: 1,
        percentage: 0,
      });
    });

    it('should report exact progress structure on timeout', async () => {
      let timeoutCallback: (() => void) | undefined;
      vi.mocked(globalTimerManager.setTimeout).mockImplementation(fn => {
        timeoutCallback = fn as () => void;
        return 123;
      });

      // Mock GM_download to do nothing (so timeout can happen)
      const mockGMDownload = vi.fn();
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      const onProgress = vi.fn();

      const promise = downloadSingleFile(mockMedia, { onProgress });

      // Wait a tick to ensure downloadSingleFile has executed past the const timer = ... line
      await new Promise(resolve => setTimeout(resolve, 0));

      if (timeoutCallback) timeoutCallback();

      await promise;

      expect(onProgress).toHaveBeenCalledWith({
        phase: 'complete',
        current: 1,
        total: 1,
        percentage: 0,
      });
    });

    it('should handle GM_download onprogress events correctly', async () => {
      const mockGMDownload = vi.fn(opts => {
        // Simulate progress
        if (opts.onprogress) {
          opts.onprogress({ loaded: 50, total: 100 } as unknown as {
            loaded: number;
            total: number;
          });
          opts.onprogress({ loaded: 0, total: 0 } as unknown as { loaded: number; total: number }); // Should be ignored or handled?
        }
        opts.onload();
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const onProgress = vi.fn();

      await downloadSingleFile(mockMedia, { onProgress });

      // Check for the intermediate progress call
      expect(onProgress).toHaveBeenCalledWith({
        phase: 'downloading',
        current: 1,
        total: 1,
        percentage: 50,
      });
    });

    it('should NOT report progress if total is 0', async () => {
      const mockGMDownload = vi.fn(opts => {
        if (opts.onprogress) {
          opts.onprogress({ loaded: 0, total: 0 } as unknown as { loaded: number; total: number });
        }
        opts.onload();
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const onProgress = vi.fn();

      await downloadSingleFile(mockMedia, { onProgress });

      // Should NOT have been called with percentage 0 (except for the final complete call)
      // The final complete call has percentage 100.
      // The error/timeout calls have percentage 0.
      // We want to ensure the *intermediate* progress wasn't called.

      const calls = onProgress.mock.calls;
      const intermediateCalls = calls.filter(args => args[0].phase === 'downloading');
      expect(intermediateCalls.length).toBe(0);
    });

    it('should NOT report progress when no onProgress callback provided', async () => {
      const mockGMDownload = vi.fn(opts => {
        if (opts.onprogress) {
          opts.onprogress({ loaded: 50, total: 100 });
        }
        opts.onload();
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;

      // No onProgress callback - should not throw
      const result = await downloadSingleFile(mockMedia);
      expect(result.success).toBe(true);
    });

    it('should verify progress percentage calculation is correct', async () => {
      const mockGMDownload = vi.fn(opts => {
        if (opts.onprogress) {
          // 75 / 100 = 0.75 * 100 = 75
          opts.onprogress({ loaded: 75, total: 100 });
        }
        opts.onload();
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const onProgress = vi.fn();

      await downloadSingleFile(mockMedia, { onProgress });

      expect(onProgress).toHaveBeenCalledWith({
        phase: 'downloading',
        current: 1,
        total: 1,
        percentage: 75,
      });
    });
  });

  describe('downloadSingleFile edge cases', () => {
    it('should handle onprogress when onProgress callback is provided but progress.total is 0', async () => {
      const mockGMDownload = vi.fn(opts => {
        // Call onprogress with total=0 (edge case - should not call onProgress)
        if (opts.onprogress) {
          opts.onprogress({ loaded: 100, total: 0 });
        }
        opts.onload();
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const onProgress = vi.fn();

      await downloadSingleFile(mockMedia, { onProgress });

      // The progress callback should not have been called for 'downloading' phase
      // because total is 0 (condition: progress.total > 0)
      const downloadingCalls = onProgress.mock.calls.filter(
        (args) => args[0].phase === 'downloading'
      );
      expect(downloadingCalls.length).toBe(0);

      // But the complete call should have been made
      expect(onProgress).toHaveBeenCalledWith({
        phase: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
      });
    });

    it('should handle when progress.total equals loaded (100%)', async () => {
      const mockGMDownload = vi.fn(opts => {
        if (opts.onprogress) {
          opts.onprogress({ loaded: 100, total: 100 });
        }
        opts.onload();
      });
      (globalThis as unknown as Record<string, unknown>).GM_download = mockGMDownload;
      const onProgress = vi.fn();

      await downloadSingleFile(mockMedia, { onProgress });

      expect(onProgress).toHaveBeenCalledWith({
        phase: 'downloading',
        current: 1,
        total: 1,
        percentage: 100,
      });
    });
  });
});
