/**
 * @fileoverview Gallery Service - Clean Architecture Implementation
 * @license MIT
 * @version 2.0.0 - Clean Architecture
 * @author X.com Enhanced Gallery Team
 *
 * @description
 * 갤러리 비즈니스 로직을 담당하는 Clean Architecture 서비스 레이어.
 * 도메인 로직과 상태 관리를 분리하여 테스트 가능하고 유지보수 가능한 갤러리 시스템을 제공합니다.
 */

import {
  closeGallery,
  getCurrentMediaItem,
  galleryState,
  // isGallerySignalsInitialized,
  // isGalleryValid,
  navigateToItem as navigateToIndex,
  openGallery,
} from '@shared/state/signals/gallery.signals';
import { getErrorMessage } from '@shared/utils/error-handling';
import type { MediaInfo } from '@shared/types/media.types';
import type { ViewMode } from '@shared/types/core/core-types';
import { isVendorsInitialized } from '@shared/external/vendors';
import { logger } from '@shared/logging';

/**
 * 갤러리 초기화 설정 (GalleryInitializer에서 통합)
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
 * 초기화 상태 (GalleryInitializer에서 통합)
 */
interface InitializationState {
  coordinateManagerReady: boolean;
  galleryServiceReady: boolean;
  invisibleWarmupCompleted: boolean;
  allServicesReady: boolean;
  initStartTime: number;
  initEndTime: number | null;
}

/**
 * 갤러리 열기 옵션
 */
export interface OpenGalleryOptions {
  /** 초기 미디어 인덱스 */
  initialIndex?: number;
  /** 뷰 모드 */
  viewMode?: ViewMode;
  /** 강제 재열기 여부 */
  forceReopen?: boolean;
  /** 소스 식별자 (디버깅용) */
  source?: string;
}

/**
 * 갤러리 네비게이션 결과
 */
export interface NavigationResult {
  /** 네비게이션 성공 여부 */
  success: boolean;
  /** 새로운 인덱스 */
  newIndex: number;
  /** 현재 미디어 아이템 */
  currentMedia: MediaInfo | null;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * 갤러리 상태 정보
 */
export interface GalleryInfo {
  /** 갤러리 열림 여부 */
  isOpen: boolean;
  /** 갤러리 유효성 */
  isValid: boolean;
  /** 미디어 총 개수 */
  mediaCount: number;
  /** 현재 인덱스 */
  currentIndex: number;
  /** 현재 미디어 */
  currentMedia: MediaInfo | null;
  /** 뷰 모드 */
  viewMode: ViewMode;
  /** 네비게이션 가능 여부 */
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 상태 */
  error: string | null;
}

/**
 * 통합 갤러리 서비스
 *
 * 핵심 기능:
 * - 갤러리 열기/닫기 최적화
 * - 미디어 네비게이션 관리
 * - 뷰 모드 전환
 * - 상태 검증 및 에러 처리
 * - 성능 최적화된 상태 업데이트
 */
export class GalleryService {
  private static instance: GalleryService | null = null;
  private isInitialized = false;

  // GalleryInitializer 기능 통합
  private readonly earlyInitConfig: GalleryInitConfig;
  private readonly initializationState: InitializationState;
  private earlyInitPromise: Promise<void> | null = null;

  /**
   * 생성자 - Lazy Initialization을 위해 초기화 체크하지 않음
   */
  private constructor(initConfig: Partial<GalleryInitConfig> = {}) {
    // Lazy initialization - 실제 메서드 호출 시 초기화 확인
    logger.debug('GalleryService: Instance created (lazy initialization)');

    // GalleryInitializer 설정 통합
    this.earlyInitConfig = {
      enabled: true,
      maxInitWaitTime: 5000,
      debugLogging: false,
      invisibleGalleryWarmup: true,
      ...initConfig,
    };

    this.initializationState = this.createInitialState();
  }

  /**
   * 시스템 초기화 상태 확인 및 Lazy Initialization
   */
  private ensureSystemInitialized(): void {
    if (this.isInitialized) {
      return; // 이미 초기화됨
    }

    try {
      // **핵심 개선**: 실시간 초기화 재시도 로직
      logger.debug('GalleryService: 시스템 초기화 상태 확인 중...');

      // Vendor 초기화 확인
      if (!isVendorsInitialized()) {
        logger.warn('GalleryService: Vendors가 아직 초기화되지 않았습니다. 잠시 후 재시도합니다.');
        // 즉시 재시도 (initialization race condition 해결)
        setTimeout(() => this.retryInitialization(), 100);
        return; // 초기화하지 않고 안전 모드 유지
      }

      // Gallery Signals는 항상 사용 가능합니다
      // 별도의 초기화 체크가 필요하지 않습니다

      this.isInitialized = true;
      logger.info('GalleryService: 초기화 완료 (복구 성공)');
    } catch (error) {
      logger.error('GalleryService: 초기화 실패', error);
      // 안전 모드로 동작
      logger.warn('GalleryService: 안전 모드로 동작');
    }
  }

  /**
   * **새로운 메서드**: 초기화 재시도 로직
   */
  private retryInitialization(): void {
    if (this.isInitialized) {
      return; // 이미 초기화됨
    }

    logger.debug('GalleryService: 초기화 재시도 중...');
    this.ensureSystemInitialized();
  }

  /**
   * 명시적 초기화 메서드 (AppBootstrapper에서 호출)
   */
  public initializeService(): void {
    this.ensureSystemInitialized();
  }

  /**
   * 갤러리 서비스 사전 초기화 실행 (GalleryInitializer에서 통합)
   */
  public async initializeEarly(): Promise<void> {
    if (!this.earlyInitConfig.enabled) {
      this.logDebug('Early initialization disabled');
      return;
    }

    if (this.earlyInitPromise) {
      return this.earlyInitPromise;
    }

    this.earlyInitPromise = this.performEarlyInitialization();
    return this.earlyInitPromise;
  }

  /**
   * 초기화 상태 확인 (GalleryInitializer에서 통합)
   */
  public isEarlyInitReady(): boolean {
    return this.initializationState.allServicesReady;
  }

  /**
   * 초기 상태 생성 (GalleryInitializer에서 통합)
   */
  private createInitialState(): InitializationState {
    return {
      coordinateManagerReady: false,
      galleryServiceReady: false,
      invisibleWarmupCompleted: false,
      allServicesReady: false,
      initStartTime: 0,
      initEndTime: null,
    };
  }

  /**
   * 실제 사전 초기화 수행 (GalleryInitializer에서 통합)
   */
  private async performEarlyInitialization(): Promise<void> {
    this.initializationState.initStartTime = performance.now();
    this.logDebug('Starting early gallery initialization');

    try {
      // 1. 갤러리 서비스 초기화
      await this.initializeGalleryServiceInternal();

      // 2. 보이지 않는 갤러리 Warmup 실행 (선택적)
      if (this.earlyInitConfig.invisibleGalleryWarmup) {
        await this.performInvisibleGalleryWarmup();
      }

      // 3. 전체 상태 확인
      this.validateAllServicesReady();

      this.initializationState.initEndTime = performance.now();

      this.logDebug('Early initialization completed successfully', {
        duration: this.initializationState.initEndTime - this.initializationState.initStartTime,
      });
    } catch (error) {
      this.logError('Early initialization failed', error);
      throw new Error(`Gallery early initialization failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * 갤러리 서비스 내부 초기화 (GalleryInitializer에서 통합)
   */
  private async initializeGalleryServiceInternal(): Promise<void> {
    try {
      this.ensureSystemInitialized();
      this.initializationState.galleryServiceReady = true;
      this.logDebug('Gallery service pre-initialized');
    } catch (error) {
      this.logError('Failed to initialize gallery service', error);
      // 갤러리 서비스 실패는 치명적이지 않으므로 계속 진행
      this.initializationState.galleryServiceReady = true;
    }
  }

  /**
   * 보이지 않는 갤러리 Warmup 실행 (GalleryInitializer에서 통합)
   */
  private async performInvisibleGalleryWarmup(): Promise<void> {
    try {
      this.logDebug('보이지 않는 갤러리 Warmup 시작...');

      // 간단한 더미 Warmup - 갤러리 서비스 준비만 확인
      logger.debug('Gallery service warmup 완료');

      this.initializationState.invisibleWarmupCompleted = true;
      this.logDebug('보이지 않는 갤러리 Warmup 완료');
    } catch (error) {
      this.logError('Invisible gallery warmup failed', error);
      // Warmup 실패는 치명적이지 않음
      this.initializationState.invisibleWarmupCompleted = true;
    }
  }

  /**
   * 모든 서비스 준비 상태 검증 (GalleryInitializer에서 통합)
   */
  private validateAllServicesReady(): void {
    this.initializationState.allServicesReady =
      this.initializationState.galleryServiceReady &&
      this.initializationState.invisibleWarmupCompleted;

    if (!this.initializationState.allServicesReady) {
      this.logDebug('Not all services are ready, but continuing anyway');
      // 모든 서비스가 준비되지 않아도 계속 진행 (비치명적)
      this.initializationState.allServicesReady = true;
    }
  }

  /**
   * 디버그 로깅 (GalleryInitializer에서 통합)
   */
  private logDebug(message: string, data?: Record<string, unknown>): void {
    if (this.earlyInitConfig.debugLogging) {
      logger.debug(`[GalleryService] ${message}`, data);
    }
  }

  /**
   * 에러 로깅 (GalleryInitializer에서 통합)
   */
  private logError(message: string, error: Error | unknown): void {
    logger.error(`[GalleryService] ${message}`, { error });
  }

  /**
   * 안전한 갤러리 상태 접근
   */
  private safeGetState(): GalleryInfo {
    try {
      if (!this.isInitialized) {
        // 초기화되지 않은 경우 안전한 기본값 반환
        return this.getDefaultGalleryInfo();
      }

      const state = galleryState;
      return this.mapStateToInfo(state);
    } catch (error) {
      logger.warn('GalleryService: 안전한 기본 상태 반환', error);
      return this.getDefaultGalleryInfo();
    }
  }

  /**
   * 기본 갤러리 정보 반환
   */
  private getDefaultGalleryInfo(): GalleryInfo {
    return {
      isOpen: false,
      isValid: false,
      mediaCount: 0,
      currentIndex: 0,
      currentMedia: null,
      viewMode: 'verticalList' as ViewMode,
      canNavigateNext: false,
      canNavigatePrevious: false,
      isLoading: false,
      error: 'System not initialized',
    };
  }

  /**
   * 상태를 GalleryInfo로 매핑
   */
  private mapStateToInfo(state: typeof galleryState): GalleryInfo {
    const stateValue = state.value;
    return {
      isOpen: stateValue.isOpen,
      isValid: stateValue.isOpen && stateValue.mediaItems.length > 0,
      mediaCount: stateValue.mediaItems.length,
      currentIndex: stateValue.currentIndex,
      currentMedia: getCurrentMediaItem(),
      viewMode: 'verticalList', // 프로젝트에서 지원하는 뷰 모드
      canNavigateNext: stateValue.currentIndex < stateValue.mediaItems.length - 1,
      canNavigatePrevious: stateValue.currentIndex > 0,
      isLoading: stateValue.isLoading,
      error: stateValue.error,
    };
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): GalleryService {
    GalleryService.instance ??= new GalleryService();
    return GalleryService.instance;
  }

  /**
   * 갤러리 열기 (최적화된 버전)
   */
  async openGallery(
    mediaItems: readonly MediaInfo[],
    options: OpenGalleryOptions = {}
  ): Promise<boolean> {
    // Lazy initialization 확인
    this.ensureSystemInitialized();

    const {
      initialIndex = 0,
      viewMode = 'verticalList',
      forceReopen = false,
      source = 'unknown',
    } = options;

    try {
      logger.debug('GalleryService: Opening gallery', {
        mediaCount: mediaItems.length,
        initialIndex,
        viewMode,
        forceReopen,
        source,
      });

      // 시스템 초기화 상태 확인
      if (!this.isInitialized) {
        logger.error('GalleryService: 시스템이 초기화되지 않았습니다.');
        return false;
      }

      // 입력 검증
      if (mediaItems.length === 0) {
        logger.warn('GalleryService: Cannot open gallery with empty media items');
        return false;
      }

      // 미디어 아이템 유효성 검증
      const validMediaItems = this.validateMediaItems(mediaItems);
      if (validMediaItems.length === 0) {
        logger.warn('GalleryService: No valid media items found');
        return false;
      }

      // 갤러리 열기 (최적화된)
      openGallery(validMediaItems, initialIndex);

      logger.debug('GalleryService: Gallery opened successfully', {
        mediaCount: validMediaItems.length,
        initialIndex,
        source,
      });

      return true;
    } catch (error) {
      logger.error('GalleryService: Failed to open gallery:', error);
      return false;
    }
  }

  /**
   * 갤러리 닫기
   */
  async closeGallery(isUserAction: boolean = true): Promise<boolean> {
    // Lazy initialization 확인
    this.ensureSystemInitialized();
    try {
      logger.debug('GalleryService: Closing gallery', { isUserAction });

      const wasOpen = galleryState.value.isOpen;
      closeGallery();

      if (wasOpen) {
        logger.debug('GalleryService: Gallery closed successfully');
      }

      return wasOpen;
    } catch (error) {
      logger.error('GalleryService: Failed to close gallery:', error);
      return false;
    }
  }

  /**
   * 다음 미디어로 이동
   */
  async navigateNext(): Promise<NavigationResult> {
    // Lazy initialization 확인
    this.ensureSystemInitialized();
    try {
      const state = galleryState;
      const stateValue = state.value;

      if (!(stateValue.isOpen && stateValue.mediaItems.length > 0)) {
        return {
          success: false,
          newIndex: stateValue.currentIndex,
          currentMedia: null,
          error: 'Gallery is not in a valid state',
        };
      }

      if (!(stateValue.currentIndex < stateValue.mediaItems.length - 1)) {
        return {
          success: false,
          newIndex: stateValue.currentIndex,
          currentMedia: getCurrentMediaItem(),
          error: 'No next media available',
        };
      }

      const newIndex = stateValue.currentIndex + 1;
      navigateToIndex(newIndex);

      const newCurrentMedia = getCurrentMediaItem();

      logger.debug('GalleryService: Navigated to next media', {
        oldIndex: stateValue.currentIndex,
        newIndex,
        mediaUrl: newCurrentMedia?.url,
      });

      return {
        success: true,
        newIndex,
        currentMedia: newCurrentMedia,
      };
    } catch (error) {
      logger.error('GalleryService: Failed to navigate to next media:', error);
      return {
        success: false,
        newIndex: galleryState.value.currentIndex,
        currentMedia: getCurrentMediaItem(),
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * 이전 미디어로 이동
   */
  async navigatePrevious(): Promise<NavigationResult> {
    // Lazy initialization 확인
    this.ensureSystemInitialized();
    try {
      const state = galleryState;
      const stateValue = state.value;

      if (!(stateValue.isOpen && stateValue.mediaItems.length > 0)) {
        return {
          success: false,
          newIndex: stateValue.currentIndex,
          currentMedia: null,
          error: 'Gallery is not in a valid state',
        };
      }

      if (!(stateValue.currentIndex > 0)) {
        return {
          success: false,
          newIndex: stateValue.currentIndex,
          currentMedia: getCurrentMediaItem(),
          error: 'No previous media available',
        };
      }

      const newIndex = stateValue.currentIndex - 1;
      navigateToIndex(newIndex);

      const newCurrentMedia = getCurrentMediaItem();

      logger.debug('GalleryService: Navigated to previous media', {
        oldIndex: stateValue.currentIndex,
        newIndex,
        mediaUrl: newCurrentMedia?.url,
      });

      return {
        success: true,
        newIndex,
        currentMedia: newCurrentMedia,
      };
    } catch (error) {
      logger.error('GalleryService: Failed to navigate to previous media:', error);
      return {
        success: false,
        newIndex: galleryState.value.currentIndex,
        currentMedia: getCurrentMediaItem(),
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * 특정 인덱스로 이동
   */
  async navigateToIndex(index: number): Promise<NavigationResult> {
    // Lazy initialization 확인
    this.ensureSystemInitialized();
    try {
      const state = galleryState;
      const stateValue = state.value;

      if (!(stateValue.isOpen && stateValue.mediaItems.length > 0)) {
        return {
          success: false,
          newIndex: stateValue.currentIndex,
          currentMedia: null,
          error: 'Gallery is not in a valid state',
        };
      }

      if (index < 0 || index >= stateValue.mediaItems.length) {
        return {
          success: false,
          newIndex: stateValue.currentIndex,
          currentMedia: getCurrentMediaItem(),
          error: `Invalid index: ${index}`,
        };
      }

      navigateToIndex(index);
      const newCurrentMedia = getCurrentMediaItem();

      logger.debug('GalleryService: Navigated to index', {
        oldIndex: stateValue.currentIndex,
        newIndex: index,
        mediaUrl: newCurrentMedia?.url,
      });

      return {
        success: true,
        newIndex: index,
        currentMedia: newCurrentMedia,
      };
    } catch (error) {
      logger.error('GalleryService: Failed to navigate to index:', error);
      return {
        success: false,
        newIndex: galleryState.value.currentIndex,
        currentMedia: getCurrentMediaItem(),
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * 뷰 모드 변경
   */
  async changeViewMode(newViewMode: ViewMode): Promise<boolean> {
    // Lazy initialization 확인
    this.ensureSystemInitialized();
    try {
      // 현재 프로젝트에서는 verticalList만 지원
      if (newViewMode === 'verticalList') {
        logger.debug('GalleryService: View mode already set to verticalList');
        return true;
      }

      // 현재 프로젝트에서는 verticalList만 지원하므로 변경하지 않음
      logger.debug(
        'GalleryService: View mode change requested but only verticalList is supported',
        {
          currentViewMode: 'verticalList',
          requestedViewMode: newViewMode,
        }
      );

      return true;
    } catch (error) {
      logger.error('GalleryService: Failed to change view mode:', error);
      return false;
    }
  }

  /**
   * 갤러리 정보 조회
   */
  getGalleryInfo(): GalleryInfo {
    // Lazy initialization 확인
    this.ensureSystemInitialized();
    return this.safeGetState();
  }

  /**
   * 현재 미디어 아이템 조회
   */
  getCurrentMediaItem(): MediaInfo | null {
    this.ensureSystemInitialized();
    return getCurrentMediaItem();
  }

  /**
   * 미디어 아이템 유효성 검증
   */
  private validateMediaItems(mediaItems: readonly MediaInfo[]): MediaInfo[] {
    return mediaItems.filter(item => {
      if (!item.url || !item.type) {
        logger.warn('GalleryService: Invalid media item', item);
        return false;
      }
      return true;
    });
  }

  /**
   * 서비스 초기화 - 시스템 초기화 상태 확인 포함
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('GalleryService: Initializing service');
      // 시스템 초기화 상태 재확인
      this.ensureSystemInitialized();
    } catch (error) {
      logger.error('GalleryService: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 서비스 정리
   */
  async dispose(): Promise<void> {
    try {
      logger.debug('GalleryService: Disposing service');
      // 정리 로직 추가
      GalleryService.instance = null;
    } catch (error) {
      logger.error('GalleryService: Failed to dispose:', error);
    }
  }

  /**
   * 레거시 호환성을 위한 cleanup 별칭
   */
  async cleanup(): Promise<void> {
    return this.dispose();
  }

  /**
   * 갤러리 상태 조회 (레거시 호환성)
   */
  getGalleryStatus(): GalleryInfo {
    return this.getGalleryInfo();
  }

  /**
   * 추출 결과와 함께 갤러리 열기 (레거시 호환성)
   */
  async openWithExtractionResult(
    extractionResult: { success: boolean; mediaItems: MediaInfo[]; errors?: string[] },
    startIndex: number = 0
  ): Promise<boolean> {
    if (!extractionResult.success || extractionResult.mediaItems.length === 0) {
      logger.warn('GalleryService: Cannot open gallery with failed extraction result');
      return false;
    }

    return this.openGallery(extractionResult.mediaItems, {
      initialIndex: startIndex,
      source: 'extraction-result',
    });
  }
}

/**
 * 전역 갤러리 서비스 인스턴스
 */
export const galleryService = GalleryService.getInstance();
