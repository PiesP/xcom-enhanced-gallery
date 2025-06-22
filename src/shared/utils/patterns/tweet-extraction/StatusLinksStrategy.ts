/**
 * @fileoverview Status Links Tweet Extraction Strategy
 * @description 상태 링크에서 트윗 정보를 추출하는 전략
 */

import { logger } from '@infrastructure/logging/logger';
import { extractTweetInfoFromUrl } from '../url-patterns';
import type { TweetExtractionStrategy, TweetInfo } from './types';

export class StatusLinksStrategy implements TweetExtractionStrategy {
  readonly name = 'status-links';
  readonly priority = 2;

  extract(tweetContainer: HTMLElement): TweetInfo | null {
    logger.debug('[StatusLinksStrategy] 상태 링크에서 추출 시작');

    // status URL이 포함된 링크들을 찾습니다
    const statusLinks = tweetContainer.querySelectorAll('a[href*="/status/"]');

    for (const link of Array.from(statusLinks)) {
      const href = (link as HTMLAnchorElement).href;
      if (href) {
        const tweetInfo = extractTweetInfoFromUrl(href);
        if (tweetInfo) {
          logger.debug('[StatusLinksStrategy] 상태 링크에서 추출 성공', tweetInfo);
          return tweetInfo;
        }
      }
    }

    logger.debug('[StatusLinksStrategy] 상태 링크에서 추출 실패');
    return null;
  }
}
