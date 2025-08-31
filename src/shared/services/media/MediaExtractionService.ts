/**
 * @fileoverview MediaExtractionService - 미디어 추출 전용 서비스
 * @description MediaService에서 추출 관련 기능을 분리한 전용 서비스
 */

import { logger } from '@shared/logging/logger';
import { handleServiceError } from '@shared/utils/error-handling';
import type { MediaExtractionResult, MediaExtractionOptions } from '@shared/types/media.types';
import type { UsernameExtractionResult } from './UsernameExtractionService';

/**
 * 미디어 추출 전용 서비스
 *
 * 책임:
 * - 클릭된 요소에서 미디어 추출
 * - 컨테이너에서 미디어 추출
 * - 사용자명 추출
 * - 추출 메트릭 관리
 */
export class MediaExtractionService {
  private static instance: MediaExtractionService | null = null;

  private mediaExtractionOrchestrator: {
    extract: (
      element: HTMLElement,
      options: MediaExtractionOptions
    ) => Promise<MediaExtractionResult>;
    getMetrics: () => Record<string, number>;
    clearCache: () => void;
    resetStrategy: (strategyName: string) => void;
  };

  private constructor() {
    // 기존 MediaService에서 orchestrator 가져오기
    this.initializeOrchestrator();
  }

  public static getInstance(): MediaExtractionService {
    if (!MediaExtractionService.instance) {
      MediaExtractionService.instance = new MediaExtractionService();
    }
    return MediaExtractionService.instance;
  }

  private async initializeOrchestrator(): Promise<void> {
    try {
      // 기존 MediaService의 orchestrator 로직을 가져올 예정
      // 현재는 임시로 빈 구현
      this.mediaExtractionOrchestrator = {
        extract: async (_element: HTMLElement, _options: MediaExtractionOptions = {}) => {
          // 임시 구현 - 실제로는 기존 orchestrator 로직 사용
          return {
            success: false,
            mediaItems: [],
            errors: [],
            metadata: {
              totalProcessed: 0,
              successCount: 0,
              errorCount: 0,
            },
          } as MediaExtractionResult;
        },
        getMetrics: () => ({
          totalExtractions: 0,
          successfulExtractions: 0,
          failedExtractions: 0,
        }),
        clearCache: () => {},
        resetStrategy: (_strategyName: string) => {},
      };
    } catch (error) {
      const standardError = handleServiceError(error, {
        service: 'MediaExtractionService',
        operation: 'initializeOrchestrator',
      });
      logger.error('Failed to initialize extraction orchestrator:', standardError.message);
    }
  }

  /**
   * 클릭된 요소에서 미디어 추출
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug('[MediaExtractionService] 클릭된 요소에서 미디어 추출 시작');
      return await this.mediaExtractionOrchestrator.extract(element, options);
    } catch (error) {
      const standardError = handleServiceError(error, {
        service: 'MediaExtractionService',
        operation: 'extractFromClickedElement',
        params: { options },
      });
      logger.error('Failed to extract from clicked element:', standardError.message);
      throw standardError;
    }
  }

  /**
   * 컨테이너에서 모든 미디어 추출
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug('[MediaExtractionService] 컨테이너에서 모든 미디어 추출 시작');
      return await this.mediaExtractionOrchestrator.extract(container, options);
    } catch (error) {
      const standardError = handleServiceError(error, {
        service: 'MediaExtractionService',
        operation: 'extractAllFromContainer',
        params: { options },
      });
      logger.error('Failed to extract from container:', standardError.message);
      throw standardError;
    }
  }

  /**
   * 사용자명과 함께 미디어 추출
   */
  async extractMediaWithUsername(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug('[MediaExtractionService] 사용자명과 함께 미디어 추출 시작');
      // 사용자명 추출 로직을 포함한 미디어 추출
      return await this.mediaExtractionOrchestrator.extract(element, {
        ...options,
        includeUsername: true,
      });
    } catch (error) {
      const standardError = handleServiceError(error, {
        service: 'MediaExtractionService',
        operation: 'extractMediaWithUsername',
        params: { options },
      });
      logger.error('Failed to extract media with username:', standardError.message);
      throw standardError;
    }
  }

  /**
   * 사용자명 추출
   */
  extractUsername(_element?: HTMLElement | Document): UsernameExtractionResult {
    // 기존 extractUsername 로직 구현 예정
    // 현재는 임시 구현
    return {
      username: null,
      confidence: 0,
      method: 'fallback',
    };
  }

  /**
   * 빠른 사용자명 추출
   */
  parseUsernameFast(element?: HTMLElement | Document): string | null {
    try {
      const result = this.extractUsername(element);
      return result.username;
    } catch (error) {
      logger.warn('Fast username parsing failed:', error);
      return null;
    }
  }

  /**
   * 추출 메트릭 조회
   */
  getExtractionMetrics() {
    try {
      return this.mediaExtractionOrchestrator.getMetrics();
    } catch (error) {
      logger.warn('Failed to get extraction metrics:', error);
      return {
        totalExtractions: 0,
        successfulExtractions: 0,
        failedExtractions: 0,
      };
    }
  }

  /**
   * 추출 캐시 초기화
   */
  clearExtractionCache(): void {
    try {
      this.mediaExtractionOrchestrator.clearCache();
      logger.debug('[MediaExtractionService] 추출 캐시 초기화됨');
    } catch (error) {
      logger.warn('Failed to clear extraction cache:', error);
    }
  }

  /**
   * 특정 추출 전략 초기화
   */
  resetExtractionStrategy(strategyName: string): void {
    try {
      this.mediaExtractionOrchestrator.resetStrategy(strategyName);
      logger.debug(`[MediaExtractionService] 추출 전략 '${strategyName}' 초기화됨`);
    } catch (error) {
      logger.warn(`Failed to reset extraction strategy '${strategyName}':`, error);
    }
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    try {
      this.clearExtractionCache();
      logger.debug('[MediaExtractionService] 정리됨');
    } catch (error) {
      logger.warn('Failed to cleanup MediaExtractionService:', error);
    }
  }
}

/**
 * 전역 미디어 추출 서비스 인스턴스
 */
export const mediaExtractionService = MediaExtractionService.getInstance();
