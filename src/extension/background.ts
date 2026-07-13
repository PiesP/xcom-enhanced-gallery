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
 * The background SW is intentionally STATELESS and features-limited.
 * It knows only about downloads and notifications.
 * All gallery state, media extraction, settings, theme, language/i18n,
 * and DOM access live exclusively in the content script. If a new feature
 * needs SW privileges (clipboard, printing, native messaging), extend the
 * message protocol in extension-message-types.ts.
 *
 * Content scripts send messages here and receive progress/completion updates.
 */

import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type {
  ChromeDownloadDelta,
  ChromeDownloadOptions,
  ChromeInstalledDetails,
} from '@platform/chrome.d.ts';
import { browserApi } from '@platform/chrome-runtime';
import { createLogger } from '@shared/logging/logger';
import { isAllowedUrl } from '@shared/utils/url/url-safety';
import type {
  DownloadBlobUrlRequestMessage,
  DownloadRequestMessage,
  ExtensionMessageResponse,
  IncomingMessage,
  ShowNotificationMessage,
} from './extension-message-types';

const log = createLogger('SW');

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
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Runtime type guard for incoming extension messages.
 * Validates that the message has a known type field before dispatching.
 * Without this, a malformed payload would surface as an opaque runtime error
 * (e.g., "Cannot read properties of undefined") rather than a graceful
 * error response via sendResponse.
 */
function isValidIncomingMessage(message: unknown): message is IncomingMessage {
  if (!message || typeof message !== 'object') return false;
  const msg = message as Record<string, unknown>;
  if (typeof msg.type !== 'string') return false;
  const VALID_TYPES = new Set([
    'DOWNLOAD_REQUEST',
    'DOWNLOAD_BLOB_URL_REQUEST',
    'SHOW_NOTIFICATION',
  ]);
  return VALID_TYPES.has(msg.type);
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

      case 'SHOW_NOTIFICATION':
        handleShowNotification(msg.payload);
        sendResponse({ success: true });
        return false;

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
  const { url, filename, headers } = message.payload;

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

  const downloadId = await browserApi.downloads.download(downloadOptions);
  await waitForDownloadComplete(downloadId);
}

async function handleDownloadBlobUrlRequest(message: DownloadBlobUrlRequestMessage): Promise<void> {
  const { objectUrl, filename } = message.payload;
  // The blob URL was created in the content script context via
  // URL.createObjectURL(). It persists with the page lifetime, so
  // we can safely await the download without worrying about the SW
  // being terminated and invalidating the URL.
  const downloadId = await browserApi.downloads.download({
    url: objectUrl,
    filename,
    saveAs: false,
  });
  // Wait for download completion so errors propagate to the content script.
  // Unlike SW-created blob URLs which become invalid on SW termination,
  // content-script blob URLs remain valid as long as the page is open.
  await waitForDownloadComplete(downloadId);
}

/**
 * Wait for a Chrome download to complete or be interrupted.
 */
function waitForDownloadComplete(downloadId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (): void => {
      browserApi.downloads.onChanged.removeListener(listener);
      if (timerId) clearTimeout(timerId);
    };

    const listener = (delta: ChromeDownloadDelta) => {
      if (delta.id !== downloadId) return;

      const stateCurrent = typeof delta.state === 'string' ? delta.state : delta.state?.current;
      if (stateCurrent === 'complete') {
        cleanup();
        settled = true;
        resolve();
      } else if (stateCurrent === 'interrupted') {
        cleanup();
        settled = true;
        const errorCurrent = typeof delta.error === 'string' ? delta.error : delta.error?.current;
        reject(new Error(`Download interrupted: ${errorCurrent ?? 'unknown'}`));
      }
    };
    browserApi.downloads.onChanged.addListener(listener);

    // 5-minute timeout: prevent permanent listener leak
    timerId = setTimeout(() => {
      if (!settled) {
        browserApi.downloads.onChanged.removeListener(listener);
        timerId = null;
        settled = true;
        reject(new Error(`Download timed out after 5 minutes (id: ${downloadId})`));
      }
    }, DOWNLOAD_TIMEOUT_MS);
  });
}

// ── Extension lifecycle ───────────────────────────────────────────────────────

/**
 * Handle extension install/update events.
 * Always logs in production (warn level) so operational issues are visible;
 * dev mode uses finer detail via console.log.
 *
 * This is intentionally minimal — the SW is stateless, so no migration or
 * state recovery is needed on update. If stateful features are added later,
 * migrations belong here.
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
 * Logs SW wake-up for debugging extension lifecycle issues.
 * MV3 service workers can be terminated after ~30s of inactivity,
 * and this gives visibility into restart patterns.
 *
 * Currently a no-op in terms of state — the SW is stateless.
 * If state persistence is added later (e.g., download queue recovery),
 * the initialization logic belongs here.
 */
browserApi.runtime.onStartup?.addListener(() => {
  log.warn('sw.started');
});

/**
 * Service worker suspend handler.
 * Logs SW shutdown for debugging extension lifecycle issues.
 *
 * Currently a no-op — the SW is stateless so there's nothing to persist.
 * If stateful features are added, this is where in-flight state should
 * be snapshot before termination.
 */
browserApi.runtime.onSuspend?.addListener(() => {
  log.warn('sw.suspending');
});

// ── Notification handler ─────────────────────────────────────────────────────

function handleShowNotification(payload: ShowNotificationMessage['payload']): void {
  const { id, title, message, imageUrl } = payload;
  browserApi.notifications.create(id, {
    type: 'basic',
    title,
    message,
    iconUrl: imageUrl ?? 'icons/icon-128x128.png',
  });
}
