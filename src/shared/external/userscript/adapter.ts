/**
 * @fileoverview Userscript API adapter for Tampermonkey/Greasemonkey/Violentmonkey
 * @description Minimal surface for GM_* binding resolution and wrapping
 */

import type { CookieAPI } from '@shared/types/core/cookie.types';
import type {
  GMNotificationDetails,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
  GMXMLHttpRequestResponse,
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

function createNetworkErrorResponse(
  details: GMXMLHttpRequestDetails
): GMXMLHttpRequestResponse<unknown, unknown> {
  return {
    finalUrl: details.url,
    readyState: 4,
    status: 0,
    statusText: 'Network Error',
    responseHeaders: '',
    response: undefined,
    responseXML: null,
    responseText: '',
    context: details.context,
  };
}

function scheduleUserscriptRequestFailureCallbacks(
  details: GMXMLHttpRequestDetails,
  response: GMXMLHttpRequestResponse<unknown, unknown>
): void {
  Promise.resolve().then(() => {
    try {
      details.onerror?.(response);
      details.onloadend?.(response);
    } catch {
      // Silent no-op
    }
  });
}

/**
 * Resolved GM_* bindings (scope injection or global attachment)
 * @internal
 */
export interface ResolvedGMAPIs {
  readonly download: unknown;
  readonly setValue: unknown;
  readonly getValue: unknown;
  readonly deleteValue: unknown;
  readonly listValues: unknown;
  readonly xmlHttpRequest: unknown;
  readonly notification: unknown;
  readonly cookie: CookieAPI | undefined;
}

/**
 * GlobalWithGM: Global object containing GM_* API functions
 * @internal
 */
interface GlobalWithGM {
  GM_download?: (url: string, filename: string) => void;
  GM_setValue?: (key: string, value: unknown) => Promise<void> | void;
  GM_getValue?: <T>(key: string, defaultValue?: T) => Promise<T> | T;
  GM_deleteValue?: (key: string) => Promise<void> | void;
  GM_listValues?: () => Promise<string[]> | string[];
  GM_xmlhttpRequest?: (details: GMXMLHttpRequestDetails) => GMXMLHttpRequestControl;
  GM_notification?: (details: GMNotificationDetails, ondone?: () => void) => void;
  GM_cookie?: CookieAPI;
}

/**
 * Helper to resolve GM_* APIs from scope or globalThis
 * @internal
 */
function resolveGMAPIs(): ResolvedGMAPIs {
  const global = globalThis as unknown as GlobalWithGM;

  // Resolve free variables or globals (avoid ReferenceError in ESM/test)
  const download = typeof GM_download !== 'undefined' ? GM_download : global.GM_download;
  const setValue = typeof GM_setValue !== 'undefined' ? GM_setValue : global.GM_setValue;
  const getValue = typeof GM_getValue !== 'undefined' ? GM_getValue : global.GM_getValue;
  const deleteValue =
    typeof GM_deleteValue !== 'undefined' ? GM_deleteValue : global.GM_deleteValue;
  const listValues = typeof GM_listValues !== 'undefined' ? GM_listValues : global.GM_listValues;
  const xmlHttpRequest =
    typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : global.GM_xmlhttpRequest;
  const notification =
    typeof GM_notification !== 'undefined' ? GM_notification : global.GM_notification;

  // GM_cookie has special validation: requires .list method.
  const cookieCandidate = typeof GM_cookie !== 'undefined' ? GM_cookie : global.GM_cookie;
  const cookie =
    cookieCandidate && typeof cookieCandidate.list === 'function' ? cookieCandidate : undefined;

  return {
    download,
    setValue,
    getValue,
    deleteValue,
    listValues,
    xmlHttpRequest,
    cookie,
    notification,
  };
}

let cachedGMAPIs: ResolvedGMAPIs | null = null;

/**
 * Get cached snapshot of GM_* bindings (avoids repeated probing)
 * In dev/test, globals may be stubbed dynamically so skip caching
 * @internal
 */
export function getResolvedGMAPIsCached(): ResolvedGMAPIs {
  // In dev/test, globals may be stubbed dynamically. Avoid caching so each call reflects
  // the current environment (helps unit tests and dev tooling).
  if (__DEV__) return resolveGMAPIs();
  if (cachedGMAPIs) return cachedGMAPIs;
  cachedGMAPIs = resolveGMAPIs();
  return cachedGMAPIs;
}

/**
 * Helper to cast value to function type
 * @internal
 */
function asFunction<T>(value: unknown): T | undefined {
  return typeof value === 'function' ? (value as unknown as T) : undefined;
}

export function resolveGMDownload(): unknown {
  return getResolvedGMAPIsCached().download;
}

/**
 * Create strict UserscriptAPI with per-method availability validation
 * @internal
 */
function createStrictUserscriptAPI(): UserscriptAPI {
  const resolved = getResolvedGMAPIsCached();
  const gmDownload = asFunction<NonNullable<GlobalWithGM['GM_download']>>(resolved.download);
  const gmSetValue = asFunction<NonNullable<GlobalWithGM['GM_setValue']>>(resolved.setValue);
  const gmGetValue = asFunction<NonNullable<GlobalWithGM['GM_getValue']>>(resolved.getValue);
  const gmDeleteValue = asFunction<NonNullable<GlobalWithGM['GM_deleteValue']>>(
    resolved.deleteValue
  );
  const gmListValues = asFunction<NonNullable<GlobalWithGM['GM_listValues']>>(resolved.listValues);
  const gmXmlHttpRequest = asFunction<NonNullable<GlobalWithGM['GM_xmlhttpRequest']>>(
    resolved.xmlHttpRequest
  );
  const gmNotification = asFunction<NonNullable<GlobalWithGM['GM_notification']>>(
    resolved.notification
  );

  return {
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
      return value instanceof Promise ? defaultValue : (value as T | undefined);
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
      gmNotification(details, undefined);
    },
    cookie: resolved.cookie,
  };
}

/**
 * Safe call wrapper that never throws (swallows promise rejections)
 * @internal
 */
function safeCall(fn: (() => unknown) | null | undefined): Promise<unknown | undefined> {
  if (!fn) return Promise.resolve(undefined);
  try {
    return Promise.resolve(fn()).catch(() => undefined);
  } catch {
    return Promise.resolve(undefined);
  }
}

/**
 * Non-throwing safe UserscriptAPI variant (best-effort defaults)
 * @internal
 */
function createSafeUserscriptAPI(): UserscriptAPI {
  const resolved = getResolvedGMAPIsCached();
  const gmDownload = asFunction<NonNullable<GlobalWithGM['GM_download']>>(resolved.download);
  const gmSetValue = asFunction<NonNullable<GlobalWithGM['GM_setValue']>>(resolved.setValue);
  const gmGetValue = asFunction<NonNullable<GlobalWithGM['GM_getValue']>>(resolved.getValue);
  const gmDeleteValue = asFunction<NonNullable<GlobalWithGM['GM_deleteValue']>>(
    resolved.deleteValue
  );
  const gmListValues = asFunction<NonNullable<GlobalWithGM['GM_listValues']>>(resolved.listValues);
  const gmXmlHttpRequest = asFunction<NonNullable<GlobalWithGM['GM_xmlhttpRequest']>>(
    resolved.xmlHttpRequest
  );
  const gmNotification = asFunction<NonNullable<GlobalWithGM['GM_notification']>>(
    resolved.notification
  );

  return {
    async download(url: string, filename: string): Promise<void> {
      await safeCall(gmDownload ? () => gmDownload(url, filename) : null);
    },
    async setValue(key: string, value: unknown): Promise<void> {
      await safeCall(gmSetValue ? () => gmSetValue(key, value) : null);
    },
    async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
      if (!gmGetValue) return defaultValue;
      try {
        const value = await Promise.resolve(gmGetValue(key, defaultValue));
        return value as T | undefined;
      } catch {
        return defaultValue;
      }
    },
    getValueSync<T>(key: string, defaultValue?: T): T | undefined {
      if (!gmGetValue) return defaultValue;
      try {
        const value = gmGetValue(key, defaultValue);
        return value instanceof Promise ? defaultValue : (value as T | undefined);
      } catch {
        return defaultValue;
      }
    },
    async deleteValue(key: string): Promise<void> {
      await safeCall(gmDeleteValue ? () => gmDeleteValue(key) : null);
    },
    async listValues(): Promise<string[]> {
      if (!gmListValues) return [];
      try {
        const values = await Promise.resolve(gmListValues());
        return Array.isArray(values) ? values : [];
      } catch {
        return [];
      }
    },
    xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl {
      if (gmXmlHttpRequest) {
        try {
          return gmXmlHttpRequest(details);
        } catch {
          // fall through
        }
      }

      const response = createNetworkErrorResponse(details);
      scheduleUserscriptRequestFailureCallbacks(details, response);
      return { abort() {} };
    },
    notification(details: GMNotificationDetails): void {
      void safeCall(gmNotification ? () => gmNotification(details, undefined) : null);
    },
    cookie: resolved.cookie,
  };
}

/**
 * Get UserscriptAPI with per-method validation (throws if API unavailable)
 * Use Service Layer (PersistentStorage) for production code
 * @internal Advanced/testing only
 */
export function getUserscript(): UserscriptAPI {
  return createStrictUserscriptAPI();
}

/**
 * Get safe UserscriptAPI with best-effort defaults (never throws)
 * Provides resilience in dev/test/runtime when GM_* APIs partially unavailable
 * @internal
 */
export function getUserscriptSafe(): UserscriptAPI {
  return createSafeUserscriptAPI();
}
