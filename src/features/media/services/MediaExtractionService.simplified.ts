/**
 * @fileoverview Enhanced Media Extraction Service (간소화 버전)
 * @description API 우선 + 기본 DOM 추출만 사용하는 간소화된 서비스
 * @deprecated SimplifiedMediaExtractor를 사용하세요
 * @version 2.0.0 - Simplified Architecture
 */

import { logger } from '../../../infrastructure/logging/logger';
import type {
  MediaExtractionResult,
  MediaExtractor,
} from '../../../core/interfaces/gallery.interfaces';
import { SimplifiedMediaExtractor } from '../extraction/services/SimplifiedMediaExtractor';

/**
 * Enhanced Media Extraction Service Options
 */
export interface EnhancedMediaExtractionOptions {
  /** 비디오 요소도 포함할지 여부 (기본값: true) */
  includeVideos?: boolean;
  /** API를 통한 동영상 추출 폴백 (기본값: true) */
  fallbackToVideoAPI?: boolean;
  /** 검증 활성화 (기본값: true) */
  enableValidation?: boolean;
}

/**
 * Enhanced Media Extraction Service (간소화 버전)
 * API 우선 + DOM 백업 2단계 전략만 사용
 */
export class MediaExtractionService implements MediaExtractor {
  private static instance: MediaExtractionService;
  private readonly simplifiedExtractor: SimplifiedMediaExtractor;

  private constructor() {
    this.simplifiedExtractor = new SimplifiedMediaExtractor();
  }

  public static getInstance(): MediaExtractionService {
    MediaExtractionService.instance ??= new MediaExtractionService();
    return MediaExtractionService.instance;
  }

  /**
   * 메인 추출 메서드 (간소화)
   */
  public async extractFromClickedElement(
    element: HTMLElement,
    options: EnhancedMediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    logger.debug('[MediaExtractionService] 간소화된 추출 시작');

    // 새로운 간소화된 추출기에 위임
    return this.simplifiedExtractor.extractFromClickedElement(element, {
      includeVideos: options.includeVideos ?? true,
      enableValidation: options.enableValidation ?? true,
      useApiFallback: options.fallbackToVideoAPI ?? true,
    });
  }

  /**
   * 컨테이너 추출 (간소화)
   */
  public async extractAllFromContainer(
    container: HTMLElement,
    options: EnhancedMediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    logger.debug('[MediaExtractionService] 컨테이너 추출 시작');

    // 컨테이너 내 첫 번째 미디어 요소를 찾아 추출
    const firstMedia = container.querySelector('img, video') as HTMLElement;
    if (!firstMedia) {
      return this.createErrorResult('컨테이너에서 미디어를 찾을 수 없음');
    }

    return this.extractFromClickedElement(firstMedia, options);
  }

  /**
   * 서비스 초기화 (호환성을 위해 유지)
   */
  async initialize(): Promise<void> {
    logger.debug('[MediaExtractionService] 초기화 완료 (간소화 버전)');
  }

  /**
   * 정리 작업 (호환성을 위해 유지)
   */
  public async dispose(): Promise<void> {
    logger.debug('[MediaExtractionService] 정리 완료 (간소화 버전)');
  }

  /**
   * 오류 결과 생성
   */
  private createErrorResult(message: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'error',
        strategy: 'simplified-media-extraction',
        error: message,
      },
      tweetInfo: null,
    };
  }
}
