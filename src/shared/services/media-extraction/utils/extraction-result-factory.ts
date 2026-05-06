/**
 * @fileoverview Extraction result factory utilities
 * @description Shared factory functions for creating extraction results
 */

import { getElapsedTime } from '@shared/services/media-extraction/utils/performance-timing';
import type { MediaExtractionResult } from '@shared/types/media.types';

/**
 * Create a failure result with timing and source metadata
 *
 * @param error - Error message describing the failure
 * @param startTime - Timestamp from getTimestamp() for elapsed time calculation
 * @param sourceType - Source identifier (e.g., 'twitter-api', 'dom-fallback')
 * @param strategy - Strategy identifier (e.g., 'api-extraction-failed', 'dom-extraction-failed')
 * @returns MediaExtractionResult with success=false and metadata
 */
export function createFailureResult(
  error: string,
  startTime: number,
  sourceType: string,
  strategy: string
): MediaExtractionResult {
  return {
    success: false,
    mediaItems: [],
    clickedIndex: 0,
    metadata: {
      extractedAt: Date.now(),
      sourceType,
      strategy,
      error,
      totalProcessingTime: getElapsedTime(startTime),
    },
    tweetInfo: null,
  };
}

/**
 * Create a success result with timing and source metadata
 *
 * @param mediaItems - Extracted media items
 * @param clickedIndex - Index of the clicked media item
 * @param tweetInfo - Tweet information
 * @param sourceType - Source identifier
 * @param strategy - Strategy identifier
 * @param startTime - Timestamp from getTimestamp() for elapsed time calculation
 * @param extraMetadata - Additional metadata to include
 * @returns MediaExtractionResult with success=true
 */
export function createSuccessResult(
  mediaItems: MediaExtractionResult['mediaItems'],
  clickedIndex: number,
  tweetInfo: MediaExtractionResult['tweetInfo'],
  sourceType: string,
  strategy: string,
  startTime: number,
  extraMetadata?: Record<string, unknown>
): MediaExtractionResult {
  return {
    success: true,
    mediaItems,
    clickedIndex,
    metadata: {
      extractedAt: Date.now(),
      sourceType,
      strategy,
      totalProcessingTime: getElapsedTime(startTime),
      ...extraMetadata,
    },
    tweetInfo,
  };
}
