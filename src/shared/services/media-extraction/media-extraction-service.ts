// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { TWITTER_MEDIA_SELECTOR } from '@constants/selectors';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { createPrefixedId } from '@shared/services/event-manager';
import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
  TweetInfo,
} from '@shared/types/media.types';
import { ErrorCode, ExtractionError } from '@shared/types/media.types';
import {
  adjustClickedIndexAfterDeduplication,
  removeDuplicateMediaItems,
} from '@shared/utils/media/media-dimensions';

const generateExtractionId = (): string => createPrefixedId('simp');

// Circuit breaker state for Twitter API — module-level to survive service re-initialization
let apiFailureCount = 0;
let apiCircuitOpen = false;
let lastApiFailureTime = 0;
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 60_000; // 1 minute

function isApiCircuitOpen(): boolean {
  if (!apiCircuitOpen) return false;
  if (Date.now() - lastApiFailureTime > CIRCUIT_RESET_MS) {
    apiCircuitOpen = false;
    apiFailureCount = 0;
    return false;
  }
  return true;
}

function recordApiFailure(): void {
  apiFailureCount++;
  lastApiFailureTime = Date.now();
  if (apiFailureCount >= CIRCUIT_THRESHOLD) {
    apiCircuitOpen = true;
    __DEV__ && logger.warn('[MediaExtractor] API circuit opened after repeated failures');
  }
}

function createErrorResult(
  error: unknown,
  code: ErrorCode = ErrorCode.NO_MEDIA_FOUND
): MediaExtractionResult {
  const errorMessage = normalizeErrorMessage(error);
  return {
    success: false,
    mediaItems: [],
    clickedIndex: 0,
    metadata: {
      extractedAt: performance.now(),
      sourceType: 'extraction-failed',
      strategy: 'media-extraction',
      error: errorMessage,
    },
    tweetInfo: null,
    errors: [new ExtractionError(code, errorMessage)],
  };
}

function mergeTweetInfo(base?: TweetInfo | null, override?: TweetInfo | null): TweetInfo | null {
  if (!base) return override ?? null;
  if (!override) return base;
  return {
    ...base,
    ...override,
    metadata: { ...(base.metadata ?? {}), ...(override.metadata ?? {}) },
  };
}

function finalizeResult(result: MediaExtractionResult): MediaExtractionResult {
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
  return { ...result, mediaItems: uniqueItems, clickedIndex: adjustedIndex };
}

export class MediaExtractionService implements MediaExtractor {
  private readonly tweetInfoExtractor: TweetInfoExtractor;
  private readonly apiExtractor: TwitterAPIExtractor;
  private readonly domFallbackExtractor: DOMFallbackExtractor;

  constructor() {
    this.tweetInfoExtractor = new TweetInfoExtractor();
    this.apiExtractor = new TwitterAPIExtractor();
    this.domFallbackExtractor = new DOMFallbackExtractor();
  }

  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = generateExtractionId();
    if (__DEV__) logger.info(`[MediaExtractor] ${extractionId}: Extraction started`);

    try {
      const tweetInfo = this.tweetInfoExtractor.extract(element);

      if (!tweetInfo?.tweetId) {
        if (__DEV__) logger.warn(`[MediaExtractor] ${extractionId}: No tweet info found`);
        return createErrorResult('No tweet information found');
      }

      const apiResult = isApiCircuitOpen()
        ? {
            success: false,
            mediaItems: [],
            clickedIndex: 0,
            metadata: { sourceType: 'circuit-open' },
            tweetInfo: null,
            errors: [],
          }
        : await this.apiExtractor.extract(tweetInfo, element, options, extractionId);

      if (apiResult.success && apiResult.mediaItems.length > 0) {
        // Reset circuit on success
        apiFailureCount = 0;
        apiCircuitOpen = false;
        return finalizeResult({
          ...apiResult,
          tweetInfo: mergeTweetInfo(tweetInfo, apiResult.tweetInfo),
        });
      }

      if (!apiResult.success) {
        recordApiFailure();
      }

      if (__DEV__) logger.info(`[MediaExtractor] ${extractionId}: API failed, trying DOM fallback`);

      const domResult = await this.domFallbackExtractor.extract(
        tweetInfo,
        element,
        options,
        extractionId
      );

      if (domResult.success && domResult.mediaItems.length > 0) {
        return finalizeResult({
          ...domResult,
          tweetInfo: mergeTweetInfo(tweetInfo, domResult.tweetInfo),
        });
      }

      if (__DEV__) logger.error('Both API and DOM extraction failed', extractionId);

      const apiErrorMessage =
        apiResult.metadata?.error ?? apiResult.errors?.[0]?.message ?? 'API extraction failed';
      const base = createErrorResult(apiErrorMessage, ErrorCode.ALL_FAILED);
      return {
        ...base,
        clickedIndex: apiResult.clickedIndex ?? 0,
        metadata: {
          ...base.metadata,
          ...(apiResult.metadata ?? {}),
          strategy: 'api-extraction',
          sourceType: 'extraction-failed',
        },
        tweetInfo: mergeTweetInfo(tweetInfo, apiResult.tweetInfo),
      };
    } catch (error) {
      if (__DEV__) logger.error('Extract failed', extractionId, error);
      return createErrorResult(error);
    }
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    try {
      const firstMedia = container.querySelector(TWITTER_MEDIA_SELECTOR);
      if (!firstMedia || !(firstMedia instanceof HTMLElement)) {
        return createErrorResult('No media found in container');
      }
      return this.extractFromClickedElement(firstMedia, options);
    } catch (error) {
      return createErrorResult(error);
    }
  }
}
