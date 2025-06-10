/**
 * @fileoverview Integrated Service Manager
 * @version 1.0.0
 *
 * PROJECT_STRUCTURE.md에서 정의된 IntegratedServiceManager 인터페이스 구현
 * 기존 ServiceManager를 래핑하여 문서화된 API를 제공
 *
 * 특징:
 * - 문서와 일치하는 공개 API
 * - 기존 ServiceManager 기능 유지
 * - Singleton 패턴으로 전역 접근
 * - 초기화 및 정리 생명주기 관리
 */

import { logger } from '@infrastructure/logging/logger';
import { ServiceManager } from './ServiceManager';
import { registerAllServices } from './ServiceRegistry';

/**
 * IntegratedServiceManager
 *
 * PROJECT_STRUCTURE.md에서 정의된 인터페이스:
 * - static getInstance(): IntegratedServiceManager
 * - async initialize(): Promise<void>
 * - getService<T>(serviceName: string): T
 * - async destroy(): Promise<void>
 */
export class IntegratedServiceManager {
  private static instance: IntegratedServiceManager | null = null;
  private serviceManager: ServiceManager;
  private isInitialized = false;
  private isDestroyed = false;

  private constructor() {
    this.serviceManager = ServiceManager.getInstance();
  }

  /**
   * Singleton 인스턴스를 반환합니다
   * @returns IntegratedServiceManager 인스턴스
   */
  public static getInstance(): IntegratedServiceManager {
    this.instance ??= new IntegratedServiceManager();
    return this.instance;
  }

  /**
   * 서비스 매니저를 초기화합니다
   * 모든 서비스를 등록하고 시스템을 준비 상태로 만듭니다
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('[IntegratedServiceManager] Already initialized');
      return;
    }

    if (this.isDestroyed) {
      throw new Error('[IntegratedServiceManager] Cannot initialize destroyed instance');
    }

    try {
      logger.info('[IntegratedServiceManager] Initializing service manager...');

      // 모든 서비스를 레지스트리에 등록
      registerAllServices();

      // 등록된 서비스 수 확인
      const registeredServices = this.serviceManager.getRegisteredServices();
      logger.info(`[IntegratedServiceManager] Registered ${registeredServices.length} services`);

      // 개발 모드에서 등록된 서비스 목록 출력
      if (import.meta.env.DEV) {
        logger.debug('[IntegratedServiceManager] Registered services:', registeredServices);
      }

      this.isInitialized = true;
      logger.info('[IntegratedServiceManager] Initialization completed');
    } catch (error) {
      logger.error('[IntegratedServiceManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 서비스를 가져옵니다
   * @param serviceName 서비스 이름
   * @returns 서비스 인스턴스
   */
  public getService<T>(serviceName: string): T {
    if (!this.isInitialized) {
      throw new Error(
        '[IntegratedServiceManager] Manager not initialized. Call initialize() first.'
      );
    }

    if (this.isDestroyed) {
      throw new Error('[IntegratedServiceManager] Manager has been destroyed');
    }

    try {
      // ServiceManager의 동기적 getService 메서드 사용
      // 비동기 버전이 필요한 경우 별도 메서드로 제공
      return this.serviceManager.getService<T>(serviceName);
    } catch (error) {
      logger.error(`[IntegratedServiceManager] Failed to get service '${serviceName}':`, error);
      throw error;
    }
  }

  /**
   * 비동기적으로 서비스를 가져옵니다
   * @param serviceName 서비스 이름
   * @returns 서비스 인스턴스 Promise
   */
  public async getServiceAsync<T>(serviceName: string): Promise<T> {
    if (!this.isInitialized) {
      throw new Error(
        '[IntegratedServiceManager] Manager not initialized. Call initialize() first.'
      );
    }

    if (this.isDestroyed) {
      throw new Error('[IntegratedServiceManager] Manager has been destroyed');
    }

    try {
      return await this.serviceManager.get<T>(serviceName);
    } catch (error) {
      logger.error(
        `[IntegratedServiceManager] Failed to get service async '${serviceName}':`,
        error
      );
      throw error;
    }
  }

  /**
   * 서비스 매니저를 정리하고 모든 리소스를 해제합니다
   */
  public async destroy(): Promise<void> {
    if (this.isDestroyed) {
      logger.debug('[IntegratedServiceManager] Already destroyed');
      return;
    }

    try {
      logger.info('[IntegratedServiceManager] Destroying service manager...');

      // ServiceManager 정리
      this.serviceManager.cleanup();

      this.isInitialized = false;
      this.isDestroyed = true;

      // 싱글톤 인스턴스 정리
      IntegratedServiceManager.instance = null;

      logger.info('[IntegratedServiceManager] Destruction completed');
    } catch (error) {
      logger.error('[IntegratedServiceManager] Destruction failed:', error);
      throw error;
    }
  }

  /**
   * 초기화 상태를 확인합니다
   * @returns 초기화 여부
   */
  public isReady(): boolean {
    return this.isInitialized && !this.isDestroyed;
  }

  /**
   * 등록된 서비스 목록을 반환합니다
   * @returns 등록된 서비스 이름 배열
   */
  public getRegisteredServices(): string[] {
    return this.serviceManager.getRegisteredServices();
  }

  /**
   * 로드된 서비스 목록을 반환합니다
   * @returns 로드된 서비스 이름 배열
   */
  public getLoadedServices(): string[] {
    return this.serviceManager.getLoadedServices();
  }

  /**
   * 서비스 매니저의 진단 정보를 반환합니다
   * @returns 진단 정보
   */
  public getDiagnostics(): {
    registeredServices: string[];
    initializedServices: string[];
    memoryUsage: {
      services: number;
      configs: number;
      initialized: number;
      loading: number;
    };
  } {
    const originalDiagnostics = this.serviceManager.getDiagnostics();
    return {
      registeredServices: originalDiagnostics.registeredServices,
      initializedServices: originalDiagnostics.initializedServices,
      memoryUsage: originalDiagnostics.memoryUsage ?? {
        services: 0,
        configs: 0,
        initialized: 0,
        loading: 0,
      },
    };
  }

  /**
   * 여러 서비스를 배치로 초기화합니다
   * @param serviceNames 초기화할 서비스 이름들
   */
  public async initializeBatch(serviceNames: string[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(
        '[IntegratedServiceManager] Manager not initialized. Call initialize() first.'
      );
    }

    try {
      await this.serviceManager.initializeBatch(serviceNames);
    } catch (error) {
      logger.error('[IntegratedServiceManager] Batch initialization failed:', error);
      throw error;
    }
  }

  /**
   * 특정 서비스가 등록되어 있는지 확인합니다
   * @param serviceName 서비스 이름
   * @returns 등록 여부
   */
  public hasService(serviceName: string): boolean {
    return this.serviceManager.getRegisteredServices().includes(serviceName);
  }

  /**
   * 특정 서비스가 초기화되어 있는지 확인합니다
   * @param serviceName 서비스 이름
   * @returns 초기화 여부
   */
  public isServiceInitialized(serviceName: string): boolean {
    return this.serviceManager.getLoadedServices().includes(serviceName);
  }
}

// 전역 접근을 위한 기본 인스턴스 (지연 생성)
let defaultInstance: IntegratedServiceManager | null = null;

/**
 * 기본 IntegratedServiceManager 인스턴스를 반환합니다
 * @returns IntegratedServiceManager 인스턴스
 */
export function getIntegratedServiceManager(): IntegratedServiceManager {
  defaultInstance ??= IntegratedServiceManager.getInstance();
  return defaultInstance;
}

/**
 * 편의를 위한 서비스 접근 함수
 * @param serviceName 서비스 이름
 * @returns 서비스 인스턴스
 */
export function getServiceFromIntegrated<T>(serviceName: string): T {
  return getIntegratedServiceManager().getService<T>(serviceName);
}

/**
 * 편의를 위한 비동기 서비스 접근 함수
 * @param serviceName 서비스 이름
 * @returns 서비스 인스턴스 Promise
 */
export function getServiceFromIntegratedAsync<T>(serviceName: string): Promise<T> {
  return getIntegratedServiceManager().getServiceAsync<T>(serviceName);
}
