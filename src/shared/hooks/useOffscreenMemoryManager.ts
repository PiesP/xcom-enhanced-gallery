/**
 * Phase 7 GREEN: 오프스크린 메모리 관리 훅
 *
 * 목표:
 * - 뷰포트 밖 미디어 언로딩으로 메모리 최적화
 * - Intersection Observer로 뷰포트 감지
 * - 비디오/이미지별 언로딩 전략
 */

import { getPreactHooksSafe } from '@shared/external/vendors/vendor-api-safe';
import { logger } from '@shared/logging/logger';

const { useEffect, useRef, useCallback } = getPreactHooksSafe();

export interface OffscreenMemoryOptions {
  maxOffscreenVideos?: number;
  unloadDelay?: number;
  enableImages?: boolean;
  enableVideos?: boolean;
  rootMargin?: string;
  threshold?: number;
}

export interface OffscreenMemoryManager {
  unloadOffscreenVideos: () => Promise<void>;
  reloadVideo: (element: HTMLVideoElement, state: VideoState) => Promise<void>;
  trackElement: (element: HTMLElement) => void;
  untrackElement: (element: HTMLElement) => void;
  getStats: () => MemoryStats;
}

export interface VideoState {
  src: string;
  currentTime: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
}

export interface MemoryStats {
  trackedElements: number;
  offscreenElements: number;
  unloadedVideos: number;
  memoryFreed: number; // bytes
}

const DEFAULT_OPTIONS: Required<OffscreenMemoryOptions> = {
  maxOffscreenVideos: 3,
  unloadDelay: 2000, // 2초 후 언로딩
  enableImages: true,
  enableVideos: true,
  rootMargin: '100px',
  threshold: 0,
};

/**
 * 오프스크린 메모리 관리 훅
 */
export function useOffscreenMemoryManager(
  options: OffscreenMemoryOptions = {}
): OffscreenMemoryManager {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // 추적 상태
  const trackedElements = useRef(new Map<HTMLElement, ElementTrackingData>());
  const unloadedVideos = useRef(new Map<HTMLVideoElement, VideoState>());
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  const unloadTimers = useRef(new Map<HTMLElement, number>());

  // 통계
  const stats = useRef<MemoryStats>({
    trackedElements: 0,
    offscreenElements: 0,
    unloadedVideos: 0,
    memoryFreed: 0,
  });

  /**
   * Intersection Observer 콜백
   */
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        const trackingData = trackedElements.current.get(element);

        if (!trackingData) return;

        if (entry.isIntersecting) {
          // 뷰포트에 진입 - 언로딩 타이머 취소
          if (unloadTimers.current.has(element)) {
            clearTimeout(unloadTimers.current.get(element)!);
            unloadTimers.current.delete(element);
            logger.debug('뷰포트 진입으로 언로딩 타이머 취소:', element);
          }

          // 언로딩된 비디오가 있다면 재로딩
          if (element instanceof HTMLVideoElement && unloadedVideos.current.has(element)) {
            reloadVideoInternal(element);
          }

          trackingData.isVisible = true;
          stats.current.offscreenElements = Math.max(0, stats.current.offscreenElements - 1);
        } else {
          // 뷰포트에서 벗어남 - 언로딩 타이머 시작
          trackingData.isVisible = false;
          stats.current.offscreenElements += 1;

          const timer = setTimeout(() => {
            unloadElementIfNeeded(element);
            unloadTimers.current.delete(element);
          }, config.unloadDelay);

          unloadTimers.current.set(element, timer as unknown as number);
          logger.debug('뷰포트 벗어남으로 언로딩 타이머 시작:', element, `${config.unloadDelay}ms`);
        }
      });
    },
    [config.unloadDelay]
  );

  /**
   * Intersection Observer 초기화
   */
  useEffect(() => {
    if (!globalThis.IntersectionObserver) {
      logger.warn('IntersectionObserver not supported');
      return;
    }

    intersectionObserver.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: config.rootMargin,
      threshold: config.threshold,
    });

    return () => {
      intersectionObserver.current?.disconnect();
      // 모든 타이머 정리
      unloadTimers.current.forEach(timer => clearTimeout(timer));
      unloadTimers.current.clear();
    };
  }, [handleIntersection, config.rootMargin, config.threshold]);

  /**
   * 비디오 상태 저장
   */
  const saveVideoState = useCallback((video: HTMLVideoElement): VideoState => {
    return {
      src: video.src,
      currentTime: video.currentTime,
      volume: video.volume,
      muted: video.muted,
      playbackRate: video.playbackRate,
    };
  }, []);

  /**
   * 비디오 언로딩 (내부용)
   */
  const unloadVideoInternal = useCallback(
    (video: HTMLVideoElement): boolean => {
      try {
        // 상태 저장
        const state = saveVideoState(video);
        unloadedVideos.current.set(video, state);

        // 비디오 언로딩 시퀀스
        video.pause();
        video.src = '';
        video.load();

        stats.current.unloadedVideos += 1;
        stats.current.memoryFreed += estimateVideoMemoryUsage(video);

        logger.debug('비디오 언로딩 완료:', video, state);
        return true;
      } catch (error) {
        logger.error('비디오 언로딩 실패:', error, video);
        return false;
      }
    },
    [saveVideoState]
  );

  /**
   * 비디오 재로딩 (내부용)
   */
  const reloadVideoInternal = useCallback(async (video: HTMLVideoElement): Promise<void> => {
    const state = unloadedVideos.current.get(video);
    if (!state) {
      logger.warn('재로딩할 비디오 상태를 찾을 수 없음:', video);
      return;
    }

    try {
      // 비디오 재로딩 시퀀스
      video.src = state.src;
      video.currentTime = state.currentTime;
      video.volume = state.volume;
      video.muted = state.muted;
      video.playbackRate = state.playbackRate;

      // 로드 대기
      await new Promise<void>((resolve, reject) => {
        const handleLoadedData = () => {
          video.removeEventListener('loadeddata', handleLoadedData);
          video.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = () => {
          video.removeEventListener('loadeddata', handleLoadedData);
          video.removeEventListener('error', handleError);
          reject(new Error('비디오 로딩 실패'));
        };

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);
        video.load();
      });

      unloadedVideos.current.delete(video);
      stats.current.unloadedVideos = Math.max(0, stats.current.unloadedVideos - 1);

      logger.debug('비디오 재로딩 완료:', video, state);
    } catch (error) {
      logger.error('비디오 재로딩 실패:', error, video, state);
      throw error;
    }
  }, []);

  /**
   * 이미지 언로딩 (내부용)
   */
  const unloadImageInternal = useCallback((img: HTMLImageElement): boolean => {
    try {
      // 이미지는 단순 언마운트
      const originalSrc = img.src;
      img.src = '';

      // blob URL이면 해제
      if (originalSrc.startsWith('blob:')) {
        URL.revokeObjectURL(originalSrc);
      }

      stats.current.memoryFreed += estimateImageMemoryUsage(img);
      logger.debug('이미지 언로딩 완료:', img, originalSrc);
      return true;
    } catch (error) {
      logger.error('이미지 언로딩 실패:', error, img);
      return false;
    }
  }, []);

  /**
   * 요소별 언로딩 처리
   */
  const unloadElementIfNeeded = useCallback(
    (element: HTMLElement): void => {
      if (element instanceof HTMLVideoElement && config.enableVideos) {
        // 오프스크린 비디오 개수 제한 확인
        if (unloadedVideos.current.size < config.maxOffscreenVideos) {
          unloadVideoInternal(element);
        }
      } else if (element instanceof HTMLImageElement && config.enableImages) {
        unloadImageInternal(element);
      }
    },
    [
      config.enableVideos,
      config.enableImages,
      config.maxOffscreenVideos,
      unloadVideoInternal,
      unloadImageInternal,
    ]
  );

  // Public API
  const trackElement = useCallback((element: HTMLElement): void => {
    if (!intersectionObserver.current) return;

    const trackingData: ElementTrackingData = {
      element,
      isVisible: false,
      trackedAt: Date.now(),
    };

    trackedElements.current.set(element, trackingData);
    intersectionObserver.current.observe(element);
    stats.current.trackedElements += 1;

    logger.debug('요소 추적 시작:', element);
  }, []);

  const untrackElement = useCallback((element: HTMLElement): void => {
    if (!intersectionObserver.current) return;

    intersectionObserver.current.unobserve(element);
    trackedElements.current.delete(element);

    // 타이머가 있다면 정리
    if (unloadTimers.current.has(element)) {
      clearTimeout(unloadTimers.current.get(element)!);
      unloadTimers.current.delete(element);
    }

    stats.current.trackedElements = Math.max(0, stats.current.trackedElements - 1);
    logger.debug('요소 추적 중단:', element);
  }, []);

  const unloadOffscreenVideos = useCallback(async (): Promise<void> => {
    const offscreenVideos: HTMLVideoElement[] = [];

    trackedElements.current.forEach(({ element, isVisible }) => {
      if (!isVisible && element instanceof HTMLVideoElement && config.enableVideos) {
        offscreenVideos.push(element);
      }
    });

    logger.debug('오프스크린 비디오 언로딩 시작:', `${offscreenVideos.length}개`);

    for (const video of offscreenVideos) {
      unloadVideoInternal(video);
    }
  }, [config.enableVideos, unloadVideoInternal]);

  const reloadVideo = useCallback(
    async (element: HTMLVideoElement, state: VideoState): Promise<void> => {
      unloadedVideos.current.set(element, state);
      await reloadVideoInternal(element);
    },
    [reloadVideoInternal]
  );

  const getStats = useCallback((): MemoryStats => {
    return { ...stats.current };
  }, []);

  return {
    unloadOffscreenVideos,
    reloadVideo,
    trackElement,
    untrackElement,
    getStats,
  };
}

// Helper interfaces
interface ElementTrackingData {
  element: HTMLElement;
  isVisible: boolean;
  trackedAt: number;
}

// Helper functions
function estimateVideoMemoryUsage(video: HTMLVideoElement): number {
  // 대략적인 비디오 메모리 사용량 추정 (바이트)
  const width = video.videoWidth || 1920;
  const height = video.videoHeight || 1080;
  // YUV420 포맷 기준: width * height * 1.5 bytes per frame
  // + 버퍼링된 프레임들 (약 5초분)
  const frameSizeBytes = width * height * 1.5;
  const estimatedBufferSeconds = 5;
  const estimatedFps = 30;
  return frameSizeBytes * estimatedBufferSeconds * estimatedFps;
}

function estimateImageMemoryUsage(img: HTMLImageElement): number {
  // 대략적인 이미지 메모리 사용량 추정 (바이트)
  const width = img.naturalWidth || 1920;
  const height = img.naturalHeight || 1080;
  // RGBA 포맷 기준: width * height * 4 bytes
  return width * height * 4;
}
