/**
 * @fileoverview 미디어 추출 전략 구현체들
 * @description MediaExtractionOrchestrator용 전략 클래스들
 */

import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfo,
} from '@shared/types/media.types';
import type { ExtractionStrategy } from './MediaExtractionOrchestrator';
import { MediaExtractionService } from './MediaExtractionService';
import { FallbackExtractor } from '../media/FallbackExtractor';
import { logger } from '@shared/logging/logger';

/**
 * TwitterAPI 전략 (최우선)
 */
export class TwitterAPIStrategy implements ExtractionStrategy {
  readonly name = 'TwitterAPI';
  readonly priority = 1;

  private readonly mediaExtraction = new MediaExtractionService();

  canHandle(element: HTMLElement, _options: MediaExtractionOptions): boolean {
    // Twitter 도메인의 미디어 요소나 트윗 컨테이너인지 확인
    const isTwitterDomain =
      window.location.hostname.includes('twitter.com') ||
      window.location.hostname.includes('x.com');

    if (!isTwitterDomain) return false;

    // 미디어 요소 또는 트윗 컨테이너 확인
    const isMediaElement = ['IMG', 'VIDEO'].includes(element.tagName);
    const isTweetContainer =
      element.closest('[data-testid="tweet"]') !== null ||
      element.closest('article[role="article"]') !== null;

    return isMediaElement || isTweetContainer;
  }

  async extract(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    _tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug('[TwitterAPIStrategy] 추출 시도:', {
      element: element.tagName,
      extractionId,
    });

    try {
      return await this.mediaExtraction.extractFromClickedElement(element, options);
    } catch (error) {
      logger.error('[TwitterAPIStrategy] 추출 실패:', {
        error: error instanceof Error ? error.message : String(error),
        extractionId,
      });
      throw error;
    }
  }
}

/**
 * DOM Direct 전략
 */
export class DOMDirectStrategy implements ExtractionStrategy {
  readonly name = 'DOMDirect';
  readonly priority = 2;

  canHandle(element: HTMLElement, _options: MediaExtractionOptions): boolean {
    // 직접적인 미디어 요소만 처리
    return ['IMG', 'VIDEO', 'SOURCE'].includes(element.tagName);
  }

  async extract(
    element: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string,
    _tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug('[DOMDirectStrategy] 추출 시도:', {
      element: element.tagName,
      extractionId,
    });

    const mediaItems = [];
    let src = '';

    if (element.tagName === 'IMG') {
      src = element.getAttribute('src') || '';
    } else if (element.tagName === 'VIDEO') {
      src = element.getAttribute('src') || '';
      // video 요소의 source 자식 요소도 확인
      if (!src) {
        const source = element.querySelector('source');
        src = source?.getAttribute('src') || '';
      }
    } else if (element.tagName === 'SOURCE') {
      src = element.getAttribute('src') || '';
    }

    if (src && this.isValidMediaUrl(src)) {
      mediaItems.push({
        id: `dom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: element.tagName === 'VIDEO' ? ('video' as const) : ('image' as const),
        url: src,
        originalUrl: src,
        filename: '', // MediaInfo 인터페이스 필수 필드
        width: this.getElementDimension(element, 'width'),
        height: this.getElementDimension(element, 'height'),
        metadata: {
          source: 'dom-direct',
          tagName: element.tagName,
          extractionId,
        },
      });
    }

    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-direct',
        debug: {
          element: element.tagName,
          src,
          extractionId,
        },
      },
      tweetInfo: null,
      errors: [],
    };
  }

  private isValidMediaUrl(url: string): boolean {
    if (!url || url.startsWith('data:')) return false;

    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'];
    const lowerUrl = url.toLowerCase();

    return (
      mediaExtensions.some(ext => lowerUrl.includes(ext)) ||
      lowerUrl.includes('pbs.twimg.com') ||
      lowerUrl.includes('video.twimg.com')
    );
  }

  private getElementDimension(element: HTMLElement, dimension: 'width' | 'height'): number {
    const attr = element.getAttribute(dimension);
    if (attr) {
      const num = parseInt(attr, 10);
      if (!isNaN(num)) return num;
    }

    const computedStyle = window.getComputedStyle(element);
    const value = computedStyle[dimension];
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  }
}

/**
 * 포괄적 폴백 전략 (가장 마지막 시도)
 */
export class ComprehensiveFallbackStrategy implements ExtractionStrategy {
  readonly name = 'ComprehensiveFallback';
  readonly priority = 3;

  private readonly fallbackExtractor = new FallbackExtractor();

  canHandle(_element: HTMLElement, _options: MediaExtractionOptions): boolean {
    // 모든 요소에 대해 시도 가능 (마지막 수단)
    return true;
  }

  async extract(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug('[ComprehensiveFallbackStrategy] 추출 시도:', {
      element: element.tagName,
      extractionId,
    });

    try {
      return await this.fallbackExtractor.extract(element, options, extractionId, tweetInfo);
    } catch (error) {
      logger.error('[ComprehensiveFallbackStrategy] 추출 실패:', {
        error: error instanceof Error ? error.message : String(error),
        extractionId,
      });
      throw error;
    }
  }
}

/**
 * 전략 팩토리
 */
export class ExtractionStrategyFactory {
  /**
   * 기본 전략 세트 생성
   */
  static createDefaultStrategies(): ExtractionStrategy[] {
    return [new TwitterAPIStrategy(), new DOMDirectStrategy(), new ComprehensiveFallbackStrategy()];
  }
}
