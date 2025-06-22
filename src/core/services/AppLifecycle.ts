/**
 * @fileoverview Application Lifecycle Service
 * @version 2.1.0 - Simplified naming
 *
 * 애플리케이션의 전체 생명주기를 관리하는 핵심 서비스
 * 초기화 로직을 통합하고 Clean Architecture 원칙을 준수
 */

import { logger } from '@infrastructure/logging/logger';
import { BaseSingleton } from '@shared/utils/patterns/singleton';
import { serviceManager, type BaseService } from './ServiceManager';

export type AppLifecycleState = 'idle' | 'initializing' | 'ready' | 'error' | 'destroyed';

export interface LifecycleConfig {
  autoStart: boolean;
  retryCount: number;
  timeout: number;
}

/**
 * 애플리케이션 생명주기 관리 서비스
 *
 * 애플리케이션의 초기화, 시작, 정리 등 생명주기 전반을 관리합니다.
 * Clean Architecture 원칙에 따라 Infrastructure와 Core 레이어만 사용합니다.
 */
export class AppLifecycle extends BaseSingleton {
  private static readonly INSTANCE_NAME = 'AppLifecycle';

  private readonly config: LifecycleConfig;
  private state: AppLifecycleState = 'idle';
  private initStartTime = 0;
  private retryCount = 0;
  private readonly services = new Set<string>();

  constructor(config?: Partial<LifecycleConfig>) {
    super();
    this.config = {
      autoStart: true,
      retryCount: 3,
      timeout: 10000,
      ...config,
    };
  }

  public static getInstance(config?: Partial<LifecycleConfig>): AppLifecycle {
    return BaseSingleton.getOrCreateInstance(
      AppLifecycle.INSTANCE_NAME,
      () => new AppLifecycle(config)
    ) as AppLifecycle;
  }

  public static override resetInstance(): boolean {
    return BaseSingleton.resetInstance(AppLifecycle.INSTANCE_NAME);
  }

  /**
   * 애플리케이션 시작
   */
  public async start(): Promise<void> {
    if (this.state === 'ready') {
      logger.info('앱 생명주기: 이미 시작됨');
      return;
    }

    if (this.state === 'initializing') {
      logger.warn('앱 생명주기: 이미 초기화 중');
      return;
    }

    try {
      this.state = 'initializing';
      this.initStartTime = Date.now();

      logger.info('앱 생명주기: 시작', { config: this.config });

      // 서비스 매니저 초기화
      await this.initializeServiceManager();

      // 핵심 서비스들 초기화
      await this.initializeCoreServices();

      this.state = 'ready';
      const duration = Date.now() - this.initStartTime;

      logger.info('앱 생명주기: 초기화 완료', {
        duration: `${duration}ms`,
        services: Array.from(this.services),
      });
    } catch (error) {
      this.state = 'error';
      logger.error('앱 생명주기: 초기화 실패', error);

      if (this.retryCount < this.config.retryCount) {
        this.retryCount++;
        logger.info(`앱 생명주기: 재시도 ${this.retryCount}/${this.config.retryCount}`);

        // 지연 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.start();
      }

      throw error;
    }
  }

  /**
   * 애플리케이션 정리
   */
  public async cleanup(): Promise<void> {
    if (this.state === 'destroyed') {
      return;
    }

    try {
      logger.info('앱 생명주기: 정리 시작');

      // 서비스 매니저 정리
      await this.cleanupServices();

      this.state = 'destroyed';
      this.services.clear();

      logger.info('앱 생명주기: 정리 완료');
    } catch (error) {
      logger.error('앱 생명주기: 정리 실패', error);
      throw error;
    }
  }

  /**
   * 준비 상태 확인
   */
  public isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * 현재 상태 반환
   */
  public getState(): AppLifecycleState {
    return this.state;
  }

  /**
   * 초기화 시간 반환
   */
  public getInitTime(): number {
    return this.initStartTime > 0 ? Date.now() - this.initStartTime : 0;
  }

  /**
   * 서비스 매니저 초기화
   */
  private async initializeServiceManager(): Promise<void> {
    try {
      await serviceManager.initializeAll();
      this.services.add('ServiceManager');
      logger.debug('앱 생명주기: ServiceManager 초기화 완료');
    } catch (error) {
      logger.error('앱 생명주기: ServiceManager 초기화 실패', error);
      throw error;
    }
  }

  /**
   * 핵심 서비스들 초기화
   */
  private async initializeCoreServices(): Promise<void> {
    // Core 레이어의 핵심 서비스들만 초기화
    // Features나 Shared 레이어 서비스는 각각의 초기화 로직에서 처리

    const coreServices = ['ThemeService', 'ScrollProtection', 'BulkDownload'];

    for (const serviceName of coreServices) {
      try {
        const service = await serviceManager.get(serviceName);
        if (service && typeof (service as BaseService).initialize === 'function') {
          await (service as BaseService).initialize!();
          this.services.add(serviceName);
          logger.debug(`앱 생명주기: ${serviceName} 초기화 완료`);
        }
      } catch (error) {
        logger.warn(`앱 생명주기: ${serviceName} 초기화 실패`, error);
        // 개별 서비스 실패는 전체 초기화를 중단하지 않음
      }
    }
  }

  /**
   * 서비스들 정리
   */
  private async cleanupServices(): Promise<void> {
    // 등록된 서비스들을 역순으로 정리
    const servicesArray = Array.from(this.services).reverse();

    for (const serviceName of servicesArray) {
      try {
        const service = await serviceManager.get(serviceName);
        if (service && typeof (service as BaseService).cleanup === 'function') {
          await (service as BaseService).cleanup!();
          logger.debug(`앱 생명주기: ${serviceName} 정리 완료`);
        }
      } catch (error) {
        logger.warn(`앱 생명주기: ${serviceName} 정리 실패`, error);
      }
    }

    // 서비스 매니저 정리
    try {
      await serviceManager.cleanup();
      logger.debug('앱 생명주기: ServiceManager 정리 완료');
    } catch (error) {
      logger.warn('앱 생명주기: ServiceManager 정리 실패', error);
    }
  }
}

/**
 * 편의를 위한 전역 인스턴스 및 유틸리티 함수
 */
export const appLifecycle = {
  getInstance: (config?: Partial<LifecycleConfig>): AppLifecycle =>
    AppLifecycle.getInstance(config),

  start: (): Promise<void> => AppLifecycle.getInstance().start(),
  cleanup: (): Promise<void> => AppLifecycle.getInstance().cleanup(),
  isReady: (): boolean => AppLifecycle.getInstance().isReady(),
  getState: (): AppLifecycleState => AppLifecycle.getInstance().getState(),
};
