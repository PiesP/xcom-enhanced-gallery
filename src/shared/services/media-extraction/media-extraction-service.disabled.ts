import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractor,
} from '@shared/types/media.types';

const DISABLED_ERROR = new Error('Disabled');

export class MediaExtractionService implements MediaExtractor {
  async extractFromClickedElement(
    _element: HTMLElement,
    _options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return Promise.reject(DISABLED_ERROR);
  }

  async extractAllFromContainer(
    _container: HTMLElement,
    _options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return Promise.reject(DISABLED_ERROR);
  }
}
