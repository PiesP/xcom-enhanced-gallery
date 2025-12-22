import { TWITTER_MEDIA_SELECTOR } from '@shared/dom/selectors';
import { getErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
  TweetInfo,
} from '@shared/types/media.types';
import { ExtractionError } from '@shared/types/media.types';
import { ErrorCode } from '@shared/types/result.types';
import { createPrefixedId } from '@shared/utils/id/create-id';
import {
  adjustClickedIndexAfterDeduplication,
  removeDuplicateMediaItems,
} from '@shared/utils/media/media-dimensions';

/**
 * Media Extraction Service
 * Orchestrates tweet metadata extraction and API-based media retrieval.
 */
export class MediaExtractionService implements MediaExtractor {
  private readonly tweetInfoExtractor: TweetInfoExtractor;
  private readonly apiExtractor: TwitterAPIExtractor;

  constructor() {
    this.tweetInfoExtractor = new TweetInfoExtractor();
    this.apiExtractor = new TwitterAPIExtractor();
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();
    if (__DEV__) {
      logger.info(`[MediaExtractor] ${extractionId}: Extraction started`);
    }

    try {
      const tweetInfo = await this.tweetInfoExtractor.extract(element);

      if (!tweetInfo?.tweetId) {
        if (__DEV__) {
          logger.warn(`[MediaExtractor] ${extractionId}: No tweet info found`);
        }
        return this.createErrorResult('No tweet information found');
      }

      const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);

      if (apiResult.success && apiResult.mediaItems.length > 0) {
        return this.finalizeResult({
          ...apiResult,
          tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, apiResult.tweetInfo),
        });
      }

      if (__DEV__) {
        logger.error('Extract api failed', extractionId);
      }
      return this.createApiErrorResult(apiResult, tweetInfo);
    } catch (error) {
      if (__DEV__) {
        logger.error('Extract failed', extractionId, error);
      }
      return this.createErrorResult(error);
    }
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    try {
      const firstMedia = container.querySelector(TWITTER_MEDIA_SELECTOR);

      if (!firstMedia || !(firstMedia instanceof HTMLElement)) {
        return this.createErrorResult('No media found in container');
      }

      return this.extractFromClickedElement(firstMedia, options);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  private generateExtractionId(): string {
    return createPrefixedId('simp');
  }

  private createErrorResult(error: unknown): MediaExtractionResult {
    const errorMessage = getErrorMessage(error) || 'Unknown error';

    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'extraction-failed',
        strategy: 'media-extraction',
        error: errorMessage,
      },
      tweetInfo: null,
      errors: [new ExtractionError(ErrorCode.NO_MEDIA_FOUND, errorMessage)],
    };
  }

  private createApiErrorResult(
    apiResult: MediaExtractionResult,
    tweetInfo: TweetInfo
  ): MediaExtractionResult {
    const apiErrorMessage =
      apiResult.metadata?.error ?? apiResult.errors?.[0]?.message ?? 'API extraction failed';

    const mergedTweetInfo = this.mergeTweetInfoMetadata(tweetInfo, apiResult.tweetInfo);

    return {
      success: false,
      mediaItems: [],
      clickedIndex: apiResult.clickedIndex ?? 0,
      metadata: {
        ...(apiResult.metadata ?? {}),
        strategy: 'api-extraction',
        sourceType: 'extraction-failed',
      },
      tweetInfo: mergedTweetInfo,
      errors: [new ExtractionError(ErrorCode.NO_MEDIA_FOUND, apiErrorMessage)],
    };
  }

  private finalizeResult(result: MediaExtractionResult): MediaExtractionResult {
    if (!result.success) return result;

    const uniqueItems = removeDuplicateMediaItems(result.mediaItems);

    if (uniqueItems.length === 0) {
      return { ...result, mediaItems: [], clickedIndex: 0 };
    }

    const adjustedIndex = adjustClickedIndexAfterDeduplication(
      result.mediaItems,
      uniqueItems,
      result.clickedIndex ?? 0
    );

    return {
      ...result,
      mediaItems: uniqueItems,
      clickedIndex: adjustedIndex,
    };
  }

  private mergeTweetInfoMetadata(
    base: TweetInfo | null | undefined,
    override: TweetInfo | null | undefined
  ): TweetInfo | null {
    if (!base) return override ?? null;
    if (!override) return base;

    return {
      ...base,
      ...override,
      metadata: {
        ...(base.metadata ?? {}),
        ...(override.metadata ?? {}),
      },
    };
  }
}
