/**
 * 통합된 갤러리 애플리케이션
 *
 * 기존 GalleryApp.ts의 과도한 책임을 분리하여 재구성:
 * - 핵심 갤러리 로직만 담당
 * - 이벤트 처리는 별도 클래스로 분리
 * - 미디어 추출은 별도 클래스로 분리
 * - 상태 관리는 기존 GalleryStateManager 활용
 */

import { removeUndefinedProperties } from '@shared/utils/core/type-safety-helpers';

import { SERVICE_KEYS } from '@core/constants';
import type { GalleryRenderer } from '@core/interfaces/gallery.interfaces';
import { getService } from '@core/services/ServiceRegistry';
import {
  galleryState,
  openGallery,
  closeGallery,
} from '../core/state/signals/unified-gallery.signals';
import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import type { ManagedExtractionResult } from './coordinators/CoordinatorManager';
import { CoordinatorManager } from './coordinators/CoordinatorManager';

/**
 * 갤러리 앱 설정
 */
export interface UnifiedGalleryConfig {
  autoTheme?: boolean;
  keyboardShortcuts?: boolean;
  performanceMonitoring?: boolean;
  extractionTimeout?: number;
  clickDebounceMs?: number;
}

/**
 * 통합된 갤러리 애플리케이션
 *
 * 리팩토링된 구조:
 * - CoordinatorManager를 통한 통합 관리
 * - 간결한 갤러리 생명주기 관리
 * - 성능 모니터링 및 메트릭 수집
 */

export class UnifiedGalleryApp {
  private readonly coordinatorManager: CoordinatorManager;
  private galleryRenderer: GalleryRenderer | null = null;

  private isInitialized = false;
  private config: UnifiedGalleryConfig = {
    autoTheme: true,
    keyboardShortcuts: true,
    performanceMonitoring: false,
    extractionTimeout: 15000,
    clickDebounceMs: 500,
  };

  constructor(config?: Partial<UnifiedGalleryConfig>) {
    this.config = { ...this.config, ...config };

    // 코디네이터 매니저 초기화
    this.coordinatorManager = new CoordinatorManager(
      removeUndefinedProperties({
        clickDebounceMs: this.config.clickDebounceMs,
        extractionTimeout: this.config.extractionTimeout,
        enableKeyboard: this.config.keyboardShortcuts,
        enablePerformanceMonitoring: this.config.performanceMonitoring,
      })
    );
  }

  /**
   * 갤러리 앱 초기화
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('UnifiedGalleryApp: 초기화 시작');

      // 갤러리 렌더러 초기화
      await this.initializeRenderer();

      // 코디네이터 매니저 초기화
      await this.coordinatorManager.initialize({
        onMediaExtracted: this.handleMediaExtracted.bind(this),
        onGalleryClose: this.handleGalleryClose.bind(this),
      });

      this.isInitialized = true;
      logger.info('✅ UnifiedGalleryApp 초기화 완료');

      // 개발 모드 디버깅
      if (process.env.NODE_ENV === 'development') {
        this.exposeDebugAPI();
      }
    } catch (error) {
      logger.error('❌ UnifiedGalleryApp 초기화 실패:', error);
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
   * 미디어 추출 완료 핸들러
   */
  private async handleMediaExtracted(result: ManagedExtractionResult): Promise<void> {
    try {
      logger.info('미디어 추출 완료:', {
        mediaCount: result.mediaItems.length,
        source: result.source,
        duration: `${result.duration.toFixed(2)}ms`,
      });

      if (result.success && result.mediaItems.length > 0) {
        // 갤러리 열기
        await this.openGallery(result.mediaItems, result.clickedIndex);
      } else {
        logger.warn('추출된 미디어가 없음');
        this.showNotification('미디어를 찾을 수 없습니다.', 'warning');
      }
    } catch (error) {
      logger.error('미디어 추출 결과 처리 실패:', error);
      this.showNotification('미디어 로딩 중 오류가 발생했습니다.', 'error');
    }
  }

  /**
   * 갤러리 닫기 핸들러
   */
  private handleGalleryClose(): void {
    try {
      // 추출 상태 정리
      this.coordinatorManager.clearExtractionState();

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
      this.showNotification('갤러리를 열 수 없습니다.', 'error');
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
   * 사용자 알림 표시
   */
  private showNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const colors = {
      info: '#1da1f2',
      warning: '#ff8c00',
      error: '#ff4444',
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: opacity 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // 5초 후 자동 제거
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<UnifiedGalleryConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 코디네이터 매니저에 설정 전달
    this.coordinatorManager.updateConfig(
      removeUndefinedProperties({
        clickDebounceMs: this.config.clickDebounceMs,
        extractionTimeout: this.config.extractionTimeout,
        enableKeyboard: this.config.keyboardShortcuts,
        enablePerformanceMonitoring: this.config.performanceMonitoring,
      })
    );

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
      coordinatorManager: this.coordinatorManager.getDiagnostics(),
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
      getMetrics: () => this.coordinatorManager.getDiagnostics().metrics,
      clearExtractionState: () => this.coordinatorManager.clearExtractionState(),
    };

    logger.debug('갤러리 디버그 API 노출됨: xegGalleryDebug');
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('UnifiedGalleryApp 정리 시작');

      // 갤러리가 열려있다면 닫기
      if (galleryState.value.isOpen) {
        this.closeGallery();
      }

      // 코디네이터 매니저 정리
      await this.coordinatorManager.cleanup();

      // 상태 초기화
      this.galleryRenderer = null;
      this.isInitialized = false;

      // 디버그 API 정리
      delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;

      logger.info('✅ UnifiedGalleryApp 정리 완료');
    } catch (error) {
      logger.error('❌ UnifiedGalleryApp 정리 중 오류:', error);
    }
  }
}
