// Media Service - Optimized for bundle size
/**
 * @fileoverview 미디어 서비스
 * @description 미디어 추출, 로딩, 프리페치 기능 제공
 * @version 2.0.0 - Phase A5.5: BaseServiceImpl 패턴 적용
 */

import type { MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaInfo, MediaItem } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';
import type { BaseResultStatus } from '@shared/types/result.types';
import type { DownloadProgress } from './download/types';
import { ErrorCode } from '@shared/types/result.types';
import { scheduleIdle, scheduleMicrotask, scheduleRaf } from '@shared/utils/performance';
import { globalTimerManager } from '@shared/utils/timer-management';
import { BaseServiceImpl } from './base-service-impl';

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

import { MediaExtractionService } from './media-extraction/media-extraction-service';
import { FallbackExtractor } from './media/fallback-extractor';
import { VideoControlService } from './media/video-control-service';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
} from './media/username-extraction-service';
import type { UsernameExtractionResult } from './media/username-extraction-service';

export class MediaService extends BaseServiceImpl {
  private static instance: MediaService | null = null;

  private readonly mediaExtraction: MediaExtractionService;
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

  constructor() {
    super('MediaService');
    this.mediaExtraction = new MediaExtractionService();
    this.fallbackExtractor = new FallbackExtractor();
    this.videoControl = new VideoControlService();
    this.usernameParser = new UsernameParser();
  }

  /**
   * 서비스 초기화 (BaseServiceImpl 템플릿 메서드 구현)
   */
  protected async onInitialize(): Promise<void> {
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

  public static getInstance(): MediaService {
    MediaService.instance ??= new MediaService();
    return MediaService.instance;
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.mediaExtraction.extractAllFromContainer(container, options);
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

  get TwitterVideoUtils() {
    return {
      // TwitterVideoExtractor에서 가져온 유틸리티들
      isVideoThumbnail: async (imgElement: HTMLImageElement) => {
        const { isVideoThumbnail } = await import('./media/twitter-video-extractor');
        return isVideoThumbnail(imgElement);
      },
      isVideoPlayer: async (element: HTMLElement) => {
        const { isVideoPlayer } = await import('./media/twitter-video-extractor');
        return isVideoPlayer(element);
      },
      isVideoElement: async (element: HTMLElement) => {
        const { isVideoElement } = await import('./media/twitter-video-extractor');
        return isVideoElement(element);
      },
      extractTweetId: async (url: string) => {
        const { extractTweetId } = await import('./media/twitter-video-extractor');
        return extractTweetId(url);
      },
      getTweetIdFromContainer: async (container: HTMLElement) => {
        const { getTweetIdFromContainer } = await import('./media/twitter-video-extractor');
        return getTweetIdFromContainer(container);
      },
      getVideoMediaEntry: async (tweetId: string, thumbnailUrl?: string) => {
        const { getVideoMediaEntry } = await import('./media/twitter-video-extractor');
        return getVideoMediaEntry(tweetId, thumbnailUrl);
      },
      getVideoUrlFromThumbnail: async (
        imgElement: HTMLImageElement,
        tweetContainer: HTMLElement
      ) => {
        const { getVideoUrlFromThumbnail } = await import('./media/twitter-video-extractor');
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

  async downloadMedia(media: MediaInfo | MediaItem): Promise<SingleDownloadResult> {
    return this.downloadSingle(media);
  }

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

  async prepareForGallery(): Promise<void> {
    this.pauseAllBackgroundVideos();
  }

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

    if (originalUrl.includes('pbs.twimg.com') && !originalUrl.includes('format=webp')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}format=webp`;
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
      const response = await fetch(url, {
        signal: abortController.signal,
        mode: 'cors',
        cache: 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

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
    const { getBulkDownloadServiceFromContainer } = await import(
      '@shared/container/service-accessors'
    );
    const bulk = getBulkDownloadServiceFromContainer();
    return bulk.downloadSingle(media);
  }

  async downloadMultiple(
    mediaItems: Array<MediaInfo | MediaItem>,
    options: BulkDownloadOptions
  ): Promise<DownloadResult> {
    const { getBulkDownloadServiceFromContainer } = await import(
      '@shared/container/service-accessors'
    );
    const bulk = getBulkDownloadServiceFromContainer();
    return bulk.downloadMultiple(mediaItems, options);
  }

  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.downloadMultiple(Array.from(mediaItems), options);
  }

  public cancelDownload(): void {
    this.currentAbortController?.abort();
    logger.debug('Current download cancelled');
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
