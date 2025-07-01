/**
 * @fileoverview 기존 코드와의 호환성을 위한 래퍼 함수들
 * @description 기존 extractTweetInfoUnified와 호환되는 인터페이스 제공
 * @version 2.0.0 - Migration compatibility layer
 */

import { logger } from '../../../../infrastructure/logging/logger';
import { UnifiedTweetIdExtractor, type TweetExtractionResult } from './UnifiedTweetIdExtractor';
import type { TweetInfo } from './types';

/**
 * 기존 extractTweetInfoUnified 함수와 호환되는 래퍼
 * @deprecated 새로운 코드에서는 UnifiedTweetIdExtractor.extractTweetId를 직접 사용하세요
 */
export function extractTweetInfoUnified(
  tweetContainer: HTMLElement | null,
  clickedElement?: HTMLElement
): TweetInfo | null {
  logger.warn(
    '[DEPRECATED] extractTweetInfoUnified 사용 중. UnifiedTweetIdExtractor로 마이그레이션하세요.'
  );

  const element = clickedElement || tweetContainer;
  if (!element) return null;

  const result = UnifiedTweetIdExtractor.extractTweetId(element);
  if (!result) return null;

  // TweetExtractionResult를 TweetInfo로 변환
  return {
    tweetId: result.tweetId,
    username: result.username || '',
    tweetUrl: result.tweetUrl,
    url: result.tweetUrl,
    extractionMethod: result.extractionMethod,
  };
}

/**
 * TweetExtractionResult를 레거시 TweetInfo로 변환
 */
export function convertToLegacyTweetInfo(result: TweetExtractionResult): TweetInfo {
  return {
    tweetId: result.tweetId,
    username: result.username || '',
    tweetUrl: result.tweetUrl,
    url: result.tweetUrl,
    extractionMethod: result.extractionMethod,
  };
}

/**
 * 간소화된 트윗 정보 추출 (호환성용)
 * @deprecated UnifiedTweetIdExtractor.extractTweetId 사용하세요
 */
export function extractSimpleTweetInfo(clickedElement?: HTMLElement): TweetInfo | null {
  logger.warn(
    '[DEPRECATED] extractSimpleTweetInfo 사용 중. UnifiedTweetIdExtractor로 마이그레이션하세요.'
  );

  if (!clickedElement) return null;

  const result = UnifiedTweetIdExtractor.extractTweetId(clickedElement);
  return result ? convertToLegacyTweetInfo(result) : null;
}
