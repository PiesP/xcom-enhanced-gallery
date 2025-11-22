// Media Service - Optimized for bundle size
/**
 * @fileoverview Media service
 * @description Provides media extraction, loading, prefetching functionality
 * @version 3.0.0 - Phase 292: TwitterVideoUtils wrapper removal and simplification
 * @phase 368: Language policy enforcement (English-only code comments)
 */

import type { MediaExtractionResult } from '@shared/types/media.types';
import type { MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaInfo } from '@shared/types/media.types';
import { logger } from '@shared/logging';
import type {
  BulkDownloadResult,
  SingleDownloadResult,
  DownloadOptions,
} from './download-service';
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

export type BulkDownloadOptions = DownloadOptions;

// Phase 326.5: Conditional import for tree-shaking
// MediaExtractionService는 Feature Flag에 따라 동적으로 로드
import type { MediaExtractionService } from './media-extraction/media-extraction-service';

/**
 * MediaService configuration options
 * Phase 326.5: Feature Flag support
 */
export interface MediaServiceOptions {
  /**
   * Enable Media Extraction functionality
   * If false, only Fallback Extractor is used (saves 50 KB)
   * @default true
   */
  enableMediaExtraction?: boolean;
}

export class MediaService extends BaseServiceImpl {
  private static instance: MediaService | null = null;

  private readonly mediaExtraction: MediaExtractionService | null;

  private webpSupported: boolean | null = null;

  private readonly mediaLoadingStates = new Map<string, MediaLoadingState>();

  private readonly prefetchCache = new Map<string, Blob>();
  private readonly activePrefetchRequests = new Map<string, AbortController>();
  private readonly maxCacheEntries = 20;

  private readonly currentAbortController?: AbortController;

  constructor(options: MediaServiceOptions = {}) {
    super('MediaService');

    // Phase 326.5: Feature Flag - Media Extraction is dynamically loaded during initialization
    const enableMediaExtraction = options.enableMediaExtraction ?? true;
    this.mediaExtraction = null; // Initialize as null, load in onInitialize

    // Save enableMediaExtraction flag internally
    (this as { _enableMediaExtraction?: boolean })._enableMediaExtraction = enableMediaExtraction;

    if (!enableMediaExtraction) {
      logger.info('[MediaService] Media Extraction disabled');
    }
  }

  /**
   * Service initialization (BaseServiceImpl template method implementation)
   */
  protected async onInitialize(): Promise<void> {
    // Phase 326.5: Dynamic loading for tree-shaking support
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
   * Service cleanup (BaseServiceImpl template method implementation)
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
    // Phase 326.5: Media Extraction 필수
    if (!this.mediaExtraction) {
      throw new Error('[MediaService] Media Extraction not initialized');
    }
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    // Phase 326.5: Media Extraction 필수
    if (!this.mediaExtraction) {
      throw new Error('[MediaService] Media Extraction not initialized');
    }
    return this.mediaExtraction.extractAllFromContainer(container, options);
  }

  // ====================================
  // Media Extraction Methods
  // ====================================

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

  /**
   * Prefetch a single media item
   * Used for instant download of the currently viewed item
   */
  async prefetchMedia(media: MediaInfo, options: PrefetchOptions = {}): Promise<void> {
    const scheduleMode = options.schedule ?? 'immediate';
    const url = media.url;

    if (scheduleMode === 'immediate') {
      await this.prefetchSingle(url);
      return;
    }

    const task = () => {
      void this.prefetchSingle(url).catch(() => {});
    };

    switch (scheduleMode) {
      case 'idle':
        scheduleIdle(task);
        break;
      case 'raf':
        scheduleRaf(task);
        break;
      case 'microtask':
        scheduleMicrotask(task);
        break;
      default:
        globalTimerManager.setTimeout(task, 0);
    }
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

    logger.debug('[MediaService] Starting media prefetch:', { currentIndex, prefetchUrls });

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

    // Async schedule mode: consume internally but do not wait for caller
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
      logger.debug('[MediaService] Prefetch successful:', { url, size: blob.size });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.warn('[MediaService] Prefetch failed:', error, { url });
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
      logger.debug('[MediaService] Prefetch cache entry removed:', firstKey);
    }
  }

  getCachedMedia(url: string): Blob | null {
    const blob = this.prefetchCache.get(url);
    if (blob) {
      logger.debug('[MediaService] Prefetch cache hit:', { url });
      return blob;
    }

    return null;
  }

  cancelAllPrefetch(): void {
    for (const controller of this.activePrefetchRequests.values()) {
      controller.abort();
    }
    this.activePrefetchRequests.clear();
    logger.debug('[MediaService] All prefetch requests cancelled.');
  }

  clearPrefetchCache(): void {
    this.prefetchCache.clear();
    logger.debug('[MediaService] Prefetch cache cleared.');
  }

  async downloadSingle(
    media: MediaInfo,
    options: DownloadOptions = {}
  ): Promise<SingleDownloadResult> {
    const { downloadService } = await import('./download-service');

    // Phase 368: Check prefetch cache
    const cachedBlob = this.prefetchCache.get(media.url);
    if (cachedBlob) {
      logger.debug('[MediaService] Using cached blob for download');
      return downloadService.downloadSingle(media, { ...options, blob: cachedBlob });
    }

    return downloadService.downloadSingle(media, options);
  }

  async downloadMultiple(
    mediaItems: Array<MediaInfo>,
    options: BulkDownloadOptions = {}
  ): Promise<BulkDownloadResult> {
    const { downloadService } = await import('./download-service');
    return downloadService.downloadBulk(mediaItems, options);
  }

  async downloadBulk(
    mediaItems: readonly MediaInfo[],
    options: BulkDownloadOptions = {}
  ): Promise<BulkDownloadResult> {
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
    logger.debug('[MediaService] Service cleanup completed.');
  }
}

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
