/**
 * @fileoverview Extraction result factory utilities
 * @description Shared factory functions for creating extraction results
 */

import type { MediaExtractionResult } from '@shared/types/media.types';

/**
 * Create a failure result with source metadata
 */
export function createFailureResult(
  error: string,
  _startTime: number,
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
    },
    tweetInfo: null,
  };
}
