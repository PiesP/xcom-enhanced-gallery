// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOWNLOAD_CACHE_MAX_BYTES, DOWNLOAD_CACHE_MAX_ENTRIES } from '@constants/performance';
import { DownloadMediaCache } from '@shared/services/media/download-media-cache';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { createSingleton } from '@shared/services/singleton-base';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaInfo,
} from '@shared/types/media.types';

export class MediaService {
  private mediaExtraction: MediaExtractionService | null = null;
  private downloadCache: DownloadMediaCache | null = new DownloadMediaCache(
    DOWNLOAD_CACHE_MAX_ENTRIES,
    DOWNLOAD_CACHE_MAX_BYTES
  );
  private didCleanup = false;
  private _initialized = false;

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) return;
    this.didCleanup = false;
    this.downloadCache ??= new DownloadMediaCache(
      DOWNLOAD_CACHE_MAX_ENTRIES,
      DOWNLOAD_CACHE_MAX_BYTES
    );
    this.mediaExtraction = new MediaExtractionService();
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

  private cleanupOnce(): void {
    if (this.didCleanup) {
      return;
    }
    this.didCleanup = true;

    this.downloadCache?.destroy();
    this.downloadCache = null;
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction) throw new Error('Media Extraction not initialized');
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  getDownloadMedia(
    media: MediaInfo,
    signal?: AbortSignal,
    maxResponseBytes?: number
  ): Promise<Blob> | null {
    return this.downloadCache?.getOrFetch(media, signal, maxResponseBytes) ?? null;
  }

  cancelPendingMediaRequests(): void {
    this.downloadCache?.cancelPending();
  }
}

const { getInstance: getMediaService, resetForTests: resetMediaServiceForTests } = createSingleton(
  () => new MediaService()
);

export { getMediaService, resetMediaServiceForTests };
