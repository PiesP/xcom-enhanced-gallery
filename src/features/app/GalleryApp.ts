/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * GalleryApp - 통합된 갤러리 애플리케이션
 *
 * data-testid="tweetPhoto" 내부 요소 클릭만 감지하여
 * 갤러리를 실행하는 통합된 구현
 *
 * 설계 원칙:
 * - Factory 패턴 사용으로 의존성 주입 통일
 * - Clean Architecture 준수
 * - 지연 로딩으로 성능 최적화
 * - 단일 책임 원칙 적용
 */

import { MEDIA_URL_UTILS } from '@core/constants/twitter-endpoints';
import { GalleryFactory } from '@core/factories/gallery.factory';
import type { GalleryRenderer, MediaExtractor } from '@core/interfaces/gallery.interfaces';
import { GalleryStateManager } from '@core/state/signals/gallery-state.signals';
import { EnhancedMediaExtractionService } from '@features/media/services/EnhancedMediaExtractionService';
import { logger } from '@infrastructure/logging/logger';
import { VideoControlUtil } from '@shared/utils/media/video-control.util';
import { VideoStateManager } from '@shared/utils/media/video-state-manager';

export class GalleryApp {
  private galleryRenderer: GalleryRenderer | null = null;
  private mediaExtractor: MediaExtractor | null = null;
  private galleryState: GalleryStateManager | null = null;
  private videoControlUtil: VideoControlUtil | null = null;
  private videoStateManager: VideoStateManager | null = null;
  private isInitialized = false;
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private galleryTriggerHandler: ((event: Event) => void) | null = null;

  /**
   * 통합된 초기화: Factory 패턴과 단일 이벤트 리스너 사용
   */
  async initialize(): Promise<void> {
    try {
      logger.info('GalleryApp: 통합 모드로 초기화 시작');

      // Factory를 통한 서비스 초기화
      await this.initializeServices();

      this.setupTweetPhotoClickListener();

      // 동영상 상태 변화 감지 및 갤러리 트리거 설정
      this.setupVideoStateManagement();

      this.isInitialized = true;
      logger.info('GalleryApp: 초기화 완료 - tweetPhoto 클릭 대기 중');

      // 실제 등록된 이벤트 리스너 확인을 위한 추가 로그
      logger.debug('GalleryApp: 이벤트 리스너 활성화 상태:', {
        clickHandlerActive: !!this.clickHandler,
        clickHandlerType: typeof this.clickHandler,
      });
    } catch (error) {
      logger.error('GalleryApp: 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * Factory를 통한 서비스 초기화
   */
  private async initializeServices(): Promise<void> {
    try {
      logger.debug('GalleryApp: 서비스 초기화 중...');

      // Factory를 통해 서비스 인스턴스 생성
      this.galleryRenderer = await GalleryFactory.createGalleryRenderer();

      // 개선된 미디어 추출 서비스 사용
      this.mediaExtractor = EnhancedMediaExtractionService.getInstance();

      this.galleryState = GalleryStateManager.getInstance();

      // 동영상 제어 유틸리티 초기화
      this.videoControlUtil = VideoControlUtil.getInstance();

      // 동영상 상태 관리자 초기화
      this.videoStateManager = VideoStateManager.getInstance();

      logger.debug('GalleryApp: 서비스 초기화 완료');
    } catch (error) {
      logger.error('GalleryApp: 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 클릭된 요소가 갤러리를 차단해야 하는 요소인지 확인
   * (동영상 썸네일은 이제 갤러리를 트리거함)
   */
  private shouldBlockGalleryTrigger(target: HTMLElement): boolean {
    // 1. 플레이 버튼 자체는 여전히 기본 동작 유지 (선택적)
    if (target.closest('[data-testid="playButton"]')) {
      logger.debug('GalleryApp: 플레이 버튼 클릭 감지 - 기본 동작 허용');
      return true;
    }

    // 2. 플레이 버튼 내부의 SVG 아이콘들은 기본 동작 유지
    const playButton = target.closest('[data-testid="playButton"]');
    if (
      playButton &&
      (target.tagName === 'svg' || target.tagName === 'circle' || target.tagName === 'path')
    ) {
      logger.debug('GalleryApp: 플레이 버튼 내 SVG 요소 클릭 감지 - 기본 동작 허용');
      return true;
    }

    // 3. 다시보기/일시정지 버튼들은 기본 동작 허용
    const videoControlButton = target.closest(
      'button[aria-label*="다시보기"], button[aria-label*="일시정지"], button[aria-label*="재생"], button[aria-label*="Replay"], button[aria-label*="Pause"], button[aria-label*="Play"]'
    );
    if (videoControlButton) {
      logger.debug('GalleryApp: 동영상 제어 버튼 클릭 감지 - 기본 동작 허용');
      return true;
    }

    // 4. 동영상 제어 버튼 내부의 요소들도 기본 동작 허용
    const hasVideoControlParent = target.closest('button')?.getAttribute('aria-label');
    if (
      hasVideoControlParent &&
      (hasVideoControlParent.includes('다시보기') ||
        hasVideoControlParent.includes('일시정지') ||
        hasVideoControlParent.includes('재생') ||
        hasVideoControlParent.includes('Replay') ||
        hasVideoControlParent.includes('Pause') ||
        hasVideoControlParent.includes('Play'))
    ) {
      logger.debug('GalleryApp: 동영상 제어 버튼 내부 요소 클릭 감지 - 기본 동작 허용');
      return true;
    }

    // 5. 다른 모든 요소(동영상 썸네일 포함)는 갤러리 트리거 허용
    return false;
  }

  /**
   * data-testid="tweetPhoto" 내부 요소 클릭만 감지
   */
  private setupTweetPhotoClickListener(): void {
    this.clickHandler = (event: MouseEvent) => {
      // 마우스 왼쪽 버튼 클릭만 처리
      if (event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement;

      // 클릭된 요소가 tweetPhoto 내부에 있는지 확인
      const tweetPhotoContainer = target.closest('[data-testid="tweetPhoto"]');

      if (tweetPhotoContainer) {
        logger.debug('GalleryApp: tweetPhoto 내부 클릭 감지', {
          tagName: target.tagName,
          className: target.className,
          containerFound: true,
        });

        // 갤러리 트리거를 차단해야 하는 요소인지 확인 (플레이 버튼만)
        if (this.shouldBlockGalleryTrigger(target)) {
          // 플레이 버튼은 갤러리를 실행하지 않고 기본 동작 허용
          logger.info('GalleryApp: 갤러리 차단 요소 클릭 - 기본 동작 허용');
          return;
        }

        // 트위터 기본 동작 차단하고 갤러리 실행
        event.preventDefault();
        event.stopPropagation();

        logger.info('GalleryApp: tweetPhoto 내부 요소 클릭 - 갤러리 실행', {
          tagName: target.tagName,
          isImage: target.tagName === 'IMG',
          isVideoThumbnail:
            target.tagName === 'IMG' &&
            MEDIA_URL_UTILS.isVideoThumbnailUrl((target as HTMLImageElement).src),
        });

        // 갤러리 실행
        this.handleTweetPhotoClick(event);
      }
    };

    // 캡처 단계에서 이벤트 감지 (최우선 처리)
    document.addEventListener('click', this.clickHandler, true);
    logger.debug('GalleryApp: tweetPhoto 클릭 리스너 등록 완료');
  }

  /**
   * tweetPhoto 클릭 처리
   */
  private async handleTweetPhotoClick(event: MouseEvent): Promise<void> {
    try {
      // 갤러리 앱 지연 로딩
      if (!this.isInitialized) {
        await this.loadGalleryComponents();
      }

      // 미디어 추출 및 갤러리 열기
      if (this.galleryState && this.mediaExtractor) {
        await this.extractAndOpenGallery(event);
      }
    } catch (error) {
      logger.error('GalleryApp: tweetPhoto 클릭 처리 실패:', error);
    }
  }

  /**
   * 갤러리 컴포넌트들을 지연 로딩
   */
  private async loadGalleryComponents(): Promise<void> {
    logger.info('GalleryApp: 갤러리 컴포넌트 지연 로딩 시작');

    // 이미 초기화되었으면 추가 설정만
    if (!this.galleryState || !this.galleryRenderer) {
      await this.initializeServices();
    }

    // 갤러리 전용 키보드 이벤트 설정 (갤러리가 열린 후에만 작동)
    this.setupGalleryKeyboardEvents();

    logger.info('GalleryApp: 갤러리 컴포넌트 로딩 완료');
  }

  /**
   * 동영상 상태 관리 설정
   * DOM 변화 감지 및 갤러리 트리거 유지 시스템
   */
  private setupVideoStateManagement(): void {
    if (!this.videoStateManager) {
      return;
    }

    // 커스텀 갤러리 트리거 이벤트 리스너
    this.galleryTriggerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { mediaItems, clickedIndex } = customEvent.detail;
      if (this.galleryState && mediaItems.length > 0) {
        logger.info('GalleryApp: 커스텀 트리거로 갤러리 열기', {
          mediaCount: mediaItems.length,
          clickedIndex,
        });
        this.galleryState.openGallery(mediaItems, clickedIndex);
      }
    };

    document.addEventListener('xeg-gallery-trigger', this.galleryTriggerHandler);

    // 동영상 재생 시작 감지 및 트리거 생성
    this.videoStateManager.startDOMObserver((tweetId: string, videoElement: HTMLVideoElement) => {
      logger.debug('GalleryApp: 동영상 재생 감지, 트리거 생성 준비', { tweetId });

      const tweetContainer = videoElement.closest('[data-testid="tweet"]') as HTMLElement;
      if (tweetContainer && this.videoStateManager) {
        // 약간의 지연 후 트리거 생성 (DOM 안정화 대기)
        setTimeout(() => {
          if (this.videoStateManager) {
            this.videoStateManager.createGalleryTrigger(
              tweetContainer,
              tweetId,
              (mediaItems, clickedIndex) => {
                if (this.galleryState) {
                  this.galleryState.openGallery(mediaItems, clickedIndex);
                }
              }
            );
          }
        }, 200);
      }
    });

    logger.debug('GalleryApp: 동영상 상태 관리 설정 완료');
  }

  /**
   * 트윗 컨테이너에서 트윗 ID 추출
   */
  private extractTweetIdFromContainer(tweetContainer: HTMLElement): string | null {
    const tweetLinks = tweetContainer.querySelectorAll('a[href*="/status/"]');
    for (const link of tweetLinks) {
      const href = (link as HTMLAnchorElement).href;
      const match = href.match(/\/status\/(\d+)/);
      if (match?.[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * 갤러리가 열린 상태에서만 작동하는 키보드 이벤트
   */
  private setupGalleryKeyboardEvents(): void {
    this.keyHandler = (event: KeyboardEvent) => {
      // 갤러리가 열려있지 않으면 무시
      if (!this.galleryState?.isOpen.value) {
        return;
      }

      switch (event.key) {
        case 'Escape':
          this.galleryState.closeGallery();
          event.preventDefault();
          break;
        case 'ArrowLeft':
          this.galleryState.goToPrevious();
          event.preventDefault();
          break;
        case 'ArrowRight':
          this.galleryState.goToNext();
          event.preventDefault();
          break;
        case 'Home':
          this.galleryState.goToFirst();
          event.preventDefault();
          break;
        case 'End':
          this.galleryState.goToLast();
          event.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', this.keyHandler);
    logger.debug('GalleryApp: 갤러리 키보드 이벤트 설정 완료');
  }

  /**
   * 미디어 추출 및 갤러리 열기
   */
  private async extractAndOpenGallery(event: MouseEvent): Promise<void> {
    const target = event.target as HTMLElement;

    try {
      logger.debug('GalleryApp: 개선된 미디어 추출 시작');

      if (!this.mediaExtractor) {
        logger.error('GalleryApp: MediaExtractor가 초기화되지 않음');
        return;
      }

      // 개선된 추출 옵션 사용
      const enhancedExtractor = this.mediaExtractor as EnhancedMediaExtractionService;
      const result = await enhancedExtractor.extractFromClickedElement(target, {
        includeVideoElements: true, // 비디오 요소도 포함
        preserveVideoState: true, // 동영상 재생 상태 보존
        enableMutationObserver: false, // 초기에는 false로 설정
        fallbackToVideoAPI: true, // API 폴백 활성화
      });

      if (result.success && result.mediaItems.length > 0) {
        // 실제 클릭된 이미지의 인덱스를 시작 인덱스로 사용
        const startIndex = result.clickedIndex ?? 0;

        // 트윗 ID 추출 및 미디어 캐시 (강화됨)
        const tweetContainer = target.closest('[data-testid="tweet"]') as HTMLElement;
        if (tweetContainer && this.videoStateManager) {
          const tweetId = this.extractTweetIdFromContainer(tweetContainer);
          if (tweetId) {
            // 미디어 캐시 저장
            this.videoStateManager.cacheMediaForTweet(tweetId, tweetContainer, [
              ...result.mediaItems,
            ]);

            // 동영상이 포함된 경우 DOM 변화 감지를 위한 트리거 준비
            const hasVideo = result.mediaItems.some(item => item.type === 'video');
            if (hasVideo) {
              logger.debug('GalleryApp: 동영상 포함 미디어 - DOM 변화 감지 준비', { tweetId });
            }
          }
        }

        logger.info(
          `GalleryApp: 갤러리 열기 - ${result.mediaItems.length}개 미디어, 시작 인덱스: ${startIndex}`,
          {
            strategy: result.metadata?.strategy,
            sourceType: result.metadata?.sourceType,
          }
        );

        if (this.galleryState) {
          this.galleryState.openGallery(result.mediaItems, startIndex);
        }
      } else {
        logger.warn('GalleryApp: 유효한 미디어를 찾을 수 없음:', {
          error: result.error,
          mediaCount: result.mediaItems.length,
          strategy: result.metadata?.strategy,
        });
      }
    } catch (error) {
      logger.error('GalleryApp: 미디어 추출 및 갤러리 열기 실패:', error);
    }
  }

  /**
   * 정리 및 리소스 해제
   */
  async cleanup(): Promise<void> {
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

    if (this.galleryTriggerHandler) {
      document.removeEventListener('xeg-gallery-trigger', this.galleryTriggerHandler);
      this.galleryTriggerHandler = null;
    }

    // 갤러리가 열려있으면 닫기
    if (this.galleryState?.isOpen.value) {
      this.galleryState.closeGallery();
    }

    // 동영상 제어 유틸리티 정리
    if (this.videoControlUtil) {
      this.videoControlUtil.cleanup();
      this.videoControlUtil = null;
    }

    // 동영상 상태 관리자 정리
    if (this.videoStateManager) {
      this.videoStateManager.cleanup();
      this.videoStateManager = null;
    }

    // 갤러리 렌더러 정리
    if (this.galleryRenderer) {
      this.galleryRenderer.destroy();
      this.galleryRenderer = null;
    }

    this.galleryState = null;
    this.mediaExtractor = null;
    this.isInitialized = false;

    logger.info('GalleryApp: 정리 완료');
  }
}
