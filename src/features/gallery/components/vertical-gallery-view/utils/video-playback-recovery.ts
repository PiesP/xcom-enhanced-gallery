// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaInfo } from '@shared/types/media.types';
import { isUrlAllowed, MEDIA_URL_POLICY } from '@shared/utils/url/safety';

/** Includes the preferred initial source. No source is attempted twice. */
export const MAX_VIDEO_PLAYBACK_ATTEMPTS = 3;

function isOwnedMp4Variant(url: string): boolean {
  if (!isUrlAllowed(url, MEDIA_URL_POLICY)) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'video.twimg.com' &&
      !parsed.username &&
      !parsed.password &&
      !parsed.hash &&
      parsed.pathname.toLowerCase().endsWith('.mp4')
    );
  } catch {
    return false;
  }
}

/** The parser already binds variants to one item; revalidate their render sink here. */
export function nextVideoPlaybackSource(
  media: MediaInfo,
  attempted: ReadonlySet<string>
): string | null {
  if (attempted.size >= MAX_VIDEO_PLAYBACK_ATTEMPTS) {
    return null;
  }
  for (const variant of media.videoVariants ?? []) {
    if (
      variant.contentType === 'video/mp4' &&
      !attempted.has(variant.url) &&
      isOwnedMp4Variant(variant.url)
    ) {
      return variant.url;
    }
  }
  return null;
}

/** An exposed HTTP denial is authoritative; opaque media errors remain unknown. */
export function hasKnownVideoAccessDenial(url: string, sourceAttachedAt: number): boolean {
  if (typeof performance?.getEntriesByName !== 'function') {
    return false;
  }
  try {
    const entries = performance.getEntriesByName(url, 'resource');
    const latest = entries.at(-1) as
      | (PerformanceResourceTiming & { responseStatus?: number })
      | undefined;
    if (
      !latest ||
      latest.startTime < sourceAttachedAt ||
      performance.now() - latest.startTime > 120_000
    ) {
      return false;
    }
    return latest.responseStatus === 401 || latest.responseStatus === 403;
  } catch {
    return false;
  }
}

export function isRecoverableVideoError(code: number | undefined): boolean {
  return code === 3 || code === 4;
}
