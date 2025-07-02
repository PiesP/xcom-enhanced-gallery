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

import { removeUndefinedProperties } from '../infrastructure/utils/type-safety-helpers';
import { designSystemManager } from '../shared/design-system';

import { ServiceManager } from '../core/services/ServiceManager';
import { logger } from '../infrastructure/logging/logger';
import type { AppConfig } from '../shared/types/app';
import { GalleryApp } from './GalleryApp';

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
   * 애플리케이션 시작
   *
   * 통합된 3단계 초기화:
   * 1. 기본 인프라 초기화
   * 2. 서비스 등록 및 초기화
   * 3. 갤러리 앱 시작
   */
  public async start(): Promise<void> {
    if (this.isStarted) {
      logger.debug('UnifiedApplication: Already started');
      return;
    }

    try {
      logger.info(`🚀 X.com Enhanced Gallery v${this.config.version} 시작`);
      const startTime = performance.now();

      // 1단계: 기본 인프라 초기화
      await this.initializeInfrastructure();

      // 2단계: 서비스 시스템 초기화
      await this.initializeServices();

      // 3단계: 갤러리 앱 시작
      await this.startGalleryApp();

      // 부가 기능 초기화
      this.initializeMemoryManagement();
      this.setupGlobalEventHandlers();

      this.isStarted = true;
      const duration = performance.now() - startTime;

      logger.info(`✅ 애플리케이션 시작 완료 (${duration.toFixed(2)}ms)`);

      // 개발 모드 설정
      if (this.config.isDevelopment) {
        this.setupDevelopmentTools();
      }
    } catch (error) {
      logger.error('❌ 애플리케이션 시작 실패:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * 1단계: 기본 인프라 초기화
   */
  private async initializeInfrastructure(): Promise<void> {
    try {
      // Vendor 라이브러리 초기화
      const { initializeVendors } = await import('@infrastructure/external/vendors');
      await initializeVendors();
      logger.debug('✅ Vendor 라이브러리 초기화 완료');

      // 통합 디자인 시스템 초기화 (v2.0)
      await designSystemManager.initialize({
        theme: 'auto',
        injectGlobalStyles: true,
      });
      logger.debug('✅ 통합 디자인 시스템 초기화 완료');
    } catch (error) {
      logger.error('❌ 인프라 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 2단계: 서비스 시스템 초기화
   */
  private async initializeServices(): Promise<void> {
    try {
      // 모든 서비스 등록
      const { registerAllServices } = await import('@core/services');
      await registerAllServices();

      // 핵심 서비스들 초기화
      await this.serviceManager.initializeAll();

      const registeredServices = this.serviceManager.getRegisteredServices();
      logger.debug(`✅ 서비스 시스템 초기화 완료: ${registeredServices.length}개 서비스`);

      if (this.config.isDevelopment) {
        logger.debug('등록된 서비스:', registeredServices);
      }
    } catch (error) {
      logger.error('❌ 서비스 시스템 초기화 실패:', error);
      throw error;
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
    import('@infrastructure/memory/MemoryManager')
      .then(({ memoryManager }) => {
        memoryManager.checkAndCleanup();
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
    (globalThis as Record<string, unknown>).__XEG_UNIFIED_APP__ = this;

    // 진단 도구
    import('@core/services/ServiceDiagnostics').then(({ diagnoseServiceManager }) => {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = diagnoseServiceManager;

      logger.debug('🛠️ 개발 도구 활성화됨:', {
        availableCommands: ['__XEG_UNIFIED_APP__', '__XEG_DIAGNOSE__()', '__XEG_APP__ (갤러리 앱)'],
      });
    });
  }

  /**
   * 애플리케이션 정리
   */
  public async cleanup(): Promise<void> {
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
      logger.info('✅ 애플리케이션 정리 완료');
    } catch (error) {
      logger.error('❌ 애플리케이션 정리 중 오류:', error);
    }
  }

  /**
   * 상태 확인
   */
  public isRunning(): boolean {
    return this.isStarted && this.galleryApp !== null;
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 갤러리 앱에 설정 전달
    if (this.galleryApp) {
      // AppConfig를 UnifiedGalleryConfig로 변환
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
      version: string;
      isDevelopment: boolean;
      hasGalleryApp: boolean;
      cleanupHandlersCount: number;
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
        version: this.config.version,
        isDevelopment: this.config.isDevelopment,
        hasGalleryApp: !!this.galleryApp,
        cleanupHandlersCount: this.cleanupHandlers.length,
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
      // 동기적으로 UnifiedMemoryManager 사용이 어려우므로 기존 방식 유지
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
}
