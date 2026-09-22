// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 Extension — Background Service Worker
 *
 * Handles operations that require extension permissions unavailable
 * in content scripts:
 * - chrome.downloads.download() for file downloads
 * - chrome.notifications.create() for desktop notifications
 *
 * Architecture notes — FEATURE AWARENESS:
 * The background SW is intentionally features-limited and keeps only the
 * recoverable download relationship needed across worker restarts.
 * It knows only about downloads, notifications, and that small persisted state.
 * All gallery state, media extraction, settings, theme, language/i18n,
 * and DOM access live exclusively in the content script. If a new feature
 * needs SW privileges (clipboard, printing, native messaging), extend the
 * message protocol in extension-message-types.ts.
 *
 * Content scripts send messages here and receive progress/completion updates.
 */

import {
  DOWNLOAD_CANCEL_MAX_ATTEMPTS,
  DOWNLOAD_CANCEL_RETRY_DELAY_MS,
} from '@constants/performance';
import type {
  ChromeDownloadDelta,
  ChromeDownloadOptions,
  ChromeInstalledDetails,
} from '@platform/chrome.d.ts';
import { browserApi } from '@platform/chrome-runtime';
import { MV3StorageAdapter } from '@platform/mv3-storage-adapters';
import { createLogger } from '@shared/logging/logger';
import { isAllowedUrl } from '@shared/utils/url/url-safety';
import { waitForDownloadComplete } from './download-completion';
import { DownloadTrackingStore } from './download-tracking';
import type {
  DownloadBlobUrlRequestMessage,
  DownloadCancelRequestMessage,
  DownloadLifecycleResponse,
  DownloadRequestMessage,
  ExtensionMessageResponse,
  IncomingMessage,
  ShowNotificationMessage,
} from './extension-message-types';
import { isValidIncomingMessage } from './message-validation';

const log = createLogger('SW');
type TrackedDownload = {
  downloadId: number;
  retainUntilTerminal: boolean;
  ownerSettled: boolean;
  terminalObserved: boolean;
};

type DownloadCancellationStatus = 'terminal' | 'pending' | 'unknown';

class DownloadOperationError extends Error {
  readonly lifecycle: DownloadLifecycleResponse;

  constructor(cause: unknown, requestId: string | undefined, terminal: boolean) {
    super(cause instanceof Error ? cause.message : String(cause), {
      cause,
    });
    this.name = cause instanceof Error ? cause.name : 'DownloadError';
    this.lifecycle = { ...(requestId ? { requestId } : {}), terminal };
  }
}

const activeDownloadIds = new Map<string, TrackedDownload>();
const downloadTracking = new DownloadTrackingStore(new MV3StorageAdapter(), (operation, error) => {
  log.warn(`download-tracking-${operation}-failed`, {
    error: error instanceof Error ? error.message : String(error),
  });
});

function readDownloadState(value: ChromeDownloadDelta['state']): string | undefined {
  return typeof value === 'string' ? value : value?.current;
}

function isTerminalDownloadState(state: string | undefined): boolean {
  return state === 'complete' || state === 'interrupted';
}

/**
 * A timed-out request remains addressable until Chrome reports its terminal
 * state. This lets a later user cancellation retry an unconfirmed cancel
 * without retaining every completed request forever.
 */
function handleTrackedDownloadChange(delta: ChromeDownloadDelta): void {
  if (!isTerminalDownloadState(readDownloadState(delta.state))) return;

  for (const [requestId, tracked] of activeDownloadIds) {
    if (tracked.downloadId !== delta.id) continue;
    tracked.terminalObserved = true;
    if (tracked.retainUntilTerminal && tracked.ownerSettled) {
      activeDownloadIds.delete(requestId);
      void downloadTracking.remove(requestId).catch((error: unknown) => {
        log.warn('download-tracking-terminal-cleanup-failed', {
          requestId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }
}

browserApi.downloads.onChanged.addListener(handleTrackedDownloadChange);

async function restoreTrackedDownloadsFromStorage(): Promise<void> {
  const records = await downloadTracking.reload();
  const restored = new Map<string, TrackedDownload>();

  for (const [requestId, record] of records) {
    if (record.downloadId === undefined) continue;

    try {
      const [download] = await browserApi.downloads.search({ id: record.downloadId });
      if (download === undefined) {
        log.warn('download-tracking-missing-download', {
          requestId,
          downloadId: record.downloadId,
        });
        await downloadTracking.remove(requestId);
        continue;
      }
      if (isTerminalDownloadState(download.state)) {
        await downloadTracking.remove(requestId);
        continue;
      }
    } catch (error: unknown) {
      log.warn('download-tracking-restore-check-failed', {
        requestId,
        downloadId: record.downloadId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (record.cancellationRequested) {
      const cancellationStatus = await cancelDownloadWithRetry(record.downloadId, 'request');
      if (cancellationStatus === 'terminal') {
        await downloadTracking.remove(requestId);
        continue;
      }
    }

    restored.set(requestId, {
      downloadId: record.downloadId,
      retainUntilTerminal: true,
      ownerSettled: true,
      terminalObserved: false,
    });
  }

  activeDownloadIds.clear();
  for (const [requestId, tracked] of restored) {
    activeDownloadIds.set(requestId, tracked);
  }
}

let downloadStateRestored = false;
let downloadStateRestorePromise: Promise<void> | undefined;

/**
 * Restore once per worker instance. If storage is temporarily unavailable,
 * leave the state unready so the next operation can retry without replacing a
 * known snapshot with an assumed-empty one.
 */
function restoreTrackedDownloads(): Promise<void> {
  if (downloadStateRestored) return Promise.resolve();
  if (downloadStateRestorePromise !== undefined) return downloadStateRestorePromise;

  const restorePromise = restoreTrackedDownloadsFromStorage().then(() => {
    downloadStateRestored = true;
  });
  downloadStateRestorePromise = restorePromise;
  void restorePromise.then(
    () => {
      if (downloadStateRestorePromise === restorePromise) downloadStateRestorePromise = undefined;
    },
    () => {
      if (downloadStateRestorePromise === restorePromise) downloadStateRestorePromise = undefined;
    }
  );
  return restorePromise;
}

void restoreTrackedDownloads().catch((error: unknown) => {
  log.warn('download-tracking-initial-restore-failed', {
    error: error instanceof Error ? error.message : String(error),
  });
});

// ── Message handler ──────────────────────────────────────────────────────────

/**
 * Safely execute an async message handler, ensuring sendResponse is always
 * called — even if the handler throws synchronously before returning a promise.
 * Without this guard, a synchronous throw would prevent .then() from executing,
 * leaving the message channel open indefinitely and causing the content script
 * to hang.
 *
 * Errors are always returned in the standard ExtensionMessageResponse shape
 * so the content script always receives a structured error, never a thrown
 * exception or unexpected type.
 */
function respondAsync(
  handler: () => Promise<unknown>,
  sendResponse: (response?: unknown) => void
): void {
  try {
    handler().then(
      (result) => sendResponse(result),
      (error: unknown) => sendResponse(toErrorResponse(error))
    );
  } catch (error: unknown) {
    sendResponse(toErrorResponse(error));
  }
}

/**
 * Convert an unknown error to a structured ExtensionMessageResponse,
 * preserving the error message regardless of the error's type.
 */
function toErrorResponse(error: unknown): ExtensionMessageResponse {
  if (error instanceof DownloadOperationError) {
    return {
      success: false,
      error: error.message,
      ...(error.lifecycle.requestId && !error.lifecycle.terminal ? { data: error.lifecycle } : {}),
    };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

browserApi.runtime.onMessage.addListener(
  (message: unknown, _sender: unknown, sendResponse: (response?: unknown) => void) => {
    // Reject messages from untrusted senders
    const sender = _sender as { id?: string };
    if (sender.id !== browserApi.runtime.id) {
      sendResponse(toErrorResponse(new Error('Unauthorized sender')));
      return false;
    }

    // Runtime validation: reject malformed messages gracefully
    if (!isValidIncomingMessage(message)) {
      sendResponse(toErrorResponse(new Error('Unknown message type')));
      return false;
    }

    const msg = message as IncomingMessage;
    switch (msg.type) {
      case 'DOWNLOAD_REQUEST':
        respondAsync(
          () => handleDownloadRequest(msg).then(() => ({ success: true })),
          sendResponse
        );
        return true;

      case 'DOWNLOAD_BLOB_URL_REQUEST':
        respondAsync(
          () => handleDownloadBlobUrlRequest(msg).then(() => ({ success: true })),
          sendResponse
        );
        return true;

      case 'DOWNLOAD_CANCEL_REQUEST':
        respondAsync(
          () => handleDownloadCancelRequest(msg).then(() => ({ success: true })),
          sendResponse
        );
        return true;

      case 'SHOW_NOTIFICATION':
        respondAsync(
          () => handleShowNotification(msg.payload).then(() => ({ success: true })),
          sendResponse
        );
        return true;

      default:
        // This should never be reached given isValidIncomingMessage above,
        // but serves as a defensive fallback.
        sendResponse(toErrorResponse(new Error('Unknown message type')));
        return false;
    }
  }
);

// ── Download handlers ────────────────────────────────────────────────────────

async function handleDownloadRequest(message: DownloadRequestMessage): Promise<void> {
  const { url, filename, headers, requestId } = message.payload;

  if (!isAllowedUrl(url)) {
    throw new Error(`URL not in allowed whitelist: ${url}`);
  }

  const downloadOptions: ChromeDownloadOptions = {
    url,
    filename,
    saveAs: false,
  };

  if (headers) {
    downloadOptions.headers = Object.entries(headers).map(([name, value]) => ({
      name,
      value,
    }));
  }

  await runTrackedDownload(downloadOptions, requestId);
}

async function handleDownloadBlobUrlRequest(message: DownloadBlobUrlRequestMessage): Promise<void> {
  const { objectUrl, filename, requestId } = message.payload;
  // The blob URL was created in the content script context via
  // URL.createObjectURL(). It persists with the page lifetime, so
  // we can safely await the download without worrying about the SW
  // being terminated and invalidating the URL.
  // Wait for download completion so errors propagate to the content script.
  // Unlike SW-created blob URLs which become invalid on SW termination,
  // content-script blob URLs remain valid as long as the page is open.
  await runTrackedDownload(
    {
      url: objectUrl,
      filename,
      saveAs: false,
    },
    requestId
  );
}

async function runTrackedDownload(
  downloadOptions: ChromeDownloadOptions,
  requestId?: string
): Promise<void> {
  if (requestId) {
    await restoreTrackedDownloads();
    await downloadTracking.registerRequest(requestId);
  }

  let downloadId: number | undefined;
  let retainTrackingAfterFailure = false;
  let operationFailure: DownloadOperationError | undefined;
  let cleanupFailure: unknown;
  try {
    downloadId = await browserApi.downloads.download(downloadOptions);
    if (requestId) {
      const tracked: TrackedDownload = {
        downloadId,
        retainUntilTerminal: false,
        ownerSettled: false,
        terminalObserved: false,
      };
      activeDownloadIds.set(requestId, tracked);
      if (await downloadTracking.bindDownload(requestId, downloadId)) {
        const cancellationStatus = await cancelDownloadWithRetry(downloadId, 'request');
        tracked.retainUntilTerminal = cancellationStatus !== 'terminal';
      }
    }
    await waitForDownloadComplete(browserApi.downloads, downloadId);
  } catch (error: unknown) {
    let terminal = true;
    if (downloadId !== undefined) {
      const tracked = requestId ? activeDownloadIds.get(requestId) : undefined;
      if (tracked?.downloadId === downloadId) tracked.retainUntilTerminal = true;
      const reason =
        error instanceof Error && error.name === 'DownloadTimeoutError' ? 'timeout' : 'failure';
      const cancellationStatus = await cancelDownloadWithRetry(downloadId, reason);
      terminal = cancellationStatus === 'terminal';
      retainTrackingAfterFailure = !terminal;
    }
    operationFailure = new DownloadOperationError(error, requestId, terminal);
    throw operationFailure;
  } finally {
    if (requestId) {
      if (downloadId !== undefined) {
        const tracked = activeDownloadIds.get(requestId);
        if (tracked?.downloadId === downloadId) {
          tracked.ownerSettled = true;
          if (!retainTrackingAfterFailure || tracked.terminalObserved) {
            activeDownloadIds.delete(requestId);
            try {
              await downloadTracking.remove(requestId);
            } catch (cleanupError: unknown) {
              cleanupFailure = cleanupError;
              log.warn('download-tracking-cleanup-failed', {
                requestId,
                error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
              });
            }
          }
        }
      } else {
        // A request that never received a Chrome download ID cannot be
        // recovered after this operation ends. Do not retain its cancellation
        // marker for a later request that happens to reuse the ID.
        try {
          await downloadTracking.remove(requestId);
        } catch (cleanupError: unknown) {
          cleanupFailure = cleanupError;
          log.warn('download-tracking-cleanup-failed', {
            requestId,
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          });
        }
      }
    }
  }
  if (cleanupFailure !== undefined && operationFailure === undefined) throw cleanupFailure;
}

async function cancelAndInspectDownload(
  downloadId: number,
  reason: 'failure' | 'request' | 'timeout'
): Promise<DownloadCancellationStatus> {
  let cancelError: unknown;
  try {
    await browserApi.downloads.cancel(downloadId);
  } catch (error: unknown) {
    cancelError = error;
  }

  if (cancelError !== undefined) {
    log.warn(`download.${reason}-cancellation-failed`, {
      downloadId,
      error: cancelError instanceof Error ? cancelError.message : String(cancelError),
    });
  }

  try {
    const [item] = await browserApi.downloads.search({ id: downloadId });
    if (isTerminalDownloadState(item?.state)) return 'terminal';
    if (item?.state === 'in_progress') {
      log.warn(`download.${reason}-cancellation-unconfirmed`, { downloadId });
      return 'pending';
    }
    log.warn(`download.${reason}-cancellation-state-unknown`, { downloadId });
    return 'unknown';
  } catch (error: unknown) {
    log.warn(`download.${reason}-cancellation-state-check-failed`, {
      downloadId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 'unknown';
  }
}

async function cancelDownloadWithRetry(
  downloadId: number,
  reason: 'failure' | 'request' | 'timeout'
): Promise<DownloadCancellationStatus> {
  let status: DownloadCancellationStatus = 'unknown';
  for (let attempt = 0; attempt < DOWNLOAD_CANCEL_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, DOWNLOAD_CANCEL_RETRY_DELAY_MS);
      });
    }
    status = await cancelAndInspectDownload(downloadId, reason);
    if (status === 'terminal') return status;
  }
  return status;
}

async function handleDownloadCancelRequest(message: DownloadCancelRequestMessage): Promise<void> {
  const { requestId } = message.payload;

  let tracked = activeDownloadIds.get(requestId);
  if (tracked === undefined) {
    await restoreTrackedDownloads();
    const persisted = downloadTracking.get(requestId);
    if (persisted?.downloadId === undefined) {
      // The cancel message can arrive before downloads.download() resolves.
      // Persist the intent so the current owner can bind it when an ID arrives.
      await downloadTracking.requestCancellation(requestId);
      return;
    }

    // A previous worker owned this download. Rebuild the local owner from the
    // persisted relationship before attempting the user-requested cancellation.
    tracked = {
      downloadId: persisted.downloadId,
      retainUntilTerminal: true,
      ownerSettled: true,
      terminalObserved: false,
    };
    activeDownloadIds.set(requestId, tracked);
  }

  tracked.retainUntilTerminal = true;
  let trackingError: unknown;
  try {
    await downloadTracking.requestCancellation(requestId);
  } catch (error: unknown) {
    trackingError = error;
    log.warn('download-tracking-cancellation-persist-failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  const cancellationStatus = await cancelDownloadWithRetry(tracked.downloadId, 'request');
  if ((cancellationStatus === 'terminal' || tracked.terminalObserved) && tracked.ownerSettled) {
    if (activeDownloadIds.get(requestId) === tracked) {
      activeDownloadIds.delete(requestId);
      await downloadTracking.remove(requestId);
    }
  }
  if (trackingError !== undefined) {
    throw new DownloadOperationError(
      trackingError,
      requestId,
      cancellationStatus === 'terminal' || tracked.terminalObserved
    );
  }
}

// ── Extension lifecycle ───────────────────────────────────────────────────────

/**
 * Handle extension install/update events.
 * Always logs in production (warn level) so operational issues are visible;
 * dev mode uses finer detail via console.log.
 *
 * The download tracking record is versioned and storage-backed, so no
 * migration is needed for the current shape. Future shape changes belong here.
 */
browserApi.runtime.onInstalled.addListener((details: ChromeInstalledDetails) => {
  if (__DEV__) {
    log.info('sw.extension-event', {
      reason: details.reason,
      previousVersion: details.previousVersion ?? null,
    });
  } else {
    log.warn('sw.extension-event', {
      reason: details.reason,
      previousVersion: details.previousVersion ?? null,
    });
  }
});

/**
 * Service worker startup handler.
 * Logs the wake-up and refreshes recoverable download ownership from storage.
 */
browserApi.runtime.onStartup?.addListener(() => {
  log.warn('sw.started');
  return restoreTrackedDownloads();
});

/**
 * Service worker suspend handler.
 * Logs SW shutdown for debugging extension lifecycle issues.
 *
 * Download tracking is persisted at each relationship/intent transition, so
 * shutdown does not need to perform an asynchronous snapshot here.
 */
browserApi.runtime.onSuspend?.addListener(() => {
  log.warn('sw.suspending');
});

// ── Notification handler ─────────────────────────────────────────────────────

async function handleShowNotification(payload: ShowNotificationMessage['payload']): Promise<void> {
  const { id, title, message, imageUrl } = payload;
  await browserApi.notifications.create(id, {
    type: 'basic',
    title,
    message,
    iconUrl: imageUrl ?? 'icons/icon-128x128.png',
  });
}
