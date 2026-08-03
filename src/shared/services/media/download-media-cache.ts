// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { mergeAbortSignalsWithCleanup } from '@piesp/browser-core/error';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { getHttpRequestService } from '@shared/services/http-request-service';
import type { MediaInfo } from '@shared/types/media.types';

type LRUNode = {
  url: string;
  prev: LRUNode | null;
  next: LRUNode | null;
};

const DEFAULT_CACHE_MAX_ENTRIES = 5;

/**
 * Demand-driven Blob cache for image downloads.
 *
 * Requests start only when a download asks for media. Videos and GIFs keep
 * using the direct download path because retaining their Blobs can consume
 * hundreds of megabytes.
 */
export class DownloadMediaCache {
  private readonly cache = new Map<string, Promise<Blob>>();
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly resolvedSizes = new Map<string, number>();
  private readonly nodeMap = new Map<string, LRUNode>();
  private readonly maxEntries: number;
  private readonly maxBytes: number;
  private totalBytes = 0;
  private disposed = false;
  private head: LRUNode | null = null;
  private tail: LRUNode | null = null;

  constructor(maxEntries = DEFAULT_CACHE_MAX_ENTRIES, maxBytes = 100 * 1024 * 1024) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  getOrFetch(media: MediaInfo, signal?: AbortSignal): Promise<Blob> | null {
    if (this.disposed || media.type === 'video' || media.type === 'gif') {
      return null;
    }

    const existing = this.cache.get(media.url);
    if (existing) {
      this.moveToTail(media.url);
      return existing;
    }

    return this.fetchAndCache(media.url, signal);
  }

  /** Cancel only in-flight requests while retaining completed cache entries. */
  cancelPending(): void {
    for (const [url, controller] of this.activeRequests) {
      controller.abort();
      if (this.activeRequests.get(url) === controller) {
        this.activeRequests.delete(url);
        this.cache.delete(url);
        this.removeFromLRU(url);
      }
    }
  }

  private clear(): void {
    this.cache.clear();
    this.nodeMap.clear();
    this.resolvedSizes.clear();
    this.head = null;
    this.tail = null;
    this.totalBytes = 0;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelPending();
    this.clear();
  }

  private fetchAndCache(url: string, callerSignal?: AbortSignal): Promise<Blob> {
    const controller = new AbortController();
    const signalScope = callerSignal
      ? mergeAbortSignalsWithCleanup([controller.signal, callerSignal])
      : { signal: controller.signal, cleanup: () => undefined };

    this.activeRequests.set(url, controller);
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    let cachePromise: Promise<Blob>;
    cachePromise = getHttpRequestService()
      .get<Blob>(url, {
        signal: signalScope.signal,
        responseType: 'blob',
      })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.data;
      })
      .then(
        (blob) => {
          if (this.activeRequests.get(url) === controller) {
            this.activeRequests.delete(url);
          }
          // Adapters can resolve after abort. Only the current cache owner may
          // update accounting or evict entries after an asynchronous gap.
          if (!this.disposed && this.cache.get(url) === cachePromise) {
            this.totalBytes += blob.size;
            this.resolvedSizes.set(url, blob.size);
            this.evictByByteBudget();
          }
          return blob;
        },
        (error: unknown) => {
          if (this.activeRequests.get(url) === controller) {
            this.activeRequests.delete(url);
          }
          if (this.cache.get(url) === cachePromise) {
            this.cache.delete(url);
            this.removeFromLRU(url);
          }
          if (__DEV__) {
            logger.debug('[DownloadMediaCache] Media request failed', {
              url,
              error: normalizeErrorMessage(error),
            });
          }
          throw error;
        }
      )
      .finally(() => {
        signalScope.cleanup();
        if (this.activeRequests.get(url) === controller) {
          this.activeRequests.delete(url);
        }
      });

    // Bulk downloads collect several promises before workers await them. Observe
    // early failures now so they cannot surface as unhandled rejections; callers
    // still receive the original rejecting promise and use the network fallback.
    void cachePromise.catch(() => undefined);
    this.cache.set(url, cachePromise);
    this.addToLRU(url);
    return cachePromise;
  }

  private evictOldest(): void {
    let node = this.head;
    while (node) {
      if (!this.activeRequests.has(node.url)) {
        this.evictNode(node);
        return;
      }
      node = node.next;
    }

    if (this.head) {
      const url = this.head.url;
      this.activeRequests.get(url)?.abort();
      this.activeRequests.delete(url);
      this.evictNode(this.head);
    }
  }

  private evictByByteBudget(): void {
    while (this.totalBytes > this.maxBytes && this.head) {
      this.evictOldest();
    }
  }

  private evictNode(node: LRUNode): void {
    const size = this.resolvedSizes.get(node.url);
    if (size !== undefined) {
      this.totalBytes -= size;
      this.resolvedSizes.delete(node.url);
    }
    this.cache.delete(node.url);
    this.removeNode(node);
  }

  private addToLRU(url: string): void {
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
    node.prev = this.tail;
    node.next = null;
    if (this.tail) this.tail.next = node;
    this.tail = node;
    if (!this.head) this.head = node;
    this.nodeMap.set(url, node);
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
