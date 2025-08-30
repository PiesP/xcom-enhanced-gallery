/**
 * @fileoverview Media Service - 통합 미디어 서비스
 * @description 모든 미디어 관련 기능을 통합한 서비스
 * @version 1.0.0 - Phase 2: Service Consolidation
 */

import type { MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaInfo, MediaItem } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';

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

  // WebP 최적화 관련 상태
  private webpSupported: boolean | null = null;

  // 미디어 로딩 관련 상태 (MediaLoadingService 통합)
  private readonly mediaLoadingStates = new Map<string, MediaLoadingState>();

  // 미디어 프리페칭 관련 상태 (MediaPrefetchingService 통합)
  private readonly prefetchCache = new Map<string, Blob>();
  private readonly activePrefetchRequests = new Map<string, AbortController>();
  private readonly maxCacheEntries = 20;
  private prefetchCacheHits = 0;
  private prefetchCacheMisses = 0;

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
    if (this.isTestEnvironment()) {
      this.webpSupported = true;
      logger.debug('[MediaService] WebP enabled for test environment');
    } else {
      // WebP 지원 감지 초기화 (async 메서드이므로 await 없이 호출)
      this.detectWebPSupport().catch(error => {
        logger.warn('[MediaService] WebP detection initialization failed:', error);
      });
    }
  }

  public static getInstance(): MediaService {
    MediaService.instance ??= new MediaService();
    return MediaService.instance;
  }

  protected async onInitialize(): Promise<void> {
    // MediaService는 특별한 초기화 로직이 없음
  }

  protected onDestroy(): void {
    this.videoControl.destroy();
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

  /**
   * 백업 추출 (API 실패 시) - 레거시 호환성 유지
   */
  async extractWithFallback(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    // Phase 7: Orchestrator가 자동으로 폴백 체인을 관리하므로
    // 이 메서드는 레거시 호환성을 위해 유지
    logger.debug('[MediaService] 레거시 폴백 메서드 호출 - Orchestrator로 리다이렉트');
    return this.mediaExtractionOrchestrator.extract(element, options, extractionId, tweetInfo);
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
  // 간단한 래퍼 메서드들 (Step 4 호환성)
  // ====================================

  /**
   * 미디어 추출 (단순화된 인터페이스) - Phase 7: Orchestrator 사용
   */
  async extractMedia(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.extractFromClickedElement(element, options);
  }

  /**
   * 미디어 다운로드 (단순화된 인터페이스) - 호환성 유지
   * @deprecated getDownloadService().downloadSingle() 사용 권장
   */
  async downloadMedia(media: MediaInfo | MediaItem): Promise<SingleDownloadResult> {
    return this.getDownloadService().downloadSingle(media);
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
  // WebP Optimization API (통합됨)
  // ====================================

  /**
   * 테스트 환경인지 확인
   */
  private isTestEnvironment(): boolean {
    return (
      typeof window === 'undefined' ||
      typeof global !== 'undefined' ||
      process?.env?.NODE_ENV === 'test' ||
      process?.env?.VITEST === 'true'
    );
  }

  /**
   * WebP 지원 여부 감지
   */
  private async detectWebPSupport(): Promise<void> {
    try {
      // 테스트 환경에서는 기본값 false 사용
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        this.webpSupported = false;
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      // canvas.toDataURL이 구현되지 않은 경우 (예: jsdom)
      if (typeof canvas.toDataURL !== 'function') {
        this.webpSupported = false;
        logger.debug('[MediaService] WebP detection skipped (canvas.toDataURL not available)');
        return;
      }

      const dataURL = canvas.toDataURL('image/webp');

      // dataURL이 null이나 유효하지 않은 경우 처리
      if (!dataURL || typeof dataURL !== 'string') {
        this.webpSupported = false;
        logger.debug('[MediaService] WebP detection failed (invalid dataURL)');
        return;
      }

      this.webpSupported = dataURL.indexOf('data:image/webp') === 0;
      logger.debug('[MediaService] WebP support detected:', this.webpSupported);
    } catch (error) {
      this.webpSupported = false;
      logger.warn('[MediaService] WebP detection failed:', error);
    }
  }

  /**
   * WebP 지원 여부 반환
   */
  isWebPSupported(): boolean {
    return this.webpSupported ?? false;
  }

  /**
   * 최적 이미지 URL 생성 (WebP 최적화)
   */
  getOptimizedImageUrl(originalUrl: string): string {
    if (!this.isWebPSupported()) {
      return originalUrl;
    }

    // Twitter 이미지 URL에서 WebP 변환
    if (originalUrl.includes('pbs.twimg.com') && !originalUrl.includes('format=webp')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}format=webp`;
    }

    return originalUrl;
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
      if (this.activePrefetchRequests.size >= maxConcurrent) {
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
    if (this.prefetchCache.has(url) || this.activePrefetchRequests.has(url)) {
      return;
    }

    const abortController = new AbortController();
    this.activePrefetchRequests.set(url, abortController);

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
      if (this.prefetchCache.size >= this.maxCacheEntries) {
        this.evictOldestPrefetchEntry();
      }

      this.prefetchCache.set(url, blob);
      logger.debug('[MediaService] 프리페치 성공:', { url, size: blob.size });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.warn('[MediaService] 프리페치 실패:', error, { url });
      }
    } finally {
      this.activePrefetchRequests.delete(url);
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
   * 가장 오래된 프리페치 캐시 엔트리 제거
   */
  private evictOldestPrefetchEntry(): void {
    const firstKey = this.prefetchCache.keys().next().value;
    if (firstKey) {
      this.prefetchCache.delete(firstKey);
      logger.debug('[MediaService] 프리페치 캐시 엔트리 제거:', firstKey);
    }
  }

  /**
   * 캐시에서 미디어 조회
   */
  getCachedMedia(url: string): Blob | null {
    const blob = this.prefetchCache.get(url);
    if (blob) {
      this.prefetchCacheHits++;
      logger.debug('[MediaService] 프리페치 캐시 히트:', { url });
      return blob;
    }

    this.prefetchCacheMisses++;
    return null;
  }

  /**
   * 모든 프리페치 요청 취소
   */
  cancelAllPrefetch(): void {
    for (const controller of this.activePrefetchRequests.values()) {
      controller.abort();
    }
    this.activePrefetchRequests.clear();
    logger.debug('[MediaService] 모든 프리페치 요청이 취소되었습니다.');
  }

  /**
   * 프리페치 캐시 정리
   */
  clearPrefetchCache(): void {
    this.prefetchCache.clear();
    logger.debug('[MediaService] 프리페치 캐시가 정리되었습니다.');
  }

  /**
   * 프리페치 메트릭 조회
   */
  getPrefetchMetrics() {
    const hitRate =
      this.prefetchCacheHits + this.prefetchCacheMisses > 0
        ? (this.prefetchCacheHits / (this.prefetchCacheHits + this.prefetchCacheMisses)) * 100
        : 0;

    return {
      cacheHits: this.prefetchCacheHits,
      cacheMisses: this.prefetchCacheMisses,
      cacheEntries: this.prefetchCache.size,
      hitRate,
      activePrefetches: this.activePrefetchRequests.size,
    };
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
 * @deprecated 직접 MediaService.getInstance().getOptimizedImageUrl() 사용 권장
 */
export const optimizeWebP = (originalUrl: string): string => {
  return MediaService.getInstance().getOptimizedImageUrl(originalUrl);
};

/**
 * 트위터 이미지 URL 최적화 (호환성 유지를 위한 별칭)
 * @deprecated 직접 MediaService.getInstance().getOptimizedImageUrl() 사용 권장
 */
export const optimizeTwitterImageUrl = (originalUrl: string): string => {
  return MediaService.getInstance().getOptimizedImageUrl(originalUrl);
};

// ====================================
// 다운로드 함수들 (중복 제거됨)
// ====================================

/**
 * 단일 미디어 다운로드 (호환성 유지를 위한 별칭)
 * @deprecated 직접 MediaService.getInstance().getDownloadService().downloadSingle() 사용 권장
 */
export const downloadSingle = async (
  media: MediaInfo | MediaItem
): Promise<SingleDownloadResult> => {
  return MediaService.getInstance().getDownloadService().downloadSingle(media);
};

/**
 * 여러 미디어 다운로드 (호환성 유지를 위한 별칭)
 * @deprecated 직접 MediaService.getInstance().getDownloadService().downloadMultiple() 사용 권장
 */
export const downloadMultiple = async (
  mediaItems: Array<MediaInfo | MediaItem>,
  options: BulkDownloadOptions
): Promise<DownloadResult> => {
  return MediaService.getInstance().getDownloadService().downloadMultiple(mediaItems, options);
};

/**
 * 대량 다운로드 (호환성 유지를 위한 별칭)
 * @deprecated 직접 MediaService.getInstance().getDownloadService().downloadBulk() 사용 권장
 */
export const downloadBulk = async (
  mediaItems: readonly (MediaItem | MediaInfo)[],
  options: BulkDownloadOptions = {}
): Promise<DownloadResult> => {
  return MediaService.getInstance()
    .getDownloadService()
    .downloadBulk(Array.from(mediaItems), options);
};
