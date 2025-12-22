/**
 * Userscript API Adapter (Tampermonkey/Greasemonkey/Violentmonkey)
 *
 * Bundle-size note:
 * Keep this surface minimal. Prefer the service layer over direct GM_* usage.
 */

import type { CookieAPI } from '@shared/types/core/cookie.types';
import type {
  GMNotificationDetails,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
  GMXMLHttpRequestResponse,
} from '@shared/types/core/userscript';

export interface UserscriptAPI {
  download(url: string, filename: string): Promise<void>;
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  getValueSync<T>(key: string, defaultValue?: T): T | undefined;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
  xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl;
  notification(details: GMNotificationDetails): void;
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
 * Resolved GM_* bindings.
 *
 * Userscript managers may expose GM_* APIs in one of two ways:
 * - Scope injection (e.g., Tampermonkey): `GM_download` is available as a free variable
 * - Global attachment: `globalThis.GM_download` exists
 *
 * This helper resolves both forms and returns a best-effort snapshot.
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
 * Helper to resolve a single GM API from scope or globalThis
 * @internal
 */
function resolveGMAPI<T>(
  scopeBinding: T | undefined,
  globalFallback: T | undefined
): T | undefined {
  return typeof scopeBinding !== 'undefined' ? scopeBinding : globalFallback;
}

/**
 * Resolve GM_* bindings from either scope injection or globalThis.
 *
 * This is intentionally non-throwing: callers should validate types.
 * @internal
 */
export function resolveGMAPIs(): ResolvedGMAPIs {
  const global = globalThis as unknown as GlobalWithGM;

  const download = resolveGMAPI(
    GM_download,
    typeof global.GM_download === 'function' ? global.GM_download : undefined
  );
  const setValue = resolveGMAPI(
    GM_setValue,
    typeof global.GM_setValue === 'function' ? global.GM_setValue : undefined
  );
  const getValue = resolveGMAPI(
    GM_getValue,
    typeof global.GM_getValue === 'function' ? global.GM_getValue : undefined
  );
  const deleteValue = resolveGMAPI(
    GM_deleteValue,
    typeof global.GM_deleteValue === 'function' ? global.GM_deleteValue : undefined
  );
  const listValues = resolveGMAPI(
    GM_listValues,
    typeof global.GM_listValues === 'function' ? global.GM_listValues : undefined
  );
  const xmlHttpRequest = resolveGMAPI(
    GM_xmlhttpRequest,
    typeof global.GM_xmlhttpRequest === 'function' ? global.GM_xmlhttpRequest : undefined
  );
  const notification = resolveGMAPI(
    GM_notification,
    typeof global.GM_notification === 'function' ? global.GM_notification : undefined
  );

  // GM_cookie has special validation: requires .list method
  const cookie = resolveGMAPI(
    GM_cookie,
    global.GM_cookie && typeof global.GM_cookie.list === 'function' ? global.GM_cookie : undefined
  );

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

/**
 * Resolve the raw GM_download binding when present.
 *
 * Some managers support a signature like `GM_download({ url, name, ... })`.
 * Services that need the raw function should use this helper.
 * @internal
 */
function asFunction<T>(value: unknown): T | undefined {
  return typeof value === 'function' ? (value as unknown as T) : undefined;
}

export function resolveGMDownload(): unknown {
  return resolveGMAPIs().download;
}

function createStrictUserscriptAPI(): UserscriptAPI {
  const resolved = resolveGMAPIs();
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
 * Safe wrapper for void-returning GM APIs that may throw
 * @internal
 */
function safeVoidCall(fn: (() => void) | null | undefined): void {
  if (!fn) return;
  try {
    fn();
  } catch {
    // Silently ignore errors from userscript manager APIs
  }
}

/**
 * Safe wrapper for async void-returning GM APIs
 * @internal
 */
async function safeAsyncVoidCall(fn: (() => unknown) | null | undefined): Promise<void> {
  if (!fn) return;
  try {
    await Promise.resolve(fn());
  } catch {
    // Silently ignore errors from userscript manager APIs
  }
}

function createSafeUserscriptAPI(): UserscriptAPI {
  const resolved = resolveGMAPIs();
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
      safeVoidCall(gmDownload ? () => gmDownload(url, filename) : null);
    },
    async setValue(key: string, value: unknown): Promise<void> {
      await safeAsyncVoidCall(gmSetValue ? () => gmSetValue(key, value) : null);
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
      await safeAsyncVoidCall(gmDeleteValue ? () => gmDeleteValue(key) : null);
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
      safeVoidCall(gmNotification ? () => gmNotification(details, undefined) : null);
    },
    cookie: resolved.cookie,
  };
}

/**
 * Userscript API getter (external dependency encapsulation)
 *
 * Provides access to GM_* APIs in Tampermonkey environments.
 *
 * **Security Note**: Use Service Layer (PersistentStorage) for production code
 *
 * @returns UserscriptAPI object with all methods
 *
 * @remarks
 * This function is intentionally non-throwing at resolution time.
 * Availability is validated per-method: calling a missing GM_* binding throws with
 * a standardized "GM_* unavailable" message (except for `notification()`, which
 * is a silent no-op when unsupported).
 * @internal Advanced/testing only
 */
export function getUserscript(): UserscriptAPI {
  return createStrictUserscriptAPI();
}

/**
 * Non-throwing Userscript API getter.
 *
 * Provides best-effort, per-method safe defaults for environments where GM_* APIs
 * are partially or fully unavailable. This is useful for services that should be
 * resilient in dev/test/runtime contexts (e.g., notifications, storage reads).
 *
 * Policy:
 * - Never throws.
 * - Storage reads return the provided defaultValue (or undefined).
 * - Storage writes/delete/list are silent no-ops.
 * - download() is a silent no-op.
 * - xmlHttpRequest() invokes onerror/onloadend asynchronously and returns a no-op control.
 */
export function getUserscriptSafe(): UserscriptAPI {
  return createSafeUserscriptAPI();
}
