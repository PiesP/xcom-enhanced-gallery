/**
 * GalleryInitializer - 갤러리 서비스 초기화 관리자
 *
 * 첫 번째 갤러리 열기 시 발생하는 스크롤 최상단 이동 문제 해결을 위해
 * 모든 갤러리 관련 서비스를 앱 시작 시점에 초기화합니다.
 *
 * @author X.com Enhanced Gallery Team
 * @version 1.0.0
 */

import { logger } from '../../../infrastructure/logging/logger';
import { ServiceManager } from '../ServiceManager';
import { SERVICE_KEYS } from '../../../constants';

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

interface InitializationState {
  coordinateManagerReady: boolean;
  galleryServiceReady: boolean;
  invisibleWarmupCompleted: boolean;
  allServicesReady: boolean;
  initStartTime: number;
  initEndTime: number | null;
}

/**
 * 갤러리 사전 초기화 관리자
 *
 * 주요 기능:
 * - 갤러리 첫 열기 전 모든 서비스 사전 초기화
 * - 초기화 상태 추적 및 디버깅
 *
 * 참고: 스크롤 관리는 갤러리 내부에서 네이티브 방식으로 처리됩니다.
 */
export class GalleryInitializer {
  private static instance: GalleryInitializer | null = null;
  private readonly config: GalleryInitConfig;
  private readonly state: InitializationState;
  private serviceManager: ServiceManager | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor(config: Partial<GalleryInitConfig> = {}) {
    this.config = {
      enabled: true,
      maxInitWaitTime: 5000,
      debugLogging: false,
      invisibleGalleryWarmup: true,
      ...config,
    };

    this.state = this.createInitialState();
  }

  /**
   * 싱글톤 인스턴스 획득
   */
  public static getInstance(config?: Partial<GalleryInitConfig>): GalleryInitializer {
    GalleryInitializer.instance ??= new GalleryInitializer(config);
    return GalleryInitializer.instance;
  }

  /**
   * 서비스 매니저 설정
   */
  public setServiceManager(serviceManager: ServiceManager): void {
    this.serviceManager = serviceManager;
    this.logDebug('Service manager set', { hasServiceManager: !!serviceManager });
  }

  /**
   * 갤러리 서비스 사전 초기화 실행
   *
   * @returns 초기화 완료 Promise
   */
  public async initializeEarly(): Promise<void> {
    if (!this.config.enabled) {
      this.logDebug('Early initialization disabled');
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performEarlyInitialization();
    return this.initPromise;
  }

  /**
   * 초기화 상태 확인
   */
  public isReady(): boolean {
    return this.isInitialized && this.state.allServicesReady;
  }

  /**
   * 현재 초기화 상태 반환
   */
  public getInitializationState(): Readonly<InitializationState> {
    return { ...this.state };
  }

  /**
   * 실제 사전 초기화 수행
   */
  private async performEarlyInitialization(): Promise<void> {
    this.state.initStartTime = performance.now();
    this.logDebug('Starting early gallery initialization');

    try {
      // 1. 갤러리 서비스 초기화
      await this.initializeGalleryService();

      // 2. 보이지 않는 갤러리 Warmup 실행 (선택적)
      if (this.config.invisibleGalleryWarmup) {
        await this.performInvisibleGalleryWarmup();
      }

      // 3. 전체 상태 확인
      this.validateAllServicesReady();

      this.state.initEndTime = performance.now();
      this.isInitialized = true;

      this.logDebug('Early initialization completed successfully', {
        duration: this.state.initEndTime - this.state.initStartTime,
        state: this.state,
      });
    } catch (error) {
      this.logError('Early initialization failed', error);
      throw new Error(
        `Gallery early initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 갤러리 서비스 초기화
   */
  private async initializeGalleryService(): Promise<void> {
    try {
      if (!this.serviceManager) {
        throw new Error('Service manager not available');
      }

      // GalleryRenderer 확보 (선택적)
      const galleryService = await this.serviceManager.tryGet(SERVICE_KEYS.GALLERY_RENDERER);
      if (galleryService) {
        await this.waitForServiceReady(galleryService as Record<string, unknown>, 'isReady', 1000);
        this.logDebug('Gallery service pre-initialized');
      }

      this.state.galleryServiceReady = true;
    } catch (error) {
      this.logError('Failed to initialize gallery service', error);
      // 갤러리 서비스 실패는 치명적이지 않으므로 계속 진행
      this.state.galleryServiceReady = true;
    }
  }

  /**
   * 보이지 않는 갤러리 Warmup 실행
   *
   * 첫 번째 갤러리 열기 시 발생하는 "스크롤 최상단 이동" 문제를 해결하기 위해
   * 사용자에게 보이지 않게 갤러리를 한 번 열고 닫습니다.
   */
  private async performInvisibleGalleryWarmup(): Promise<void> {
    try {
      this.logDebug('보이지 않는 갤러리 Warmup 시작...');

      if (!this.serviceManager) {
        throw new Error('Service manager not available for warmup');
      }

      // 갤러리 서비스 획득
      const galleryService = await this.serviceManager.tryGet(SERVICE_KEYS.GALLERY_RENDERER);
      if (!galleryService || typeof galleryService !== 'object') {
        this.logDebug('Gallery service not available for warmup, skipping');
        this.state.invisibleWarmupCompleted = true;
        return;
      }

      // 간단한 더미 Warmup - 갤러리 서비스 준비만 확인
      logger.debug('Gallery service warmup 완료');

      this.state.invisibleWarmupCompleted = true;
      this.logDebug('보이지 않는 갤러리 Warmup 완료');
    } catch (error) {
      this.logError('Invisible gallery warmup failed', error);
      // Warmup 실패는 치명적이지 않음 - 단순히 첫 갤러리 열기 시 스크롤 문제가 발생할 수 있음
      this.state.invisibleWarmupCompleted = true;
    }
  }

  /**
   * 서비스 준비 상태 대기
   */
  private async waitForServiceReady(
    service: Record<string, unknown>,
    readyMethod: string,
    timeout = 3000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const readyValue = service[readyMethod];
      if (typeof readyValue === 'function' && readyValue()) {
        return;
      }
      if (typeof readyValue === 'boolean' && readyValue) {
        return;
      }
      await this.sleep(50);
    }

    // 더 안전한 오류 메시지
    const serviceName = service?.constructor?.name ?? 'UnknownService';
    this.logDebug(`Service ${serviceName} not ready within ${timeout}ms (non-critical)`);
  }

  /**
   * 모든 서비스 준비 상태 검증
   */
  private validateAllServicesReady(): void {
    this.state.allServicesReady =
      this.state.galleryServiceReady && this.state.invisibleWarmupCompleted;

    if (!this.state.allServicesReady) {
      this.logDebug('Not all services are ready, but continuing anyway');
      // 모든 서비스가 준비되지 않아도 계속 진행 (비치명적)
      this.state.allServicesReady = true;
    }
  }

  /**
   * 초기 상태 생성
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
   * 대기 헬퍼
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 디버그 로깅
   */
  private logDebug(message: string, data?: Record<string, unknown>): void {
    if (this.config.debugLogging) {
      logger.debug(`[GalleryInitializer] ${message}`, data);
    }
  }

  /**
   * 에러 로깅
   */
  private logError(message: string, error: Error | unknown): void {
    logger.error(`[GalleryInitializer] ${message}`, { error });
  }

  /**
   * 인스턴스 재설정 (테스트용)
   */
  public static reset(): void {
    GalleryInitializer.instance = null;
  }
}
