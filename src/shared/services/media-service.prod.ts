import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import { PrefetchManager } from '@shared/services/media/prefetch-manager';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaInfo,
} from '@shared/types/media.types';
import { clampIndex } from '@shared/utils/types/safety';
import { createSingleton } from '@shared/utils/types/singleton';

export interface MediaServiceOptions {
  enableMediaExtraction?: boolean;
}

export class MediaService {
  private readonly lifecycle: Lifecycle;
  private static readonly singleton = createSingleton(() => new MediaService());
  private mediaExtraction: MediaExtractionService | null = null;
  private readonly prefetchManager = new PrefetchManager(20);
  private didCleanup = false;

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
    // Ensure we clean up constructor-time allocations even if initialize() was never called.
    this.cleanupOnce();
    this.lifecycle.destroy();
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  private async onInitialize(): Promise<void> {
    if (__FEATURE_MEDIA_EXTRACTION__) {
      this.mediaExtraction = new MediaExtractionService();
    }
  }

  private onDestroy(): void {
    this.cleanupOnce();
  }

  public static getInstance(_options?: MediaServiceOptions): MediaService {
    return MediaService.singleton.get();
  }

  private cleanupOnce(): void {
    if (this.didCleanup) {
      return;
    }
    this.didCleanup = true;

    this.prefetchManager.destroy();
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction) throw new Error('Media Extraction not initialized');
    const result = await this.mediaExtraction.extractFromClickedElement(element, options);

    if (result.success && result.mediaItems.length > 0) {
      const items = result.mediaItems;
      const clickedIndex = clampIndex(result.clickedIndex ?? 0, items.length);
      const scheduled = new Set<string>();

      // Immediate prefetch for the clicked item (current view)
      const clickedItem = items[clickedIndex];
      if (clickedItem) {
        scheduled.add(clickedItem.url);
        this.prefetchMedia(clickedItem, 'immediate');
      }

      // Idle prefetch for others (exclude clicked item; avoid duplicates)
      items.forEach((item, index) => {
        if (!item) return;
        if (index === clickedIndex) return;
        if (scheduled.has(item.url)) return;

        scheduled.add(item.url);
        this.prefetchMedia(item, 'idle');
      });
    }

    return result;
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction) throw new Error('Media Extraction not initialized');
    return this.mediaExtraction.extractAllFromContainer(container, options);
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

  async cleanup(): Promise<void> {
    this.cancelAllPrefetch();
    this.clearPrefetchCache();
    this.onDestroy();
  }
}
