// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
 */

import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { convertAPIMediaToMediaInfo } from '@shared/services/media/media-factory';
import { getTweetMedias, TwitterAPIRequestError } from '@shared/services/media/twitter-api-client';
import type { TweetMediaEntry } from '@shared/services/media/types';
import {
  captureClickedMediaEvidence,
  matchClickedMedia,
} from '@shared/services/media-extraction/determine-clicked-index';
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
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    try {
      if (__DEV__) {
        logger.debug(`[APIExtractor] ${extractionId}: Starting API extraction`, {
          tweetId: tweetInfo.tweetId,
        });
      }

      const clickEvidence =
        options.clickedMediaEvidence ?? captureClickedMediaEvidence(clickedElement);
      const tweetTextContent = extractTweetTextHTMLFromClickedElement(clickedElement);
      // Request failures are distinct from parsing, missing media and click matching.
      let apiMedias: TweetMediaEntry[];
      try {
        apiMedias = await getTweetMedias(tweetInfo.tweetId, undefined, options.signal);
      } catch (error) {
        return {
          ...createFailureResult(
            normalizeErrorMessage(error),
            'twitter-api',
            'api-extraction-failed'
          ),
          apiRequestOutcome:
            options.signal?.aborted || (error instanceof Error && error.name === 'AbortError')
              ? 'cancelled'
              : error instanceof TwitterAPIRequestError
                ? 'failed'
                : undefined,
        };
      }
      const healthyFailure = (message: string, strategy: string): MediaExtractionResult => ({
        ...createFailureResult(message, 'twitter-api', strategy),
        apiRequestOutcome: 'healthy',
      });

      if (!apiMedias || apiMedias.length === 0) {
        return healthyFailure('No media found in API response', 'api-media-unavailable');
      }

      // Step 3: Transform API response to MediaInfo[]
      const mediaItems = convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextContent);

      // Step 4: Calculate which media user clicked
      const match = matchClickedMedia(clickEvidence, mediaItems, tweetInfo.tweetId);
      if (match.status === 'contradictory') {
        return healthyFailure('API media does not match the clicked media', 'api-media-mismatch');
      }
      const clickedIndex = match.index;
      if (clickedIndex === null) {
        return healthyFailure(
          clickEvidence.mediaType === 'video'
            ? 'Insufficient evidence to select the clicked video'
            : 'Insufficient evidence to select the clicked media',
          'api-media-ambiguous'
        );
      }

      return {
        success: true,
        apiRequestOutcome: 'healthy',
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: performance.now(),
          sourceType: 'twitter-api',
          strategy: 'api-extraction',
          apiMediaCount: apiMedias.length,
          clickedMatch: match.status,
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
