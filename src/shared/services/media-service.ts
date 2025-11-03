// Media Service - Optimized for bundle size
/**
 * @fileoverview 미디어 서비스
 * @description 미디어 추출, 로딩, 프리페치 기능 제공
 * @version 3.0.0 - Phase 292: TwitterVideoUtils 래퍼 제거 및 단순화
 */

import type { MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaInfo, MediaItem } from '@shared/types/media.types';
import { logger } from '@shared/logging';
import type { BaseResultStatus } from '@shared/types/result.types';
import type { DownloadProgress } from './download/types';
import { ErrorCode } from '@shared/types/result.types';
import { scheduleIdle, scheduleMicrotask, scheduleRaf } from '@shared/utils/performance';
import { globalTimerManager } from '@shared/utils/timer-management';
import { BaseServiceImpl } from './base-service';
import { HttpRequestService } from './http-request-service';

export interface MediaLoadingState {
  isLoading: boolean;
  hasError: boolean;
  loadedUrl?: string;
  errorMessage?: string;
}

export interface MediaLoadingOptions {
  retryAttempts?: number;
  timeout?: number;
}

export interface PrefetchOptions {
  maxConcurrent?: number;
  prefetchRange?: number;
  schedule?: 'immediate' | 'idle' | 'raf' | 'microtask';
}

export type { DownloadProgress } from './download/types';

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
  code?: ErrorCode;
}

export interface SingleDownloadResult {
  success: boolean;
  status: BaseResultStatus;
  filename?: string;
  error?: string;
  code?: ErrorCode;
}

export interface MediaAvailabilityResult {
  available: boolean;
  environment: string;
  message: string;
  canSimulate: boolean;
  dependencies: {
    httpService: {
      available: boolean;
      reason?: string;
    };
  };
}

export interface SimulatedMediaFetchResult {
  success: boolean;
  itemsProcessed: number;
  itemsSimulated: number;
  simulatedData: Array<{
    url: string;
    mimeType: string;
    timestamp: number;
  }>;
  error?: string;
  message: string;
}

// Phase 326.5: Conditional import for tree-shaking
// MediaExtractionService는 Feature Flag에 따라 동적으로 로드
import type { MediaExtractionService } from './media-extraction/media-extraction-service';
import { FallbackExtractor } from './media/fallback-extractor';
import { VideoControlService } from './media/video-control-service';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
} from './media/username-extraction-service';
import type { UsernameExtractionResult } from './media/username-extraction-service';

/**
 * MediaService 설정 옵션
 * Phase 326.5: Feature Flag 지원
 */
export interface MediaServiceOptions {
  /**
   * Media Extraction 기능 활성화 여부
   * false일 경우 Fallback Extractor만 사용 (50 KB 절감)
   * @default true
   */
  enableMediaExtraction?: boolean;
}

export class MediaService extends BaseServiceImpl {
  private static instance: MediaService | null = null;

  private readonly mediaExtraction: MediaExtractionService | null;
  private readonly fallbackExtractor: FallbackExtractor;
  private readonly videoControl: VideoControlService;
  private readonly usernameParser: UsernameParser;

  private webpSupported: boolean | null = null;

  private readonly mediaLoadingStates = new Map<string, MediaLoadingState>();

  private readonly prefetchCache = new Map<string, Blob>();
  private readonly activePrefetchRequests = new Map<string, AbortController>();
  private readonly maxCacheEntries = 20;
  private prefetchCacheHits = 0;
  private prefetchCacheMisses = 0;

  private readonly currentAbortController?: AbortController;

  constructor(options: MediaServiceOptions = {}) {
    super('MediaService');

    // Phase 326.5: Feature Flag - Media Extraction은 초기화 단계에서 동적 로드
    const enableMediaExtraction = options.enableMediaExtraction ?? true;
    this.mediaExtraction = null; // 일단 null로 초기화, onInitialize에서 로드

    this.fallbackExtractor = new FallbackExtractor();
    this.videoControl = new VideoControlService();
    this.usernameParser = new UsernameParser();

    // 내부적으로 enableMediaExtraction 플래그 저장
    (this as { _enableMediaExtraction?: boolean })._enableMediaExtraction = enableMediaExtraction;

    if (!enableMediaExtraction) {
      logger.info('[MediaService] Media Extraction 비활성화 - Fallback만 사용');
    }
  }

  /**
   * 서비스 초기화 (BaseServiceImpl 템플릿 메서드 구현)
   */
  protected async onInitialize(): Promise<void> {
    // Phase 326.5: 동적 로드로 tree-shaking 지원
    const enableMediaExtraction = (this as unknown as { _enableMediaExtraction?: boolean })
      ._enableMediaExtraction;

    if (enableMediaExtraction) {
      const { MediaExtractionService } = await import(
        './media-extraction/media-extraction-service'
      );
      // @ts-expect-error - Dynamic initialization for tree-shaking
      this.mediaExtraction = new MediaExtractionService();
    }

    await this.detectWebPSupport();
  }

  /**
   * 서비스 정리 (BaseServiceImpl 템플릿 메서드 구현)
   */
  protected onDestroy(): void {
    this.prefetchCache.clear();
    this.mediaLoadingStates.clear();
    this.activePrefetchRequests.forEach(controller => controller.abort());
    this.activePrefetchRequests.clear();
  }

  public static getInstance(options?: MediaServiceOptions): MediaService {
    if (!MediaService.instance) {
      // Phase 326.5: Feature Flag 적용
      const enableMediaExtraction = options?.enableMediaExtraction ?? __FEATURE_MEDIA_EXTRACTION__;
      MediaService.instance = new MediaService({ enableMediaExtraction });
    }
    return MediaService.instance;
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    // Phase 326.5: Media Extraction 비활성화 시 Fallback 사용
    if (!this.mediaExtraction) {
      logger.debug('[MediaService] Media Extraction 비활성화 - Fallback 사용');
      return this.fallbackExtractor.extract(element, options, this.generateExtractionId());
    }
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    // Phase 326.5: Media Extraction 비활성화 시 Fallback 사용
    if (!this.mediaExtraction) {
      logger.debug('[MediaService] Media Extraction 비활성화 - Fallback 사용');
      return this.fallbackExtractor.extract(container, options, this.generateExtractionId());
    }
    return this.mediaExtraction.extractAllFromContainer(container, options);
  }

  /**
   * 추출 ID 생성 (내부 헬퍼)
   */
  private generateExtractionId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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

  restoreBackgroundVideos(): void {
    this.videoControl.restoreBackgroundVideos();
  }

  isVideoControlActive(): boolean {
    return this.videoControl.isActive();
  }

  getPausedVideoCount(): number {
    return this.videoControl.getPausedVideoCount();
  }

  forceResetVideoControl(): void {
    this.videoControl.forceReset();
  }

  togglePlayPauseCurrent(): void {
    this.videoControl.togglePlayPauseCurrent();
  }

  volumeUpCurrent(step = 0.1): void {
    this.videoControl.volumeUpCurrent(step);
  }

  volumeDownCurrent(step = 0.1): void {
    this.videoControl.volumeDownCurrent(step);
  }

  toggleMuteCurrent(): void {
    this.videoControl.toggleMuteCurrent();
  }

  extractUsername(element?: HTMLElement | Document): UsernameExtractionResult {
    return this.usernameParser.extractUsername(element);
  }

  parseUsernameFast(element?: HTMLElement | Document): string | null {
    return parseUsernameFast(element);
  }

  // ====================================
  // Environment-Aware Methods (Phase 314-Extended)
  // ====================================

  /**
   * MediaService 가용성 확인
   * HttpRequestService 의존성 및 환경 상태 검증
   *
   * @returns 가용성 정보 및 의존성 상태
   */
  async validateAvailability(): Promise<MediaAvailabilityResult> {
    try {
      // 1. environment-detector 동적 import
      const { detectEnvironment } = await import('@shared/external/userscript');
      const env = detectEnvironment();

      // 2. HttpRequestService 가용성 확인
      const httpService = HttpRequestService.getInstance();
      const httpAvailability = await httpService.validateAvailability();

      // 3. 메인 기능 (미디어 추출 + 페치)은 HttpService 의존
      const available = httpAvailability.available;

      return {
        available,
        environment: env.environment,
        message: available
          ? `✅ MediaService 준비 완료 (${env.environment})`
          : `⚠️ MediaService 제한: ${httpAvailability.message}`,
        canSimulate: env.isTestEnvironment || available,
        dependencies: {
          httpService: {
            available: httpAvailability.available,
            reason: httpAvailability.message,
          },
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      logger.warn('[MediaService] validateAvailability 오류:', errorMsg);

      return {
        available: false,
        environment: 'unknown',
        message: `❌ 가용성 확인 실패: ${errorMsg}`,
        canSimulate: false,
        dependencies: {
          httpService: {
            available: false,
            reason: errorMsg,
          },
        },
      };
    }
  }

  /**
   * 미디어 fetch 시뮬레이션
   * 여러 미디어 아이템의 fetch 작업을 시뮬레이션합니다.
   *
   * @param mediaItems fetch할 미디어 아이템 배열
   * @param options 시뮬레이션 옵션
   * @returns 시뮬레이션 결과
   */
  async simulateMediaFetch(
    mediaItems: (MediaInfo | MediaItem)[],
    options: { signal?: AbortSignal } = {}
  ): Promise<SimulatedMediaFetchResult> {
    try {
      // 1. 취소 신호 확인
      if (options.signal?.aborted) {
        return {
          success: false,
          itemsProcessed: 0,
          itemsSimulated: 0,
          simulatedData: [],
          error: 'Aborted',
          message: '❌ 작업이 취소되었습니다',
        };
      }

      const simulatedData: Array<{
        url: string;
        mimeType: string;
        timestamp: number;
      }> = [];
      let itemsSimulated = 0;

      // 2. 각 미디어 아이템 처리
      for (const media of mediaItems) {
        if (options.signal?.aborted) break;

        try {
          // 3. 네트워크 지연 시뮬레이션 (50-200ms)
          const delay = Math.random() * 150 + 50;
          await new Promise(resolve => globalThis.setTimeout(resolve, delay));

          // 4. 미디어 정보 추출
          const mediaObj = media as unknown as Record<string, unknown>;
          const mediaUrl = (mediaObj.url || mediaObj.media_url || '') as string;
          const mediaTypeValue = (mediaObj.media_type || mediaObj.type || 'media') as string;

          // 5. 미디어 타입에 따른 MIME 타입 결정
          const mimeType = this.getMimeTypeFromMediaType(mediaTypeValue);

          // 6. 시뮬레이션된 데이터 추가
          simulatedData.push({
            url: mediaUrl,
            mimeType,
            timestamp: Date.now(),
          });

          itemsSimulated++;
        } catch (itemError) {
          logger.warn('[MediaService] 미디어 아이템 시뮬레이션 오류:', itemError);
          // 개별 아이템 오류는 무시하고 계속 진행
          continue;
        }
      }

      return {
        success: itemsSimulated > 0,
        itemsProcessed: mediaItems.length,
        itemsSimulated,
        simulatedData,
        message: `✅ ${itemsSimulated}/${mediaItems.length} 미디어 아이템 fetch 시뮬레이션 완료`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      logger.error('[MediaService] simulateMediaFetch 오류:', errorMsg);

      return {
        success: false,
        itemsProcessed: 0,
        itemsSimulated: 0,
        simulatedData: [],
        error: errorMsg,
        message: `❌ 시뮬레이션 실패: ${errorMsg}`,
      };
    }
  }

  /**
   * 미디어 타입에서 MIME 타입 추출
   *
   * @param mediaType 미디어 타입 (photo, video, animated_gif, media 등)
   * @returns MIME 타입 문자열
   */
  private getMimeTypeFromMediaType(mediaType: string): string {
    const typeMap: Record<string, string> = {
      photo: 'image/jpeg',
      video: 'video/mp4',
      animated_gif: 'video/mp4',
      media: 'application/octet-stream',
    };
    return typeMap[mediaType] || 'application/octet-stream';
  }

  // ====================================
  // 미디어 추출 메서드들
  // ====================================

  async cleanupAfterGallery(): Promise<void> {
    this.restoreBackgroundVideos();
  }

  private async detectWebPSupport(): Promise<void> {
    try {
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        this.webpSupported = false;
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      if (typeof canvas.toDataURL !== 'function') {
        this.webpSupported = false;
        logger.debug('[MediaService] WebP detection skipped (canvas.toDataURL not available)');
        return;
      }

      const dataURL = canvas.toDataURL('image/webp');

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

  isWebPSupported(): boolean {
    return this.webpSupported ?? false;
  }

  getOptimizedImageUrl(originalUrl: string): string {
    if (!this.isWebPSupported()) {
      return originalUrl;
    }

    // URL 검증 - 호스트명을 정확히 확인하여 도메인 스푸핑 방지
    try {
      const url = new URL(originalUrl);

      // pbs.twimg.com 호스트만 최적화 (정확한 호스트명 매칭)
      if (url.hostname === 'pbs.twimg.com') {
        // 이미 webp 형식이면 그대로 반환
        if (url.searchParams.get('format') === 'webp') {
          return originalUrl;
        }

        // format 파라미터를 webp로 설정
        url.searchParams.set('format', 'webp');
        return url.toString();
      }
    } catch {
      // URL 파싱 실패 시 원본 반환
      return originalUrl;
    }

    return originalUrl;
  }

  optimizeWebP(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl);
  }
  /**
   * 트위터 이미지 URL 최적화 (하위 호환성)
   */
  optimizeTwitterImageUrl(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl);
  }

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

  unregisterMediaElement(id: string): void {
    this.mediaLoadingStates.delete(id);
  }

  getLoadingState(id: string): MediaLoadingState | undefined {
    return this.mediaLoadingStates.get(id);
  }

  private loadMediaElement(id: string, element: HTMLElement, src: string): void {
    if (element instanceof HTMLImageElement) {
      this.loadImage(id, element, src);
    } else if (element instanceof HTMLVideoElement) {
      this.loadVideo(id, element, src);
    }
  }

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

    if (scheduleMode === 'immediate') {
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
    return;
  }

  private async prefetchSingle(url: string): Promise<void> {
    if (this.prefetchCache.has(url) || this.activePrefetchRequests.has(url)) {
      return;
    }

    const abortController = new AbortController();
    this.activePrefetchRequests.set(url, abortController);

    try {
      const httpService = HttpRequestService.getInstance();
      const response = await httpService.get<Blob>(url, {
        signal: abortController.signal,
        responseType: 'blob',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = response.data;

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

  private calculatePrefetchUrls(
    mediaItems: readonly string[],
    currentIndex: number,
    prefetchRange: number
  ): string[] {
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

    const indices = raw.sort((a, b) => {
      const da = Math.abs(a - safeIndex);
      const db = Math.abs(b - safeIndex);
      if (da !== db) return da - db;
      const aIsNext = a > safeIndex ? 0 : 1;
      const bIsNext = b > safeIndex ? 0 : 1;
      return aIsNext - bIsNext;
    });

    return indices
      .map(i => mediaItems[i])
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
  }

  private evictOldestPrefetchEntry(): void {
    const firstKey = this.prefetchCache.keys().next().value;
    if (firstKey) {
      this.prefetchCache.delete(firstKey);
      logger.debug('[MediaService] 프리페치 캐시 엔트리 제거:', firstKey);
    }
  }

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

  cancelAllPrefetch(): void {
    for (const controller of this.activePrefetchRequests.values()) {
      controller.abort();
    }
    this.activePrefetchRequests.clear();
    logger.debug('[MediaService] 모든 프리페치 요청이 취소되었습니다.');
  }

  clearPrefetchCache(): void {
    this.prefetchCache.clear();
    logger.debug('[MediaService] 프리페치 캐시가 정리되었습니다.');
  }

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

  async downloadSingle(media: MediaInfo | MediaItem): Promise<SingleDownloadResult> {
    const { unifiedDownloadService } = await import('./unified-download-service');
    const result = await unifiedDownloadService.downloadSingle(media);

    // Convert UnifiedSingleDownloadResult to SingleDownloadResult (backwards compatibility)
    return {
      success: result.success,
      status: result.success ? 'success' : 'error',
      ...(result.filename && { filename: result.filename }),
      ...(result.error && { error: result.error }),
      code: result.success ? ErrorCode.NONE : ErrorCode.UNKNOWN,
    };
  }

  async downloadMultiple(
    mediaItems: Array<MediaInfo | MediaItem>,
    _options?: BulkDownloadOptions
  ): Promise<DownloadResult> {
    const { unifiedDownloadService } = await import('./unified-download-service');
    const result = await unifiedDownloadService.downloadBulk(mediaItems);

    // Convert UnifiedBulkDownloadResult to DownloadResult (backwards compatibility)
    return {
      success: result.success,
      status: result.status,
      filesProcessed: result.filesProcessed,
      filesSuccessful: result.filesSuccessful,
      ...(result.error && { error: result.error }),
      ...(result.filename && { filename: result.filename }),
    };
  }

  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.downloadMultiple(Array.from(mediaItems), options);
  }

  public cancelDownload(): void {
    this.currentAbortController?.abort();
    logger.debug('[MediaService] Current download cancelled');
  }

  public isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }

  async cleanup(): Promise<void> {
    this.cancelAllPrefetch();
    this.clearPrefetchCache();
    this.mediaLoadingStates.clear();
    this.onDestroy();
    logger.debug('[MediaService] 서비스가 정리되었습니다.');
  }
}

export { extractUsername };
export { parseUsernameFast };
export type { UsernameExtractionResult };

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
