/**
 * @fileoverview 미디어 프리페칭 서비스
 * @description N+1 이미지 예측 로딩 및 스마트 캐싱 시스템
 * @version 1.0.0 - Phase 2: 미디어 프리페칭 시스템
 */

import { logger } from '@shared/logging';

// WebP 최적화 서비스를 지연 로딩으로 가져오기
let webpOptimizationServiceInstance:
  | typeof import('./WebPOptimizationService').webpOptimizationService
  | null = null;

async function getWebPOptimizationService() {
  if (!webpOptimizationServiceInstance) {
    try {
      const module = await import('./WebPOptimizationService');
      webpOptimizationServiceInstance = module.webpOptimizationService;
    } catch (error) {
      logger.warn('WebP 최적화 서비스 로딩 실패:', error);
      return null;
    }
  }
  return webpOptimizationServiceInstance;
}

/**
 * 프리페치 전략
 */
export type PrefetchStrategy = 'aggressive' | 'balanced' | 'conservative' | 'adaptive';

/**
 * 프리페치 우선순위
 */
export type PrefetchPriority = 'high' | 'normal' | 'low';

/**
 * 프리페치 옵션
 */
export interface PrefetchOptions {
  /** 프리페치 전략 */
  strategy?: PrefetchStrategy;
  /** 우선순위 */
  priority?: PrefetchPriority;
  /** 최대 동시 프리페치 수 */
  maxConcurrent?: number;
  /** 프리페치 범위 (현재 위치 기준 ±N) */
  prefetchRange?: number;
  /** 네트워크 조건 고려 여부 */
  respectNetworkConditions?: boolean;
  /** WebP 최적화 사용 여부 */
  enableWebPOptimization?: boolean;
}

/**
 * 프리페치 상태
 */
interface PrefetchState {
  url: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  startTime: number;
  endTime?: number;
  size?: number;
  priority: PrefetchPriority;
}

/**
 * 캐시 엔트리
 */
interface CacheEntry {
  blob: Blob;
  url: string;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccess: number;
}

/**
 * 네트워크 상태
 */
interface NetworkCondition {
  isSlowConnection: boolean;
  effectiveType: string;
  downlink?: number;
  saveData?: boolean;
}

/**
 * 미디어 프리페칭 서비스
 *
 * 주요 기능:
 * - N+1 이미지 예측 로딩
 * - 적응형 프리페치 전략
 * - 스마트 메모리 관리
 * - 네트워크 조건 기반 최적화
 * - LRU 캐시 시스템
 */
export class MediaPrefetchingService {
  private static instance: MediaPrefetchingService | null = null;

  // 캐시 및 상태 관리
  private readonly cache = new Map<string, CacheEntry>();
  private readonly prefetchQueue = new Map<string, PrefetchState>();
  private readonly activeRequests = new Map<string, AbortController>();

  // 설정
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private readonly maxCacheEntries = 100;
  private readonly cacheExpiryTime = 30 * 60 * 1000; // 30분

  // 성능 메트릭
  private readonly metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    prefetchSuccesses: 0,
    prefetchFailures: 0,
    totalPrefetched: 0,
    bytesSaved: 0,
  };

  private constructor() {
    this.startCleanupTimer();
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
    const config = this.getResolvedOptions(options);
    const networkCondition = this.getNetworkCondition();

    // 네트워크 조건이 좋지 않고 해당 설정이 켜져 있으면 프리페치 제한
    if (config.respectNetworkConditions && networkCondition.isSlowConnection) {
      logger.debug('네트워크 조건이 좋지 않아 프리페치를 제한합니다.');
      return;
    }

    const prefetchUrls = this.calculatePrefetchUrls(mediaItems, currentIndex, config);

    logger.debug('미디어 프리페칭 시작:', {
      currentIndex,
      prefetchUrls,
      strategy: config.strategy,
    });

    // 우선순위별로 정렬하여 프리페치
    const prioritizedUrls = this.prioritizePrefetchUrls(prefetchUrls, config);

    for (const { url, priority } of prioritizedUrls) {
      if (this.activeRequests.size >= config.maxConcurrent) {
        break; // 동시 요청 제한
      }

      void this.prefetchSingle(url, priority, config);
    }
  }

  /**
   * 단일 미디어 프리페치
   */
  private async prefetchSingle(
    url: string,
    priority: PrefetchPriority,
    config: PrefetchOptions
  ): Promise<void> {
    // 이미 캐시되어 있거나 프리페치 중인 경우 스킵
    if (this.cache.has(url) || this.prefetchQueue.has(url)) {
      return;
    }

    // WebP 최적화 적용
    let optimizedUrl = url;
    if (config.enableWebPOptimization) {
      try {
        const webpService = await getWebPOptimizationService();
        if (webpService) {
          optimizedUrl = webpService.optimizeTwitterImageUrl(url);
        }
      } catch (error) {
        logger.warn('WebP 최적화 서비스 로딩 실패, 원본 URL 사용:', error);
        optimizedUrl = url;
      }
    }

    const abortController = new AbortController();
    this.activeRequests.set(url, abortController);

    const prefetchState: PrefetchState = {
      url: optimizedUrl,
      status: 'pending',
      startTime: performance.now(),
      priority,
    };

    this.prefetchQueue.set(url, prefetchState);

    try {
      prefetchState.status = 'loading';

      const response = await fetch(optimizedUrl, {
        signal: abortController.signal,
        mode: 'cors',
        cache: 'force-cache', // 브라우저 캐시 활용
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const endTime = performance.now();

      // 캐시에 저장
      const cacheEntry: CacheEntry = {
        blob,
        url: optimizedUrl,
        timestamp: Date.now(),
        size: blob.size,
        accessCount: 0,
        lastAccess: Date.now(),
      };

      this.addToCache(url, cacheEntry);

      // 상태 업데이트
      prefetchState.status = 'loaded';
      prefetchState.endTime = endTime;
      prefetchState.size = blob.size;

      // 메트릭 업데이트
      this.metrics.prefetchSuccesses++;
      this.metrics.totalPrefetched += blob.size;

      logger.debug('프리페치 성공:', {
        url: optimizedUrl,
        size: blob.size,
        duration: endTime - prefetchState.startTime,
        priority,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('프리페치 취소됨:', optimizedUrl);
      } else {
        logger.warn('프리페치 실패:', error, { url: optimizedUrl });
        prefetchState.status = 'error';
        this.metrics.prefetchFailures++;
      }
    } finally {
      this.activeRequests.delete(url);
      // 성공/실패 상관없이 큐에서 제거 (재시도 방지)
      setTimeout(() => this.prefetchQueue.delete(url), 5000);
    }
  }

  /**
   * 캐시에서 미디어 조회
   */
  public getCachedMedia(url: string): Blob | null {
    const entry = this.cache.get(url);
    if (!entry) {
      this.metrics.cacheMisses++;
      return null;
    }

    // 접근 정보 업데이트
    entry.accessCount++;
    entry.lastAccess = Date.now();

    this.metrics.cacheHits++;
    logger.debug('캐시 히트:', { url, accessCount: entry.accessCount });

    return entry.blob;
  }

  /**
   * 프리페치할 URL들 계산
   */
  private calculatePrefetchUrls(
    mediaItems: readonly string[],
    currentIndex: number,
    config: PrefetchOptions
  ): string[] {
    const { prefetchRange = 2 } = config;
    const urls: string[] = [];

    // 다음 N개 이미지들을 프리페치 대상으로 선정
    for (let i = 1; i <= prefetchRange; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < mediaItems.length && mediaItems[nextIndex]) {
        urls.push(mediaItems[nextIndex]);
      }
    }

    // 이전 이미지도 일부 포함 (뒤로 가기 대비)
    for (let i = 1; i <= Math.floor(prefetchRange / 2); i++) {
      const prevIndex = currentIndex - i;
      if (prevIndex >= 0 && mediaItems[prevIndex]) {
        urls.push(mediaItems[prevIndex]);
      }
    }

    return urls;
  }

  /**
   * 프리페치 URL 우선순위 지정
   */
  private prioritizePrefetchUrls(
    urls: string[],
    _config: PrefetchOptions
  ): Array<{ url: string; priority: PrefetchPriority }> {
    return urls.map((url, index) => ({
      url,
      priority: index === 0 ? 'high' : index < 2 ? 'normal' : 'low',
    }));
  }

  /**
   * 설정 옵션 해석
   */
  private getResolvedOptions(options: PrefetchOptions): Required<PrefetchOptions> {
    const networkCondition = this.getNetworkCondition();

    // 적응형 전략: 네트워크 조건에 따라 자동 조정
    let strategy = options.strategy || 'balanced';
    if (strategy === 'adaptive') {
      if (networkCondition.isSlowConnection) {
        strategy = 'conservative';
      } else if (networkCondition.downlink && networkCondition.downlink > 10) {
        strategy = 'aggressive';
      } else {
        strategy = 'balanced';
      }
    }

    const strategyConfigs = {
      conservative: { maxConcurrent: 1, prefetchRange: 1 },
      balanced: { maxConcurrent: 2, prefetchRange: 2 },
      aggressive: { maxConcurrent: 4, prefetchRange: 3 },
    };

    const strategyConfig = strategyConfigs[strategy as keyof typeof strategyConfigs];

    return {
      strategy,
      priority: options.priority || 'normal',
      maxConcurrent: options.maxConcurrent || strategyConfig.maxConcurrent,
      prefetchRange: options.prefetchRange || strategyConfig.prefetchRange,
      respectNetworkConditions: options.respectNetworkConditions ?? true,
      enableWebPOptimization: options.enableWebPOptimization ?? true,
    };
  }

  /**
   * 네트워크 조건 감지
   */
  private getNetworkCondition(): NetworkCondition {
    interface NavigatorWithConnection extends Navigator {
      connection?: NavigatorConnection;
    }

    interface NavigatorConnection {
      effectiveType?: string;
      downlink?: number;
      saveData?: boolean;
    }

    const connection = (navigator as NavigatorWithConnection).connection;

    if (!connection) {
      return {
        isSlowConnection: false,
        effectiveType: 'unknown',
      };
    }

    const slowTypes = ['slow-2g', '2g', '3g'];
    const isSlowConnection =
      (connection.effectiveType && slowTypes.includes(connection.effectiveType)) ||
      connection.saveData === true ||
      (connection.downlink && connection.downlink < 1.5);

    return {
      isSlowConnection: Boolean(isSlowConnection),
      effectiveType: connection.effectiveType || 'unknown',
      ...(connection.downlink !== undefined && { downlink: connection.downlink }),
      ...(connection.saveData !== undefined && { saveData: connection.saveData }),
    };
  }

  /**
   * LRU 캐시에 엔트리 추가
   */
  private addToCache(key: string, entry: CacheEntry): void {
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxCacheEntries) {
      this.evictLeastRecentlyUsed();
    }

    // 총 캐시 크기 제한 확인
    const totalSize = this.getTotalCacheSize();
    if (totalSize + entry.size > this.maxCacheSize) {
      this.evictLargestEntries(entry.size);
    }

    this.cache.set(key, entry);
  }

  /**
   * LRU 정책에 따라 캐시 엔트리 제거
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('LRU 캐시 제거:', oldestKey);
    }
  }

  /**
   * 큰 엔트리들을 제거하여 공간 확보
   */
  private evictLargestEntries(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => b.size - a.size);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSpace += entry.size;

      if (freedSpace >= requiredSpace) {
        break;
      }
    }

    logger.debug('캐시 공간 확보:', { freedSpace, requiredSpace });
  }

  /**
   * 총 캐시 크기 계산
   */
  private getTotalCacheSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * 정기적인 캐시 정리
   */
  private startCleanupTimer(): void {
    setInterval(
      () => {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
          if (now - entry.timestamp > this.cacheExpiryTime) {
            expiredKeys.push(key);
          }
        }

        for (const key of expiredKeys) {
          this.cache.delete(key);
        }

        if (expiredKeys.length > 0) {
          logger.debug('만료된 캐시 엔트리 정리:', expiredKeys.length);
        }
      },
      5 * 60 * 1000
    ); // 5분마다 실행
  }

  /**
   * 모든 프리페치 요청 취소
   */
  public cancelAllPrefetch(): void {
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
    this.prefetchQueue.clear();

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
   * 성능 메트릭 조회
   */
  public getMetrics() {
    const cacheSize = this.getTotalCacheSize();
    const hitRate =
      this.metrics.cacheHits + this.metrics.cacheMisses > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
        : 0;

    return {
      ...this.metrics,
      cacheSize,
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
