import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
} from '@shared/types/media.types';

/**
 * Disabled stub for MediaExtractionService.
 *
 * This file exists to support the build-time feature flag that removes the full
 * media extraction implementation from the userscript bundle.
 */
export class MediaExtractionService implements MediaExtractor {
  async extractFromClickedElement(
    _element: HTMLElement,
    _options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
    };
  }

  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.extractFromClickedElement(container, options);
  }
}
