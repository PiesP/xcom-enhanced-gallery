// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 Extension — Background Service Worker
 *
 * Handles operations that require extension permissions unavailable
 * in content scripts:
 * - chrome.downloads.download() for file downloads
 * - chrome.notifications.create() for desktop notifications
 * - Cross-origin fetch proxying
 *
 * Content scripts send messages here and receive progress/completion updates.
 */

import { MEDIA } from '@constants/media';
import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type {
  ChromeDownloadDelta,
  ChromeDownloadOptions,
  ChromeInstalledDetails,
} from '@platform/chrome.d.ts';
import { browserApi } from '@platform/chrome-runtime';
import { TWITTER_HOSTS } from '@shared/utils/url/host';

// ── Allowed hosts whitelist (SSRF prevention) ────────────────────────────────
// Computed from canonical constants to prevent policy drift — background.ts
// should never independently maintain a list of allowed hosts.

const ALLOWED_HOSTS: Set<string> = new Set([...TWITTER_HOSTS, ...MEDIA.DOMAINS]);

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return false;
    }
    // S4: Restrict x.com/twitter.com to GraphQL API paths only
    if (parsed.hostname === 'x.com' || parsed.hostname === 'twitter.com') {
      return parsed.pathname.startsWith('/i/api/');
    }
    return true;
  } catch {
    return false;
  }
}

// ── Message types ────────────────────────────────────────────────────────────

interface DownloadRequestMessage {
  type: 'DOWNLOAD_REQUEST';
  payload: {
    url: string;
    filename: string;
    headers?: Record<string, string>;
  };
}

interface DownloadBlobUrlRequestMessage {
  type: 'DOWNLOAD_BLOB_URL_REQUEST';
  payload: {
    objectUrl: string;
    filename: string;
  };
}

interface FetchRequestMessage {
  type: 'FETCH_REQUEST';
  payload: {
    url: string;
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    };
  };
}

interface ShowNotificationMessage {
  type: 'SHOW_NOTIFICATION';
  payload: {
    id: string;
    title: string;
    message: string;
    imageUrl?: string;
  };
}

type IncomingMessage =
  | DownloadRequestMessage
  | DownloadBlobUrlRequestMessage
  | FetchRequestMessage
  | ShowNotificationMessage;

// ── Message handler ──────────────────────────────────────────────────────────

browserApi.runtime.onMessage.addListener(
  (message: unknown, _sender: unknown, sendResponse: (response?: unknown) => void) => {
    // Reject messages from untrusted senders
    const sender = _sender as { id?: string };
    if (sender.id !== browserApi.runtime.id) {
      sendResponse({ success: false, error: 'Unauthorized sender' });
      return false;
    }

    const msg = message as IncomingMessage;
    switch (msg.type) {
      case 'DOWNLOAD_REQUEST':
        handleDownloadRequest(msg).then(
          () => sendResponse({ success: true }),
          (error: Error) => sendResponse({ success: false, error: error.message })
        );
        return true;

      case 'DOWNLOAD_BLOB_URL_REQUEST':
        handleDownloadBlobUrlRequest(msg).then(
          () => sendResponse({ success: true }),
          (error: Error) => sendResponse({ success: false, error: error.message })
        );
        return true;

      case 'SHOW_NOTIFICATION':
        handleShowNotification(msg.payload);
        sendResponse({ success: true });
        return false;

      case 'FETCH_REQUEST':
        handleFetchRequest(msg).then(
          (result) => sendResponse({ success: true, data: result }),
          (error: Error) => sendResponse({ success: false, error: error.message })
        );
        return true;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
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
  const downloadId = await browserApi.downloads.download({
    url: objectUrl,
    filename,
    saveAs: false,
  });
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

browserApi.runtime.onInstalled.addListener((details: ChromeInstalledDetails) => {
  if (__DEV__) {
    console.log(
      `[XEG] Extension ${details.reason}`,
      details.previousVersion ? `(was ${details.previousVersion})` : ''
    );
  }
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

// ── Cross-origin fetch proxy ─────────────────────────────────────────────────

async function handleFetchRequest(message: FetchRequestMessage): Promise<unknown> {
  const { url, options } = message.payload;

  if (!isAllowedUrl(url)) {
    throw new Error(`URL not in allowed whitelist: ${url}`);
  }

  // Security: only allow safe read-only methods to prevent SSRF abuse
  const method = options?.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    throw new Error(`FETCH_REQUEST only supports GET/HEAD, got: ${method}`);
  }

  const fetchOptions: RequestInit = { method };

  if (options?.headers) {
    fetchOptions.headers = options.headers;
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json().catch(() => response.text());
}
