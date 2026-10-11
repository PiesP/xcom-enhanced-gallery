// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Shared message protocol types for the MV3 extension.
 *
 * Both the background service worker (SW) and the content script's
 * download adapter import these types. This single source of truth
 * ensures message shape changes are caught at compile time on both
 * sides of the message boundary.
 *
 * Architecture notes:
 * - The background SW is intentionally features-limited and keeps only the
 *   recoverable download relationship needed across worker restarts.
 *   It handles downloads (URL + blob URL), notifications, and that state.
 *   All gallery state, media extraction, settings, theme, language/i18n,
 *   and DOM access live in the content script. If a new feature needs SW
 *   privileges (clipboard, printing, native messaging, cross-origin fetch
 *   proxying), the message protocol must be extended here.
 * - Validated single-media URLs use browser-managed downloads. The browser
 *   owns their network transfer and persists a download ID for reconciliation.
 * - Blob URLs are created in the CONTENT SCRIPT context (not the SW)
 *   because content-script blob URLs persist with the page lifetime.
 *   SW-created blob URLs become invalid when the ephemeral SW is
 *   terminated by Chrome's MV3 idle timeout, causing silent download
 *   failures.
 */

// ── Message types ────────────────────────────────────────────────────────────

export interface DownloadRequestMessage {
  readonly type: 'DOWNLOAD_REQUEST';
  readonly payload: {
    readonly url: string;
    readonly filename: string;
    readonly headers?: Record<string, string>;
    readonly requestId?: string;
    /** New direct owner contract; absent for existing extension utility callers. */
    readonly mode?: 'direct';
  };
}

export interface DownloadBlobUrlRequestMessage {
  readonly type: 'DOWNLOAD_BLOB_URL_REQUEST';
  readonly payload: {
    /** Blob URL created in the CONTENT SCRIPT context via URL.createObjectURL() */
    readonly objectUrl: string;
    readonly filename: string;
    /** MIME type of the blob (e.g., 'image/jpeg', 'image/png'). */
    readonly mimeType?: string;
    readonly requestId?: string;
  };
}

export interface DownloadCancelRequestMessage {
  readonly type: 'DOWNLOAD_CANCEL_REQUEST';
  readonly payload: {
    readonly requestId: string;
    /** Initial URL for a direct request; Blob cancellation leaves this absent. */
    readonly url?: string;
  };
}

export interface DownloadBlobStatusRequestMessage {
  readonly type: 'DOWNLOAD_BLOB_STATUS_REQUEST';
  readonly payload: {
    readonly requestId: string;
    readonly objectUrl: string;
    /** Reasserts a user abort if a worker restart lost a pre-ID cancellation marker. */
    readonly cancelRequested?: boolean;
  };
}

export interface DownloadDirectStatusRequestMessage {
  readonly type: 'DOWNLOAD_DIRECT_STATUS_REQUEST';
  readonly payload: {
    readonly requestId: string;
    readonly url: string;
    readonly cancelRequested?: boolean;
  };
}

export interface ShowNotificationMessage {
  readonly type: 'SHOW_NOTIFICATION';
  readonly payload: {
    readonly id: string;
    readonly title: string;
    readonly message: string;
    readonly imageUrl?: string;
  };
}

// ── Message union ─────────────────────────────────────────────────────────────

export type IncomingMessage =
  | DownloadRequestMessage
  | DownloadBlobUrlRequestMessage
  | DownloadBlobStatusRequestMessage
  | DownloadDirectStatusRequestMessage
  | DownloadCancelRequestMessage
  | ShowNotificationMessage;

// ── Response ──────────────────────────────────────────────────────────────────

/**
 * Standard response shape for all extension messages.
 * Both sides agree on this shape — changes here must be reflected
 * in both the SW's respondAsync handler and the adapter's response check.
 */
export interface ExtensionMessageResponse {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: unknown;
}

/** Lifecycle metadata returned when the background cannot confirm completion. */
export interface DownloadLifecycleResponse {
  readonly requestId?: string;
  readonly terminal: boolean;
}

export interface DownloadBlobStatusResponse {
  readonly requestId: string;
  readonly status: 'terminal' | 'active' | 'unknown';
}

export interface DownloadDirectStatusResponse {
  readonly requestId: string;
  readonly status: 'never-started' | 'active' | 'complete' | 'interrupted' | 'unknown';
  readonly reason?: 'browser-rejected' | 'browser-interrupted' | 'user-cancelled' | 'timeout';
}
