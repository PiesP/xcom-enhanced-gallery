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
import type { TranslationKey } from '@shared/i18n/types';
import { logger } from '@shared/logging/logger';
import { getLanguageService } from '@shared/services/language-service';
import { captureClickedMediaEvidence } from '@shared/services/media-extraction/determine-clicked-index';
import { getMediaService } from '@shared/services/media-service';
import {
  closeGallery,
  disposeGallerySignals,
  gallerySignals,
  openGallery,
} from '@shared/state/signals/gallery.signals';
import type { MediaExtractionResult, MediaInfo } from '@shared/types/media.types';
import { disposeKeyboardDebouncer } from '@shared/utils/events/handlers/keyboard';
import {
  createGalleryLifecycle,
  type GalleryLifecycle,
} from '@shared/utils/events/lifecycle/gallery-lifecycle';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { getMediaClickTarget } from '@shared/utils/media/media-click-target';
import { startNativeVideoRecovery } from '@shared/utils/media/native-video-recovery';

function mediaFailureMessage(kind: MediaExtractionResult['failureKind']): TranslationKey {
  switch (kind) {
    case 'unsupported-source':
      return 'msg.err.loadMedia.unsupported';
    case 'no-media':
      return 'msg.err.loadMedia.noMedia';
    case 'denied':
      return 'msg.err.loadMedia.denied';
    case 'unreadable':
      return 'msg.err.loadMedia.unreadable';
    case 'rate-limited':
      return 'msg.err.loadMedia.rateLimited';
    case 'deferred':
      return 'msg.err.loadMedia.deferred';
    case 'provider-error':
      return 'msg.err.loadMedia.providerError';
    case 'transport':
      return 'msg.err.loadMedia.transport';
    case 'owner-unconfirmed':
      return 'msg.err.loadMedia.ownerUnconfirmed';
    case 'mismatch':
      return 'msg.err.loadMedia.mismatch';
    case 'cancelled':
      return 'msg.err.loadMedia.cancelled';
    default:
      return 'msg.err.loadMedia.body';
  }
}

export class GalleryApp {
  private initialized = false;
  private readonly lifecycle: GalleryLifecycle = createGalleryLifecycle();
  private readonly renderer: GalleryRenderer;
  private mediaClickCounter = 0;
  private mediaClickAbortController: AbortController | null = null;
  private sessionEpoch = 0;
  private sessionAbortController: AbortController | null = null;
  private nativeVideoRecoveryDispose: (() => void) | null = null;

  constructor(renderer: GalleryRenderer) {
    this.renderer = renderer;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.sessionEpoch++;
    this.sessionAbortController = new AbortController();

    try {
      await this.setupEventHandlers();
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
    const target = getMediaClickTarget(event);
    if (
      !this.initialized ||
      !event.isTrusted ||
      !target?.isConnected ||
      isGalleryRecoveryActive() ||
      !isProcessableMedia(target, event)
    ) {
      return;
    }
    await this.handleMediaClick(target, event);
  }

  private async handleMediaClick(element: HTMLElement, _event: MouseEvent): Promise<void> {
    this.nativeVideoRecoveryDispose?.();
    this.nativeVideoRecoveryDispose = null;
    const videoClick = captureClickedMediaEvidence(element).mediaType === 'video';
    const clickUrl = location.href;
    this.mediaClickAbortController?.abort();
    const clickController = new AbortController();
    this.mediaClickAbortController = clickController;
    const opId = ++this.mediaClickCounter;
    const epoch = this.sessionEpoch;
    const sessionSignal = this.sessionAbortController?.signal;
    const signalScope = sessionSignal
      ? mergeAbortSignalsWithCleanup([sessionSignal, clickController.signal])
      : { signal: clickController.signal, cleanup: () => undefined };
    // Transport can reject during navigation before pagehide runs session cleanup.
    const cancelOnNavigation = (): void => clickController.abort();
    window.addEventListener('beforeunload', cancelOnNavigation, {
      once: true,
      passive: true,
      signal: clickController.signal,
    });

    try {
      const mediaService = getMediaService();
      const result = await mediaService.extractFromClickedElement(element, {
        signal: signalScope.signal,
      });

      if (!this.isCurrentMediaClick(opId, epoch, clickController, clickUrl)) return;

      if (result.success && result.mediaItems.length > 0) {
        this.openGallery(result.mediaItems, result.clickedIndex);
        const partialRecovery = result.metadata?.recoveryScope === 'visible-tile';
        const observedQuality = result.mediaItems.some(
          (media) =>
            media.downloadSource?.quality === 'observed' ||
            media.downloadSource?.quality === 'unverified-original'
        );
        if (partialRecovery || observedQuality) {
          const lang = getLanguageService();
          notifySafely(
            getNotificationAdapter(),
            lang.translate(
              partialRecovery ? 'msg.gal.partialRecovery.title' : 'msg.gal.observedQuality.title'
            ),
            partialRecovery
              ? lang.translate('msg.gal.partialRecovery.body') +
                  (observedQuality ? ` ${lang.translate('msg.gal.observedQuality.body')}` : '')
              : lang.translate('msg.gal.observedQuality.body')
          );
        }
      } else {
        mediaErrorReporter.warn(new Error('Media extraction returned no items'), {
          code: 'MEDIA_EXTRACTION_EMPTY',
          metadata: { success: result.success, failureKind: result.failureKind },
        });
        const lang = getLanguageService();
        const recovery = videoClick
          ? this.videoRecoveryMessage(opId, epoch, element, clickUrl)
          : '';
        notifySafely(
          getNotificationAdapter(),
          lang.translate('msg.err.loadMedia.title'),
          lang.translate(mediaFailureMessage(result.failureKind)) + recovery
        );
      }
    } catch (error) {
      if (!this.isCurrentMediaClick(opId, epoch, clickController, clickUrl)) return;
      mediaErrorReporter.error(error, { code: 'MEDIA_EXTRACTION_ERROR' });
      const lang = getLanguageService();
      notifySafely(
        getNotificationAdapter(),
        lang.translate('msg.err.generic'),
        normalizeErrorMessage(error).slice(0, 240) +
          (videoClick ? this.videoRecoveryMessage(opId, epoch, element, clickUrl) : '')
      );
    } finally {
      window.removeEventListener('beforeunload', cancelOnNavigation);
      signalScope.cleanup();
      if (this.mediaClickAbortController === clickController) {
        this.mediaClickAbortController = null;
      }
    }
  }

  private isCurrentMediaClick(
    opId: number,
    epoch: number,
    controller: AbortController,
    clickUrl: string
  ): boolean {
    return (
      opId === this.mediaClickCounter &&
      epoch === this.sessionEpoch &&
      this.initialized &&
      location.href === clickUrl &&
      this.mediaClickAbortController === controller &&
      !controller.signal.aborted
    );
  }

  private videoRecoveryMessage(
    opId: number,
    epoch: number,
    element: HTMLElement,
    clickUrl: string
  ): string {
    const lang = getLanguageService();
    if (!tryGetSettings()) return ` ${lang.translate('msg.err.loadMedia.nativeVideoControls')}`;
    this.nativeVideoRecoveryDispose = startNativeVideoRecovery({
      isCurrent: () =>
        this.initialized &&
        opId === this.mediaClickCounter &&
        epoch === this.sessionEpoch &&
        location.href === clickUrl &&
        element.isConnected &&
        !gallerySignals.isOpen,
      onEnabled: () =>
        notifySafely(
          getNotificationAdapter(),
          lang.translate('st.videoClickMode'),
          lang.translate('msg.err.loadMedia.nativeVideoEnabled')
        ),
      onError: (error) => {
        mediaErrorReporter.error(error, { code: 'NATIVE_VIDEO_MODE_SAVE_FAILED' });
        notifySafely(
          getNotificationAdapter(),
          lang.translate('msg.err.generic'),
          lang.translate('st.videoClickSaveError')
        );
      },
    });
    return ` ${lang.translate('msg.err.loadMedia.nativeVideoRecovery')}`;
  }

  openGallery(mediaItems: MediaInfo[], startIndex = 0): void {
    if (mediaItems.length === 0) return;

    try {
      const validIndex = clampIndex(startIndex, mediaItems.length);
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
    this.nativeVideoRecoveryDispose?.();
    this.nativeVideoRecoveryDispose = null;
    this.mediaClickAbortController?.abort();
    this.mediaClickAbortController = null;
    this.mediaClickCounter++;
    if (gallerySignals.isOpen) {
      closeGallery();
    }
  }

  async cleanup(): Promise<void> {
    this.nativeVideoRecoveryDispose?.();
    this.nativeVideoRecoveryDispose = null;
    document.documentElement.removeAttribute(GALLERY_READY_ATTRIBUTE);
    if (gallerySignals.isOpen) {
      this.close();
    }

    // Abort all in-flight extraction requests for this session
    this.mediaClickAbortController?.abort();
    this.mediaClickAbortController = null;
    this.sessionAbortController?.abort();
    this.sessionAbortController = null;

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
