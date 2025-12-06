import type {
  BulkDownloadResult,
  DownloadOptions,
  SingleDownloadResult,
} from '@shared/services/download/types';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import { PrefetchManager } from '@shared/services/media/prefetch-manager';
import type { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaInfo,
} from '@shared/types/media.types';
import { createSingleton } from '@shared/utils/types/singleton';

export type BulkDownloadOptions = DownloadOptions;

export interface MediaServiceOptions {
  enableMediaExtraction?: boolean;
}

export class MediaService {
  private readonly lifecycle: Lifecycle;
  private static readonly singleton = createSingleton(() => new MediaService());
  private mediaExtraction: MediaExtractionService | null = null;
  private webpSupported: boolean | null = null;
  private readonly prefetchManager = new PrefetchManager(20);
  private currentAbortController?: AbortController;

  constructor(_options: MediaServiceOptions = {}) {
    this.lifecycle = createLifecycle('MediaService', {
      onInitialize: () => this.onInitialize(),
      onDestroy: () => this.onDestroy(),
    });
  }

  /** Initialize service (idempotent, fail-fast on error) */
  public async initialize(): Promise<void> {
    return this.lifecycle.initialize();
  }

  /** Destroy service (idempotent, graceful on error) */
  public destroy(): void {
    this.lifecycle.destroy();
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  private async onInitialize(): Promise<void> {
    if (typeof __FEATURE_MEDIA_EXTRACTION__ === 'undefined' || __FEATURE_MEDIA_EXTRACTION__) {
      const { MediaExtractionService } = await import(
        '@shared/services/media-extraction/media-extraction-service'
      );
      this.mediaExtraction = new MediaExtractionService();
    }
    await this.detectWebPSupport();
  }

  private onDestroy(): void {
    this.prefetchManager.destroy();
  }

  public static getInstance(_options?: MediaServiceOptions): MediaService {
    return MediaService.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    MediaService.singleton.reset();
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {},
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction) throw new Error('Media Extraction not initialized');
    const result = await this.mediaExtraction.extractFromClickedElement(element, options);

    if (result.success && result.mediaItems.length > 0) {
      // Immediate prefetch for the first item (current view)
      const firstItem = result.mediaItems[0];
      if (firstItem) {
        this.prefetchMedia(firstItem, 'immediate');
      }

      // Idle prefetch for others
      result.mediaItems.slice(1).forEach((item) => {
        this.prefetchMedia(item, 'idle');
      });
    }

    return result;
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {},
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction) throw new Error('Media Extraction not initialized');
    return this.mediaExtraction.extractAllFromContainer(container, options);
  }

  private async detectWebPSupport(): Promise<void> {
    if (typeof document === 'undefined') {
      this.webpSupported = false;
      return;
    }
    const canvas = document.createElement('canvas');
    if (typeof canvas.toDataURL !== 'function') {
      this.webpSupported = false;
      return;
    }
    this.webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  isWebPSupported(): boolean {
    return this.webpSupported ?? false;
  }

  getOptimizedImageUrl(originalUrl: string): string {
    if (!this.isWebPSupported()) return originalUrl;
    try {
      const url = new URL(originalUrl);
      if (url.hostname === 'pbs.twimg.com') {
        if (url.searchParams.get('format') === 'webp') return originalUrl;
        url.searchParams.set('format', 'webp');
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

  async prefetchMedia(media: MediaInfo, schedule: 'immediate' | 'idle' = 'idle'): Promise<void> {
    return this.prefetchManager.prefetch(media, schedule);
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
    const { DownloadOrchestrator } = await import('./download/download-orchestrator');
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
    const { DownloadOrchestrator } = await import('./download/download-orchestrator');
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
