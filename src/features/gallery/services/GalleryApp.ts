/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * GalleryApp - 간결한 갤러리 애플리케이션 (리팩토링됨)
 *
 * 예시 코드를 기반으로 한 간결하고 직관적인 구현
 *
 * 설계 원칙:
 * - MediaClickDetector를 사용한 간결한 클릭 감지
 * - 복잡한 상태 관리 로직 제거
 * - Clean Architecture 준수
 * - 핵심 기능에만 집중
 */

import { SERVICE_KEYS } from '../../../core/constants';
import type { GalleryRenderer, MediaExtractor } from '../../../core/interfaces/gallery.interfaces';
import { getService } from '../../../core/services/ServiceRegistry';
import { scrollManager } from '../../../core/services';
import {
  galleryState,
  closeGallery,
  navigatePrevious,
  navigateNext,
  navigateToItem,
  setLoading,
} from '../../../core/state/signals/gallery.signals';
import type { MediaInfo } from '../../../core/types/media.types';
import { MediaExtractionService } from '../../media/extraction/services/MediaExtractor';
import { logger } from '../../../infrastructure/logging/logger';
import { undefinedToNull } from '../../../infrastructure/utils/type-safety-helpers';
import { GalleryStateGuard, VideoControlBlocker } from '../../../shared/utils';
import { MediaClickDetector } from '../../../shared/utils/media';
import type { GalleryAppConfig, IGalleryApp } from '../types';

export class GalleryApp implements IGalleryApp {
  // 서비스 의존성 (필수만 유지)
  private galleryRenderer: GalleryRenderer | null = null;
  private mediaExtractor: MediaExtractor | null = null;
  private readonly mediaExtractionService: MediaExtractionService;

  constructor() {
    this.mediaExtractionService = new MediaExtractionService();
  }

  // 상태 관리 (간소화)
  private isInitialized = false;
  private config: GalleryAppConfig = {
    autoTheme: true,
    keyboardShortcuts: true,
    performanceMonitoring: false,
  };

  // 이벤트 핸들러 (필수만 유지)
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;

  /**
   * 간소화된 초기화
   */
  async initialize(): Promise<void> {
    try {
      logger.info('GalleryApp: 초기화 시작');

      // ServiceRegistry를 통한 서비스 초기화
      await this.initializeServices();

      // 간결한 클릭 리스너 설정
      this.setupTweetPhotoClickListener();

      // 키보드 이벤트 설정
      this.setupGalleryKeyboardEvents();

      this.isInitialized = true;
      logger.info('GalleryApp: 초기화 완료');

      // 개발환경에서 디버깅 명령어 노출
      this.exposeDebugCommands();
    } catch (error) {
      logger.error('GalleryApp: 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * ServiceRegistry를 통한 서비스 초기화
   */
  private async initializeServices(): Promise<void> {
    try {
      logger.debug('GalleryApp: 서비스 초기화 중...');

      // ServiceRegistry를 통한 서비스 인스턴스 생성
      this.galleryRenderer = (await getService(SERVICE_KEYS.GALLERY_RENDERER)) as GalleryRenderer;

      // 통합된 미디어 추출 서비스 사용 (이미 constructor에서 초기화됨)
      this.mediaExtractor = this.mediaExtractionService;

      logger.debug('GalleryApp: 서비스 초기화 완료');
    } catch (error) {
      logger.error('GalleryApp: 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 간결한 미디어 클릭 감지 리스너 (예시 코드 기반)
   * 복잡한 로직을 제거하고 핵심 기능에 집중
   */
  private setupTweetPhotoClickListener(): void {
    this.clickHandler = (event: MouseEvent) => {
      // **핵심 수정**: 통합된 상태 보호 체크
      if (!GalleryStateGuard.canTriggerGallery(event)) {
        return;
      }

      const target = event.target as HTMLElement;

      // MediaClickDetector를 사용한 정확한 감지
      if (!MediaClickDetector.isProcessableMedia(target)) {
        return;
      }

      // **강화된 차단 로직**: 비디오 제어 요소 통합 체크
      if (VideoControlBlocker.shouldBlockGalleryTrigger(target)) {
        logger.debug('GalleryApp: Video control element click - allowing default behavior');
        return;
      }

      // 갤러리 차단 요소 확인 (기존 로직도 유지)
      if (MediaClickDetector.shouldBlockGalleryTrigger(target)) {
        logger.debug('GalleryApp: 갤러리 차단 요소 클릭 - 기본 동작 허용');
        return;
      }

      // 즉시 스크롤 보호 적용 (갤러리 렌더링 전) - 강화된 버전
      const savedPosition = scrollManager.lockPageScroll();

      logger.debug('GalleryApp: 스크롤 보호 적용 완료', {
        savedPosition,
        timestamp: Date.now(),
      });

      // 트위터 기본 동작 차단하고 갤러리 실행
      event.preventDefault();
      event.stopPropagation();

      logger.info('GalleryApp: 미디어 클릭 감지 - 갤러리 실행', {
        tagName: target.tagName,
        className: target.className,
        tweetPhoto: !!target.closest('[data-testid="tweetPhoto"]'),
      });

      // 갤러리 열기
      this.openGalleryFromClick(event);
    };

    document.addEventListener('click', this.clickHandler, { capture: true, passive: false });
    logger.info('GalleryApp: 간결한 클릭 리스너 등록 완료 (즉시 스크롤 보호 포함)');
  }

  /**
   * 클릭 이벤트에서 갤러리 열기 (안정적인 추출 서비스 사용)
   */
  private async openGalleryFromClick(event: MouseEvent): Promise<void> {
    try {
      const target = event.target as HTMLElement;

      // 지연 로딩 확인
      if (!this.isInitialized) {
        await this.loadGalleryComponents();
      }

      // 트윗 컨테이너 찾기
      const tweetContainer = target.closest('[data-testid="tweet"]') as HTMLElement;

      // 로딩 상태 시작
      setLoading(true);
      logger.debug('Loading state: true');

      // 통합된 미디어 추출 서비스 사용
      let result = await this.mediaExtractionService.extractFromClickedElement(target, {
        timeoutMs: 3000,
        includeVideos: true,
        enableValidation: true,
      });

      // 폴백: 기존 미디어 추출 서비스 사용
      if (!result.success && this.mediaExtractor) {
        logger.debug('GalleryApp: 폴백 추출 서비스 사용');
        result = await this.mediaExtractor.extractFromClickedElement(target);
      }

      if (result.success && result.mediaItems.length > 0) {
        const tweetId = tweetContainer
          ? this.extractTweetIdFromContainer(tweetContainer)
          : undefined;
        const mediaItems = [...result.mediaItems]; // readonly 배열을 일반 배열로 변환
        await this.openGalleryWithIndex(mediaItems, result.clickedIndex ?? 0, tweetId ?? undefined);
      } else {
        logger.warn('GalleryApp: 미디어 추출 실패');
      }
    } catch (error) {
      logger.error('GalleryApp: 갤러리 열기 실패:', error);
    } finally {
      // 로딩 상태 종료
      setLoading(false);
      logger.debug('Loading state: false');
    }
  }

  /**
   * 갤러리 컴포넌트들을 지연 로딩
   */
  private async loadGalleryComponents(): Promise<void> {
    logger.info('GalleryApp: 갤러리 컴포넌트 지연 로딩 시작');

    // 이미 초기화되었으면 추가 설정만
    if (!this.galleryRenderer) {
      await this.initializeServices();
    }

    logger.info('GalleryApp: 갤러리 컴포넌트 로딩 완료');
  }

  /**
   * 트윗 컨테이너에서 트윗 ID 추출
   */
  private extractTweetIdFromContainer(tweetContainer: HTMLElement): string | null {
    // data-tweet-id 속성에서 직접 추출
    const tweetId = tweetContainer.getAttribute('data-tweet-id');
    if (tweetId) {
      return tweetId;
    }

    // 트윗 링크에서 추출
    const tweetLink = tweetContainer.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
    if (tweetLink) {
      const match = tweetLink.href.match(/\/status\/(\d+)/);
      return undefinedToNull(match?.[1]);
    }

    return null;
  }

  /**
   * 갤러리가 열린 상태에서만 작동하는 키보드 이벤트
   */
  private setupGalleryKeyboardEvents(): void {
    this.keyHandler = (event: KeyboardEvent) => {
      // 갤러리가 열려있지 않으면 무시
      if (!galleryState.value.isOpen) {
        return;
      }

      switch (event.key) {
        case 'Escape':
          closeGallery();
          event.preventDefault();
          break;
        case 'ArrowLeft':
          navigatePrevious();
          event.preventDefault();
          break;
        case 'ArrowRight':
          navigateNext();
          event.preventDefault();
          break;
        case 'Home':
          navigateToItem(0);
          event.preventDefault();
          break;
        case 'End': {
          const totalItems = galleryState.value.mediaItems.length ?? 0;
          navigateToItem(totalItems - 1);
          event.preventDefault();
          break;
        }
      }
    };

    document.addEventListener('keydown', this.keyHandler);
    logger.debug('GalleryApp: 갤러리 키보드 이벤트 설정 완료');
  }

  /**
   * 갤러리 열기 (공개 메서드)
   */
  async openGallery(mediaItems: unknown[]): Promise<void> {
    const items = mediaItems as MediaInfo[];
    await this.openGalleryWithIndex(items, 0);
  }

  /**
   * 갤러리 닫기 (공개 메서드)
   */
  closeGallery(): void {
    closeGallery();
  }

  /**
   * 갤러리 열기 (인덱스 지정)
   */
  private async openGalleryWithIndex(
    mediaItems: MediaInfo[],
    startIndex: number,
    tweetId?: string
  ): Promise<void> {
    try {
      logger.info('GalleryApp: 갤러리 열기 시도', {
        mediaCount: mediaItems.length,
        startIndex,
        tweetId,
      });

      if (!this.galleryRenderer) {
        throw new Error('Gallery renderer not initialized');
      }

      // 중복 호출 방지: render()에서 openGallery를 호출하므로 여기서는 호출하지 않음
      // openGallery(mediaItems, startIndex, tweetId);

      // 갤러리 렌더링 (내부에서 openGallery 호출됨)
      await this.galleryRenderer.render(mediaItems, {
        startIndex,
        tweetId,
      });

      logger.info('GalleryApp: 갤러리 열기 성공');
    } catch (error) {
      logger.error('GalleryApp: 갤러리 열기 실패:', error);
      throw error;
    }
  }

  /**
   * 개발환경에서 디버깅 명령어 노출
   */
  private exposeDebugCommands(): void {
    if (process.env.NODE_ENV === 'development') {
      (window as Window & { xegDebug?: unknown }).xegDebug = {
        gallery: this,
        state: galleryState,
        closeGallery: () => closeGallery(),
        openGallery: (items: MediaInfo[], index = 0) => this.openGalleryWithIndex(items, index),
      };
      logger.debug('GalleryApp: 디버깅 명령어 노출됨 - window.xegDebug');
    }
  }

  /**
   * 정리 및 리소스 해제
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('GalleryApp: 정리 시작');

      // 이벤트 리스너 제거
      if (this.clickHandler) {
        document.removeEventListener('click', this.clickHandler, true);
        this.clickHandler = null;
      }

      if (this.keyHandler) {
        document.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
      }

      // 갤러리 닫기
      if (galleryState.value.isOpen) {
        closeGallery();
      }

      // 갤러리 렌더러 정리
      if (this.galleryRenderer) {
        this.galleryRenderer.destroy();
        this.galleryRenderer = null;
      }

      this.mediaExtractor = null;
      this.isInitialized = false;

      // 디버깅 명령어 제거
      if (process.env.NODE_ENV === 'development') {
        delete (window as Window & { xegDebug?: unknown }).xegDebug;
      }

      logger.info('GalleryApp: 정리 완료');
    } catch (error) {
      logger.error('GalleryApp: 정리 중 오류:', error);
    }
  }

  /**
   * 디버깅 정보 조회
   */
  getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      hasRenderer: !!this.galleryRenderer,
      hasExtractor: !!this.mediaExtractor,
      galleryState: {
        isOpen: galleryState.value.isOpen ?? false,
        mediaItems: galleryState.value.mediaItems ?? [],
        currentIndex: galleryState.value.currentIndex ?? 0,
        isLoading: galleryState.value.isLoading ?? false,
        error: galleryState.value.error ?? null,
      },
      config: this.config,
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<GalleryAppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug('GalleryApp: 설정 업데이트됨', this.config);
  }
}
