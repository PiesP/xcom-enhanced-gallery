import { MediaService } from '@shared/services/media-service';
import type { MediaInfo } from '@shared/types/media.types';

// Mock dependencies
vi.mock('@shared/services/media/prefetch-manager', () => {
  return {
    PrefetchManager: class {
      prefetch = vi.fn();
      destroy = vi.fn();
      get = vi.fn();
      getCache = vi.fn().mockReturnValue(new Map());
      cancelAll = vi.fn();
      clear = vi.fn();
    },
  };
});

vi.mock('@shared/services/media-extraction/media-extraction-service', () => {
  return {
    MediaExtractionService: class {
      extractFromClickedElement = vi.fn();
      extractAllFromContainer = vi.fn();
    },
  };
});

// Mock DownloadOrchestrator
const mockDownloadSingle = vi.fn();
const mockDownloadBulk = vi.fn();

vi.mock('@shared/services/download/download-orchestrator', () => {
  return {
    DownloadOrchestrator: {
      getInstance: vi.fn(() => ({
        downloadSingle: mockDownloadSingle,
        downloadBulk: mockDownloadBulk,
      })),
    },
  };
});

describe('MediaService Mutation Tests', () => {
  let service: MediaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let privateService: any;

  beforeEach(async () => {
    // Mock canvas for WebP detection
    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,dummy'),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MediaService as any).instance = null;
    service = MediaService.getInstance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    privateService = service as any;

    // Initialize
    await privateService.onInitialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('extractFromClickedElement', () => {
    it('should prefetch first item immediately and others lazily on success', async () => {
      const mockMediaItems = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
        { id: '3', url: 'url3' },
      ] as MediaInfo[];

      privateService.mediaExtraction.extractFromClickedElement.mockResolvedValue({
        success: true,
        mediaItems: mockMediaItems,
      });

      const element = document.createElement('div');
      await service.extractFromClickedElement(element);

      const prefetchSpy = privateService.prefetchManager.prefetch;
      expect(prefetchSpy).toHaveBeenCalledTimes(3);
      expect(prefetchSpy).toHaveBeenCalledWith(mockMediaItems[0], 'immediate');
      expect(prefetchSpy).toHaveBeenCalledWith(mockMediaItems[1], 'idle');
      expect(prefetchSpy).toHaveBeenCalledWith(mockMediaItems[2], 'idle');
    });

    it('should not prefetch if extraction fails', async () => {
      privateService.mediaExtraction.extractFromClickedElement.mockResolvedValue({
        success: false,
        mediaItems: [],
      });

      const element = document.createElement('div');
      await service.extractFromClickedElement(element);

      expect(privateService.prefetchManager.prefetch).not.toHaveBeenCalled();
    });

    it('should not prefetch if mediaItems is empty', async () => {
      privateService.mediaExtraction.extractFromClickedElement.mockResolvedValue({
        success: true,
        mediaItems: [],
      });

      const element = document.createElement('div');
      await service.extractFromClickedElement(element);

      expect(privateService.prefetchManager.prefetch).not.toHaveBeenCalled();
    });
  });

  describe('extractAllFromContainer', () => {
    it('should delegate to mediaExtraction service', async () => {
      const mockResult = { success: true, mediaItems: [] };
      privateService.mediaExtraction.extractAllFromContainer.mockResolvedValue(mockResult);

      const container = document.createElement('div');
      const result = await service.extractAllFromContainer(container);

      expect(privateService.mediaExtraction.extractAllFromContainer).toHaveBeenCalledWith(
        container,
        {}
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should return original URL if WebP is not supported', () => {
      privateService.webpSupported = false;
      const url = 'https://pbs.twimg.com/media/img.jpg';
      expect(service.getOptimizedImageUrl(url)).toBe(url);
    });

    it('should return original URL if hostname is not pbs.twimg.com', () => {
      privateService.webpSupported = true;
      const url = 'https://example.com/img.jpg';
      expect(service.getOptimizedImageUrl(url)).toBe(url);
    });

    it('should return original URL if format is already webp', () => {
      privateService.webpSupported = true;
      const url = 'https://pbs.twimg.com/media/img.jpg?format=webp';
      expect(service.getOptimizedImageUrl(url)).toBe(url);
    });

    it('should change format to webp if supported and host matches', () => {
      privateService.webpSupported = true;
      const url = 'https://pbs.twimg.com/media/img.jpg?format=jpg&name=large';
      const result = service.getOptimizedImageUrl(url);
      expect(result).toContain('format=webp');
      expect(result).toContain('name=large');
    });

    it('should handle invalid URLs gracefully', () => {
      privateService.webpSupported = true;
      const url = 'not-a-url';
      expect(service.getOptimizedImageUrl(url)).toBe(url);
    });
  });

  describe('downloadSingle', () => {
    it('should use prefetched blob if available', async () => {
      const media = { url: 'https://example.com/img.jpg' } as MediaInfo;
      const mockBlob = new Blob(['test']);
      privateService.prefetchManager.get.mockResolvedValue(mockBlob);
      mockDownloadSingle.mockResolvedValue({ success: true });

      await service.downloadSingle(media);

      expect(privateService.prefetchManager.get).toHaveBeenCalledWith(media.url);
      expect(mockDownloadSingle).toHaveBeenCalledWith(media, expect.objectContaining({ blob: mockBlob }));
    });

    it('should proceed without blob if prefetch fails', async () => {
      const media = { url: 'https://example.com/img.jpg' } as MediaInfo;
      privateService.prefetchManager.get.mockRejectedValue(new Error('Prefetch failed'));
      mockDownloadSingle.mockResolvedValue({ success: true });

      await service.downloadSingle(media);

      expect(mockDownloadSingle).toHaveBeenCalledWith(media, expect.not.objectContaining({ blob: expect.anything() }));
    });
  });

  describe('downloadMultiple', () => {
    it('should pass prefetched blobs to downloadBulk', async () => {
      const mediaItems = [{ url: 'https://example.com/img.jpg' }] as MediaInfo[];
      const mockCache = new Map([['https://example.com/img.jpg', new Blob(['test'])]]);
      privateService.prefetchManager.getCache.mockReturnValue(mockCache);
      mockDownloadBulk.mockResolvedValue({ success: true });

      await service.downloadMultiple(mediaItems);

      expect(privateService.prefetchManager.getCache).toHaveBeenCalled();
      expect(mockDownloadBulk).toHaveBeenCalledWith(mediaItems, expect.objectContaining({ prefetchedBlobs: mockCache }));
    });
  });
});
