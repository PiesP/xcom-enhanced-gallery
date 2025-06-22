/**
 * @fileoverview Video Service - 비디오 상태 및 제어 통합 관리
 * @version 1.1.0 - Simplified naming
 *
 * 비디오 상태 관리와 제어 기능을 통합하는 서비스
 * Clean Architecture 원칙에 따라 비디오 관련 모든 기능을 통합 관리
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 갤러리 트리거 버튼 정보
 */
interface GalleryTriggerButton {
  element: HTMLElement;
  tweetId: string;
}

/**
 * 비디오 상태 정보
 */
interface VideoState {
  element: HTMLVideoElement;
  wasPlaying: boolean;
  currentTime: number;
}

/**
 * 비디오 관리 옵션
 */
interface VideoManagerOptions {
  enableLogging: boolean;
  enableStatePreservation: boolean;
  enableGalleryTriggerMaintenance: boolean;
}

/**
 * 통합 비디오 서비스
 *
 * 비디오 재생 제어, 상태 관리, 갤러리 트리거 유지 기능을
 * 하나의 서비스로 통합하여 제공합니다.
 */
export class VideoService {
  private static instance: VideoService | null = null;

  private readonly videoStates = new Map<HTMLVideoElement, VideoState>();
  private readonly galleryTriggers = new Map<string, GalleryTriggerButton>();
  private readonly options: VideoManagerOptions;

  private mutationObserver: MutationObserver | null = null;
  private isObserving = false;

  private constructor(options: Partial<VideoManagerOptions> = {}) {
    this.options = {
      enableLogging: true,
      enableStatePreservation: true,
      enableGalleryTriggerMaintenance: true,
      ...options,
    };

    this.log('VideoService 초기화', this.options);
  }

  public static getInstance(options?: Partial<VideoManagerOptions>): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService(options);
    }
    return VideoService.instance;
  }

  /**
   * 비디오 서비스 시작
   */
  public start(): void {
    if (this.isObserving) {
      this.log('이미 모니터링 중입니다');
      return;
    }

    this.startVideoObserver();
    this.scanExistingVideos();

    if (this.options.enableGalleryTriggerMaintenance) {
      this.scanGalleryTriggers();
    }

    this.isObserving = true;
    this.log('VideoService 시작 완료');
  }

  /**
   * 비디오 서비스 중지
   */
  public stop(): void {
    if (!this.isObserving) {
      return;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.videoStates.clear();
    this.galleryTriggers.clear();
    this.isObserving = false;

    this.log('VideoService 중지 완료');
  }

  /**
   * 모든 비디오 일시정지
   */
  public pauseAllVideos(): void {
    const videos = document.querySelectorAll('video');
    let pausedCount = 0;

    videos.forEach(video => {
      if (!video.paused) {
        this.saveVideoState(video);
        video.pause();
        pausedCount++;
      }
    });

    this.log(`${pausedCount}개 비디오 일시정지`);
  }

  /**
   * 저장된 비디오 상태 복원
   */
  public restoreVideoStates(): void {
    let restoredCount = 0;

    this.videoStates.forEach((state, video) => {
      if (document.contains(video)) {
        try {
          if (state.wasPlaying) {
            video.currentTime = state.currentTime;
            video.play().catch(() => {
              this.log(`비디오 재생 복원 실패: ${video.src}`);
            });
          }
          restoredCount++;
        } catch (error) {
          this.log('비디오 상태 복원 실패', error);
        }
      }
    });

    this.log(`${restoredCount}개 비디오 상태 복원`);
    this.videoStates.clear();
  }

  /**
   * 갤러리 트리거 버튼 복원
   */
  public restoreGalleryTriggers(): void {
    if (!this.options.enableGalleryTriggerMaintenance) {
      return;
    }

    let restoredCount = 0;

    this.galleryTriggers.forEach((trigger, tweetId) => {
      if (!document.contains(trigger.element)) {
        const newTrigger = this.findGalleryTriggerForTweet(tweetId);
        if (newTrigger) {
          this.galleryTriggers.set(tweetId, {
            element: newTrigger,
            tweetId,
          });
          restoredCount++;
        } else {
          this.galleryTriggers.delete(tweetId);
        }
      }
    });

    this.log(`${restoredCount}개 갤러리 트리거 복원`);
  }

  /**
   * 비디오 상태 저장
   */
  private saveVideoState(video: HTMLVideoElement): void {
    if (!this.options.enableStatePreservation) {
      return;
    }

    const state: VideoState = {
      element: video,
      wasPlaying: !video.paused,
      currentTime: video.currentTime,
    };

    this.videoStates.set(video, state);
  }

  /**
   * 비디오 관찰자 시작
   */
  private startVideoObserver(): void {
    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              this.processNewElement(element);
            }
          });

          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              this.processRemovedElement(element);
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 새로 추가된 요소 처리
   */
  private processNewElement(element: Element): void {
    // 비디오 요소 처리
    const videos =
      element.tagName === 'VIDEO'
        ? [element as HTMLVideoElement]
        : Array.from(element.querySelectorAll('video'));

    videos.forEach(video => {
      this.setupVideoEventListeners(video);
    });

    // 갤러리 트리거 처리
    if (this.options.enableGalleryTriggerMaintenance) {
      this.findAndRegisterGalleryTriggers(element);
    }
  }

  /**
   * 제거된 요소 처리
   */
  private processRemovedElement(element: Element): void {
    // 비디오 상태에서 제거
    const videos =
      element.tagName === 'VIDEO'
        ? [element as HTMLVideoElement]
        : Array.from(element.querySelectorAll('video'));

    videos.forEach(video => {
      this.videoStates.delete(video);
    });
  }

  /**
   * 기존 비디오 스캔
   */
  private scanExistingVideos(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      this.setupVideoEventListeners(video);
    });

    this.log(`${videos.length}개 기존 비디오 스캔 완료`);
  }

  /**
   * 비디오 이벤트 리스너 설정
   */
  private setupVideoEventListeners(video: HTMLVideoElement): void {
    const playHandler = () => {
      this.log(`비디오 재생 시작: ${video.src}`);
    };

    const pauseHandler = () => {
      this.log(`비디오 일시정지: ${video.src}`);
    };

    video.addEventListener('play', playHandler);
    video.addEventListener('pause', pauseHandler);
  }

  /**
   * 갤러리 트리거 스캔
   */
  private scanGalleryTriggers(): void {
    const triggers = document.querySelectorAll('[data-tweet-id]');
    triggers.forEach(trigger => {
      const tweetId = trigger.getAttribute('data-tweet-id');
      if (tweetId && this.isGalleryTrigger(trigger as HTMLElement)) {
        this.galleryTriggers.set(tweetId, {
          element: trigger as HTMLElement,
          tweetId,
        });
      }
    });

    this.log(`${this.galleryTriggers.size}개 갤러리 트리거 스캔 완료`);
  }

  /**
   * 새로운 갤러리 트리거 찾기 및 등록
   */
  private findAndRegisterGalleryTriggers(element: Element): void {
    const triggers = element.querySelectorAll('[data-tweet-id]');
    triggers.forEach(trigger => {
      const tweetId = trigger.getAttribute('data-tweet-id');
      if (tweetId && this.isGalleryTrigger(trigger as HTMLElement)) {
        this.galleryTriggers.set(tweetId, {
          element: trigger as HTMLElement,
          tweetId,
        });
      }
    });
  }

  /**
   * 특정 트윗의 갤러리 트리거 찾기
   */
  private findGalleryTriggerForTweet(tweetId: string): HTMLElement | null {
    const selector = `[data-tweet-id="${tweetId}"]`;
    const candidates = document.querySelectorAll(selector);

    for (const candidate of candidates) {
      if (this.isGalleryTrigger(candidate as HTMLElement)) {
        return candidate as HTMLElement;
      }
    }

    return null;
  }

  /**
   * 갤러리 트리거 여부 확인
   */
  private isGalleryTrigger(element: HTMLElement): boolean {
    // 이미지를 포함하고 있고 클릭 가능한 요소인지 확인
    const hasImages = element.querySelector('img') !== null;
    const isClickable =
      element.style.cursor === 'pointer' ||
      element.getAttribute('role') === 'button' ||
      element.tagName === 'BUTTON' ||
      element.tagName === 'A';

    return hasImages && isClickable;
  }

  /**
   * 로깅
   */
  private log(message: string, data?: unknown): void {
    if (this.options.enableLogging) {
      if (data) {
        logger.debug(`[VideoService] ${message}`, data);
      } else {
        logger.debug(`[VideoService] ${message}`);
      }
    }
  }

  /**
   * 진단 정보
   */
  public getDiagnostics() {
    return {
      isObserving: this.isObserving,
      videoStatesCount: this.videoStates.size,
      galleryTriggersCount: this.galleryTriggers.size,
      options: this.options,
    };
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.stop();
    VideoService.instance = null;
  }

  /**
   * 모든 캐시 정리 (호환성을 위한 메서드)
   */
  public clearAllCache(): void {
    this.videoStates.clear();
    this.galleryTriggers.clear();
    this.log('모든 캐시 정리 완료');
  }

  /**
   * 컨테이너 내 비디오 일시정지 (호환성을 위한 메서드)
   */
  public pauseVideosInContainer(container: HTMLElement): void {
    const videos = container.querySelectorAll('video');
    videos.forEach(video => {
      if (!video.paused) {
        this.saveVideoState(video as HTMLVideoElement);
        video.pause();
      }
    });
    this.log(`컨테이너 내 ${videos.length}개 비디오 일시정지`);
  }

  /**
   * 캐시된 미디어 조회 (호환성을 위한 메서드)
   */
  public async getCachedMedia(tweetId: string): Promise<unknown> {
    // 현재는 빈 구현 - 필요시 확장 가능
    this.log(`캐시된 미디어 조회 요청: ${tweetId}`);
    return null;
  }

  /**
   * 트윗의 미디어 캐시 (호환성을 위한 메서드)
   */
  public cacheMediaForTweet(tweetId: string, _container: HTMLElement, mediaItems: unknown[]): void {
    // 현재는 빈 구현 - 필요시 확장 가능
    this.log(`트윗 미디어 캐시: ${tweetId}, 아이템 수: ${mediaItems.length}`);
  }

  /**
   * 비디오 요소에서 미디어 추출 (호환성을 위한 메서드)
   */
  public extractMediaFromVideoElement(_video: HTMLVideoElement): unknown {
    // 현재는 빈 구현 - 필요시 확장 가능
    this.log('비디오 요소에서 미디어 추출');
    return null;
  }
}

/**
 * 전역 인스턴스
 */
export const videoService = VideoService.getInstance();

// 기존 호환성을 위한 별칭
export const UnifiedVideoManager = VideoService;
export const VideoStateManager = VideoService;
export const VideoControlUtil = VideoService;
