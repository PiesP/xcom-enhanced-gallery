/**
 * Phase 7 GREEN: 비디오 언로딩 유틸리티
 *
 * 목표:
 * - 비디오 언로딩/재로딩 핵심 로직
 * - 상태 저장/복원 기능
 * - 에러 처리 및 안전성
 */

import { logger } from '@shared/logging/logger';

export interface VideoState {
  src: string;
  currentTime: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  paused: boolean;
}

/**
 * 비디오 상태 저장
 */
export function saveVideoState(video: HTMLVideoElement): VideoState {
  return {
    src: video.src,
    currentTime: video.currentTime,
    volume: video.volume,
    muted: video.muted,
    playbackRate: video.playbackRate,
    paused: video.paused,
  };
}

/**
 * 비디오 언로딩
 * pause() → src='' → load() 시퀀스
 */
export function unloadVideo(video: HTMLVideoElement): boolean {
  try {
    logger.debug('비디오 언로딩 시작:', video.src);

    // 1. 재생 중지
    video.pause();

    // 2. src 제거로 버퍼 해제
    video.src = '';

    // 3. load() 호출로 리소스 완전 해제
    video.load();

    logger.debug('비디오 언로딩 완료');
    return true;
  } catch (error) {
    logger.error('비디오 언로딩 실패:', error);
    return false;
  }
}

/**
 * 비디오 재로딩
 */
export async function reloadVideo(video: HTMLVideoElement, state: VideoState): Promise<void> {
  try {
    logger.debug('비디오 재로딩 시작:', state.src);

    // 1. src 설정
    video.src = state.src;

    // 2. 로드 완료 대기
    await waitForVideoLoad(video);

    // 3. 상태 복원
    video.currentTime = state.currentTime;
    video.volume = state.volume;
    video.muted = state.muted;
    video.playbackRate = state.playbackRate;

    // 4. 재생 상태 복원
    if (!state.paused) {
      try {
        await video.play();
      } catch (playError) {
        // 자동 재생이 차단된 경우 무시
        logger.debug('자동 재생 차단됨 (정상):', playError);
      }
    }

    logger.debug('비디오 재로딩 완료');
  } catch (error) {
    logger.error('비디오 재로딩 실패:', error);
    throw error;
  }
}

/**
 * 비디오 로드 완료 대기
 */
function waitForVideoLoad(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로딩이 완료된 경우
    if (video.readyState >= 2) {
      // HAVE_CURRENT_DATA
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('비디오 로딩 타임아웃'));
    }, 5000); // 5초 타임아웃

    const handleLoadedData = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error('비디오 로딩 에러'));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.load();
  });
}

/**
 * 비디오 버퍼 해제
 */
export function releaseVideoBuffers(video: HTMLVideoElement): void {
  try {
    video.pause();
    video.src = '';
    video.load();
    logger.debug('비디오 버퍼 해제 완료');
  } catch (error) {
    logger.error('비디오 버퍼 해제 실패:', error);
  }
}

/**
 * 비디오 언로딩 상태 추적기
 */
export class VideoUnloadTracker {
  private readonly unloadedVideos = new Map<HTMLVideoElement, VideoState>();

  markUnloaded(video: HTMLVideoElement): void {
    const state = saveVideoState(video);
    this.unloadedVideos.set(video, state);
    logger.debug('비디오 언로딩 상태 기록:', video, state);
  }

  isUnloaded(video: HTMLVideoElement): boolean {
    return this.unloadedVideos.has(video);
  }

  getState(video: HTMLVideoElement): VideoState | null {
    return this.unloadedVideos.get(video) || null;
  }

  removeState(video: HTMLVideoElement): void {
    this.unloadedVideos.delete(video);
    logger.debug('비디오 언로딩 상태 제거:', video);
  }

  clear(): void {
    this.unloadedVideos.clear();
    logger.debug('모든 비디오 언로딩 상태 초기화');
  }

  getStats(): { unloadedCount: number } {
    return { unloadedCount: this.unloadedVideos.size };
  }
}

/**
 * 자동 언로딩 정책 생성기
 */
export function createAutoUnloadPolicy(options: {
  maxOffscreenVideos: number;
  unloadDelay: number;
}) {
  return {
    shouldUnload: (offscreenCount: number, maxAllowed: number): boolean => {
      return offscreenCount > maxAllowed;
    },
    getUnloadDelay: (): number => options.unloadDelay,
    getMaxOffscreenVideos: (): number => options.maxOffscreenVideos,
  };
}

/**
 * 비디오 언로딩 사이클 관리자
 */
export class VideoUnloadCycleManager {
  private readonly tracker = new VideoUnloadTracker();

  async unload(video: HTMLVideoElement): Promise<void> {
    this.tracker.markUnloaded(video);
    unloadVideo(video);
  }

  async reload(video: HTMLVideoElement): Promise<void> {
    const state = this.tracker.getState(video);
    if (!state) {
      throw new Error('재로딩할 비디오 상태를 찾을 수 없음');
    }

    await reloadVideo(video, state);
    this.tracker.removeState(video);
  }

  isUnloaded(video: HTMLVideoElement): boolean {
    return this.tracker.isUnloaded(video);
  }

  getStats() {
    return this.tracker.getStats();
  }

  clear(): void {
    this.tracker.clear();
  }
}

/**
 * 성능 측정 유틸리티
 */
export function measureVideoUnloadPerformance<T>(operation: () => T): {
  result: T;
  unloadTime: number;
  memoryFreed: number;
} {
  const startTime = performance.now();
  const startMemory = getEstimatedMemoryUsage();

  const result = operation();

  const endTime = performance.now();
  const endMemory = getEstimatedMemoryUsage();

  return {
    result,
    unloadTime: endTime - startTime,
    memoryFreed: Math.max(0, startMemory - endMemory),
  };
}

/**
 * 안전한 비디오 언로더 생성기
 */
export function createSafeVideoUnloader(options: {
  onError?: (error: Error) => void;
  maxRetries?: number;
}) {
  const { onError, maxRetries = 3 } = options;

  return {
    unload: async (video: HTMLVideoElement, retryCount = 0): Promise<boolean> => {
      try {
        return unloadVideo(video);
      } catch (error) {
        if (retryCount < maxRetries) {
          logger.warn(`비디오 언로딩 재시도 ${retryCount + 1}/${maxRetries}:`, error);
          return this.unload(video, retryCount + 1);
        }

        onError?.(error as Error);
        return false;
      }
    },
  };
}

// Helper function
function getEstimatedMemoryUsage(): number {
  // 실제 환경에서는 performance.memory 사용
  if ('memory' in performance) {
    const perfWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number } };
    return perfWithMemory.memory?.usedJSHeapSize || 0;
  }
  return 0;
}
