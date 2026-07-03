// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Disabled stub for MediaExtractionService.
 * Used as a build-time alias when XEG_FEATURE_MEDIA_EXTRACTION=0.
 * All methods return empty/failed results so the app still compiles
 * but no media extraction actually runs at runtime.
 */

import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
} from '@shared/types/media.types';

export class MediaExtractionService implements MediaExtractor {
  async extractFromClickedElement(
    _element: HTMLElement,
    _options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult> {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: performance.now(),
        sourceType: 'extraction-disabled',
        strategy: 'disabled-stub',
      },
      tweetInfo: null,
      errors: [],
    };
  }

  async extractAllFromContainer(
    _container: HTMLElement,
    _options?: MediaExtractionOptions
  ): Promise<MediaExtractionResult> {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: performance.now(),
        sourceType: 'extraction-disabled',
        strategy: 'disabled-stub',
      },
      tweetInfo: null,
      errors: [],
    };
  }
}
