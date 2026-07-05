// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Platform adapter type definitions.
 *
 * Defines the abstraction layer between the application and its runtime
 * environment (userscript vs MV3 extension). Each platform provides
 * concrete implementations of these interfaces.
 */

export interface StorageAdapter {
  get<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
  getSync?<T>(key: string, defaultValue?: T): T | undefined; // Optional — only userscript supports this
}

export interface DownloadAdapter {
  download(url: string, filename: string, headers?: Record<string, string>): Promise<void>;
  downloadBlob(blob: Blob, filename: string): Promise<void>;
  /**
   * Whether the adapter requires a blob-based fallback for downloads.
   *
   * MV3 background service workers cannot directly download from twimg.com
   * (CORS/auth restrictions), so the content script must fetch the resource
   * (which has cookies and host permissions) and pass the resulting blob to
   * the adapter. Userscript adapters can download URLs directly via GM_download.
   */
  needsBlobFallback(): boolean;
}

export interface NotificationAdapter {
  notify(title: string, message: string, imageUrl?: string): void;
}

export interface HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl;
}

export type PlatformType = 'userscript' | 'mv3-extension';

/**
 * Platform capability descriptor.
 * Exposed as public API for platform detection consumers.
 */
export interface PlatformCapabilities {
  type: PlatformType;
  storage: StorageAdapter;
  download: DownloadAdapter;
  notification: NotificationAdapter;
  httpRequest: HttpRequestAdapter;
}

// ── HTTP Request shared types ────────────────────────────────────────────────

export interface HttpRequestDetails {
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  readonly url: string;
  headers?: Record<string, string>;
  data?: string | FormData | Blob | ArrayBuffer | URLSearchParams | ReadableStream;
  responseType?: 'text' | 'json' | 'blob' | 'arraybuffer' | 'stream';
  timeout?: number;
  onabort?: (response: HttpRequestResponse) => void;
  onerror?: (response: HttpRequestResponse) => void;
  onload?: (response: HttpRequestResponse) => void;
  ontimeout?: (response: HttpRequestResponse) => void;
  onprogress?: (response: HttpRequestProgressResponse) => void;
}

export interface HttpRequestResponse<TResponse = unknown> {
  readonly finalUrl: string;
  readonly readyState: number;
  readonly status: number;
  readonly statusText: string;
  readonly responseHeaders: string;
  readonly response: TResponse;
  readonly responseText: string;
}

export interface HttpRequestProgressResponse extends HttpRequestResponse {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
}

export interface HttpRequestControl {
  abort(): void;
}
