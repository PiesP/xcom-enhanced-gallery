/**
 * GalleryEarlyInitializer - 갤러리 서비스 사전 초기화 관리자
 *
 * 첫 번째 갤러리 열기 시 발생하는 스크롤 최상단 이동 문제 해결을 위해
 * 모든 갤러리 관련 서비스를 앱 시작 시점에 사전 초기화합니다.
 *
 * @author Enhanced Gallery Team
 * @version 1.0.0
 */

import { logger } from '../../../infrastructure/logging/logger';
import { ScrollCoordinateManager } from '../scroll/ScrollCoordinateManager';
import type { ScrollLockService } from '../../../infrastructure/dom/ScrollLockService';
import { ServiceManager } from '../ServiceManager';
import { SERVICE_KEYS } from '../../constants/SERVICE_CONSTANTS';

export interface GalleryEarlyInitConfig {
  /** 사전 초기화 활성화 여부 */
  enabled: boolean;
  /** 스크롤 잠금 서비스 사전 준비 여부 (실제 잠금은 갤러리 열기 시 적용) */
  preemptiveScrollLock: boolean;
  /** 최대 초기화 대기 시간 (ms) */
  maxInitWaitTime: number;
  /** 디버그 로깅 활성화 */
  debugLogging: boolean;
  /** 보이지 않는 갤러리 warmup 실행 여부 */
  invisibleGalleryWarmup: boolean;
}

interface InitializationState {
  scrollLockReady: boolean;
  scrollManagerReady: boolean;
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
 * - 스크롤 잠금 서비스 즉시 준비 (실제 잠금은 갤러리 열기 시 적용)
 * - 초기화 상태 추적 및 디버깅
 *
 * 참고: 스크롤 잠금은 갤러리가 실제로 열릴 때만 적용됩니다.
 */
export class GalleryEarlyInitializer {
  private static instance: GalleryEarlyInitializer | null = null;
  private readonly config: GalleryEarlyInitConfig;
  private readonly state: InitializationState;
  private serviceManager: ServiceManager | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor(config: Partial<GalleryEarlyInitConfig> = {}) {
    this.config = {
      enabled: true,
      preemptiveScrollLock: true,
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
  public static getInstance(config?: Partial<GalleryEarlyInitConfig>): GalleryEarlyInitializer {
    GalleryEarlyInitializer.instance ??= new GalleryEarlyInitializer(config);
    return GalleryEarlyInitializer.instance;
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
      // 1. 스크롤 좌표 관리자 초기화
      await this.initializeCoordinateManager();

      // 2. 스크롤 잠금 서비스 초기화 및 사전 보호 설정
      await this.initializeScrollLockService();

      // 3. 갤러리 서비스 초기화
      await this.initializeGalleryService();

      // 4. 보이지 않는 갤러리 Warmup 실행 (선택적)
      if (this.config.invisibleGalleryWarmup) {
        await this.performInvisibleGalleryWarmup();
      }

      // 5. 전체 상태 확인
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
   * 스크롤 좌표 관리자 초기화
   */
  private async initializeCoordinateManager(): Promise<void> {
    try {
      if (!this.serviceManager) {
        throw new Error('Service manager not available');
      }

      const coordinateManager =
        await this.serviceManager.tryGet<ScrollCoordinateManager>('scroll.coordinate');
      if (!coordinateManager) {
        // 스크롤 좌표 관리자가 없으면 기본 스크롤 위치 캡처
        this.logDebug('ScrollCoordinateManager not available, using fallback');
        this.state.coordinateManagerReady = true;
        return;
      }

      // 현재 스크롤 위치 캡처
      coordinateManager.captureCurrentPosition();

      this.state.coordinateManagerReady = true;
      this.logDebug('Coordinate manager initialized');
    } catch (error) {
      this.logError('Failed to initialize coordinate manager', error);
      // 좌표 관리자 실패는 치명적이지 않으므로 계속 진행
      this.state.coordinateManagerReady = true;
    }
  }

  /**
   * 스크롤 잠금 서비스 초기화
   */
  private async initializeScrollLockService(): Promise<void> {
    try {
      if (!this.serviceManager) {
        throw new Error('Service manager not available');
      }

      const scrollLockService = (await this.serviceManager.tryGet(
        SERVICE_KEYS.PAGE_SCROLL_LOCK
      )) as ScrollLockService;
      if (!scrollLockService) {
        throw new Error('Page scroll lock service not available');
      }

      // ScrollLockService는 즉시 사용 가능하므로 준비 상태 확인
      await this.waitForServiceReady(scrollLockService, 'isReady');

      // 스크롤 잠금 서비스만 준비하고 실제 잠금은 갤러리 열기 시점에 적용
      this.logDebug('Scroll lock service ready (lock will be applied when gallery opens)');

      this.state.scrollLockReady = true;
      this.logDebug('Scroll lock service initialized');
    } catch (error) {
      this.logError('Failed to initialize scroll lock service', error);
      throw error;
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

      // UnifiedGalleryService 확보 (선택적)
      const galleryService = await this.serviceManager.tryGet(SERVICE_KEYS.GALLERY);
      if (galleryService) {
        await this.waitForServiceReady(galleryService, 'isReady');
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
      const galleryService = await this.serviceManager.tryGet(SERVICE_KEYS.GALLERY);
      if (!galleryService || typeof galleryService !== 'object') {
        this.logDebug('Gallery service not available for warmup, skipping');
        this.state.invisibleWarmupCompleted = true;
        return;
      }

      // UnifiedGalleryService의 warmup 메서드 호출 (타입 안전성을 위해 duck typing 사용)
      if ('performWarmup' in galleryService && typeof galleryService.performWarmup === 'function') {
        await (galleryService.performWarmup as () => Promise<void>)();
        this.logDebug('갤러리 서비스 warmup 완료');
      } else {
        this.logDebug('Gallery service does not support warmup, using fallback');
        // Fallback: 기본 더미 미디어로 빠른 열기/닫기
        await this.performFallbackWarmup(galleryService as Record<string, unknown>);
      }

      this.state.invisibleWarmupCompleted = true;
      this.logDebug('보이지 않는 갤러리 Warmup 완료');
    } catch (error) {
      this.logError('Invisible gallery warmup failed', error);
      // Warmup 실패는 치명적이지 않음 - 단순히 첫 갤러리 열기 시 스크롤 문제가 발생할 수 있음
      this.state.invisibleWarmupCompleted = true;
    }
  }

  /**
   * Fallback warmup 실행 (갤러리 서비스가 warmup을 직접 지원하지 않는 경우)
   */
  private async performFallbackWarmup(galleryService: Record<string, unknown>): Promise<void> {
    try {
      // 더미 미디어 아이템 생성
      const dummyMediaItem = {
        id: 'warmup-dummy',
        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        type: 'image' as const,
        filename: 'warmup.gif',
        size: 43,
      };

      // openGallery 메서드가 있는지 확인하고 호출
      if ('openGallery' in galleryService && typeof galleryService.openGallery === 'function') {
        const openMethod = galleryService.openGallery as (
          mediaItems: unknown[],
          options?: { initialIndex?: number; source?: string; isWarmup?: boolean }
        ) => Promise<{ success: boolean }>;

        // Warmup 모드로 갤러리 열기
        const result = await openMethod([dummyMediaItem], {
          initialIndex: 0,
          source: 'warmup',
          isWarmup: true, // Warmup 모드임을 표시
        });

        if (result.success) {
          // 즉시 닫기
          if (
            'closeGallery' in galleryService &&
            typeof galleryService.closeGallery === 'function'
          ) {
            const closeMethod = galleryService.closeGallery as (options?: {
              isWarmup?: boolean;
            }) => Promise<void>;
            await closeMethod({ isWarmup: true });
          }
        }

        this.logDebug('Fallback warmup completed successfully');
      } else {
        this.logDebug('Gallery service does not support openGallery method');
      }
    } catch (error) {
      this.logDebug('Fallback warmup failed, but continuing', error);
    }
  }

  /**
   * 서비스 준비 상태 대기
   */

  private async waitForServiceReady(
    service: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    readyMethod: string,
    timeout = 3000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (typeof service[readyMethod] === 'function' && service[readyMethod]()) {
        return;
      }
      if (typeof service[readyMethod] === 'boolean' && service[readyMethod]) {
        return;
      }
      await this.sleep(50);
    }

    // 더 안전한 오류 메시지
    const serviceName = service?.constructor?.name ?? 'UnknownService';
    throw new Error(`Service ${serviceName} not ready within ${timeout}ms`);
  }

  /**
   * 모든 서비스 준비 상태 검증
   */
  private validateAllServicesReady(): void {
    this.state.allServicesReady =
      this.state.coordinateManagerReady &&
      this.state.scrollLockReady &&
      this.state.galleryServiceReady &&
      this.state.invisibleWarmupCompleted;

    if (!this.state.allServicesReady) {
      throw new Error('Not all services are ready after initialization');
    }
  }

  /**
   * 초기 상태 생성
   */
  private createInitialState(): InitializationState {
    return {
      scrollLockReady: false,
      scrollManagerReady: false,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logDebug(message: string, data?: any): void {
    if (this.config.debugLogging) {
      logger.debug(`[GalleryEarlyInitializer] ${message}`, data);
    }
  }

  /**
   * 에러 로깅
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logError(message: string, error: any): void {
    logger.error(`[GalleryEarlyInitializer] ${message}`, { error });
  }

  /**
   * 인스턴스 재설정 (테스트용)
   */
  public static reset(): void {
    GalleryEarlyInitializer.instance = null;
  }
}
