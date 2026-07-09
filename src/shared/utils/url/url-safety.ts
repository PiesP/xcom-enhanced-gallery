// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Centralized SSRF-prevention URL whitelist.
 *
 * Single source of truth for ALLOWED_HOSTS so that both the MV3 background
 * SW and the GM HTTP request adapter enforce the same policy. Never
 * independently maintain a duplicate host list elsewhere.
 */

import { MEDIA } from '@constants/media';
import { TWITTER_HOSTS } from './host';

/**
 * Canonical set of hostnames allowed for cross-origin requests.
 * Shared by the MV3 background SW and the GM HTTP request adapter.
 * Do NOT duplicate this set elsewhere — import it.
 */
const ALLOWED_HOSTS: ReadonlySet<string> = new Set([...TWITTER_HOSTS, ...MEDIA.DOMAINS]);

/**
 * Validate that a URL targets an allowed host, with additional path-level
 * restriction for Twitter hosts (only /i/api/ paths are permitted).
 *
 * DESIGN NOTE: Twitter/X hosts are restricted to /i/api/ paths because
 * the download relay only handles media downloads (which use the API).
 * Non-API URLs (e.g., https://twitter.com/some-tweet) are intentionally
 * blocked. Media downloads from pbs.twimg.com and video.twimg.com always
 * pass since those domains are in MEDIA.DOMAINS and bypass the path check.
 * If non-API downloads from twitter.com/x.com are needed in the future,
 * this path restriction must be relaxed or extended.
 *
 * @param url - The URL to validate
 * @returns true if the URL is valid and its host is in the allowed whitelist
 *          (with Twitter path restrictions applied)
 */
export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return false;
    }
    // Restrict Twitter hosts to GraphQL API paths only
    if (TWITTER_HOSTS.includes(parsed.hostname as (typeof TWITTER_HOSTS)[number])) {
      return parsed.pathname.startsWith('/i/api/');
    }
    return true;
  } catch {
    return false;
  }
}
