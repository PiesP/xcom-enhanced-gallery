/**
 * @fileoverview 공통 fallback 전략 베이스 클래스
 */

import { parseUsernameFast } from '../../../../../core/services/media/UsernameExtractionService';
import type { MediaInfo } from '../../../../../core/types/media.types';
import type {
  TweetInfo,
  MediaExtractionResult,
  FallbackExtractionStrategy,
} from '@core/interfaces/extraction.interfaces';

/**
 * 모든 fallback 전략의 공통 기능을 제공하는 베이스 클래스
 */
export abstract class BaseFallbackStrategy implements FallbackExtractionStrategy {
  abstract readonly name: string;

  abstract extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult>;

  /**
   * MediaInfo 객체를 생성하는 공통 메서드
   */
  protected createMediaInfo(
    id: string,
    url: string,
    type: 'image' | 'video',
    tweetInfo?: TweetInfo,
    options: {
      thumbnailUrl?: string;
      alt?: string;
      fallbackSource?: string;
    } = {}
  ): MediaInfo {
    return {
      id,
      url,
      type,
      filename: '',
      tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
      tweetId: tweetInfo?.tweetId || undefined,
      tweetUrl: tweetInfo?.tweetUrl || '',
      originalUrl: url,
      thumbnailUrl: options.thumbnailUrl || url,
      alt: options.alt || `${type} item`,
      metadata: {
        fallbackSource: options.fallbackSource || this.name,
      },
    };
  }

  /**
   * 공통 URL 검증 메서드
   */
  protected isValidMediaUrl(url: string): boolean {
    return url.startsWith('http') && !url.includes('profile_images');
  }

  /**
   * 미디어 타입 감지 메서드
   */
  protected detectMediaType(url: string): 'image' | 'video' {
    return url.includes('video') || url.includes('.mp4') ? 'video' : 'image';
  }

  /**
   * 성공 결과 생성 메서드
   */
  protected createSuccessResult(
    mediaItems: MediaInfo[],
    tweetInfo?: TweetInfo
  ): MediaExtractionResult {
    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'fallback',
        strategy: this.name,
      },
      tweetInfo: tweetInfo ?? null,
    };
  }

  /**
   * 실패 결과 생성 메서드
   */
  protected createFailureResult(error: string, tweetInfo?: TweetInfo): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'fallback',
        strategy: `${this.name}-failed`,
        error,
      },
      tweetInfo: tweetInfo ?? null,
    };
  }
}
