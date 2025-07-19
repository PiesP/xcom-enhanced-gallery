/**
 * @fileoverview 트윗 정보 추출기
 * @description 모든 미디어 추출의 첫 번째 단계 - 트윗 정보 추출
 * @version 2.0.0 - Clean Architecture
 */

import { logger } from '@core/logging/logger';
import type { TweetInfo, TweetInfoExtractionStrategy } from '../interfaces/extraction.interfaces';
import { ClickedElementTweetStrategy } from '../strategies/ClickedElementTweetStrategy';
import { UrlBasedTweetStrategy } from '../strategies/UrlBasedTweetStrategy';
import { DomStructureTweetStrategy } from '../strategies/DomStructureTweetStrategy';
import { DataAttributeTweetStrategy } from '../strategies/DataAttributeTweetStrategy';
import { ParentTraversalTweetStrategy } from '../strategies/ParentTraversalTweetStrategy';

/**
 * 트윗 정보 추출기
 * 모든 미디어 추출의 첫 번째 단계
 */
export class TweetInfoExtractor {
  private readonly strategies: TweetInfoExtractionStrategy[];

  constructor() {
    this.strategies = [
      new ClickedElementTweetStrategy(), // 클릭된 요소에서 직접 추출 (최우선)
      new UrlBasedTweetStrategy(), // URL 패턴 기반 추출
      new DomStructureTweetStrategy(), // DOM 구조 분석
      new DataAttributeTweetStrategy(), // 데이터 속성 기반
      new ParentTraversalTweetStrategy(), // 부모 요소 탐색 (최후)
    ];

    // 우선순위로 정렬
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 통합 트윗 정보 추출
   */
  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    for (const strategy of this.strategies) {
      try {
        const result = await strategy.extract(element);
        if (result && this.isValidTweetInfo(result)) {
          logger.debug(`[TweetInfoExtractor] 성공: ${strategy.name}`, {
            tweetId: result.tweetId,
            username: result.username,
            confidence: result.confidence,
          });
          return result;
        }
      } catch (error) {
        logger.warn(`[TweetInfoExtractor] ${strategy.name} 실패:`, error);
      }
    }

    logger.warn('[TweetInfoExtractor] 모든 전략 실패');
    return null;
  }

  /**
   * 트윗 정보 유효성 검사
   */
  private isValidTweetInfo(info: TweetInfo): boolean {
    return !!(info.tweetId && info.tweetId !== 'unknown' && /^\d+$/.test(info.tweetId));
  }

  /**
   * 특정 전략으로 추출 시도
   */
  async extractWithStrategy(element: HTMLElement, strategyName: string): Promise<TweetInfo | null> {
    const strategy = this.strategies.find(s => s.name === strategyName);
    if (!strategy) {
      logger.warn(`[TweetInfoExtractor] 전략을 찾을 수 없음: ${strategyName}`);
      return null;
    }

    try {
      const result = await strategy.extract(element);
      return result && this.isValidTweetInfo(result) ? result : null;
    } catch (error) {
      logger.error(`[TweetInfoExtractor] ${strategyName} 실행 오류:`, error);
      return null;
    }
  }

  /**
   * 모든 전략 결과 비교
   */
  async extractWithAllStrategies(element: HTMLElement): Promise<TweetInfo[]> {
    const results: TweetInfo[] = [];

    for (const strategy of this.strategies) {
      try {
        const result = await strategy.extract(element);
        if (result && this.isValidTweetInfo(result)) {
          results.push(result);
        }
      } catch (error) {
        logger.warn(`[TweetInfoExtractor] ${strategy.name} 실패:`, error);
      }
    }

    return results;
  }
}
