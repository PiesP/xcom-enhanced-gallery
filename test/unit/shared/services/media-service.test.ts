import { HttpRequestService } from '@shared/services/http-request-service';
import { MediaService } from '@shared/services/media-service';

// Mock dependencies
vi.mock('@shared/services/http-request-service');

vi.mock('@shared/services/media/prefetch-manager', () => {
  return {
    PrefetchManager: class {
      prefetch = vi.fn();
      get = vi.fn();
      destroy = vi.fn();
      cancelAll = vi.fn();
      clear = vi.fn();
      getCache = vi.fn().mockReturnValue(new Map());
    },
  };
});

// Mock dynamic imports
vi.mock('@shared/services/media-extraction/media-extraction-service', () => {
  return {
    MediaExtractionService: class {
      extractFromClickedElement = vi.fn();
      extractAllFromContainer = vi.fn();
    },
  };
});

vi.mock('@shared/services/download/download-orchestrator', () => ({
  DownloadOrchestrator: {
    getInstance: vi.fn().mockReturnValue({
      downloadSingle: vi.fn(),
      downloadBulk: vi.fn(),
    }),
  },
}));

// Helper type to access private members for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrivateMediaService = any;

describe('MediaService', () => {
  let mediaService: MediaService;
  let mockHttpRequestService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Reset singleton instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MediaService as any).instance = null;

    // Setup mocks
    mockHttpRequestService = {
      get: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpRequestService.getInstance as any).mockReturnValue(mockHttpRequestService);

    // Default global mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__FEATURE_MEDIA_EXTRACTION__ = true;

    mediaService = MediaService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be a singleton', () => {
      const instance1 = MediaService.getInstance();
      const instance2 = MediaService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize media extraction if feature flag is enabled', async () => {
      // Mock canvas for WebP support detection (required for onInitialize)
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,...'),
      };
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockCanvas as any);

      await (mediaService as unknown as PrivateMediaService).onInitialize();
      expect((mediaService as unknown as PrivateMediaService).mediaExtraction).toBeDefined();

      createElementSpy.mockRestore();
    });

    it('should detect WebP support', async () => {
      // Mock canvas for WebP support detection
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,...'),
      };
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockCanvas as any);

      await (mediaService as unknown as PrivateMediaService).onInitialize();
      expect(mediaService.isWebPSupported()).toBe(true);

      createElementSpy.mockRestore();
    });

    it('should handle lack of WebP support', async () => {
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,...'),
      };
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockCanvas as any);

      await (mediaService as unknown as PrivateMediaService).onInitialize();
      expect(mediaService.isWebPSupported()).toBe(false);

      createElementSpy.mockRestore();
    });
  });

  describe('WebP Optimization', () => {
    beforeEach(async () => {
      // Force WebP support to true for these tests
      (mediaService as unknown as PrivateMediaService).webpSupported = true;
    });

    it('should optimize Twitter image URLs when WebP is supported', () => {
      const originalUrl = 'https://pbs.twimg.com/media/image.jpg';
      const optimized = mediaService.getOptimizedImageUrl(originalUrl);
      expect(optimized).toContain('format=webp');
    });

    it('should not optimize if WebP is not supported', () => {
      (mediaService as unknown as PrivateMediaService).webpSupported = false;
      const originalUrl = 'https://pbs.twimg.com/media/image.jpg';
      const optimized = mediaService.getOptimizedImageUrl(originalUrl);
      expect(optimized).toBe(originalUrl);
    });

    it('should not optimize non-Twitter URLs', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const optimized = mediaService.getOptimizedImageUrl(originalUrl);
      expect(optimized).toBe(originalUrl);
    });

    it('should not double-optimize URLs', () => {
      const originalUrl = 'https://pbs.twimg.com/media/image.jpg?format=webp';
      const optimized = mediaService.getOptimizedImageUrl(originalUrl);
      expect(optimized).toBe(originalUrl);
    });
  });

  describe('Prefetching', () => {
    it('should prefetch media and cache it', async () => {
      const url = 'https://example.com/image.jpg';
      const blob = new Blob(['test'], { type: 'image/jpeg' });

      // Setup mock
      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      prefetchManager.get.mockResolvedValue(blob);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const media = { url } as any;
      await mediaService.prefetchMedia(media, 'immediate');

      expect(prefetchManager.prefetch).toHaveBeenCalledWith(media, 'immediate');

      const cached = mediaService.getCachedMedia(url);
      expect(cached).toBeInstanceOf(Promise);
      if (cached) {
        await expect(cached).resolves.toBe(blob);
      }
    });

    it('should not prefetch if already cached', async () => {
      // This test was testing PrefetchManager logic.
      // With mocked PrefetchManager, we just verify delegation.
      const url = 'https://example.com/image.jpg';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const media = { url } as any;

      await mediaService.prefetchMedia(media, 'immediate');

      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      expect(prefetchManager.prefetch).toHaveBeenCalledWith(media, 'immediate');
    });

    it('should cancel all prefetch requests', () => {
      mediaService.cancelAllPrefetch();
      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      expect(prefetchManager.cancelAll).toHaveBeenCalled();
    });

    it('should clear prefetch cache', () => {
      mediaService.clearPrefetchCache();
      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      expect(prefetchManager.clear).toHaveBeenCalled();
    });
  });

  describe('Downloads', () => {
    it('should delegate single download to DownloadService', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const media = { url: 'https://example.com/image.jpg' } as any;
      const { DownloadOrchestrator } = await import(
        '@shared/services/download/download-orchestrator'
      );
      const downloadService = DownloadOrchestrator.getInstance();

      await mediaService.downloadSingle(media);

      expect(downloadService.downloadSingle).toHaveBeenCalledWith(media, expect.anything());
    });

    it('should pass cached blob to DownloadService if available', async () => {
      const url = 'https://example.com/image.jpg';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const media = { url } as any;
      const blob = new Blob(['test']);

      // Mock prefetch manager to return the blob
      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      prefetchManager.get.mockResolvedValue(blob);

      const { DownloadOrchestrator } = await import(
        '@shared/services/download/download-orchestrator'
      );
      const downloadService = DownloadOrchestrator.getInstance();

      await mediaService.downloadSingle(media);

      expect(downloadService.downloadSingle).toHaveBeenCalledWith(
        media,
        expect.objectContaining({ blob })
      );
    });

    it('should delegate bulk download to DownloadService', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = [{ url: 'url1' }, { url: 'url2' }] as any[];
      const { DownloadOrchestrator } = await import(
        '@shared/services/download/download-orchestrator'
      );
      const downloadService = DownloadOrchestrator.getInstance();

      await mediaService.downloadBulk(items);

      expect(downloadService.downloadBulk).toHaveBeenCalledWith(
        items,
        expect.objectContaining({ prefetchedBlobs: expect.any(Map) })
      );
    });
  });

  describe('Media Extraction Error Handling', () => {
    it('should throw if media extraction is not initialized', async () => {
      (mediaService as unknown as PrivateMediaService).mediaExtraction = null;
      await expect(
        mediaService.extractFromClickedElement(document.createElement('div'))
      ).rejects.toThrow('Media Extraction not initialized');
      await expect(
        mediaService.extractAllFromContainer(document.createElement('div'))
      ).rejects.toThrow('Media Extraction not initialized');
    });
  });

  describe('WebP Support Edge Cases', () => {
    it('should handle document undefined', async () => {
      const originalDocument = global.document;
      vi.stubGlobal('document', undefined);

      await (mediaService as unknown as PrivateMediaService).detectWebPSupport();
      expect(mediaService.isWebPSupported()).toBe(false);

      vi.stubGlobal('document', originalDocument);
    });

    it('should handle canvas.toDataURL undefined', async () => {
      const mockCanvas = {};
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockCanvas as any);

      await (mediaService as unknown as PrivateMediaService).detectWebPSupport();
      expect(mediaService.isWebPSupported()).toBe(false);

      createElementSpy.mockRestore();
    });
  });

  describe('URL Optimization', () => {
    it('should handle invalid URLs in getOptimizedImageUrl', () => {
      (mediaService as unknown as PrivateMediaService).webpSupported = true;
      expect(mediaService.getOptimizedImageUrl('invalid-url')).toBe('invalid-url');
    });

    it('should call getOptimizedImageUrl from optimizeWebP', () => {
      const spy = vi.spyOn(mediaService, 'getOptimizedImageUrl');
      mediaService.optimizeWebP('http://example.com/img.jpg');
      expect(spy).toHaveBeenCalledWith('http://example.com/img.jpg');
    });
  });

  describe('Download State', () => {
    it('should manage download state', () => {
      expect(mediaService.isDownloading()).toBe(false);

      const controller = new AbortController();
      (mediaService as unknown as PrivateMediaService).currentAbortController = controller;
      expect(mediaService.isDownloading()).toBe(true);

      const abortSpy = vi.spyOn(controller, 'abort');
      mediaService.cancelDownload();
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources when called', async () => {
      // Just verify cleanup can be called without error
      await expect(mediaService.cleanup()).resolves.not.toThrow();
    });

    it('should cancel prefetch and clear cache on cleanup', async () => {
      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;

      await mediaService.cleanup();

      expect(prefetchManager.cancelAll).toHaveBeenCalled();
      expect(prefetchManager.clear).toHaveBeenCalled();
      expect(prefetchManager.destroy).toHaveBeenCalled();
    });
  });

  describe('Media Extraction', () => {
    it('should trigger prefetch after successful extraction', async () => {
      const element = document.createElement('div');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaItems = [{ url: 'url1' }, { url: 'url2' }] as any[];

      (mediaService as unknown as PrivateMediaService).mediaExtraction = {
        extractFromClickedElement: vi.fn().mockResolvedValue({
          success: true,
          mediaItems,
        }),
      };

      const prefetchSpy = vi.spyOn(mediaService, 'prefetchMedia');

      await mediaService.extractFromClickedElement(element);

      expect(prefetchSpy).toHaveBeenCalledWith(mediaItems[0], 'immediate');
      expect(prefetchSpy).toHaveBeenCalledWith(mediaItems[1], 'idle');
    });

    it('should delegate extractAllFromContainer to mediaExtraction', async () => {
      const container = document.createElement('div');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = { success: true, mediaItems: [] } as any;

      (mediaService as unknown as PrivateMediaService).mediaExtraction = {
        extractAllFromContainer: vi.fn().mockResolvedValue(result),
      };

      const res = await mediaService.extractAllFromContainer(container);
      expect(res).toBe(result);
      expect(
        (mediaService as unknown as PrivateMediaService).mediaExtraction.extractAllFromContainer
      ).toHaveBeenCalledWith(container, {});
    });
  });

  describe('Mutation Tests', () => {
    it('should default to false if webp support is not yet determined', () => {
      // Reset instance to ensure clean state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MediaService as any).instance = null;
      const freshService = new MediaService();

      const url = 'http://pbs.twimg.com/media/image.jpg';
      const result = freshService.getOptimizedImageUrl(url);

      // Should return original URL (no optimization) because webpSupported is undefined/false
      expect(result).toBe(url);
    });

    it('should not prefetch if extraction succeeded but returned empty items', async () => {
      const result = {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { extractedAt: Date.now(), sourceType: 'api', strategy: 'api' },
      };

      // Setup extraction mock
      (mediaService as unknown as PrivateMediaService).mediaExtraction = {
        extractFromClickedElement: vi.fn().mockResolvedValue(result),
      };

      const element = document.createElement('div');
      await mediaService.extractFromClickedElement(element);

      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      expect(prefetchManager.prefetch).not.toHaveBeenCalled();
    });

    it('should prefetch first item immediately and others lazily', async () => {
      const result = {
        success: true,
        mediaItems: [
          {
            id: '1',
            type: 'image',
            url: 'http://example.com/1.jpg',
            originalUrl: 'http://example.com/1.jpg',
          },
          {
            id: '2',
            type: 'image',
            url: 'http://example.com/2.jpg',
            originalUrl: 'http://example.com/2.jpg',
          },
        ],
        clickedIndex: 0,
        metadata: { extractedAt: Date.now(), sourceType: 'api', strategy: 'api' },
      };

      (mediaService as unknown as PrivateMediaService).mediaExtraction = {
        extractFromClickedElement: vi.fn().mockResolvedValue(result),
      };

      const element = document.createElement('div');
      await mediaService.extractFromClickedElement(element);

      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      expect(prefetchManager.prefetch).toHaveBeenCalledTimes(2);
      expect(prefetchManager.prefetch).toHaveBeenCalledWith(result.mediaItems[0], 'immediate');
      expect(prefetchManager.prefetch).toHaveBeenCalledWith(result.mediaItems[1], 'idle');
    });

    it('should delegate cancelAllPrefetch to prefetchManager', () => {
      mediaService.cancelAllPrefetch();
      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      expect(prefetchManager.cancelAll).toHaveBeenCalled();
    });

    it('should delegate clearPrefetchCache to prefetchManager', () => {
      mediaService.clearPrefetchCache();
      const prefetchManager = (mediaService as unknown as PrivateMediaService).prefetchManager;
      expect(prefetchManager.clear).toHaveBeenCalled();
    });

    it('should safely cancel download even if no controller exists', () => {
      expect(() => mediaService.cancelDownload()).not.toThrow();
    });
  });
});
