// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery download hook - manages single and batch download.
 */

import { getNotificationAdapter, notifySafely } from '@platform/index';
import { dismissBulkDownloadOutcome } from '@features/gallery/hooks/dismiss-bulk-download-outcome';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';
import { logger } from '@shared/logging/logger';
import {
  getDownloadOrchestrator,
  type FailedEntryRecovery,
} from '@shared/services/download/download-orchestrator';
import type { BulkDownloadResult } from '@shared/services/download/types';
import { getLanguageService } from '@shared/services/language-service';
import { getMediaService } from '@shared/services/media-service';
import {
  gallerySignals,
  getDisplayedMediaIndex,
  setError,
} from '@shared/state/signals/gallery.signals';
import {
  downloadState,
  setBulkDownloadOutcome,
  setDownloadStatus,
} from '@shared/state/signals/gallery-download-signals';
import type { MediaInfo } from '@shared/types/media.types';
import { getMediaDownloadUrl } from '@shared/utils/media/media-source';

interface RecoveryJob {
  readonly entries: readonly FailedEntryRecovery[];
  readonly originalFilename: string;
  readonly sessionRevision: number;
  readonly attempt: number;
}

/** Keep only identity and save metadata; a retry borrows bytes from normal owners. */
function snapshotMedia(media: MediaInfo): MediaInfo {
  return {
    id: media.id,
    type: media.type,
    url: media.url,
    originalUrl: media.originalUrl,
    ...(media.downloadSource ? { downloadSource: { ...media.downloadSource } } : {}),
    filename: media.filename,
    fileSize: media.fileSize,
    tweetUsername: media.tweetUsername,
    tweetId: media.tweetId,
    quotedUsername: media.quotedUsername,
    quotedTweetId: media.quotedTweetId,
    sourceLocation: media.sourceLocation,
  };
}

function nextRecoveryJob(
  result: BulkDownloadResult,
  attempted: readonly {
    readonly media: MediaInfo;
    readonly index: number;
    readonly filename?: string;
  }[],
  originalFilename: string,
  sessionRevision: number,
  attempt: number
): RecoveryJob | null {
  const knownPreSaveFailure =
    !result.success &&
    result.status === 'error' &&
    result.saveAttempted === false &&
    result.filesSuccessful === 0 &&
    result.filesProcessed === attempted.length &&
    result.failedEntries?.length === attempted.length &&
    attempted.every((entry) => !!entry.filename);
  if (
    (!(result.success && result.status === 'partial') && !knownPreSaveFailure) ||
    !result.failedEntries?.length
  ) {
    return null;
  }
  const entries: FailedEntryRecovery[] = [];
  const seen = new Set<number>();
  for (const failure of result.failedEntries) {
    const source = attempted[failure.index];
    if (
      !Number.isSafeInteger(failure.index) ||
      seen.has(failure.index) ||
      !source ||
      !source.media.id ||
      source.media.downloadSource?.quality === 'unverified-original' ||
      getMediaDownloadUrl(source.media) !== failure.url ||
      !failure.filename ||
      (source.filename !== undefined && source.filename !== failure.filename)
    ) {
      return null;
    }
    seen.add(failure.index);
    entries.push({
      index: source.index,
      media: source.media,
      url: failure.url,
      filename: failure.filename,
    });
  }
  entries.sort((left, right) => left.index - right.index);
  return entries.length ? { entries, originalFilename, sessionRevision, attempt } : null;
}

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
  let operationGeneration = 0;
  let recoveryJob: RecoveryJob | null = null;
  let activeRecoveryController: AbortController | null = null;

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
    if (downloadState.status === 'working') {
      return;
    }
    // Capture the current abort controller before any async gap.
    // If cancelDownloads() replaces the controller while we're awaiting
    // a cached blob, the captured signal ensures we don't restart with
    // the new session's non-aborted signal.
    const controller = abortController;
    const signal = controller.signal;
    const bulkTotal = type === 'all' ? gallerySignals.mediaItems.length : 0;
    const sessionRevision = gallerySignals.sessionRevision;
    const operationId = ++operationGeneration;
    const isCurrentOperation = (): boolean =>
      operationId === operationGeneration &&
      !signal.aborted &&
      gallerySignals.sessionRevision === sessionRevision;
    const publishStatus = (status: Parameters<typeof setDownloadStatus>[0]): void => {
      if (!isCurrentOperation()) {
        return;
      }
      setDownloadStatus(status);
    };

    if (signal.aborted) {
      return;
    }
    recoveryJob = null;

    // A7: Clear stale error from a previous download before starting a new one.
    setError(null);
    if (type === 'current') {
      setBulkDownloadOutcome(null);
    }
    setDownloadStatus('working');

    const notifyError = (title: string, body: string): void => {
      notifySafely(notify, title, body);
    };

    try {
      const languageService = getLanguageService();
      const mediaItems = gallerySignals.mediaItems;
      const mediaService = getMediaService();
      const downloadService = getDownloadOrchestrator();

      if (type === 'current') {
        const displayedIndex = getDisplayedMediaIndex();
        const currentMedia = displayedIndex === null ? undefined : mediaItems[displayedIndex];
        if (currentMedia) {
          // Single downloads are already demand-driven through the platform
          // adapter. Avoid a duplicate Blob fetch that would delay GM_download.
          const result = await downloadService.downloadSingle(currentMedia, { signal });
          if (!isCurrentOperation()) {
            return;
          }
          if (result.success) {
            publishStatus('handedOff');
          } else if (result.error === USER_CANCELLED_MESSAGE) {
            publishStatus('idle');
          } else {
            publishStatus('error');
            const error = result.error || 'Unknown error';
            const title = languageService.translate('msg.dl.one.err.t');
            const body =
              result.code === 'RESOURCE_LIMIT'
                ? languageService.translate('msg.dl.resourceLimit')
                : result.code === 'SOURCE_UNAVAILABLE'
                  ? languageService.translate('msg.dl.sourceUnavailable')
                  : languageService.translate('msg.dl.one.err.b', { error });
            setError(body);
            notifyError(title, body);
          }
        } else {
          publishStatus('error');
          notifyError(
            languageService.translate('msg.dl.one.err.t'),
            languageService.translate('msg.dl.noMedia')
          );
        }
      } else {
        const snapshot = mediaItems.map(snapshotMedia);
        const result = await downloadService.downloadBulk([...mediaItems], {
          mediaBlobProvider: Object.assign(
            (item: MediaInfo, requestSignal?: AbortSignal, maxResponseBytes?: number) =>
              mediaService.getDownloadMedia(item, requestSignal, maxResponseBytes),
            { supports: (item: MediaInfo) => item.type === 'image' }
          ),
          signal,
        });
        if (!isCurrentOperation()) {
          return;
        }

        if (result.code === 'CANCELLED') {
          publishStatus('idle');
          return;
        }
        recoveryJob = result.filename
          ? nextRecoveryJob(
              result,
              snapshot.map((media, index) => ({ media, index })),
              result.filename,
              sessionRevision,
              1
            )
          : null;
        const handedOff = result.success;
        const included = handedOff ? result.filesSuccessful : 0;
        setBulkDownloadOutcome({
          total: bulkTotal,
          included,
          omitted: Math.max(0, bulkTotal - included),
          handedOff,
          reason:
            result.code === 'RESOURCE_LIMIT'
              ? 'resourceLimit'
              : result.code === 'SOURCE_UNAVAILABLE'
                ? 'sourceUnavailable'
                : !handedOff && result.filesSuccessful > 0
                  ? 'zipSaveFailed'
                  : result.sourceFetchStatuses?.length
                    ? 'sourceFetchFailed'
                    : result.status === 'partial' || !handedOff
                      ? 'other'
                      : 'none',
          sourceUnavailable:
            result.sourceUnavailable === true || result.code === 'SOURCE_UNAVAILABLE',
          ...(result.sourceFetchStatuses?.length
            ? { sourceFetchStatuses: result.sourceFetchStatuses }
            : {}),
          ...(recoveryJob ? { recoverableCount: recoveryJob.entries.length } : {}),
        });
        if (result.code === 'RESOURCE_LIMIT' && result.success && result.status === 'partial') {
          publishStatus('handedOff');
          const failures = Math.max(0, result.filesProcessed - result.filesSuccessful);
          const title = languageService.translate('msg.dl.part.t');
          const body =
            languageService.translate('msg.dl.part.resourceLimit', {
              count: result.filesSuccessful,
              failed: failures,
            }) +
            (result.sourceUnavailable
              ? ` ${languageService.translate('msg.dl.sourceUnavailable')}`
              : '');
          setError(body, 'bulkDownload');
          notifyError(title, body);
          return;
        }
        if (result.code === 'RESOURCE_LIMIT') {
          publishStatus('error');
          const title = languageService.translate('msg.dl.one.err.t');
          const body =
            languageService.translate('msg.dl.resourceLimit') +
            (result.sourceUnavailable
              ? ` ${languageService.translate('msg.dl.sourceUnavailable')}`
              : '');
          setError(body, 'bulkDownload');
          notifyError(title, body);
          return;
        }
        if (result.code === 'SOURCE_UNAVAILABLE') {
          publishStatus(result.success ? 'handedOff' : 'error');
          const title = languageService.translate(
            result.success ? 'msg.dl.part.t' : 'msg.dl.one.err.t'
          );
          const body =
            (result.success
              ? `${languageService.translate('msg.dl.part.b', { count: result.filesProcessed - result.filesSuccessful })} `
              : '') + languageService.translate('msg.dl.sourceUnavailable');
          setError(body, 'bulkDownload');
          notifyError(title, body);
          return;
        }

        if (!result.success) {
          publishStatus('error');
          if (result.filesSuccessful === 0) {
            const title = languageService.translate('msg.dl.allFail.t');
            const body = languageService.translate('msg.dl.allFail.b');
            setError(body, 'bulkDownload');
            notifyError(title, body);
          } else {
            const error = result.error || languageService.translate('msg.dl.zipFail');
            const title = languageService.translate('msg.dl.one.err.t');
            const body = languageService.translate('msg.dl.one.err.b', { error });
            setError(body, 'bulkDownload');
            notifyError(title, body);
          }
          return;
        }

        if (result.status === 'partial') {
          const failures = Math.max(0, result.filesProcessed - result.filesSuccessful);
          if (failures > 0) {
            const title = languageService.translate('msg.dl.part.t');
            const body = languageService.translate('msg.dl.part.b', { count: failures });
            setError(body, 'bulkDownload');
            notifyError(title, body);
          }
        }
        publishStatus('handedOff');
      }
    } catch (error) {
      if (!isCurrentOperation()) {
        return;
      }
      publishStatus('error');
      if (type === 'all') {
        setBulkDownloadOutcome({
          total: bulkTotal,
          included: 0,
          omitted: bulkTotal,
          handedOff: false,
          reason: 'other',
          sourceUnavailable: false,
        });
      }
      logger.error('Download failed', error);
      const { title, body } = getDownloadErrorNotification(error);
      setError(body, type === 'all' ? 'bulkDownload' : null);
      notifyError(title, body);
    }
  };

  const recoverFailedEntries = async (): Promise<void> => {
    const job = recoveryJob;
    if (
      !job ||
      downloadState.status === 'working' ||
      !downloadState.bulkOutcome ||
      gallerySignals.sessionRevision !== job.sessionRevision
    ) {
      return;
    }
    const controller = new AbortController();
    activeRecoveryController = controller;
    const signal = controller.signal;
    const operationId = ++operationGeneration;
    recoveryJob = null;
    const previousOutcome = downloadState.bulkOutcome;
    if (previousOutcome) {
      setBulkDownloadOutcome({ ...previousOutcome, recoverableCount: 0 });
    }
    setError(null);
    setDownloadStatus('working');
    const isCurrent = (): boolean =>
      operationId === operationGeneration &&
      !signal.aborted &&
      gallerySignals.sessionRevision === job.sessionRevision;

    try {
      let result: BulkDownloadResult;
      try {
        result = await getDownloadOrchestrator().downloadFailedEntries(
          job.entries,
          job.originalFilename,
          job.attempt,
          {
            mediaBlobProvider: Object.assign(
              (item: MediaInfo, requestSignal?: AbortSignal, maxResponseBytes?: number) =>
                getMediaService().getDownloadMedia(item, requestSignal, maxResponseBytes),
              { supports: (item: MediaInfo) => item.type === 'image' }
            ),
            signal,
          }
        );
      } catch (error) {
        if (isCurrent()) {
          setDownloadStatus('error');
          setError(normalizeErrorMessage(error), 'bulkDownload');
        }
        return;
      }
      if (!isCurrent()) {
        return;
      }
      if (result.code === 'CANCELLED') {
        setDownloadStatus('idle');
        return;
      }
      recoveryJob = nextRecoveryJob(
        result,
        job.entries,
        job.originalFilename,
        job.sessionRevision,
        job.attempt + 1
      );
      const handedOff = result.success;
      const included = handedOff ? result.filesSuccessful : 0;
      setBulkDownloadOutcome({
        total: job.entries.length,
        included,
        omitted: job.entries.length - included,
        handedOff,
        reason:
          result.code === 'RESOURCE_LIMIT'
            ? 'resourceLimit'
            : result.code === 'SOURCE_UNAVAILABLE'
              ? 'sourceUnavailable'
              : !handedOff && result.filesSuccessful > 0
                ? 'zipSaveFailed'
                : result.sourceFetchStatuses?.length
                  ? 'sourceFetchFailed'
                  : result.status === 'partial' || !handedOff
                    ? 'other'
                    : 'none',
        sourceUnavailable: result.sourceUnavailable === true,
        ...(result.sourceFetchStatuses?.length
          ? { sourceFetchStatuses: result.sourceFetchStatuses }
          : {}),
        ...(recoveryJob ? { recoverableCount: recoveryJob.entries.length } : {}),
        supplementary: true,
      });
      setDownloadStatus(handedOff ? 'handedOff' : 'error');
    } finally {
      if (activeRecoveryController === controller) {
        activeRecoveryController = null;
      }
    }
  };

  const dismissOutcome = (): void => {
    const activeRecovery = activeRecoveryController;
    if (activeRecovery) {
      operationGeneration += 1;
      activeRecovery.abort();
      activeRecoveryController = null;
    }
    recoveryJob = null;
    dismissBulkDownloadOutcome();
    if (activeRecovery) {
      setDownloadStatus('idle');
    }
  };

  const cancelDownloads = (): void => {
    operationGeneration += 1;
    recoveryJob = null;
    activeRecoveryController?.abort();
    activeRecoveryController = null;
    abortController.abort();
    resetAbortController();
    setDownloadStatus('idle');
    setBulkDownloadOutcome(null);
  };

  return { handleDownload, recoverFailedEntries, dismissOutcome, cancelDownloads };
}
