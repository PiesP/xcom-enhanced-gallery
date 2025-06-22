/**
 * @fileoverview Video Manager - 통합 비디오 관리자
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';
import { VideoController, type VideoControllerConfig } from './VideoController';
import { VideoStateTracker, type VideoEvent } from './VideoStateTracker';

/**
 * 비디오 관리자 설정
 */
export interface VideoManagerConfig {
  controller: VideoControllerConfig;
  enableTracking: boolean;
  autoStart: boolean;
}

/**
 * Video Manager
 * 모든 비디오 관련 기능을 통합 관리합니다.
 */
export class VideoManager {
  private static instance: VideoManager | null = null;

  private readonly config: VideoManagerConfig;
  public readonly controller: VideoController;
  public readonly tracker: VideoStateTracker;

  private static readonly DEFAULT_CONFIG: VideoManagerConfig = {
    controller: {
      preventAutoplay: true,
      volumeControl: true,
      preserveState: true,
    },
    enableTracking: true,
    autoStart: true,
  };

  private constructor(config: Partial<VideoManagerConfig> = {}) {
    this.config = { ...VideoManager.DEFAULT_CONFIG, ...config };

    this.controller = new VideoController(this.config.controller);
    this.tracker = new VideoStateTracker();

    if (this.config.autoStart) {
      this.initialize();
    }

    logger.debug('[VideoManager] Initialized');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(config?: Partial<VideoManagerConfig>): VideoManager {
    VideoManager.instance ??= new VideoManager(config);
    return VideoManager.instance;
  }

  /**
   * 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    if (VideoManager.instance) {
      VideoManager.instance.cleanup();
      VideoManager.instance = null;
    }
  }

  /**
   * 비디오 관리 초기화
   */
  public initialize(): void {
    // 자동재생 방지
    this.controller.preventAutoplay();

    // 추적 시작
    if (this.config.enableTracking) {
      this.tracker.startTracking();
      this.setupDefaultEventHandlers();
    }

    logger.debug('[VideoManager] Initialized video management');
  }

  /**
   * 갤러리 진입 시 호출 - 모든 비디오 일시정지
   */
  public onGalleryEnter(): HTMLVideoElement[] {
    logger.debug('[VideoManager] Gallery entered - pausing all videos');
    return this.controller.pauseAllVideos();
  }

  /**
   * 갤러리 종료 시 호출 - 비디오 복원
   */
  public onGalleryExit(): number {
    logger.debug('[VideoManager] Gallery exited - resuming videos');
    return this.controller.resumePausedVideos();
  }

  /**
   * 특정 컨테이너 진입 시 호출
   */
  public onContainerEnter(container: HTMLElement): HTMLVideoElement[] {
    return this.controller.pauseVideosInContainer(container);
  }

  /**
   * 비디오 이벤트 리스너 등록
   */
  public addEventListener(eventType: string, callback: (event: VideoEvent) => void): void {
    this.tracker.addEventListener(eventType, callback);
  }

  /**
   * 비디오 이벤트 리스너 제거
   */
  public removeEventListener(eventType: string, callback: (event: VideoEvent) => void): void {
    this.tracker.removeEventListener(eventType, callback);
  }

  /**
   * 특정 비디오 추적 시작
   */
  public trackVideo(video: HTMLVideoElement, tweetId?: string): void {
    this.tracker.trackVideo(video, tweetId);
  }

  /**
   * 특정 비디오 추적 중지
   */
  public untrackVideo(video: HTMLVideoElement): boolean {
    return this.tracker.untrackVideo(video);
  }

  /**
   * 현재 상태 조회
   */
  public getStatus() {
    return {
      config: this.config,
      controller: this.controller.getStatus(),
      tracker: this.tracker.getStatus(),
    };
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<VideoManagerConfig>): void {
    Object.assign(this.config, newConfig);
    logger.debug('[VideoManager] Configuration updated');
  }

  /**
   * 정리 작업
   */
  public cleanup(): void {
    this.controller.cleanup();
    this.tracker.cleanup();
    logger.debug('[VideoManager] Cleanup completed');
  }

  // Private 메서드들

  /**
   * 기본 이벤트 핸들러 설정
   */
  private setupDefaultEventHandlers(): void {
    // 비디오 재생 시작 시 로깅
    this.tracker.addEventListener('play', event => {
      logger.debug('[VideoManager] Video started playing', {
        tweetId: event.tweetId,
        src: event.video.src || event.video.currentSrc,
      });
    });

    // 비디오 일시정지 시 로깅
    this.tracker.addEventListener('pause', event => {
      logger.debug('[VideoManager] Video paused', {
        tweetId: event.tweetId,
        currentTime: event.video.currentTime,
      });
    });

    // 비디오 에러 시 로깅
    this.tracker.addEventListener('error', event => {
      logger.warn('[VideoManager] Video error occurred', {
        tweetId: event.tweetId,
        error: event.data,
      });
    });
  }
}
