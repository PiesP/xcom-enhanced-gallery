/**
 * Userscript API Adapter (Tampermonkey/Greasemonkey/Violentmonkey)
 *
 * **Purpose**: Wrapper for Tampermonkey GM_* APIs
 * **Architecture**: Encapsulates external Userscript GM_* through getter function
 * **Scope**: Provides typed access to GM_* APIs when available
 * **Note**: GM_xmlhttpRequest restored (Phase 373) for cross-origin support.
 *
 * **Fallback Strategy**: This adapter intentionally does not provide global fallbacks.
 * Individual services may opt into safe defaults via `getUserscriptSafe()`.
 *
 * **Supported Managers**:
 * - Tampermonkey (GM_* + GM_info)
 * - Greasemonkey (GM_* + GM_info)
 * - Violentmonkey (GM_* + GM_info)
 * - Test environments must mock GM_* APIs
 *
 * **Usage**:
 * For production: Use Service Layer (PersistentStorage, DownloadService, etc.)
 * For testing/advanced: Use getUserscript() getter
 *
 * @internal Advanced/testing only - Use Service Layer for production
 * @version 12.0.0 - Phase 372: Language policy enforcement + Phase 318.1 MV3 update
 * @fileoverview Userscript API adapter
 * @see PersistentStorage - Recommended service for storage operations
 * @see DownloadService - Recommended service for downloads
 * @see HttpRequestService - Recommended service for HTTP requests (Phase 318+)
 */
import type { CookieAPI } from '@shared/types/core/cookie.types';
import type {
  BrowserEnvironment,
  GMNotificationDetails,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
  GMXMLHttpRequestResponse,
} from '@shared/types/core/userscript';
import { isGMUserScriptInfo } from '@shared/utils/types/guards';

type GMUserScriptInfo = Record<string, unknown>;

export type UserscriptManager = BrowserEnvironment['userscriptManager'];

export interface UserscriptAPI {
  readonly hasGM: boolean;
  readonly manager: UserscriptManager;
  info(): GMUserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  /**
   * Synchronous value retrieval for critical path initialization.
   *
   * [WARNING] This method only works reliably in Tampermonkey and Violentmonkey.
   * Greasemonkey 4+ uses async-only storage - this method will return defaultValue.
   * Use this ONLY when sync access is absolutely required (e.g., theme initialization
   * to prevent flash of unstyled content).
   *
   * @param key - Storage key
   * @param defaultValue - Fallback value if key doesn't exist or sync unavailable
   * @returns Stored value or defaultValue
   */
  getValueSync<T>(key: string, defaultValue?: T): T | undefined;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
  addStyle(css: string): HTMLStyleElement;
  xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl;
  /**
   * Display a notification via the userscript manager's native notification system.
   * Silently ignores the call if GM_notification is not available.
   *
   * @param details - Notification configuration
   */
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

function fallbackAddStyle(css: string): HTMLStyleElement {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const style = document.createElement('style');
    style.textContent = css;
    document.head?.appendChild(style);
    return style;
  }

  return {} as unknown as HTMLStyleElement;
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
  readonly info: unknown;
  readonly download: unknown;
  readonly setValue: unknown;
  readonly getValue: unknown;
  readonly deleteValue: unknown;
  readonly listValues: unknown;
  readonly addStyle: unknown;
  readonly xmlHttpRequest: unknown;
  readonly notification: unknown;
  readonly cookie: CookieAPI | undefined;
}

/**
 * GlobalWithGM: Global object containing GM_* API functions
 * @internal
 */
interface GlobalWithGM {
  GM_info?: {
    script: {
      name: string;
      version: string;
      [key: string]: unknown;
    };
    scriptHandler?: string;
    version?: string;
    [key: string]: unknown;
  };
  GM_download?: (url: string, filename: string) => void;
  GM_setValue?: (key: string, value: unknown) => Promise<void> | void;
  GM_getValue?: <T>(key: string, defaultValue?: T) => Promise<T> | T;
  GM_deleteValue?: (key: string) => Promise<void> | void;
  GM_listValues?: () => Promise<string[]> | string[];
  GM_addStyle?: (css: string) => HTMLStyleElement;
  GM_xmlhttpRequest?: (details: GMXMLHttpRequestDetails) => GMXMLHttpRequestControl;
  GM_notification?: (details: GMNotificationDetails, ondone?: () => void) => void;
  GM_cookie?: CookieAPI;
}

/**
 * Resolve GM_* bindings from either scope injection or globalThis.
 *
 * This is intentionally non-throwing: callers should validate types.
 * @internal
 */
export function resolveGMAPIs(): ResolvedGMAPIs {
  const global = globalThis as unknown as GlobalWithGM;

  const info = typeof GM_info !== 'undefined' ? GM_info : global.GM_info;
  const download =
    typeof GM_download !== 'undefined'
      ? GM_download
      : typeof global.GM_download === 'function'
        ? global.GM_download
        : undefined;
  const setValue =
    typeof GM_setValue !== 'undefined'
      ? GM_setValue
      : typeof global.GM_setValue === 'function'
        ? global.GM_setValue
        : undefined;
  const getValue =
    typeof GM_getValue !== 'undefined'
      ? GM_getValue
      : typeof global.GM_getValue === 'function'
        ? global.GM_getValue
        : undefined;
  const deleteValue =
    typeof GM_deleteValue !== 'undefined'
      ? GM_deleteValue
      : typeof global.GM_deleteValue === 'function'
        ? global.GM_deleteValue
        : undefined;
  const listValues =
    typeof GM_listValues !== 'undefined'
      ? GM_listValues
      : typeof global.GM_listValues === 'function'
        ? global.GM_listValues
        : undefined;
  const addStyle =
    typeof GM_addStyle !== 'undefined'
      ? GM_addStyle
      : typeof global.GM_addStyle === 'function'
        ? global.GM_addStyle
        : undefined;
  const xmlHttpRequest =
    typeof GM_xmlhttpRequest !== 'undefined'
      ? GM_xmlhttpRequest
      : typeof global.GM_xmlhttpRequest === 'function'
        ? global.GM_xmlhttpRequest
        : undefined;
  const cookie =
    typeof GM_cookie !== 'undefined'
      ? GM_cookie
      : global.GM_cookie && typeof global.GM_cookie.list === 'function'
        ? global.GM_cookie
        : undefined;
  const notification =
    typeof GM_notification !== 'undefined'
      ? GM_notification
      : typeof global.GM_notification === 'function'
        ? global.GM_notification
        : undefined;

  return Object.freeze({
    info,
    download,
    setValue,
    getValue,
    deleteValue,
    listValues,
    addStyle,
    xmlHttpRequest,
    cookie,
    notification,
  });
}

/**
 * Resolve the raw GM_download binding when present.
 *
 * Some managers support a signature like `GM_download({ url, name, ... })`.
 * Services that need the raw function should use this helper.
 * @internal
 */
export function resolveGMDownload(): unknown {
  return resolveGMAPIs().download;
}

/**
 * Detect userscript manager from GM_info
 * @internal
 *
 * Determines which userscript manager is running (Tampermonkey, Greasemonkey, Violentmonkey)
 * by inspecting the scriptHandler property of GM_info.
 */
function detectManager(global: GlobalWithGM): UserscriptManager {
  try {
    const info = typeof GM_info !== 'undefined' ? GM_info : global.GM_info;
    const handler = isGMUserScriptInfo(info)
      ? (info as { scriptHandler?: string })?.scriptHandler?.toLowerCase?.()
      : undefined;
    if (!handler) return 'unknown';
    if (handler.includes('tamper')) return 'tampermonkey';
    if (handler.includes('grease')) return 'greasemonkey';
    if (handler.includes('violent')) return 'violentmonkey';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Safely get GM_info from globalThis
 * @internal
 *
 * Returns GM_info object if available and valid, otherwise returns null
 */
function safeInfo(global: GlobalWithGM): GMUserScriptInfo | null {
  try {
    const info = typeof GM_info !== 'undefined' ? GM_info : global.GM_info;
    return isGMUserScriptInfo(info) ? (info as unknown as GMUserScriptInfo) : null;
  } catch {
    return null;
  }
}

const ERROR_MESSAGES = {
  download: 'GM_download unavailable',
  setValue: 'GM_setValue unavailable',
  getValue: 'GM_getValue unavailable',
  deleteValue: 'GM_deleteValue unavailable',
  listValues: 'GM_listValues unavailable',
  addStyle: 'GM_addStyle unavailable',
  xmlHttpRequest: 'GM_xmlhttpRequest unavailable',
} as const;

function assertFunction<T extends (...args: never[]) => unknown>(
  fn: T | undefined,
  errorMessage: string
): T {
  if (typeof fn !== 'function') {
    throw new Error(errorMessage);
  }
  return fn;
}

type AdapterMode = 'strict' | 'safe';

function asFunction<T>(value: unknown): T | undefined {
  return typeof value === 'function' ? (value as unknown as T) : undefined;
}

function createUserscriptAPI(mode: AdapterMode): UserscriptAPI {
  const global = globalThis as unknown as GlobalWithGM;
  const resolved = resolveGMAPIs();

  // Normalize resolved APIs to typed function references.
  const gmDownload = asFunction<NonNullable<GlobalWithGM['GM_download']>>(resolved.download);
  const gmSetValue = asFunction<NonNullable<GlobalWithGM['GM_setValue']>>(resolved.setValue);
  const gmGetValue = asFunction<NonNullable<GlobalWithGM['GM_getValue']>>(resolved.getValue);
  const gmDeleteValue = asFunction<NonNullable<GlobalWithGM['GM_deleteValue']>>(
    resolved.deleteValue
  );
  const gmListValues = asFunction<NonNullable<GlobalWithGM['GM_listValues']>>(resolved.listValues);
  const gmAddStyle = asFunction<NonNullable<GlobalWithGM['GM_addStyle']>>(resolved.addStyle);
  const gmXmlHttpRequest = asFunction<NonNullable<GlobalWithGM['GM_xmlhttpRequest']>>(
    resolved.xmlHttpRequest
  );
  const gmNotification = asFunction<NonNullable<GlobalWithGM['GM_notification']>>(
    resolved.notification
  );

  const hasGM = Boolean(gmDownload || (gmSetValue && gmGetValue) || gmXmlHttpRequest);

  return Object.freeze({
    hasGM,
    manager: detectManager(global),
    info: () => safeInfo(global),

    async download(url: string, filename: string): Promise<void> {
      if (mode === 'strict') {
        const fn = assertFunction(gmDownload, ERROR_MESSAGES.download);
        fn(url, filename);
        return;
      }

      if (!gmDownload) return;
      try {
        gmDownload(url, filename);
      } catch {
        // Silent no-op
      }
    },

    async setValue(key: string, value: unknown): Promise<void> {
      if (mode === 'strict') {
        const fn = assertFunction(gmSetValue, ERROR_MESSAGES.setValue);
        await Promise.resolve(fn(key, value));
        return;
      }

      if (!gmSetValue) return;
      try {
        await Promise.resolve(gmSetValue(key, value));
      } catch {
        // Silent no-op
      }
    },

    async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
      if (mode === 'strict') {
        const fn = assertFunction(gmGetValue, ERROR_MESSAGES.getValue);
        const value = await Promise.resolve(fn(key, defaultValue));
        return value as T | undefined;
      }

      if (!gmGetValue) return defaultValue;
      try {
        const value = await Promise.resolve(gmGetValue(key, defaultValue));
        return value as T | undefined;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Synchronous value retrieval - only reliable in Tampermonkey/Violentmonkey.
     * Returns defaultValue if: async-only environment, value is Promise, or unavailable.
     */
    getValueSync<T>(key: string, defaultValue?: T): T | undefined {
      if (!gmGetValue) return defaultValue;
      try {
        const value = gmGetValue(key, defaultValue);
        if (value instanceof Promise) return defaultValue;
        return value as T | undefined;
      } catch {
        return defaultValue;
      }
    },

    async deleteValue(key: string): Promise<void> {
      if (mode === 'strict') {
        const fn = assertFunction(gmDeleteValue, ERROR_MESSAGES.deleteValue);
        await Promise.resolve(fn(key));
        return;
      }

      if (!gmDeleteValue) return;
      try {
        await Promise.resolve(gmDeleteValue(key));
      } catch {
        // Silent no-op
      }
    },

    async listValues(): Promise<string[]> {
      if (mode === 'strict') {
        const fn = assertFunction(gmListValues, ERROR_MESSAGES.listValues);
        const values = await Promise.resolve(fn());
        return Array.isArray(values) ? values : [];
      }

      if (!gmListValues) return [];
      try {
        const values = await Promise.resolve(gmListValues());
        return Array.isArray(values) ? values : [];
      } catch {
        return [];
      }
    },

    addStyle(css: string): HTMLStyleElement {
      if (mode === 'strict') {
        const fn = assertFunction(gmAddStyle, ERROR_MESSAGES.addStyle);
        return fn(css);
      }

      if (!gmAddStyle) {
        return fallbackAddStyle(css);
      }

      try {
        return gmAddStyle(css);
      } catch {
        return fallbackAddStyle(css);
      }
    },

    xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl {
      if (mode === 'strict') {
        const fn = assertFunction(gmXmlHttpRequest, ERROR_MESSAGES.xmlHttpRequest);
        return fn(details);
      }

      if (gmXmlHttpRequest) {
        try {
          return gmXmlHttpRequest(details);
        } catch {
          // Fall through to failure callbacks
        }
      }

      const response = createNetworkErrorResponse(details);
      scheduleUserscriptRequestFailureCallbacks(details, response);
      return { abort() {} };
    },

    notification(details: GMNotificationDetails): void {
      if (!gmNotification) return; // Silent no-op when unavailable
      try {
        gmNotification(details, undefined);
      } catch {
        // Silently ignore notification failures
      }
    },

    cookie: resolved.cookie,
  });
}

/**
 * Userscript API getter (external dependency encapsulation)
 *
 * Provides access to GM_* APIs in Tampermonkey environments.
 *
 * **Security Note**: Use Service Layer (PersistentStorage) for production code
 *
 * @returns UserscriptAPI object with all methods (frozen, immutable)
 *
 * @remarks
 * This function is intentionally non-throwing at resolution time.
 * Availability is validated per-method: calling a missing GM_* binding throws with
 * a standardized "GM_* unavailable" message (except for `notification()`, which
 * is a silent no-op when unsupported).
 * @internal Advanced/testing only
 */
export function getUserscript(): UserscriptAPI {
  return createUserscriptAPI('strict');
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
 * - addStyle() falls back to injecting a <style> element when DOM is available.
 * - xmlHttpRequest() invokes onerror/onloadend asynchronously and returns a no-op control.
 */
export function getUserscriptSafe(): UserscriptAPI {
  return createUserscriptAPI('safe');
}
