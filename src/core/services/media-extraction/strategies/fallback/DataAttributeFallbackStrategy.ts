/**
 * @fileoverview 데이터 속성 백업 전략
 */

import { logger } from '@core/logging/logger';
import type { TweetInfo, MediaExtractionResult } from '@core/interfaces/extraction.interfaces';
import { BaseFallbackStrategy } from './BaseFallbackStrategy';

export class DataAttributeFallbackStrategy extends BaseFallbackStrategy {
  readonly name = 'data-attribute-fallback';

  async extract(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const mediaItems = [];

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
          const mediaInfo = this.createMediaInfo(
            `fallback_data_${i}`,
            url,
            this.detectMediaType(url),
            tweetInfo,
            {
              alt: `Media ${i + 1}`,
              fallbackSource: 'data-attribute',
            }
          );
          mediaItems.push(mediaInfo);
        }
      }

      return this.createSuccessResult(mediaItems, tweetInfo);
    } catch (error) {
      logger.error('[DataAttributeFallbackStrategy] 추출 오류:', error);
      return this.createFailureResult(
        error instanceof Error ? error.message : 'Unknown error',
        tweetInfo
      );
    }
  }
}
