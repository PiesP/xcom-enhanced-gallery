/**
 * @fileoverview 배경 이미지 백업 전략
 */

import { logger } from '@core/logging/logger';
import type { TweetInfo, MediaExtractionResult } from '../../interfaces/extraction.interfaces';
import { BaseFallbackStrategy } from './BaseFallbackStrategy';

export class BackgroundImageFallbackStrategy extends BaseFallbackStrategy {
  readonly name = 'background-image-fallback';

  async extract(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const mediaItems = [];
      const elements = tweetContainer.querySelectorAll('*');

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        if (!element) continue;

        const style = window.getComputedStyle(element);
        const backgroundImage = style.backgroundImage;

        if (backgroundImage && backgroundImage !== 'none') {
          const url = this.extractUrlFromBackgroundImage(backgroundImage);
          if (url && this.isValidMediaUrl(url)) {
            const mediaInfo = this.createMediaInfo(`fallback_bg_${i}`, url, 'image', tweetInfo, {
              alt: `Background Image ${i + 1}`,
              fallbackSource: 'background-image',
            });
            mediaItems.push(mediaInfo);
          }
        }
      }

      return this.createSuccessResult(mediaItems, tweetInfo);
    } catch (error) {
      logger.error('[BackgroundImageFallbackStrategy] 추출 오류:', error);
      return this.createFailureResult(
        error instanceof Error ? error.message : 'Unknown error',
        tweetInfo
      );
    }
  }

  private extractUrlFromBackgroundImage(backgroundImage: string): string | null {
    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? (match[1] ?? null) : null;
  }
}
