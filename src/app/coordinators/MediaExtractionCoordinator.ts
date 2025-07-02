/**
 * @fileoverview 통합된 미디어 추출 코디네이터
 * @description Clean Architecture 기반 통합된 미디어 추출 관리
 * @version 2.0.0 - Unified Architecture
 */

import {
  clearAllExtractions,
  recordSuccessfulExtraction,
} from '../../core/state/ExtractionStateManager';
import type { MediaInfo } from '../../core/types/media.types';
import { MediaExtractionService } from '../../features/media/extraction/services/MediaExtractor';
import { logger } from '../../infrastructure/logging/logger';

/**
 * 추출 결과 인터페이스
 */
export interface ExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  clickedIndex: number;
  source: 'api-first' | 'dom-backup' | 'failed' | 'error';
}

/**
 * 통합된 미디어 추출 코디네이터
 *
 * 책임:
 * - API 우선 + DOM 백업 전략 실행
 * - 추출 상태 관리
 * - 성능 모니터링 및 로깅
 * - 정리 작업 관리
 */
export class MediaExtractionCoordinator {
  private readonly extractor: MediaExtractionService;
  private extractionCounter = 0;
  private isInitialized = false;

  constructor() {
    this.extractor = new MediaExtractionService();
  }

  /**
   * 코디네이터 초기화
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('[MediaExtractionCoordinator] 이미 초기화됨');
      return;
    }

    try {
      // 추출 상태 초기화
      clearAllExtractions();
      this.extractionCounter = 0;
      this.isInitialized = true;

      logger.info('[MediaExtractionCoordinator] ✅ 초기화 완료');
    } catch (error) {
      logger.error('[MediaExtractionCoordinator] ❌ 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 클릭 이벤트로부터 미디어 추출
   */
  public async extractFromClick(
    target: HTMLElement,
    _event?: MouseEvent
  ): Promise<ExtractionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const extractionId = ++this.extractionCounter;
    const startTime = performance.now();

    try {
      logger.debug(`[MediaExtractionCoordinator] 🚀 추출 시작 [${extractionId}]`);

      const result = await this.extractor.extractFromClickedElement(target, {
        includeVideos: true,
        enableValidation: true,
        timeoutMs: 5000,
      });

      const duration = performance.now() - startTime;

      if (result.success && result.mediaItems.length > 0) {
        logger.info(
          `[MediaExtractionCoordinator] ✅ 추출 성공 [${extractionId}]: ${result.mediaItems.length}개 미디어 (${duration.toFixed(1)}ms)`
        );

        // 성공 기록
        if (result.tweetInfo?.tweetId) {
          recordSuccessfulExtraction(result.tweetInfo.tweetId);
        }

        return {
          success: true,
          mediaItems: [...result.mediaItems],
          clickedIndex: result.clickedIndex ?? 0,
          source: this.mapSourceType(result.metadata?.sourceType),
        };
      }

      logger.warn(
        `[MediaExtractionCoordinator] ❌ 추출 실패 [${extractionId}]: 미디어 없음 (${duration.toFixed(1)}ms)`
      );
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        source: 'failed',
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(
        `[MediaExtractionCoordinator] 💥 추출 오류 [${extractionId}] (${duration.toFixed(1)}ms):`,
        error
      );

      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        source: 'error',
      };
    }
  }

  /**
   * 소스 타입 매핑 (내부 타입 → 외부 인터페이스)
   */
  private mapSourceType(sourceType?: string): ExtractionResult['source'] {
    switch (sourceType) {
      case 'api':
      case 'api-first':
        return 'api-first';
      case 'dom':
      case 'dom-direct':
      case 'dom-backup':
        return 'dom-backup';
      case 'error':
        return 'error';
      default:
        return 'failed';
    }
  }

  /**
   * 진단 정보 제공
   */
  public getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      extractionCounter: this.extractionCounter,
      extractorType: 'SimplifiedMediaExtractor',
      supportedStrategies: ['api-first', 'dom-backup'],
    };
  }

  /**
   * 리소스 정리
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('[MediaExtractionCoordinator] 정리 시작');

      // 추출 상태 정리
      clearAllExtractions();

      // 내부 상태 초기화
      this.extractionCounter = 0;
      this.isInitialized = false;

      logger.info('[MediaExtractionCoordinator] ✅ 정리 완료');
    } catch (error) {
      logger.error('[MediaExtractionCoordinator] ❌ 정리 실패:', error);
      throw error;
    }
  }
}
