/**
 * @fileoverview Gallery Manager - 통합 갤러리 관리 서비스
 * @description Phase 2: 갤러리 + UI 관련 기능을 통합한 핵심 서비스
 * @version 2.0.0 - Layer Simplification
 */

import { logger } from '@shared/logging/logger';
import type { BaseService, ViewMode } from '@shared/types/core/core-types';
import type { MediaInfo } from '@shared/types/core/media.types';

// 갤러리 상태 관리
import {
  closeGallery,
  getCurrentMediaItem,
  galleryState,
  navigateToItem as navigateToIndex,
  openGallery,
} from '../state/signals/gallery.signals';

// UI 서비스
import { UIService } from '../services/UIService';
import { isVendorsInitialized } from '@shared/external/vendors';

/**
 * 갤러리 초기화 설정
 */
export interface GalleryInitConfig {
  /** 초기화 활성화 여부 */
  enabled: boolean;
  /** 최대 초기화 대기 시간 (ms) */
  maxInitWaitTime: number;
  /** 디버그 로깅 활성화 */
  debugLogging: boolean;
  /** 보이지 않는 갤러리 warmup 실행 여부 */
  invisibleGalleryWarmup: boolean;
}

/**
 * 갤러리 열기 옵션
 */
export interface OpenGalleryOptions {
  /** 시작할 미디어 인덱스 */
  startIndex?: number;
  /** 뷰 모드 */
  viewMode?: ViewMode;
  /** 자동 재생 여부 */
  autoplay?: boolean;
}

/**
 * 네비게이션 결과
 */
export interface NavigationResult {
  /** 성공 여부 */
  success: boolean;
  /** 현재 인덱스 */
  currentIndex: number;
  /** 현재 미디어 아이템 */
  currentItem: MediaInfo | null;
  /** 오류 메시지 */
  error?: string;
}

/**
 * 갤러리 정보
 */
export interface GalleryInfo {
  /** 열려있는지 여부 */
  isOpen: boolean;
  /** 현재 인덱스 */
  currentIndex: number;
  /** 총 아이템 수 */
  totalItems: number;
  /** 현재 미디어 아이템 */
  currentItem: MediaInfo | null;
  /** 뷰 모드 */
  viewMode: ViewMode;
}

/**
 * 통합 갤러리 관리 서비스
 *
 * 갤러리와 UI 관련 기능을 하나로 통합:
 * - GalleryService (갤러리 로직)
 * - UIService (테마, 토스트)
 * - 갤러리 상태 관리
 * - 사용자 상호작용
 */
export class GalleryManager implements BaseService {
  private static instance: GalleryManager | null = null;
  private _isInitialized = false;

  // 통합된 서비스 컴포넌트들
  private readonly uiService: UIService;

  private constructor() {
    this.uiService = UIService.getInstance();
  }

  public static getInstance(): GalleryManager {
    GalleryManager.instance ??= new GalleryManager();
    return GalleryManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    logger.info('GalleryManager initializing...');

    // UI 서비스 초기화
    await this.uiService.initialize();

    this._isInitialized = true;
    logger.info('GalleryManager initialized');
  }

  public destroy(): void {
    if (!this._isInitialized) return;

    logger.info('GalleryManager destroying...');
    this.closeGallery();
    this.uiService.destroy();
    this._isInitialized = false;
    logger.info('GalleryManager destroyed');
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  // ====================================
  // Gallery Management API
  // ====================================

  /**
   * 갤러리 열기
   */
  public async openGallery(
    mediaItems: readonly MediaInfo[],
    options: OpenGalleryOptions = {}
  ): Promise<boolean> {
    try {
      // Vendors 초기화 확인
      if (!isVendorsInitialized()) {
        logger.warn('Vendors not initialized, cannot open gallery');
        return false;
      }

      const startIndex = options.startIndex ?? 0;
      // viewMode는 현재 사용하지 않음 (갤러리 시그널에서 별도 처리)

      logger.info(
        `Opening gallery with ${mediaItems.length} items, starting at index ${startIndex}`
      );

      // 갤러리 상태 열기 (viewMode는 별도 설정)
      openGallery([...mediaItems], startIndex);

      // 성공 토스트 표시
      this.uiService.showSuccess({
        title: '갤러리 열림',
        message: `${mediaItems.length}개 아이템`,
      });

      return true;
    } catch (error) {
      logger.error('Failed to open gallery:', error);
      this.uiService.showError({
        title: '갤러리 오류',
        message: '갤러리를 열 수 없습니다',
      });
      return false;
    }
  }

  /**
   * 갤러리 닫기
   */
  public closeGallery(): void {
    try {
      logger.info('Closing gallery');
      closeGallery();

      this.uiService.showInfo({
        title: '갤러리 닫힘',
        message: '갤러리가 닫혔습니다',
      });
    } catch (error) {
      logger.error('Failed to close gallery:', error);
    }
  }

  /**
   * 특정 인덱스로 이동
   */
  public navigateToItem(index: number): NavigationResult {
    try {
      const currentState = galleryState.value;

      if (!currentState.isOpen) {
        return {
          success: false,
          currentIndex: -1,
          currentItem: null,
          error: 'Gallery is not open',
        };
      }

      if (index < 0 || index >= currentState.mediaItems.length) {
        return {
          success: false,
          currentIndex: currentState.currentIndex,
          currentItem: getCurrentMediaItem(),
          error: 'Invalid index',
        };
      }

      navigateToIndex(index);

      return {
        success: true,
        currentIndex: index,
        currentItem: getCurrentMediaItem(),
      };
    } catch (error) {
      logger.error('Failed to navigate to item:', error);
      return {
        success: false,
        currentIndex: galleryState.value.currentIndex,
        currentItem: getCurrentMediaItem(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 다음 아이템으로 이동
   */
  public navigateNext(): NavigationResult {
    const currentIndex = galleryState.value.currentIndex;
    return this.navigateToItem(currentIndex + 1);
  }

  /**
   * 이전 아이템으로 이동
   */
  public navigatePrevious(): NavigationResult {
    const currentIndex = galleryState.value.currentIndex;
    return this.navigateToItem(currentIndex - 1);
  }

  /**
   * 갤러리 정보 조회
   */
  public getGalleryInfo(): GalleryInfo {
    const state = galleryState.value;
    return {
      isOpen: state.isOpen,
      currentIndex: state.currentIndex,
      totalItems: state.mediaItems.length,
      currentItem: getCurrentMediaItem(),
      viewMode: state.viewMode as ViewMode,
    };
  }

  // ====================================
  // UI Integration API
  // ====================================

  /**
   * 테마 토글 (ThemeService에 toggle 메서드가 없으므로 우회)
   */
  public toggleTheme(): void {
    // UIService를 통해 간접적으로 접근
    const isDark = this.uiService.isDarkMode();
    // 실제 테마 토글은 구현이 필요함
    logger.info(`Current theme is ${isDark ? 'dark' : 'light'}`);
  }

  /**
   * 현재 테마 조회
   */
  public getCurrentTheme() {
    return this.uiService.getCurrentTheme();
  }

  /**
   * 토스트 메시지 표시
   */
  public showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const options = { title: '', message };

    switch (type) {
      case 'success':
        this.uiService.showSuccess(options);
        break;
      case 'warning':
        this.uiService.showWarning(options);
        break;
      case 'error':
        this.uiService.showError(options);
        break;
      default:
        this.uiService.showInfo(options);
        break;
    }
  }

  /**
   * 갤러리 상태 변경 감지
   */
  public subscribeToGalleryState(callback: (state: typeof galleryState.value) => void): () => void {
    // Preact signals의 구독 메커니즘 활용
    const unsubscribe = galleryState.subscribe(callback);
    return unsubscribe;
  }
}

/**
 * 전역 GalleryManager 인스턴스
 */
export const galleryManager = GalleryManager.getInstance();
