// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { Page } from '@playwright/test';
import type { CookieAPI } from '../../../src/shared/types/core/cookie.types';
import type {
  GMDownloadDetails,
  GMNotificationDetails,
  GMXMLHttpRequestDetails,
  GMXMLHttpRequestResponse,
} from '../../../src/shared/types/core/userscript';

interface GMMockOptions {
  readonly persistentStorage?: boolean;
  readonly downloadApi?: boolean;
  readonly mediaResponses?: Readonly<Record<string, readonly number[]>>;
  readonly apiResponses?: Readonly<Record<string, string>>;
}

/** Install the userscript host contract used by behavior-level browser tests. */
export async function installGMMock(page: Page, options: GMMockOptions = {}): Promise<void> {
  await page.evaluate(({ persistentStorage, downloadApi, apiResponses, mediaResponses }) => {
    const host = window as unknown as Record<string, unknown>;
    const storageKey = '__xeg_e2e_gm_storage';
    let storage = new Map<string, unknown>();

    if (persistentStorage) {
      try {
        const saved = localStorage.getItem(storageKey);
        storage = new Map(saved ? (JSON.parse(saved) as Array<[string, unknown]>) : []);
      } catch {
        storage = new Map();
      }
    }

    const persist = (): void => {
      if (!persistentStorage) {
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(storage.entries())));
      } catch {
        // Storage quota failures are intentionally non-fatal in the mock host.
      }
    };

    host.__gmStorage = storage;
    window.GM_setValue = (key: string, value: unknown): void => {
      storage.set(key, value);
      persist();
    };
    window.GM_getValue = <T = unknown>(key: string, defaultValue?: T): T =>
      storage.has(key) ? (storage.get(key) as T) : (defaultValue as T);
    window.GM_deleteValue = (key: string): void => {
      storage.delete(key);
      persist();
    };
    window.GM_listValues = (): string[] => Array.from(storage.keys());
    if (downloadApi === false) {
      delete window.GM_download;
    } else {
      window.GM_download = (urlOrDetails: string | GMDownloadDetails, name?: string) => {
        const details =
          typeof urlOrDetails === 'string' ? { url: urlOrDetails, name } : urlOrDetails;
        if (!details.name) {
          throw new Error('GM_download requires name');
        }
        const marker = document.createElement('span');
        marker.dataset.gmDownload = 'true';
        marker.dataset.gmDownloadUrl = details.url;
        marker.dataset.gmDownloadName = details.name;
        marker.hidden = true;
        document.body.append(marker);
        let aborted = false;
        queueMicrotask(() => {
          if (!aborted && 'onload' in details) {
            details.onload?.();
          }
        });
        return {
          abort: () => {
            aborted = true;
            marker.dataset.gmDownloadAborted = 'true';
          },
        };
      };
    }
    window.GM_notification = (
      details: GMNotificationDetails | string,
      titleOrDone?: string | (() => void)
    ): void => {
      const notification =
        typeof details === 'string'
          ? { text: details, title: typeof titleOrDone === 'string' ? titleOrDone : undefined }
          : details;
      const marker = document.createElement('div');
      marker.dataset.gmNotification = 'true';
      marker.textContent = `${notification.title ?? ''}: ${notification.text ?? ''}`;
      document.body.append(marker);
    };
    host.GM_xmlhttpRequest = (details: GMXMLHttpRequestDetails) => {
      const media = mediaResponses?.[details.url];
      if (media) {
        const bytes = Uint8Array.from(media);
        let aborted = false;
        queueMicrotask(() => {
          if (!aborted) {
            details.onload?.({
              finalUrl: details.url,
              readyState: 4,
              status: 200,
              statusText: 'Fixture',
              responseHeaders: `content-type: image/jpeg\r\ncontent-length: ${bytes.byteLength}`,
              response:
                details.responseType === 'blob'
                  ? new Blob([bytes], { type: 'image/jpeg' })
                  : bytes.buffer,
              responseText: '',
              context: details.context,
            });
          }
        });
        return {
          abort: () => {
            aborted = true;
          },
        };
      }
      const url = apiResponses ? new URL(details.url) : null;
      if (
        apiResponses &&
        url &&
        url.hostname === 'x.com' &&
        url.pathname.endsWith('/TweetResultByRestId')
      ) {
        const variables = JSON.parse(url.searchParams.get('variables') ?? '{}') as {
          tweetId?: string;
        };
        const body = apiResponses[variables.tweetId ?? ''] ?? '{}';
        const encoded = new TextEncoder().encode(body);
        let aborted = false;
        const response: GMXMLHttpRequestResponse = {
          finalUrl: details.url,
          readyState: 4,
          status: variables.tweetId && apiResponses[variables.tweetId] ? 200 : 404,
          statusText: 'Fixture',
          responseHeaders: `content-type: application/json\r\ncontent-length: ${encoded.byteLength}`,
          response:
            details.responseType === 'arraybuffer'
              ? encoded.buffer
              : details.responseType === 'json'
                ? JSON.parse(body)
                : body,
          responseText: body,
          context: details.context,
        };
        queueMicrotask(() => {
          if (!aborted) {
            details.onload?.(response);
          }
        });
        return {
          abort: () => {
            aborted = true;
          },
        };
      }
      if (details.responseType === 'blob') {
        const marker = document.createElement('span');
        marker.dataset.gmXhrDownload = 'true';
        marker.dataset.gmXhrDownloadUrl = details.url;
        marker.hidden = true;
        document.body.append(marker);

        const response: GMXMLHttpRequestResponse<Blob> = {
          finalUrl: details.url,
          readyState: 4,
          status: 200,
          statusText: 'OK',
          responseHeaders: 'content-type: application/octet-stream',
          response: new Blob(['fixture media'], { type: 'application/octet-stream' }),
          responseText: '',
          context: details.context,
        };
        queueMicrotask(() => details.onload?.(response));
      }

      return { abort: () => undefined };
    };
    host.GM_cookie = {
      list: (_details, callback) => {
        const cookies = document.cookie
          .split(';')
          .filter(Boolean)
          .map((cookie) => {
            const [name, ...rest] = cookie.trim().split('=');
            return { name: name?.trim() ?? '', value: rest.join('=').trim() };
          });
        callback?.(cookies, null);
        return cookies;
      },
      set: (cookie, callback) => {
        document.cookie = `${cookie.name ?? ''}=${cookie.value}`;
        callback?.();
      },
      delete: ({ name }, callback) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        callback?.();
      },
    } satisfies CookieAPI;
  }, options);
}
