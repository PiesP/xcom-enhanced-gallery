/**
 * 갤러리 애플리케이션
 *
 * 책임:
 * - 핵심 갤러리 로직 관리
 * - 이벤트 처리 (별도 클래스로 분리)
 * - 미디어 추출 (별도 클래스로 분리)
 * - 상태 관리는 기존 signals 활용
 */

import type { GalleryRenderer } from '../../shared/interfaces/gallery.interfaces';
import {
  getGalleryRenderer,
  getMediaServiceFromContainer,
} from '../../shared/container/service-accessors';
import {
  galleryState,
  openGallery,
  closeGallery,
} from '../../shared/state/signals/gallery.signals';
import type { MediaInfo } from '../../shared/types/media.types';
import { logger } from '../../shared/logging/logger';
import { MediaService } from '../../shared/services/MediaService';
// Use container accessor for ToastController to ensure single instance
import {
  getToastController,
  tryGetToastController,
} from '../../shared/container/service-accessors';
import { unmountGallery } from '../../shared/components/isolation';

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
  // VideoControl은 MediaService 내부에서 관리되므로 직접 인스턴스화하지 않습니다.
  // ToastController는 컨테이너 등록 이전일 수 있으므로 lazy/optional로 접근한다.
  private _toastController: ReturnType<typeof getToastController> | null = null;
  private get toastController() {
    // 이미 획득했으면 재사용
    if (this._toastController) return this._toastController;
    // 등록 전 생성자 접근 시에는 try-get으로 조용히 null 반환
    const tc = tryGetToastController();
    if (tc) this._toastController = tc;
    return this._toastController;
  }

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

  constructor() {
    logger.info('[GalleryApp] 생성자 호출');
  }

  /**
   * 미디어 서비스 lazy 초기화
   */
  private async getMediaService(): Promise<MediaService> {
    if (!this.mediaService) {
      this.mediaService = getMediaServiceFromContainer() as unknown as MediaService;
    }
    return this.mediaService;
  }

  /**
   * 갤러리 앱 초기화 - 격리된 시스템
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('GalleryApp: 격리된 시스템으로 초기화 시작');

      // 토스트 컨트롤러 확보 및 초기화(이 시점에는 core 등록이 완료되어 있어야 함)
      if (!this._toastController) {
        try {
          this._toastController = getToastController();
        } catch {
          // 테스트 또는 조기 초기화 경로에서 미등록일 수 있음 — 기능은 계속 진행
          this._toastController = tryGetToastController();
        }
      }
      // Initialize toast controller if supported
      await this._toastController?.initialize?.();

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
    this.galleryRenderer = getGalleryRenderer();

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
      // 새로운 갤러리 이벤트 시스템 사용
      const { initializeGalleryEvents } = await import('../../shared/utils/events');

      await initializeGalleryEvents({
        onMediaClick: async (_mediaInfo, element, _event) => {
          try {
            const mediaService = await this.getMediaService();
            const result = await mediaService.extractFromClickedElement(element);

            if (result.success && result.mediaItems.length > 0) {
              await this.openGallery(result.mediaItems, result.clickedIndex);
            } else {
              // 미디어 추출 실패 시 사용자에게 알림
              logger.warn('미디어 추출 실패:', {
                success: result.success,
                mediaCount: result.mediaItems.length,
                errors: result.errors,
              });

              // 직접 토스트 컨트롤러를 통해 알림 표시
              if (this.toastController) {
                this.toastController.show({
                  title: '미디어 로드 실패',
                  message: '이미지나 비디오를 찾을 수 없습니다.',
                  type: 'error',
                });
              }
            }
          } catch (error) {
            logger.error('미디어 추출 중 오류:', error);

            // 직접 토스트 컨트롤러를 통해 에러 알림 표시
            if (this.toastController) {
              this.toastController.show({
                title: '오류 발생',
                message: `미디어 추출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
                type: 'error',
              });
            }
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
      // 배경 비디오 상태 복원은 MediaService에 위임
      this.mediaService?.restoreBackgroundVideos();

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
      this.toastController?.show({
        title: 'Extraction Failed',
        message: `Failed to extract media: ${error instanceof Error ? error.message : String(error)}`,
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
    let container = (document.querySelector('.xeg-gallery-container') ||
      document.querySelector('[data-xeg-gallery-container]')) as HTMLDivElement | null;

    if (!container) {
      container = document.createElement('div');
      // 일부 테스트 환경(mocked document)에서는 classList가 없을 수 있으므로 폴백 처리
      if (
        (container as HTMLElement).classList &&
        typeof (container as HTMLElement).classList.add === 'function'
      ) {
        container.classList.add('xeg-gallery-container');
      } else {
        container.setAttribute('class', 'xeg-gallery-container');
      }
      container.setAttribute('data-xeg-gallery-container', '');
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
  z-index: var(--xeg-layer-root);
        pointer-events: none;
      `;
      document.body.appendChild(container);
      this.galleryContainer = container;
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
        const { cleanupGalleryEvents } = await import('../../shared/utils/events');
        cleanupGalleryEvents();
      } catch (error) {
        logger.warn('이벤트 코디네이터 정리 실패:', error);
      }

      // 통합된 갤러리 컨테이너 제거
      if (this.galleryContainer) {
        unmountGallery(this.galleryContainer);
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
