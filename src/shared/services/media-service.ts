import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaInfo,
} from "@shared/types/media.types";
import {
  scheduleIdle,
  scheduleMicrotask,
  scheduleRaf,
} from "@shared/utils/performance";
import { globalTimerManager } from "@shared/utils/timer-management";
import { BaseServiceImpl } from "./base-service";
import type {
  BulkDownloadResult,
  DownloadOptions,
  SingleDownloadResult,
} from "./download-service";
import { HttpRequestService } from "./http-request-service";
import type { MediaExtractionService } from "./media-extraction/media-extraction-service";

export interface PrefetchOptions {
  maxConcurrent?: number;
  prefetchRange?: number;
  schedule?: "immediate" | "idle" | "raf" | "microtask";
}

export type BulkDownloadOptions = DownloadOptions;

export interface MediaServiceOptions {
  enableMediaExtraction?: boolean;
}

export class MediaService extends BaseServiceImpl {
  private static instance: MediaService | null = null;
  private mediaExtraction: MediaExtractionService | null = null;
  private webpSupported: boolean | null = null;
  private readonly prefetchCache = new Map<string, Blob>();
  private readonly activePrefetchRequests = new Map<string, AbortController>();
  private readonly maxCacheEntries = 20;
  private currentAbortController?: AbortController;

  constructor(_options: MediaServiceOptions = {}) {
    super("MediaService");
  }

  protected async onInitialize(): Promise<void> {
    if (
      typeof __FEATURE_MEDIA_EXTRACTION__ === "undefined" ||
      __FEATURE_MEDIA_EXTRACTION__
    ) {
      const { MediaExtractionService } = await import(
        "./media-extraction/media-extraction-service"
      );
      this.mediaExtraction = new MediaExtractionService();
    }
    await this.detectWebPSupport();
  }

  protected onDestroy(): void {
    this.prefetchCache.clear();
    this.activePrefetchRequests.forEach((c) => c.abort());
    this.activePrefetchRequests.clear();
  }

  public static getInstance(options?: MediaServiceOptions): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService(options);
    }
    return MediaService.instance;
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {},
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction)
      throw new Error("Media Extraction not initialized");
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {},
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction)
      throw new Error("Media Extraction not initialized");
    return this.mediaExtraction.extractAllFromContainer(container, options);
  }

  private async detectWebPSupport(): Promise<void> {
    if (typeof document === "undefined") {
      this.webpSupported = false;
      return;
    }
    const canvas = document.createElement("canvas");
    if (typeof canvas.toDataURL !== "function") {
      this.webpSupported = false;
      return;
    }
    this.webpSupported =
      canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  }

  isWebPSupported(): boolean {
    return this.webpSupported ?? false;
  }

  getOptimizedImageUrl(originalUrl: string): string {
    if (!this.isWebPSupported()) return originalUrl;
    try {
      const url = new URL(originalUrl);
      if (url.hostname === "pbs.twimg.com") {
        if (url.searchParams.get("format") === "webp") return originalUrl;
        url.searchParams.set("format", "webp");
        return url.toString();
      }
    } catch {
      return originalUrl;
    }
    return originalUrl;
  }

  optimizeWebP(url: string): string {
    return this.getOptimizedImageUrl(url);
  }

  async prefetchMedia(
    media: MediaInfo,
    options: PrefetchOptions = {},
  ): Promise<void> {
    const task = () => void this.prefetchSingle(media.url).catch(() => {});
    if (options.schedule === "idle") scheduleIdle(task);
    else if (options.schedule === "raf") scheduleRaf(task);
    else if (options.schedule === "microtask") scheduleMicrotask(task);
    else if (options.schedule === "immediate")
      await this.prefetchSingle(media.url);
    else globalTimerManager.setTimeout(task, 0);
  }

  async prefetchNextMedia(
    mediaItems: readonly string[],
    currentIndex: number,
    options: PrefetchOptions = {},
  ): Promise<void> {
    const urls = this.calculatePrefetchUrls(
      mediaItems,
      currentIndex,
      options.prefetchRange || 2,
    );
    urls.forEach((url) =>
      this.prefetchMedia({ url } as MediaInfo, {
        ...options,
        schedule: options.schedule || "idle",
      }),
    );
  }

  private async prefetchSingle(url: string): Promise<void> {
    if (this.prefetchCache.has(url) || this.activePrefetchRequests.has(url))
      return;
    const controller = new AbortController();
    this.activePrefetchRequests.set(url, controller);
    try {
      const response = await HttpRequestService.getInstance().get<Blob>(url, {
        signal: controller.signal,
        responseType: "blob",
      });
      if (response.ok) {
        if (this.prefetchCache.size >= this.maxCacheEntries)
          this.evictOldestPrefetchEntry();
        this.prefetchCache.set(url, response.data);
      }
    } catch {
      /* ignore */
    } finally {
      this.activePrefetchRequests.delete(url);
    }
  }

  private calculatePrefetchUrls(
    items: readonly string[],
    index: number,
    range: number,
  ): string[] {
    const result: string[] = [];
    for (let i = 1; i <= range; i++) {
      const next = items[index + i];
      if (next) result.push(next);
      const prev = items[index - i];
      if (prev) result.push(prev);
    }
    return result;
  }

  private evictOldestPrefetchEntry(): void {
    const first = this.prefetchCache.keys().next().value;
    if (first) this.prefetchCache.delete(first);
  }

  getCachedMedia(url: string): Blob | null {
    return this.prefetchCache.get(url) || null;
  }

  cancelAllPrefetch(): void {
    this.activePrefetchRequests.forEach((c) => c.abort());
    this.activePrefetchRequests.clear();
  }

  clearPrefetchCache(): void {
    this.prefetchCache.clear();
  }

  async downloadSingle(
    media: MediaInfo,
    options: DownloadOptions = {},
  ): Promise<SingleDownloadResult> {
    const { downloadService } = await import("./download-service");
    const blob = this.prefetchCache.get(media.url);
    return downloadService.downloadSingle(media, {
      ...options,
      ...(blob ? { blob } : {}),
    });
  }

  async downloadMultiple(
    items: Array<MediaInfo>,
    options: BulkDownloadOptions = {},
  ): Promise<BulkDownloadResult> {
    const { downloadService } = await import("./download-service");
    return downloadService.downloadBulk(items, {
      ...options,
      prefetchedBlobs: this.prefetchCache,
    });
  }

  async downloadBulk(
    items: readonly MediaInfo[],
    options: BulkDownloadOptions = {},
  ): Promise<BulkDownloadResult> {
    return this.downloadMultiple(Array.from(items), options);
  }

  cancelDownload(): void {
    this.currentAbortController?.abort();
  }
  isDownloading(): boolean {
    return !!this.currentAbortController;
  }
  async cleanup(): Promise<void> {
    this.cancelAllPrefetch();
    this.clearPrefetchCache();
    this.onDestroy();
  }
}

export const mediaService = MediaService.getInstance();
