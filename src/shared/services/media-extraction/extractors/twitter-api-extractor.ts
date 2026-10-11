// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
 */

import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import {
  convertAPIMediaToMediaInfo,
  getAPIMediaSelectionItems,
} from '@shared/services/media/media-factory';
import {
  TweetMetadataRequestError,
  TweetMetadataReuse,
  TwitterAPIRequestError,
} from '@shared/services/media/twitter-api-client';
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
  private readonly metadataReuse = new TweetMetadataReuse();

  invalidateMetadata(): void {
    this.metadataReuse.invalidate();
  }

  dispose(): void {
    this.metadataReuse.dispose();
  }

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
      let apiRequestToken: object | undefined;
      try {
        const requested = await this.metadataReuse.get(
          tweetInfo.tweetId,
          undefined,
          options.signal
        );
        apiMedias = requested.entries;
        apiRequestToken = requested.physicalRequestToken;
      } catch (error) {
        const cancelled =
          options.signal?.aborted ||
          ((error instanceof Error || error instanceof DOMException) &&
            error.name === 'AbortError');
        const requestError = error instanceof TwitterAPIRequestError ? error : null;
        return {
          ...createFailureResult(
            normalizeErrorMessage(error),
            'twitter-api',
            'api-extraction-failed'
          ),
          apiRequestOutcome: cancelled
            ? 'cancelled'
            : requestError
              ? requestError.category === 'mismatch'
                ? 'healthy'
                : 'failed'
              : undefined,
          ...(cancelled
            ? { failureKind: 'cancelled' as const }
            : requestError
              ? { failureKind: requestError.category }
              : {}),
          ...(error instanceof TweetMetadataRequestError
            ? { apiRequestToken: error.physicalRequestToken }
            : {}),
          ...(requestError?.retryAfterMs !== undefined
            ? { retryAfterMs: requestError.retryAfterMs }
            : {}),
          ...(requestError?.status !== undefined ? { apiHttpStatus: requestError.status } : {}),
          ...(requestError?.readable !== undefined
            ? { apiResponseReadable: requestError.readable }
            : {}),
        };
      }
      const healthyFailure = (message: string, strategy: string): MediaExtractionResult => ({
        ...createFailureResult(message, 'twitter-api', strategy),
        apiRequestOutcome: 'healthy',
        ...(apiRequestToken ? { apiRequestToken } : {}),
      });

      if (!apiMedias || apiMedias.length === 0) {
        return {
          ...healthyFailure('No media found in API response', 'api-media-unavailable'),
          failureKind: 'no-media',
        };
      }

      if (apiMedias.some((media) => media.availability === 'unsupported-hls')) {
        const selection = matchClickedMedia(
          clickEvidence,
          getAPIMediaSelectionItems(apiMedias, tweetInfo),
          tweetInfo.tweetId
        );
        if (selection.status === 'contradictory')
          return {
            ...healthyFailure('API media does not match the clicked media', 'api-media-mismatch'),
            failureKind: 'mismatch',
          };
        if (selection.index === null)
          return {
            ...healthyFailure(
              'Insufficient evidence to select the clicked media',
              'api-media-ambiguous'
            ),
            failureKind: 'owner-unconfirmed',
          };
        if (apiMedias[selection.index]?.availability === 'unsupported-hls') {
          return {
            ...healthyFailure(
              'The selected video only provides an unsupported HLS source',
              'api-media-unsupported'
            ),
            failureKind: 'unsupported-source',
          };
        }
      }

      // Step 3: Transform API response to MediaInfo[]
      const mediaItems = convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextContent);

      // Step 4: Calculate which media user clicked
      const match = matchClickedMedia(clickEvidence, mediaItems, tweetInfo.tweetId);
      if (match.status === 'contradictory') {
        return {
          ...healthyFailure('API media does not match the clicked media', 'api-media-mismatch'),
          failureKind: 'mismatch',
        };
      }
      const clickedIndex = match.index;
      if (clickedIndex === null) {
        return {
          ...healthyFailure(
            clickEvidence.mediaType === 'video'
              ? 'Insufficient evidence to select the clicked video'
              : 'Insufficient evidence to select the clicked media',
            'api-media-ambiguous'
          ),
          failureKind: 'owner-unconfirmed',
        };
      }

      return {
        success: true,
        apiRequestOutcome: 'healthy',
        ...(apiRequestToken ? { apiRequestToken } : {}),
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
