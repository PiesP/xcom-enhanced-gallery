/**
 * @fileoverview Media Prefetch Manager
 * @description Handles prefetching and caching of media files
 */

import { HttpRequestService } from '@shared/services/http-request-service';
import type { MediaInfo } from '@shared/types/media.types';
import { scheduleIdle } from '@shared/utils/performance';

type PrefetchSchedule = 'immediate' | 'idle';

/**
 * Manages media prefetching and caching.
 * Extracted from MediaService for better separation of concerns.
 */
export class PrefetchManager {
  private readonly cache = new Map<string, Promise<Blob>>();
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly maxEntries: number;

  constructor(maxEntries = 20) {
    this.maxEntries = maxEntries;
  }

  /**
   * Prefetch media with specified scheduling strategy
   */
  async prefetch(media: MediaInfo, schedule: PrefetchSchedule = 'idle'): Promise<void> {
    if (schedule === 'immediate') {
      await this.prefetchSingle(media.url);
      return;
    }

    scheduleIdle(() => {
      void this.prefetchSingle(media.url).catch(() => {
        // Ignore individual failures — cache cleanup is handled in prefetchSingle.
      });
    });
  }

  /**
   * Get cached media blob
   */
  get(url: string): Promise<Blob> | null {
    return this.cache.get(url) ?? null;
  }

  /**
   * Check if media is cached
   */
  has(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Cancel all active prefetch requests
   */
  cancelAll(): void {
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
  }

  /**
   * Clear the prefetch cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the cache for bulk downloads
   */
  getCache(): Map<string, Promise<Blob>> {
    return this.cache;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancelAll();
    this.clear();
  }

  private async prefetchSingle(url: string): Promise<void> {
    if (this.cache.has(url)) return;

    const controller = new AbortController();
    this.activeRequests.set(url, controller);

    const fetchPromise = HttpRequestService.getInstance()
      .get<Blob>(url, {
        signal: controller.signal,
        responseType: 'blob',
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.data;
      })
      .finally(() => {
        this.activeRequests.delete(url);
      });

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(url, fetchPromise);

    // Remove from cache on error
    fetchPromise.catch(() => {
      if (this.cache.get(url) === fetchPromise) {
        this.cache.delete(url);
      }
    });

    await fetchPromise.catch(() => {});
  }

  private evictOldest(): void {
    const first = this.cache.keys().next().value;
    if (first) {
      this.cache.delete(first);
    }
  }
}
