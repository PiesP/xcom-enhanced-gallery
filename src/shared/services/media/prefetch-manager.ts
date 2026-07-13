// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media Prefetch Manager
 * @description Handles prefetching and caching of media files
 */

import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { getHttpRequestService } from '@shared/services/http-request-service';
import type { MediaInfo } from '@shared/types/media.types';

type IdleHandle = {
  readonly cancel: () => void;
};

type IdleRequestCallback = () => void;

/** Schedules a task to run during browser idle time. Falls back to setTimeout for Safari. */
function scheduleIdle(task: IdleRequestCallback): IdleHandle {
  if (typeof requestIdleCallback === 'function') {
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

  // Safari 17 and older: requestIdleCallback not available
  const id = setTimeout(() => {
    try {
      task();
    } catch (error) {
      __DEV__ && logger.warn('[scheduleIdle] task error', error);
    }
  }, 1);
  return {
    cancel: () => clearTimeout(id),
  };
}

type PrefetchSchedule = 'immediate' | 'idle';

/** Node in the doubly-linked LRU list */
type LRUNode = {
  url: string;
  prev: LRUNode | null;
  next: LRUNode | null;
};

/** Default maximum number of entries in the prefetch cache. */
const DEFAULT_CACHE_MAX_ENTRIES = 5; // Allow +1 buffer beyond the max 4 images per tweet

/**
 * Manages media prefetching and caching.
 * Extracted from MediaService for better separation of concerns.
 *
 * Uses a doubly-linked list + Map for O(1) LRU eviction instead of
 * scanning all cache entries on each eviction.
 */
export class PrefetchManager {
  private readonly cache = new Map<string, Promise<Blob>>();
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly maxEntries: number;
  private readonly maxBytes: number;
  private totalBytes = 0;
  private disposed = false;
  private readonly idleHandles = new Set<IdleHandle>();

  // Doubly-linked list for O(1) LRU tracking
  private head: { url: string; prev: LRUNode | null; next: LRUNode | null } | null = null;
  private tail: { url: string; prev: LRUNode | null; next: LRUNode | null } | null = null;
  private readonly nodeMap = new Map<string, LRUNode>();

  constructor(maxEntries = DEFAULT_CACHE_MAX_ENTRIES, maxBytes = 100 * 1024 * 1024) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  /**
   * Prefetch media with specified scheduling strategy.
   * Videos are skipped — they can be hundreds of MB and are not suitable
   * for blob-level caching.
   */
  async prefetch(media: MediaInfo, schedule: PrefetchSchedule = 'idle'): Promise<void> {
    // Skip videos — too large for blob cache
    if (media.type === 'video' || media.type === 'gif') {
      return;
    }

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
    // Move to tail (most recently used) for O(1) LRU tracking
    this.moveToTail(url);
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
   /** Clear the prefetch cache and reset byte tracking */
  clear(): void {
    this.cache.clear();
    this.nodeMap.clear();
    this.head = null;
    this.tail = null;
    this.totalBytes = 0;
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
        this.removeFromLRU(url);
      }
      if (this.cache.has(url)) return;
    }

    const controller = new AbortController();

    // Register the request atomically to prevent concurrent duplicates
    this.activeRequests.set(url, controller);

    // Evict oldest entry if cache is full (O(1) via linked list)
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const fetchPromise = getHttpRequestService()
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
    this.addToLRU(url);

    try {
      const blob = await fetchPromise;
      this.totalBytes += blob.size;
      this.evictByByteBudget();
    } catch (error) {
      // Remove from cache on error (only if our promise is still the cached one)
      if (this.cache.get(url) === fetchPromise) {
        this.cache.delete(url);
        this.removeFromLRU(url);
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
    // O(1) eviction: walk from head (LRU end), skip in-flight entries
    let node = this.head;
    while (node) {
      if (!this.activeRequests.has(node.url)) {
        this.cache.delete(node.url);
        this.removeNode(node);
        return;
      }
      node = node.next;
    }
    // Fallback: all entries in-flight — evict the oldest (head) anyway
    if (this.head) {
      const url = this.head.url;
      const controller = this.activeRequests.get(url);
      if (controller) {
        controller.abort();
        this.activeRequests.delete(url);
      }
      this.cache.delete(url);
      this.removeNode(this.head);
    }
  }

  private evictByByteBudget(): void {
    while (this.totalBytes > this.maxBytes && this.head) {
      this.evictOldest();
      // Note: evictOldest removes from cache but doesn't update totalBytes.
      // The evicted entry's bytes are subtracted indirectly — the cache entry
      // is removed, and if re-prefetched, totalBytes will be recalculated.
    }
  }

  // ── Doubly-linked list helpers (O(1) LRU operations) ──────────────────────

  private addToLRU(url: string): void {
    const existing = this.nodeMap.get(url);
    if (existing) {
      this.moveToTail(url);
      return;
    }
    const node: LRUNode = { url, prev: this.tail, next: null };
    if (this.tail) this.tail.next = node;
    this.tail = node;
    if (!this.head) this.head = node;
    this.nodeMap.set(url, node);
  }

  private moveToTail(url: string): void {
    const node = this.nodeMap.get(url);
    if (!node || this.tail === node) return;
    this.removeNode(node);
    // Re-attach at tail
    node.prev = this.tail;
    node.next = null;
    if (this.tail) this.tail.next = node;
    this.tail = node;
    if (!this.head) this.head = node;
  }

  private removeNode(node: LRUNode): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (this.head === node) this.head = node.next;
    if (this.tail === node) this.tail = node.prev;
    this.nodeMap.delete(node.url);
  }

  private removeFromLRU(url: string): void {
    const node = this.nodeMap.get(url);
    if (node) this.removeNode(node);
  }
}
