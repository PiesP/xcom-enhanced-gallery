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

interface DownloadBlobRequestMessage {
  type: 'DOWNLOAD_BLOB_REQUEST';
  payload: {
    dataUrl: string;
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

interface DownloadBlobArrayBufferRequestMessage {
  type: 'DOWNLOAD_BLOB_ARRAYBUFFER_REQUEST';
  payload: {
    buffer: ArrayBuffer;
    filename: string;
    mimeType: string;
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
  | DownloadBlobRequestMessage
  | DownloadBlobArrayBufferRequestMessage
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
    switch (msg.type) {
      case 'DOWNLOAD_REQUEST':
        handleDownloadRequest(msg)
          .then(() => sendResponse({ success: true }))
          .catch((error: Error) => sendResponse({ success: false, error: error.message }));
        return true;

      case 'DOWNLOAD_BLOB_REQUEST':
        handleDownloadBlobRequest(msg)
          .then(() => sendResponse({ success: true }))
          .catch((error: Error) => sendResponse({ success: false, error: error.message }));
        return true;

      case 'DOWNLOAD_BLOB_ARRAYBUFFER_REQUEST':
        handleDownloadBlobArrayBufferRequest(msg)
          .then(() => sendResponse({ success: true }))
          .catch((error: Error) => sendResponse({ success: false, error: error.message }));
        return true;

      case 'SHOW_NOTIFICATION':
        handleShowNotification(msg.payload);
        sendResponse({ success: true });
        return false;

      case 'FETCH_REQUEST':
        handleFetchRequest(msg)
          .then((result) => sendResponse({ success: true, data: result }))
          .catch((error: Error) => sendResponse({ success: false, error: error.message }));
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

  const downloadId = await chrome.downloads.download(downloadOptions);

  return new Promise<void>((resolve, reject) => {
    const listener = (delta: ChromeDownloadDelta) => {
      if (delta.id !== downloadId) return;

      const stateCurrent = typeof delta.state === 'string' ? delta.state : delta.state?.current;
      if (stateCurrent === 'complete') {
        chrome.downloads.onChanged.removeListener(listener);
        resolve();
      } else if (stateCurrent === 'interrupted') {
        chrome.downloads.onChanged.removeListener(listener);
        reject(new Error('Download interrupted'));
      }
    };
    chrome.downloads.onChanged.addListener(listener);
  });
}

async function handleDownloadBlobRequest(message: DownloadBlobRequestMessage): Promise<void> {
  const { dataUrl, filename } = message.payload;

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const downloadId = await chrome.downloads.download({
      url: objectUrl,
      filename,
      saveAs: false,
    });

    // Wait for download to complete before revoking the object URL.
    await new Promise<void>((resolve, reject) => {
      const listener = (delta: ChromeDownloadDelta) => {
        if (delta.id !== downloadId) return;
        const stateCurrent = typeof delta.state === 'string' ? delta.state : delta.state?.current;
        if (stateCurrent === 'complete') {
          chrome.downloads.onChanged.removeListener(listener);
          resolve();
        } else if (stateCurrent === 'interrupted') {
          chrome.downloads.onChanged.removeListener(listener);
          reject(new Error('Download interrupted'));
        }
      };
      chrome.downloads.onChanged.addListener(listener);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ── Cross-origin fetch proxy ─────────────────────────────────────────────────

async function handleDownloadBlobArrayBufferRequest(
  message: DownloadBlobArrayBufferRequestMessage
): Promise<void> {
  const { buffer, filename, mimeType } = message.payload;

  const blob = new Blob([buffer], { type: mimeType || 'application/octet-stream' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const downloadId = await chrome.downloads.download({
      url: objectUrl,
      filename,
      saveAs: false,
    });

    await new Promise<void>((resolve, reject) => {
      const listener = (delta: ChromeDownloadDelta) => {
        if (delta.id !== downloadId) return;
        const stateCurrent = typeof delta.state === 'string' ? delta.state : delta.state?.current;
        if (stateCurrent === 'complete') {
          chrome.downloads.onChanged.removeListener(listener);
          resolve();
        } else if (stateCurrent === 'interrupted') {
          chrome.downloads.onChanged.removeListener(listener);
          reject(new Error('Download interrupted'));
        }
      };
      chrome.downloads.onChanged.addListener(listener);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
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
