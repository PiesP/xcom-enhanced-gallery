/**
 * 코디네이터
 *
 * 갤러리 앱의 코디네이터들을 통합 관리하는 클래스
 *
 * 책임:
 * - 코디네이터들의 생명주기 관리
 * - 코디네이터 간 통신 조정
 * - 일관된 설정 관리
 * - 오류 처리 및 복구
 */

import { logger } from '@core/logging/logger';
import { GalleryEventCoordinator } from './GalleryEventCoordinator';
import { MediaExtractorCoordinator } from './MediaExtractionCoordinator';
import type { MediaInfo } from '@core/types/media.types';

/**
 * 간소화된 코디네이터 설정
 */
export interface CoordinatorConfig {
  clickDebounceMs?: number;
  extractionTimeout?: number;
  enableKeyboard?: boolean;
  enablePerformanceMonitoring?: boolean;
}

/**
 * 추출 결과 인터페이스
 */
export interface ManagedExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  clickedIndex: number;
  initialIndex: number;
  source: string;
  duration: number;
}

/**
 * 코디네이터 매니저
 */
export class Coordinator {
  private readonly eventCoordinator: GalleryEventCoordinator;
  private readonly extractionCoordinator: MediaExtractorCoordinator;

  private config: Required<CoordinatorConfig>;
  private isInitialized = false;

  // 성능 모니터링
  private extractionMetrics = {
    totalExtractions: 0,
    successfulExtractions: 0,
    averageDuration: 0,
    lastExtractedAt: 0,
  };

  private static readonly DEFAULT_CONFIG: Required<CoordinatorConfig> = {
    clickDebounceMs: 500,
    extractionTimeout: 5000, // 간소화된 타임아웃
    enableKeyboard: true,
    enablePerformanceMonitoring: false,
  };

  constructor(config: CoordinatorConfig = {}) {
    this.config = { ...Coordinator.DEFAULT_CONFIG, ...config };

    // 코디네이터들 생성
    this.eventCoordinator = new GalleryEventCoordinator({
      clickDebounceMs: this.config.clickDebounceMs,
      enableKeyboard: this.config.enableKeyboard,
    });

    this.extractionCoordinator = new MediaExtractorCoordinator();
  }

  /**
   * 코디네이터 매니저 초기화
   */
  public async initialize(callbacks: {
    onMediaExtracted: (result: ManagedExtractionResult) => Promise<void>;
    onGalleryClose: () => void;
  }): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Coordinator: Already initialized');
      return;
    }

    try {
      logger.info('Coordinator: 초기화 시작');

      // 이벤트 코디네이터 초기화
      await this.eventCoordinator.initialize({
        onMediaClick: async (target, event) => {
          await this.handleMediaClick(
            target as HTMLElement,
            event as MouseEvent,
            callbacks.onMediaExtracted
          );
        },
        onGalleryClose: callbacks.onGalleryClose,
      });

      // 추출 코디네이터 초기화
      await this.extractionCoordinator.initialize();

      this.isInitialized = true;
      logger.info('✅ Coordinator 초기화 완료');
    } catch (error) {
      logger.error('❌ Coordinator 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 미디어 클릭 처리 (성능 모니터링 포함) - 공개 메서드
   */
  public async handleMediaClick(
    target: HTMLElement,
    event: MouseEvent,
    onSuccess: (result: ManagedExtractionResult) => Promise<void>
  ): Promise<void> {
    const startTime = performance.now();

    try {
      this.extractionMetrics.totalExtractions++;

      logger.debug('Coordinator: 미디어 클릭 처리 시작');

      // 추출 실행
      const result = await this.extractionCoordinator.extractFromClick(target, event);

      const duration = performance.now() - startTime;

      if (result.success) {
        this.extractionMetrics.successfulExtractions++;
        this.extractionMetrics.lastExtractedAt = Date.now();

        // 평균 지속시간 업데이트
        const currentAvg = this.extractionMetrics.averageDuration;
        const count = this.extractionMetrics.successfulExtractions;
        this.extractionMetrics.averageDuration = (currentAvg * (count - 1) + duration) / count;

        const managedResult: ManagedExtractionResult = {
          success: true,
          mediaItems: result.mediaItems,
          clickedIndex: result.clickedIndex,
          initialIndex: result.clickedIndex, // clickedIndex와 동일하게 설정
          source: result.source,
          duration,
        };

        logger.info('Coordinator: 미디어 추출 성공:', {
          mediaCount: result.mediaItems.length,
          source: result.source,
          duration: `${duration.toFixed(2)}ms`,
        });

        await onSuccess(managedResult);
      } else {
        logger.warn('CoordinatorManager: 미디어 추출 실패:', {
          duration: `${duration.toFixed(2)}ms`,
        });
      }

      // 성능 모니터링 로그 (개발 환경)
      if (
        this.config.enablePerformanceMonitoring &&
        this.extractionMetrics.totalExtractions % 10 === 0
      ) {
        this.logPerformanceMetrics();
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('CoordinatorManager: 미디어 클릭 처리 실패:', {
        error,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  }

  /**
   * 성능 메트릭 로깅
   */
  private logPerformanceMetrics(): void {
    const successRate =
      (this.extractionMetrics.successfulExtractions / this.extractionMetrics.totalExtractions) *
      100;

    logger.info('CoordinatorManager: 성능 메트릭:', {
      totalExtractions: this.extractionMetrics.totalExtractions,
      successfulExtractions: this.extractionMetrics.successfulExtractions,
      successRate: `${successRate.toFixed(1)}%`,
      averageDuration: `${this.extractionMetrics.averageDuration.toFixed(2)}ms`,
      lastExtracted: new Date(this.extractionMetrics.lastExtractedAt).toLocaleTimeString(),
    });
  }

  /**
   * 추출 상태 정리
   */
  public clearExtractionState(): void {
    this.extractionCoordinator.cleanup();
    logger.debug('CoordinatorManager: 추출 상태 정리됨');
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<CoordinatorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 개별 코디네이터들에 설정 전파
    if (newConfig.clickDebounceMs !== undefined || newConfig.enableKeyboard !== undefined) {
      this.eventCoordinator.updateConfig({
        clickDebounceMs: this.config.clickDebounceMs,
        enableKeyboard: this.config.enableKeyboard,
      });
    }

    // 간소화된 추출 코디네이터는 설정 업데이트 불필요

    logger.debug('CoordinatorManager: 설정 업데이트됨');
  }

  /**
   * 진단 정보
   */
  public getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      metrics: { ...this.extractionMetrics },
      coordinators: {
        event: this.eventCoordinator.getDiagnostics(),
        extraction: {
          status: 'simplified-version',
          message: 'Simplified extraction coordinator - no diagnostics available',
        },
      },
    };
  }

  /**
   * 상태 확인
   */
  public isRunning(): boolean {
    return this.isInitialized;
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('CoordinatorManager: 정리 시작');

      // 코디네이터들 정리
      await Promise.all([this.eventCoordinator.cleanup(), this.extractionCoordinator.cleanup()]);

      // 메트릭 초기화
      this.extractionMetrics = {
        totalExtractions: 0,
        successfulExtractions: 0,
        averageDuration: 0,
        lastExtractedAt: 0,
      };

      this.isInitialized = false;
      logger.info('✅ CoordinatorManager 정리 완료');
    } catch (error) {
      logger.error('❌ CoordinatorManager 정리 실패:', error);
    }
  }
}
