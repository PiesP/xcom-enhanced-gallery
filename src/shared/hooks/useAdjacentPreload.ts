/**
 * Phase 6: 인접 프리로딩 TDD 구현
 *
 * 목표:
 * - 현재 index 기준 ±distance 범위 사전 로딩
 * - 전역 중복 방지: Set/Map 관리
 * - Video는 fetch(metadata) or preload='metadata'
 */

import { logger } from '@shared/logging/logger';
import { getPreactSignalsSafe, getPreactHooksSafe } from '@shared/external/vendors/vendor-api-safe';

/**
 * Phase 6: 인접 프리로딩 훅
 *
 * 책임:
 * - 현재 index 기준 ±distance 범위 사전 로딩
 * - 전역 중복 방지: Set/Map 관리
 * - Video는 fetch(metadata) or preload='metadata'
 */

import { MediaPrefetchService } from '@shared/services/media/MediaPrefetchService';

// 전역 프리로딩 상태 관리
class GlobalPreloadManager {
  private static instance: GlobalPreloadManager | null = null;
  private readonly pendingUrls = new Set<string>();
  private readonly loadedUrls = new Set<string>();
  private readonly errorUrls = new Set<string>();

  static getInstance(): GlobalPreloadManager {
    if (!this.instance) {
      this.instance = new GlobalPreloadManager();
    }
    return this.instance;
  }

  hasPending(url: string): boolean {
    return this.pendingUrls.has(url);
  }

  addPending(url: string): void {
    this.pendingUrls.add(url);
    this.errorUrls.delete(url); // 재시도 시 에러 상태 초기화
  }

  removePending(url: string): void {
    this.pendingUrls.delete(url);
  }

  markLoaded(url: string): void {
    this.pendingUrls.delete(url);
    this.loadedUrls.add(url);
  }

  markError(url: string): void {
    this.pendingUrls.delete(url);
    this.errorUrls.add(url);
  }

  isLoaded(url: string): boolean {
    return this.loadedUrls.has(url);
  }

  hasError(url: string): boolean {
    return this.errorUrls.has(url);
  }

  clear(): void {
    this.pendingUrls.clear();
    this.loadedUrls.clear();
    this.errorUrls.clear();
  }
}

// 메모리 인식 프리로더
class MemoryAwarePreloader {
  private static instance: MemoryAwarePreloader | null = null;
  private memoryThreshold = 100 * 1024 * 1024; // 100MB 기본값

  static getInstance(): MemoryAwarePreloader {
    if (!this.instance) {
      this.instance = new MemoryAwarePreloader();
    }
    return this.instance;
  }

  setMemoryThreshold(bytes: number): void {
    this.memoryThreshold = bytes;
  }

  canPreload(): boolean {
    try {
      // 간단한 메모리 체크 (실제로는 더 정교한 로직 필요)
      const prefetchService = MediaPrefetchService.getInstance();
      const metrics = prefetchService.getPrefetchMetrics();

      return metrics.memoryUsage < this.memoryThreshold;
    } catch (error) {
      // 메트릭 조회 실패 시 보수적으로 허용
      logger.warn('[MemoryAwarePreloader] 메트릭 조회 실패, 프리로딩 허용:', error);
      return true;
    }
  }

  getCurrentMemoryUsage(): number {
    try {
      const prefetchService = MediaPrefetchService.getInstance();
      const metrics = prefetchService.getPrefetchMetrics();
      return metrics.memoryUsage;
    } catch (error) {
      // 메트릭 조회 실패 시 0 반환
      logger.warn('[MemoryAwarePreloader] 메모리 사용량 조회 실패:', error);
      return 0;
    }
  }
}

// 프리로딩 상태 타입
interface PreloadState {
  isLoading: boolean;
  loadedIndices: Set<number>;
  pendingIndices: Set<number>;
  errorIndices: Set<number>;
}

// 인접 프리로딩 옵션
interface AdjacentPreloadOptions {
  distance?: number;
  videoPreloadStrategy?: 'none' | 'metadata' | 'full';
  memoryThreshold?: number;
}

// 유틸리티 함수들
export function calculateAdjacentIndices(
  currentIndex: number,
  distance: number,
  totalLength: number
): number[] {
  const indices: number[] = [];

  // 이전 인덱스들
  for (let i = 1; i <= distance; i++) {
    const prevIndex = currentIndex - i;
    if (prevIndex >= 0) {
      indices.push(prevIndex);
    }
  }

  // 다음 인덱스들
  for (let i = 1; i <= distance; i++) {
    const nextIndex = currentIndex + i;
    if (nextIndex < totalLength) {
      indices.push(nextIndex);
    }
  }

  return indices;
}

export function calculatePreloadProgress(loadedCount: number, totalItems: number): number {
  if (totalItems === 0) return 0;
  return loadedCount / totalItems;
}

export async function preloadVideoMetadata(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    const handleLoad = () => {
      cleanup();
      resolve();
    };

    const handleError = (error: Event) => {
      cleanup();
      reject(new Error(`Video metadata preload failed: ${error}`));
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleLoad);
      video.removeEventListener('error', handleError);
    };

    video.addEventListener('loadedmetadata', handleLoad);
    video.addEventListener('error', handleError);

    video.src = url;
  });
}

// 프리로딩 상태 Signal
export function useAdjacentPreloadState() {
  const { signal } = getPreactSignalsSafe();
  return signal<PreloadState>({
    isLoading: false,
    loadedIndices: new Set(),
    pendingIndices: new Set(),
    errorIndices: new Set(),
  });
}

// 메인 훅
export function useAdjacentPreload(
  mediaItems: string[],
  currentIndexSignal: { value: number },
  options: AdjacentPreloadOptions = {}
) {
  const { useEffect, useMemo } = getPreactHooksSafe();
  const { computed, signal } = getPreactSignalsSafe();

  const {
    distance = 2,
    videoPreloadStrategy = 'metadata',
    memoryThreshold = 50 * 1024 * 1024, // 50MB
  } = options;

  const prefetchService = MediaPrefetchService.getInstance();
  const globalManager = GlobalPreloadManager.getInstance();
  const memoryManager = MemoryAwarePreloader.getInstance();

  // 로컬 프리로딩 상태
  const preloadStateSignal = signal<PreloadState>({
    isLoading: false,
    loadedIndices: new Set(),
    pendingIndices: new Set(),
    errorIndices: new Set(),
  });

  // 메모리 임계값 설정
  useMemo(() => {
    memoryManager.setMemoryThreshold(memoryThreshold);
  }, [memoryThreshold]);

  // 인접 인덱스 계산
  const adjacentIndices = computed(() => {
    return calculateAdjacentIndices(currentIndexSignal.value, distance, mediaItems.length);
  });

  // 프리로딩 실행
  useEffect(() => {
    const indices = adjacentIndices.value;
    if (indices.length === 0) return;

    // 메모리 체크
    if (!memoryManager.canPreload()) {
      logger.warn('[useAdjacentPreload] 메모리 부족으로 프리로딩 스킵');
      return;
    }

    const preloadUrls = indices
      .map(index => mediaItems[index])
      .filter(url => url && !globalManager.isLoaded(url) && !globalManager.hasPending(url));

    if (preloadUrls.length === 0) return;

    logger.debug('[useAdjacentPreload] 프리로딩 시작:', {
      currentIndex: currentIndexSignal.value,
      indices,
      urls: preloadUrls,
    });

    // 상태 업데이트
    preloadStateSignal.value = {
      ...preloadStateSignal.value,
      isLoading: true,
      pendingIndices: new Set([...preloadStateSignal.value.pendingIndices, ...indices]),
    };

    // 프리로딩 실행
    preloadUrls.forEach(url => {
      globalManager.addPending(url);

      const isVideo = url.includes('video') || url.includes('.mp4');

      if (isVideo && videoPreloadStrategy === 'metadata') {
        preloadVideoMetadata(url)
          .then(() => {
            globalManager.markLoaded(url);
            logger.debug('[useAdjacentPreload] 비디오 메타데이터 프리로딩 완료:', url);
          })
          .catch(error => {
            globalManager.markError(url);
            logger.warn('[useAdjacentPreload] 비디오 메타데이터 프리로딩 실패:', error);
          });
      } else if (!isVideo || videoPreloadStrategy === 'full') {
        prefetchService
          .prefetchNextMedia([url])
          .then(() => {
            globalManager.markLoaded(url);
            logger.debug('[useAdjacentPreload] 프리로딩 완료:', url);
          })
          .catch(error => {
            globalManager.markError(url);
            logger.warn('[useAdjacentPreload] 프리로딩 실패:', error);
          });
      }
    });

    // 상태 정리
    setTimeout(() => {
      preloadStateSignal.value = {
        ...preloadStateSignal.value,
        isLoading: false,
      };
    }, 1000);
  }, [adjacentIndices.value, currentIndexSignal.value]);

  // 프리로딩 진행률 계산
  const progress = computed(() => {
    const totalAdjacent = adjacentIndices.value.length;
    const loadedCount = adjacentIndices.value.filter(index =>
      globalManager.isLoaded(mediaItems[index])
    ).length;

    return calculatePreloadProgress(loadedCount, totalAdjacent);
  });

  // 정리 함수
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 대기 중인 프리로딩 정리
      adjacentIndices.value.forEach(index => {
        const url = mediaItems[index];
        if (url && globalManager.hasPending(url)) {
          globalManager.removePending(url);
        }
      });
    };
  }, []);

  return {
    adjacentIndices: adjacentIndices.value,
    preloadState: preloadStateSignal.value,
    progress: progress.value,
    memoryUsage: memoryManager.getCurrentMemoryUsage(),
    canPreload: memoryManager.canPreload(),
  };
}

// 전역 관리자 export (테스트용)
export { GlobalPreloadManager, MemoryAwarePreloader };
