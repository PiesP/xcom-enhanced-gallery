/**
 * Precise Media Mapper
 *
 * @fileoverview 클릭된 요소와 트윗의 정확한 매핑을 위한 서비스
 * @description 미디어와 트윗의 정확한 연결을 보장
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 미디어 매핑 결과
 */
export interface MediaMapping {
  tweetId: string;
  mediaIndex: number;
  confidence: number;
  method?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 미디어 페이지 타입
 */
export type MediaPageType = 'timeline' | 'tweet' | 'media' | 'profile' | 'unknown';

/**
 * 정밀한 미디어 매퍼
 */
export class PreciseMediaMapper {
  private static instance: PreciseMediaMapper;

  private constructor() {}

  public static getInstance(): PreciseMediaMapper {
    PreciseMediaMapper.instance ??= new PreciseMediaMapper();
    return PreciseMediaMapper.instance;
  }

  /**
   * 클릭된 요소에서 미디어 매핑 정보를 추출합니다
   */
  public async mapMedia(
    clickedElement: HTMLElement,
    pageType: MediaPageType
  ): Promise<MediaMapping | null> {
    try {
      // 1. 데이터 속성에서 트윗 ID 찾기
      let tweetId = this.findTweetIdFromDataAttributes(clickedElement);

      if (!tweetId) {
        // 2. 부모 요소들 탐색
        tweetId = this.findTweetIdFromParents(clickedElement);
      }

      if (!tweetId) {
        logger.warn('트윗 ID를 찾을 수 없습니다', { pageType });
        return null;
      }

      // 3. 미디어 인덱스 계산
      const mediaIndex = this.calculateMediaIndex(clickedElement);

      const mapping: MediaMapping = {
        tweetId,
        mediaIndex,
        confidence: 0.8, // 기본 신뢰도
      };

      logger.debug('미디어 매핑 성공', mapping);
      return mapping;
    } catch (error) {
      logger.error('미디어 매핑 실패', { error, pageType });
      return null;
    }
  }

  /**
   * 미디어를 트윗에 매핑합니다 (기존 코드 호환성)
   */
  public async mapMediaToTweet(
    clickedElement: HTMLElement,
    pageType: MediaPageType
  ): Promise<MediaMapping> {
    const result = await this.mapMedia(clickedElement, pageType);

    if (!result) {
      // 기본 매핑 반환
      return {
        tweetId: 'unknown',
        mediaIndex: 0,
        confidence: 0.1,
      };
    }

    return result;
  }

  /**
   * 데이터 속성에서 트윗 ID 찾기
   */
  private findTweetIdFromDataAttributes(element: HTMLElement): string | null {
    // 일반적인 트윗 ID 데이터 속성들
    const attributes = ['data-tweet-id', 'data-item-id', 'data-testid'];

    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value && /^\d+$/.test(value)) {
        return value;
      }
    }

    return null;
  }

  /**
   * 부모 요소들에서 트윗 ID 찾기
   */
  private findTweetIdFromParents(element: HTMLElement): string | null {
    let current: HTMLElement | null = element;
    let depth = 0;
    const maxDepth = 10;

    while (current && depth < maxDepth) {
      const tweetId = this.findTweetIdFromDataAttributes(current);
      if (tweetId) {
        return tweetId;
      }

      current = current.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * 미디어 인덱스 계산
   */
  private calculateMediaIndex(element: HTMLElement): number {
    // 부모 컨테이너에서 미디어 인덱스 찾기
    const mediaContainer = element.closest('[role="img"], [data-testid*="media"]');
    if (!mediaContainer) {
      return 0;
    }

    // 동일한 컨테이너 내의 미디어 요소들과 비교
    const allMediaElements = mediaContainer.parentElement?.querySelectorAll(
      '[role="img"], [data-testid*="media"]'
    );

    if (allMediaElements) {
      for (let i = 0; i < allMediaElements.length; i++) {
        if (allMediaElements[i] === mediaContainer) {
          return i;
        }
      }
    }

    return 0;
  }
}
