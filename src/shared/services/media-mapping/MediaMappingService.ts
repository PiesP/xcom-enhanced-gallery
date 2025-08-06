/**
 * @fileoverview Media Mapping Service
 * @description 전략 패턴을 사용한 간단한 미디어 매핑 서비스
 */

import type { MediaMapping, MediaPageType } from '@shared/types/media.types';
import { logger } from '@shared/logging';
import { MediaTabUrlDirectStrategy } from './MediaTabUrlDirectStrategy';

/**
 * 간소화된 미디어 매핑 서비스
 */
export class MediaMappingService {
  private readonly strategy = new MediaTabUrlDirectStrategy();

  constructor() {
    logger.debug('[MediaMappingService] 초기화됨');
  }

  /**
   * 클릭된 요소와 페이지 타입을 기반으로 미디어 매핑 수행
   */
  async mapMedia(
    clickedElement: HTMLElement,
    pageType: MediaPageType
  ): Promise<MediaMapping | null> {
    logger.debug('[MediaMappingService] 매핑 시작', { pageType });

    try {
      const result = await this.strategy.execute(clickedElement, pageType);

      if (result) {
        logger.debug('[MediaMappingService] 매핑 성공', { result });
        return result;
      }
    } catch (error) {
      logger.debug('[MediaMappingService] 전략 실패:', error);
    }

    logger.warn('[MediaMappingService] 매핑 실패');
    return null;
  }
}
