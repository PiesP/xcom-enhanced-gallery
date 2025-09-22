/**
 * @fileoverview Media Service - 통합 미디어 서비스
 * @description 모든 미디어 관련 기능을 통합한 서비스
 * @version 1.0.0 - Phase 2: Service Consolidation
 */

import type { MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaInfo, MediaItem } from '@shared/types/media.types';
import {
  logger,
  createCorrelationId,
  createScopedLoggerWithCorrelation,
} from '@shared/logging/logger';
import { getNativeDownload } from '@shared/external/vendors';
import { getErrorMessage } from '@shared/utils/error-handling';
// Barrel import에서 직접 util만 선택 import (cycle 감소)
import { generateMediaFilename } from '@shared/media/FilenameService';
import type { BaseResultStatus } from '@shared/types/result.types';
import { ErrorCode } from '@shared/types/result.types';
// Schedulers for prefetch task coordination
import { scheduleIdle, scheduleMicrotask, scheduleRaf } from '@shared/utils/performance';
import { globalTimerManager } from '@shared/utils/timer-management';

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
  /**
   * 스케줄 방식: 즉시 실행(immediate) 또는 유휴 시간(idle) 예약.
   * 기본값: 'immediate' (기존 동작과 동일)
   */
  schedule?: 'immediate' | 'idle' | 'raf' | 'microtask';
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
  status: BaseResultStatus;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
  failures?: Array<{ url: string; error: string }>;
  /** Machine readable code (Result v2) */
  code?: ErrorCode;
}

export interface SingleDownloadResult {
  success: boolean;
  status: BaseResultStatus;
  filename?: string;
  error?: string;
  /** Machine readable code (Result v2) */
  code?: ErrorCode;
}

// 기존 서비스들 import
import { MediaExtractionService } from './media-extraction/MediaExtractionService';
import { FallbackExtractor } from './media/FallbackExtractor';
import { VideoControlService } from './media/VideoControlService';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
} from './media/UsernameExtractionService';
import type { UsernameExtractionResult } from './media/UsernameExtractionService';

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
  private readonly mediaExtraction: MediaExtractionService;
  private readonly fallbackExtractor: FallbackExtractor;
  private readonly videoControl: VideoControlService;
  private readonly usernameParser: UsernameParser;

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

  // 대량 다운로드 관련 상태 (BulkDownloadService 통합)
  private readonly currentAbortController?: AbortController;

  constructor() {
    this.mediaExtraction = new MediaExtractionService();
    this.fallbackExtractor = new FallbackExtractor();
    this.videoControl = new VideoControlService(); // Phase 4 간소화: 직접 인스턴스화
    this.usernameParser = new UsernameParser(); // Phase 4 간소화: 직접 인스턴스화

    // WebP 지원 감지 초기화 (async 메서드이므로 await 없이 호출)
    this.detectWebPSupport().catch(error => {
      logger.warn('[MediaService] WebP detection initialization failed:', error);
    });
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
   * 클릭된 요소에서 미디어 추출
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  /**
   * 컨테이너에서 모든 미디어 추출
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.mediaExtraction.extractAllFromContainer(container, options);
  }

  /**
   * 백업 추출 (API 실패 시)
   */
  async extractWithFallback(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    return this.fallbackExtractor.extract(element, options, extractionId, tweetInfo);
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

  /**
   * 현재 갤러리 비디오 재생/일시정지 토글
   * (이전에는 VideoControlService 싱글톤 경유 – 중앙 MediaService로 통합)
   */
  togglePlayPauseCurrent(): void {
    this.videoControl.togglePlayPauseCurrent();
  }

  /** 현재 갤러리 비디오 볼륨 증가 */
  volumeUpCurrent(step = 0.1): void {
    this.videoControl.volumeUpCurrent(step);
  }

  /** 현재 갤러리 비디오 볼륨 감소 */
  volumeDownCurrent(step = 0.1): void {
    this.videoControl.volumeDownCurrent(step);
  }

  /** 현재 갤러리 비디오 음소거 토글 */
  toggleMuteCurrent(): void {
    this.videoControl.toggleMuteCurrent();
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
   * 미디어 추출 (단순화된 인터페이스)
   */
  async extractMedia(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.extractFromClickedElement(element, options);
  }

  /**
   * 미디어 다운로드 (단순화된 인터페이스)
   */
  async downloadMedia(media: MediaInfo | MediaItem): Promise<SingleDownloadResult> {
    return this.downloadSingle(media);
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

  /**
   * WebP 최적화 (테스트에서 요구하는 메서드명)
   */
  optimizeWebP(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl);
  }

  /**
   * 트위터 이미지 URL 최적화 (하위 호환성)
   */
  optimizeTwitterImageUrl(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl);
  }

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
    const scheduleMode = options.schedule ?? 'immediate';

    const prefetchUrls = this.calculatePrefetchUrls(mediaItems, currentIndex, prefetchRange);

    logger.debug('[MediaService] 미디어 프리페칭 시작:', { currentIndex, prefetchUrls });

    // 스케줄 모드별 동작:
    // - immediate: 동기 드레이닝(완료까지 대기)
    // - idle/raf/microtask: 비동기 시드 후 즉시 반환(내부에서 동시성 한도로 끝까지 소진)
    if (scheduleMode === 'immediate') {
      // 동시성 제한 큐 실행기: 전체 큐를 소진할 때까지 실행(블로킹)
      await new Promise<void>(resolve => {
        let i = 0;
        let running = 0;

        const next = () => {
          if (i >= prefetchUrls.length && running === 0) {
            resolve();
            return;
          }

          while (running < maxConcurrent && i < prefetchUrls.length) {
            const url = prefetchUrls[i++];
            if (typeof url !== 'string') continue;
            running++;
            this.prefetchSingle(url)
              .catch(() => {})
              .finally(() => {
                running--;
                next();
              });
          }
        };

        next();
      });
      return;
    }

    // 비동기 스케줄 모드: 내부에서 끝까지 소진하되, 호출자는 대기하지 않음
    const queue = prefetchUrls.slice();
    let inFlight = 0;

    const scheduleTask = (url: string) => {
      switch (scheduleMode) {
        case 'idle':
          scheduleIdle(() => {
            void this.prefetchSingle(url)
              .catch(() => {})
              .finally(() => {
                inFlight--;
                startNext();
              });
          });
          break;
        case 'raf':
          scheduleRaf(() => {
            void this.prefetchSingle(url)
              .catch(() => {})
              .finally(() => {
                inFlight--;
                startNext();
              });
          });
          break;
        case 'microtask':
          scheduleMicrotask(() => {
            void this.prefetchSingle(url)
              .catch(() => {})
              .finally(() => {
                inFlight--;
                startNext();
              });
          });
          break;
        default:
          // fallback safety routed through TimerManager for lifecycle cleanup
          globalTimerManager.setTimeout(() => {
            void this.prefetchSingle(url)
              .catch(() => {})
              .finally(() => {
                inFlight--;
                startNext();
              });
          }, 0);
      }
    };

    const startNext = () => {
      while (inFlight < maxConcurrent && queue.length > 0) {
        const nextUrl = queue.shift();
        if (typeof nextUrl !== 'string') continue;
        inFlight++;
        scheduleTask(nextUrl);
      }
    };

    startNext();
    return; // 즉시 반환
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
    // 대칭 이웃 기반 인덱스 계산(현재를 제외) + 뷰포트 가중치 정렬
    const total = mediaItems.length;
    const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
    const safeIndex = Math.min(Math.max(0, Math.floor(currentIndex)), Math.max(0, safeTotal - 1));
    const safeCount = Math.max(0, Math.min(20, Math.floor(prefetchRange)));

    if (safeTotal === 0 || safeCount === 0) return [];

    const raw: number[] = [];
    for (let i = 1; i <= safeCount; i++) {
      const prev = safeIndex - i;
      if (prev >= 0) raw.push(prev);
      else break;
    }
    for (let i = 1; i <= safeCount; i++) {
      const next = safeIndex + i;
      if (next < safeTotal) raw.push(next);
      else break;
    }

    // 거리 기준 오름차순 정렬, 동일 거리 시 다음(오른쪽) 우선
    const indices = raw.sort((a, b) => {
      const da = Math.abs(a - safeIndex);
      const db = Math.abs(b - safeIndex);
      if (da !== db) return da - db;
      const aIsNext = a > safeIndex ? 0 : 1; // next 우선(0) / prev(1)
      const bIsNext = b > safeIndex ? 0 : 1;
      return aIsNext - bIsNext;
    });

    return indices
      .map(i => mediaItems[i])
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
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
  // 대량 다운로드 기능 (BulkDownloadService 통합)
  // ====================================

  /**
   * MediaInfo를 FilenameService와 호환되는 타입으로 변환
   */
  private ensureMediaItem(media: MediaInfo | MediaItem): MediaItem & { id: string } {
    return {
      ...media,
      id: media.id || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * 단일 미디어 다운로드
   */
  async downloadSingle(media: MediaInfo | MediaItem): Promise<SingleDownloadResult> {
    try {
      const correlationId = createCorrelationId();
      const slog = createScopedLoggerWithCorrelation('MediaDownload', correlationId);
      const download = getNativeDownload();
      const converted = this.ensureMediaItem(media);
      const filename = generateMediaFilename(converted);

      // URL에서 fetch하여 Blob으로 다운로드
      slog.info('Single download started', { url: media.url, filename });
      const response = await fetch(media.url);
      if (!response.ok) {
        const status = (response as Response).status ?? 0;
        throw new Error(`http_${status}`);
      }
      const blob = await response.blob();
      download.downloadBlob(blob, filename);
      slog.debug(`Single download initiated: ${filename}`);
      return { success: true, status: 'success', filename, code: ErrorCode.NONE };
    } catch (error) {
      const message = getErrorMessage(error);
      const correlationId = createCorrelationId();
      const slog = createScopedLoggerWithCorrelation('MediaDownload', correlationId);
      slog.error(`Single download failed: ${message}`);
      const lowered = message.toLowerCase();
      const status: BaseResultStatus = lowered.includes('cancel') ? 'cancelled' : 'error';
      return {
        success: false,
        status,
        error: message,
        code: status === 'cancelled' ? ErrorCode.CANCELLED : ErrorCode.UNKNOWN,
      };
    }
  }

  /**
   * 여러 미디어를 ZIP으로 다운로드
   */
  async downloadMultiple(
    mediaItems: Array<MediaInfo | MediaItem>,
    options: BulkDownloadOptions
  ): Promise<DownloadResult> {
    try {
      const correlationId = createCorrelationId();
      const slog = createScopedLoggerWithCorrelation('MediaDownload', correlationId);
      if (mediaItems.length === 0) {
        return {
          success: false,
          status: 'error',
          filesProcessed: 0,
          filesSuccessful: 0,
          error: 'No files to download',
          code: ErrorCode.EMPTY_INPUT,
        } as DownloadResult;
      }
      const download = getNativeDownload();

      const files: Record<string, Uint8Array> = {};
      let successful = 0;
      const failures: Array<{ url: string; error: string }> = [];

      // filename collision handling: ensure unique names with -1, -2 suffixes
      const usedNames = new Set<string>();
      const baseCounts = new Map<string, number>();
      const ensureUniqueFilename = (desired: string): string => {
        if (!usedNames.has(desired) && !files[desired]) {
          usedNames.add(desired);
          baseCounts.set(desired, 0);
          return desired;
        }
        const lastDot = desired.lastIndexOf('.');
        const name = lastDot > 0 ? desired.slice(0, lastDot) : desired;
        const ext = lastDot > 0 ? desired.slice(lastDot) : '';
        const baseKey = desired;
        let count = baseCounts.get(baseKey) ?? 0;
        while (true) {
          count += 1;
          const candidate = `${name}-${count}${ext}`;
          if (!usedNames.has(candidate) && !files[candidate]) {
            baseCounts.set(baseKey, count);
            usedNames.add(candidate);
            return candidate;
          }
        }
      };

      options.onProgress?.({
        phase: 'preparing',
        current: 0,
        total: mediaItems.length,
        percentage: 0,
      });

      // 파일들을 다운로드하여 ZIP에 추가
      for (let i = 0; i < mediaItems.length; i++) {
        if (this.currentAbortController?.signal.aborted) {
          throw new Error('Download cancelled by user');
        }

        const media = mediaItems[i];
        if (!media) continue;

        options.onProgress?.({
          phase: 'downloading',
          current: i + 1,
          total: mediaItems.length,
          percentage: Math.round(((i + 1) / mediaItems.length) * 100),
          filename: media.filename,
        });

        try {
          const response = await fetch(media.url);
          if (!response.ok) {
            const status = (response as Response).status ?? 0;
            throw new Error(`http_${status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const converted = this.ensureMediaItem(media);
          const desiredName = generateMediaFilename(converted);
          const filename = ensureUniqueFilename(desiredName);
          files[filename] = uint8Array;
          successful++;
        } catch (error) {
          const errMsg = getErrorMessage(error);
          slog.warn(`Failed to download ${media.filename}: ${errMsg}`);
          failures.push({ url: media.url, error: errMsg });
        }
      }

      if (successful === 0) {
        throw new Error('All downloads failed');
      }

      // ZIP 생성 (표준 유틸 경유)
      const { createZipBlobFromFileMap } = await import('@shared/external/zip/zip-creator');
      const zipBlob = await createZipBlobFromFileMap(new Map(Object.entries(files)), {
        compressionLevel: 0,
      });
      const zipFilename = options.zipFilename || `download_${Date.now()}.zip`;

      // ZIP 다운로드
      download.downloadBlob(zipBlob, zipFilename);

      options.onProgress?.({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });
      slog.info('ZIP download complete', {
        zipFilename,
        successful,
        total: mediaItems.length,
      });

      const status: BaseResultStatus =
        failures.length === 0
          ? 'success'
          : failures.length === mediaItems.length
            ? 'error'
            : 'partial';
      const code: ErrorCode =
        status === 'success'
          ? ErrorCode.NONE
          : status === 'partial'
            ? ErrorCode.PARTIAL_FAILED
            : failures.length === mediaItems.length
              ? ErrorCode.ALL_FAILED
              : ErrorCode.UNKNOWN;

      return {
        success: status === 'success' || status === 'partial',
        status,
        filesProcessed: mediaItems.length,
        filesSuccessful: successful,
        filename: zipFilename,
        ...(failures.length > 0 ? { failures } : {}),
        code,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      const correlationId = createCorrelationId();
      const slog = createScopedLoggerWithCorrelation('MediaDownload', correlationId);
      slog.error(`ZIP download failed: ${message}`);
      const lowered = message.toLowerCase();
      const status: BaseResultStatus = lowered.includes('cancel') ? 'cancelled' : 'error';
      return {
        success: false,
        status,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: message,
        code:
          status === 'cancelled'
            ? ErrorCode.CANCELLED
            : message.toLowerCase().includes('all downloads failed')
              ? ErrorCode.ALL_FAILED
              : ErrorCode.UNKNOWN,
      };
    }
  }

  /**
   * 대량 다운로드 (테스트 호환성을 위한 별칭)
   */
  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.downloadMultiple(Array.from(mediaItems), options);
  }

  /**
   * 현재 다운로드 중단
   */
  public cancelDownload(): void {
    this.currentAbortController?.abort();
    logger.debug('Current download cancelled');
  }

  /**
   * 현재 다운로드 중인지 확인
   */
  public isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }

  /**
   * 서비스 정리 (메모리 누수 방지)
   */
  async cleanup(): Promise<void> {
    // 모든 프리페치 요청 취소
    this.cancelAllPrefetch();

    // 프리페치 캐시 정리
    this.clearPrefetchCache();

    // 미디어 로딩 상태 정리
    this.mediaLoadingStates.clear();

    // 비디오 제어 정리
    this.onDestroy();

    logger.debug('[MediaService] 서비스가 정리되었습니다.');
  }
}

// Note:
// 전역 미디어 서비스 인스턴스(module-level singleton)는 import 시점 부작용으로
// 백그라운드 interval/리스너가 시작되어 테스트/런타임에서 누수를 유발할 수 있습니다(R4).
// 따라서 여기서는 인스턴스를 export 하지 않습니다. 필요한 곳에서 반드시
// service-factories의 getMediaService() 또는 ServiceManager 등록 경유로 가져오세요.

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
// Backward-compatible module-level export (lazy)
// ====================================
// 일부 테스트는 `import { mediaService } from './MediaService'` 형태를 기대합니다.
// import 시점에 싱글톤을 즉시 생성하면 import-time 부작용(타이머/리스너)이 발생할 수 있어
// Proxy를 사용해 최초 속성 접근 시에만 MediaService.getInstance()를 생성/바인딩합니다.
// 메서드는 인스턴스에 바인딩되어 this 컨텍스트가 안전합니다.
let __mediaServiceInstance: MediaService | null = null;
function __getMediaService(): MediaService {
  if (!__mediaServiceInstance) {
    __mediaServiceInstance = MediaService.getInstance();
  }
  return __mediaServiceInstance;
}

export const mediaService: MediaService = new Proxy({} as MediaService, {
  get(_target, prop: keyof MediaService, receiver) {
    const inst = __getMediaService();
    const value = Reflect.get(inst as object, prop as string | symbol, receiver) as unknown;
    if (typeof value === 'function') {
      type AnyFunc = (...args: unknown[]) => unknown;
      return (value as AnyFunc).bind(inst);
    }
    return value as never;
  },
  has(_target, prop: keyof MediaService) {
    const inst = __getMediaService();
    return prop in (inst as object);
  },
  getOwnPropertyDescriptor(_target, prop: keyof MediaService) {
    const inst = __getMediaService();
    return Object.getOwnPropertyDescriptor(inst as object, prop as string | symbol);
  },
  ownKeys() {
    const inst = __getMediaService();
    return Reflect.ownKeys(inst as object);
  },
  set(_target, prop: keyof MediaService, value: unknown) {
    const inst = __getMediaService();
    return Reflect.set(inst as object, prop as string | symbol, value);
  },
  defineProperty(_target, prop: keyof MediaService, attributes: PropertyDescriptor) {
    const inst = __getMediaService();
    return Reflect.defineProperty(inst as object, prop as string | symbol, attributes);
  },
  getPrototypeOf() {
    // Expose prototype so spy utilities can walk the chain
    return MediaService.prototype;
  },
});

// Test helper (non-exported in production bundles) — provide typed instance access if needed
// export function __getMediaServiceInstanceForTest(): MediaService { return __getMediaService(); }
