import { pauseActiveTwitterVideos } from '@shared/utils/media/twitter-video-pauser';
import { logger } from '@shared/logging';
import { isGalleryInternalElement } from '@shared/dom/utils';

// Mock dependencies
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

vi.mock('@shared/dom/utils', () => ({
  isGalleryInternalElement: vi.fn(),
}));

describe('twitter-video-pauser mutation tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default behavior: not a gallery element
    vi.mocked(isGalleryInternalElement).mockReturnValue(false);
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveRoot', () => {
    it('should use provided root if it has querySelectorAll', () => {
      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });

      expect(mockRoot.querySelectorAll).toHaveBeenCalledWith('video');
      expect(result).toEqual({
        pausedCount: 0,
        totalCandidates: 0,
        skippedCount: 0,
      });
    });

    it('should return zero result if provided root is invalid (no querySelectorAll)', () => {
      const mockRoot = {} as any;
      const result = pauseActiveTwitterVideos({ root: mockRoot });

      expect(result).toEqual({
        pausedCount: 0,
        totalCandidates: 0,
        skippedCount: 0,
      });
    });

    it('should fallback to global document if root is not provided', () => {
      const spy = vi.spyOn(document, 'querySelectorAll');
      pauseActiveTwitterVideos();
      expect(spy).toHaveBeenCalledWith('video');
    });

    it('should return zero result and not throw if document is missing/invalid', () => {
      // Save original
      const originalQuerySelectorAll = document.querySelectorAll;
      // @ts-ignore
      document.querySelectorAll = undefined;

      try {
        const result = pauseActiveTwitterVideos();
        expect(result).toEqual({
          pausedCount: 0,
          totalCandidates: 0,
          skippedCount: 0,
        });
      } finally {
        // Restore
        document.querySelectorAll = originalQuerySelectorAll;
      }
    });
  });

  describe('isVideoPlaying', () => {
    it('should return false if video.paused is true', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'paused', { get: () => true });
      Object.defineProperty(video, 'ended', { get: () => false });

      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([video]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });
      expect(result.skippedCount).toBe(1);
    });

    it('should return false if video.ended is true', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'paused', { get: () => false });
      Object.defineProperty(video, 'ended', { get: () => true });

      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([video]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });
      expect(result.skippedCount).toBe(1);
    });

    it('should return false if accessing properties throws', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'paused', {
        get: () => {
          throw new Error('Access error');
        },
      });

      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([video]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });
      expect(result.skippedCount).toBe(1);
    });
  });

  describe('Loop filtering', () => {
    it('should skip non-HTMLVideoElement nodes', () => {
      const notAVideo = document.createElement('div');
      // IMPORTANT: Must be connected to avoid skipping due to !isConnected check
      // which happens AFTER the instanceof check we want to test.
      Object.defineProperty(notAVideo, 'isConnected', { get: () => true });

      // Also mock paused/ended to be "playing" so if it passes instanceof, it would be counted as paused
      // This ensures we are testing the instanceof check specifically.
      // @ts-ignore
      notAVideo.paused = false;
      // @ts-ignore
      notAVideo.ended = false;
      // @ts-ignore
      notAVideo.pause = vi.fn();

      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([notAVideo]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });
      expect(result.skippedCount).toBe(1);
      expect(result.pausedCount).toBe(0);
      // @ts-ignore
      expect(notAVideo.pause).not.toHaveBeenCalled();
    });

    it('should skip gallery internal elements', () => {
      const video = document.createElement('video');
      vi.mocked(isGalleryInternalElement).mockReturnValue(true);

      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([video]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });
      expect(result.skippedCount).toBe(1);
      expect(isGalleryInternalElement).toHaveBeenCalledWith(video);
    });

    it('should skip disconnected elements', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'isConnected', { get: () => false });

      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([video]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });
      expect(result.skippedCount).toBe(1);
    });
  });

  describe('Pause execution', () => {
    it('should handle error during pause()', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'paused', { get: () => false });
      Object.defineProperty(video, 'ended', { get: () => false });
      Object.defineProperty(video, 'isConnected', { get: () => true });
      video.pause = vi.fn().mockImplementation(() => {
        throw new Error('Pause failed');
      });

      const mockRoot = {
        querySelectorAll: vi.fn().mockReturnValue([video]),
      } as any;

      const result = pauseActiveTwitterVideos({ root: mockRoot });

      expect(result.pausedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Failed to pause'),
        expect.any(Object)
      );
    });

    it('should not log debug message if no videos were paused', () => {
      const result = pauseActiveTwitterVideos({ root: { querySelectorAll: () => [] } as any });
      expect(result.pausedCount).toBe(0);
      expect(logger.debug).not.toHaveBeenCalledWith(
        expect.stringContaining('Ambient Twitter videos paused'),
        expect.any(Object)
      );
    });
  });
});
