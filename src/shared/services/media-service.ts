import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaInfo,
} from "@shared/types/media.types";
import { BaseServiceImpl } from "./base-service";
import type {
  BulkDownloadResult,
  DownloadOptions,
  SingleDownloadResult,
} from "./download/types";
import {
  PrefetchManager,
  type PrefetchOptions,
} from "./media/prefetch-manager";
import type { MediaExtractionService } from "./media-extraction/media-extraction-service";

export type { PrefetchOptions } from "./media/prefetch-manager";

export type BulkDownloadOptions = DownloadOptions;

export interface MediaServiceOptions {
  enableMediaExtraction?: boolean;
}

export class MediaService extends BaseServiceImpl {
  private static instance: MediaService | null = null;
  private mediaExtraction: MediaExtractionService | null = null;
  private webpSupported: boolean | null = null;
  private readonly prefetchManager = new PrefetchManager(20);
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
    this.prefetchManager.destroy();
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
    const result = await this.mediaExtraction.extractFromClickedElement(
      element,
      options,
    );

    if (result.success && result.mediaItems.length > 0) {
      // Immediate prefetch for the first item (current view)
      const firstItem = result.mediaItems[0];
      if (firstItem) {
        this.prefetchMedia(firstItem, { schedule: "immediate" });
      }

      // Idle prefetch for others
      result.mediaItems.slice(1).forEach((item) => {
        this.prefetchMedia(item, { schedule: "idle" });
      });
    }

    return result;
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
    return this.prefetchManager.prefetch(media, options);
  }

  async prefetchNextMedia(
    mediaItems: readonly string[],
    currentIndex: number,
    options: PrefetchOptions = {},
  ): Promise<void> {
    return this.prefetchManager.prefetchAround(
      mediaItems,
      currentIndex,
      options,
    );
  }

  getCachedMedia(url: string): Promise<Blob> | null {
    return this.prefetchManager.get(url);
  }

  cancelAllPrefetch(): void {
    this.prefetchManager.cancelAll();
  }

  clearPrefetchCache(): void {
    this.prefetchManager.clear();
  }

  async downloadSingle(
    media: MediaInfo,
    options: DownloadOptions = {},
  ): Promise<SingleDownloadResult> {
    const { DownloadOrchestrator } = await import(
      "./download/download-orchestrator"
    );
    const downloadService = DownloadOrchestrator.getInstance();

    // Check for pending or completed download
    const pendingPromise = this.prefetchManager.get(media.url);
    let blob: Blob | undefined;

    if (pendingPromise) {
      try {
        blob = await pendingPromise;
      } catch {
        // Ignore prefetch error, downloadService will retry
      }
    }

    return downloadService.downloadSingle(media, {
      ...options,
      ...(blob ? { blob } : {}),
    });
  }

  async downloadMultiple(
    items: Array<MediaInfo>,
    options: BulkDownloadOptions = {},
  ): Promise<BulkDownloadResult> {
    const { DownloadOrchestrator } = await import(
      "./download/download-orchestrator"
    );
    const downloadService = DownloadOrchestrator.getInstance();
    return downloadService.downloadBulk(items, {
      ...options,
      prefetchedBlobs: this.prefetchManager.getCache(),
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
