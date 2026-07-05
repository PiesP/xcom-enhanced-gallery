// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Performance-tuning constants, centralized for easy adjustment.
 * All values have been extracted from their original modules.
 */

/** Download timeout in milliseconds — aligned with the background SW 5-minute timeout */
export const DOWNLOAD_TIMEOUT_MS = 300_000;

/** Default request timeout for fetch-based downloads */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/** Maximum concurrent download workers */
export const MAX_CONCURRENCY = 8;

/** Minimum concurrent download workers */
export const MIN_CONCURRENCY = 1;

/** Default concurrent download workers */
export const DEFAULT_CONCURRENCY = 4;

/** Default retry count for download operations */
export const DEFAULT_RETRIES = 3;

/** Backoff base time in milliseconds */
export const DEFAULT_BACKOFF_BASE_MS = 200;

/** BFS max depth for finding media elements in DOM */
export const MAX_DESCENDANT_DEPTH = 6;

/** Max ancestor hops for extracting background-image URLs */
export const MAX_ANCESTOR_HOPS = 3;

/** Default prefetch cache size (number of entries) */
export const PREFETCH_CACHE_SIZE = 20;

/** CSS animation timeout fallback in milliseconds (safety net if animationend doesn't fire) */
export const ANIMATION_TIMEOUT_MS = 500;

/**
 * Minimum time (ms) the download-indicator state remains visible.
 * Prevents visual flicker for very fast downloads.
 */
export const DOWNLOAD_MIN_DISPLAY_TIME_MS = 300;

/**
 * Default deadline (ms) for `scheduler.yield()` fallback (`setTimeout`).
 * 50ms ≈ 20fps — keeps the UI responsive during long-running tasks.
 */
export const SCHEDULER_YIELD_DEADLINE_MS = 50;

/**
 * Maximum allowed URL length for media validation.
 * Twitter/X media URLs rarely exceed 200 chars; 2048 provides headroom
 * for query parameters while blocking abuse / malformed input.
 */
export const MAX_MEDIA_URL_LENGTH = 2048;

/**
 * Delay (ms) before revoking a blob object URL after the background SW
 * confirms it has started the download. This prevents a race condition
 * where Chrome's download manager hasn't begun reading the blob data
 * before the URL is revoked, resulting in 0-byte or corrupted files.
 *
 * 2000ms is conservative — Chrome typically starts reading blobs within
 * a few hundred ms, but the delay only affects cleanup (JS heap) not
 * user-facing latency, so a generous margin is safe.
 */
export const BLOB_URL_REVOKE_DELAY_MS = 2_000;
