// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Userscript API adapter with robust download strategy.
 *
 * Download strategy (in priority order):
 * 1. GM.download (GM4+/Tampermonkey Promise-based) — if available
 * 2. GM_download options-object form — works in TM/VM/GM
 * 3. Blob-based fallback via GM_xmlhttpRequest + anchor download — universal
 *
 * The URL-only form GM_download(url, filename) is NEVER used because:
 * - Greasemonkey 4.x doesn't support it
 * - Tampermonkey may ignore filename (uses CDN Content-Disposition)
 * - Violentmonkey only supports options-object form
 *
 * Blob URL handling:
 * GM.download ignores the `filename` parameter for blob: URLs, instead
 * extracting the UUID from the URL path. All blob downloads use anchor
 * element download (`<a download>`) to guarantee correct filenames.
 *
 * Anchor placement:
 * Anchors are appended to `.xeg-gallery-root` (when present) instead of
 * `document.body` to prevent gallery close-on-outside-click handlers
 * from detecting the synthetic click as an "outside" click.
 */

import { GM_DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type { CookieAPI } from '@shared/types/core/cookie.types';
import type {
  GMDownloadDetails,
  GMNotificationDetails,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
} from '@shared/types/core/userscript';

/**
 * GM_xmlhttpRequest timeout for userscript blob-based download fallback.
 *
 * NOTE: This is intentionally 60s vs DOWNLOAD_TIMEOUT_MS (300s) in
 * @constants/performance:
 * - 300s (DOWNLOAD_TIMEOUT_MS): Extension background SW timeout for
 *   chrome.downloads.download() — the SW must wait for the full file
 *   download over the network, which can be slow for large files.
 * - 60s (GM_DOWNLOAD_TIMEOUT_MS): Timeout for GM_xmlhttpRequest in the blob-based
 *   fallback path. This covers just the HTTP fetch to get the blob;
 *   once the blob is obtained, the actual file save is near-instant via
 *   the anchor download (no network wait). 60s is generous for a fetch.
 *   (Value sourced from @constants/performance)
 */

export interface UserscriptAPI {
  readonly download: (url: string, filename: string) => Promise<void>;
  readonly downloadBlob: (blob: Blob, filename: string) => Promise<void>;
  readonly setValue: (key: string, value: unknown) => Promise<void>;
  readonly getValue: <T>(key: string, defaultValue?: T) => Promise<T | undefined>;
  readonly getValueSync: <T>(key: string, defaultValue?: T) => T | undefined;
  readonly deleteValue: (key: string) => Promise<void>;
  readonly listValues: () => Promise<string[]>;
  readonly xmlHttpRequest: (details: GMXMLHttpRequestDetails) => GMXMLHttpRequestControl;
  readonly notification: (details: GMNotificationDetails) => void;
  readonly cookie: CookieAPI | undefined;
}

export interface ResolvedGMAPIs {
  download: unknown;
  downloadLegacy: unknown;
  setValue: unknown;
  getValue: unknown;
  deleteValue: unknown;
  listValues: unknown;
  xmlHttpRequest: unknown;
  notification: unknown;
  cookie: CookieAPI | undefined;
}

function getGMAPIs(): ResolvedGMAPIs {
  const g = globalThis as unknown as Record<string, unknown>;
  return {
    // GM.download (GM4+/Tampermonkey Promise-based API)
    download:
      typeof g.GM !== 'undefined' && g.GM !== null
        ? (g.GM as Record<string, unknown>).download
        : undefined,
    // GM_download (legacy function)
    downloadLegacy: g.GM_download,
    setValue: g.GM_setValue,
    getValue: g.GM_getValue,
    deleteValue: g.GM_deleteValue,
    listValues: g.GM_listValues,
    xmlHttpRequest: g.GM_xmlhttpRequest,
    notification: g.GM_notification,
    cookie: g.GM_cookie as CookieAPI | undefined,
  };
}

function asFunction<T>(value: unknown): T | undefined {
  return typeof value === 'function' ? (value as T) : undefined;
}

/**
 * Anchor-based download using `<a download>` element.
 *
 * Appends to gallery root when present to avoid triggering
 * document.body capture-phase listeners (gallery close-on-outside-click).
 * Falls back to document.body when gallery is not open.
 */
function anchorDownload(url: string, filename: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      const container = document.querySelector('.xeg-gallery-root') ?? document.body;
      container.appendChild(a);
      a.click();
      queueMicrotask(() => {
        a.remove();
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Blob-based download fallback using GM_xmlhttpRequest + anchor element.
 * Works in all userscript environments regardless of GM_download support.
 */
async function downloadViaBlob(
  url: string,
  filename: string,
  xmlHttpRequest: (details: GMXMLHttpRequestDetails) => GMXMLHttpRequestControl
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let objectUrl: string | null = null;
    const control = xmlHttpRequest({
      method: 'GET',
      url,
      responseType: 'blob',
      timeout: GM_DOWNLOAD_TIMEOUT_MS,
      onload: (response) => {
        try {
          const blob = response.response as Blob;
          objectUrl = URL.createObjectURL(blob);
          anchorDownload(objectUrl, filename)
            .then(resolve)
            .catch(reject)
            .finally(() => {
              if (objectUrl) URL.revokeObjectURL(objectUrl);
            });
        } catch (error) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      },
      onerror: () => {
        control.abort();
        reject(new Error('GM_xmlhttpRequest failed'));
      },
      ontimeout: () => {
        control.abort();
        reject(new Error('GM_xmlhttpRequest timed out'));
      },
      onabort: () => reject(new DOMException('Aborted', 'AbortError')),
    });
    // control.abort() is called on error/timeout to cleanly cancel
    // in-flight requests when the promise rejects.
  });
}

let cachedUserscriptAPI: UserscriptAPI | null = null;

export function getUserscript(): UserscriptAPI {
  if (cachedUserscriptAPI) return cachedUserscriptAPI;

  const g = getGMAPIs();

  // GM.download (GM4+/Tampermonkey Promise-based) — preferred
  const gmDownloadModern = asFunction<(details: GMDownloadDetails) => { abort: () => void }>(
    g.download
  );
  // GM_download (legacy) — fallback
  const gmDownloadLegacy = asFunction<typeof GM_download>(g.downloadLegacy);

  const gmSetValue = asFunction<(key: string, value: unknown) => Promise<void> | void>(g.setValue);
  const gmGetValue = asFunction<<T>(key: string, defaultValue?: T) => Promise<T> | T>(g.getValue);
  const gmDeleteValue = asFunction<(key: string) => Promise<void> | void>(g.deleteValue);
  const gmListValues = asFunction<() => Promise<string[]> | string[]>(g.listValues);
  const gmXmlHttpRequest = asFunction<
    (details: GMXMLHttpRequestDetails) => GMXMLHttpRequestControl
  >(g.xmlHttpRequest);
  const gmNotification = asFunction<(details: GMNotificationDetails, ondone?: () => void) => void>(
    g.notification
  );

  if (!gmDownloadModern && !gmDownloadLegacy) throw new Error('GM_download unavailable');
  if (!gmXmlHttpRequest) throw new Error('GM_xmlhttpRequest unavailable');

  const cookieCandidate = g.cookie;
  const cookie =
    cookieCandidate && typeof cookieCandidate.list === 'function' ? cookieCandidate : undefined;

  cachedUserscriptAPI = {
    async download(url: string, filename: string): Promise<void> {
      // For blob: URLs, GM.download ignores the filename and uses the
      // URL's UUID instead. Use anchor download directly to guarantee
      // the correct filename and prevent gallery close-on-outside-click.
      if (url.startsWith('blob:')) {
        return anchorDownload(url, filename);
      }

      // Strategy 1: GM.download (GM4+/Tampermonkey Promise-based)
      if (gmDownloadModern) {
        return new Promise<void>((resolve, reject) => {
          try {
            const handle = gmDownloadModern({
              url,
              filename,
              saveAs: false,
              timeout: GM_DOWNLOAD_TIMEOUT_MS,
              onload: () => resolve(),
              onerror: (error: Error) => reject(error),
              ontimeout: () => reject(new Error('GM_download timed out')),
            });
            // Modern API returns abort handle — store for potential cleanup
            void handle;
          } catch (error) {
            reject(error);
          }
        });
      }

      // Strategy 2: GM_download legacy options-object form
      if (gmDownloadLegacy) {
        return new Promise<void>((resolve, reject) => {
          gmDownloadLegacy({
            url,
            filename,
            saveAs: false,
            timeout: GM_DOWNLOAD_TIMEOUT_MS,
            onload: () => resolve(),
            onerror: (error: Error) => reject(error),
            ontimeout: () => reject(new Error('GM_download timed out')),
          });
        });
      }

      // Strategy 3: Blob-based fallback via GM_xmlhttpRequest
      return downloadViaBlob(url, filename, gmXmlHttpRequest);
    },

    async downloadBlob(blob: Blob, filename: string): Promise<void> {
      const url = URL.createObjectURL(blob);
      try {
        // Use anchor download instead of GM.download because GM.download
        // extracts the blob URL's UUID as the filename instead of honoring
        // the filename parameter (Tampermonkey/Violentmonkey behavior).
        await anchorDownload(url, filename);
      } finally {
        URL.revokeObjectURL(url);
      }
    },

    async setValue(key: string, value: unknown): Promise<void> {
      if (!gmSetValue) throw new Error('GM_setValue unavailable');
      await Promise.resolve(gmSetValue(key, value));
    },
    async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
      if (!gmGetValue) throw new Error('GM_getValue unavailable');
      const value = await Promise.resolve(gmGetValue(key, defaultValue));
      return value as T | undefined;
    },
    getValueSync<T>(key: string, defaultValue?: T): T | undefined {
      if (!gmGetValue) return defaultValue;
      const value = gmGetValue(key, defaultValue);
      if (value instanceof Promise) return defaultValue;
      return value as T | undefined;
    },
    async deleteValue(key: string): Promise<void> {
      if (!gmDeleteValue) throw new Error('GM_deleteValue unavailable');
      await Promise.resolve(gmDeleteValue(key));
    },
    async listValues(): Promise<string[]> {
      if (!gmListValues) throw new Error('GM_listValues unavailable');
      const values = await Promise.resolve(gmListValues());
      return Array.isArray(values) ? values : [];
    },
    xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl {
      if (!gmXmlHttpRequest) throw new Error('GM_xmlhttpRequest unavailable');
      return gmXmlHttpRequest(details);
    },
    notification(details: GMNotificationDetails): void {
      if (!gmNotification) return;
      try {
        gmNotification(details, undefined);
      } catch {
        // Optional capability: notification failures should not affect callers.
      }
    },
    cookie,
  };

  return cachedUserscriptAPI;
}
