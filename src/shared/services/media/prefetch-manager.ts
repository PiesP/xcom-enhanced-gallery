// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media Prefetch Manager
 * @description Handles prefetching and caching of media files
 */

import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { HttpRequestService } from '@shared/services/http-request-service';
import type { MediaInfo } from '@shared/types/media.types';

type IdleHandle = {
  readonly cancel: () => void;
};

type IdleRequestCallback = () => void;

/** Schedules a task to run during browser idle time. */
function scheduleIdle(task: IdleRequestCallback): IdleHandle {
  const id = requestIdleCallback(
    () => {
      try {
        task();
      } catch (error) {
        __DEV__ && logger.warn('[scheduleIdle] task error', error);
      }
    },
    { timeout: 2000 }
  );

  return {
    cancel: () => cancelIdleCallback(id),
  };
}

type PrefetchSchedule = 'immediate' | 'idle';

/** Default maximum number of entries in the prefetch cache. */
const DEFAULT_CACHE_MAX_ENTRIES = 5; // Allow +1 buffer beyond the max 4 images per tweet

/**
 * Manages media prefetching and caching.
 * Extracted from MediaService for better separation of concerns.
 */
export class PrefetchManager {
  private readonly cache = new Map<string, Promise<Blob>>();
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly maxEntries: number;
  private disposed = false;
  private readonly idleHandles = new Set<IdleHandle>();

  constructor(maxEntries = DEFAULT_CACHE_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  /**
   * Prefetch media with specified scheduling strategy
   */
  async prefetch(media: MediaInfo, schedule: PrefetchSchedule = 'idle'): Promise<void> {
    // Skip if already cached or in-flight (prevents duplicate idle handles)
    if (this.cache.has(media.url) || this.activeRequests.has(media.url)) {
      return;
    }

    if (schedule === 'immediate') {
      await this.prefetchSingle(media.url);
      return;
    }

    const handle = scheduleIdle(() => {
      this.idleHandles.delete(handle);
      if (this.disposed) return;
      void this.prefetchSingle(media.url).catch(() => {
        // Ignore individual failures — cache cleanup is handled in prefetchSingle.
      });
    });
    this.idleHandles.add(handle);
  }

  /**
   * Get cached media blob
   */
  get(url: string): Promise<Blob> | null {
    const entry = this.cache.get(url);
    if (!entry) return null;
    // Move to end (most recently used) for LRU eviction
    this.cache.delete(url);
    this.cache.set(url, entry);
    return entry;
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
   * Cleanup resources
   */
  destroy(): void {
    this.disposed = true;
    for (const handle of this.idleHandles) {
      handle.cancel();
    }
    this.idleHandles.clear();
    this.cancelAll();
    this.clear();
  }

  private async prefetchSingle(url: string): Promise<void> {
    // Fast path: already cached (completed or in-flight)
    const existing = this.cache.get(url);
    if (existing) {
      try {
        await existing;
      } catch {
        // If the cached promise failed, remove it so we can retry
        this.cache.delete(url);
      }
      if (this.cache.has(url)) return;
    }

    const controller = new AbortController();

    // Register the request atomically to prevent concurrent duplicates
    this.activeRequests.set(url, controller);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const fetchPromise = HttpRequestService.getInstance()
      .get<Blob>(url, {
        signal: controller.signal,
        responseType: 'blob',
      })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.data;
      })
      .finally(() => {
        this.activeRequests.delete(url);
      });

    this.cache.set(url, fetchPromise);

    try {
      await fetchPromise;
    } catch (error) {
      // Remove from cache on error (only if our promise is still the cached one)
      if (this.cache.get(url) === fetchPromise) {
        this.cache.delete(url);
      }

      if (__DEV__) {
        logger.debug('[PrefetchManager] Prefetch failed (ignored)', {
          url,
          error: normalizeErrorMessage(error),
        });
      }
    }
  }

  private evictOldest(): void {
    const first = this.cache.keys().next();
    if (!first.done) {
      const url = first.value;
      // If the evicted entry is still in-flight, abort it to avoid wasting
      // bandwidth/memory and to reduce the chance of duplicated requests.
      const controller = this.activeRequests.get(url);
      if (controller) {
        controller.abort();
        this.activeRequests.delete(url);
      }
      this.cache.delete(url);
    }
  }
}
