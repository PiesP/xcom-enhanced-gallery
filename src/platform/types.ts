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
  download(
    url: string,
    filename: string,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<void>;
  downloadBlob(
    blob: Blob,
    filename: string,
    signal?: AbortSignal,
    onObjectUrlReleased?: () => void
  ): Promise<void>;
  /**
   * Whether this runtime requires page-owned Blob handoff for a URL download.
   * Generated and supplied Blobs use downloadBlob independently of this policy.
   */
  needsBlobFallback(): boolean;
}

export interface NotificationAdapter {
  notify(title: string, message: string, imageUrl?: string): Promise<void>;
}

export interface HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl;
}

export type PlatformType = 'userscript' | 'mv3-extension';

// ── HTTP Request shared types ────────────────────────────────────────────────

export interface HttpRequestDetails {
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  readonly url: string;
  headers?: Record<string, string>;
  data?: string | FormData | Blob | ArrayBuffer | URLSearchParams | ReadableStream;
  responseType?: 'text' | 'json' | 'blob' | 'arraybuffer' | 'stream';
  /** Maximum bytes that may be buffered from the response body. */
  maxResponseBytes?: number;
  timeout?: number;
  onabort?: (response: HttpRequestResponse) => void;
  onerror?: (response: HttpRequestResponse) => void;
  onload?: (response: HttpRequestResponse) => void;
  ontimeout?: (response: HttpRequestResponse) => void;
  onprogress?: (response: HttpRequestProgressResponse) => void;
  /** Transport has settled and cannot materialize another response, even after caller abort. */
  onsettled?: () => void;
}

export interface HttpRequestResponse<TResponse = unknown> {
  readonly finalUrl: string;
  readonly readyState: number;
  readonly status: number;
  readonly statusText: string;
  readonly responseHeaders: string;
  readonly response: TResponse;
  readonly responseText: string;
  /** Safe transport metadata. Missing values were not observable. */
  readonly readable?: boolean;
  readonly retryAfterMs?: number;
  readonly errorCategory?: HttpErrorCategory;
}

export type HttpErrorCategory =
  | 'http'
  | 'network'
  | 'timeout'
  | 'abort'
  | 'resource_limit'
  | 'unreadable'
  | 'invalid_url';

export interface HttpRequestProgressResponse extends HttpRequestResponse {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
}

export interface HttpRequestControl {
  abort(): void;
}
