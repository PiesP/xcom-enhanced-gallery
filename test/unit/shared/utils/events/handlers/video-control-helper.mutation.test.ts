/**
 * @fileoverview Additional mutation test coverage for video-control-helper
 * Target: Improve video-control-helper.ts from 73% to 85%+
 * Focus: Edge cases, conditional branches, error handling
 */
import {
  executeVideoControl,
  getVideoPlaybackState,
} from '@shared/utils/events/handlers/video-control-helper';
import { logger } from '@shared/logging';

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  mockCurrentVideoElement: { value: null as HTMLVideoElement | null },
  mockCurrentIndex: { value: 0 },
}));

// Mock dependencies
vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    currentVideoElement: mocks.mockCurrentVideoElement,
    currentIndex: mocks.mockCurrentIndex,
  },
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('video-control-helper mutation coverage', () => {
  let mockVideo: HTMLVideoElement;

  beforeEach(() => {
    mockVideo = document.createElement('video');
    mockVideo.play = vi.fn().mockResolvedValue(undefined);
    mockVideo.pause = vi.fn();
    Object.defineProperty(mockVideo, 'paused', {
      value: true,
      writable: true,
    });
    Object.defineProperty(mockVideo, 'muted', {
      value: false,
      writable: true,
    });
    Object.defineProperty(mockVideo, 'volume', {
      value: 0.5,
      writable: true,
    });

    mocks.mockCurrentVideoElement.value = null;
    mocks.mockCurrentIndex.value = 0;
    vi.clearAllMocks();
  });

  describe('volumeUp unmute conditional', () => {
    it('should unmute when newVolume becomes greater than 0', async () => {
      mockVideo.volume = 0;
      mockVideo.muted = true;

      await executeVideoControl('volumeUp', { video: mockVideo });

      // Volume should now be 0.1 and unmuted
      expect(mockVideo.volume).toBe(0.1);
      expect(mockVideo.muted).toBe(false);
    });

    it('should not change muted if already unmuted', async () => {
      mockVideo.volume = 0.5;
      mockVideo.muted = false;

      await executeVideoControl('volumeUp', { video: mockVideo });

      expect(mockVideo.muted).toBe(false);
    });
  });

  describe('volumeDown mute conditional', () => {
    it('should mute when newVolume becomes exactly 0', async () => {
      mockVideo.volume = 0.1;
      mockVideo.muted = false;

      await executeVideoControl('volumeDown', { video: mockVideo });

      expect(mockVideo.volume).toBe(0);
      expect(mockVideo.muted).toBe(true);
    });

    it('should NOT mute if already muted when reaching 0', async () => {
      mockVideo.volume = 0.1;
      mockVideo.muted = true;

      await executeVideoControl('volumeDown', { video: mockVideo });

      expect(mockVideo.volume).toBe(0);
      expect(mockVideo.muted).toBe(true);
    });

    it('should NOT mute if newVolume is greater than 0', async () => {
      mockVideo.volume = 0.5;
      mockVideo.muted = false;

      await executeVideoControl('volumeDown', { video: mockVideo });

      expect(mockVideo.volume).toBe(0.4);
      expect(mockVideo.muted).toBe(false);
    });
  });

  describe('logger.error on unexpected error', () => {
    it('should log error when volume access throws', async () => {
      const videoWithBadVolume = {
        get volume(): number {
          throw new Error('Volume access error');
        },
        set volume(_v: number) {
          throw new Error('Volume set error');
        },
        play: vi.fn(),
        pause: vi.fn(),
        paused: true,
        muted: false,
      } as unknown as HTMLVideoElement;

      await executeVideoControl('volumeUp', { video: videoWithBadVolume });

      expect(logger.error).toHaveBeenCalledWith(
        '[VideoControl] Unexpected error',
        expect.objectContaining({
          error: expect.any(Error),
          action: 'volumeUp',
        })
      );
    });
  });

  describe('logger.debug action executed', () => {
    it('should log debug message after successful action', async () => {
      await executeVideoControl('play', { video: mockVideo });

      expect(logger.debug).toHaveBeenCalledWith('[VideoControl] Action executed', {
        action: 'play',
        context: undefined,
        method: 'video-element',
      });
    });

    it('should include context in log when provided', async () => {
      await executeVideoControl('pause', { video: mockVideo, context: 'gallery' });

      expect(logger.debug).toHaveBeenCalledWith('[VideoControl] Action executed', {
        action: 'pause',
        context: 'gallery',
        method: 'video-element',
      });
    });
  });

  describe('getCurrentGalleryVideo document check', () => {
    it('should return null when document is not a Document instance', async () => {
      mocks.mockCurrentVideoElement.value = null;

      // Temporarily make document appear as non-Document
      const originalDocument = globalThis.document;
      Object.defineProperty(globalThis, 'document', {
        value: {},
        writable: true,
        configurable: true,
      });

      await executeVideoControl('play');

      expect(mockVideo.play).not.toHaveBeenCalled();

      // Restore
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('togglePlayPause state tracking interaction', () => {
    it('should use tracked state when available', async () => {
      // First establish tracked state via play
      await executeVideoControl('play', { video: mockVideo });
      expect(getVideoPlaybackState(mockVideo)).toEqual({ playing: true });

      // Now toggle - should use tracked state (playing=true) and pause
      await executeVideoControl('togglePlayPause', { video: mockVideo });
      expect(mockVideo.pause).toHaveBeenCalled();
      expect(getVideoPlaybackState(mockVideo)).toEqual({ playing: false });
    });

    it('should fallback to paused property when no tracked state', async () => {
      // Fresh video with no tracked state
      const freshVideo = document.createElement('video');
      freshVideo.play = vi.fn().mockResolvedValue(undefined);
      freshVideo.pause = vi.fn();
      Object.defineProperty(freshVideo, 'paused', {
        value: true,
        writable: true,
      });

      // No prior tracking, paused=true means it should play
      await executeVideoControl('togglePlayPause', { video: freshVideo });
      expect(freshVideo.play).toHaveBeenCalled();
    });
  });

  describe('play action error handling', () => {
    it('should log debug when play rejects', async () => {
      mockVideo.play = vi.fn().mockRejectedValue(new Error('Play rejected'));

      await executeVideoControl('play', { video: mockVideo, context: 'test' });

      expect(logger.debug).toHaveBeenCalledWith('[VideoControl] Play failed', {
        context: 'test',
      });
    });
  });

  describe('togglePlayPause play error handling', () => {
    it('should log debug when play during toggle fails', async () => {
      mockVideo.play = vi.fn().mockRejectedValue(new Error('Toggle play failed'));
      Object.defineProperty(mockVideo, 'paused', { value: true });

      await executeVideoControl('togglePlayPause', { video: mockVideo, context: 'toggle-test' });

      expect(logger.debug).toHaveBeenCalledWith(
        '[VideoControl] Play failed during toggle',
        { context: 'toggle-test' }
      );
    });
  });

  describe('mute and toggleMute actions', () => {
    it('should set muted to true for mute action', async () => {
      mockVideo.muted = false;

      await executeVideoControl('mute', { video: mockVideo });

      expect(mockVideo.muted).toBe(true);
    });

    it('should toggle muted from false to true', async () => {
      mockVideo.muted = false;

      await executeVideoControl('toggleMute', { video: mockVideo });

      expect(mockVideo.muted).toBe(true);
    });

    it('should toggle muted from true to false', async () => {
      mockVideo.muted = true;

      await executeVideoControl('toggleMute', { video: mockVideo });

      expect(mockVideo.muted).toBe(false);
    });
  });

  describe('no video found early return', () => {
    it('should log debug and return early when no video found', async () => {
      mocks.mockCurrentVideoElement.value = null;
      document.body.innerHTML = '';

      await executeVideoControl('play', { context: 'no-video-context' });

      expect(logger.debug).toHaveBeenCalledWith('[VideoControl] No video element found', {
        action: 'play',
        context: 'no-video-context',
      });
    });
  });

  describe('Math.round precision for volume', () => {
    it('should round volume to 2 decimal places on volumeUp', async () => {
      mockVideo.volume = 0.33;

      await executeVideoControl('volumeUp', { video: mockVideo });

      // 0.33 + 0.1 = 0.43, rounded = 0.43
      expect(mockVideo.volume).toBe(0.43);
    });

    it('should round volume to 2 decimal places on volumeDown', async () => {
      mockVideo.volume = 0.33;

      await executeVideoControl('volumeDown', { video: mockVideo });

      // 0.33 - 0.1 = 0.23, rounded = 0.23
      expect(mockVideo.volume).toBe(0.23);
    });
  });

  describe('Math.min and Math.max boundaries', () => {
    it('should cap volumeUp at 1.0', async () => {
      mockVideo.volume = 0.99;

      await executeVideoControl('volumeUp', { video: mockVideo });

      expect(mockVideo.volume).toBe(1);
    });

    it('should cap volumeDown at 0.0', async () => {
      mockVideo.volume = 0.01;

      await executeVideoControl('volumeDown', { video: mockVideo });

      expect(mockVideo.volume).toBe(0);
    });
  });

  describe('fallback video query with different selectors', () => {
    it('should try CSS.SELECTORS.ROOT if DATA_GALLERY not found', async () => {
      mocks.mockCurrentVideoElement.value = null;

      // Create container with xeg-gallery-root class (CSS.SELECTORS.ROOT = '.xeg-gallery-root')
      const root = document.createElement('div');
      root.classList.add('xeg-gallery-root');
      document.body.appendChild(root);

      const itemsContainer = document.createElement('div');
      itemsContainer.setAttribute('data-xeg-role', 'items-container');
      root.appendChild(itemsContainer);

      const item = document.createElement('div');
      const video = document.createElement('video');
      video.play = vi.fn().mockResolvedValue(undefined);
      item.appendChild(video);
      itemsContainer.appendChild(item);

      mocks.mockCurrentIndex.value = 0;

      await executeVideoControl('play');
      expect(video.play).toHaveBeenCalled();

      document.body.removeChild(root);
    });

    it('should try CSS.SELECTORS.CONTAINER if others not found', async () => {
      mocks.mockCurrentVideoElement.value = null;

      const container = document.createElement('div');
      container.classList.add('xeg-gallery-container');
      document.body.appendChild(container);

      const itemsContainer = document.createElement('div');
      itemsContainer.setAttribute('data-xeg-role', 'items-container');
      container.appendChild(itemsContainer);

      const item = document.createElement('div');
      const video = document.createElement('video');
      video.play = vi.fn().mockResolvedValue(undefined);
      item.appendChild(video);
      itemsContainer.appendChild(item);

      mocks.mockCurrentIndex.value = 0;

      await executeVideoControl('play');
      expect(video.play).toHaveBeenCalled();

      document.body.removeChild(container);
    });
  });

  describe('getVideoPlaybackState helper', () => {
    it('should return null for untracked video', () => {
      const freshVideo = document.createElement('video');
      expect(getVideoPlaybackState(freshVideo)).toBeNull();
    });

    it('should return state after play', async () => {
      await executeVideoControl('play', { video: mockVideo });
      expect(getVideoPlaybackState(mockVideo)).toEqual({ playing: true });
    });

    it('should return state after pause', async () => {
      await executeVideoControl('pause', { video: mockVideo });
      expect(getVideoPlaybackState(mockVideo)).toEqual({ playing: false });
    });
  });
});
