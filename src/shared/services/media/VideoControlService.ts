/**
 * @fileoverview Video Control Service - 통합 비디오 제어 서비스
 * @version 1.0.0
 *
 * 갤러리 진입/종료 시 배경 비디오 상태를 관리하는 핵심 서비스
 * 미디어 클릭 즉시 배경 비디오를 정지시켜 사용자 경험을 개선합니다.
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from '@shared/utils/timer-management';
import { getGallerySignals } from '@shared/state/mediators/gallery-signal-mediator';

/**
 * 비디오 상태 정보
 */
interface VideoState {
  /** 정지 전 재생 상태 */
  wasPlaying: boolean;
  /** 정지 전 재생 위치 */
  currentTime: number;
  /** 정지 전 볼륨 */
  volume: number;
  /** 정지 전 음소거 상태 */
  muted: boolean;
}

/**
 * 통합 비디오 제어 서비스 - Phase 4 간소화
 *
 * 주요 기능:
 * - 갤러리 진입 시 배경 비디오 즉시 정지
 * - 갤러리 종료 시 이전 상태로 복원
 * - 갤러리 내부 비디오와 배경 비디오 구분
 * - 안전한 상태 저장 및 복원
 */
export class VideoControlService {
  private readonly pausedVideos = new Map<HTMLVideoElement, VideoState>();
  private isGalleryActive = false;
  private cleanupInterval: number | null = null;
  // 갤러리 비디오 재생 상태(테스트/JSDOM 호환 목적)
  private readonly galleryPlaybackState = new WeakMap<HTMLVideoElement, { playing: boolean }>();

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * 배경 페이지의 모든 비디오를 즉시 정지
   * 갤러리 진입 시점에 호출
   */
  public pauseAllBackgroundVideos(): void {
    if (this.isGalleryActive) {
      logger.debug('[VideoControl] 이미 갤러리가 활성화되어 있음 - 중복 호출 무시');
      return;
    }

    const videos = this.findAllBackgroundVideos();
    logger.info(`[VideoControl] 배경 비디오 ${videos.length}개 정지 중...`);

    let pausedCount = 0;
    videos.forEach(video => {
      try {
        if (!video.paused && this.isValidVideo(video)) {
          // 복원용 상태 저장
          this.pausedVideos.set(video, {
            wasPlaying: true,
            currentTime: video.currentTime,
            volume: video.volume,
            muted: video.muted,
          });

          video.pause();
          pausedCount++;
          logger.debug(`[VideoControl] 비디오 정지: ${this.getVideoInfo(video)}`);
        }
      } catch (error) {
        logger.warn('[VideoControl] 비디오 정지 실패:', error);
      }
    });

    this.isGalleryActive = true;
    logger.info(`[VideoControl] 배경 비디오 정지 완료: ${pausedCount}개`);
  }

  // ================================
  // Gallery context helpers (keyboard controls)
  // ================================

  /**
   * 현재 갤러리 인덱스의 비디오 요소를 반환 (없으면 null)
   */
  private getCurrentGalleryVideo(): HTMLVideoElement | null {
    try {
      let doc: Document | undefined;
      if (typeof document !== 'undefined') {
        doc = document;
      } else if (typeof globalThis !== 'undefined') {
        doc = (globalThis as { document?: Document }).document;
      }

      if (!doc) return null;

      const container = doc.querySelector('#xeg-gallery-root');
      if (!container) return null;

      const items = container.querySelector('[data-xeg-role="items-container"]');
      if (!items) return null;

      const index = getGallerySignals().currentIndex.value;
      const target = (items as HTMLElement).children?.[index] as HTMLElement | undefined;
      if (!target) return null;

      const video = target.querySelector('video');
      return video instanceof HTMLVideoElement ? video : null;
    } catch (error) {
      logger.debug('[VideoControl] Failed to get current gallery video', { error });
      return null;
    }
  }

  /**
   * 현재 갤러리 비디오의 play/pause 토글 (JSDOM 환경 호환)
   */
  public togglePlayPauseCurrent(): void {
    const video = this.getCurrentGalleryVideo();
    if (!video) return;

    try {
      const current = this.galleryPlaybackState.get(video)?.playing ?? !video.paused;
      const next = !current;

      if (next) {
        // JSDOM 환경을 고려하여 optional chaining 사용
        // 일부 환경에서 play()가 Promise를 반환하지 않을 수 있으므로 void 처리
        void (video as HTMLVideoElement & Partial<{ play: () => Promise<void> }>).play?.();
      } else {
        (video as HTMLVideoElement & Partial<{ pause: () => void }>).pause?.();
      }

      this.galleryPlaybackState.set(video, { playing: next });
      logger.debug(`[VideoControl] toggle play->${next}`);
    } catch (error) {
      logger.debug('[VideoControl] toggle play/pause failed', { error });
    }
  }

  /** 볼륨 증가 (10% 스텝, 상한 1.0) */
  public volumeUpCurrent(step = 0.1): void {
    const video = this.getCurrentGalleryVideo();
    if (!video) return;
    try {
      const v = Math.min(1, Math.round((video.volume + step) * 100) / 100);
      video.volume = v;
      if (v > 0 && video.muted) video.muted = false;
      logger.debug('[VideoControl] volume up', { volume: v });
    } catch (error) {
      logger.debug('[VideoControl] volume up failed', { error });
    }
  }

  /** 볼륨 감소 (10% 스텝, 하한 0.0) */
  public volumeDownCurrent(step = 0.1): void {
    const video = this.getCurrentGalleryVideo();
    if (!video) return;
    try {
      const v = Math.max(0, Math.round((video.volume - step) * 100) / 100);
      video.volume = v;
      logger.debug('[VideoControl] volume down', { volume: v });
    } catch (error) {
      logger.debug('[VideoControl] volume down failed', { error });
    }
  }

  /** 음소거 토글 */
  public toggleMuteCurrent(): void {
    const video = this.getCurrentGalleryVideo();
    if (!video) return;
    try {
      video.muted = !video.muted;
      logger.debug('[VideoControl] toggle mute', { muted: video.muted });
    } catch (error) {
      logger.debug('[VideoControl] toggle mute failed', { error });
    }
  }

  /**
   * 갤러리 종료 시 이전 상태로 복원
   */
  public restoreBackgroundVideos(): void {
    if (!this.isGalleryActive) {
      logger.debug('[VideoControl] 갤러리가 활성화되지 않았음 - 복원 무시');
      return;
    }

    logger.info(`[VideoControl] 배경 비디오 상태 복원 중... (${this.pausedVideos.size}개)`);

    let restoredCount = 0;
    this.pausedVideos.forEach((state, video) => {
      try {
        if (this.isValidVideo(video) && state.wasPlaying) {
          // 비디오가 여전히 DOM에 존재하고 접근 가능한 경우에만 복원
          video.currentTime = state.currentTime;
          video.volume = state.volume;
          video.muted = state.muted;

          video.play().catch(error => {
            logger.debug('[VideoControl] 비디오 재생 복원 실패 (정상적인 상황):', error);
          });

          restoredCount++;
          logger.debug(`[VideoControl] 비디오 복원: ${this.getVideoInfo(video)}`);
        }
      } catch (error) {
        logger.warn('[VideoControl] 비디오 복원 실패:', error);
      }
    });

    this.pausedVideos.clear();
    this.isGalleryActive = false;
    logger.info(`[VideoControl] 배경 비디오 상태 복원 완료: ${restoredCount}개`);
  }

  /**
   * 현재 갤러리 활성화 상태 확인
   */
  public isActive(): boolean {
    return this.isGalleryActive;
  }

  /**
   * 저장된 비디오 상태 개수 확인 (디버깅용)
   */
  public getPausedVideoCount(): number {
    return this.pausedVideos.size;
  }

  /**
   * 강제 초기화 (에러 복구용)
   */
  public forceReset(): void {
    logger.warn('[VideoControl] 강제 초기화 실행');
    this.pausedVideos.clear();
    this.isGalleryActive = false;
  }

  /**
   * 서비스 종료
   */
  public destroy(): void {
    this.restoreBackgroundVideos();
    if (this.cleanupInterval) {
      globalTimerManager.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logger.info('[VideoControl] 서비스 종료됨');
  }

  /**
   * 배경 비디오 요소들 찾기
   */
  private findAllBackgroundVideos(): HTMLVideoElement[] {
    const selectors = [
      'video',
      '[data-testid="videoPlayer"] video',
      '[data-testid="previewInterstitial"] video',
      '.r-1p0dtai video', // 트위터 비디오 컨테이너
      '[data-testid="videoComponent"] video',
    ];

    const videos: HTMLVideoElement[] = [];
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll<HTMLVideoElement>(selector);
        elements.forEach(video => {
          if (video instanceof HTMLVideoElement && !this.isGalleryVideo(video)) {
            videos.push(video);
          }
        });
      } catch (error) {
        logger.debug(`[VideoControl] 선택자 처리 실패: ${selector}`, error);
      }
    });

    return videos;
  }

  /**
   * 갤러리 내부 비디오인지 확인
   */
  private isGalleryVideo(video: HTMLVideoElement): boolean {
    const gallerySelectors = [
      '.xeg-gallery',
      '.xeg-gallery-container',
      '[data-xeg-role]',
      '[data-gallery-element]',
      '[data-gallery-video]',
      '#xeg-gallery-root',
      '.vertical-gallery-view',
    ];

    return gallerySelectors.some(selector => {
      try {
        return video.closest(selector) !== null || video.hasAttribute('data-gallery-video');
      } catch {
        return false;
      }
    });
  }

  /**
   * 비디오 유효성 검사
   */
  private isValidVideo(video: HTMLVideoElement): boolean {
    try {
      // DOM에 연결되어 있고 접근 가능한지 확인
      return (
        video.isConnected && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.ended
      );
    } catch {
      return false;
    }
  }

  /**
   * 비디오 정보 문자열 생성 (디버깅용)
   */
  private getVideoInfo(video: HTMLVideoElement): string {
    try {
      const src = video.src || video.currentSrc || 'unknown';
      const duration = video.duration || 0;
      return `${src.substring(0, 50)}... (${duration.toFixed(1)}s)`;
    } catch {
      return 'unknown video';
    }
  }

  /**
   * 정리 타이머 시작 (메모리 누수 방지)
   */
  private startCleanupTimer(): void {
    // 테스트 모드에서는 주기적 정리 타이머를 시작하지 않아 타이머 잔여를 방지
    if (import.meta.env.MODE === 'test') {
      return;
    }
    this.cleanupInterval = globalTimerManager.setInterval(() => {
      // 더 이상 DOM에 없는 비디오 참조 정리
      const invalidVideos: HTMLVideoElement[] = [];
      this.pausedVideos.forEach((_state, video) => {
        if (!this.isValidVideo(video)) {
          invalidVideos.push(video);
        }
      });

      invalidVideos.forEach(video => {
        this.pausedVideos.delete(video);
      });

      if (invalidVideos.length > 0) {
        logger.debug(`[VideoControl] 무효한 비디오 참조 ${invalidVideos.length}개 정리`);
      }
    }, 30000); // 30초마다 정리
  }
}
