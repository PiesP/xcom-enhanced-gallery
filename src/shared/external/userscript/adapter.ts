/**
 * Userscript API Adapter (Tampermonkey/Greasemonkey/Violentmonkey)
 *
 * **Purpose**: Wrapper for Tampermonkey GM_* APIs
 * **Architecture**: Encapsulates external Userscript GM_* through getter function
 * **Scope**: Provides typed access to GM_* APIs when available
 * **Note**: GM_xmlhttpRequest restored (Phase 373) for cross-origin support.
 *
 * **Fallback Strategy**: None. GM_* APIs must be available at runtime.
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
import type { CookieAPI } from "@shared/types/core/cookie.types";
import type {
  BrowserEnvironment,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
} from "@shared/types/core/userscript";
import { isGMUserScriptInfo } from "@shared/utils/type-safety-helpers";

type GMUserScriptInfo = Record<string, unknown>;

export type UserscriptManager = BrowserEnvironment["userscriptManager"];

export interface UserscriptAPI {
  readonly hasGM: boolean;
  readonly manager: UserscriptManager;
  info(): GMUserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
  addStyle(css: string): HTMLStyleElement;
  xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl;
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
  GM_xmlhttpRequest?: (
    details: GMXMLHttpRequestDetails,
  ) => GMXMLHttpRequestControl;
  GM_cookie?: CookieAPI;
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
    const info = typeof GM_info !== "undefined" ? GM_info : global.GM_info;
    const handler = isGMUserScriptInfo(info)
      ? (info as { scriptHandler?: string })?.scriptHandler?.toLowerCase?.()
      : undefined;
    if (!handler) return "unknown";
    if (handler.includes("tamper")) return "tampermonkey";
    if (handler.includes("grease")) return "greasemonkey";
    if (handler.includes("violent")) return "violentmonkey";
    return "unknown";
  } catch {
    return "unknown";
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
    const info = typeof GM_info !== "undefined" ? GM_info : global.GM_info;
    return isGMUserScriptInfo(info)
      ? (info as unknown as GMUserScriptInfo)
      : null;
  } catch {
    return null;
  }
}

const ERROR_MESSAGES = {
  download:
    "GM_download not available - Tampermonkey/Greasemonkey environment required",
  setValue:
    "GM_setValue not available - Tampermonkey/Greasemonkey environment required",
  getValue:
    "GM_getValue not available - Tampermonkey/Greasemonkey environment required",
  deleteValue:
    "GM_deleteValue not available - Tampermonkey/Greasemonkey environment required",
  listValues:
    "GM_listValues not available - Tampermonkey/Greasemonkey environment required",
  addStyle:
    "GM_addStyle not available - Tampermonkey/Greasemonkey environment required",
  xmlHttpRequest:
    "GM_xmlhttpRequest not available - Tampermonkey/Greasemonkey environment required",
} as const;

function assertFunction<T extends (...args: never[]) => unknown>(
  fn: T | undefined,
  errorMessage: string,
): T {
  if (typeof fn !== "function") {
    throw new Error(errorMessage);
  }
  return fn;
}

/**
 * Userscript API getter (external dependency encapsulation)
 *
 * Provides access to GM_* APIs in Tampermonkey environments.
 *
 * **Security Note**: Use Service Layer (PersistentStorage) for production code
 *
 * @returns UserscriptAPI object with all methods (frozen, immutable)
 * @throws Error if required GM_* APIs are unavailable
 * @internal Advanced/testing only
 */
export function getUserscript(): UserscriptAPI {
  const global = globalThis as unknown as GlobalWithGM;

  // Check for injected GM_* APIs (Tampermonkey injects these into scope, not necessarily globalThis)
  const gmDownload =
    typeof GM_download !== "undefined"
      ? GM_download
      : typeof global.GM_download === "function"
        ? global.GM_download
        : undefined;
  const gmSetValue =
    typeof GM_setValue !== "undefined"
      ? GM_setValue
      : typeof global.GM_setValue === "function"
        ? global.GM_setValue
        : undefined;
  const gmGetValue =
    typeof GM_getValue !== "undefined"
      ? GM_getValue
      : typeof global.GM_getValue === "function"
        ? global.GM_getValue
        : undefined;
  const gmDeleteValue =
    typeof GM_deleteValue !== "undefined"
      ? GM_deleteValue
      : typeof global.GM_deleteValue === "function"
        ? global.GM_deleteValue
        : undefined;
  const gmListValues =
    typeof GM_listValues !== "undefined"
      ? GM_listValues
      : typeof global.GM_listValues === "function"
        ? global.GM_listValues
        : undefined;
  const gmAddStyle =
    typeof GM_addStyle !== "undefined"
      ? GM_addStyle
      : typeof global.GM_addStyle === "function"
        ? global.GM_addStyle
        : undefined;
  const gmXmlHttpRequest =
    typeof GM_xmlhttpRequest !== "undefined"
      ? GM_xmlhttpRequest
      : typeof global.GM_xmlhttpRequest === "function"
        ? global.GM_xmlhttpRequest
        : undefined;
  const gmCookie =
    typeof GM_cookie !== "undefined"
      ? GM_cookie
      : global.GM_cookie && typeof global.GM_cookie.list === "function"
        ? global.GM_cookie
        : undefined;

  const hasGM = Boolean(
    gmDownload || (gmSetValue && gmGetValue) || gmXmlHttpRequest,
  );

  return Object.freeze({
    hasGM,
    manager: detectManager(global),
    info: () => safeInfo(global),

    async download(url: string, filename: string): Promise<void> {
      const fn = assertFunction(gmDownload, ERROR_MESSAGES.download);
      fn(url, filename);
    },

    async setValue(key: string, value: unknown): Promise<void> {
      const fn = assertFunction(gmSetValue, ERROR_MESSAGES.setValue);
      await Promise.resolve(fn(key, value));
    },

    async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
      const fn = assertFunction(gmGetValue, ERROR_MESSAGES.getValue);
      const value = await Promise.resolve(fn(key, defaultValue));
      return value as T | undefined;
    },

    async deleteValue(key: string): Promise<void> {
      const fn = assertFunction(gmDeleteValue, ERROR_MESSAGES.deleteValue);
      await Promise.resolve(fn(key));
    },

    async listValues(): Promise<string[]> {
      const fn = assertFunction(gmListValues, ERROR_MESSAGES.listValues);
      const values = await Promise.resolve(fn());
      return Array.isArray(values) ? values : [];
    },

    addStyle(css: string): HTMLStyleElement {
      const fn = assertFunction(gmAddStyle, ERROR_MESSAGES.addStyle);
      return fn(css);
    },

    xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl {
      const fn = assertFunction(
        gmXmlHttpRequest,
        ERROR_MESSAGES.xmlHttpRequest,
      );
      return fn(details);
    },

    cookie: gmCookie,
  });
}
