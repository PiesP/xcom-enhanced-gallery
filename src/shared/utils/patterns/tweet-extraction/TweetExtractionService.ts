/**
 * @fileoverview Unified Tweet Extraction Service
 * @description 전략 패턴을 사용한 통합된 트윗 정보 추출 서비스
 */

import { logger } from '@infrastructure/logging/logger';
import { ClickedElementStrategy } from './ClickedElementStrategy';
import { DataAttributesStrategy } from './DataAttributesStrategy';
import { StatusLinksStrategy } from './StatusLinksStrategy';
import type { TweetExtractionStrategy, TweetInfo } from './types';
import { generateSyntheticTweetInfo, isValidTweetInfo } from './types';

/**
 * 통합된 트윗 정보 추출 서비스
 */
export class TweetExtractionService {
  private strategies: TweetExtractionStrategy[] = [];
  private syntheticInfoGenerated = false;
  private cachedSyntheticInfo: TweetInfo | null = null;

  constructor() {
    this.initializeStrategies();
  }

  /**
   * 전략들을 우선순위에 따라 초기화
   */
  private initializeStrategies(): void {
    this.strategies = [
      new ClickedElementStrategy(),
      new StatusLinksStrategy(),
      new DataAttributesStrategy(),
    ].sort((a, b) => a.priority - b.priority);

    logger.debug('[TweetExtractionService] 전략 초기화 완료', {
      strategies: this.strategies.map(s => ({ name: s.name, priority: s.priority })),
    });
  }

  /**
   * 트윗 정보 추출 (메인 함수)
   */
  extractTweetInfo(tweetContainer: HTMLElement, clickedElement?: HTMLElement): TweetInfo | null {
    logger.debug('[TweetExtractionService] 트윗 정보 추출 시작', {
      hasClickedElement: !!clickedElement,
    });

    // 전략들을 순서대로 시도
    for (const strategy of this.strategies) {
      try {
        const result = strategy.extract(tweetContainer, clickedElement);
        if (result && isValidTweetInfo(result)) {
          logger.debug('[TweetExtractionService] 추출 성공', {
            strategy: strategy.name,
            result,
          });
          return result;
        }
      } catch (error) {
        logger.debug(`[TweetExtractionService] 전략 ${strategy.name} 실패:`, error);
        continue;
      }
    }

    // 모든 전략이 실패한 경우 synthetic 정보 생성
    logger.warn('[TweetExtractionService] 모든 전략 실패, synthetic 정보 생성');
    return this.generateSyntheticTweetInfoOnce();
  }

  /**
   * 한 번만 실행되는 synthetic 정보 생성
   */
  private generateSyntheticTweetInfoOnce(): TweetInfo {
    if (this.syntheticInfoGenerated && this.cachedSyntheticInfo) {
      logger.debug('[TweetExtractionService] 캐시된 synthetic 정보 재사용');
      return this.cachedSyntheticInfo;
    }

    this.syntheticInfoGenerated = true;
    this.cachedSyntheticInfo = generateSyntheticTweetInfo();
    logger.debug('[TweetExtractionService] 새로운 synthetic 정보 생성', this.cachedSyntheticInfo);
    return this.cachedSyntheticInfo;
  }

  /**
   * 전략 추가
   */
  addStrategy(strategy: TweetExtractionStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);
    logger.debug('[TweetExtractionService] 전략 추가됨', { name: strategy.name });
  }

  /**
   * 전략 제거
   */
  removeStrategy(name: string): boolean {
    const index = this.strategies.findIndex(s => s.name === name);
    if (index !== -1) {
      this.strategies.splice(index, 1);
      logger.debug('[TweetExtractionService] 전략 제거됨', { name });
      return true;
    }
    return false;
  }

  /**
   * 등록된 전략 목록 조회
   */
  getStrategies(): readonly TweetExtractionStrategy[] {
    return [...this.strategies];
  }
}

// 싱글톤 인스턴스
let serviceInstance: TweetExtractionService | null = null;

/**
 * 서비스 인스턴스 가져오기
 */
export function getTweetExtractionService(): TweetExtractionService {
  serviceInstance ??= new TweetExtractionService();
  return serviceInstance;
}

/**
 * 호환성을 위한 레거시 함수
 * @deprecated TweetExtractionService.extractTweetInfo 사용 권장
 */
export function extractTweetInfoUnified(
  tweetContainer: HTMLElement,
  clickedElement?: HTMLElement
): TweetInfo | null {
  return getTweetExtractionService().extractTweetInfo(tweetContainer, clickedElement);
}
