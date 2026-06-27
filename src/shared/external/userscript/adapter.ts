// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { CookieAPI } from '@shared/types/core/cookie.types';
import type {
  GMNotificationDetails,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
} from '@shared/types/core/userscript';

export interface UserscriptAPI {
  readonly download: (url: string, filename: string) => Promise<void>;
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
    download: g.GM_download,
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

let cachedUserscriptAPI: UserscriptAPI | null = null;

export function getUserscript(): UserscriptAPI {
  if (cachedUserscriptAPI) return cachedUserscriptAPI;

  const g = getGMAPIs();

  const gmDownload = asFunction<(url: string, filename: string) => void>(g.download);
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

  const cookieCandidate = g.cookie;
  const cookie =
    cookieCandidate && typeof cookieCandidate.list === 'function' ? cookieCandidate : undefined;

  cachedUserscriptAPI = {
    async download(url: string, filename: string): Promise<void> {
      if (!gmDownload) throw new Error('GM_download unavailable');
      gmDownload(url, filename);
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
