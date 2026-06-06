// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery application orchestrator.
 */

import type { GalleryRenderer } from '@features/gallery/gallery-renderer';
import { getMediaService, tryGetSettings } from '@shared/container/container';
import {
  galleryErrorReporter,
  mediaErrorReporter,
  normalizeErrorMessage,
} from '@shared/error/app-error-reporter';
import { getUserscript } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging/logger';
import { closeGallery, gallerySignals, openGallery } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import {
  createGalleryLifecycle,
  type GalleryLifecycle,
} from '@shared/utils/events/lifecycle/gallery-lifecycle';
import {
  pauseAmbientVideosForGallery,
  startAmbientVideoGuard,
} from '@shared/utils/media/ambient-video-coordinator';
import { clampIndex } from '@shared/utils/types/safety';

export class GalleryApp {
  private initialized = false;
  private ambientVideoGuardDispose: (() => void) | null = null;
  private readonly lifecycle: GalleryLifecycle = createGalleryLifecycle();
  private readonly renderer: GalleryRenderer;

  constructor(renderer: GalleryRenderer) {
    this.renderer = renderer;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.setupEventHandlers();
      this.ambientVideoGuardDispose ??= startAmbientVideoGuard();
      this.initialized = true;
    } catch (error) {
      galleryErrorReporter.critical(error, { code: 'GALLERY_APP_INIT_FAILED' });
      throw error;
    }
  }

  private async setupEventHandlers(): Promise<void> {
    const settings = tryGetSettings();
    const enableKeyboard =
      typeof settings?.get('gallery.enableKeyboardNav') === 'boolean'
        ? (settings.get('gallery.enableKeyboardNav') as boolean)
        : true;

    this.lifecycle.initialize(
      {
        onMediaClick: (element, event) => this.handleMediaClick(element, event),
        onGalleryClose: () => this.close(),
      },
      {
        enableKeyboard,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      }
    );
  }

  private async handleMediaClick(element: HTMLElement, _event: MouseEvent): Promise<void> {
    try {
      const mediaService = getMediaService();
      const result = await mediaService.extractFromClickedElement(element);

      if (result.success && result.mediaItems.length > 0) {
        this.openGallery(result.mediaItems, result.clickedIndex, {
          reason: 'media-click',
        });
      } else {
        mediaErrorReporter.warn(new Error('Media extraction returned no items'), {
          code: 'MEDIA_EXTRACTION_EMPTY',
          metadata: { success: result.success },
        });
        getUserscript().notification({
          title: 'Failed to load media',
          text: 'Could not find images or videos.',
        });
      }
    } catch (error) {
      mediaErrorReporter.error(error, { code: 'MEDIA_EXTRACTION_ERROR' });
      getUserscript().notification({
        title: 'Error occurred',
        text: normalizeErrorMessage(error),
      });
    }
  }

  openGallery(mediaItems: MediaInfo[], startIndex = 0, pauseContext?: { reason?: string }): void {
    if (mediaItems.length === 0) return;

    try {
      const validIndex = clampIndex(startIndex, mediaItems.length);
      pauseAmbientVideosForGallery({
        reason: pauseContext?.reason ?? 'media-click',
      });
      openGallery(mediaItems, validIndex);
    } catch (error) {
      galleryErrorReporter.error(error, {
        code: 'GALLERY_OPEN_FAILED',
        metadata: { itemCount: mediaItems.length, startIndex },
      });
      getUserscript().notification({
        title: 'Failed to load gallery',
        text: normalizeErrorMessage(error),
      });
      throw error;
    }
  }

  close(): void {
    if (gallerySignals.isOpen) {
      closeGallery();
    }
  }

  async cleanup(): Promise<void> {
    if (gallerySignals.isOpen) {
      this.close();
    }

    this.ambientVideoGuardDispose?.();
    this.ambientVideoGuardDispose = null;

    try {
      this.lifecycle.cleanup();
    } catch (error) {
      __DEV__ && logger.warn('[GalleryApp] Event cleanup failed:', error);
    }

    this.renderer.destroy();

    this.initialized = false;
    delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;
  }
}
