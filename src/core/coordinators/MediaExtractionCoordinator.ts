/**
 * @fileoverview 통합된 미디어 추출 코디네이터
 *
 * 책임:
 * - API 우선 + DOM 백업 전략 실행
 * - 추출 상태 관리
 * - 성능 모니터링 및 로깅
 * - 정리 작업 관리
 *
 * @description Clean Architecture 기반 미디어 추출 관리
 * @version 3.0.0 - Clean Architecture
 */

import type { MediaInfo } from '../types/media.types';
import { MediaExtractionService } from '../../features/media/extraction/services/MediaExtractor';
import { VideoControlService } from '../services/media/VideoControlService';
import { logger } from '../logging/logger';

/**
 * 추출 결과 인터페이스
 */
export interface ExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  clickedIndex: number;
  source: 'api-first' | 'dom-fallback' | 'failed' | 'error';
}

/**
 * 미디어 추출 코디네이터
 *
 * 책임:
 * - API 우선 + DOM 백업 전략 실행
 * - 추출 상태 관리
 * - 성능 모니터링 및 로깅
 * - 정리 작업 관리
 */
export class MediaExtractorCoordinator {
  private readonly extractor: MediaExtractionService;
  private readonly videoControl: VideoControlService;
  private extractionCounter = 0;
  private isInitialized = false;

  constructor() {
    this.extractor = new MediaExtractionService();
    this.videoControl = VideoControlService.getInstance();
  }

  /**
   * 코디네이터 초기화
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('[MediaExtractorCoordinator] 이미 초기화됨');
      return;
    }

    try {
      // 내부 상태 초기화
      this.extractionCounter = 0;
      this.isInitialized = true;

      logger.info('[MediaExtractorCoordinator] ✅ 초기화 완료');
    } catch (error) {
      logger.error('[MediaExtractorCoordinator] ❌ 초기화 실패:', error);
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
      logger.debug(`[MediaExtractorCoordinator] 🚀 추출 시작 [${extractionId}]`);

      // 즉시 배경 비디오 정지 (사용자 경험 개선)
      this.videoControl.pauseAllBackgroundVideos();

      const result = await this.extractor.extractFromClickedElement(target, {
        includeVideos: true,
        enableValidation: true,
        timeoutMs: 5000,
      });

      const duration = performance.now() - startTime;

      if (result.success && result.mediaItems.length > 0) {
        logger.info(
          `[MediaExtractorCoordinator] ✅ 추출 성공 [${extractionId}]: ${result.mediaItems.length}개 미디어 (${duration.toFixed(1)}ms)`
        );

        return {
          success: true,
          mediaItems: [...result.mediaItems],
          clickedIndex: result.clickedIndex ?? 0,
          source: this.mapSourceType(result.metadata?.sourceType),
        };
      }

      logger.warn(
        `[MediaExtractorCoordinator] ❌ 추출 실패 [${extractionId}]: 미디어 없음 (${duration.toFixed(1)}ms)`
      );

      // 추출 실패 시 비디오 상태 복원
      this.videoControl.restoreBackgroundVideos();

      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        source: 'failed',
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(
        `[MediaExtractorCoordinator] 💥 추출 오류 [${extractionId}] (${duration.toFixed(1)}ms):`,
        error
      );

      // 에러 발생 시 비디오 상태 복원
      this.videoControl.restoreBackgroundVideos();

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
      case 'dom-fallback':
        return 'dom-fallback';
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
      supportedStrategies: ['api-first', 'dom-fallback'],
    };
  }

  /**
   * 리소스 정리
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('[MediaExtractorCoordinator] 정리 시작');

      // 내부 상태 초기화
      this.extractionCounter = 0;
      this.isInitialized = false;

      logger.info('[MediaExtractorCoordinator] ✅ 정리 완료');
    } catch (error) {
      logger.error('[MediaExtractorCoordinator] ❌ 정리 실패:', error);
      throw error;
    }
  }
}
