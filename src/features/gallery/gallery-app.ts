// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery application orchestrator.
 */

import { GALLERY_READY_ATTRIBUTE } from '@constants/readiness';
import type { GalleryRenderer } from '@features/gallery/gallery-renderer';
import { mergeAbortSignalsWithCleanup } from '@piesp/browser-core/error';
import { clampIndex } from '@piesp/browser-core/util';
import { getNotificationAdapter, notifySafely } from '@platform/index';
import { tryGetSettings } from '@shared/container/settings-registry';
import { isGalleryRecoveryActive } from '@shared/dom/utils';
import {
  galleryErrorReporter,
  mediaErrorReporter,
  normalizeErrorMessage,
} from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { getLanguageService } from '@shared/services/language-service';
import { getMediaService } from '@shared/services/media-service';
import {
  closeGallery,
  disposeGallerySignals,
  gallerySignals,
  openGallery,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { disposeKeyboardDebouncer } from '@shared/utils/events/handlers/keyboard';
import {
  createGalleryLifecycle,
  type GalleryLifecycle,
} from '@shared/utils/events/lifecycle/gallery-lifecycle';
import {
  pauseAmbientVideosForGallery,
  startAmbientVideoGuard,
} from '@shared/utils/media/ambient-video-coordinator';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';

export class GalleryApp {
  private initialized = false;
  private ambientVideoGuardDispose: (() => void) | null = null;
  private readonly lifecycle: GalleryLifecycle = createGalleryLifecycle();
  private readonly renderer: GalleryRenderer;
  private mediaClickCounter = 0;
  private mediaClickAbortController: AbortController | null = null;
  private sessionEpoch = 0;
  private sessionAbortController: AbortController | null = null;

  constructor(renderer: GalleryRenderer) {
    this.renderer = renderer;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.sessionEpoch++;
    this.sessionAbortController = new AbortController();

    try {
      await this.setupEventHandlers();
      if (!this.ambientVideoGuardDispose) {
        this.ambientVideoGuardDispose = startAmbientVideoGuard();
      }
      this.initialized = true;
      document.documentElement.setAttribute(GALLERY_READY_ATTRIBUTE, 'true');
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

  /** Resume one trusted click retained privately during extension bootstrap. */
  async resumeEarlyMediaClick(event: MouseEvent): Promise<void> {
    const target = event.target;
    if (
      !this.initialized ||
      !event.isTrusted ||
      !(target instanceof HTMLElement) ||
      !target.isConnected ||
      isGalleryRecoveryActive() ||
      !isProcessableMedia(target)
    ) {
      return;
    }
    await this.handleMediaClick(target, event);
  }

  private async handleMediaClick(element: HTMLElement, _event: MouseEvent): Promise<void> {
    this.mediaClickAbortController?.abort();
    const clickController = new AbortController();
    this.mediaClickAbortController = clickController;
    const opId = ++this.mediaClickCounter;
    const epoch = this.sessionEpoch;
    const sessionSignal = this.sessionAbortController?.signal;
    const signalScope = sessionSignal
      ? mergeAbortSignalsWithCleanup([sessionSignal, clickController.signal])
      : { signal: clickController.signal, cleanup: () => undefined };

    try {
      const mediaService = getMediaService();
      const result = await mediaService.extractFromClickedElement(element, {
        signal: signalScope.signal,
      });

      if (!this.isCurrentMediaClick(opId, epoch, clickController)) return;

      if (result.success && result.mediaItems.length > 0) {
        this.openGallery(result.mediaItems, result.clickedIndex, {
          reason: 'media-click',
        });
        if (result.metadata?.recoveryScope === 'visible-tile') {
          const lang = getLanguageService();
          notifySafely(
            getNotificationAdapter(),
            lang.translate('msg.gal.partialRecovery.title'),
            lang.translate('msg.gal.partialRecovery.body')
          );
        }
      } else {
        mediaErrorReporter.warn(new Error('Media extraction returned no items'), {
          code: 'MEDIA_EXTRACTION_EMPTY',
          metadata: { success: result.success },
        });
        const lang = getLanguageService();
        notifySafely(
          getNotificationAdapter(),
          lang.translate('msg.err.loadMedia.title'),
          lang.translate('msg.err.loadMedia.body')
        );
      }
    } catch (error) {
      if (!this.isCurrentMediaClick(opId, epoch, clickController)) return;
      mediaErrorReporter.error(error, { code: 'MEDIA_EXTRACTION_ERROR' });
      const lang = getLanguageService();
      notifySafely(
        getNotificationAdapter(),
        lang.translate('msg.err.generic'),
        normalizeErrorMessage(error)
      );
    } finally {
      signalScope.cleanup();
      if (this.mediaClickAbortController === clickController) {
        this.mediaClickAbortController = null;
      }
    }
  }

  private isCurrentMediaClick(opId: number, epoch: number, controller: AbortController): boolean {
    return (
      opId === this.mediaClickCounter &&
      epoch === this.sessionEpoch &&
      this.initialized &&
      this.mediaClickAbortController === controller &&
      !controller.signal.aborted
    );
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
      const lang = getLanguageService();
      notifySafely(
        getNotificationAdapter(),
        lang.translate('msg.err.loadGallery'),
        normalizeErrorMessage(error)
      );
      throw error;
    }
  }

  close(): void {
    if (gallerySignals.isOpen) {
      closeGallery();
    }
  }

  async cleanup(): Promise<void> {
    document.documentElement.removeAttribute(GALLERY_READY_ATTRIBUTE);
    if (gallerySignals.isOpen) {
      this.close();
    }

    // Abort all in-flight extraction requests for this session
    this.mediaClickAbortController?.abort();
    this.mediaClickAbortController = null;
    this.sessionAbortController?.abort();
    this.sessionAbortController = null;

    this.ambientVideoGuardDispose?.();
    this.ambientVideoGuardDispose = null;

    try {
      this.lifecycle.cleanup();
    } catch (error) {
      __DEV__ && logger.warn('[GalleryApp] Event cleanup failed:', error);
    }

    this.renderer.destroy();
    disposeGallerySignals();
    disposeKeyboardDebouncer();
    // R3: Do NOT call getMediaService().destroy() — MediaService is a global
    // singleton shared across the application. Destroying it here would break
    // other consumers and prevent gallery re-open. Instead, cancel only
    // demand-driven media requests scoped to this gallery session.
    getMediaService().cancelPendingMediaRequests();

    this.initialized = false;
    delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;
  }
}
