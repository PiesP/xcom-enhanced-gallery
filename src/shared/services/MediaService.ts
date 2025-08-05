/**
 * @fileoverview Media Service - 통합 미디어 서비스
 * @description 모든 미디어 관련 기능을 통합한 서비스
 * @version 1.0.0 - Phase 2: Service Consolidation
 */

import type { MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaInfo, MediaItem } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';
import { getNativeDownload } from '@shared/external/vendors';
import { getErrorMessage } from '@shared/utils/error-handling';
import { generateMediaFilename } from '@shared/media';
import { createElement } from '@shared/dom';

// 통합된 서비스 타입들
/**
 * 미디어 로딩 상태 (MediaLoadingService에서 통합)
 */
export interface MediaLoadingState {
  isLoading: boolean;
  hasError: boolean;
  loadedUrl?: string;
  errorMessage?: string;
}

/**
 * 미디어 로딩 옵션
 */
export interface MediaLoadingOptions {
  retryAttempts?: number;
  timeout?: number;
}

/**
 * 프리페치 옵션 (MediaPrefetchingService에서 통합)
 */
export interface PrefetchOptions {
  maxConcurrent?: number;
  prefetchRange?: number;
}

/**
 * 대량 다운로드 관련 타입들 (BulkDownloadService에서 통합)
 */
export interface DownloadProgress {
  phase: 'preparing' | 'downloading' | 'complete';
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}

export interface BulkDownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  zipFilename?: string;
}

export interface DownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

// 기존 서비스들 import
import { MediaExtractionService } from './media-extraction/MediaExtractionService';
import { FallbackExtractor } from './media/FallbackExtractor';
import {
  UsernameParser,
  extractUsername,
  parseUsernameFast,
} from './media/UsernameExtractionService';
import type { UsernameExtractionResult } from './media/UsernameExtractionService';

/**
 * 비디오 상태 정보 (VideoControlService에서 통합)
 */
interface VideoState {
  /** 정지 전 재생 상태 */
  wasPlaying: boolean;
  /** 정지 전 재생 위치 */
  currentTime: number;
  /** 정지 전 볼륨 */
  volume: number;
  /** 정지 전 음소거 상태 */
  muted: boolean;
}

/**
 * 통합 미디어 서비스 - Phase 4 간소화
 *
 * 기존 분산된 미디어 서비스들을 하나로 통합:
 * - MediaExtractionService
 * - FallbackExtractor
 * - VideoControlService (직접 통합)
 * - UsernameExtractionService
 * - TwitterVideoExtractor 유틸리티들
 * - WebPOptimizationService
 */
export class MediaService {
  private static instance: MediaService | null = null;

  // 통합된 서비스 컴포넌트들
  private readonly mediaExtraction: MediaExtractionService;
  private readonly fallbackExtractor: FallbackExtractor;
  private readonly usernameParser: UsernameParser;

  // VideoControlService 통합된 상태
  private readonly pausedVideos = new Map<HTMLVideoElement, VideoState>();
  private isGalleryActive = false;
  private cleanupInterval: number | null = null;

  // WebP 최적화 관련 상태
  private webpSupported: boolean | null = null;

  // 미디어 로딩 관련 상태 (MediaLoadingService 통합)
  private readonly mediaLoadingStates = new Map<string, MediaLoadingState>();

  // 미디어 프리페칭 관련 상태 (MediaPrefetchingService 통합)
  private readonly prefetchCache = new Map<string, Blob>();
  private readonly activePrefetchRequests = new Map<string, AbortController>();
  private readonly maxCacheEntries = 20;
  private prefetchCacheHits = 0;
  private prefetchCacheMisses = 0;

  // 대량 다운로드 관련 상태 (BulkDownloadService 통합)
  private readonly currentAbortController?: AbortController;

  constructor() {
    this.mediaExtraction = new MediaExtractionService();
    this.fallbackExtractor = new FallbackExtractor();
    this.usernameParser = new UsernameParser(); // Phase 4 간소화: 직접 인스턴스화

    // WebP 지원 감지 초기화 (테스트 환경에서는 건너뛰기)
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      this.detectWebPSupport().catch(error => {
        logger.warn('[MediaService] WebP detection initialization failed:', error);
      });
    } else {
      // 테스트 환경에서는 기본값 설정
      this.webpSupported = false;
    }

    // 비디오 정리 타이머 시작
    this.startVideoCleanupTimer();
  }

  public static getInstance(): MediaService {
    MediaService.instance ??= new MediaService();
    return MediaService.instance;
  }

  protected async onInitialize(): Promise<void> {
    // MediaService는 특별한 초기화 로직이 없음
  }

  protected onDestroy(): void {
    // 비디오 상태 복원 및 정리
    this.restoreBackgroundVideos();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logger.info('[MediaService] 서비스 종료됨');
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
    if (this.isGalleryActive) {
      logger.debug('[MediaService] 이미 갤러리가 활성화되어 있음 - 중복 호출 무시');
      return;
    }

    const videos = this.findAllBackgroundVideos();
    logger.info(`[MediaService] 배경 비디오 ${videos.length}개 정지 중...`);

    let pausedCount = 0;
    videos.forEach(video => {
      try {
        if (!video.paused && this.isValidVideo(video)) {
          // 복원용 상태 저장
          this.pausedVideos.set(video, {
            wasPlaying: true,
            currentTime: video.currentTime,
            volume: video.volume,
            muted: video.muted,
          });

          video.pause();
          pausedCount++;
          logger.debug(`[MediaService] 비디오 정지: ${this.getVideoInfo(video)}`);
        }
      } catch (error) {
        logger.warn('[MediaService] 비디오 정지 실패:', error);
      }
    });

    this.isGalleryActive = true;
    logger.info(`[MediaService] 배경 비디오 정지 완료: ${pausedCount}개`);
  }

  /**
   * 배경 비디오 복원 (갤러리 종료 시)
   */
  restoreBackgroundVideos(): void {
    if (!this.isGalleryActive) {
      logger.debug('[MediaService] 갤러리가 활성화되지 않았음 - 복원 무시');
      return;
    }

    logger.info(`[MediaService] 배경 비디오 상태 복원 중... (${this.pausedVideos.size}개)`);

    let restoredCount = 0;
    this.pausedVideos.forEach((state, video) => {
      try {
        if (this.isValidVideo(video) && state.wasPlaying) {
          // 비디오가 여전히 DOM에 존재하고 접근 가능한 경우에만 복원
          video.currentTime = state.currentTime;
          video.volume = state.volume;
          video.muted = state.muted;

          video.play().catch(error => {
            logger.debug('[MediaService] 비디오 재생 복원 실패 (정상적인 상황):', error);
          });

          restoredCount++;
          logger.debug(`[MediaService] 비디오 복원: ${this.getVideoInfo(video)}`);
        }
      } catch (error) {
        logger.warn('[MediaService] 비디오 복원 실패:', error);
      }
    });

    this.pausedVideos.clear();
    this.isGalleryActive = false;
    logger.info(`[MediaService] 배경 비디오 상태 복원 완료: ${restoredCount}개`);
  }

  /**
   * 비디오 제어 서비스 활성 상태
   */
  isVideoControlActive(): boolean {
    return this.isGalleryActive;
  }

  /**
   * 일시정지된 비디오 수
   */
  getPausedVideoCount(): number {
    return this.pausedVideos.size;
  }

  /**
   * 비디오 제어 강제 초기화
   */
  forceResetVideoControl(): void {
    logger.warn('[MediaService] 강제 초기화 실행');
    this.pausedVideos.clear();
    this.isGalleryActive = false;
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
  // 간단한 래퍼 메서드들 (Step 4 호환성)
  // ====================================

  /**
   * 미디어 추출 (단순화된 인터페이스)
   */
  async extractMedia(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    return this.extractFromClickedElement(element, options);
  }

  /**
   * 미디어 다운로드 (단순화된 인터페이스)
   */
  async downloadMedia(media: MediaInfo | MediaItem): Promise<SingleDownloadResult> {
    return this.downloadSingle(media);
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

  // ====================================
  // WebP Optimization API (통합됨)
  // ====================================

  /**
   * WebP 지원 여부 감지
   */
  private async detectWebPSupport(): Promise<void> {
    try {
      // 테스트 환경에서는 기본값 false 사용
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        this.webpSupported = false;
        return;
      }

      const canvas = createElement('canvas', {
        width: '1',
        height: '1',
      }) as HTMLCanvasElement;

      // canvas.toDataURL이 구현되지 않은 경우 (예: jsdom)
      if (typeof canvas.toDataURL !== 'function') {
        this.webpSupported = false;
        logger.debug('[MediaService] WebP detection skipped (canvas.toDataURL not available)');
        return;
      }

      try {
        const dataURL = canvas.toDataURL('image/webp');

        // dataURL이 null이나 유효하지 않은 경우 처리
        if (!dataURL || typeof dataURL !== 'string') {
          this.webpSupported = false;
          logger.debug('[MediaService] WebP detection failed (invalid dataURL)');
          return;
        }

        this.webpSupported = dataURL.indexOf('data:image/webp') === 0;
        logger.debug('[MediaService] WebP support detected:', this.webpSupported);
      } catch (innerError) {
        this.webpSupported = false;
        logger.warn('[MediaService] WebP detection failed:', innerError);
      }
    } catch (outerError) {
      this.webpSupported = false;
      logger.warn('[MediaService] WebP detection initialization failed:', outerError);
    }
  }

  /**
   * WebP 지원 여부 반환
   */
  isWebPSupported(): boolean {
    return this.webpSupported ?? false;
  }

  /**
   * 최적 이미지 URL 생성 (WebP 최적화)
   */
  getOptimizedImageUrl(originalUrl: string): string {
    if (!this.isWebPSupported()) {
      return originalUrl;
    }

    // Twitter 이미지 URL에서 WebP 변환
    if (originalUrl.includes('pbs.twimg.com') && !originalUrl.includes('format=webp')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}format=webp`;
    }

    return originalUrl;
  }

  /**
   * WebP 최적화 (테스트에서 요구하는 메서드명)
   */
  optimizeWebP(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl);
  }

  /**
   * 트위터 이미지 URL 최적화 (하위 호환성)
   */
  optimizeTwitterImageUrl(originalUrl: string): string {
    return this.getOptimizedImageUrl(originalUrl);
  }

  // ====================================
  // Media Loading API (통합됨)
  // ====================================

  /**
   * 미디어 요소 등록 및 로딩
   */
  registerMediaElement(
    id: string,
    element: HTMLElement,
    options: { src: string } = { src: '' }
  ): void {
    this.mediaLoadingStates.set(id, {
      isLoading: true,
      hasError: false,
    });

    this.loadMediaElement(id, element, options.src);
  }

  /**
   * 미디어 요소 등록 해제
   */
  unregisterMediaElement(id: string): void {
    this.mediaLoadingStates.delete(id);
  }

  /**
   * 로딩 상태 조회
   */
  getLoadingState(id: string): MediaLoadingState | undefined {
    return this.mediaLoadingStates.get(id);
  }

  /**
   * 미디어 로딩 실행
   */
  private loadMediaElement(id: string, element: HTMLElement, src: string): void {
    if (element instanceof HTMLImageElement) {
      this.loadImage(id, element, src);
    } else if (element instanceof HTMLVideoElement) {
      this.loadVideo(id, element, src);
    }
  }

  /**
   * 이미지 로딩
   */
  private loadImage(id: string, img: HTMLImageElement, src: string): void {
    const state = this.mediaLoadingStates.get(id);
    if (!state) return;

    img.onload = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = false;
        currentState.loadedUrl = src;
      }
    };

    img.onerror = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = true;
        currentState.errorMessage = 'Image load failed';
      }
    };

    img.src = src;
  }

  /**
   * 비디오 로딩
   */
  private loadVideo(id: string, video: HTMLVideoElement, src: string): void {
    const state = this.mediaLoadingStates.get(id);
    if (!state) return;

    video.onloadeddata = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = false;
        currentState.loadedUrl = src;
      }
    };

    video.onerror = () => {
      const currentState = this.mediaLoadingStates.get(id);
      if (currentState) {
        currentState.isLoading = false;
        currentState.hasError = true;
        currentState.errorMessage = 'Video load failed';
      }
    };

    video.src = src;
  }

  // ====================================
  // Media Prefetching API (통합됨)
  // ====================================

  /**
   * 미디어 배열에서 현재 인덱스 기준으로 다음 이미지들을 프리페치
   */
  async prefetchNextMedia(
    mediaItems: readonly string[],
    currentIndex: number,
    options: PrefetchOptions = {}
  ): Promise<void> {
    const maxConcurrent = options.maxConcurrent || 2;
    const prefetchRange = options.prefetchRange || 2;

    const prefetchUrls = this.calculatePrefetchUrls(mediaItems, currentIndex, prefetchRange);

    logger.debug('[MediaService] 미디어 프리페칭 시작:', { currentIndex, prefetchUrls });

    // 동시 프리페치 수 제한
    for (const url of prefetchUrls) {
      if (this.activePrefetchRequests.size >= maxConcurrent) {
        break;
      }

      void this.prefetchSingle(url);
    }
  }

  /**
   * 단일 미디어 프리페치
   */
  private async prefetchSingle(url: string): Promise<void> {
    // 이미 캐시되어 있거나 프리페치 중인 경우 스킵
    if (this.prefetchCache.has(url) || this.activePrefetchRequests.has(url)) {
      return;
    }

    const abortController = new AbortController();
    this.activePrefetchRequests.set(url, abortController);

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        mode: 'cors',
        cache: 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // 간단한 캐시 관리
      if (this.prefetchCache.size >= this.maxCacheEntries) {
        this.evictFirstPrefetchEntry();
      }

      this.prefetchCache.set(url, blob);
      logger.debug('[MediaService] 프리페치 성공:', { url, size: blob.size });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.warn('[MediaService] 프리페치 실패:', error, { url });
      }
    } finally {
      this.activePrefetchRequests.delete(url);
    }
  }

  /**
   * 프리페치할 URL들 계산
   */
  private calculatePrefetchUrls(
    mediaItems: readonly string[],
    currentIndex: number,
    prefetchRange: number
  ): string[] {
    const urls: string[] = [];

    // 다음 N개 이미지들만 프리페치
    for (let i = 1; i <= prefetchRange; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < mediaItems.length && mediaItems[nextIndex]) {
        urls.push(mediaItems[nextIndex]);
      }
    }

    return urls;
  }

  /**
   * 가장 먼저 추가된 프리페치 캐시 엔트리 제거
   */
  private evictFirstPrefetchEntry(): void {
    const firstKey = this.prefetchCache.keys().next().value;
    if (firstKey) {
      this.prefetchCache.delete(firstKey);
      logger.debug('[MediaService] 프리페치 캐시 엔트리 제거:', firstKey);
    }
  }

  /**
   * 캐시에서 미디어 조회
   */
  getCachedMedia(url: string): Blob | null {
    const blob = this.prefetchCache.get(url);
    if (blob) {
      this.prefetchCacheHits++;
      logger.debug('[MediaService] 프리페치 캐시 히트:', { url });
      return blob;
    }

    this.prefetchCacheMisses++;
    return null;
  }

  /**
   * 모든 프리페치 요청 취소
   */
  cancelAllPrefetch(): void {
    for (const controller of this.activePrefetchRequests.values()) {
      controller.abort();
    }
    this.activePrefetchRequests.clear();
    logger.debug('[MediaService] 모든 프리페치 요청이 취소되었습니다.');
  }

  /**
   * 프리페치 캐시 정리
   */
  clearPrefetchCache(): void {
    this.prefetchCache.clear();
    logger.debug('[MediaService] 프리페치 캐시가 정리되었습니다.');
  }

  /**
   * 프리페치 메트릭 조회
   */
  getPrefetchMetrics() {
    const hitRate =
      this.prefetchCacheHits + this.prefetchCacheMisses > 0
        ? (this.prefetchCacheHits / (this.prefetchCacheHits + this.prefetchCacheMisses)) * 100
        : 0;

    return {
      cacheHits: this.prefetchCacheHits,
      cacheMisses: this.prefetchCacheMisses,
      cacheEntries: this.prefetchCache.size,
      hitRate,
      activePrefetches: this.activePrefetchRequests.size,
    };
  }

  // ====================================
  // 대량 다운로드 기능 (BulkDownloadService 통합)
  // ====================================

  /**
   * MediaInfo를 FilenameService와 호환되는 타입으로 변환
   */
  private ensureMediaItem(media: MediaInfo | MediaItem): MediaItem & { id: string } {
    return {
      ...media,
      id: media.id || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * 단일 미디어 다운로드
   */
  async downloadSingle(media: MediaInfo | MediaItem): Promise<SingleDownloadResult> {
    try {
      const download = getNativeDownload();
      const converted = this.ensureMediaItem(media);
      const filename = generateMediaFilename(converted);

      // URL에서 fetch하여 Blob으로 다운로드
      const response = await fetch(media.url);
      const blob = await response.blob();
      download.downloadBlob(blob, filename);

      logger.debug(`Single download initiated: ${filename}`);
      return { success: true, filename };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`Single download failed: ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * 여러 미디어를 ZIP으로 다운로드
   */
  async downloadMultiple(
    mediaItems: Array<MediaInfo | MediaItem>,
    options: BulkDownloadOptions
  ): Promise<DownloadResult> {
    try {
      const { getFflate } = await import('@shared/external/vendors');
      const fflate = getFflate();
      const download = getNativeDownload();

      const files: Record<string, Uint8Array> = {};
      let successful = 0;

      options.onProgress?.({
        phase: 'preparing',
        current: 0,
        total: mediaItems.length,
        percentage: 0,
      });

      // 파일들을 다운로드하여 ZIP에 추가
      for (let i = 0; i < mediaItems.length; i++) {
        if (this.currentAbortController?.signal.aborted) {
          throw new Error('Download cancelled by user');
        }

        const media = mediaItems[i];
        if (!media) continue;

        options.onProgress?.({
          phase: 'downloading',
          current: i + 1,
          total: mediaItems.length,
          percentage: Math.round(((i + 1) / mediaItems.length) * 100),
          filename: media.filename,
        });

        try {
          const response = await fetch(media.url);
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const converted = this.ensureMediaItem(media);
          const filename = generateMediaFilename(converted);
          files[filename] = uint8Array;
          successful++;
        } catch (error) {
          logger.warn(`Failed to download ${media.filename}: ${getErrorMessage(error)}`);
        }
      }

      if (successful === 0) {
        throw new Error('All downloads failed');
      }

      // ZIP 생성
      const zipData = fflate.zipSync(files);
      const zipFilename = options.zipFilename || `download_${Date.now()}.zip`;

      // ZIP 다운로드
      const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
      download.downloadBlob(blob, zipFilename);

      options.onProgress?.({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });

      logger.debug(
        `ZIP download complete: ${zipFilename} (${successful}/${mediaItems.length} files)`
      );

      return {
        success: true,
        filesProcessed: mediaItems.length,
        filesSuccessful: successful,
        filename: zipFilename,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`ZIP download failed: ${message}`);
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: message,
      };
    }
  }

  /**
   * 대량 다운로드 (테스트 호환성을 위한 별칭)
   */
  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.downloadMultiple(Array.from(mediaItems), options);
  }

  /**
   * 현재 다운로드 중단
   */
  public cancelDownload(): void {
    this.currentAbortController?.abort();
    logger.debug('Current download cancelled');
  }

  /**
   * 현재 다운로드 중인지 확인
   */
  public isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }

  // ====================================
  // Video Control Helper Methods (VideoControlService에서 통합)
  // ====================================

  /**
   * 배경 비디오 요소들 찾기
   */
  private findAllBackgroundVideos(): HTMLVideoElement[] {
    const selectors = [
      'video',
      '[data-testid="videoPlayer"] video',
      '[data-testid="previewInterstitial"] video',
      '.r-1p0dtai video', // 트위터 비디오 컨테이너
      '[data-testid="videoComponent"] video',
    ];

    const videos: HTMLVideoElement[] = [];
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll<HTMLVideoElement>(selector);
        elements.forEach(video => {
          if (video instanceof HTMLVideoElement && !this.isGalleryVideo(video)) {
            videos.push(video);
          }
        });
      } catch (error) {
        logger.debug(`[MediaService] 선택자 처리 실패: ${selector}`, error);
      }
    });

    return videos;
  }

  /**
   * 갤러리 내부 비디오인지 확인
   */
  private isGalleryVideo(video: HTMLVideoElement): boolean {
    const gallerySelectors = [
      '.xeg-gallery',
      '.xeg-gallery-container',
      '[data-xeg-role]',
      '[data-gallery-element]',
      '[data-gallery-video]',
      '#xeg-gallery-root',
      '.vertical-gallery-view',
    ];

    return gallerySelectors.some(selector => {
      try {
        return video.closest(selector) !== null || video.hasAttribute('data-gallery-video');
      } catch {
        return false;
      }
    });
  }

  /**
   * 비디오 유효성 검사
   */
  private isValidVideo(video: HTMLVideoElement): boolean {
    try {
      // DOM에 연결되어 있고 접근 가능한지 확인
      return (
        video.isConnected && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.ended
      );
    } catch {
      return false;
    }
  }

  /**
   * 비디오 정보 문자열 생성 (디버깅용)
   */
  private getVideoInfo(video: HTMLVideoElement): string {
    try {
      const src = video.src || video.currentSrc || 'unknown';
      const duration = video.duration || 0;
      return `${src.substring(0, 50)}... (${duration.toFixed(1)}s)`;
    } catch {
      return 'unknown video';
    }
  }

  /**
   * 정리 타이머 시작 (메모리 누수 방지)
   */
  private startVideoCleanupTimer(): void {
    // 테스트 환경에서는 setInterval을 사용하지 않음
    if (typeof window !== 'undefined' && window.setInterval) {
      this.cleanupInterval = window.setInterval(() => {
        // 더 이상 DOM에 없는 비디오 참조 정리
        const invalidVideos: HTMLVideoElement[] = [];
        this.pausedVideos.forEach((_state, video) => {
          if (!this.isValidVideo(video)) {
            invalidVideos.push(video);
          }
        });

        invalidVideos.forEach(video => {
          this.pausedVideos.delete(video);
        });

        if (invalidVideos.length > 0) {
          logger.debug(`[MediaService] 무효한 비디오 참조 ${invalidVideos.length}개 정리`);
        }
      }, 30000); // 30초마다 정리
    }
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
