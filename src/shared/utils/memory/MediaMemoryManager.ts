/**
 * Phase 7 GREEN: 미디어 메모리 관리자
 *
 * 목표:
 * - 비디오/이미지 통합 메모리 관리
 * - 정책 기반 언로딩 결정
 * - 성능 모니터링
 */

import { logger } from '@shared/logging/logger';
import { VideoUnloadTracker } from '@shared/utils/video-unload';
import { ImageUnloadManager } from '@shared/utils/image-unload';

export interface MediaMemoryOptions {
  maxOffscreenVideos: number;
  maxOffscreenImages: number;
  unloadDelay: number;
  enableVideoUnloading: boolean;
  enableImageUnloading: boolean;
  memoryThreshold: number; // bytes
}

export interface MediaMemoryStats {
  totalTracked: number;
  videosTracked: number;
  imagesTracked: number;
  videosUnloaded: number;
  imagesUnloaded: number;
  estimatedMemoryFreed: number; // bytes
  estimatedMemoryUsage: number; // bytes (현재 사용 중인 추정 메모리)
  lastCleanupTime: number;
}

const DEFAULT_OPTIONS: MediaMemoryOptions = {
  maxOffscreenVideos: 3,
  maxOffscreenImages: 10,
  unloadDelay: 2000,
  enableVideoUnloading: true,
  enableImageUnloading: false, // 기본적으로 이미지는 비활성화
  memoryThreshold: 100 * 1024 * 1024, // 100MB
};

/**
 * 미디어 메모리 관리자
 */
export class MediaMemoryManager {
  private readonly options: MediaMemoryOptions;
  private readonly videoTracker = new VideoUnloadTracker();
  private readonly imageManager = new ImageUnloadManager();
  private readonly trackedElements = new Map<HTMLElement, ElementInfo>();
  private readonly unloadTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

  private readonly stats: MediaMemoryStats = {
    totalTracked: 0,
    videosTracked: 0,
    imagesTracked: 0,
    videosUnloaded: 0,
    imagesUnloaded: 0,
    estimatedMemoryFreed: 0,
    estimatedMemoryUsage: 0,
    lastCleanupTime: 0,
  };

  constructor(options: Partial<MediaMemoryOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    logger.debug('MediaMemoryManager 초기화:', this.options);
  }

  /**
   * 요소 추적 시작
   */
  trackElement(element: HTMLElement): void {
    if (this.trackedElements.has(element)) {
      logger.debug('이미 추적 중인 요소:', element);
      return;
    }

    const elementInfo: ElementInfo = {
      element,
      type: this.getElementType(element),
      trackedAt: Date.now(),
      isOffscreen: false,
      lastSeenAt: Date.now(),
    };

    this.trackedElements.set(element, elementInfo);
    this.updateStats();

    logger.debug('요소 추적 시작:', elementInfo);
  }

  /**
   * 요소 추적 중단
   */
  untrackElement(element: HTMLElement): void {
    const elementInfo = this.trackedElements.get(element);
    if (!elementInfo) {
      return;
    }

    // 대기 중인 타이머 취소
    if (this.unloadTimers.has(element)) {
      clearTimeout(this.unloadTimers.get(element)!);
      this.unloadTimers.delete(element);
    }

    this.trackedElements.delete(element);
    this.updateStats();

    logger.debug('요소 추적 중단:', elementInfo);
  }

  /**
   * 요소가 오프스크린 상태임을 표시
   */
  markOffscreen(element: HTMLElement): void {
    const elementInfo = this.trackedElements.get(element);
    if (!elementInfo || elementInfo.isOffscreen) {
      return;
    }

    elementInfo.isOffscreen = true;
    this.scheduleUnload(element);

    logger.debug('요소 오프스크린 표시:', elementInfo);
  }

  /**
   * 요소가 온스크린 상태임을 표시
   */
  markOnscreen(element: HTMLElement): void {
    const elementInfo = this.trackedElements.get(element);
    if (!elementInfo?.isOffscreen) {
      return;
    }

    elementInfo.isOffscreen = false;
    elementInfo.lastSeenAt = Date.now();

    // 언로딩 타이머 취소
    if (this.unloadTimers.has(element)) {
      clearTimeout(this.unloadTimers.get(element)!);
      this.unloadTimers.delete(element);
    }

    // 언로딩된 상태면 재로딩 시도
    this.attemptReload(element);

    logger.debug('요소 온스크린 표시:', elementInfo);
  }

  /**
   * 강제 정리 실행
   */
  async forceCleanup(): Promise<void> {
    logger.debug('강제 메모리 정리 시작');

    const offscreenElements = Array.from(this.trackedElements.values()).filter(
      info => info.isOffscreen
    );

    for (const elementInfo of offscreenElements) {
      await this.unloadElement(elementInfo.element);
    }

    this.stats.lastCleanupTime = Date.now();
    logger.debug('강제 메모리 정리 완료:', this.stats);
  }

  /**
   * 통계 조회
   */
  getStats(): MediaMemoryStats {
    return { ...this.stats };
  }

  /**
   * 정리
   */
  cleanup(): void {
    // 모든 타이머 정리
    this.unloadTimers.forEach(timer => clearTimeout(timer));
    this.unloadTimers.clear();

    // 추적 상태 정리
    this.trackedElements.clear();
    this.videoTracker.clear();
    this.imageManager.clear();

    logger.debug('MediaMemoryManager 정리 완료');
  }

  private getElementType(element: HTMLElement): 'video' | 'image' | 'unknown' {
    if (element instanceof HTMLVideoElement) return 'video';
    if (element instanceof HTMLImageElement) return 'image';
    return 'unknown';
  }

  private scheduleUnload(element: HTMLElement): void {
    const elementInfo = this.trackedElements.get(element);
    if (!elementInfo) return;

    // 이미 스케줄된 경우 기존 타이머 취소
    if (this.unloadTimers.has(element)) {
      clearTimeout(this.unloadTimers.get(element)!);
    }

    const timer = setTimeout(() => {
      this.unloadElement(element);
      this.unloadTimers.delete(element);
    }, this.options.unloadDelay);

    this.unloadTimers.set(element, timer);
    logger.debug('언로딩 스케줄:', elementInfo, `${this.options.unloadDelay}ms`);
  }

  private async unloadElement(element: HTMLElement): Promise<void> {
    const elementInfo = this.trackedElements.get(element);
    if (!elementInfo?.isOffscreen) {
      return;
    }

    try {
      let unloaded = false;
      let memoryFreed = 0;

      if (elementInfo.type === 'video' && this.options.enableVideoUnloading) {
        // 비디오 언로딩 개수 체크
        const currentUnloaded = this.videoTracker.getStats().unloadedCount;
        if (currentUnloaded < this.options.maxOffscreenVideos) {
          this.videoTracker.markUnloaded(element as HTMLVideoElement);
          unloaded = true;
          memoryFreed = this.estimateVideoMemory(element as HTMLVideoElement);
          this.stats.videosUnloaded += 1;
        }
      } else if (elementInfo.type === 'image' && this.options.enableImageUnloading) {
        // 이미지 언로딩 개수 체크
        const currentUnloaded = this.imageManager.getStats().unloadedCount;
        if (currentUnloaded < this.options.maxOffscreenImages) {
          this.imageManager.unload(element as HTMLImageElement);
          unloaded = true;
          memoryFreed = this.estimateImageMemory(element as HTMLImageElement);
          this.stats.imagesUnloaded += 1;
        }
      }

      if (unloaded) {
        this.stats.estimatedMemoryFreed += memoryFreed;
        logger.debug('요소 언로딩 완료:', elementInfo, `${memoryFreed}bytes`);
      }
    } catch (error) {
      logger.error('요소 언로딩 실패:', error, elementInfo);
    }
  }

  private async attemptReload(element: HTMLElement): Promise<void> {
    const elementInfo = this.trackedElements.get(element);
    if (!elementInfo) return;

    try {
      if (
        elementInfo.type === 'video' &&
        this.videoTracker.isUnloaded(element as HTMLVideoElement)
      ) {
        const state = this.videoTracker.getState(element as HTMLVideoElement);
        if (state) {
          // 재로딩 로직은 외부에서 처리 (useOffscreenMemoryManager)
          logger.debug('비디오 재로딩 필요:', elementInfo);
        }
      } else if (
        elementInfo.type === 'image' &&
        this.imageManager.isUnloaded(element as HTMLImageElement)
      ) {
        await this.imageManager.reload(element as HTMLImageElement);
        this.stats.imagesUnloaded = Math.max(0, this.stats.imagesUnloaded - 1);
        logger.debug('이미지 재로딩 완료:', elementInfo);
      }
    } catch (error) {
      logger.error('요소 재로딩 실패:', error, elementInfo);
    }
  }

  private updateStats(): void {
    const videoCount = Array.from(this.trackedElements.values()).filter(
      info => info.type === 'video'
    ).length;

    const imageCount = Array.from(this.trackedElements.values()).filter(
      info => info.type === 'image'
    ).length;

    // 현재 메모리 사용량 추정
    let estimatedMemoryUsage = 0;
    this.trackedElements.forEach(info => {
      if (
        info.type === 'video' &&
        !this.videoTracker.isUnloaded(info.element as HTMLVideoElement)
      ) {
        estimatedMemoryUsage += this.estimateVideoMemory(info.element as HTMLVideoElement);
      } else if (
        info.type === 'image' &&
        !this.imageManager.isUnloaded(info.element as HTMLImageElement)
      ) {
        estimatedMemoryUsage += this.estimateImageMemory(info.element as HTMLImageElement);
      }
    });

    this.stats.totalTracked = this.trackedElements.size;
    this.stats.videosTracked = videoCount;
    this.stats.imagesTracked = imageCount;
    this.stats.estimatedMemoryUsage = estimatedMemoryUsage;
  }

  private estimateVideoMemory(video: HTMLVideoElement): number {
    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;
    // 대략적인 비디오 메모리 사용량 (더 현실적인 값)
    return width * height * 1.5 * 0.1; // YUV420 * 작은 버퍼 (100KB 정도)
  }

  private estimateImageMemory(img: HTMLImageElement): number {
    const width = img.naturalWidth || img.width || 1920;
    const height = img.naturalHeight || img.height || 1080;
    // RGBA 메모리 사용량 (더 현실적인 값)
    return width * height * 0.1; // 압축된 이미지 추정치 (RGB 압축)
  }
}

interface ElementInfo {
  element: HTMLElement;
  type: 'video' | 'image' | 'unknown';
  trackedAt: number;
  isOffscreen: boolean;
  lastSeenAt: number;
}

// 인스턴스 생성 헬퍼
export function createMediaMemoryManager(
  options?: Partial<MediaMemoryOptions>
): MediaMemoryManager {
  return new MediaMemoryManager(options);
}
