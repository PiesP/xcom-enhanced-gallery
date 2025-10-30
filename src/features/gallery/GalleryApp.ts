/**
 * @fileoverview Gallery Application
 * @description 갤러리 애플리케이션 조율기 - 초기화, 이벤트 연결, 생명주기 관리
 * @module features/gallery
 *
 * 책임:
 * - 갤러리 초기화 및 생명주기 관리
 * - 미디어 서비스 및 렌더러 조율
 * - 이벤트 핸들러 등록/정리
 * - 사용자 알림 (Toast) 관리
 */

import type { GalleryRenderer } from '../../shared/interfaces/gallery.interfaces';
import {
  getGalleryRenderer,
  getMediaServiceFromContainer,
} from '../../shared/container/service-accessors';
import { isMediaServiceLike } from '../../shared/utils/type-safety-helpers';
import {
  gallerySignals,
  openGallery,
  closeGallery,
} from '../../shared/state/signals/gallery.signals';
import type { MediaInfo } from '../../shared/types/media.types';
import { logger } from '@shared/logging';
import { MediaService } from '../../shared/services/media-service';
import { ToastController } from '../../shared/services/unified-toast-manager';
import { initializeTheme } from './services/theme-initialization';

/**
 * 갤러리 앱 설정 인터페이스
 */
export interface GalleryConfig {
  autoTheme?: boolean;
  keyboardShortcuts?: boolean;
  performanceMonitoring?: boolean;
  extractionTimeout?: number;
  clickDebounceMs?: number;
}

/**
 * 갤러리 애플리케이션 조율기
 */
export class GalleryApp {
  private mediaService: MediaService | null = null;
  private galleryRenderer: GalleryRenderer | null = null;
  private readonly toastController: ToastController;
  private isInitialized = false;
  private readonly config: GalleryConfig = {
    autoTheme: true,
    keyboardShortcuts: true,
    performanceMonitoring: false,
    extractionTimeout: 15000,
    clickDebounceMs: 500,
  };

  constructor() {
    logger.info('[GalleryApp] 생성자 호출');
    this.toastController = new ToastController();
  }

  /**
   * 미디어 서비스 lazy 초기화
   */
  private async getMediaService(): Promise<MediaService> {
    if (!this.mediaService) {
      // Phase 137: Type Guard를 사용하여 타입 안전성 확보
      const service = getMediaServiceFromContainer();
      if (isMediaServiceLike(service)) {
        this.mediaService = service as MediaService;
      } else {
        throw new Error('MediaService not available from container');
      }
    }
    return this.mediaService;
  }

  /**
   * SettingsService 지연 초기화 (Phase 258 최적화)
   *
   * bootstrap/features.ts에서 제거되었으므로 갤러리 초기화 시점에 로드
   * 이를 통해 부트스트랩 시간을 30-50% 단축할 수 있습니다.
   */
  private async ensureSettingsServiceInitialized(): Promise<void> {
    try {
      const { tryGetSettingsManager, registerSettingsManager } = await import(
        '../../shared/container/service-accessors'
      );
      const existingSettings = tryGetSettingsManager();

      if (existingSettings) {
        logger.debug('[GalleryApp] SettingsService already initialized');
        return;
      }

      logger.debug('[GalleryApp] Initializing SettingsService (Phase 258)');

      // SettingsService 지연 로드
      const { SettingsService } = await import('../settings/services/settings-service');

      const settingsService = new SettingsService();
      await settingsService.initialize();
      registerSettingsManager(settingsService);

      logger.debug('[GalleryApp] ✅ SettingsService initialized');
    } catch (error) {
      logger.warn('[GalleryApp] SettingsService initialization failed (non-critical):', error);
      // SettingsService 초기화 실패는 갤러리 동작에 영향을 주지 않음
    }
  }

  /**
   * 갤러리 앱 초기화
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('[GalleryApp] 초기화 시작');

      // Phase 258: SettingsService 지연 로드 (부트스트랩 최적화)
      // bootstrap/features.ts에서 제거되었으므로 여기서 로드
      await this.ensureSettingsServiceInitialized();

      initializeTheme();
      await this.toastController.initialize();
      await this.initializeRenderer();
      await this.setupEventHandlers();

      this.isInitialized = true;
      logger.info('[GalleryApp] ✅ 초기화 완료');

      if (process.env.NODE_ENV === 'development') {
        this.exposeDebugAPI();
      }
    } catch (error) {
      logger.error('[GalleryApp] ❌ 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 렌더러 초기화
   */
  private async initializeRenderer(): Promise<void> {
    this.galleryRenderer = getGalleryRenderer();
    this.galleryRenderer?.setOnCloseCallback(() => {
      this.closeGallery();
    });
    logger.debug('[GalleryApp] 갤러리 렌더러 초기화 완료');
  }

  /**
   * 이벤트 핸들러 설정
   */
  private async setupEventHandlers(): Promise<void> {
    try {
      const { initializeGalleryEvents } = await import('../../shared/utils/events');

      await initializeGalleryEvents({
        onMediaClick: async (_mediaInfo, element) => {
          try {
            const mediaService = await this.getMediaService();
            const result = await mediaService.extractFromClickedElement(element);

            if (result.success && result.mediaItems.length > 0) {
              await this.openGallery(result.mediaItems, result.clickedIndex);
            } else {
              logger.warn('[GalleryApp] 미디어 추출 실패:', {
                success: result.success,
                mediaCount: result.mediaItems.length,
              });
              this.toastController.show({
                title: '미디어 로드 실패',
                message: '이미지나 비디오를 찾을 수 없습니다.',
                type: 'error',
              });
            }
          } catch (error) {
            logger.error('[GalleryApp] 미디어 추출 중 오류:', error);
            this.toastController.show({
              title: '오류 발생',
              message: error instanceof Error ? error.message : '알 수 없는 오류',
              type: 'error',
            });
          }
        },
        onGalleryClose: () => {
          this.closeGallery();
        },
        onKeyboardEvent: event => {
          if (event.key === 'Escape' && gallerySignals.isOpen.value) {
            this.closeGallery();
          }
        },
      });

      logger.info('[GalleryApp] ✅ 이벤트 핸들러 설정 완료');
    } catch (error) {
      logger.error('[GalleryApp] ❌ 이벤트 핸들러 설정 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 열기
   */
  public async openGallery(mediaItems: MediaInfo[], startIndex: number = 0): Promise<void> {
    if (!mediaItems?.length) {
      logger.warn('갤러리 열기 실패: 미디어 아이템이 없음');
      return;
    }

    try {
      const validIndex = Math.max(0, Math.min(startIndex, mediaItems.length - 1));
      logger.info('[GalleryApp] 갤러리 열기:', {
        mediaCount: mediaItems.length,
        startIndex: validIndex,
      });

      // 상태 업데이트 (렌더러는 signal 구독으로 자동 렌더링)
      openGallery(mediaItems, validIndex);
    } catch (error) {
      logger.error('[GalleryApp] 갤러리 열기 실패:', error);
      this.toastController?.show({
        title: '갤러리 로드 실패',
        message: `${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        type: 'error',
      });
      throw error;
    }
  }

  /**
   * 갤러리 닫기
   */
  public closeGallery(): void {
    try {
      if (gallerySignals.isOpen.value) {
        closeGallery();
      }
      this.mediaService?.restoreBackgroundVideos();
      logger.debug('[GalleryApp] 갤러리 닫음');
    } catch (error) {
      logger.error('[GalleryApp] 갤러리 닫기 실패:', error);
    }
  }

  /**
   * 진단 정보
   */
  public getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      galleryState: {
        isOpen: gallerySignals.isOpen.value,
        mediaCount: gallerySignals.mediaItems.value.length,
        currentIndex: gallerySignals.currentIndex.value,
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
    };
    logger.debug('[GalleryApp] 디버그 API 노출됨: xegGalleryDebug');
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('[GalleryApp] 정리 시작');

      if (gallerySignals.isOpen.value) {
        this.closeGallery();
      }

      try {
        const { cleanupGalleryEvents } = await import('../../shared/utils/events');
        cleanupGalleryEvents();
      } catch (error) {
        logger.warn('[GalleryApp] 이벤트 정리 실패:', error);
      }

      this.galleryRenderer = null;
      this.isInitialized = false;

      delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;
      logger.info('[GalleryApp] ✅ 정리 완료');
    } catch (error) {
      logger.error('[GalleryApp] ❌ 정리 중 오류:', error);
    }
  }
}
