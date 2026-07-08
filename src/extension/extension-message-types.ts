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
 * - The background SW is intentionally STATELESS and features-limited.
 *   It handles only: downloads (URL + blob URL), notifications, and
 *   cross-origin fetch proxying. All gallery state, media extraction,
 *   settings, theme, language/i18n, and DOM access live in the content
 *   script. If a new feature needs SW privileges (clipboard, printing,
 *   native messaging), the message protocol must be extended here.
 * - The FETCH_REQUEST message is defined but currently unused by any
 *   content-script code. The MV3HttpRequestAdapter uses fetch() directly
 *   in the content script. This handler is available if needed.
 * - URL downloads via twimg.com are restricted to the blob fallback
 *   path because the background SW lacks the auth cookies present in
 *   the content script context. `needsBlobFallback()` returns true.
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
  };
}

export interface FetchRequestMessage {
  readonly type: 'FETCH_REQUEST';
  readonly payload: {
    readonly url: string;
    readonly options?: {
      readonly method?: string;
      readonly headers?: Record<string, string>;
      readonly body?: string;
    };
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
  | FetchRequestMessage
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
