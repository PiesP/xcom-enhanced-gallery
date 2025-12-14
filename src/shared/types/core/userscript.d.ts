/**
 * Core Layer - UserScript Types (moved from Infrastructure)
 *
 * Provides type definitions specialized for UserScript API and browser environment.
 * These are interfaces with external systems (UserScript environment), so positioned in Core Layer.
 */

import type { CookieAPI } from './cookie.types';

/**
 * GM storage value type - JSON-serializable values supported by UserScript storage
 * Note: Using unknown for compatibility with various storage patterns.
 * Values are typically JSON-serialized before storage.
 */
export type GMStorageValue = unknown;

declare global {
  function GM_download(url: string, filename: string): void;

  /**
   * Get a value from userscript storage
   * @template T - Expected return type
   * @param name - Storage key name
   * @param defaultValue - Default value if key doesn't exist
   * @returns The stored value or default
   */
  function GM_getValue<T = unknown>(name: string, defaultValue?: T): T;

  /**
   * Set a value in userscript storage
   * Values are JSON-serialized. Supported types: string, number, boolean, object, array, null
   * @param name - Storage key name
   * @param value - Value to store (must be JSON-serializable)
   */
  function GM_setValue(name: string, value: GMStorageValue): void;

  function GM_deleteValue(name: string): void;
  function GM_listValues(): string[];
  function GM_addStyle(css: string): HTMLStyleElement;
  function GM_xmlhttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl;
  function GM_notification(details: GMNotificationDetails, ondone?: () => void): void;
  function GM_notification(
    text: string,
    title?: string,
    image?: string,
    onclick?: () => void
  ): void;
  const GM_cookie: CookieAPI;

  const GM_info: UserScriptInfo;

  /**
   * Window interface extension for accessing GM functions from window object
   * Used when direct global access is not available
   */
  interface Window {
    GM_getValue?: typeof GM_getValue;
    GM_setValue?: typeof GM_setValue;
    GM_deleteValue?: typeof GM_deleteValue;
    GM_download?: typeof GM_download;
    GM_notification?: typeof GM_notification;
  }
}

/**
 * UserScript script information interface
 */
export interface UserScriptInfo {
  script: {
    author: string;
    copyright: string;
    description: string;
    excludes: string[];
    homepage: string;
    icon: string;
    icon64: string;
    includes: string[];
    lastModified: number;
    matches: string[];
    name: string;
    namespace: string;
    position: number;
    resources: Array<{
      name: string;
      url: string;
      error?: string;
      content?: string;
    }>;
    'run-at': string;
    supportURL: string;
    system?: boolean;
    unwrap: boolean;
    version: string;
  };
  scriptMetaStr: string;
  scriptSource: string;
  scriptUpdateURL: string;
  scriptWillUpdate: boolean;
  scriptHandler: string;
  isIncognito: boolean;
  downloadMode: string;
  version: string;
}

/**
 * Browser environment detection utility type
 */
export interface BrowserEnvironment {
  /** Active UserScript manager */
  userscriptManager: 'tampermonkey' | 'greasemonkey' | 'violentmonkey' | 'unknown';
  /** Browser type */
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  /** Development mode flag */
  isDevelopment: boolean;
}

export interface GMNotificationDetails {
  title?: string | undefined;
  text?: string | undefined;
  image?: string | undefined;
  timeout?: number | undefined;
  onclick?: (() => void) | undefined;
}

export interface GMXMLHttpRequestDetails {
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  data?: string | FormData | Blob | ArrayBuffer | URLSearchParams | ReadableStream;
  cookie?: string;
  binary?: boolean;
  nocache?: boolean;
  revalidate?: boolean;
  timeout?: number;
  /** Custom context passed to response callbacks */
  context?: unknown;
  responseType?: 'text' | 'json' | 'blob' | 'arraybuffer' | 'stream';
  overrideMimeType?: string;
  anonymous?: boolean;
  fetch?: boolean;
  user?: string;
  password?: string;
  onabort?: (response: GMXMLHttpRequestResponse) => void;
  onerror?: (response: GMXMLHttpRequestResponse) => void;
  onload?: (response: GMXMLHttpRequestResponse) => void;
  onloadend?: (response: GMXMLHttpRequestResponse) => void;
  onloadstart?: (response: GMXMLHttpRequestResponse) => void;
  onprogress?: (response: GMXMLHttpRequestProgressResponse) => void;
  onreadystatechange?: (response: GMXMLHttpRequestResponse) => void;
  ontimeout?: (response: GMXMLHttpRequestResponse) => void;
}

/**
 * GM_xmlhttpRequest response type
 * @template TResponse - Response body type (depends on responseType)
 * @template TContext - Context type passed from request
 */
export interface GMXMLHttpRequestResponse<TResponse = unknown, TContext = unknown> {
  finalUrl: string;
  readyState: number;
  status: number;
  statusText: string;
  responseHeaders: string;
  /** Response body - type depends on responseType setting */
  response: TResponse;
  responseXML?: Document | null;
  responseText: string;
  /** Custom context passed from request */
  context: TContext;
}

export interface GMXMLHttpRequestProgressResponse extends GMXMLHttpRequestResponse {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

export interface GMXMLHttpRequestControl {
  abort(): void;
}

/**
 * UserScript grant type
 * Phase 318.1: GM_xmlhttpRequest removed (MV3 incompatible) -> Phase 373: GM_xmlhttpRequest restored
 */
export type UserScriptGrant =
  | 'GM_setValue'
  | 'GM_getValue'
  | 'GM_download'
  | 'GM_notification'
  | 'GM_addStyle'
  | 'GM_cookie'
  | 'GM_xmlhttpRequest';

/**
 * UserScript connect permission type
 */
export type UserScriptConnect = 'pbs.twimg.com' | 'video.twimg.com' | '*.x.com' | 'x.com';

/**
 * UserScript run-at timing type
 */
export type UserScriptRunAt = 'document-start' | 'document-body' | 'document-end' | 'document-idle';

/**
 * UserScript metadata interface
 */
export interface UserScriptMetadata {
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  match: string[];
  grant: UserScriptGrant[];
  connect: UserScriptConnect[];
  'run-at': UserScriptRunAt;
  supportURL: string;
  downloadURL: string;
  updateURL: string;
  noframes?: boolean;
}
