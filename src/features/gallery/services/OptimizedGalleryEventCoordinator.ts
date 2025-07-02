/**
 * @fileoverview Optimized Gallery Event Coordinator - Clean Architecture Implementation
 * @license MIT
 * @version 2.0.0 - Enhanced Clean Architecture
 * @author X.com Enhanced Gallery Team
 *
 * @description
 * 갤러리 이벤트를 중앙집중식으로 관리하는 Clean Architecture 코디네이터.
 * 스마트 디바운싱과 통합된 이벤트 처리로 최적화된 사용자 경험을 제공합니다.
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging';
import { GalleryStateGuard, VideoControlBlocker } from '@shared/utils';
import { GalleryService, type GalleryInfo } from './GalleryService';

/**
 * 미디어 클릭 컨텍스트 정보 (임시 정의)
 */
interface MediaClickContext {
  readonly mediaInfo: MediaInfo;
  readonly element: HTMLElement;
  readonly event: MouseEvent;
  readonly tweetContainer?: HTMLElement;
  readonly timestamp: number;
}

import { Debouncer } from '../../../shared/utils/performance/Debouncer';

/**
 * 미디어 추출 결과 인터페이스
 */
export interface MediaExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  errors?: string[];
}

/**
 * 미디어 클릭 컨텍스트 생성 헬퍼
 */
function createMediaClickContext(
  mediaInfo: MediaInfo,
  element: HTMLElement,
  event: MouseEvent,
  tweetContainer?: HTMLElement
): MediaClickContext {
  return {
    mediaInfo,
    element,
    event,
    ...(tweetContainer && { tweetContainer }),
    timestamp: Date.now(),
  };
}

/**
 * 이벤트 코디네이터 옵션
 */
export interface CoordinatorOptions {
  /** 디바운싱 지연 시간 */
  debounceDelay?: number;
  /** 미디어 추출 활성화 여부 */
  enableMediaExtraction?: boolean;
  /** 디버그 모드 */
  debug?: boolean;
}

/**
 * 최적화된 갤러리 이벤트 코디네이터
 *
 * 핵심 기능:
 * - 미디어 클릭 이벤트 중앙 관리
 * - 스마트 디바운싱 적용
 * - 미디어 추출과 갤러리 열기 통합
 * - 이벤트 라이프사이클 관리
 * - 에러 처리 및 복구
 */
export class OptimizedGalleryEventCoordinator {
  private static instance: OptimizedGalleryEventCoordinator | null = null;

  private galleryService: GalleryService | null = null;
  private readonly debouncer: Debouncer<[MediaClickContext]>;
  private readonly options: CoordinatorOptions;
  private isInitialized = false;
  private readonly eventListeners: Map<string, EventListener> = new Map();

  private constructor(options: CoordinatorOptions = {}) {
    this.options = {
      enableMediaExtraction: true,
      debug: false,
      debounceDelay: 150,
      ...options,
    };

    // 간소화된 디바운서 사용
    this.debouncer = new Debouncer(
      this.handleDebouncedMediaClick.bind(this),
      this.options.debounceDelay ?? 150
    );

    logger.debug('OptimizedGalleryEventCoordinator: Instance created (lazy initialization)');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(options?: CoordinatorOptions): OptimizedGalleryEventCoordinator {
    OptimizedGalleryEventCoordinator.instance ??= new OptimizedGalleryEventCoordinator(options);
    return OptimizedGalleryEventCoordinator.instance;
  }

  /**
   * 갤러리 서비스가 초기화되었는지 확인하는 헬퍼 메서드
   */
  private ensureGalleryServiceInitialized(): GalleryService {
    if (!this.galleryService) {
      logger.error('OptimizedGalleryEventCoordinator: GalleryService is not initialized');
      throw new Error('GalleryService is not initialized. Call initialize() first.');
    }
    return this.galleryService;
  }

  /**
   * 코디네이터 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('OptimizedGalleryEventCoordinator: Already initialized');
      return;
    }

    try {
      logger.debug('OptimizedGalleryEventCoordinator: Initializing');

      // 갤러리 서비스 인스턴스 가져오기 및 초기화
      this.galleryService = GalleryService.getInstance();

      // **핵심 수정**: 명시적 초기화 호출 추가
      this.galleryService.initializeService();

      await this.galleryService.initialize();

      // 이벤트 리스너 등록
      this.attachEventListeners();

      this.isInitialized = true;
      logger.debug('OptimizedGalleryEventCoordinator: Initialization complete');
    } catch (error) {
      logger.error('OptimizedGalleryEventCoordinator: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 미디어 클릭 이벤트 처리 (메인 엔트리 포인트)
   */
  handleMediaClick(
    mediaInfo: MediaInfo,
    element: HTMLElement,
    event: MouseEvent,
    tweetContainer?: HTMLElement
  ): void {
    try {
      // **핵심 수정**: 갤러리 상태 사전 체크
      if (!GalleryStateGuard.canTriggerGallery(event)) {
        logger.debug('OptimizedGalleryEventCoordinator: Gallery trigger blocked by state guard');
        return;
      }

      // **강화된 차단 로직**: 비디오 제어 요소 통합 체크
      if (VideoControlBlocker.shouldBlockGalleryTrigger(element)) {
        logger.debug(
          'OptimizedGalleryEventCoordinator: Video control element click - allowing default behavior'
        );
        return;
      }

      // 미디어 클릭 컨텍스트 생성
      const context = createMediaClickContext(mediaInfo, element, event, tweetContainer);

      this.log('Handling media click', {
        mediaUrl: mediaInfo.url,
        mediaType: mediaInfo.type,
        elementTag: element.tagName,
      });

      // SmartDebouncer로 지능적인 디바운싱 처리
      this.debouncer.execute(context);
    } catch (error) {
      logger.error('OptimizedGalleryEventCoordinator: Failed to handle media click:', error);
    }
  }

  /**
   * 디바운싱된 미디어 클릭 처리 (내부 핸들러)
   */
  private async handleDebouncedMediaClick(context: MediaClickContext): Promise<void> {
    try {
      this.log('Processing debounced media click', {
        mediaUrl: context.mediaInfo.url,
        timestamp: context.timestamp,
      });

      // 미디어 추출이 활성화된 경우 추출 수행
      if (this.options.enableMediaExtraction) {
        const extractionResult = await this.extractMediaFromContext(context);

        if (extractionResult.success && extractionResult.mediaItems.length > 0) {
          // 추출된 미디어로 갤러리 열기
          await this.openGalleryWithExtractedMedia(extractionResult, context);
        } else {
          // 단일 미디어로 갤러리 열기
          await this.openGalleryWithSingleMedia(context);
        }
      } else {
        // 미디어 추출 없이 단일 미디어로 갤러리 열기
        await this.openGalleryWithSingleMedia(context);
      }
    } catch (error) {
      logger.error('OptimizedGalleryEventCoordinator: Failed to process debounced click:', error);
    }
  }

  /**
   * 컨텍스트에서 미디어 추출
   */
  private async extractMediaFromContext(
    context: MediaClickContext
  ): Promise<MediaExtractionResult> {
    try {
      this.log('Extracting media from context');

      // 기본적으로 현재 미디어만 반환 (실제 추출 로직은 별도 구현)
      return {
        success: true,
        mediaItems: [context.mediaInfo],
      };
    } catch (error) {
      logger.error('OptimizedGalleryEventCoordinator: Media extraction failed:', error);
      return {
        success: false,
        mediaItems: [],
        errors: [error instanceof Error ? error.message : 'Unknown extraction error'],
      };
    }
  }

  /**
   * 추출된 미디어로 갤러리 열기
   */
  private async openGalleryWithExtractedMedia(
    extractionResult: MediaExtractionResult,
    context: MediaClickContext
  ): Promise<void> {
    try {
      // 클릭된 미디어의 인덱스 찾기
      const clickedIndex = extractionResult.mediaItems.findIndex(
        item => item.url === context.mediaInfo.url
      );

      const initialIndex = clickedIndex >= 0 ? clickedIndex : 0;

      this.log('Opening gallery with extracted media', {
        mediaCount: extractionResult.mediaItems.length,
        initialIndex,
        clickedUrl: context.mediaInfo.url,
      });

      const galleryService = this.ensureGalleryServiceInitialized();
      const opened = await galleryService.openGallery(extractionResult.mediaItems, {
        initialIndex,
        viewMode: 'verticalList',
        source: 'extracted-media',
      });

      if (opened) {
        this.log('Gallery opened successfully with extracted media');
      } else {
        this.log('Gallery opening was skipped (already open with same media)');
      }
    } catch (error) {
      logger.error(
        'OptimizedGalleryEventCoordinator: Failed to open gallery with extracted media:',
        error
      );
      // 실패 시 단일 미디어로 폴백
      await this.openGalleryWithSingleMedia(context);
    }
  }

  /**
   * 단일 미디어로 갤러리 열기
   */
  private async openGalleryWithSingleMedia(context: MediaClickContext): Promise<void> {
    try {
      this.log('Opening gallery with single media', {
        mediaUrl: context.mediaInfo.url,
        mediaType: context.mediaInfo.type,
      });

      const galleryService = this.ensureGalleryServiceInitialized();
      const opened = await galleryService.openGallery([context.mediaInfo], {
        initialIndex: 0,
        viewMode: 'verticalList',
        source: 'single-media',
      });

      if (opened) {
        this.log('Gallery opened successfully with single media');
      } else {
        this.log('Gallery opening was skipped (already open with same media)');
      }
    } catch (error) {
      logger.error(
        'OptimizedGalleryEventCoordinator: Failed to open gallery with single media:',
        error
      );
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  private attachEventListeners(): void {
    try {
      // **핵심 수정**: 미디어 클릭 이벤트 리스너 추가 (capture phase에서 Twitter보다 먼저 처리)
      const mediaClickHandler = this.handleDocumentClick.bind(this) as EventListener;
      document.addEventListener('click', mediaClickHandler, { capture: true, passive: false });
      this.eventListeners.set('click', mediaClickHandler);

      // 키보드 이벤트 리스너
      const keyboardHandler = this.handleKeyboardEvent.bind(this) as EventListener;
      document.addEventListener('keydown', keyboardHandler);
      this.eventListeners.set('keydown', keyboardHandler);

      // 페이지 변경 감지 (SPA 라우팅)
      const hashChangeHandler = this.handleHashChange.bind(this) as EventListener;
      window.addEventListener('hashchange', hashChangeHandler);
      this.eventListeners.set('hashchange', hashChangeHandler);

      this.log('Event listeners attached (including media click capture)');
    } catch (error) {
      logger.error('OptimizedGalleryEventCoordinator: Failed to attach event listeners:', error);
    }
  }

  /**
   * 문서 클릭 이벤트 처리 (미디어 요소 감지)
   */
  private handleDocumentClick(event: Event): void {
    try {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;

      if (!target) {
        return;
      }

      // 미디어 요소 감지 및 MediaInfo 추출
      const mediaInfo = this.extractMediaInfoFromElement(target);
      if (!mediaInfo) {
        return; // 미디어 요소가 아님
      }

      // Twitter의 기본 갤러리 열기 방지
      event.preventDefault();
      event.stopPropagation();

      // 트윗 컨테이너 찾기
      const tweetContainer = this.findTweetContainer(target);

      this.log('Media click detected', {
        mediaUrl: mediaInfo.url,
        mediaType: mediaInfo.type,
        hasContainer: !!tweetContainer,
      });

      // 미디어 클릭 처리
      this.handleMediaClick(mediaInfo, target, mouseEvent, tweetContainer);
    } catch (error) {
      logger.error('OptimizedGalleryEventCoordinator: Failed to handle document click:', error);
    }
  }

  /**
   * 키보드 이벤트 처리
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    const galleryService = this.ensureGalleryServiceInitialized();
    const galleryInfo = galleryService.getGalleryInfo();

    if (!galleryInfo.isOpen || !galleryInfo.isValid) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        galleryService.closeGallery(true);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        galleryService.navigatePrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        galleryService.navigateNext();
        break;
    }
  }

  /**
   * 해시 변경 처리 (페이지 전환 시 갤러리 닫기)
   */
  private handleHashChange(): void {
    const galleryService = this.ensureGalleryServiceInitialized();
    const galleryInfo = galleryService.getGalleryInfo();

    if (galleryInfo.isOpen) {
      this.log('Page navigation detected, closing gallery');
      galleryService.closeGallery(false);
    }
  }

  /**
   * 요소에서 MediaInfo 추출
   */
  private extractMediaInfoFromElement(element: HTMLElement): MediaInfo | null {
    try {
      // 이미지 요소 처리
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        const mediaUrl = this.extractHighQualityImageUrl(img.src);
        if (mediaUrl) {
          return {
            id: this.generateMediaId(mediaUrl),
            url: mediaUrl,
            type: 'image' as const,
            thumbnailUrl: img.src,
            alt: img.alt || '',
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
          };
        }
      }

      // 비디오 요소 처리
      if (element.tagName === 'VIDEO') {
        const video = element as HTMLVideoElement;
        if (video.src) {
          return {
            id: this.generateMediaId(video.src),
            url: video.src,
            type: 'video' as const,
            thumbnailUrl: video.poster || '',
            width: video.videoWidth || video.width,
            height: video.videoHeight || video.height,
          };
        }
      }

      // 부모 요소에서 미디어 찾기 (Twitter 구조 고려)
      const mediaParent = element.closest(
        '[data-testid*="media"], [aria-label*="Image"], [aria-label*="Video"]'
      );
      if (mediaParent) {
        const mediaElement = mediaParent.querySelector('img, video') as
          | HTMLImageElement
          | HTMLVideoElement;
        if (mediaElement) {
          return this.extractMediaInfoFromElement(mediaElement);
        }
      }

      return null;
    } catch (error) {
      logger.warn('Failed to extract media info from element:', error);
      return null;
    }
  }

  /**
   * 고품질 이미지 URL 추출 (Twitter 특화)
   */
  private extractHighQualityImageUrl(originalUrl: string): string {
    try {
      // Twitter 이미지 URL에서 품질 매개변수 제거하여 원본 품질 확보
      const url = new URL(originalUrl);

      // Twitter 이미지 서버 감지
      if (url.hostname.includes('twimg.com') || url.hostname.includes('pbs.twimg.com')) {
        // format과 name 매개변수를 최고 품질로 설정
        url.searchParams.set('format', 'jpg');
        url.searchParams.set('name', 'large'); // 또는 'orig'
        return url.toString();
      }

      return originalUrl;
    } catch (error) {
      logger.warn('Failed to extract high quality image URL:', error);
      return originalUrl;
    }
  }

  /**
   * 트윗 컨테이너 요소 찾기
   */
  private findTweetContainer(element: HTMLElement): HTMLElement | undefined {
    // Twitter의 트윗 컨테이너 선택자들
    const tweetSelectors = [
      '[data-testid="tweet"]',
      '[data-testid="tweetText"]',
      'article[role="article"]',
      '.tweet',
    ];

    for (const selector of tweetSelectors) {
      const container = element.closest(selector) as HTMLElement;
      if (container) {
        return container;
      }
    }

    return undefined;
  }

  /**
   * 미디어 ID 생성
   */
  private generateMediaId(url: string): string {
    // URL에서 간단한 해시 생성
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return `media_${Math.abs(hash).toString(36)}`;
  }

  /**
   * 이벤트 리스너 해제
   */
  private detachEventListeners(): void {
    this.eventListeners.forEach((listener, eventType) => {
      if (eventType === 'hashchange') {
        window.removeEventListener(eventType, listener);
      } else {
        document.removeEventListener(eventType, listener);
      }
    });
    this.eventListeners.clear();
    this.log('Event listeners detached');
  }

  /**
   * 디버그 로깅
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.options.debug) {
      logger.debug(`OptimizedGalleryEventCoordinator: ${message}`, data);
    }
  }

  /**
   * 상태 정보 조회
   */
  getStatus(): {
    isInitialized: boolean;
    hasDebouncer: boolean;
    isPending: boolean;
    galleryInfo: GalleryInfo | null;
    eventListenerCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      hasDebouncer: !!this.debouncer,
      isPending: this.debouncer?.isPending() ?? false,
      galleryInfo: this.galleryService?.getGalleryInfo() ?? null,
      eventListenerCount: this.eventListeners.size,
    };
  }

  /**
   * 코디네이터 정리
   */
  async dispose(): Promise<void> {
    try {
      this.log('Disposing coordinator');

      // 디바운서 정리
      this.debouncer?.cancel();

      // 이벤트 리스너 해제
      this.detachEventListeners();

      // 갤러리 서비스 정리
      if (this.galleryService) {
        await this.galleryService.dispose();
      }

      this.isInitialized = false;
      OptimizedGalleryEventCoordinator.instance = null;

      logger.debug('OptimizedGalleryEventCoordinator: Disposed successfully');
    } catch (error) {
      logger.error('OptimizedGalleryEventCoordinator: Failed to dispose:', error);
    }
  }

  /**
   * 레거시 호환성을 위한 cleanup 별칭
   */
  async cleanup(): Promise<void> {
    return this.dispose();
  }
}

/**
 * 전역 이벤트 코디네이터 인스턴스
 */
export const galleryEventCoordinator = OptimizedGalleryEventCoordinator.getInstance();
