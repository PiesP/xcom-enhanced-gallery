// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview GM_* API mock utilities for E2E testing.
 *
 * X.com Enhanced Gallery relies on Tampermonkey/Greasemonkey GM_* APIs
 * (GM_setValue, GM_getValue, GM_download, GM_notification, GM_xmlhttpRequest, GM_cookie).
 * In Playwright tests (no Tampermonkey runtime), we mock these APIs via page.evaluate().
 */

/** In-memory storage simulating GM_setValue/GM_getValue */
const GM_STORAGE = new Map<string, unknown>();

/** Log of all GM_* calls for assertion in tests */
const GM_CALL_LOG: Array<{ api: string; args: unknown[]; timestamp: number }> = [];

/**
 * Install GM_* mock APIs on the page.
 * Call this via page.evaluate(installGMMock) before userscript injection.
 */
export function installGMMock(): void {
  // GM_setValue / GM_getValue / GM_deleteValue / GM_listValues
  window.GM_setValue = (key: string, value: unknown): void => {
    GM_STORAGE.set(key, value);
    GM_CALL_LOG.push({ api: 'GM_setValue', args: [key, value], timestamp: Date.now() });
  };

  window.GM_getValue = <T = unknown>(key: string, defaultValue?: T): T => {
    GM_CALL_LOG.push({ api: 'GM_getValue', args: [key, defaultValue], timestamp: Date.now() });
    return GM_STORAGE.has(key) ? (GM_STORAGE.get(key) as T) : (defaultValue as T);
  };

  window.GM_deleteValue = (key: string): void => {
    GM_STORAGE.delete(key);
    GM_CALL_LOG.push({ api: 'GM_deleteValue', args: [key], timestamp: Date.now() });
  };

  window.GM_listValues = (): string[] => {
    GM_CALL_LOG.push({ api: 'GM_listValues', args: [], timestamp: Date.now() });
    return Array.from(GM_STORAGE.keys());
  };

  // GM_download — simulate download by creating a link and clicking it
  window.GM_download = (urlOrDetails: string | GMDownloadDetails, name?: string): void => {
    const details = typeof urlOrDetails === 'string'
      ? { url: urlOrDetails, name: name ?? 'download' }
      : urlOrDetails;

    GM_CALL_LOG.push({ api: 'GM_download', args: [details], timestamp: Date.now() });

    // Create actual download link for verification
    const link = document.createElement('a');
    link.href = details.url;
    link.download = details.name ?? 'download';
    link.setAttribute('data-gm-download', 'true');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => link.remove(), 100);
  };

  // GM_notification — create visible notification element
  window.GM_notification = (details: GMNotificationDetails): void => {
    GM_CALL_LOG.push({ api: 'GM_notification', args: [details], timestamp: Date.now() });

    const notification = document.createElement('div');
    notification.setAttribute('data-gm-notification', 'true');
    notification.textContent = `${details.title}: ${details.text}`;
    notification.style.cssText = 'position:fixed;top:10px;right:10px;background:#1d9bf0;color:#fff;padding:8px 16px;border-radius:8px;z-index:2147483647;font-size:14px;';
    document.body.appendChild(notification);

    if (details.ondone) {
      setTimeout(details.ondone, 1000);
    }

    setTimeout(() => notification.remove(), 5000);
  };

  // GM_xmlhttpRequest — NOT mocked (tests should prevent real XHR or mock fetch instead)
  window.GM_xmlhttpRequest = undefined;

  // GM_cookie — minimal mock
  window.GM_cookie = {
    list: (): GM_cookie[] => {
      GM_CALL_LOG.push({ api: 'GM_cookie.list', args: [], timestamp: Date.now() });
      return document.cookie.split(';').filter(Boolean).map((c) => {
        const [name, ...rest] = c.trim().split('=');
        return { name: name!.trim(), value: rest.join('=').trim() };
      });
    },
    set: (cookie: GM_cookie): void => {
      GM_CALL_LOG.push({ api: 'GM_cookie.set', args: [cookie], timestamp: Date.now() });
      document.cookie = `${cookie.name}=${cookie.value}`;
    },
    delete: (name: string): void => {
      GM_CALL_LOG.push({ api: 'GM_cookie.delete', args: [name], timestamp: Date.now() });
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
  };
}

/**
 * Call a GM_* mock after userscript injection.
 * Useful for APIs not installed by installGMMock.
 */
export function callGMApi(apiName: string, ...args: unknown[]): void {
  switch (apiName) {
    case 'GM_setValue':
      window.GM_setValue!(args[0] as string, args[1]);
      break;
    case 'GM_getValue':
      window.GM_getValue!(args[0] as string, args[1]);
      break;
    case 'GM_deleteValue':
      window.GM_deleteValue!(args[0] as string);
      break;
    case 'GM_listValues':
      window.GM_listValues!();
      break;
    case 'GM_download':
      window.GM_download!(args[0] as string, args[1] as string);
      break;
    case 'GM_notification':
      window.GM_notification!(args[0] as GMNotificationDetails);
      break;
    default:
      throw new Error(`Unknown GM_* API: ${apiName}`);
  }
}

/** Type declarations for GM_* API mocks */
declare global {
  interface Window {
    GM_setValue?: (key: string, value: unknown) => void;
    GM_getValue?: <T = unknown>(key: string, defaultValue?: T) => T;
    GM_deleteValue?: (key: string) => void;
    GM_listValues?: () => string[];
    GM_download?: (urlOrDetails: string | GMDownloadDetails, name?: string) => void;
    GM_notification?: (details: GMNotificationDetails) => void;
    GM_xmlhttpRequest?: undefined;
    GM_cookie?: {
      list: () => GM_cookie[];
      set: (cookie: GM_cookie) => void;
      delete: (name: string) => void;
    };
  }

  interface GMDownloadDetails {
    url: string;
    name?: string;
    onload?: () => void;
    onerror?: (error: Error) => void;
  }

  interface GMNotificationDetails {
    title: string;
    text: string;
    silent?: boolean;
    ondone?: () => void;
  }

  interface GM_cookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
  }
}

export { GM_STORAGE, GM_CALL_LOG };
