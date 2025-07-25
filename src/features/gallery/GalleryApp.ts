/**
 * 갤러리 애플리케이션
 *
 * 책임:
 * - 핵심 갤러리 로직 관리
 * - 이벤트 처리 (별도 클래스로 분리)
 * - 미디어 추출 (별도 클래스로 분리)
 * - 상태 관리는 기존 signals 활용
 */

import { SERVICE_KEYS } from '../../constants';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import { getService } from '@shared/services/ServiceManager';
import { VideoControlService } from '@shared/services/media/VideoControlService';
import { galleryState, openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';
import { MediaService } from '@shared/services/MediaService';
import { UIService } from '@shared/services/UIService';
import { unmountIsolatedGallery } from '@shared/components/isolation/IsolatedGalleryRoot';

/**
 * 갤러리 앱 설정
 */
export interface GalleryConfig {
  autoTheme?: boolean;
  keyboardShortcuts?: boolean;
  performanceMonitoring?: boolean;
  extractionTimeout?: number;
  clickDebounceMs?: number;
}

/**
 * 갤러리 애플리케이션 - 격리된 시스템
 */
export class GalleryApp {
  private mediaService: MediaService | null = null;
  private galleryRenderer: GalleryRenderer | null = null;
  private readonly videoControl = VideoControlService.getInstance();
  private uiService: UIService | null = null;

  // 새로운 격리 시스템 컴포넌트들
  private galleryContainer: HTMLElement | null = null;

  private isInitialized = false;
  private config: GalleryConfig = {
    autoTheme: true,
    keyboardShortcuts: true,
    performanceMonitoring: false,
    extractionTimeout: 15000,
    clickDebounceMs: 500,
  };

  constructor(config?: Partial<GalleryConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 미디어 서비스 lazy 초기화
   */
  private async getMediaService(): Promise<MediaService> {
    if (!this.mediaService) {
      this.mediaService = (await getService(SERVICE_KEYS.MEDIA_SERVICE)) as MediaService;
    }
    return this.mediaService;
  }

  /**
   * 갤러리 앱 초기화 - 격리된 시스템
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('GalleryApp: 격리된 시스템으로 초기화 시작');

      // UI 서비스 초기화
      this.uiService = (await getService(SERVICE_KEYS.UI_SERVICE)) as UIService;

      // 갤러리 렌더러 초기화
      await this.initializeRenderer();

      // 이벤트 핸들러 설정
      await this.setupEventHandlers();

      this.isInitialized = true;
      logger.info('✅ GalleryApp 격리된 시스템으로 초기화 완료');

      // 개발 모드 디버깅
      if (process.env.NODE_ENV === 'development') {
        this.exposeDebugAPI();
      }
    } catch (error) {
      logger.error('❌ GalleryApp 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 렌더러 초기화
   */
  private async initializeRenderer(): Promise<void> {
    this.galleryRenderer = (await getService(SERVICE_KEYS.GALLERY_RENDERER)) as GalleryRenderer;

    // 갤러리 닫기 콜백 설정
    this.galleryRenderer?.setOnCloseCallback(() => {
      this.handleGalleryClose();
    });

    logger.debug('갤러리 렌더러 초기화 완료');
  }

  /**
   * 이벤트 핸들러 설정
   */
  private async setupEventHandlers(): Promise<void> {
    try {
      // GalleryEventCoordinator를 사용하여 이벤트 리스너 설정
      const { GalleryEventCoordinator } = await import(
        '@shared/utils/events/GalleryEventCoordinator'
      );
      const eventCoordinator = GalleryEventCoordinator.getInstance();

      await eventCoordinator.initialize({
        onMediaClick: async (_mediaInfo, element, _event) => {
          try {
            const mediaService = await this.getMediaService();
            const result = await mediaService.extractFromClickedElement(element);
            if (result.success && result.mediaItems.length > 0) {
              await this.openGallery(result.mediaItems, result.clickedIndex);
            }
          } catch (error) {
            logger.error('미디어 추출 실패:', error);
          }
        },
        onGalleryClose: () => {
          this.closeGallery();
        },
        onKeyboardEvent: event => {
          if (event.key === 'Escape' && galleryState.value.isOpen) {
            this.closeGallery();
          }
        },
      });

      logger.info('✅ 이벤트 핸들러 설정 완료');
    } catch (error) {
      logger.error('❌ 이벤트 핸들러 설정 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 닫기 핸들러
   */
  private handleGalleryClose(): void {
    try {
      // 배경 비디오 상태 복원
      this.videoControl.restoreBackgroundVideos();

      logger.debug('갤러리 닫기 처리 완료');
    } catch (error) {
      logger.error('갤러리 닫기 처리 실패:', error);
    }
  }

  /**
   * 갤러리 열기
   */
  public async openGallery(mediaItems: MediaInfo[], startIndex: number = 0): Promise<void> {
    if (!mediaItems || mediaItems.length === 0) {
      logger.warn('갤러리 열기 실패: 미디어 아이템이 없음');
      return;
    }

    try {
      // 인덱스 범위 검증
      const validIndex = Math.max(0, Math.min(startIndex, mediaItems.length - 1));

      logger.info('갤러리 열기:', {
        mediaCount: mediaItems.length,
        startIndex: validIndex,
      });

      // 갤러리 컨테이너 확인
      await this.ensureGalleryContainer();

      // 갤러리 상태 업데이트
      openGallery(mediaItems, validIndex);

      logger.info(`✅ 갤러리 열기 성공: ${mediaItems.length}개 미디어`);
    } catch (error) {
      logger.error('❌ 갤러리 열기 실패:', error);
      this.uiService?.showError({
        title: 'Extraction Failed',
        message: `Failed to extract media: ${error instanceof Error ? error.message : String(error)}`,
      });
      throw error;
    }
  }

  /**
   * 갤러리 닫기
   */
  public closeGallery(): void {
    try {
      if (galleryState.value.isOpen) {
        closeGallery();
      }

      this.handleGalleryClose();
      logger.info('갤러리 닫기 완료');
    } catch (error) {
      logger.error('갤러리 닫기 실패:', error);
    }
  }

  /**
   * 갤러리 컨테이너 확인 및 생성
   */
  private async ensureGalleryContainer(): Promise<void> {
    let container = document.querySelector('#xeg-gallery-root') as HTMLDivElement | null;

    if (!container) {
      container = document.createElement('div');
      container.id = 'xeg-gallery-root';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999999;
        pointer-events: none;
      `;
      document.body.appendChild(container);
      logger.debug('갤러리 컨테이너 생성됨');
    }
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<GalleryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug('갤러리 앱 설정 업데이트됨');
  }

  /**
   * 상태 확인
   */
  public isRunning(): boolean {
    return this.isInitialized;
  }

  /**
   * 진단 정보
   */
  public getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      galleryState: {
        isOpen: galleryState.value.isOpen,
        mediaCount: galleryState.value.mediaItems.length,
        currentIndex: galleryState.value.currentIndex,
      },
    };
  }

  /**
   * 개발 모드 디버그 API 노출
   */
  private exposeDebugAPI(): void {
    (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug = {
      openGallery: this.openGallery.bind(this),
      closeGallery: this.closeGallery.bind(this),
      getDiagnostics: this.getDiagnostics.bind(this),
      getState: () => galleryState.value,
    };

    logger.debug('갤러리 디버그 API 노출됨: xegGalleryDebug');
  }

  /**
   * 정리 - 격리된 시스템 포함
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('GalleryApp 정리 시작 - 격리된 시스템');

      // 갤러리가 열려있다면 닫기
      if (galleryState.value.isOpen) {
        this.closeGallery();
      }

      // 이벤트 핸들러 정리
      try {
        const { GalleryEventCoordinator } = await import(
          '@shared/utils/events/GalleryEventCoordinator'
        );
        const eventCoordinator = GalleryEventCoordinator.getInstance();
        await eventCoordinator.cleanup();
      } catch (error) {
        logger.warn('이벤트 코디네이터 정리 실패:', error);
      }

      // 격리된 갤러리 컨테이너 제거
      if (this.galleryContainer) {
        unmountIsolatedGallery();
        this.galleryContainer = null;
      }

      // 상태 초기화
      this.galleryRenderer = null;
      this.isInitialized = false;

      // 디버그 API 정리
      delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;

      logger.info('✅ GalleryApp 정리 완료 - 격리된 시스템');
    } catch (error) {
      logger.error('❌ GalleryApp 정리 중 오류:', error);
    }
  }
}
