/**
 * @fileoverview Video Controller - 비디오 재생 제어
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 비디오 상태 정보
 */
interface VideoState {
  element: HTMLVideoElement;
  wasPlaying: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
}

/**
 * 비디오 제어 설정
 */
export interface VideoControllerConfig {
  /** 자동 재생 방지 */
  preventAutoplay: boolean;
  /** 음량 제어 */
  volumeControl: boolean;
  /** 상태 저장 */
  preserveState: boolean;
}

/**
 * Video Controller
 * 비디오 재생 상태를 제어하고 관리합니다.
 */
export class VideoController {
  private readonly config: VideoControllerConfig;
  private readonly pausedVideos = new Map<HTMLVideoElement, VideoState>();
  private readonly observedVideos = new Set<HTMLVideoElement>();

  private static readonly DEFAULT_CONFIG: VideoControllerConfig = {
    preventAutoplay: true,
    volumeControl: true,
    preserveState: true,
  };

  constructor(config: Partial<VideoControllerConfig> = {}) {
    this.config = { ...VideoController.DEFAULT_CONFIG, ...config };
  }

  /**
   * 페이지의 모든 비디오를 일시정지합니다.
   */
  public pauseAllVideos(): HTMLVideoElement[] {
    const videos = document.querySelectorAll('video');
    const pausedVideos: HTMLVideoElement[] = [];

    logger.debug(`[VideoController] Pausing ${videos.length} videos`);

    for (const video of videos) {
      if (this.pauseVideo(video)) {
        pausedVideos.push(video);
      }
    }

    logger.info(`[VideoController] Paused ${pausedVideos.length} videos`);
    return pausedVideos;
  }

  /**
   * 특정 컨테이너 내의 비디오만 일시정지합니다.
   */
  public pauseVideosInContainer(container: HTMLElement): HTMLVideoElement[] {
    const videos = container.querySelectorAll('video');
    const pausedVideos: HTMLVideoElement[] = [];

    for (const video of videos) {
      if (this.pauseVideo(video)) {
        pausedVideos.push(video);
      }
    }

    logger.debug(`[VideoController] Paused ${pausedVideos.length} videos in container`);
    return pausedVideos;
  }

  /**
   * 특정 비디오를 일시정지합니다.
   */
  public pauseVideo(video: HTMLVideoElement): boolean {
    if (video.paused) {
      return false;
    }

    try {
      const videoState: VideoState = {
        element: video,
        wasPlaying: true,
        currentTime: video.currentTime,
        volume: video.volume,
        muted: video.muted,
      };

      this.pausedVideos.set(video, videoState);
      video.pause();

      logger.debug('[VideoController] Video paused', {
        src: video.src || video.currentSrc,
        currentTime: video.currentTime,
      });

      return true;
    } catch (error) {
      logger.warn('[VideoController] Failed to pause video:', error);
      return false;
    }
  }

  /**
   * 이전에 재생 중이던 비디오들을 복원합니다.
   */
  public resumePausedVideos(): number {
    const resumedCount = this.pausedVideos.size;

    logger.debug(`[VideoController] Resuming ${resumedCount} videos`);

    for (const [video, videoState] of this.pausedVideos) {
      this.resumeVideo(video, videoState);
    }

    this.pausedVideos.clear();
    logger.info(`[VideoController] Resumed ${resumedCount} videos`);

    return resumedCount;
  }

  /**
   * 특정 비디오를 복원합니다.
   */
  public resumeVideo(video: HTMLVideoElement, savedState?: VideoState): boolean {
    const state = savedState ?? this.pausedVideos.get(video);

    if (!state || !state.wasPlaying || !document.contains(video)) {
      return false;
    }

    try {
      // 상태 복원
      if (this.config.preserveState) {
        video.currentTime = state.currentTime;
        if (this.config.volumeControl) {
          video.volume = state.volume;
          video.muted = state.muted;
        }
      }

      // 재생 시작
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(error => {
          logger.warn('[VideoController] Failed to resume video playback:', error);
        });
      }

      this.pausedVideos.delete(video);

      logger.debug('[VideoController] Video resumed', {
        src: video.src || video.currentSrc,
        currentTime: video.currentTime,
      });

      return true;
    } catch (error) {
      logger.warn('[VideoController] Failed to resume video:', error);
      return false;
    }
  }

  /**
   * 모든 비디오의 자동재생을 방지합니다.
   */
  public preventAutoplay(): void {
    if (!this.config.preventAutoplay) {
      return;
    }

    const videos = document.querySelectorAll('video[autoplay]') as NodeListOf<HTMLVideoElement>;

    for (const video of videos) {
      video.removeAttribute('autoplay');
      video.preload = 'metadata';

      // 이미 재생 중인 경우 일시정지
      if (!video.paused) {
        this.pauseVideo(video);
      }
    }

    logger.debug(`[VideoController] Prevented autoplay for ${videos.length} videos`);
  }

  /**
   * 현재 재생 중인 비디오 목록을 반환합니다.
   */
  public getPlayingVideos(): HTMLVideoElement[] {
    const videos = document.querySelectorAll('video');
    return Array.from(videos).filter(video => !video.paused);
  }

  /**
   * 일시정지된 비디오 수를 반환합니다.
   */
  public getPausedVideoCount(): number {
    return this.pausedVideos.size;
  }

  /**
   * 모든 상태를 정리합니다.
   */
  public cleanup(): void {
    this.pausedVideos.clear();
    this.observedVideos.clear();
    logger.debug('[VideoController] Cleanup completed');
  }

  /**
   * 현재 상태 조회
   */
  public getStatus() {
    const allVideos = document.querySelectorAll('video');
    const playingVideos = this.getPlayingVideos();

    return {
      totalVideos: allVideos.length,
      playingVideos: playingVideos.length,
      pausedVideos: this.pausedVideos.size,
      config: this.config,
    };
  }
}
