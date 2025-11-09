/**
 * DownloadService Lean Mode Tests (Phase 321)
 *
 * Ensures legacy test-mode helpers are no longer exposed and that
 * the service degrades gracefully when Tampermonkey APIs are missing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { DownloadService } from '../../../src/shared/services/download-service';
import type { BlobDownloadOptions } from '../../../src/shared/services/download-service';

vi.mock('@shared/services/notification-service', () => ({
  NotificationService: {
    getInstance: vi.fn(() => ({
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    })),
  },
}));

vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/utils/timer-management', () => ({
  globalTimerManager: {
    setTimeout: vi.fn((fn: () => void, delay: number) => window.setTimeout(fn, delay)),
    clearTimeout: vi.fn((id: number) => window.clearTimeout(id)),
  },
}));

describe('DownloadService Lean Mode (Phase 321)', () => {
  setupGlobalTestIsolation();

  let service: DownloadService;
  let mockGMDownload: ReturnType<typeof vi.fn> | undefined;

  beforeEach(() => {
    // Reset singleton for clean state
    // @ts-expect-error - Accessing private property for test reset
    DownloadService.instance = null;
    service = DownloadService.getInstance();
    mockGMDownload = vi.fn();
    (globalThis as { GM_download?: typeof mockGMDownload }).GM_download = mockGMDownload;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as { GM_download?: typeof mockGMDownload }).GM_download;
  });

  it('should not expose legacy test-mode helpers', () => {
    const serviceRecord = service as unknown as Record<string, unknown>;

    expect('downloadInTestMode' in serviceRecord).toBe(false);
    expect('downloadBlobBulkInTestMode' in serviceRecord).toBe(false);
  });

  it('should return clear error when GM_download is unavailable', async () => {
    delete (globalThis as { GM_download?: typeof mockGMDownload }).GM_download;

    const blob = new Blob(['test'], { type: 'text/plain' });
    const result = await service.downloadBlob({ blob, name: 'lean-test.txt' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('GM_download not available in this environment');
  });

  it('should invoke GM_download when available', async () => {
    const blob = new Blob(['data'], { type: 'text/plain' });
    const options: BlobDownloadOptions = { blob, name: 'sample.txt' };

    mockGMDownload?.mockImplementation((gmOptions: { onload?: () => void }) => {
      gmOptions.onload?.();
    });

    const result = await service.downloadBlob(options);

    expect(mockGMDownload).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.filename).toBe('sample.txt');
  });
});
