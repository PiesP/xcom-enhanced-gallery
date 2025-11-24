/**
 * @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
 * @version 2.2.0 - Simplified
 */

import { logger } from "@shared/logging";
import { convertAPIMediaToMediaInfo } from "@shared/media/media-factory";
import { determineClickedIndex } from "@shared/services/media-extraction/determine-clicked-index";
import { TwitterAPI } from "@shared/services/media/twitter-api-client";
import type {
    APIExtractor,
    MediaExtractionOptions,
    MediaExtractionResult,
    TweetInfo,
} from "@shared/types/media.types";
import { extractTweetTextHTMLFromClickedElement } from "@shared/utils/tweet-extractor";

export class TwitterAPIExtractor implements APIExtractor {
  async extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string,
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug(`[APIExtractor] ${extractionId}: Starting API extraction`, {
        tweetId: tweetInfo.tweetId,
      });

      // Step 1: Fetch media from API
      const apiMedias = await TwitterAPI.getTweetMedias(tweetInfo.tweetId);

      if (!apiMedias || apiMedias.length === 0) {
        return this.createFailureResult("No media found in API response");
      }

      // Step 2: Extract tweet text HTML
      const tweetTextHTML =
        extractTweetTextHTMLFromClickedElement(clickedElement);

      // Step 3: Transform API response to MediaInfo[]
      const mediaItems = await convertAPIMediaToMediaInfo(
        apiMedias,
        tweetInfo,
        tweetTextHTML,
      );

      // Step 4: Calculate which media user clicked
      const clickedIndex = determineClickedIndex(clickedElement, mediaItems);

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: "twitter-api",
          strategy: "api-extraction",
          totalProcessingTime: 0,
          apiMediaCount: apiMedias.length,
        },
        tweetInfo,
      };
    } catch (error) {
      logger.warn(
        `[APIExtractor] ${extractionId}: API extraction failed:`,
        error,
      );
      return this.createFailureResult(
        error instanceof Error ? error.message : "API extraction failed",
      );
    }
  }

  private createFailureResult(error: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: "twitter-api",
        strategy: "api-extraction-failed",
        error,
      },
      tweetInfo: null,
    };
  }
}
