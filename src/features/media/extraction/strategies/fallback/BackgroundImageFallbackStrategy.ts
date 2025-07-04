/**
 * @fileoverview 배경 이미지 백업 전략
 */

import { logger } from '../../../../../infrastructure/logging/logger';
import { extractUsernameSimple } from '../../../../../core/services/media/UsernameExtractionService';
import type { MediaInfo } from '../../../../../core/types/media.types';
import type {
  TweetInfo,
  MediaExtractionResult,
  FallbackExtractionStrategy,
} from '../../interfaces/extraction.interfaces';

export class BackgroundImageFallbackStrategy implements FallbackExtractionStrategy {
  readonly name = 'background-image-fallback';

  async extract(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const mediaItems: MediaInfo[] = [];
      const elements = tweetContainer.querySelectorAll('*');

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        if (!element) continue;

        const style = window.getComputedStyle(element);
        const backgroundImage = style.backgroundImage;

        if (backgroundImage && backgroundImage !== 'none') {
          const url = this.extractUrlFromBackgroundImage(backgroundImage);
          if (url && this.isValidMediaUrl(url)) {
            const mediaInfo: MediaInfo = {
              id: `fallback_bg_${i}`,
              url,
              type: 'image',
              filename: '',
              tweetUsername: tweetInfo?.username || extractUsernameSimple() || undefined,
              tweetId: tweetInfo?.tweetId || undefined,
              tweetUrl: tweetInfo?.tweetUrl || '',
              originalUrl: url,
              thumbnailUrl: url,
              alt: `Background Image ${i + 1}`,
              metadata: {
                fallbackSource: 'background-image',
              },
            };

            mediaItems.push(mediaInfo);
          }
        }
      }

      return {
        success: mediaItems.length > 0,
        mediaItems,
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'fallback-background',
          strategy: 'background-image-fallback',
        },
        tweetInfo: tweetInfo ?? null,
      };
    } catch (error) {
      logger.error('[BackgroundImageFallbackStrategy] 추출 오류:', error);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'fallback-background',
          strategy: 'background-image-fallback-failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        tweetInfo: tweetInfo ?? null,
      };
    }
  }

  private extractUrlFromBackgroundImage(backgroundImage: string): string | null {
    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? (match[1] ?? null) : null;
  }

  private isValidMediaUrl(url: string): boolean {
    return url.startsWith('http') && !url.includes('profile_images');
  }
}
