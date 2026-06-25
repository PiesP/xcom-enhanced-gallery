// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
 */

import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { convertAPIMediaToMediaInfo } from '@shared/services/media/media-factory';
import { getTweetMedias } from '@shared/services/media/twitter-api-client';
import { determineClickedIndex } from '@shared/services/media-extraction/determine-clicked-index';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractorStrategy,
  TweetInfo,
} from '@shared/types/media.types';
import { createFailureResult } from '@shared/types/media.types';
import { extractTweetTextHTMLFromClickedElement } from '@shared/utils/dom/tweet-extractor';

export class TwitterAPIExtractor implements MediaExtractorStrategy {
  async extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    try {
      if (__DEV__) {
        logger.debug(`[APIExtractor] ${extractionId}: Starting API extraction`, {
          tweetId: tweetInfo.tweetId,
        });
      }

      // Step 1: Fetch media from API
      const apiMedias = await getTweetMedias(tweetInfo.tweetId);

      if (!apiMedias || apiMedias.length === 0) {
        return createFailureResult(
          'No media found in API response',
          'twitter-api',
          'api-extraction-failed'
        );
      }

      // Step 2: Extract tweet text content
      const tweetTextContent = extractTweetTextHTMLFromClickedElement(clickedElement);

      // Step 3: Transform API response to MediaInfo[]
      const mediaItems = convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextContent);

      // Step 4: Calculate which media user clicked
      const clickedIndex = determineClickedIndex(clickedElement, mediaItems);

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: performance.now(),
          sourceType: 'twitter-api',
          strategy: 'api-extraction',
          apiMediaCount: apiMedias.length,
        },
        tweetInfo,
      };
    } catch (error) {
      if (__DEV__) {
        logger.warn(`[APIExtractor] ${extractionId}: API extraction failed:`, error);
      }
      return createFailureResult(
        normalizeErrorMessage(error),
        'twitter-api',
        'api-extraction-failed'
      );
    }
  }
}
