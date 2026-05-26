// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview DOM selector constants for X.com elements. */

import { CSS } from '@constants/css';

const GALLERY_SELECTORS = CSS.SELECTORS;

export const TWEET_SELECTOR = 'article[data-testid="tweet"]' as const;
export const TWEET_PHOTO_SELECTOR = '[data-testid="tweetPhoto"]' as const;
export const TWEET_TEXT_SELECTOR = '[data-testid="tweetText"]' as const;
export const VIDEO_PLAYER_SELECTOR = '[data-testid="videoPlayer"]' as const;
export const VIDEO_PLAYER_CONTEXT_SELECTOR =
  `${VIDEO_PLAYER_SELECTOR},[data-testid="videoComponent"],[data-testid="videoPlayerControls"],[data-testid="videoPlayerOverlay"],[role="application"],[aria-label*="Video"]` as const;
export const STATUS_LINK_SELECTOR = 'a[href*="/status/"]' as const;
export const TWITTER_MEDIA_SELECTOR =
  'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]' as const;
export const GALLERY_OVERLAY_SELECTOR = GALLERY_SELECTORS.OVERLAY;

export const TWEET_CONTAINER_SELECTORS = [TWEET_SELECTOR, 'article[role="article"]'] as const;
export const MEDIA_CONTAINER_SELECTORS = [TWEET_PHOTO_SELECTOR, VIDEO_PLAYER_SELECTOR] as const;
export const VIDEO_CONTAINER_SELECTORS = [VIDEO_PLAYER_SELECTOR, 'video'] as const;
export const IMAGE_CONTAINER_SELECTORS = [
  TWEET_PHOTO_SELECTOR,
  'img[src*="pbs.twimg.com"]',
] as const;
export const MEDIA_VIEWER_SELECTORS = [
  '[data-testid="photoViewer"]',
  '[aria-modal="true"][data-testid="Drawer"]',
  '[aria-roledescription="carousel"]',
] as const;
