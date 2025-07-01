/**
 * @fileoverview 데이터 속성 백업 전략
 */

import { logger } from '../../../../../infrastructure/logging/logger';
import type { MediaInfo } from '../../../../../core/types/media.types';
import type {
  TweetInfo,
  MediaExtractionResult,
  FallbackExtractionStrategy,
} from '../../interfaces/extraction.interfaces';

export class DataAttributeFallbackStrategy implements FallbackExtractionStrategy {
  readonly name = 'data-attribute-fallback';

  async extract(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const mediaItems: MediaInfo[] = [];

      // data-* 속성에서 미디어 URL 찾기
      const elementsWithData = tweetContainer.querySelectorAll(
        '[data-src], [data-background-image]'
      );

      for (let i = 0; i < elementsWithData.length; i++) {
        const element = elementsWithData[i];
        if (!element) continue;

        const dataSrc = element.getAttribute('data-src');
        const dataBg = element.getAttribute('data-background-image');
        const url = dataSrc || dataBg;

        if (url && this.isValidMediaUrl(url)) {
          const mediaInfo: MediaInfo = {
            id: `fallback_data_${i}`,
            url,
            type: this.detectMediaType(url),
            filename: '',
            tweetUsername: tweetInfo?.username || 'unknown',
            tweetId: tweetInfo?.tweetId || 'unknown',
            tweetUrl: tweetInfo?.tweetUrl || '',
            originalUrl: url,
            thumbnailUrl: url,
            alt: `Media ${i + 1}`,
            metadata: {
              fallbackSource: 'data-attribute',
            },
          };

          mediaItems.push(mediaInfo);
        }
      }

      return {
        success: mediaItems.length > 0,
        mediaItems,
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'fallback-data',
          strategy: 'data-attribute-fallback',
        },
        tweetInfo: tweetInfo ?? null,
      };
    } catch (error) {
      logger.error('[DataAttributeFallbackStrategy] 추출 오류:', error);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'fallback-data',
          strategy: 'data-attribute-fallback-failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        tweetInfo: tweetInfo ?? null,
      };
    }
  }

  private isValidMediaUrl(url: string): boolean {
    return url.startsWith('http') && !url.includes('profile_images');
  }

  private detectMediaType(url: string): 'image' | 'video' {
    return url.includes('video') || url.includes('.mp4') ? 'video' : 'image';
  }
}
