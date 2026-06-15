// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Performance-tuning constants, centralized for easy adjustment.
 * All values have been extracted from their original modules.
 */

/** Download timeout in milliseconds */
export const DOWNLOAD_TIMEOUT_MS = 30_000;

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
