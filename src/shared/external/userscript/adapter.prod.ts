import type { CookieAPI } from '@shared/types/core/cookie.types';
import type {
  BrowserEnvironment,
  GMNotificationDetails,
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
  GMXMLHttpRequestResponse,
} from '@shared/types/core/userscript';

type GMUserScriptInfo = Record<string, unknown>;

export type UserscriptManager = BrowserEnvironment['userscriptManager'];

export interface UserscriptAPI {
  readonly hasGM: boolean;
  readonly manager: UserscriptManager;
  info(): GMUserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  getValueSync<T>(key: string, defaultValue?: T): T | undefined;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
  addStyle(css: string): HTMLStyleElement;
  xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl;
  notification(details: GMNotificationDetails): void;
  readonly cookie: CookieAPI | undefined;
}

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

interface GlobalWithGM {
  GM_info?: unknown;
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

function detectManager(info: unknown): UserscriptManager {
  const handler = (info as { scriptHandler?: unknown } | null)?.scriptHandler;
  if (typeof handler !== 'string') return 'unknown';
  const h = handler.toLowerCase();
  if (h.includes('tamper')) return 'tampermonkey';
  if (h.includes('grease')) return 'greasemonkey';
  if (h.includes('violent')) return 'violentmonkey';
  return 'unknown';
}

function safeInfo(info: unknown): GMUserScriptInfo | null {
  if (info && typeof info === 'object') return info as GMUserScriptInfo;
  return null;
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

function scheduleXhrFailure(
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
  const notification =
    typeof GM_notification !== 'undefined'
      ? GM_notification
      : typeof global.GM_notification === 'function'
        ? global.GM_notification
        : undefined;
  const cookie =
    typeof GM_cookie !== 'undefined'
      ? GM_cookie
      : global.GM_cookie && typeof global.GM_cookie.list === 'function'
        ? global.GM_cookie
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
    notification,
    cookie,
  });
}

export function resolveGMDownload(): unknown {
  return resolveGMAPIs().download;
}

const REQUIRED_ERROR_MESSAGE = 'GM unavailable';

function assertFunction<T extends (...args: never[]) => unknown>(fn: T | undefined): T {
  if (typeof fn !== 'function') {
    throw new Error(REQUIRED_ERROR_MESSAGE);
  }
  return fn;
}

function normalizeFunction<T extends (...args: never[]) => unknown>(value: unknown): T | undefined {
  return typeof value === 'function' ? (value as T) : undefined;
}

type UserscriptMode = 'strict' | 'safe';

function createUserscriptImpl(mode: UserscriptMode): UserscriptAPI {
  const resolved = resolveGMAPIs();

  const gmDownload = normalizeFunction<NonNullable<GlobalWithGM['GM_download']>>(resolved.download);
  const gmSetValue = normalizeFunction<NonNullable<GlobalWithGM['GM_setValue']>>(resolved.setValue);
  const gmGetValue = normalizeFunction<NonNullable<GlobalWithGM['GM_getValue']>>(resolved.getValue);
  const gmDeleteValue = normalizeFunction<NonNullable<GlobalWithGM['GM_deleteValue']>>(
    resolved.deleteValue
  );
  const gmListValues = normalizeFunction<NonNullable<GlobalWithGM['GM_listValues']>>(
    resolved.listValues
  );
  const gmAddStyle = normalizeFunction<NonNullable<GlobalWithGM['GM_addStyle']>>(resolved.addStyle);
  const gmXmlHttpRequest = normalizeFunction<NonNullable<GlobalWithGM['GM_xmlhttpRequest']>>(
    resolved.xmlHttpRequest
  );
  const gmNotification = normalizeFunction<NonNullable<GlobalWithGM['GM_notification']>>(
    resolved.notification
  );

  const strict = mode === 'strict';
  const hasGM = Boolean(gmDownload || (gmSetValue && gmGetValue) || gmXmlHttpRequest);
  const info = resolved.info;

  return Object.freeze({
    hasGM,
    manager: detectManager(info),
    info: () => safeInfo(info),

    async download(url: string, filename: string): Promise<void> {
      if (strict) {
        const fn = assertFunction(gmDownload);
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
      if (strict) {
        const fn = assertFunction(gmSetValue);
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
      if (strict) {
        const fn = assertFunction(gmGetValue);
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
      if (strict) {
        const fn = assertFunction(gmDeleteValue);
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
      if (strict) {
        const fn = assertFunction(gmListValues);
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
      if (strict) {
        const fn = assertFunction(gmAddStyle);
        return fn(css);
      }

      if (!gmAddStyle) return fallbackAddStyle(css);
      try {
        return gmAddStyle(css);
      } catch {
        return fallbackAddStyle(css);
      }
    },

    xmlHttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl {
      if (strict) {
        const fn = assertFunction(gmXmlHttpRequest);
        return fn(details);
      }

      if (gmXmlHttpRequest) {
        try {
          return gmXmlHttpRequest(details);
        } catch {
          // Fall through
        }
      }

      const response: GMXMLHttpRequestResponse<unknown, unknown> = {
        finalUrl: details.url,
        readyState: 4,
        status: 0,
        statusText: '',
        responseHeaders: '',
        response: undefined,
        responseXML: null,
        responseText: '',
        context: details.context,
      };
      scheduleXhrFailure(details, response);
      return { abort() {} };
    },

    notification(details: GMNotificationDetails): void {
      if (!gmNotification) return;
      try {
        gmNotification(details, undefined);
      } catch {
        // Silent no-op
      }
    },

    cookie: resolved.cookie,
  });
}

export function getUserscript(): UserscriptAPI {
  return createUserscriptImpl('strict');
}

export function getUserscriptSafe(): UserscriptAPI {
  return createUserscriptImpl('safe');
}
