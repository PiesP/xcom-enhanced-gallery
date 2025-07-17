/**
 * @fileoverview 이미지 요소 백업 전략
 */

import { logger } from '../../../../../infrastructure/logging/logger';
import { parseUsernameFast } from '../../../../../core/services/media/UsernameExtractionService';
import type { MediaInfo } from '../../../../../core/types/media.types';
import type {
  TweetInfo,
  MediaExtractionResult,
  FallbackExtractionStrategy,
} from '../../interfaces/extraction.interfaces';

export class ImageElementFallbackStrategy implements FallbackExtractionStrategy {
  readonly name = 'image-element-fallback';

  async extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const images = tweetContainer.querySelectorAll('img');
      const mediaItems: MediaInfo[] = [];
      let clickedIndex = 0;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img) continue;

        const src = img.getAttribute('src');

        if (src && this.isValidImageUrl(src)) {
          const mediaInfo: MediaInfo = {
            id: `fallback_img_${i}`,
            url: src,
            type: 'image',
            filename: '',
            tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
            tweetId: tweetInfo?.tweetId || undefined,
            tweetUrl: tweetInfo?.tweetUrl || '',
            originalUrl: src,
            thumbnailUrl: src,
            alt: img.getAttribute('alt') || `Image ${i + 1}`,
            metadata: {
              fallbackSource: 'img-element',
            },
          };

          mediaItems.push(mediaInfo);

          // 클릭된 이미지 인덱스 확인
          if (
            img === clickedElement ||
            clickedElement.contains(img) ||
            img.contains(clickedElement)
          ) {
            clickedIndex = mediaItems.length - 1;
          }
        }
      }

      return {
        success: mediaItems.length > 0,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'fallback-image',
          strategy: 'image-element-fallback',
        },
        tweetInfo: tweetInfo ?? null,
      };
    } catch (error) {
      logger.error('[ImageElementFallbackStrategy] 추출 오류:', error);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'fallback-image',
          strategy: 'image-element-fallback-failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        tweetInfo: tweetInfo ?? null,
      };
    }
  }

  private isValidImageUrl(url: string): boolean {
    return url.startsWith('http') && !url.includes('profile_images');
  }
}
