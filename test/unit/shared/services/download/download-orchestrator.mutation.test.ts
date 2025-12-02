import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import * as fallbackModule from '@shared/services/download/fallback-download';
import * as singleDownloadModule from '@shared/services/download/single-download';
import * as zipDownloadModule from '@shared/services/download/zip-download';
import * as fileNamingModule from '@shared/services/filename-service';
import type { MediaInfo } from '@shared/types/media.types';

// Mock dependencies
vi.mock('@shared/services/download/single-download', () => ({
  downloadSingleFile: vi.fn(),
  getGMDownload: vi.fn(),
}));

vi.mock('@shared/services/download/zip-download', () => ({
  downloadAsZip: vi.fn(),
}));

vi.mock('@shared/services/filename-service', () => ({
  generateMediaFilename: vi.fn(),
  generateZipFilename: vi.fn(),
}));

vi.mock('@shared/services/download/fallback-download', () => ({
  detectDownloadCapability: vi.fn(),
  downloadBlobWithAnchor: vi.fn(),
}));

describe('DownloadOrchestrator Mutation Tests', () => {
  let orchestrator: DownloadOrchestrator;

  beforeEach(() => {
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (DownloadOrchestrator as any).instance = null;
    orchestrator = DownloadOrchestrator.getInstance();
    vi.clearAllMocks();

    // Mock URL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

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
  });

  describe('downloadBulk', () => {
    const mockMediaItems = [{ url: 'http://example.com/1.jpg' }] as MediaInfo[];

    beforeEach(() => {
      vi.mocked(fileNamingModule.generateMediaFilename).mockReturnValue('image.jpg');
      vi.mocked(fileNamingModule.generateZipFilename).mockReturnValue('gallery.zip');
    });

    it('should handle GM_download timeout', async () => {
      const mockZipData = new Blob(['mock data']);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 1,
        failures: [],
        zipData: mockZipData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockGMDownload = vi.fn((opts: any) => opts.ontimeout());
      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(mockGMDownload);

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout');
    });

    it('should handle downloadAsZip throwing error', async () => {
      vi.mocked(zipDownloadModule.downloadAsZip).mockRejectedValue(new Error('Zip failed'));

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Zip failed');
    });

    it('should handle unknown error in catch block', async () => {
      vi.mocked(zipDownloadModule.downloadAsZip).mockRejectedValue('String error');

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });
});
