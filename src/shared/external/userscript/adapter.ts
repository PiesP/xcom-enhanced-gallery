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

import { GM_DOWNLOAD_TIMEOUT_MS, SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES } from '@constants/performance';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import {
  downloadLiveByteBudget,
  reserveBinaryResponse,
} from '@shared/services/download/live-byte-budget';
import type { CookieAPI } from '@shared/types/core/cookie.types';
import type {
  GMDownloadDetails,
  GMNotificationDetails,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
} from '@shared/types/core/userscript';
import { isValidMediaUrl } from '@shared/utils/url/validator';

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
  readonly download: (url: string, filename: string, signal?: AbortSignal) => Promise<void>;
  readonly downloadBlob: (
    blob: Blob,
    filename: string,
    signal?: AbortSignal,
    onObjectUrlReleased?: () => void
  ) => Promise<void>;
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

function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException('This operation was aborted', 'AbortError');
}

/**
 * Anchor-based download using `<a download>` element.
 *
 * Appends to gallery root when present to avoid triggering
 * document.body capture-phase listeners (gallery close-on-outside-click).
 * Falls back to document.body when gallery is not open.
 */
function anchorDownload(
  url: string,
  filename: string,
  onBeforeDispatchFailure?: () => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let a: HTMLAnchorElement;
    try {
      a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      const container = document.querySelector('.xeg-gallery-root') ?? document.body;
      container.appendChild(a);
    } catch (error) {
      onBeforeDispatchFailure?.();
      reject(error);
      return;
    }
    try {
      a.click();
      queueMicrotask(() => {
        a.remove();
        resolve();
      });
    } catch (error) {
      a.remove();
      // A click can throw after dispatch. Its Blob URL remains live until pagehide.
      reject(error);
    }
  });
}

const retainedPageResources = new Set<() => void>();
let pageHideListening = false;

function onPageHide(event: PageTransitionEvent): void {
  if (!event.isTrusted || event.persisted) return;
  for (const release of [...retainedPageResources]) {
    try {
      release();
    } catch {
      // Continue releasing unrelated URLs even if one callback fails.
    }
  }
}

function retainPageResource(onReleased: () => void): {
  release: () => void;
  detach: () => void;
} {
  let registered = true;
  const detach = (): void => {
    if (!registered) return;
    registered = false;
    retainedPageResources.delete(release);
    if (retainedPageResources.size === 0 && pageHideListening) {
      window.removeEventListener('pagehide', onPageHide);
      pageHideListening = false;
    }
  };
  const release = (): void => {
    if (!registered) return;
    detach();
    onReleased();
  };
  if (!pageHideListening) {
    window.addEventListener('pagehide', onPageHide);
    pageHideListening = true;
  }
  retainedPageResources.add(release);
  return { release, detach };
}

/** The anchor microtask cannot establish when the browser has finished reading a Blob URL. */
function retainBlobUrl(url: string, onReleased?: () => void): () => void {
  return retainPageResource(() => {
    try {
      URL.revokeObjectURL(url);
    } finally {
      onReleased?.();
    }
  }).release;
}

/**
 * Blob-based download fallback using GM_xmlhttpRequest + anchor element.
 * Works in all userscript environments regardless of GM_download support.
 */
async function downloadViaBlob(
  url: string,
  filename: string,
  xmlHttpRequest: (details: GMXMLHttpRequestDetails) => GMXMLHttpRequestControl,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) throw abortReason(signal);
  const { maxBytes, lease } = reserveBinaryResponse(
    downloadLiveByteBudget,
    SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES
  );
  let pageLease: ReturnType<typeof retainPageResource>;
  try {
    pageLease = retainPageResource(() => lease.release());
  } catch (error) {
    lease.release();
    throw error;
  }

  return new Promise<void>((resolve, reject) => {
    let control: GMXMLHttpRequestControl | null = null;
    let abortHandler: (() => void) | null = null;
    let abortAfterStart = false;
    let settled = false;
    let transportTerminated = false;
    let transferred = false;

    const cleanup = (): void => {
      if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
      abortHandler = null;
    };
    const releaseLease = (): void => {
      pageLease.release();
    };
    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const terminate = (error: unknown): void => {
      if (transportTerminated) return;
      transportTerminated = true;
      if (!transferred) releaseLease();
      fail(error);
    };
    const failForResourceLimit = (receivedBytes: number): void => {
      if (settled) return;
      fail(new HttpResponseSizeLimitError(maxBytes, receivedBytes));
      if (control) control.abort();
      else abortAfterStart = true;
    };
    const handleLoad: NonNullable<GMXMLHttpRequestDetails['onload']> = (response) => {
      if (transportTerminated) return;
      transportTerminated = true;
      if (settled) {
        releaseLease();
        return;
      }
      if (response.status < 200 || response.status >= 300) {
        fail(new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'}`));
        releaseLease();
        return;
      }
      if (!(response.response instanceof Blob)) {
        fail(new Error('GM_xmlhttpRequest returned an invalid Blob response'));
        releaseLease();
        return;
      }
      if (response.response.size > maxBytes) {
        fail(new HttpResponseSizeLimitError(maxBytes, response.response.size));
        releaseLease();
        control?.abort();
        return;
      }

      let objectUrl: string;
      try {
        lease.shrink(response.response.size);
        objectUrl = URL.createObjectURL(response.response);
      } catch (error) {
        fail(error);
        releaseLease();
        return;
      }

      let releaseUrl: () => void;
      try {
        releaseUrl = retainBlobUrl(objectUrl, () => lease.release());
      } catch (error) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Preserve the registration failure; the URL was never dispatched.
        } finally {
          releaseLease();
        }
        fail(error);
        return;
      }

      // The network request is complete and the synthetic anchor click cannot
      // be cancelled once it starts. Stop observing cancellation before it.
      pageLease.detach();
      transferred = true;
      settled = true;
      cleanup();
      void anchorDownload(objectUrl, filename, releaseUrl).then(resolve, reject);
    };

    abortHandler = () => {
      fail(signal ? abortReason(signal) : new DOMException('Aborted', 'AbortError'));
      try {
        if (control) control.abort();
        else abortAfterStart = true;
      } catch {
        // A failed abort has no terminal evidence; retain the lease until a callback.
      }
    };
    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      control = xmlHttpRequest({
        method: 'GET',
        url,
        responseType: 'blob',
        timeout: GM_DOWNLOAD_TIMEOUT_MS,
        onload: handleLoad,
        onerror: () => terminate(new Error('GM_xmlhttpRequest failed')),
        ontimeout: () => terminate(new Error('GM_xmlhttpRequest timed out')),
        onabort: () => terminate(new DOMException('Aborted', 'AbortError')),
        onprogress: (response) => {
          if (
            settled ||
            (response.loaded <= maxBytes &&
              (!response.lengthComputable || response.total <= maxBytes))
          ) {
            return;
          }
          failForResourceLimit(Math.max(response.loaded, response.total));
        },
      });
      if (abortAfterStart) control.abort();
      else if (signal?.aborted && !settled) abortHandler();
    } catch (error) {
      fail(error);
      // A synchronous throw may follow dispatch. Keep an unconfirmed response
      // reserved until a terminal callback or page teardown.
    }
  });
}

interface GMDownloadHandle {
  readonly abort: () => void;
  readonly then?: (
    onFulfilled: ((value: unknown) => unknown) | undefined,
    onRejected: (reason: unknown) => unknown
  ) => unknown;
}

let cachedUserscriptAPI: UserscriptAPI | null = null;

export function getUserscript(): UserscriptAPI {
  if (cachedUserscriptAPI) return cachedUserscriptAPI;

  const g = getGMAPIs();

  // GM.download (GM4+/Tampermonkey Promise-based) — preferred
  const gmDownloadModern = asFunction<(details: GMDownloadDetails) => GMDownloadHandle>(g.download);
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

  if (!gmXmlHttpRequest) throw new Error('GM_xmlhttpRequest unavailable');

  const cookieCandidate = g.cookie;
  const cookie =
    cookieCandidate && typeof cookieCandidate.list === 'function' ? cookieCandidate : undefined;

  cachedUserscriptAPI = {
    async download(url: string, filename: string, signal?: AbortSignal): Promise<void> {
      if (signal?.aborted) throw abortReason(signal);

      // For blob: URLs, GM.download ignores the filename and uses the
      // URL's UUID instead. Use anchor download directly to guarantee
      // the correct filename and prevent gallery close-on-outside-click.
      if (url.startsWith('blob:')) {
        return anchorDownload(url, filename);
      }

      if (!isValidMediaUrl(url)) {
        throw new Error('Blocked unsafe media download URL');
      }

      // Strategy 1: GM.download (GM4+/Tampermonkey Promise-based)
      if (gmDownloadModern) {
        return new Promise<void>((resolve, reject) => {
          let settled = false;
          let abortHandler: (() => void) | null = null;

          const cleanup = (): void => {
            if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
            abortHandler = null;
          };
          const complete = (): void => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve();
          };
          const fail = (error: unknown): void => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
          };

          try {
            const handle = gmDownloadModern({
              url,
              filename,
              saveAs: false,
              timeout: GM_DOWNLOAD_TIMEOUT_MS,
              onload: complete,
              onerror: fail,
              ontimeout: () => fail(new Error('GM_download timed out')),
            });

            if (settled) return;
            if (signal?.aborted) {
              handle.abort();
              fail(abortReason(signal));
              return;
            }
            if (signal) {
              abortHandler = () => {
                try {
                  handle.abort();
                } finally {
                  fail(abortReason(signal));
                }
              };
              signal.addEventListener('abort', abortHandler, { once: true });
            }
            if (typeof handle.then === 'function') {
              // Callbacks remain the completion source because userscript
              // managers can resolve the returned thenable before onload.
              // Observe rejection so permission/API failures cannot leave the
              // wrapper pending forever or surface as unhandled rejections.
              handle.then(undefined, fail);
            }
          } catch (error) {
            fail(error);
          }
        });
      }

      // Strategy 2: GM_download legacy options-object form. It cannot cancel
      // an in-flight download, so use it only when the caller supplied no signal.
      if (gmDownloadLegacy && !signal) {
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

      // Strategy 3: Blob-based fallback via GM_xmlhttpRequest. This path keeps
      // signal-aware downloads cancellable when the legacy API is present.
      return downloadViaBlob(url, filename, gmXmlHttpRequest, signal);
    },

    async downloadBlob(
      blob: Blob,
      filename: string,
      signal?: AbortSignal,
      onObjectUrlReleased?: () => void
    ): Promise<void> {
      // Anchor downloads cannot be cancelled after the synthetic click. Honor
      // cancellation before creating the object URL and starting the save.
      if (signal?.aborted) {
        onObjectUrlReleased?.();
        throw abortReason(signal);
      }
      let url: string;
      try {
        url = URL.createObjectURL(blob);
      } catch (error) {
        onObjectUrlReleased?.();
        throw error;
      }
      let releaseUrl: () => void;
      try {
        releaseUrl = retainBlobUrl(url, onObjectUrlReleased);
      } catch (error) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Preserve the registration failure; the URL was never dispatched.
        } finally {
          onObjectUrlReleased?.();
        }
        throw error;
      }
      // GM.download ignores the requested filename for blob URLs. A successful
      // anchor click does not prove the browser has finished reading this URL.
      await anchorDownload(url, filename, releaseUrl);
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
