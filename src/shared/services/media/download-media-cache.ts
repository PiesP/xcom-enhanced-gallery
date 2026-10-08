// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import { logger } from '@shared/logging/logger';
import type { LiveByteBudget, OwnedBlob } from '@shared/services/download/live-byte-budget';
import { downloadLiveByteBudget } from '@shared/services/download/live-byte-budget';
import { getHttpRequestService } from '@shared/services/http-request-service';
import type { MediaInfo } from '@shared/types/media.types';

type LRUNode = {
  url: string;
  prev: LRUNode | null;
  next: LRUNode | null;
};

type Borrower = {
  readonly signal: AbortSignal | undefined;
  readonly maxResponseBytes: number | undefined;
  readonly resolve: (owned: OwnedBlob) => void;
  readonly reject: (error: unknown) => void;
  readonly onAbort: () => void;
};

type CacheEntry = {
  readonly url: string;
  readonly controller: AbortController;
  readonly borrowers: Set<Borrower>;
  owner?: OwnedBlob;
};

const DEFAULT_CACHE_MAX_ENTRIES = 5;

/** Demand-driven Blob cache for image downloads. Video and GIF use direct downloads. */
export class DownloadMediaCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly resolvedSizes = new Map<string, number>();
  private readonly nodeMap = new Map<string, LRUNode>();
  private readonly maxEntries: number;
  private readonly maxBytes: number;
  private totalBytes = 0;
  private disposed = false;
  private head: LRUNode | null = null;
  private tail: LRUNode | null = null;

  constructor(
    maxEntries = DEFAULT_CACHE_MAX_ENTRIES,
    maxBytes = 100 * 1024 * 1024,
    private readonly budget: LiveByteBudget = downloadLiveByteBudget
  ) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  getOrFetch(
    media: MediaInfo,
    signal?: AbortSignal,
    maxResponseBytes?: number
  ): Promise<OwnedBlob> | null {
    if (this.disposed || media.type === 'video' || media.type === 'gif') return null;
    if (signal?.aborted) return Promise.reject(getAbortReasonOrAbortErrorFromSignal(signal));

    const existing = this.cache.get(media.url);
    if (existing) {
      this.moveToTail(media.url);
      return this.borrow(existing, signal, maxResponseBytes);
    }

    if (this.cache.size >= this.maxEntries) this.evictOldest();
    const entry: CacheEntry = {
      url: media.url,
      controller: new AbortController(),
      borrowers: new Set(),
    };
    this.cache.set(media.url, entry);
    this.activeRequests.set(media.url, entry.controller);
    this.addToLRU(media.url);
    // Register the first borrower before a transport may settle synchronously.
    const borrowed = this.borrow(entry, signal, maxResponseBytes);
    if (!entry.controller.signal.aborted) void this.fetchAndCache(entry, maxResponseBytes);
    return borrowed;
  }

  /** Cancel only in-flight requests while retaining completed cache entries. */
  cancelPending(): void {
    for (const [url, controller] of this.activeRequests) {
      const entry = this.cache.get(url);
      if (entry?.controller === controller) this.evictNode(this.nodeMap.get(url)!);
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelPending();
    for (const entry of this.cache.values()) entry.owner?.lease.release();
    this.cache.clear();
    this.nodeMap.clear();
    this.resolvedSizes.clear();
    this.head = null;
    this.tail = null;
    this.totalBytes = 0;
  }

  private borrow(
    entry: CacheEntry,
    signal?: AbortSignal,
    maxResponseBytes?: number
  ): Promise<OwnedBlob> {
    const owner = entry.owner;
    if (owner) {
      if (maxResponseBytes !== undefined && owner.value.size > maxResponseBytes) {
        return Promise.reject(new HttpResponseSizeLimitError(maxResponseBytes, owner.value.size));
      }
      return Promise.resolve({ value: owner.value, lease: owner.lease.fork() });
    }

    let resolve!: Borrower['resolve'];
    let reject!: Borrower['reject'];
    const result = new Promise<OwnedBlob>((accept, decline) => {
      resolve = accept;
      reject = decline;
    });
    const onAbort = (): void => {
      entry.borrowers.delete(borrower);
      reject(getAbortReasonOrAbortErrorFromSignal(signal));
      if (entry.borrowers.size === 0 && !entry.owner) {
        if (this.cache.get(entry.url) === entry) this.evictNode(this.nodeMap.get(entry.url)!);
        else entry.controller.abort();
      }
    };
    const borrower: Borrower = { signal, maxResponseBytes, resolve, reject, onAbort };
    entry.borrowers.add(borrower);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
    // Bulk downloads may collect promises before workers await them.
    void result.catch(() => undefined);
    return result;
  }

  private async fetchAndCache(entry: CacheEntry, maxResponseBytes?: number): Promise<void> {
    const { url, controller } = entry;
    try {
      const response = await getHttpRequestService().getOwnedBinary<Blob>(url, {
        signal: controller.signal,
        responseType: 'blob',
        maxResponseBytes: Math.min(this.maxBytes, maxResponseBytes ?? this.maxBytes),
        budget: this.budget,
      });
      const owner: OwnedBlob = { value: response.data, lease: response.lease };
      if (!response.ok) {
        owner.lease.release();
        throw new Error(`HTTP ${response.status}`);
      }

      for (const borrower of entry.borrowers) {
        borrower.signal?.removeEventListener('abort', borrower.onAbort);
        if (borrower.signal?.aborted) {
          borrower.reject(getAbortReasonOrAbortErrorFromSignal(borrower.signal));
        } else if (
          borrower.maxResponseBytes !== undefined &&
          owner.value.size > borrower.maxResponseBytes
        ) {
          borrower.reject(
            new HttpResponseSizeLimitError(borrower.maxResponseBytes, owner.value.size)
          );
        } else {
          borrower.resolve({ value: owner.value, lease: owner.lease.fork() });
        }
      }
      entry.borrowers.clear();

      if (this.activeRequests.get(url) === controller) this.activeRequests.delete(url);
      if (!this.disposed && this.cache.get(url) === entry) {
        entry.owner = owner;
        this.totalBytes += owner.value.size;
        this.resolvedSizes.set(url, owner.value.size);
        this.evictByByteBudget();
      } else {
        // Eviction may abort a request whose adapter still resolves later.
        owner.lease.release();
      }
    } catch (error) {
      for (const borrower of entry.borrowers) {
        borrower.signal?.removeEventListener('abort', borrower.onAbort);
        borrower.reject(error);
      }
      entry.borrowers.clear();
      if (this.cache.get(url) === entry) this.evictNode(this.nodeMap.get(url)!);
      if (__DEV__) {
        logger.debug('[DownloadMediaCache] Media request failed', {
          url,
          error: normalizeErrorMessage(error),
        });
      }
    } finally {
      if (this.activeRequests.get(url) === controller) this.activeRequests.delete(url);
    }
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
    if (this.head) this.evictNode(this.head);
  }

  private evictByByteBudget(): void {
    while (this.totalBytes > this.maxBytes && this.head) this.evictOldest();
  }

  private evictNode(node: LRUNode): void {
    const entry = this.cache.get(node.url);
    entry?.owner?.lease.release();
    if (entry && !entry.owner) {
      for (const borrower of entry.borrowers) {
        borrower.signal?.removeEventListener('abort', borrower.onAbort);
        borrower.reject(new DOMException('Aborted', 'AbortError'));
      }
      entry.borrowers.clear();
    }
    entry?.controller.abort();
    const size = this.resolvedSizes.get(node.url);
    if (size !== undefined) {
      this.totalBytes -= size;
      this.resolvedSizes.delete(node.url);
    }
    this.cache.delete(node.url);
    this.activeRequests.delete(node.url);
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
}
