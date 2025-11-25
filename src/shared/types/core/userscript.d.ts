/**
 * Core Layer - UserScript Types (moved from Infrastructure)
 *
 * Provides type definitions specialized for UserScript API and browser environment.
 * These are interfaces with external systems (UserScript environment), so positioned in Core Layer.
 */

import type { CookieAPI } from './cookie.types';

declare global {
  function GM_download(url: string, filename: string): void;
  function GM_getValue(name: string, defaultValue?: any): any;
  function GM_setValue(name: string, value: any): void;
  function GM_deleteValue(name: string): void;
  function GM_listValues(): string[];
  function GM_getResourceText(name: string): string;
  function GM_getResourceURL(name: string): string;
  function GM_addStyle(css: string): HTMLStyleElement;
  function GM_xmlhttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl;
  function GM_openInTab(
    url: string,
    options?: { active?: boolean; insert?: boolean; setParent?: boolean }
  ): void;
  function GM_registerMenuCommand(name: string, fn: () => void, accessKey?: string): number;
  function GM_unregisterMenuCommand(menuCmdId: number): void;
  function GM_notification(details: GMNotificationDetails, ondone?: () => void): void;
  function GM_notification(
    text: string,
    title?: string,
    image?: string,
    onclick?: () => void
  ): void;
  const GM_cookie: CookieAPI;

  const GM_info: UserScriptInfo;
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
  context?: any;
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

export interface GMXMLHttpRequestResponse {
  finalUrl: string;
  readyState: number;
  status: number;
  statusText: string;
  responseHeaders: string;
  response: any;
  responseXML?: Document | null;
  responseText: string;
  context: any;
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
  | 'GM_registerMenuCommand'
  | 'GM_setValue'
  | 'GM_getValue'
  | 'GM_download'
  | 'GM_openInTab'
  | 'GM_notification'
  | 'GM_addStyle'
  | 'GM_setClipboard'
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
