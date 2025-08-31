/**
 * @fileoverview Media Service - 통합 미디어 서비스
 * @description 모든 미디어 관련 기능을 통합한 서비스
 * @version 1.0.0 - Phase 2: Service Consolidation
 */

import type { MediaExtractionResult } from '@shared/types/media.types';
import type { MediaExtractionOptions } from '@shared/types/media.types';
import { WebPUtils } from '@shared/utils/WebPUtils';
import { isTestEnvironment } from '@shared/utils/environment';
import { logger } from '@shared/logging/logger';
import { AbortManager } from './AbortManager';

// 통합된 서비스 타입들
/**
 * 미디어 로딩 상태 (MediaLoadingService에서 통합)
 */
export interface MediaLoadingState {
  isLoading: boolean;
  hasError: boolean;
  loadedUrl?: string;
  errorMessage?: string;
}

/**
 * 미디어 로딩 옵션
 */
export interface MediaLoadingOptions {
  retryAttempts?: number;
  timeout?: number;
}

/**
 * 프리페치 옵션 (MediaPrefetchingService에서 통합)
 */
export interface PrefetchOptions {
  maxConcurrent?: number;
  prefetchRange?: number;
}

/**
 * 대량 다운로드 관련 타입들 (BulkDownloadService에서 통합)
 */
export interface DownloadProgress {
  phase: 'preparing' | 'downloading' | 'complete';
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}

export interface BulkDownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  zipFilename?: string;
}

export interface DownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

// 기존 서비스들 import
import { VideoControlService } from './media/VideoControlService';
import { MediaExtractionOrchestrator } from './media-extraction/MediaExtractionOrchestrator';
import { ExtractionStrategyFactory } from './media-extraction/strategies';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
} from './media/UsernameExtractionService';
import type { UsernameExtractionResult } from './media/UsernameExtractionService';
import { BulkDownloadService } from './BulkDownloadService';

/**
 * 통합 미디어 서비스 - Phase 4 간소화
 *
 * 기존 분산된 미디어 서비스들을 하나로 통합:
 * - MediaExtractionService
 * - FallbackExtractor
 * - VideoControlService
 * - UsernameExtractionService
 * - TwitterVideoExtractor 유틸리티들
 * - WebPOptimizationService
 */
export class MediaService {
  private static instance: MediaService | null = null;

  // 통합된 서비스 컴포넌트들
  private readonly mediaExtractionOrchestrator: MediaExtractionOrchestrator;
  private readonly videoControl: VideoControlService;
  private readonly usernameParser: UsernameParser;
  private readonly bulkDownloadService: BulkDownloadService;

  // 미디어 로딩 관련 상태 (MediaLoadingService 통합)
  private readonly mediaLoadingStates = new Map<string, MediaLoadingState>();

  // 미디어 프리페칭 관련 상태 (MediaPrefetchingService 통합)
  private readonly prefetchCache = new Map<
    string,
    {
      blob: Blob;
      blobUrl?: string;
      lastAccessed: number;
      size: number;
    }
  >();
  private readonly abortManager = new AbortManager();

  // 🔧 REFACTOR: 최적화된 캐시 설정
  private readonly maxCacheEntries = 20; // 기본 캐시 크기
  private readonly maxCacheSizeBytes = 50 * 1024 * 1024; // 50MB 제한
  private readonly cleanupBatchSize = 5; // 배치 정리 크기
  private readonly accessTimeThreshold = 5 * 60 * 1000; // 5분 임계값

  // 캐시 통계 (성능 모니터링용)
  private prefetchCacheHits = 0;
  private prefetchCacheMisses = 0;
  private totalEvictions = 0;

  // 대량 다운로드 관련 상태 (BulkDownloadService로 이동됨)
  // private readonly currentAbortController?: AbortController;

  constructor() {
    // Phase 7: MediaExtractionOrchestrator 통합
    this.mediaExtractionOrchestrator = new MediaExtractionOrchestrator();
    const strategies = ExtractionStrategyFactory.createDefaultStrategies();
    strategies.forEach(strategy => this.mediaExtractionOrchestrator.addStrategy(strategy));

    this.videoControl = new VideoControlService(); // Phase 4 간소화: 직접 인스턴스화
    this.usernameParser = new UsernameParser(); // Phase 4 간소화: 직접 인스턴스화
    this.bulkDownloadService = new BulkDownloadService(); // Phase 2: 다운로드 서비스 위임

    // 테스트 환경에서는 WebP를 즉시 활성화
    if (isTestEnvironment()) {
      // WebPUtils 캐시 초기화는 필요하지 않음 (자동으로 테스트 환경 감지)
      logger.debug('[MediaService] WebP enabled for test environment');
    } else {
      // WebP 지원 감지 초기화 (WebPUtils가 자동으로 캐싱 처리)
      WebPUtils.detectSupport().catch(error => {
        logger.warn('[MediaService] WebP detection initialization failed:', error);
      });
    }
  }

  public static getInstance(): MediaService {
    MediaService.instance ??= new MediaService();
    return MediaService.instance;
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.videoControl.destroy();
    this.clearPrefetchCache();
    this.clearExtractionCache();
  }

  // ====================================
  // Media Extraction API
  // ====================================

  /**
   * 클릭된 요소에서 미디어 추출 (Phase 7: Orchestrator 사용)
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    logger.debug('[MediaService] Phase 7: Orchestrator 사용하여 미디어 추출 시작');
    return this.mediaExtractionOrchestrator.extract(element, options);
  }

  /**
   * 컨테이너에서 모든 미디어 추출 (Phase 7: Orchestrator 사용)
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    logger.debug('[MediaService] Phase 7: Orchestrator 사용하여 컨테이너 미디어 추출 시작');
    return this.mediaExtractionOrchestrator.extract(container, options);
  }

  // ====================================
  // Video Control API
  // ====================================

  /**
   * 배경 비디오 일시정지 (갤러리 진입 시)
   */
  pauseAllBackgroundVideos(): void {
    this.videoControl.pauseAllBackgroundVideos();
  }

  /**
   * 배경 비디오 복원 (갤러리 종료 시)
   */
  restoreBackgroundVideos(): void {
    this.videoControl.restoreBackgroundVideos();
  }

  /**
   * 비디오 제어 서비스 활성 상태
   */
  isVideoControlActive(): boolean {
    return this.videoControl.isActive();
  }

  /**
   * 일시정지된 비디오 수
   */
  getPausedVideoCount(): number {
    return this.videoControl.getPausedVideoCount();
  }

  /**
   * 비디오 제어 강제 초기화
   */
  forceResetVideoControl(): void {
    this.videoControl.forceReset();
  }

  // ====================================
  // Username Extraction API
  // ====================================

  /**
   * 사용자명 추출 (상세 결과)
   */
  extractUsername(element?: HTMLElement | Document): UsernameExtractionResult {
    return this.usernameParser.extractUsername(element);
  }

  /**
   * 빠른 사용자명 추출 (문자열만)
   */
  parseUsernameFast(element?: HTMLElement | Document): string | null {
    return parseUsernameFast(element);
  }

  // ====================================
  // Twitter Video API (재export)
  // ====================================

  /**
   * Twitter Video 관련 유틸리티들을 재export
   * 기존 코드 호환성을 위해 유지
   */
  get TwitterVideoUtils() {
    return {
      // TwitterVideoExtractor에서 가져온 유틸리티들
      isVideoThumbnail: async (imgElement: HTMLImageElement) => {
        const { isVideoThumbnail } = await import('./media/TwitterVideoExtractor');
        return isVideoThumbnail(imgElement);
      },
      isVideoPlayer: async (element: HTMLElement) => {
        const { isVideoPlayer } = await import('./media/TwitterVideoExtractor');
        return isVideoPlayer(element);
      },
      isVideoElement: async (element: HTMLElement) => {
        const { isVideoElement } = await import('./media/TwitterVideoExtractor');
        return isVideoElement(element);
      },
      extractTweetId: async (url: string) => {
        const { extractTweetId } = await import('./media/TwitterVideoExtractor');
        return extractTweetId(url);
      },
      getTweetIdFromContainer: async (container: HTMLElement) => {
        const { getTweetIdFromContainer } = await import('./media/TwitterVideoExtractor');
        return getTweetIdFromContainer(container);
      },
      getVideoMediaEntry: async (tweetId: string, thumbnailUrl?: string) => {
        const { getVideoMediaEntry } = await import('./media/TwitterVideoExtractor');
        return getVideoMediaEntry(tweetId, thumbnailUrl);
      },
      getVideoUrlFromThumbnail: async (
        imgElement: HTMLImageElement,
        tweetContainer: HTMLElement
      ) => {
        const { getVideoUrlFromThumbnail } = await import('./media/TwitterVideoExtractor');
        return getVideoUrlFromThumbnail(imgElement, tweetContainer);
      },
    };
  }

  // ====================================
  // 편의 메서드들
  // ====================================

  /**
   * 미디어 추출 + 사용자명 추출을 한 번에
   */
  async extractMediaWithUsername(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult & { username: string | null }> {
    const [extractionResult, usernameResult] = await Promise.all([
      this.extractFromClickedElement(element, options),
      Promise.resolve(this.extractUsername(element)),
    ]);

    return {
      ...extractionResult,
      username: usernameResult.username,
    };
  }

  /**
   * 갤러리 진입 시 필요한 모든 미디어 설정
   */
  async prepareForGallery(): Promise<void> {
    this.pauseAllBackgroundVideos();
  }

  /**
   * 갤러리 종료 시 미디어 정리
   */
  async cleanupAfterGallery(): Promise<void> {
    this.restoreBackgroundVideos();
  }

  // ====================================
  // WebP Optimization API (WebPUtils 위임)
  // ====================================

  /**
   * WebP 지원 여부 반환 (WebPUtils 위임)
   */
  isWebPSupported(): boolean {
    return WebPUtils.isSupportedSync();
  }

  /**
   * 최적 이미지 URL 생성 (WebP 최적화, WebPUtils 위임)
   */
  getOptimizedImageUrl(originalUrl: string): string {
    return WebPUtils.optimizeUrl(originalUrl);
  }

  // NOTE: optimizeWebP와 optimizeTwitterImageUrl은 중복 제거됨
  // 호환성을 위해 파일 하단의 export 함수들을 사용하세요

  // ====================================
  // Media Loading API (통합됨)
  // ====================================

  /**
   * 미디어 요소 등록 및 로딩
   */
  registerMediaElement(
    id: string,
    element: HTMLElement,
    options: { src: string } = { src: '' }
  ): void {
    this.mediaLoadingStates.set(id, {
      isLoading: true,
      hasError: false,
    });

    this.loadMediaElement(id, element, options.src);
  }

  /**
   * 미디어 요소 등록 해제
   */
  unregisterMediaElement(id: string): void {
    this.mediaLoadingStates.delete(id);
  }

  /**
   * 로딩 상태 조회
   */
  getLoadingState(id: string): MediaLoadingState | undefined {
    return this.mediaLoadingStates.get(id);
  }

  /**
   * 미디어 로딩 실행
   */
  private loadMediaElement(id: string, element: HTMLElement, src: string): void {
    if (element instanceof HTMLImageElement) {
      this.loadImage(id, element, src);
    } else if (element instanceof HTMLVideoElement) {
      this.loadVideo(id, element, src);
    }
  }

  /**
   * 이미지 로딩
   */
  private loadImage(id: string, img: HTMLImageElement, src: string): void {
    const state = this.mediaLoadingStates.get(id);
    if (!state) return;

    img.onload = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = false;
        currentState.loadedUrl = src;
      }
    };

    img.onerror = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = true;
        currentState.errorMessage = 'Image load failed';
      }
    };

    img.src = src;
  }

  /**
   * 비디오 로딩
   */
  private loadVideo(id: string, video: HTMLVideoElement, src: string): void {
    const state = this.mediaLoadingStates.get(id);
    if (!state) return;

    video.onloadeddata = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = false;
        currentState.loadedUrl = src;
      }
    };

    video.onerror = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = true;
        currentState.errorMessage = 'Video load failed';
      }
    };

    video.src = src;
  }

  // ====================================
  // Media Prefetching API (통합됨)
  // ====================================

  /**
   * 미디어 배열에서 현재 인덱스 기준으로 다음 이미지들을 프리페치
   */
  async prefetchNextMedia(
    mediaItems: readonly string[],
    currentIndex: number,
    options: PrefetchOptions = {}
  ): Promise<void> {
    const maxConcurrent = options.maxConcurrent || 2;
    const prefetchRange = options.prefetchRange || 2;

    const prefetchUrls = this.calculatePrefetchUrls(mediaItems, currentIndex, prefetchRange);

    logger.debug('[MediaService] 미디어 프리페칭 시작:', { currentIndex, prefetchUrls });

    // 동시 프리페치 수 제한
    for (const url of prefetchUrls) {
      if (this.abortManager.getActiveControllerCount() >= maxConcurrent) {
        break;
      }

      void this.prefetchSingle(url);
    }
  }

  /**
   * 단일 미디어 프리페치
   */
  private async prefetchSingle(url: string): Promise<void> {
    // 이미 캐시되어 있거나 프리페치 중인 경우 스킵
    if (this.prefetchCache.has(url) || this.abortManager.hasController(url)) {
      return;
    }

    const abortController = this.abortManager.createController(url);

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

      // 🔧 REFACTOR: 스마트 캐시 관리
      if (this.prefetchCache.size >= this.maxCacheEntries) {
        this.evictOldestPrefetchEntry();
      }

      // 🔧 REFACTOR: 메모리 사용량 기반 정리
      this.enforceMemoryLimits();

      // Blob URL 생성 (필요시)
      const blobUrl =
        typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : undefined;

      this.prefetchCache.set(url, {
        blob,
        blobUrl,
        lastAccessed: Date.now(),
        size: blob.size,
      });
      logger.debug('[MediaService] 프리페치 성공:', { url, size: blob.size });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.warn('[MediaService] 프리페치 실패:', error, { url });
      }
    } finally {
      this.abortManager.cleanup(url);
    }
  }

  /**
   * 프리페치할 URL들 계산
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
   * 🔧 REFACTOR: 최적화된 프리페치 캐시 엔트리 제거 (배치 LRU 방식)
   */
  private evictOldestPrefetchEntry(): void {
    if (this.prefetchCache.size === 0) {
      return;
    }

    // 🔧 REFACTOR: 배치 정리로 성능 개선
    const targetEvictions = Math.min(this.cleanupBatchSize, this.prefetchCache.size);

    // LRU 정렬을 위한 엔트리 배열 생성
    const entries = Array.from(this.prefetchCache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    // 가장 오래된 항목들부터 제거
    for (let i = 0; i < targetEvictions; i++) {
      const [key, entry] = entries[i];

      // Blob URL 해제로 메모리 누수 방지
      if (entry.blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(entry.blobUrl);
      }

      this.prefetchCache.delete(key);
      this.totalEvictions++;

      logger.debug('[MediaService] 배치 캐시 정리:', {
        url: key,
        size: entry.size,
        lastAccessed: new Date(entry.lastAccessed).toISOString(),
        totalEvictions: this.totalEvictions,
      });
    }
  }

  /**
   * 🔧 REFACTOR: 메모리 사용량 기반 캐시 정리
   */
  private enforceMemoryLimits(): void {
    const totalSize = Array.from(this.prefetchCache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );

    if (totalSize > this.maxCacheSizeBytes) {
      // 크기 초과 시 더 적극적으로 정리
      const targetReduction = totalSize - this.maxCacheSizeBytes * 0.8; // 80%까지 줄이기
      let currentReduction = 0;

      const entries = Array.from(this.prefetchCache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed
      );

      for (const [key, entry] of entries) {
        if (currentReduction >= targetReduction) break;

        if (entry.blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          URL.revokeObjectURL(entry.blobUrl);
        }

        this.prefetchCache.delete(key);
        this.totalEvictions++;
        currentReduction += entry.size;

        logger.debug('[MediaService] 메모리 제한 기반 캐시 정리:', {
          url: key,
          size: entry.size,
          currentReduction,
          targetReduction,
        });
      }
    }
  }

  /**
   * 캐시에서 미디어 조회
   */
  getCachedMedia(url: string): Blob | null {
    const entry = this.prefetchCache.get(url);
    if (entry) {
      // LRU 업데이트: 접근 시간 갱신
      entry.lastAccessed = Date.now();
      this.prefetchCacheHits++;
      logger.debug('[MediaService] 프리페치 캐시 히트:', { url });
      return entry.blob;
    }

    this.prefetchCacheMisses++;
    return null;
  }

  /**
   * 모든 프리페치 요청 취소
   */
  cancelAllPrefetch(): void {
    this.abortManager.abortAll();
    logger.debug('[MediaService] 모든 프리페치 요청이 취소되었습니다.');
  }

  /**
   * 프리페치 캐시 정리
   */
  clearPrefetchCache(): void {
    // 모든 Blob URL 해제
    for (const entry of this.prefetchCache.values()) {
      if (entry.blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(entry.blobUrl);
      }
    }

    this.prefetchCache.clear();
    logger.debug('[MediaService] 프리페치 캐시가 정리되었습니다.');
  }

  /**
   * 🔧 REFACTOR: 개선된 프리페치 메트릭 조회 (추가 통계 포함)
   */
  getPrefetchMetrics() {
    const hitRate =
      this.prefetchCacheHits + this.prefetchCacheMisses > 0
        ? (this.prefetchCacheHits / (this.prefetchCacheHits + this.prefetchCacheMisses)) * 100
        : 0;

    // 🔧 REFACTOR: 총 메모리 사용량 계산
    const totalMemoryUsage = Array.from(this.prefetchCache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );

    // 🔧 REFACTOR: 캐시 효율성 지표
    const memoryEfficiency =
      this.maxCacheSizeBytes > 0 ? (totalMemoryUsage / this.maxCacheSizeBytes) * 100 : 0;

    return {
      cacheHits: this.prefetchCacheHits,
      cacheMisses: this.prefetchCacheMisses,
      cacheEntries: this.prefetchCache.size,
      hitRate: Number(hitRate.toFixed(2)),
      activePrefetches: this.abortManager.getActiveControllerCount(),
      totalEvictions: this.totalEvictions,
      totalMemoryUsage,
      maxMemoryUsage: this.maxCacheSizeBytes,
      memoryEfficiency: Number(memoryEfficiency.toFixed(2)),
      cacheUtilization:
        this.maxCacheEntries > 0 ? (this.prefetchCache.size / this.maxCacheEntries) * 100 : 0,
    };
  }

  /**
   * 프리페치 통계 조회 (테스트 호환성을 위한 별칭)
   */
  getPrefetchStats() {
    return this.getPrefetchMetrics();
  }

  // ====================================
  // 대량 다운로드 서비스 접근 (중복 제거됨)
  // ====================================

  /**
   * 다운로드 서비스 인스턴스 반환 (권장 방법)
   * @description 직접 BulkDownloadService 인스턴스에 접근
   */
  getDownloadService(): BulkDownloadService {
    return this.bulkDownloadService;
  }

  // NOTE: downloadSingle, downloadMultiple, downloadBulk 메서드는 중복 제거됨
  // 대신 getDownloadService()를 통해 BulkDownloadService에 직접 접근하세요
  // 예: mediaService.getDownloadService().downloadSingle(media)

  // ====================================
  // Phase 7: Orchestrator 관련 메서드
  // ====================================

  /**
   * 미디어 추출 오케스트레이터 성능 메트릭 조회
   */
  public getExtractionMetrics() {
    return this.mediaExtractionOrchestrator.getMetrics();
  }

  /**
   * 오케스트레이터 캐시 및 실패 목록 초기화
   */
  public clearExtractionCache(): void {
    this.mediaExtractionOrchestrator.clearCache();
  }

  /**
   * 특정 추출 전략 상태 초기화
   */
  public resetExtractionStrategy(strategyName: string): void {
    this.mediaExtractionOrchestrator.resetStrategy(strategyName);
  }
}

/**
 * 전역 미디어 서비스 인스턴스
 */
export const mediaService = MediaService.getInstance();

// ====================================
// 편의 함수들 (기존 코드 호환성)
// ====================================

/**
 * 편의 함수: 사용자명 추출
 */
export { extractUsername };

/**
 * 편의 함수: 빠른 사용자명 추출
 */
export { parseUsernameFast };

/**
 * 편의 함수: 사용자명 추출 결과 타입
 */
export type { UsernameExtractionResult };

// ====================================
// URL 최적화 함수들 (중복 제거됨)
// ====================================

/**
 * WebP 최적화 (호환성 유지를 위한 별칭)
 * @deprecated 직접 WebPUtils.optimizeUrl() 사용 권장
 */
export const optimizeWebP = (originalUrl: string): string => {
  return WebPUtils.optimizeUrl(originalUrl);
};
