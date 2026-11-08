// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOWNLOAD_CACHE_MAX_BYTES, DOWNLOAD_CACHE_MAX_ENTRIES } from '@constants/performance';
import type { OwnedBlob } from '@shared/services/download/live-byte-budget';
import { DownloadMediaCache } from '@shared/services/media/download-media-cache';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { createSingleton } from '@shared/services/singleton-base';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaInfo,
  MediaExtractor,
  OwnedMediaExtractionSession,
} from '@shared/types/media.types';

/** Gallery borrows page-wide media operations without lifecycle authority. */
export interface GalleryMediaActions extends MediaExtractor {
  getDownloadMedia(
    media: MediaInfo,
    signal?: AbortSignal,
    maxResponseBytes?: number
  ): Promise<OwnedBlob> | null;
  cancelPendingMediaRequests(): void;
}

/** Page owner of the extraction session and the independent download Blob cache. */
export class MediaService {
  private mediaExtraction: OwnedMediaExtractionSession | null = null;
  private downloadCache: DownloadMediaCache | null = new DownloadMediaCache(
    DOWNLOAD_CACHE_MAX_ENTRIES,
    DOWNLOAD_CACHE_MAX_BYTES
  );
  private didCleanup = false;
  private _initialized = false;

  constructor(
    private readonly createExtractionSession: () => OwnedMediaExtractionSession = () =>
      new MediaExtractionService()
  ) {}

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }
    this.didCleanup = false;
    this.downloadCache ??= new DownloadMediaCache(
      DOWNLOAD_CACHE_MAX_ENTRIES,
      DOWNLOAD_CACHE_MAX_BYTES
    );
    this.mediaExtraction = this.createExtractionSession();
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
    this.mediaExtraction?.dispose();
    this.mediaExtraction = null;
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    if (!this.mediaExtraction) {
      throw new Error('Media Extraction not initialized');
    }
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  getDownloadMedia(
    media: MediaInfo,
    signal?: AbortSignal,
    maxResponseBytes?: number
  ): Promise<OwnedBlob> | null {
    return this.downloadCache?.getOrFetch(media, signal, maxResponseBytes) ?? null;
  }

  cancelPendingMediaRequests(): void {
    this.downloadCache?.cancelPending();
  }

  /** Force the next API metadata extraction to revalidate against the provider. */
  refreshApiMetadata(): void {
    this.mediaExtraction?.invalidateApiMetadata();
  }
}

const { getInstance: getMediaService, resetForTests: resetMediaServiceForTests } = createSingleton(
  () => new MediaService()
);

export function getGalleryMediaActions(): GalleryMediaActions {
  return getMediaService();
}

export { getMediaService, resetMediaServiceForTests };
