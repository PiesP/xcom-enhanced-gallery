// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { Page } from '@playwright/test';

interface GMMockOptions {
  readonly persistentStorage?: boolean;
}

/** Install the userscript host contract used by behavior-level browser tests. */
export async function installGMMock(
  page: Page,
  options: GMMockOptions = {}
): Promise<void> {
  await page.evaluate(({ persistentStorage }) => {
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
      if (!persistentStorage) return;
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
    window.GM_download = (
      urlOrDetails:
        | string
        | {
            url: string;
            name?: string;
            filename?: string;
            onload?: () => void;
          },
      name?: string
    ): void => {
      const details =
        typeof urlOrDetails === 'string'
          ? { url: urlOrDetails, name: name ?? 'download' }
          : urlOrDetails;
      const marker = document.createElement('span');
      marker.dataset.gmDownload = 'true';
      marker.dataset.gmDownloadUrl = details.url;
      marker.dataset.gmDownloadName = details.filename ?? details.name ?? 'download';
      marker.hidden = true;
      document.body.append(marker);
      queueMicrotask(() => details.onload?.());
    };
    window.GM_notification = (details: { title?: string; text?: string }): void => {
      const marker = document.createElement('div');
      marker.dataset.gmNotification = 'true';
      marker.textContent = `${details.title ?? ''}: ${details.text ?? ''}`;
      document.body.append(marker);
    };
    host.GM_xmlhttpRequest = () => ({ abort: () => undefined });
    window.GM_cookie = {
      list: () =>
        document.cookie
          .split(';')
          .filter(Boolean)
          .map((cookie) => {
            const [name, ...rest] = cookie.trim().split('=');
            return { name: name?.trim() ?? '', value: rest.join('=').trim() };
          }),
      set: (cookie: { name: string; value: string }) => {
        document.cookie = `${cookie.name}=${cookie.value}`;
      },
      delete: (name: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    };
  }, options);
}
