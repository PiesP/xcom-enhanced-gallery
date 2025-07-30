/**
 * @fileoverview 간소화된 미디어 프리페칭 서비스
 * @description 유저스크립트에 적합한 기본 N+1 이미지 로딩
 * @version 2.0.0 - Phase B: 간소화
 */

import { logger } from '@shared/logging';

/**
 * 간소화된 프리페치 옵션
 */
export interface PrefetchOptions {
  /** 최대 동시 프리페치 수 (기본: 2) */
  maxConcurrent?: number;
  /** 프리페치 범위 (기본: 2) */
  prefetchRange?: number;
}

/**
 * 간소화된 미디어 프리페칭 서비스
 *
 * 주요 기능:
 * - 기본 N+1 이미지 예측 로딩
 * - 단순 Map 기반 캐시
 * - 고정 균형 전략
 */
export class MediaPrefetchingService {
  private static instance: MediaPrefetchingService | null = null;

  // 간단한 캐시 및 상태 관리
  private readonly cache = new Map<string, Blob>();
  private readonly activeRequests = new Map<string, AbortController>();

  // 고정 설정
  private readonly maxCacheEntries = 20;

  // 기본 메트릭
  private cacheHits = 0;
  private cacheMisses = 0;

  private constructor() {
    // 간소화: 정기 정리 제거
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): MediaPrefetchingService {
    if (!this.instance) {
      this.instance = new MediaPrefetchingService();
    }
    return this.instance;
  }

  /**
   * 미디어 배열에서 현재 인덱스 기준으로 다음 이미지들을 프리페치
   */
  public async prefetchNextMedia(
    mediaItems: readonly string[],
    currentIndex: number,
    options: PrefetchOptions = {}
  ): Promise<void> {
    const maxConcurrent = options.maxConcurrent || 2;
    const prefetchRange = options.prefetchRange || 2;

    const prefetchUrls = this.calculatePrefetchUrls(mediaItems, currentIndex, prefetchRange);

    logger.debug('미디어 프리페칭 시작:', { currentIndex, prefetchUrls });

    // 동시 프리페치 수 제한
    for (const url of prefetchUrls) {
      if (this.activeRequests.size >= maxConcurrent) {
        break;
      }

      void this.prefetchSingle(url);
    }
  }

  /**
   * 간소화된 단일 미디어 프리페치
   */
  private async prefetchSingle(url: string): Promise<void> {
    // 이미 캐시되어 있거나 프리페치 중인 경우 스킵
    if (this.cache.has(url) || this.activeRequests.has(url)) {
      return;
    }

    const abortController = new AbortController();
    this.activeRequests.set(url, abortController);

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        mode: 'cors',
        cache: 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // 간단한 캐시 관리
      if (this.cache.size >= this.maxCacheEntries) {
        this.evictOldestEntry();
      }

      this.cache.set(url, blob);
      logger.debug('프리페치 성공:', { url, size: blob.size });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.warn('프리페치 실패:', error, { url });
      }
    } finally {
      this.activeRequests.delete(url);
    }
  }

  /**
   * 캐시에서 미디어 조회
   */
  public getCachedMedia(url: string): Blob | null {
    const blob = this.cache.get(url);
    if (blob) {
      this.cacheHits++;
      logger.debug('캐시 히트:', { url });
      return blob;
    }

    this.cacheMisses++;
    return null;
  }

  /**
   * 프리페치할 URL들 계산 (간소화)
   */
  private calculatePrefetchUrls(
    mediaItems: readonly string[],
    currentIndex: number,
    prefetchRange: number
  ): string[] {
    const urls: string[] = [];

    // 다음 N개 이미지들만 프리페치
    for (let i = 1; i <= prefetchRange; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < mediaItems.length && mediaItems[nextIndex]) {
        urls.push(mediaItems[nextIndex]);
      }
    }

    return urls;
  }

  /**
   * 가장 오래된 캐시 엔트리 제거
   */
  private evictOldestEntry(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      logger.debug('캐시 엔트리 제거:', firstKey);
    }
  }

  /**
   * 모든 프리페치 요청 취소
   */
  public cancelAllPrefetch(): void {
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
    logger.debug('모든 프리페치 요청이 취소되었습니다.');
  }

  /**
   * 캐시 정리
   */
  public clearCache(): void {
    this.cache.clear();
    logger.debug('캐시가 정리되었습니다.');
  }

  /**
   * 간소화된 메트릭 조회
   */
  public getMetrics() {
    const hitRate =
      this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
        : 0;

    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheEntries: this.cache.size,
      hitRate,
      activePrefetches: this.activeRequests.size,
    };
  }

  /**
   * 서비스 정리
   */
  public dispose(): void {
    this.cancelAllPrefetch();
    this.clearCache();
    MediaPrefetchingService.instance = null;
  }
}

/**
 * 전역 미디어 프리페칭 서비스 인스턴스
 */
export const mediaPrefetchingService = MediaPrefetchingService.getInstance();
