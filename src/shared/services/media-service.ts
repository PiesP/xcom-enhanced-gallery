import { PrefetchManager } from '@shared/services/media/prefetch-manager';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaInfo,
} from '@shared/types/media.types';
import { clampIndex } from '@shared/utils/types/safety';

let _instance: MediaService | null = null;

export class MediaService {
  private mediaExtraction: MediaExtractionService | null = null;
  private readonly prefetchManager = new PrefetchManager(20);
  private didCleanup = false;
  private _initialized = false;

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) return;
    if (__FEATURE_MEDIA_EXTRACTION__) {
      this.mediaExtraction = new MediaExtractionService();
    }
    this._initialized = true;
  }

  /** Destroy service (idempotent) */
  public destroy(): void {
    this.cleanupOnce();
    this._initialized = false;
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }

  public static getInstance(): MediaService {
    if (!_instance) _instance = new MediaService();
    return _instance;
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    _instance?.destroy();
    _instance = null;
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
    this.cleanupOnce();
  }
}
