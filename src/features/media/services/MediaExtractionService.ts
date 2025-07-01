/**
 * @fileoverview 미디어 추출 서비스 (간소화 버전)
 * @description SimplifiedMediaExtractor에 대한 호환성 래퍼
 * @version 2.0.0 - Simplified Architecture
 */

import { logger } from '../../../infrastructure/logging/logger';
import type {
  MediaExtractionResult,
  MediaExtractor,
  MediaExtractionOptions,
} from '../../../core/interfaces/gallery.interfaces';
import { SimplifiedMediaExtractor } from '../extraction/services/SimplifiedMediaExtractor';

/**
 * 미디어 추출 서비스 (SimplifiedMediaExtractor 래퍼)
 * 호환성을 위해 기존 인터페이스를 유지하면서 SimplifiedMediaExtractor에 위임
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
   * 메인 추출 메서드 (SimplifiedMediaExtractor에 위임)
   */
  public async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    try {
      // SimplifiedMediaExtractor에 위임
      const result = await this.simplifiedExtractor.extractFromClickedElement(element, {
        includeVideos: options.includeVideos ?? true,
        enableValidation: options.enableValidation ?? true,
      });

      // 호환성을 위해 sourceType 매핑
      return {
        ...result,
        sourceType: this.mapSourceType(result.sourceType),
      };
    } catch (error) {
      logger.error('[MediaExtractionService] 추출 실패:', error);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: -1,
        sourceType: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 컨테이너 추출 (호환성)
   */
  public async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
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
   * 서비스 초기화 (호환성)
   */
  async initialize(): Promise<void> {
    logger.debug('[MediaExtractionService] 초기화 완료 (간소화 버전)');
  }

  /**
   * 정리 작업 (호환성)
   */
  public async dispose(): Promise<void> {
    logger.debug('[MediaExtractionService] 정리 완료 (간소화 버전)');
  }

  /**
   * sourceType 매핑 (호환성)
   */
  private mapSourceType(sourceType?: string): string {
    switch (sourceType) {
      case 'api-first':
        return 'api';
      case 'dom-backup':
        return 'dom';
      default:
        return sourceType || 'unknown';
    }
  }

  /**
   * 오류 결과 생성
   */
  private createErrorResult(message: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      sourceType: 'error',
      error: message,
    };
  }
}
