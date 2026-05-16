/**
 * @fileoverview Extraction result factory utilities
 * @description Shared factory functions for creating extraction results
 */

import { getElapsedTime } from '@shared/services/media-extraction/utils/performance-timing';
import type { MediaExtractionResult } from '@shared/types/media.types';

/**
 * Create a failure result with timing and source metadata
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
      extractedAt: performance.now(),
      sourceType,
      strategy,
      error,
      totalProcessingTime: getElapsedTime(startTime),
    },
    tweetInfo: null,
  };
}
