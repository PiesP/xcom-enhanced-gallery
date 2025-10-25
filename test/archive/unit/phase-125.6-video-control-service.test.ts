/**
 * @file Phase 125.6: video-control-service.ts 테스트
 * @description 비디오 제어 서비스 테스트 (배경 비디오 정지/복원, 갤러리 비디오 제어)
 * @coverage 목표: 17.79% → 50%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VideoControlService } from '@shared/services/media/video-control-service';
import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';

// Mock dependencies
vi.mock('@shared/logging/logger');
vi.mock('@shared/utils/timer-management', () => ({
  globalTimerManager: {
    setInterval: vi.fn((fn: () => void, _delay: number) => {
      // 테스트 모드에서는 타이머 실제 시작 안 함
      return 12345; // mock interval ID
    }),
    clearInterval: vi.fn(),
  },
}));

// Mock gallery signals
vi.mock('@shared/state/signals/gallery.signals', () => ({
  getCurrentIndex: vi.fn(() => 0),
}));

describe('Phase 125.6: video-control-service.ts', () => {
  let service: VideoControlService;
  let mockVideo1: HTMLVideoElement;
  let mockVideo2: HTMLVideoElement;

  beforeEach(() => {
    // Logger 스파이 설정
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});

    // Mock 비디오 요소 생성
    mockVideo1 = document.createElement('video');
    mockVideo1.src = 'https://example.com/video1.mp4';
    mockVideo1.currentTime = 5.0;
    mockVideo1.volume = 0.8;
    mockVideo1.muted = false;
    Object.defineProperty(mockVideo1, 'paused', {
      value: false,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockVideo1, 'isConnected', {
      value: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockVideo1, 'readyState', {
      // eslint-disable-next-line no-undef
      value: HTMLMediaElement.HAVE_ENOUGH_DATA,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockVideo1, 'ended', {
      value: false,
      writable: true,
      configurable: true,
    });

    mockVideo2 = document.createElement('video');
    mockVideo2.src = 'https://example.com/video2.mp4';
    mockVideo2.currentTime = 10.0;
    mockVideo2.volume = 0.5;
    mockVideo2.muted = true;
    Object.defineProperty(mockVideo2, 'paused', {
      value: false,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockVideo2, 'isConnected', {
      value: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockVideo2, 'readyState', {
      // eslint-disable-next-line no-undef
      value: HTMLMediaElement.HAVE_ENOUGH_DATA,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockVideo2, 'ended', {
      value: false,
      writable: true,
      configurable: true,
    });

    // Mock pause/play 메서드
    mockVideo1.pause = vi.fn();
    mockVideo2.pause = vi.fn();
    mockVideo1.play = vi.fn().mockResolvedValue(undefined);
    mockVideo2.play = vi.fn().mockResolvedValue(undefined);

    // DOM에 추가
    document.body.appendChild(mockVideo1);
    document.body.appendChild(mockVideo2);

    service = new VideoControlService();
  });

  afterEach(() => {
    service.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('pauseAllBackgroundVideos', () => {
    it('should pause all playing background videos', () => {
      service.pauseAllBackgroundVideos();

      expect(mockVideo1.pause).toHaveBeenCalled();
      expect(mockVideo2.pause).toHaveBeenCalled();
      expect(service.isActive()).toBe(true);
      expect(service.getPausedVideoCount()).toBe(2);
    });

    it('should save video state before pausing', () => {
      service.pauseAllBackgroundVideos();

      // 상태가 저장되었는지 확인 (getPausedVideoCount로 간접 확인)
      expect(service.getPausedVideoCount()).toBe(2);
    });

    it('should ignore duplicate calls', () => {
      service.pauseAllBackgroundVideos();
      const firstCount = service.getPausedVideoCount();

      service.pauseAllBackgroundVideos();
      const secondCount = service.getPausedVideoCount();

      expect(firstCount).toBe(secondCount);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('이미 갤러리가 활성화되어 있음')
      );
    });

    it('should skip already paused videos', () => {
      Object.defineProperty(mockVideo1, 'paused', {
        value: true,
        writable: true,
        configurable: true,
      });

      service.pauseAllBackgroundVideos();

      // mockVideo1은 건너뛰고 mockVideo2만 정지
      expect(mockVideo1.pause).not.toHaveBeenCalled();
      expect(mockVideo2.pause).toHaveBeenCalled();
      expect(service.getPausedVideoCount()).toBe(1);
    });

    it('should handle pause error gracefully', () => {
      mockVideo1.pause = vi.fn(() => {
        throw new Error('Pause failed');
      });

      expect(() => service.pauseAllBackgroundVideos()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('비디오 정지 실패'),
        expect.any(Error)
      );
    });

    it('should log info messages', () => {
      service.pauseAllBackgroundVideos();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('배경 비디오'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('정지 완료'));
    });
  });

  describe('restoreBackgroundVideos', () => {
    beforeEach(() => {
      // 먼저 비디오를 정지시켜 상태 저장
      service.pauseAllBackgroundVideos();
    });

    it('should restore previously paused videos', async () => {
      service.restoreBackgroundVideos();

      expect(mockVideo1.play).toHaveBeenCalled();
      expect(mockVideo2.play).toHaveBeenCalled();
      expect(service.isActive()).toBe(false);
      expect(service.getPausedVideoCount()).toBe(0);
    });

    it('should restore video state (time, volume, muted)', () => {
      service.restoreBackgroundVideos();

      expect(mockVideo1.currentTime).toBe(5.0);
      expect(mockVideo1.volume).toBe(0.8);
      expect(mockVideo1.muted).toBe(false);

      expect(mockVideo2.currentTime).toBe(10.0);
      expect(mockVideo2.volume).toBe(0.5);
      expect(mockVideo2.muted).toBe(true);
    });

    it('should ignore call when gallery is not active', () => {
      service.restoreBackgroundVideos(); // 첫 번째 복원
      vi.clearAllMocks();

      service.restoreBackgroundVideos(); // 두 번째 시도

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('갤러리가 활성화되지 않았음')
      );
      expect(mockVideo1.play).not.toHaveBeenCalled();
    });

    it('should handle play error gracefully', async () => {
      mockVideo1.play = vi.fn().mockRejectedValue(new Error('Play failed'));

      expect(() => service.restoreBackgroundVideos()).not.toThrow();

      // play가 호출되었는지 확인 (에러는 catch됨)
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('비디오 재생 복원 실패'),
        expect.any(Error)
      );
    });

    it('should log info messages', () => {
      service.restoreBackgroundVideos();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('배경 비디오 상태 복원'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('복원 완료'));
    });

    it('should clear paused videos map after restore', () => {
      expect(service.getPausedVideoCount()).toBeGreaterThan(0);

      service.restoreBackgroundVideos();

      expect(service.getPausedVideoCount()).toBe(0);
    });
  });

  describe('isActive', () => {
    it('should return false initially', () => {
      expect(service.isActive()).toBe(false);
    });

    it('should return true after pause', () => {
      service.pauseAllBackgroundVideos();
      expect(service.isActive()).toBe(true);
    });

    it('should return false after restore', () => {
      service.pauseAllBackgroundVideos();
      service.restoreBackgroundVideos();
      expect(service.isActive()).toBe(false);
    });
  });

  describe('getPausedVideoCount', () => {
    it('should return 0 initially', () => {
      expect(service.getPausedVideoCount()).toBe(0);
    });

    it('should return correct count after pause', () => {
      service.pauseAllBackgroundVideos();
      expect(service.getPausedVideoCount()).toBe(2);
    });

    it('should return 0 after restore', () => {
      service.pauseAllBackgroundVideos();
      service.restoreBackgroundVideos();
      expect(service.getPausedVideoCount()).toBe(0);
    });
  });

  describe('forceReset', () => {
    it('should clear all paused videos', () => {
      service.pauseAllBackgroundVideos();
      expect(service.getPausedVideoCount()).toBeGreaterThan(0);

      service.forceReset();

      expect(service.getPausedVideoCount()).toBe(0);
      expect(service.isActive()).toBe(false);
    });

    it('should log warning message', () => {
      service.forceReset();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('강제 초기화'));
    });
  });

  describe('destroy', () => {
    it('should restore videos before destroying', () => {
      service.pauseAllBackgroundVideos();
      const restoreSpy = vi.spyOn(service, 'restoreBackgroundVideos');

      service.destroy();

      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should not start cleanup timer in test mode', () => {
      // Test 모드에서는 startCleanupTimer가 실행되지 않음
      // cleanupInterval이 null이므로 clearInterval이 호출되지 않음
      expect(globalTimerManager.setInterval).not.toHaveBeenCalled();
    });

    it('should log info message', () => {
      service.destroy();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('서비스 종료됨'));
    });
  });

  describe('togglePlayPauseCurrent', () => {
    beforeEach(() => {
      // 갤러리 루트 생성
      const galleryRoot = document.createElement('div');
      galleryRoot.id = 'xeg-gallery-root';

      const itemsContainer = document.createElement('div');
      itemsContainer.setAttribute('data-xeg-role', 'items-container');

      const item = document.createElement('div');
      const galleryVideo = document.createElement('video');
      galleryVideo.src = 'https://example.com/gallery-video.mp4';
      Object.defineProperty(galleryVideo, 'paused', {
        value: false,
        writable: true,
        configurable: true,
      });
      galleryVideo.pause = vi.fn();
      galleryVideo.play = vi.fn().mockResolvedValue(undefined);

      item.appendChild(galleryVideo);
      itemsContainer.appendChild(item);
      galleryRoot.appendChild(itemsContainer);
      document.body.appendChild(galleryRoot);
    });

    it('should toggle play to pause', () => {
      service.togglePlayPauseCurrent();

      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      expect(video.pause).toHaveBeenCalled();
    });

    it('should log debug message', () => {
      service.togglePlayPauseCurrent();

      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('toggle play'));
    });

    it('should do nothing when no gallery video found', () => {
      document.body.innerHTML = '';

      expect(() => service.togglePlayPauseCurrent()).not.toThrow();
    });
  });

  describe('volumeUpCurrent', () => {
    beforeEach(() => {
      const galleryRoot = document.createElement('div');
      galleryRoot.id = 'xeg-gallery-root';
      const itemsContainer = document.createElement('div');
      itemsContainer.setAttribute('data-xeg-role', 'items-container');
      const item = document.createElement('div');
      const galleryVideo = document.createElement('video');
      galleryVideo.volume = 0.5;
      galleryVideo.muted = false;
      item.appendChild(galleryVideo);
      itemsContainer.appendChild(item);
      galleryRoot.appendChild(itemsContainer);
      document.body.appendChild(galleryRoot);
    });

    it('should increase volume by 10%', () => {
      service.volumeUpCurrent();

      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      expect(video.volume).toBe(0.6);
    });

    it('should cap volume at 1.0', () => {
      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      video.volume = 0.95;

      service.volumeUpCurrent();

      expect(video.volume).toBe(1.0);
    });

    it('should unmute when volume increases from 0', () => {
      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      video.volume = 0;
      video.muted = true;

      service.volumeUpCurrent();

      expect(video.muted).toBe(false);
    });

    it('should do nothing when no gallery video found', () => {
      document.body.innerHTML = '';

      expect(() => service.volumeUpCurrent()).not.toThrow();
    });
  });

  describe('volumeDownCurrent', () => {
    beforeEach(() => {
      const galleryRoot = document.createElement('div');
      galleryRoot.id = 'xeg-gallery-root';
      const itemsContainer = document.createElement('div');
      itemsContainer.setAttribute('data-xeg-role', 'items-container');
      const item = document.createElement('div');
      const galleryVideo = document.createElement('video');
      galleryVideo.volume = 0.5;
      item.appendChild(galleryVideo);
      itemsContainer.appendChild(item);
      galleryRoot.appendChild(itemsContainer);
      document.body.appendChild(galleryRoot);
    });

    it('should decrease volume by 10%', () => {
      service.volumeDownCurrent();

      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      expect(video.volume).toBe(0.4);
    });

    it('should cap volume at 0.0', () => {
      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      video.volume = 0.05;

      service.volumeDownCurrent();

      expect(video.volume).toBe(0.0);
    });

    it('should do nothing when no gallery video found', () => {
      document.body.innerHTML = '';

      expect(() => service.volumeDownCurrent()).not.toThrow();
    });
  });

  describe('toggleMuteCurrent', () => {
    beforeEach(() => {
      const galleryRoot = document.createElement('div');
      galleryRoot.id = 'xeg-gallery-root';
      const itemsContainer = document.createElement('div');
      itemsContainer.setAttribute('data-xeg-role', 'items-container');
      const item = document.createElement('div');
      const galleryVideo = document.createElement('video');
      galleryVideo.muted = false;
      item.appendChild(galleryVideo);
      itemsContainer.appendChild(item);
      galleryRoot.appendChild(itemsContainer);
      document.body.appendChild(galleryRoot);
    });

    it('should toggle mute from false to true', () => {
      service.toggleMuteCurrent();

      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      expect(video.muted).toBe(true);
    });

    it('should toggle mute from true to false', () => {
      const video = document.querySelector('#xeg-gallery-root video') as HTMLVideoElement;
      video.muted = true;

      service.toggleMuteCurrent();

      expect(video.muted).toBe(false);
    });

    it('should do nothing when no gallery video found', () => {
      document.body.innerHTML = '';

      expect(() => service.toggleMuteCurrent()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full lifecycle: pause → restore', () => {
      expect(service.isActive()).toBe(false);
      expect(service.getPausedVideoCount()).toBe(0);

      service.pauseAllBackgroundVideos();

      expect(service.isActive()).toBe(true);
      expect(service.getPausedVideoCount()).toBe(2);

      service.restoreBackgroundVideos();

      expect(service.isActive()).toBe(false);
      expect(service.getPausedVideoCount()).toBe(0);
    });

    it('should handle multiple pause/restore cycles', () => {
      // Cycle 1
      service.pauseAllBackgroundVideos();
      service.restoreBackgroundVideos();

      // Reset videos to playing state
      Object.defineProperty(mockVideo1, 'paused', {
        value: false,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(mockVideo2, 'paused', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Cycle 2
      service.pauseAllBackgroundVideos();
      expect(service.getPausedVideoCount()).toBe(2);

      service.restoreBackgroundVideos();
      expect(service.getPausedVideoCount()).toBe(0);
    });

    it('should handle forceReset interrupting pause state', () => {
      service.pauseAllBackgroundVideos();
      expect(service.isActive()).toBe(true);

      service.forceReset();

      expect(service.isActive()).toBe(false);
      expect(service.getPausedVideoCount()).toBe(0);
    });
  });
});
