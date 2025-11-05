/**
 * @fileoverview DOM 선택자 상수
 */

export const SELECTORS = {
  TWEET: 'article[data-testid="tweet"]',
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  VIDEO_PLAYER: '[data-testid="videoPlayer"]',
  GALLERY_OVERLAY: '.xeg-gallery-overlay',
  GALLERY_CONTAINER: '.xeg-gallery-container',
} as const;

/**
 * 안정적인 DOM 선택자 (최적화됨 - Phase 335)
 */
export const STABLE_SELECTORS = {
  TWEET_CONTAINERS: ['article[data-testid="tweet"]'],
  MEDIA_CONTAINERS: ['[data-testid="tweetPhoto"]', '[data-testid="videoPlayer"]'],
  VIDEO_CONTAINERS: ['[data-testid="videoPlayer"]', 'video'],
  IMAGE_CONTAINERS: ['[data-testid="tweetPhoto"]', 'img[src*="pbs.twimg.com"]'],
  MEDIA_LINKS: ['a[href*="/status/"][href*="/photo/"]', 'a[href*="/status/"][href*="/video/"]'],
  MEDIA_VIEWERS: ['[data-testid="photoViewer"]', '[aria-modal="true"][data-testid="Drawer"]'],
  MEDIA_PLAYERS: ['[data-testid="videoPlayer"]', 'video'],
  ACTION_BUTTONS: {
    like: '[data-testid="like"]',
    retweet: '[data-testid="retweet"]',
    reply: '[data-testid="reply"]',
    share: '[data-testid="share"]',
    bookmark: '[data-testid="bookmark"]',
  },
  /** Phase 342: 인용 리트윗 선택자 */
  QUOTED_TWEET_ARTICLE: 'article[data-testid="tweet"] article[data-testid="tweet"]',
} as const;
