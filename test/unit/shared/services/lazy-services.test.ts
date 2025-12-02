/**
 * @fileoverview Tests for lazy service registration
 */
import { SERVICE_KEYS } from '@/constants';
import { logger } from '@shared/logging';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import {
  __resetLazyServiceRegistration,
  ensureDownloadServiceRegistered,
} from '@shared/services/lazy-services';
import { CoreService } from '@shared/services/service-manager';

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock DownloadOrchestrator
vi.mock('@shared/services/download/download-orchestrator', () => ({
  DownloadOrchestrator: {
    getInstance: vi.fn().mockReturnValue({ _isMock: true }),
  },
}));

describe('lazy-service-registration', () => {
  beforeEach(() => {
    __resetLazyServiceRegistration();
    CoreService.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetLazyServiceRegistration();
    CoreService.resetInstance();
    vi.restoreAllMocks();
  });

  it('should register DownloadService on first call and log success', async () => {
    await ensureDownloadServiceRegistered();

    const serviceManager = CoreService.getInstance();
    const downloadService = serviceManager.tryGet(SERVICE_KEYS.GALLERY_DOWNLOAD);
    expect(downloadService).toBeTruthy();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('lazily registered'));
  });

  it('should register under both GALLERY_DOWNLOAD and BULK_DOWNLOAD keys', async () => {
    await ensureDownloadServiceRegistered();

    const serviceManager = CoreService.getInstance();
    const galleryDownload = serviceManager.tryGet(SERVICE_KEYS.GALLERY_DOWNLOAD);
    const bulkDownload = serviceManager.tryGet(SERVICE_KEYS.BULK_DOWNLOAD);

    expect(galleryDownload).toBeTruthy();
    expect(bulkDownload).toBeTruthy();
    expect(galleryDownload).toBe(bulkDownload);
  });

  it('should be idempotent - second call does nothing and does not log again', async () => {
    await ensureDownloadServiceRegistered();
    expect(logger.info).toHaveBeenCalledTimes(1);

    // Second call
    await ensureDownloadServiceRegistered();
    expect(logger.info).toHaveBeenCalledTimes(1); // Still 1
  });

  it('should handle errors during registration', async () => {
    const error = new Error('Import failed');
    vi.mocked(DownloadOrchestrator.getInstance).mockImplementationOnce(() => {
      throw error;
    });

    await expect(ensureDownloadServiceRegistered()).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to lazily register'),
      error.message
    );
  });

  it('should handle non-Error objects during registration', async () => {
    const error = 'String error';
    vi.mocked(DownloadOrchestrator.getInstance).mockImplementationOnce(() => {
      throw error;
    });

    try {
      await ensureDownloadServiceRegistered();
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to lazily register'),
      error
    );
  });

  it('should reset registration state with __resetLazyServiceRegistration', async () => {
    await ensureDownloadServiceRegistered();
    __resetLazyServiceRegistration();
    CoreService.resetInstance();

    // Should be able to register again after reset
    await ensureDownloadServiceRegistered();
    const serviceManager = CoreService.getInstance();
    expect(serviceManager.tryGet(SERVICE_KEYS.GALLERY_DOWNLOAD)).toBeTruthy();
  });
});
