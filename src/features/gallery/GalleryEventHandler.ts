/**
 * GalleryEventHandler 클래스
 *
 * 목표: GalleryApp의 이벤트 처리 로직을 독립적인 클래스로 분리
 * - 미디어 클릭 이벤트 처리
 * - 갤러리 닫기 이벤트 처리
 * - 키보드 이벤트 처리
 * - 의존성 주입을 통한 격리된 설계
 */

import { logger } from '../../shared/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';

export interface GalleryEventHandlerDependencies {
  toastController: {
    show: (toast: { title: string; message: string; type: string }) => void;
  };
  videoControl: {
    restoreBackgroundVideos: () => void;
  };
  galleryState: {
    value: {
      isOpen: boolean;
      mediaItems: MediaInfo[];
      currentIndex: number;
    };
  };
  eventManager?: {
    initializeGallery: (handlers: unknown) => Promise<void>;
    cleanupGallery: () => void;
  };
  mediaService?: {
    extractFromClickedElement: (element: HTMLElement) => Promise<{
      success: boolean;
      mediaItems: MediaInfo[];
      clickedIndex: number;
      errors: string[];
    }>;
  };
}

export interface GalleryActions {
  openGallery: (mediaItems: MediaInfo[], startIndex: number) => Promise<void>;
  closeGallery: () => void;
}

export class GalleryEventHandler {
  private readonly dependencies: GalleryEventHandlerDependencies;

  constructor(dependencies: GalleryEventHandlerDependencies) {
    this.dependencies = dependencies;
    logger.debug('GalleryEventHandler 인스턴스 생성됨');
  }

  /**
   * 이벤트 핸들러 설정
   */
  public async setupEventHandlers(galleryActions: GalleryActions): Promise<void> {
    try {
      if (this.dependencies.eventManager && this.dependencies.mediaService) {
        await this.dependencies.eventManager.initializeGallery({
          onMediaClick: this.createMediaClickHandler(
            this.dependencies.mediaService,
            galleryActions
          ),
          onGalleryClose: this.createGalleryCloseHandler(galleryActions),
          onKeyboardEvent: this.createKeyboardHandler(galleryActions),
        });
      }

      logger.info('✅ 이벤트 핸들러 설정 완료');
    } catch (error) {
      logger.error('❌ 이벤트 핸들러 설정 실패:', error);
      throw error;
    }
  }

  /**
   * 미디어 클릭 핸들러 생성
   */
  public createMediaClickHandler(
    mediaService: {
      extractFromClickedElement: (element: HTMLElement) => Promise<{
        success: boolean;
        mediaItems: MediaInfo[];
        clickedIndex: number;
        errors: string[];
      }>;
    },
    galleryActions: GalleryActions
  ): (mediaInfo: MediaInfo, element: HTMLElement, event: MouseEvent) => Promise<void> {
    return async (_mediaInfo: MediaInfo, element: HTMLElement, _event: MouseEvent) => {
      try {
        const result = await mediaService.extractFromClickedElement(element);

        if (result.success && result.mediaItems.length > 0) {
          await galleryActions.openGallery(result.mediaItems, result.clickedIndex);
        } else {
          // 미디어 추출 실패 시 사용자에게 알림
          logger.warn('미디어 추출 실패:', {
            success: result.success,
            mediaCount: result.mediaItems.length,
            errors: result.errors,
          });

          this.dependencies.toastController.show({
            title: '미디어 로드 실패',
            message: '이미지나 비디오를 찾을 수 없습니다.',
            type: 'error',
          });
        }
      } catch (error) {
        logger.error('미디어 추출 중 오류:', error);

        this.dependencies.toastController.show({
          title: '오류 발생',
          message: `미디어 추출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
          type: 'error',
        });
      }
    };
  }

  /**
   * 갤러리 닫기 핸들러 생성
   */
  public createGalleryCloseHandler(galleryActions: GalleryActions): () => void {
    return () => {
      try {
        galleryActions.closeGallery();
        this.dependencies.videoControl.restoreBackgroundVideos();
        logger.debug('갤러리 닫기 처리 완료');
      } catch (error) {
        logger.error('갤러리 닫기 처리 실패:', error);
      }
    };
  }

  /**
   * 키보드 이벤트 핸들러 생성
   */
  public createKeyboardHandler(galleryActions: GalleryActions): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.dependencies.galleryState.value.isOpen) {
        galleryActions.closeGallery();
      }
    };
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.dependencies.eventManager) {
        this.dependencies.eventManager.cleanupGallery();
      }

      logger.debug('GalleryEventHandler 정리 완료');
    } catch (error) {
      logger.error('GalleryEventHandler 정리 실패:', error);
    }
  }
}
