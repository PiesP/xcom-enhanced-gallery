// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Core Layer - UserScript Types (moved from Infrastructure)
 *
 * Provides type definitions specialized for UserScript API and browser environment.
 * These are interfaces with external systems (UserScript environment), so positioned in Core Layer.
 *
 * @module shared/types/core/userscript
 */

import type { CookieAPI } from './cookie.types';

declare global {
  function GM_download(url: string, filename: string): void;
  function GM_getValue<T = unknown>(name: string, defaultValue?: T): T;
  function GM_setValue(name: string, value: unknown): void;
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

  interface Window {
    GM_getValue?: typeof GM_getValue;
    GM_setValue?: typeof GM_setValue;
    GM_deleteValue?: typeof GM_deleteValue;
    GM_download?: typeof GM_download;
    GM_notification?: typeof GM_notification;
  }
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
  readonly url: string;
  headers?: Record<string, string>;
  data?: string | FormData | Blob | ArrayBuffer | URLSearchParams | ReadableStream;
  cookie?: string;
  binary?: boolean;
  nocache?: boolean;
  revalidate?: boolean;
  timeout?: number;
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

export interface GMXMLHttpRequestResponse<TResponse = unknown, TContext = unknown> {
  readonly finalUrl: string;
  readonly readyState: number;
  readonly status: number;
  readonly statusText: string;
  readonly responseHeaders: string;
  readonly response: TResponse;
  readonly responseXML?: Document | null;
  readonly responseText: string;
  readonly context: TContext;
}

export interface GMXMLHttpRequestProgressResponse extends GMXMLHttpRequestResponse {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
}

export interface GMXMLHttpRequestControl {
  abort(): void;
}
