// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery download hook - manages single and batch download.
 */

import { getNotificationAdapter } from '@platform/index';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { getDownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { getLanguageService } from '@shared/services/language-service';
import { getMediaService } from '@shared/services/media-service';
import { gallerySignals, setError } from '@shared/state/signals/gallery.signals';
import { setDownloading } from '@shared/state/signals/gallery-download-signals';

/**
 * Hook providing gallery download functionality.
 * Handles single and bulk downloads with progress tracking, error handling,
 * and GM_notification integration for userscript environments.
 *
 * @returns Download handler functions and reactive state
 */
export function createDownloadHandler() {
  const notify = getNotificationAdapter();
  let abortController = new AbortController();

  const resetAbortController = (): void => {
    abortController = new AbortController();
  };

  const getDownloadErrorNotification = (error: unknown): { body: string; title: string } => {
    const message = normalizeErrorMessage(error);

    try {
      const languageService = getLanguageService();
      return {
        title: languageService.translate('msg.dl.one.err.t'),
        body: languageService.translate('msg.dl.one.err.b', { error: message }),
      };
    } catch {
      return {
        title: 'Download failed',
        body: message,
      };
    }
  };

  const handleDownload = async (type: 'current' | 'all'): Promise<void> => {
    // Capture the current abort controller before any async gap.
    // If cancelDownloads() replaces the controller while we're awaiting
    // a cached blob, the captured signal ensures we don't restart with
    // the new session's non-aborted signal.
    const controller = abortController;
    const signal = controller.signal;

    if (signal.aborted) {
      setDownloading(false);
      return;
    }

    // A7: Clear stale error from a previous download before starting a new one.
    setError(null);
    setDownloading(true);

    const notifyError = (title: string, body: string): void => {
      notify.notify(title, body);
    };

    try {
      const languageService = getLanguageService();
      const mediaItems = gallerySignals.mediaItems;
      const mediaService = getMediaService();
      const downloadService = getDownloadOrchestrator();

      if (type === 'current') {
        const currentMedia = mediaItems[gallerySignals.currentIndex];
        if (currentMedia) {
          let blob: Blob | undefined;
          try {
            const pending = mediaService.getCachedMedia(currentMedia.url);
            if (pending) {
              blob = await pending;
            }
          } catch {
            // Ignore prefetch failures; fallback to network download.
          }

          const result = await downloadService.downloadSingle(currentMedia, {
            ...(blob ? { blob } : {}),
            signal,
          });
          if (!result.success) {
            const error = result.error || 'Unknown error';
            const title = languageService.translate('msg.dl.one.err.t');
            const body = languageService.translate('msg.dl.one.err.b', { error });
            setError(body);
            notifyError(title, body);
          }
        } else {
          notifyError(
            languageService.translate('msg.dl.one.err.t'),
            languageService.translate('msg.dl.noMedia')
          );
        }
      } else {
        const prefetchedBlobs = new Map<string, Blob | Promise<Blob>>();
        for (const item of mediaItems) {
          if (!item) continue;
          const pending = mediaService.getCachedMedia(item.url);
          if (!pending) continue;
          prefetchedBlobs.set(item.url, pending);
        }

        const result = await downloadService.downloadBulk([...mediaItems], {
          ...(prefetchedBlobs.size > 0 ? { prefetchedBlobs } : {}),
          signal,
        });

        if (!result.success) {
          if (result.filesSuccessful === 0) {
            const title = languageService.translate('msg.dl.allFail.t');
            const body = languageService.translate('msg.dl.allFail.b');
            setError(body);
            notifyError(title, body);
          } else {
            const error = result.error || languageService.translate('msg.dl.zipFail');
            const title = languageService.translate('msg.dl.one.err.t');
            const body = languageService.translate('msg.dl.one.err.b', { error });
            setError(body);
            notifyError(title, body);
          }
          return;
        }

        if (result.status === 'partial') {
          const failures = Math.max(0, result.filesProcessed - result.filesSuccessful);
          if (failures > 0) {
            const title = languageService.translate('msg.dl.part.t');
            const body = languageService.translate('msg.dl.part.b', { count: failures });
            setError(body);
            notifyError(title, body);
          }
        }
      }
    } catch (error) {
      logger.error('Download failed', error);
      const { title, body } = getDownloadErrorNotification(error);
      setError(body);
      notifyError(title, body);
    } finally {
      setDownloading(false);
    }
  };

  const cancelDownloads = (): void => {
    abortController.abort();
    resetAbortController();
  };

  return { handleDownload, cancelDownloads };
}
