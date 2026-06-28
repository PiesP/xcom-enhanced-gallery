// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 Extension — Background Service Worker
 *
 * Handles operations that require extension permissions unavailable
 * in content scripts:
 * - chrome.downloads.download() for file downloads
 * - Cross-origin fetch proxying
 *
 * Content scripts send messages here and receive progress/completion updates.
 */

import type { ChromeDownloadDelta, ChromeDownloadOptions } from '@platform/chrome.d.ts';

// ── Allowed hosts whitelist (SSRF prevention) ────────────────────────────────

const ALLOWED_HOSTS = ['x.com', 'twitter.com', 'pbs.twimg.com', 'video.twimg.com'] as const;

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname as (typeof ALLOWED_HOSTS)[number])) {
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

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender: unknown, sendResponse: (response?: unknown) => void) => {
    // Reject messages from untrusted senders
    const sender = _sender as { id?: string };
    if (sender.id !== chrome.runtime.id) {
      sendResponse({ success: false, error: 'Unauthorized sender' });
      return false;
    }

    const msg = message as IncomingMessage;
    console.log('[XEG:SW] onMessage:', msg.type);
    switch (msg.type) {
      case 'DOWNLOAD_REQUEST':
        handleDownloadRequest(msg)
          .then(() => {
            console.log('[XEG:SW] DOWNLOAD_REQUEST done');
            sendResponse({ success: true });
          })
          .catch((error: Error) => {
            console.error('[XEG:SW] DOWNLOAD_REQUEST error:', error.message);
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case 'DOWNLOAD_BLOB_URL_REQUEST':
        handleDownloadBlobUrlRequest(msg)
          .then(() => {
            console.log('[XEG:SW] DOWNLOAD_BLOB_URL_REQUEST done');
            sendResponse({ success: true });
          })
          .catch((error: Error) => {
            console.error('[XEG:SW] DOWNLOAD_BLOB_URL_REQUEST error:', error.message);
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case 'SHOW_NOTIFICATION':
        handleShowNotification(msg.payload);
        console.log('[XEG:SW] SHOW_NOTIFICATION done');
        sendResponse({ success: true });
        return false;

      case 'FETCH_REQUEST':
        handleFetchRequest(msg)
          .then((result) => {
            console.log('[XEG:SW] FETCH_REQUEST done');
            sendResponse({ success: true, data: result });
          })
          .catch((error: Error) => {
            console.error('[XEG:SW] FETCH_REQUEST error:', error.message);
            sendResponse({ success: false, error: error.message });
          });
        return true;

      default:
        console.warn(
          '[XEG:SW] Unknown message type:',
          (message as unknown as { type: string }).type
        );
        sendResponse({ success: false, error: 'Unknown message type' });
        return false;
    }
  }
);

// ── Download handlers ────────────────────────────────────────────────────────

async function handleDownloadRequest(message: DownloadRequestMessage): Promise<void> {
  const { url, filename, headers } = message.payload;
  console.log('[XEG:SW] handleDownloadRequest:', {
    url: url.slice(0, 100),
    filename,
    hasHeaders: !!headers,
  });

  if (!isAllowedUrl(url)) {
    console.error('[XEG:SW] URL blocked by whitelist:', url);
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

  console.log('[XEG:SW] calling chrome.downloads.download...');
  const downloadId = await chrome.downloads.download(downloadOptions);
  console.log('[XEG:SW] download started, id:', downloadId);

  return new Promise<void>((resolve, reject) => {
    const listener = (delta: ChromeDownloadDelta) => {
      if (delta.id !== downloadId) return;

      const stateCurrent = typeof delta.state === 'string' ? delta.state : delta.state?.current;
      const errorCurrent = typeof delta.error === 'string' ? delta.error : delta.error?.current;
      console.log('[XEG:SW] download delta:', {
        id: downloadId,
        state: stateCurrent,
        error: errorCurrent,
      });

      if (stateCurrent === 'complete') {
        chrome.downloads.onChanged.removeListener(listener);
        resolve();
      } else if (stateCurrent === 'interrupted') {
        chrome.downloads.onChanged.removeListener(listener);
        reject(new Error(`Download interrupted: ${errorCurrent ?? 'unknown'}`));
      }
    };
    chrome.downloads.onChanged.addListener(listener);
  });
}

// ── Download blob URL handler ────────────────────────────────────────────────

async function handleDownloadBlobUrlRequest(message: DownloadBlobUrlRequestMessage): Promise<void> {
  const { objectUrl, filename } = message.payload;
  console.log('[XEG:SW] handleDownloadBlobUrlRequest:', { objectUrl, filename });

  try {
    const downloadId = await chrome.downloads.download({
      url: objectUrl,
      filename,
      saveAs: false,
    });
    console.log('[XEG:SW] blob URL download started, id:', downloadId);

    await new Promise<void>((resolve, reject) => {
      const listener = (delta: ChromeDownloadDelta) => {
        if (delta.id !== downloadId) return;
        const stateCurrent = typeof delta.state === 'string' ? delta.state : delta.state?.current;
        const errorCurrent = typeof delta.error === 'string' ? delta.error : delta.error?.current;
        console.log('[XEG:SW] blob URL download delta:', {
          id: downloadId,
          state: stateCurrent,
          error: errorCurrent,
        });
        if (stateCurrent === 'complete') {
          chrome.downloads.onChanged.removeListener(listener);
          resolve();
        } else if (stateCurrent === 'interrupted') {
          chrome.downloads.onChanged.removeListener(listener);
          reject(new Error(`Blob URL download interrupted: ${errorCurrent ?? 'unknown'}`));
        }
      };
      chrome.downloads.onChanged.addListener(listener);
    });
  } catch (error) {
    console.error('[XEG:SW] handleDownloadBlobUrlRequest error:', (error as Error).message);
    throw error;
  }
}

// ── Extension lifecycle ───────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
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
  chrome.notifications.create(id, {
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

  const fetchOptions: RequestInit = {
    method: options?.method ?? 'GET',
  };

  if (options?.headers) {
    fetchOptions.headers = options.headers;
  }

  if (options?.body) {
    fetchOptions.body = options.body;
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json().catch(() => response.text());
}
