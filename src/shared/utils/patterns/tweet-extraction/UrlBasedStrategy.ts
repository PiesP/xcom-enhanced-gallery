/**
 * @fileoverview URL 기반 트윗 정보 추출 전략
 * @description 현재 페이지 URL에서 트윗 정보를 추출하는 전략
 */

import { EXTRACTION_STRATEGY_PRIORITY } from '@core/constants/MEDIA_CONSTANTS';
import { logger } from '@infrastructure/logging/logger';
import type { TweetExtractionStrategy, TweetInfo } from './types';

/**
 * URL 기반 트윗 정보 추출 전략
 * 현재 페이지 URL에서 사용자 ID와 트윗 ID를 추출
 */
export class UrlBasedStrategy implements TweetExtractionStrategy {
  readonly name = 'UrlBasedStrategy';
  readonly priority = EXTRACTION_STRATEGY_PRIORITY.API_FIRST;

  /**
   * URL에서 트윗 정보 추출
   */
  extract(_tweetContainer: HTMLElement, _clickedElement?: HTMLElement): TweetInfo | null {
    try {
      const url = window.location.href;
      const pathname = window.location.pathname;

      logger.debug('[UrlBasedStrategy] URL에서 트윗 정보 추출 시도', { url, pathname });

      // X.com 트윗 URL 패턴: /{username}/status/{tweetId}
      const tweetMatch = pathname.match(/^\/([^/]+)\/status\/(\d+)/);
      if (tweetMatch?.[1] && tweetMatch?.[2]) {
        const username = tweetMatch[1];
        const tweetId = tweetMatch[2];

        const tweetInfo: TweetInfo = {
          tweetId: tweetId || `generated_${Date.now()}`,
          username: username.startsWith('@') ? username.slice(1) : username,
          tweetUrl: `https://x.com/${username}/status/${tweetId}`,
          url: `https://x.com/${username}/status/${tweetId}`,
          extractionMethod: 'url-based',
        };

        logger.debug('[UrlBasedStrategy] 트윗 정보 추출 성공', tweetInfo);
        return tweetInfo;
      }

      // 미디어 페이지 패턴: /{username}/status/{tweetId}/photo/{index} 또는 /video/{index}
      const mediaMatch = pathname.match(/^\/([^/]+)\/status\/(\d+)\/(photo|video)\/(\d+)/);
      if (mediaMatch?.[1] && mediaMatch?.[2] && mediaMatch?.[3] && mediaMatch?.[4]) {
        const username = mediaMatch[1];
        const tweetId = mediaMatch[2];
        const mediaType = mediaMatch[3];
        const mediaIndex = mediaMatch[4];

        const tweetInfo: TweetInfo = {
          tweetId: tweetId || `generated_${Date.now()}`,
          username: username.startsWith('@') ? username.slice(1) : username,
          tweetUrl: `https://x.com/${username}/status/${tweetId}`,
          url: `https://x.com/${username}/status/${tweetId}`,
          extractionMethod: 'url-based',
          mediaType: mediaType as 'photo' | 'video',
          mediaIndex: parseInt(mediaIndex, 10) || 0,
        };

        logger.debug('[UrlBasedStrategy] 미디어 페이지에서 트윗 정보 추출 성공', tweetInfo);
        return tweetInfo;
      }

      logger.debug('[UrlBasedStrategy] URL 패턴 매칭 실패');
      return null;
    } catch (error) {
      logger.error('[UrlBasedStrategy] 추출 실패:', error);
      return null;
    }
  }

  /**
   * 현재 페이지가 단일 미디어 페이지인지 확인
   */
  static isSingleMediaPage(): boolean {
    const pathname = window.location.pathname;
    return /\/(photo|video)\/\d+$/.test(pathname);
  }

  /**
   * 현재 페이지가 미디어 탭인지 확인
   */
  static isMediaTabPage(): boolean {
    const pathname = window.location.pathname;
    return /\/with_replies\/media$/.test(pathname);
  }

  /**
   * 백그라운드 로딩이 필요한 페이지인지 확인
   */
  static needsBackgroundLoading(): boolean {
    return this.isSingleMediaPage() || this.isMediaTabPage();
  }
}
