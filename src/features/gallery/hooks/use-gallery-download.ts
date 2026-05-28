// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery download hook - manages single and batch download.
 */

import {
  getDownloadOrchestrator,
  getLanguageService,
  getMediaService,
} from '@shared/container/container';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserscript } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging/logger';
import { gallerySignals, setDownloading, setError } from '@shared/state/signals/gallery.signals';

/**
 * Hook providing gallery download functionality.
 * Handles single and bulk downloads with progress tracking, error handling,
 * and GM_notification integration for userscript environments.
 *
 * @returns Download handler functions and reactive state
 */
export function createDownloadHandler() {
  const userscript = getUserscript();

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
    setDownloading(true);

    const notifyError = (title: string, body: string): void => {
      userscript.notification({ title, text: body });
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
            'No media item selected. Please re-open the gallery and try again.'
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
        });

        if (!result.success) {
          if (result.filesSuccessful === 0) {
            const title = languageService.translate('msg.dl.allFail.t');
            const body = languageService.translate('msg.dl.allFail.b');
            setError(body);
            notifyError(title, body);
          } else {
            const error = result.error || 'Failed to save ZIP file';
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

  return { handleDownload };
}
