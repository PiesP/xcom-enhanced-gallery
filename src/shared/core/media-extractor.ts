/**
 * @fileoverview Media Extractor - 통합 미디어 추출 서비스
 * @description Phase 2: 모든 미디어 관련 기능을 통합한 핵심 서비스
 * @version 2.0.0 - Layer Simplification
 */

import { logger } from '@shared/logging/logger';
import type { BaseService } from '@shared/types/app.types';
import type { MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/media.types';

// 기존 서비스들 import
import { MediaExtractionService } from '../services/media-extraction/MediaExtractionService';
import { FallbackExtractor } from '../services/media/FallbackExtractor';
import { VideoControlService } from '../services/media/VideoControlService';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
} from '../services/media/UsernameExtractionService';
import type { UsernameExtractionResult } from '../services/media/UsernameExtractionService';

/**
 * 통합 미디어 추출 서비스
 *
 * 모든 미디어 관련 기능을 하나로 통합:
 * - MediaExtractionService (미디어 추출)
 * - FallbackExtractor (대체 추출)
 * - VideoControlService (비디오 제어)
 * - UsernameExtractionService (사용자명 추출)
 * - TwitterVideoExtractor (비디오 추출)
 */
export class MediaExtractor implements BaseService {
  private static instance: MediaExtractor | null = null;
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

  public static getInstance(): MediaExtractor {
    MediaExtractor.instance ??= new MediaExtractor();
    return MediaExtractor.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    logger.info('MediaExtractor initializing...');
    this._isInitialized = true;
    logger.info('MediaExtractor initialized');
  }

  public destroy(): void {
    if (!this._isInitialized) return;

    logger.info('MediaExtractor destroying...');
    this.videoControl.destroy();
    this._isInitialized = false;
    logger.info('MediaExtractor destroyed');
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
   * URL에서 트윗 정보 추출 (MediaExtractionService에 해당 메서드 없음)
   */
  async extractFromUrl(_url: string): Promise<TweetInfo | null> {
    // URL에서 트윗 정보 추출 로직을 직접 구현하거나 생략
    logger.warn('extractFromUrl not implemented in MediaExtractionService');
    return null;
  }

  /**
   * 대체 추출 방법
   */
  async extractFallback(element: HTMLElement): Promise<MediaExtractionResult> {
    const extractionId = `fallback_${Date.now()}`;
    return this.fallbackExtractor.extract(element, {}, extractionId);
  }

  // ====================================
  // Video Control API
  // ====================================

  /**
   * 비디오 재생 제어
   */
  async pauseAllVideos(): Promise<void> {
    // VideoControlService에 pauseAllVideos 메서드가 없으므로 대체 구현
    this.videoControl.pauseAllBackgroundVideos();
  }

  /**
   * 비디오 음소거
   */
  async muteAllVideos(): Promise<void> {
    // VideoControlService에 muteAllVideos 메서드가 없으므로 대체 구현
    logger.info('muteAllVideos not implemented in VideoControlService');
  }

  // ====================================
  // Username Extraction API
  // ====================================

  /**
   * 사용자명 추출 (빠른 버전)
   */
  extractUsernameFast(element?: HTMLElement | Document): string | null {
    return parseUsernameFast(element);
  }

  /**
   * 사용자명 추출 (정확한 버전)
   */
  extractUsername(element?: HTMLElement | Document): UsernameExtractionResult {
    return extractUsername(element);
  }

  /**
   * 현재 페이지에서 사용자명 추출
   */
  extractUsernameFromPage(): UsernameExtractionResult {
    return this.usernameParser.extractUsername();
  }
}

/**
 * 전역 MediaExtractor 인스턴스
 */
export const mediaExtractor = MediaExtractor.getInstance();

// 편의 함수들 (호환성)
export { extractUsername, parseUsernameFast };
export type { UsernameExtractionResult };
