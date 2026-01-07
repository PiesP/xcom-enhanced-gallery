import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
} from '@shared/types/media.types';

/**
 * Disabled stub for MediaExtractionService.
 *
 * This file exists to support the build-time feature flag that removes the full
 * media extraction implementation from the userscript bundle. All methods return
 * empty/failed results when the media extraction feature is disabled.
 */
export class MediaExtractionService implements MediaExtractor {
  /**
   * Disabled stub: returns failure result.
   * @param _element - The clicked element (ignored in disabled mode)
   * @param _options - Extraction options (ignored in disabled mode)
   * @returns Result with no media items
   */
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

  /**
   * Disabled stub: delegates to extractFromClickedElement.
   * @param container - The container element (ignored in disabled mode)
   * @param options - Extraction options (ignored in disabled mode)
   * @returns Result with no media items
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.extractFromClickedElement(container, options);
  }
}
