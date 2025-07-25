/**
 * @fileoverview Simplified Media Mapping Service
 * @description 전략 패턴을 사용한 간단한 미디어 매핑 서비스
 */

import type { MediaMapping, MediaPageType, MediaMappingStrategy } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';
import { MediaTabUrlDirectStrategy } from './MediaTabUrlDirectStrategy';
import type { StrategyMetrics } from '../../types/core/core-types';

// 로컬 타입 정의 (core-types 의존성 제거)
interface MappingCacheEntry {
  result: MediaMapping;
  timestamp: number;
}

/**
 * 간소화된 미디어 매핑 서비스
 */
export class MediaMappingService {
  private static instance: MediaMappingService | null = null;
  private strategies: MediaMappingStrategy[] = [];
  private readonly strategyMetrics = new Map<string, StrategyMetrics>();
  private readonly mappingCache = new Map<string, MappingCacheEntry>();
  private readonly CACHE_TTL = 30_000; // 30초

  private constructor() {
    this.initializeStrategies();
    logger.debug('[SimplifiedMediaMappingService] 초기화됨');
  }

  public static getInstance(): MediaMappingService {
    MediaMappingService.instance ??= new MediaMappingService();
    return MediaMappingService.instance;
  }

  /**
   * 기본 전략들 초기화
   */
  private initializeStrategies(): void {
    this.strategies = [new MediaTabUrlDirectStrategy()].sort((a, b) => a.priority - b.priority);

    // 메트릭스 초기화
    for (const strategy of this.strategies) {
      this.strategyMetrics.set(strategy.name, {
        successRate: 0.5,
        avgProcessingTime: 0,
        lastUsed: 0,
        priority: strategy.priority,
      });
    }

    logger.debug('[SimplifiedMediaMappingService] 전략 초기화 완료', {
      strategies: this.strategies.map(s => s.name),
    });
  }

  /**
   * 클릭된 요소와 페이지 타입을 기반으로 미디어 매핑 수행
   */
  async mapMedia(
    clickedElement: HTMLElement,
    pageType: MediaPageType
  ): Promise<MediaMapping | null> {
    const cacheKey = this.generateCacheKey(clickedElement, pageType);

    // 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.debug('[SimplifiedMediaMappingService] 캐시에서 결과 반환');
      return cached;
    }

    logger.debug('[SimplifiedMediaMappingService] 매핑 시작', { pageType });

    // 전략들을 우선순위대로 실행
    for (const strategy of this.strategies) {
      try {
        const startTime = performance.now();
        const result = await strategy.execute(clickedElement, pageType);
        const duration = performance.now() - startTime;

        this.updateMetrics(strategy.name, !!result, duration);

        if (result) {
          this.setCache(cacheKey, result);
          logger.debug('[SimplifiedMediaMappingService] 매핑 성공', {
            strategy: strategy.name,
            result,
          });
          return result;
        }
      } catch (error) {
        logger.debug(`[SimplifiedMediaMappingService] 전략 ${strategy.name} 실패:`, error);
        this.updateMetrics(strategy.name, false, 0);
        continue;
      }
    }

    logger.warn('[SimplifiedMediaMappingService] 모든 전략 실패');
    return null;
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(element: HTMLElement, pageType: MediaPageType): string {
    const elementId = element.getAttribute('data-testid') ?? element.tagName;
    const url = window.location.href;
    return `${pageType}-${elementId}-${url.slice(-20)}`;
  }

  /**
   * 캐시에서 조회
   */
  private getFromCache(key: string): MediaMapping | null {
    const entry = this.mappingCache.get(key);
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.result;
    }
    if (entry) {
      this.mappingCache.delete(key);
    }
    return null;
  }

  /**
   * 캐시에 저장
   */
  private setCache(key: string, result: MediaMapping): void {
    this.mappingCache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * 전략 메트릭스 업데이트
   */
  private updateMetrics(strategyName: string, success: boolean, duration: number): void {
    const metrics = this.strategyMetrics.get(strategyName);
    if (metrics) {
      // 간단한 이동 평균 업데이트
      metrics.successRate = metrics.successRate * 0.9 + (success ? 1 : 0) * 0.1;
      metrics.avgProcessingTime = metrics.avgProcessingTime * 0.9 + duration * 0.1;
      metrics.lastUsed = Date.now();
    }
  }

  /**
   * 전략 추가
   */
  addStrategy(strategy: MediaMappingStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);

    this.strategyMetrics.set(strategy.name, {
      successRate: 0.5,
      avgProcessingTime: 0,
      lastUsed: 0,
      priority: strategy.priority,
    });

    logger.debug('[SimplifiedMediaMappingService] 전략 추가됨', { name: strategy.name });
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.mappingCache.clear();
    logger.debug('[SimplifiedMediaMappingService] 캐시 정리됨');
  }

  /**
   * 메트릭스 조회
   */
  getMetrics(): ReadonlyMap<string, StrategyMetrics> {
    return new Map(this.strategyMetrics);
  }
}
