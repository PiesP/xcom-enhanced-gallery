/**
 * @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
 * @version 2.2.0 - Simplified
 */

import { getErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';
import { convertAPIMediaToMediaInfo } from '@shared/services/media/media-factory';
import { TwitterAPI } from '@shared/services/media/twitter-api-client';
import { determineClickedIndex } from '@shared/services/media-extraction/determine-clicked-index';
import {
  getElapsedTime,
  getTimestamp,
} from '@shared/services/media-extraction/utils/performance-timing';
import type {
  APIExtractor,
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfo,
} from '@shared/types/media.types';
import { extractTweetTextHTMLFromClickedElement } from '@shared/utils/media/tweet-extractor';

const createFailureResult = (error: string, startTime: number): MediaExtractionResult => ({
  success: false,
  mediaItems: [],
  clickedIndex: 0,
  metadata: {
    extractedAt: Date.now(),
    sourceType: 'twitter-api',
    strategy: 'api-extraction-failed',
    error,
    totalProcessingTime: getElapsedTime(startTime),
  },
  tweetInfo: null,
});

export class TwitterAPIExtractor implements APIExtractor {
  async extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    const startedAt = getTimestamp();

    try {
      if (__DEV__) {
        logger.debug(`[APIExtractor] ${extractionId}: Starting API extraction`, {
          tweetId: tweetInfo.tweetId,
        });
      }

      // Step 1: Fetch media from API
      const apiMedias = await TwitterAPI.getTweetMedias(tweetInfo.tweetId);

      if (!apiMedias || apiMedias.length === 0) {
        return createFailureResult('No media found in API response', startedAt);
      }

      // Step 2: Extract tweet text HTML
      const tweetTextHTML = extractTweetTextHTMLFromClickedElement(clickedElement);

      // Step 3: Transform API response to MediaInfo[]
      const mediaItems = await convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextHTML);

      // Step 4: Calculate which media user clicked
      const clickedIndex = determineClickedIndex(clickedElement, mediaItems);

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'twitter-api',
          strategy: 'api-extraction',
          totalProcessingTime: getElapsedTime(startedAt),
          apiMediaCount: apiMedias.length,
        },
        tweetInfo,
      };
    } catch (error) {
      if (__DEV__) {
        logger.warn(`[APIExtractor] ${extractionId}: API extraction failed:`, error);
      }
      return createFailureResult(getErrorMessage(error) || 'API extraction failed', startedAt);
    }
  }
}
