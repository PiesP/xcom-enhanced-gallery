/**
 * @fileoverview Media Service - 통합 미디어 서비스
 * @description 모든 미디어 관련 기능을 통합한 서비스
 * @version 1.0.0 - Phase 2: Service Consolidation
 */

import { logger } from '@shared/logging/logger';
import type { BaseService } from '@shared/types/core/core-types';
import type { MediaExtractionResult } from '@shared/types/core/media.types';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/core/extraction.types';

// 기존 서비스들 import
import { MediaExtractionService } from './media-extraction/MediaExtractionService';
import { FallbackExtractor } from './media/FallbackExtractor';
import { VideoControlService } from './media/VideoControlService';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
} from './media/UsernameExtractionService';
import type { UsernameExtractionResult } from './media/UsernameExtractionService';

/**
 * 통합 미디어 서비스
 *
 * 기존 분산된 미디어 서비스들을 하나로 통합:
 * - MediaExtractionService
 * - FallbackExtractor
 * - VideoControlService
 * - UsernameExtractionService
 * - TwitterVideoExtractor 유틸리티들
 */
export class MediaService implements BaseService {
  private static instance: MediaService | null = null;
  private _isInitialized = false;

  // 통합된 서비스 컴포넌트들
  private readonly mediaExtraction: MediaExtractionService;
  private readonly fallbackExtractor: FallbackExtractor;
  private readonly videoControl: VideoControlService;
  private readonly usernameParser: UsernameParser;

  private constructor() {
    this.mediaExtraction = new MediaExtractionService();
    this.fallbackExtractor = new FallbackExtractor();
    this.videoControl = VideoControlService.getInstance();
    this.usernameParser = UsernameParser.getInstance();
  }

  public static getInstance(): MediaService {
    MediaService.instance ??= new MediaService();
    return MediaService.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    logger.info('MediaService initializing...');
    this._isInitialized = true;
    logger.info('MediaService initialized');
  }

  public destroy(): void {
    if (!this._isInitialized) return;

    logger.info('MediaService destroying...');
    this.videoControl.destroy();
    this._isInitialized = false;
    logger.info('MediaService destroyed');
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  // ====================================
  // Media Extraction API
  // ====================================

  /**
   * 클릭된 요소에서 미디어 추출
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.mediaExtraction.extractFromClickedElement(element, options);
  }

  /**
   * 컨테이너에서 모든 미디어 추출
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.mediaExtraction.extractAllFromContainer(container, options);
  }

  /**
   * 백업 추출 (API 실패 시)
   */
  async extractWithFallback(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    return this.fallbackExtractor.extract(element, options, extractionId, tweetInfo);
  }

  // ====================================
  // Video Control API
  // ====================================

  /**
   * 배경 비디오 일시정지 (갤러리 진입 시)
   */
  pauseAllBackgroundVideos(): void {
    this.videoControl.pauseAllBackgroundVideos();
  }

  /**
   * 배경 비디오 복원 (갤러리 종료 시)
   */
  restoreBackgroundVideos(): void {
    this.videoControl.restoreBackgroundVideos();
  }

  /**
   * 비디오 제어 서비스 활성 상태
   */
  isVideoControlActive(): boolean {
    return this.videoControl.isActive();
  }

  /**
   * 일시정지된 비디오 수
   */
  getPausedVideoCount(): number {
    return this.videoControl.getPausedVideoCount();
  }

  /**
   * 비디오 제어 강제 초기화
   */
  forceResetVideoControl(): void {
    this.videoControl.forceReset();
  }

  // ====================================
  // Username Extraction API
  // ====================================

  /**
   * 사용자명 추출 (상세 결과)
   */
  extractUsername(element?: HTMLElement | Document): UsernameExtractionResult {
    return this.usernameParser.extractUsername(element);
  }

  /**
   * 빠른 사용자명 추출 (문자열만)
   */
  parseUsernameFast(element?: HTMLElement | Document): string | null {
    return parseUsernameFast(element);
  }

  // ====================================
  // Twitter Video API (재export)
  // ====================================

  /**
   * Twitter Video 관련 유틸리티들을 재export
   * 기존 코드 호환성을 위해 유지
   */
  get TwitterVideoUtils() {
    return {
      // TwitterVideoExtractor에서 가져온 유틸리티들
      isVideoThumbnail: async (imgElement: HTMLImageElement) => {
        const { isVideoThumbnail } = await import('./media/TwitterVideoExtractor');
        return isVideoThumbnail(imgElement);
      },
      isVideoPlayer: async (element: HTMLElement) => {
        const { isVideoPlayer } = await import('./media/TwitterVideoExtractor');
        return isVideoPlayer(element);
      },
      isVideoElement: async (element: HTMLElement) => {
        const { isVideoElement } = await import('./media/TwitterVideoExtractor');
        return isVideoElement(element);
      },
      extractTweetId: async (url: string) => {
        const { extractTweetId } = await import('./media/TwitterVideoExtractor');
        return extractTweetId(url);
      },
      getTweetIdFromContainer: async (container: HTMLElement) => {
        const { getTweetIdFromContainer } = await import('./media/TwitterVideoExtractor');
        return getTweetIdFromContainer(container);
      },
      getVideoMediaEntry: async (tweetId: string, thumbnailUrl?: string) => {
        const { getVideoMediaEntry } = await import('./media/TwitterVideoExtractor');
        return getVideoMediaEntry(tweetId, thumbnailUrl);
      },
      getVideoUrlFromThumbnail: async (
        imgElement: HTMLImageElement,
        tweetContainer: HTMLElement
      ) => {
        const { getVideoUrlFromThumbnail } = await import('./media/TwitterVideoExtractor');
        return getVideoUrlFromThumbnail(imgElement, tweetContainer);
      },
    };
  }

  // ====================================
  // 편의 메서드들
  // ====================================

  /**
   * 미디어 추출 + 사용자명 추출을 한 번에
   */
  async extractMediaWithUsername(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult & { username: string | null }> {
    const [extractionResult, usernameResult] = await Promise.all([
      this.extractFromClickedElement(element, options),
      Promise.resolve(this.extractUsername(element)),
    ]);

    return {
      ...extractionResult,
      username: usernameResult.username,
    };
  }

  /**
   * 갤러리 진입 시 필요한 모든 미디어 설정
   */
  async prepareForGallery(): Promise<void> {
    this.pauseAllBackgroundVideos();
  }

  /**
   * 갤러리 종료 시 미디어 정리
   */
  async cleanupAfterGallery(): Promise<void> {
    this.restoreBackgroundVideos();
  }
}

/**
 * 전역 미디어 서비스 인스턴스
 */
export const mediaService = MediaService.getInstance();

// ====================================
// 편의 함수들 (기존 코드 호환성)
// ====================================

/**
 * 편의 함수: 사용자명 추출
 */
export { extractUsername };

/**
 * 편의 함수: 빠른 사용자명 추출
 */
export { parseUsernameFast };

/**
 * 편의 함수: 사용자명 추출 결과 타입
 */
export type { UsernameExtractionResult };
