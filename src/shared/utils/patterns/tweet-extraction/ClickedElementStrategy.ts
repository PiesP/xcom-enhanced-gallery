/**
 * @fileoverview Clicked Element Tweet Extraction Strategy
 * @description 클릭된 요소에서 트윗 정보를 추출하는 전략
 */

import { logger } from '@infrastructure/logging/logger';
import { extractTweetInfoFromUrl } from '../url-patterns';
import type { TweetExtractionStrategy, TweetInfo } from './types';

export class ClickedElementStrategy implements TweetExtractionStrategy {
  readonly name = 'clicked-element';
  readonly priority = 1;

  extract(_tweetContainer: HTMLElement, clickedElement?: HTMLElement): TweetInfo | null {
    if (!clickedElement) {
      return null;
    }

    logger.debug('[ClickedElementStrategy] 클릭된 요소에서 추출 시작');

    // 1. 트위터 미디어 란 특화: data-testid="tweetPhoto" 처리
    const tweetPhotoContainer = clickedElement.closest('[data-testid="tweetPhoto"]');
    if (tweetPhotoContainer) {
      const result = this.extractFromTweetPhoto(tweetPhotoContainer);
      if (result) return result;
    }

    // 2. 클릭된 요소에서 직접 링크 추출
    const directResult = this.extractFromDirectLinks(clickedElement);
    if (directResult) return directResult;

    // 3. 부모 요소들을 순회하며 링크 찾기
    const ancestorResult = this.extractFromAncestors(clickedElement);
    if (ancestorResult) return ancestorResult;

    return null;
  }

  private extractFromTweetPhoto(container: Element): TweetInfo | null {
    const mediaLinks = container.querySelectorAll(
      'a[href*="/photo/"], a[href*="/video/"], a[href*="/status/"]'
    );

    for (const link of Array.from(mediaLinks)) {
      const href = (link as HTMLAnchorElement).href;
      if (href) {
        const tweetInfo = extractTweetInfoFromUrl(href);
        if (tweetInfo) {
          logger.debug('[ClickedElementStrategy] 트윗포토에서 추출 성공', tweetInfo);
          return tweetInfo;
        }
      }
    }

    return null;
  }

  private extractFromDirectLinks(element: HTMLElement): TweetInfo | null {
    // 클릭된 요소가 링크인 경우
    if (element.tagName === 'A') {
      const href = (element as HTMLAnchorElement).href;
      if (href) {
        const tweetInfo = extractTweetInfoFromUrl(href);
        if (tweetInfo) {
          logger.debug('[ClickedElementStrategy] 직접 링크에서 추출 성공', tweetInfo);
          return tweetInfo;
        }
      }
    }

    // 클릭된 요소 내부의 링크들 확인
    const internalLinks = element.querySelectorAll('a[href*="/status/"]');
    for (const link of Array.from(internalLinks)) {
      const href = (link as HTMLAnchorElement).href;
      if (href) {
        const tweetInfo = extractTweetInfoFromUrl(href);
        if (tweetInfo) {
          logger.debug('[ClickedElementStrategy] 내부 링크에서 추출 성공', tweetInfo);
          return tweetInfo;
        }
      }
    }

    return null;
  }

  private extractFromAncestors(element: HTMLElement): TweetInfo | null {
    let currentElement: HTMLElement | null = element;

    while (currentElement && currentElement !== document.body) {
      // 부모 요소가 링크인 경우
      if (currentElement.tagName === 'A') {
        const href = (currentElement as HTMLAnchorElement).href;
        if (href) {
          const tweetInfo = extractTweetInfoFromUrl(href);
          if (tweetInfo) {
            logger.debug('[ClickedElementStrategy] 조상 링크에서 추출 성공', tweetInfo);
            return tweetInfo;
          }
        }
      }

      // 부모 요소 내부의 링크들 확인
      const parentLinks = currentElement.querySelectorAll('a[href*="/status/"]');
      for (const link of Array.from(parentLinks)) {
        const href = (link as HTMLAnchorElement).href;
        if (href) {
          const tweetInfo = extractTweetInfoFromUrl(href);
          if (tweetInfo) {
            logger.debug('[ClickedElementStrategy] 부모 내부 링크에서 추출 성공', tweetInfo);
            return tweetInfo;
          }
        }
      }

      currentElement = currentElement.parentElement;
    }

    return null;
  }
}
