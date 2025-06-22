/**
 * @fileoverview 안정적인 DOM 선택자 상수
 * @description 트위터 UI 변경에 대응하는 다중 fallback 전략
 */

/**
 * 안정적인 DOM 선택자 상수
 * 트위터 UI 변경에 대응하는 다중 fallback 전략
 */
export const STABLE_SELECTORS = {
  // 트윗 컨테이너 (우선순위 순)
  TWEET_CONTAINERS: [
    'article[data-testid="tweet"]',
    'article[role="article"]',
    'div[data-testid="tweet"]',
    'article',
  ],

  // 미디어 플레이어 (다중 전략)
  MEDIA_PLAYERS: [
    '[data-testid="videoPlayer"]',
    '[data-testid="tweetVideo"]',
    '[data-testid="tweetPhoto"]',
    'video',
    '.media-container video',
    '[role="button"][aria-label*="video"]',
  ],

  // 이미지 컨테이너
  IMAGE_CONTAINERS: [
    '[data-testid="tweetPhoto"]',
    'a[href*="/photo/"]',
    'img[src*="pbs.twimg.com"]',
    'img[src*="twimg.com"]',
  ],

  // 미디어 링크
  MEDIA_LINKS: [
    'a[href*="/status/"][href*="/photo/"]',
    'a[href*="/status/"][href*="/video/"]',
    'a[data-testid="tweetPhoto"]',
  ],
} as const;
