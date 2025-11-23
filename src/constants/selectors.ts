/**
 * @fileoverview DOM selector constants
 */

import { CSS } from "@/constants/css";

const GALLERY_SELECTORS = CSS.SELECTORS;

export const SELECTORS = {
  TWEET: 'article[data-testid="tweet"]',
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  TWEET_TEXT: '[data-testid="tweetText"]',
  VIDEO_PLAYER: '[data-testid="videoPlayer"]',
  GALLERY_OVERLAY: GALLERY_SELECTORS.OVERLAY,
  GALLERY_CONTAINER: GALLERY_SELECTORS.CONTAINER,
} as const;

/**
 * Stable DOM selectors (optimized - Phase 335)
 */
export const STABLE_SELECTORS = {
  TWEET_CONTAINERS: ['article[data-testid="tweet"]'],
  MEDIA_CONTAINERS: [
    '[data-testid="tweetPhoto"]',
    '[data-testid="videoPlayer"]',
  ],
  VIDEO_CONTAINERS: ['[data-testid="videoPlayer"]', "video"],
  IMAGE_CONTAINERS: ['[data-testid="tweetPhoto"]', 'img[src*="pbs.twimg.com"]'],
  MEDIA_LINKS: [
    'a[href*="/status/"][href*="/photo/"]',
    'a[href*="/status/"][href*="/video/"]',
  ],
  MEDIA_VIEWERS: [
    '[data-testid="photoViewer"]',
    '[aria-modal="true"][data-testid="Drawer"]',
  ],
  MEDIA_PLAYERS: ['[data-testid="videoPlayer"]', "video"],
  ACTION_BUTTONS: {
    like: '[data-testid="like"]',
    retweet: '[data-testid="retweet"]',
    reply: '[data-testid="reply"]',
    share: '[data-testid="share"]',
    bookmark: '[data-testid="bookmark"]',
  },
  /** Phase 342: Quote tweet selectors */
  QUOTED_TWEET_ARTICLE:
    'article[data-testid="tweet"] article[data-testid="tweet"]',
} as const;
