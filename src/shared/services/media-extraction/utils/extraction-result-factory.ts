import type { MediaExtractionResult } from '@shared/types/media.types';

export function createFailureResult(
  error: string,
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
