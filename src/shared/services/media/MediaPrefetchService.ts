/**
 * @fileoverview MediaPrefetchService - 미디어 프리페치 전용 서비스
 * @description MediaService에서 프리페치 관련 기능을 분리한 전용 서비스
 */

import { logger } from '@shared/logging/logger';
import { handleServiceError } from '@shared/utils/error-handling';

/**
 * 프리페치 항목
 */
interface PrefetchEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * 프리페치 메트릭
 */
interface PrefetchMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalBytesDownloaded: number;
  totalBytesCached: number;
  averageDownloadTime: number;
  memoryUsage: number;
}

/**
 * 미디어 프리페치 전용 서비스
 *
 * 책임:
 * - 미디어 사전 로딩
 * - 메모리 캐시 관리
 * - 대역폭 최적화
 * - 캐시 정책 관리
 */
export class MediaPrefetchService {
  private static instance: MediaPrefetchService | null = null;

  private readonly prefetchCache = new Map<string, PrefetchEntry>();
  private readonly prefetchQueue = new Set<string>();
  private readonly downloadTimes = new Map<string, number>();

  // 설정
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_CACHE_ENTRIES = 100;
  private readonly PREFETCH_TIMEOUT = 30000; // 30초

  // 메트릭
  private readonly metrics: PrefetchMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalBytesDownloaded: 0,
    totalBytesCached: 0,
    averageDownloadTime: 0,
    memoryUsage: 0,
  };

  private constructor() {
    logger.debug('[MediaPrefetchService] 초기화됨');
    this.startMemoryManagement();
  }

  public static getInstance(): MediaPrefetchService {
    if (!MediaPrefetchService.instance) {
      MediaPrefetchService.instance = new MediaPrefetchService();
    }
    return MediaPrefetchService.instance;
  }

  /**
   * 다음 미디어 프리페치
   */
  async prefetchNextMedia(
    urls: string[],
    options: {
      priority?: 'high' | 'medium' | 'low';
      maxConcurrent?: number;
    } = {}
  ): Promise<void> {
    const maxConcurrent = options.maxConcurrent || 3;
    const validUrls = urls.filter(
      url => !this.prefetchCache.has(url) && !this.prefetchQueue.has(url)
    );

    if (validUrls.length === 0) {
      logger.debug('[MediaPrefetchService] 프리페치할 새로운 URL이 없음');
      return;
    }

    logger.debug(`[MediaPrefetchService] ${validUrls.length}개 미디어 프리페치 시작`);

    // 동시 프리페치 제한
    const chunks = this.chunkArray(validUrls, maxConcurrent);

    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(url => this.prefetchSingle(url)));
    }
  }

  /**
   * 단일 미디어 프리페치
   */
  private async prefetchSingle(url: string): Promise<void> {
    if (this.prefetchCache.has(url) || this.prefetchQueue.has(url)) {
      return;
    }

    this.prefetchQueue.add(url);
    const startTime = Date.now();

    try {
      this.metrics.totalRequests++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.PREFETCH_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        credentials: 'omit',
        cache: 'default',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadTime = Date.now() - startTime;

      // 캐시에 저장
      const entry: PrefetchEntry = {
        url,
        blob,
        timestamp: Date.now(),
        size: blob.size,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      this.prefetchCache.set(url, entry);
      this.downloadTimes.set(url, downloadTime);

      // 메트릭 업데이트
      this.metrics.totalBytesDownloaded += blob.size;
      this.metrics.totalBytesCached += blob.size;
      this.updateAverageDownloadTime();
      this.updateMemoryUsage();

      // 메모리 제한 확인
      this.enforceMemoryLimits();

      logger.debug(
        `[MediaPrefetchService] 프리페치 완료: ${url} (${blob.size} bytes, ${downloadTime}ms)`
      );
    } catch (error) {
      this.metrics.cacheMisses++;

      const standardError = handleServiceError(error, {
        service: 'MediaPrefetchService',
        operation: 'prefetchSingle',
        params: { url },
      });

      logger.warn(`프리페치 실패: ${url}`, standardError.message);
    } finally {
      this.prefetchQueue.delete(url);
    }
  }

  /**
   * 캐시된 미디어 조회
   */
  getCachedMedia(url: string): Blob | null {
    const entry = this.prefetchCache.get(url);

    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.metrics.cacheHits++;

      logger.debug(`[MediaPrefetchService] 캐시 히트: ${url}`);
      return entry.blob;
    }

    this.metrics.cacheMisses++;
    logger.debug(`[MediaPrefetchService] 캐시 미스: ${url}`);
    return null;
  }

  /**
   * 모든 프리페치 취소
   */
  cancelAllPrefetch(): void {
    try {
      this.prefetchQueue.clear();
      logger.debug('[MediaPrefetchService] 모든 프리페치 취소됨');
    } catch (error) {
      logger.warn('Failed to cancel prefetch:', error);
    }
  }

  /**
   * 프리페치 캐시 정리
   */
  clearPrefetchCache(): void {
    try {
      const cacheSize = this.prefetchCache.size;
      const memoryUsage = this.calculateMemoryUsage();

      this.prefetchCache.clear();
      this.downloadTimes.clear();
      this.prefetchQueue.clear();

      // 메트릭 초기화
      this.metrics.totalBytesCached = 0;
      this.metrics.memoryUsage = 0;

      logger.debug(
        `[MediaPrefetchService] 캐시 정리됨: ${cacheSize}개 항목, ${Math.round(memoryUsage / 1024 / 1024)}MB`
      );
    } catch (error) {
      logger.warn('Failed to clear prefetch cache:', error);
    }
  }

  /**
   * 프리페치 메트릭 조회
   */
  getPrefetchMetrics(): PrefetchMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * 프리페치 통계 조회 (호환성)
   */
  getPrefetchStats() {
    return this.getPrefetchMetrics();
  }

  /**
   * 배열을 청크로 분할
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 메모리 제한 적용
   */
  private enforceMemoryLimits(): void {
    // 캐시 크기 제한
    if (this.prefetchCache.size > this.MAX_CACHE_ENTRIES) {
      this.evictOldestPrefetchEntry();
    }

    // 메모리 사용량 제한
    const memoryUsage = this.calculateMemoryUsage();
    if (memoryUsage > this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * 가장 오래된 캐시 항목 제거
   */
  private evictOldestPrefetchEntry(): void {
    let oldestUrl = '';
    let oldestTimestamp = Date.now();

    for (const [url, entry] of this.prefetchCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      const entry = this.prefetchCache.get(oldestUrl);
      if (entry) {
        this.metrics.totalBytesCached -= entry.size;
        this.prefetchCache.delete(oldestUrl);
        this.downloadTimes.delete(oldestUrl);

        logger.debug(`[MediaPrefetchService] 오래된 캐시 항목 제거: ${oldestUrl}`);
      }
    }
  }

  /**
   * 최근 사용하지 않은 항목 제거 (LRU)
   */
  private evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.prefetchCache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    // 가장 적게 사용된 25% 제거
    const removeCount = Math.ceil(entries.length * 0.25);

    for (let i = 0; i < removeCount && entries[i]; i++) {
      const [url, entry] = entries[i];
      this.metrics.totalBytesCached -= entry.size;
      this.prefetchCache.delete(url);
      this.downloadTimes.delete(url);
    }

    if (removeCount > 0) {
      logger.debug(`[MediaPrefetchService] LRU 정책으로 ${removeCount}개 항목 제거`);
    }
  }

  /**
   * 메모리 사용량 계산
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.prefetchCache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * 메모리 사용량 메트릭 업데이트
   */
  private updateMemoryUsage(): void {
    this.metrics.memoryUsage = this.calculateMemoryUsage();
  }

  /**
   * 평균 다운로드 시간 업데이트
   */
  private updateAverageDownloadTime(): void {
    const downloadTimes = Array.from(this.downloadTimes.values());
    if (downloadTimes.length > 0) {
      const total = downloadTimes.reduce((sum, time) => sum + time, 0);
      this.metrics.averageDownloadTime = Math.round(total / downloadTimes.length);
    }
  }

  /**
   * 주기적 메모리 관리
   */
  private startMemoryManagement(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.isMemoryPressureHigh()) {
          this.evictLeastRecentlyUsed();
          logger.debug('[MediaPrefetchService] 메모리 압박으로 인한 캐시 정리 실행');
        }
      }, 60000); // 1분마다 체크
    }
  }

  /**
   * 메모리 압박 상태 확인
   */
  private isMemoryPressureHigh(): boolean {
    const memoryUsage = this.calculateMemoryUsage();
    return memoryUsage > this.MAX_CACHE_SIZE * 0.8; // 80% 임계값
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    try {
      this.cancelAllPrefetch();
      this.clearPrefetchCache();
      logger.debug('[MediaPrefetchService] 정리됨');
    } catch (error) {
      logger.warn('Failed to cleanup MediaPrefetchService:', error);
    }
  }
}

/**
 * 전역 미디어 프리페치 서비스 인스턴스
 */
export const mediaPrefetchService = MediaPrefetchService.getInstance();
