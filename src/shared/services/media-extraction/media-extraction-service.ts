import { SELECTORS } from '@constants/selectors';
import { logger } from '@shared/logging';
import {
  adjustClickedIndexAfterDeduplication,
  removeDuplicateMediaItems,
} from '@shared/media/media-utils';
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
    logger.info(`[MediaExtractor] ${extractionId}: Extraction started`);

    try {
      const tweetInfo = await this.tweetInfoExtractor.extract(element);

      if (!tweetInfo?.tweetId) {
        logger.warn(`[MediaExtractor] ${extractionId}: No tweet info found`);
        return this.createErrorResult('No tweet information found');
      }

      const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);

      if (apiResult.success && apiResult.mediaItems.length > 0) {
        return this.finalizeResult({
          ...apiResult,
          tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, apiResult.tweetInfo),
        });
      }

      logger.error(`[MediaExtractor] ${extractionId}: API extraction failed`);
      return this.createApiErrorResult(apiResult, tweetInfo);
    } catch (error) {
      logger.error(`[MediaExtractor] ${extractionId}: Extraction error`, error);
      return this.createErrorResult(error);
    }
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    try {
      const firstMedia = container.querySelector(SELECTORS.TWITTER_MEDIA) as HTMLElement;

      if (!firstMedia) {
        return this.createErrorResult('No media found in container');
      }

      return this.extractFromClickedElement(firstMedia, options);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  private generateExtractionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `simp_${crypto.randomUUID()}`;
    }
    return `simp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createErrorResult(error: unknown): MediaExtractionResult {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

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
