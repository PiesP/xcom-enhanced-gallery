/**
 * Application Class
 *
 * Clean Architecture App Layer - Application lifecycle management
 *
 * Responsibilities:
 * - Application initialization and lifecycle management
 * - Service registration and dependency management
 * - Memory and resource management
 * - Error handling and cleanup
 */

import { removeUndefinedProperties } from '@core/utils/type-safety-helpers';

import { ServiceManager } from '../core/services/ServiceManager';
import { SERVICE_KEYS } from '../constants';
import { logger } from '@core/logging/logger';
import type { AppConfig } from '@core/types/app.types';
import { GalleryApp } from './GalleryApp';

/**
 * Application lifecycle state
 */
export type AppLifecycleState = 'idle' | 'initializing' | 'ready' | 'error' | 'destroyed';

/**
 * Lifecycle configuration options
 */
export interface LifecycleConfig {
  autoStart: boolean;
  retryCount: number;
  timeout: number;
}

/**
 * Main application manager
 *
 * Responsibilities:
 * - Application initialization and lifecycle management
 * - Service registration and dependency management
 * - Memory and resource management
 * - Error handling and cleanup
 */
export class Application {
  private static instance: Application | null = null;
  private readonly serviceManager: ServiceManager;
  private galleryApp: GalleryApp | null = null;
  private isStarted = false;
  private config: AppConfig;

  // Lifecycle management
  private state: AppLifecycleState = 'idle';
  private initStartTime = 0;
  private retryCount = 0;
  private readonly services = new Set<string>();
  private readonly lifecycleConfig: LifecycleConfig = {
    autoStart: true,
    retryCount: 3,
    timeout: 10000,
  };

  // 메모리 관리
  private memoryMonitoringInterval: number | null = null;

  // 정리 관련
  private readonly cleanupHandlers: (() => Promise<void> | void)[] = [];

  private constructor(config: AppConfig) {
    this.config = config;
    this.serviceManager = ServiceManager.getInstance();
    this.setupCleanupHandlers();
  }

  public static create(config: AppConfig): Application {
    Application.instance ??= new Application(config);
    return Application.instance;
  }

  /**
   * 현재 인스턴스 가져오기 (존재하는 경우만)
   */
  public static getInstance(): Application | null {
    return Application.instance;
  }

  /**
   * 애플리케이션 시작
   *
   * 최적화된 4단계 초기화:
   * 1. 기본 인프라 초기화
   * 2. Critical Path: 필수 시스템만 먼저 초기화
   * 3. 갤러리 앱 시작
   * 4. Non-Critical: 백그라운드에서 지연 초기화
   */
  public async start(): Promise<void> {
    if (this.isStarted || this.state === 'ready') {
      logger.debug('Application: Already started');
      return;
    }

    if (this.state === 'initializing') {
      logger.warn('Application: Already initializing');
      return;
    }

    try {
      this.state = 'initializing';
      this.initStartTime = performance.now();

      logger.info(`🚀 X.com Enhanced Gallery v${this.config.version} 시작`);

      // 1단계: 기본 인프라 초기화
      await this.initializeInfrastructure();

      // 2단계: Critical Path - 필수 시스템만 먼저 초기화
      await this.initializeCriticalSystems();

      // 3단계: 갤러리 앱 시작
      await this.startGalleryApp();

      // 4단계: Non-Critical - 백그라운드에서 지연 초기화
      this.initializeNonCriticalSystems();

      // 부가 기능 초기화
      this.initializeMemoryManagement();
      this.setupGlobalEventHandlers();

      this.isStarted = true;
      this.state = 'ready';
      const duration = performance.now() - this.initStartTime;

      logger.info(`✅ 애플리케이션 시작 완료 (${duration.toFixed(2)}ms)`, {
        services: Array.from(this.services),
      });

      // 개발 모드 설정
      if (this.config.isDevelopment) {
        this.setupDevelopmentTools();
      }
    } catch (error) {
      this.state = 'error';
      logger.error('❌ 애플리케이션 시작 실패:', error);

      if (this.retryCount < this.lifecycleConfig.retryCount) {
        this.retryCount++;
        logger.info(`🔄 애플리케이션 재시도 ${this.retryCount}/${this.lifecycleConfig.retryCount}`);

        // 지연 후 재시도
        setTimeout(() => {
          this.start().catch(retryError => {
            logger.error('재시도 실패:', retryError);
          });
        }, 2000);
      } else {
        await this.cleanup();
        throw error;
      }
    }
  }

  /**
   * 1단계: 기본 인프라 초기화
   */
  private async initializeInfrastructure(): Promise<void> {
    try {
      // Vendor 라이브러리 초기화
      const { initializeVendors } = await import('@core/external/vendors');
      await initializeVendors();
      logger.debug('✅ Vendor 라이브러리 초기화 완료');

      // TODO: Phase 2에서 디자인 시스템 통합 예정
      // 현재는 CSS 파일 직접 로드로 처리
      logger.debug('✅ 인프라 초기화 완료');
    } catch (error) {
      logger.error('❌ 인프라 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 2단계: Critical Path - 필수 시스템만 먼저 초기화
   */
  private async initializeCriticalSystems(): Promise<void> {
    try {
      logger.info('Critical Path 초기화 시작');

      // 모든 서비스 등록 (지연 로딩)
      const { registerAllServices } = await import('@core/services');
      await registerAllServices();
      this.services.add('ServiceManager');

      // Critical Services만 즉시 초기화
      const criticalServices = [
        SERVICE_KEYS.VIDEO_CONTROL, // 비디오 제어 서비스 (미디어 클릭 시 즉시 필요)
        SERVICE_KEYS.MEDIA_EXTRACTION, // 미디어 추출 서비스 (사용자 상호작용 즉시 필요)
        SERVICE_KEYS.TOAST_CONTROLLER, // 토스트 알림 서비스 (즉시 사용 가능해야 함)
      ];

      for (const serviceKey of criticalServices) {
        try {
          await this.serviceManager.get(serviceKey);
          this.services.add(serviceKey);
          logger.debug(`✅ Critical 서비스 초기화: ${serviceKey}`);
        } catch (error) {
          logger.error(`❌ Critical 서비스 초기화 실패: ${serviceKey}`, error);
          throw error;
        }
      }

      // Toast 컨테이너 초기화 (Critical Services 이후)
      await this.initializeToastContainer();

      logger.info(`✅ Critical Path 초기화 완료: ${criticalServices.length}개 서비스`);
    } catch (error) {
      logger.error('❌ Critical Path 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 4단계: Non-Critical - 백그라운드에서 지연 초기화
   */
  private initializeNonCriticalSystems(): void {
    // 백그라운드 초기화 (setTimeout을 사용하여 마이크로태스크 큐에 추가)
    setTimeout(async () => {
      try {
        logger.info('Non-Critical 시스템 백그라운드 초기화 시작');

        const nonCriticalServices = [
          'theme.auto', // 테마 시스템
          'core.bulkDownload', // 벌크 다운로드
          'media.filename', // 파일명 서비스
          'gallery.download', // 갤러리 다운로드
        ];

        for (const serviceKey of nonCriticalServices) {
          try {
            await this.serviceManager.get(serviceKey);
            logger.debug(`✅ Non-Critical 서비스 초기화: ${serviceKey}`);
          } catch (error) {
            logger.warn(`⚠️ Non-Critical 서비스 초기화 실패 (무시): ${serviceKey}`, error);
            // Non-Critical 서비스 실패는 앱 전체를 중단시키지 않음
          }
        }

        // 성능 모니터링 활성화
        if (this.config.performanceMonitoring) {
          this.initializePerformanceMonitoring();
        }

        logger.info(
          `✅ Non-Critical 시스템 백그라운드 초기화 완료: ${nonCriticalServices.length}개 서비스`
        );
      } catch (error) {
        logger.warn('Non-Critical 시스템 초기화 중 오류 (앱 동작에는 영향 없음):', error);
      }
    });
  }

  /**
   * 성능 모니터링 초기화
   */
  private initializePerformanceMonitoring(): void {
    try {
      // 성능 모니터링 로직 (필요시 구현)
      logger.debug('성능 모니터링 활성화됨');
    } catch (error) {
      logger.warn('성능 모니터링 초기화 실패:', error);
    }
  }

  /**
   * 3단계: 갤러리 앱 시작
   */
  private async startGalleryApp(): Promise<void> {
    try {
      this.galleryApp = new GalleryApp();
      await this.galleryApp.initialize();

      // 전역 접근 등록 (정리용)
      (globalThis as Record<string, unknown>).__XEG_APP__ = this.galleryApp;

      logger.debug('✅ 갤러리 앱 시작 완료');
    } catch (error) {
      logger.error('❌ 갤러리 앱 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 메모리 관리 초기화
   */
  private initializeMemoryManagement(): void {
    if (!this.config.performanceMonitoring) {
      return;
    }

    // 30초마다 메모리 체크
    this.memoryMonitoringInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    logger.debug('✅ 메모리 관리 시스템 활성화');
  }

  /**
   * 메모리 사용량 체크
   */
  private checkMemoryUsage(): void {
    import('@core/memory/MemoryTracker')
      .then(({ memoryTracker }) => {
        memoryTracker.checkAndCleanup();
      })
      .catch(error => {
        logger.warn('메모리 체크 모듈 로드 실패:', error);
      });
  }

  /**
   * 전역 이벤트 핸들러 설정
   */
  private setupGlobalEventHandlers(): void {
    // 페이지 언로드 시 정리
    const beforeUnloadHandler = (): void => {
      this.cleanup().catch(error => logger.error('페이지 언로드 정리 중 오류:', error));
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    window.addEventListener('pagehide', beforeUnloadHandler);

    this.cleanupHandlers.push(() => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      window.removeEventListener('pagehide', beforeUnloadHandler);
    });
  }

  /**
   * 정리 핸들러 설정
   */
  private setupCleanupHandlers(): void {
    // 브라우저 환경에서는 Node.js process 이벤트를 사용할 수 없음
    // 대신 브라우저 특화된 정리 로직은 setupGlobalEventHandlers에서 처리
    logger.debug('Cleanup handlers initialized for browser environment');
  }

  /**
   * 개발 도구 설정
   */
  private setupDevelopmentTools(): void {
    // 전역 접근
    (globalThis as Record<string, unknown>).__XEG_APP__ = this;

    // 진단 도구
    import('@core/services/core-services').then(({ ServiceDiagnostics }) => {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ =
        ServiceDiagnostics.diagnoseServiceManager;

      logger.debug('🛠️ 개발 도구 활성화됨:', {
        availableCommands: ['__XEG_APP__', '__XEG_DIAGNOSE__()', '__XEG_GALLERY__ (갤러리 앱)'],
      });
    });
  }

  /**
   * 애플리케이션 정리
   */
  public async cleanup(): Promise<void> {
    if (this.state === 'destroyed') {
      return;
    }

    try {
      logger.info('🧹 애플리케이션 정리 시작');

      // 갤러리 앱 정리
      if (this.galleryApp) {
        await this.galleryApp.cleanup();
        this.galleryApp = null;
        delete (globalThis as Record<string, unknown>).__XEG_APP__;
      }

      // 서비스 매니저 정리
      this.serviceManager.cleanup();

      // 메모리 모니터링 정리
      if (this.memoryMonitoringInterval) {
        clearInterval(this.memoryMonitoringInterval);
        this.memoryMonitoringInterval = null;
      }

      // 정리 핸들러 실행
      await Promise.all(
        this.cleanupHandlers.map(handler =>
          Promise.resolve(handler()).catch((error: unknown) =>
            logger.warn('정리 핸들러 실행 중 오류:', error)
          )
        )
      );
      this.cleanupHandlers.length = 0;

      this.isStarted = false;
      this.state = 'destroyed';
      this.services.clear();

      logger.info('✅ 애플리케이션 정리 완료');
    } catch (error) {
      logger.error('❌ 애플리케이션 정리 중 오류:', error);
      throw error;
    }
  }

  /**
   * 상태 확인
   */
  public isRunning(): boolean {
    return this.isStarted && this.galleryApp !== null;
  }

  /**
   * 준비 상태 확인
   */
  public isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * 현재 생명주기 상태 반환
   */
  public getState(): AppLifecycleState {
    return this.state;
  }

  /**
   * 초기화 시간 반환 (밀리초)
   */
  public getInitTime(): number {
    return this.initStartTime > 0 ? performance.now() - this.initStartTime : 0;
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 갤러리 앱에 설정 전달
    if (this.galleryApp) {
      // AppConfig를 GalleryConfig로 변환
      const galleryConfig: Partial<import('./GalleryApp').GalleryConfig> =
        removeUndefinedProperties({
          performanceMonitoring: newConfig.performanceMonitoring,
          keyboardShortcuts: true, // 기본값 유지
          autoTheme: true, // 기본값 유지
        });

      this.galleryApp.updateConfig(galleryConfig);
    }

    logger.debug('설정 업데이트 완료');
  }

  /**
   * 진단 정보 반환
   */
  public getDiagnostics(): {
    application: {
      isRunning: boolean;
      state: AppLifecycleState;
      version: string;
      isDevelopment: boolean;
      hasGalleryApp: boolean;
      cleanupHandlersCount: number;
      initTime: number;
      retryCount: number;
      services: string[];
    };
    services: unknown;
    memory: {
      usedJSHeapSize: number | undefined;
      totalJSHeapSize: number | undefined;
      jsHeapSizeLimit: number | undefined;
    };
  } {
    const servicesDiagnostics = this.serviceManager.getDiagnostics();

    return {
      application: {
        isRunning: this.isRunning(),
        state: this.state,
        version: this.config.version,
        isDevelopment: this.config.isDevelopment,
        hasGalleryApp: !!this.galleryApp,
        cleanupHandlersCount: this.cleanupHandlers.length,
        initTime: this.getInitTime(),
        retryCount: this.retryCount,
        services: Array.from(this.services),
      },
      services: servicesDiagnostics,
      memory: this.getMemoryInfo(),
    };
  }

  /**
   * 메모리 정보 반환
   */
  private getMemoryInfo(): {
    usedJSHeapSize: number | undefined;
    totalJSHeapSize: number | undefined;
    jsHeapSizeLimit: number | undefined;
  } {
    // 동적 import를 사용하여 순환 의존성 방지
    try {
      // 동기적으로 MemoryManager 사용이 어려우므로 기존 방식 유지
      // (진단 정보는 실시간으로 필요하므로)
      const memory = (performance as unknown as Record<string, unknown>).memory as
        | {
            usedJSHeapSize?: number;
            totalJSHeapSize?: number;
            jsHeapSizeLimit?: number;
          }
        | undefined;

      return {
        usedJSHeapSize: memory?.usedJSHeapSize,
        totalJSHeapSize: memory?.totalJSHeapSize,
        jsHeapSizeLimit: memory?.jsHeapSizeLimit,
      };
    } catch (error) {
      logger.warn('메모리 정보 조회 실패:', error);
      return {
        usedJSHeapSize: undefined,
        totalJSHeapSize: undefined,
        jsHeapSizeLimit: undefined,
      };
    }
  }

  /**
   * 인스턴스 재설정 (테스트용)
   */
  public static resetInstance(): void {
    Application.instance = null;
  }

  /**
   * Toast 컨테이너 초기화
   */
  private async initializeToastContainer(): Promise<void> {
    try {
      // ToastContainer를 DOM에 렌더링
      const { ToastContainer } = await import('@shared/components/ui');
      const { getPreact } = await import('@core/external/vendors');
      const { h, render } = getPreact();

      // 컨테이너 생성 또는 찾기
      let toastContainer = document.getElementById('xeg-toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'xeg-toast-container';
        document.body.appendChild(toastContainer);
      }

      // ToastContainer 렌더링
      render(h(ToastContainer, {}), toastContainer);

      logger.debug('Toast 컨테이너 초기화 완료');
    } catch (error) {
      logger.warn('Toast 컨테이너 초기화 실패:', error);
    }
  }
}

/**
 * 편의를 위한 전역 인스턴스 및 유틸리티 함수
 * AppLifecycle과의 호환성을 위해 제공
 */
export const appLifecycle = {
  /**
   * 애플리케이션 인스턴스 가져오기
   */
  getInstance: (config?: Partial<AppConfig>): Application => {
    const instance = Application.getInstance();
    if (config && instance) {
      instance.updateConfig(config);
      return instance;
    }
    const defaultConfig: AppConfig = {
      version: '3.1.0',
      isDevelopment: false,
      debug: false,
      autoStart: true,
    };
    return instance ?? Application.create({ ...defaultConfig, ...config });
  },

  /**
   * 애플리케이션 시작
   */
  start: (): Promise<void> => appLifecycle.getInstance().start(),

  /**
   * 애플리케이션 정리
   */
  cleanup: (): Promise<void> => appLifecycle.getInstance().cleanup(),

  /**
   * 준비 상태 확인
   */
  isReady: (): boolean => appLifecycle.getInstance().isReady(),

  /**
   * 현재 상태 반환
   */
  getState: (): AppLifecycleState => appLifecycle.getInstance().getState(),
};
