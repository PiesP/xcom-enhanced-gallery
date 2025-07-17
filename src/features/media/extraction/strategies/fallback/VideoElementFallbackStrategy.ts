/**
 * @fileoverview 비디오 요소 백업 전략
 */

import { logger } from '../../../../../infrastructure/logging/logger';
import { parseUsernameFast } from '../../../../../core/services/media/UsernameExtractionService';
import type { MediaInfo } from '../../../../../core/types/media.types';
import type {
  TweetInfo,
  MediaExtractionResult,
  FallbackExtractionStrategy,
} from '../../interfaces/extraction.interfaces';

export class VideoElementFallbackStrategy implements FallbackExtractionStrategy {
  readonly name = 'video-element-fallback';

  async extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const videos = tweetContainer.querySelectorAll('video');
      const mediaItems: MediaInfo[] = [];
      let clickedIndex = 0;

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        if (!video) continue;

        const src = video.getAttribute('src') || video.getAttribute('poster');

        if (src) {
          const mediaInfo: MediaInfo = {
            id: `fallback_video_${i}`,
            url: src,
            type: 'video',
            filename: '',
            tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
            tweetId: tweetInfo?.tweetId || undefined,
            tweetUrl: tweetInfo?.tweetUrl || '',
            originalUrl: src,
            thumbnailUrl: video.getAttribute('poster') || src,
            alt: `Video ${i + 1}`,
            metadata: {
              fallbackSource: 'video-element',
            },
          };

          mediaItems.push(mediaInfo);

          if (
            video === clickedElement ||
            clickedElement.contains(video) ||
            video.contains(clickedElement)
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
          sourceType: 'fallback-video',
          strategy: 'video-element-fallback',
        },
        tweetInfo: tweetInfo ?? null,
      };
    } catch (error) {
      logger.error('[VideoElementFallbackStrategy] 추출 오류:', error);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'fallback-video',
          strategy: 'video-element-fallback-failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        tweetInfo: tweetInfo ?? null,
      };
    }
  }
}
