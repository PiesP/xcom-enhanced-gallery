// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { isValidMediaUrl } from '@shared/utils/url/validator';

/** Poster URLs are evidence of video media, never playable video variants. */
export function isVideoThumbnailUrl(url: string): boolean {
  if (!isValidMediaUrl(url)) return false;
  const path = new URL(url, 'https://x.com').pathname;
  return /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
    path
  );
}

/** Recognize pre-player previews without depending on translated labels. */
export function isVideoPreview(element: HTMLElement): boolean {
  const preview = element.closest('[data-testid="previewInterstitial"]');
  if (
    preview?.closest('[data-testid="tweetPhoto"]') &&
    preview.querySelector('[data-testid="playButton"]')
  ) {
    return true;
  }
  return element instanceof HTMLImageElement && isVideoThumbnailUrl(element.src);
}
