/**
 * @fileoverview Unified Service Manager
 * @version 2.0.0
 *
 * 단순화된 통합 서비스 매니저
 * 기존의 복잡한 ServiceManager, IntegratedServiceManager, ServiceRegistry를 통합
 *
 * 설계 원칙:
 * - 단일 책임 원칙 (SRP)
 * - 의존성 역전 원칙 (DIP)
 * - 인터페이스 분리 원칙 (ISP)
 * - 싱글톤 패턴으로 전역 접근
 */

import { logger } from '@infrastructure/logging/logger';

// 기본 서비스 인터페이스
interface BaseService {
  readonly name: string;
  initialize?(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
}

// 서비스 팩토리 타입
type ServiceFactory<T extends BaseService> = () => T | Promise<T>;

// 서비스 설정
interface ServiceConfig<T extends BaseService = BaseService> {
  factory: ServiceFactory<T>;
  singleton?: boolean;
  dependencies?: string[];
}

// 서비스 상태
type ServiceState = 'unregistered' | 'registered' | 'initializing' | 'initialized' | 'error';

interface ServiceRecord<T extends BaseService = BaseService> {
  config: ServiceConfig<T>;
  instance?: T;
  state: ServiceState;
  error?: Error;
}

/**
 * 통합 서비스 매니저
 *
 * 모든 서비스의 등록, 생성, 생명주기를 관리하는 중앙집중식 매니저
 */
export class UnifiedServiceManager {
  private static instance: UnifiedServiceManager;
  private readonly services = new Map<string, ServiceRecord>();
  private readonly initializationPromises = new Map<string, Promise<BaseService>>();

  private constructor() {}

  public static getInstance(): UnifiedServiceManager {
    return (this.instance ??= new UnifiedServiceManager());
  }

  /**
   * 서비스 등록
   */
  public register<T extends BaseService>(name: string, config: ServiceConfig<T>): void {
    if (this.services.has(name)) {
      logger.warn(`Service ${name} is already registered`);
      return;
    }

    this.services.set(name, {
      config,
      state: 'registered',
    });

    logger.debug(`Service registered: ${name}`);
  }

  /**
   * 서비스 가져오기 (지연 로딩)
   */
  public async get<T extends BaseService>(name: string): Promise<T> {
    const record = this.services.get(name);
    if (!record) {
      throw new Error(`Service not registered: ${name}`);
    }

    // 이미 초기화된 인스턴스가 있으면 반환
    if (record.instance && record.state === 'initialized') {
      return record.instance as T;
    }

    // 초기화 중이면 대기
    if (this.initializationPromises.has(name)) {
      return this.initializationPromises.get(name) as Promise<T>;
    }

    // 새로운 인스턴스 생성 및 초기화
    const initPromise = this.createAndInitializeService<T>(name, record);
    this.initializationPromises.set(name, initPromise);

    try {
      const instance = await initPromise;
      this.initializationPromises.delete(name);
      return instance;
    } catch (error) {
      this.initializationPromises.delete(name);
      throw error;
    }
  }

  /**
   * 서비스 생성 및 초기화
   */
  private async createAndInitializeService<T extends BaseService>(
    name: string,
    record: ServiceRecord
  ): Promise<T> {
    try {
      record.state = 'initializing';

      // 의존성 먼저 초기화
      if (record.config.dependencies) {
        await Promise.all(record.config.dependencies.map(dep => this.get(dep)));
      }

      // 서비스 인스턴스 생성
      const instance = await record.config.factory();
      record.instance = instance;

      // 초기화 메서드 호출
      if (instance.initialize) {
        await instance.initialize();
      }

      record.state = 'initialized';
      logger.debug(`Service initialized: ${name}`);

      return instance as T;
    } catch (error) {
      record.state = 'error';
      record.error = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to initialize service: ${name}`, error);
      throw record.error;
    }
  }

  /**
   * 모든 서비스 정리
   */
  public async cleanup(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    for (const [name, record] of this.services) {
      if (record.instance?.cleanup) {
        const cleanupPromise = Promise.resolve(record.instance.cleanup()).catch(error => {
          logger.error(`Failed to cleanup service: ${name}`, error);
        });
        cleanupPromises.push(cleanupPromise);
      }
    }

    await Promise.all(cleanupPromises);
    this.services.clear();
    this.initializationPromises.clear();
    logger.info('All services cleaned up');
  }

  /**
   * 서비스 상태 진단
   */
  public getDiagnostics(): Record<string, { state: ServiceState; error?: string }> {
    const diagnostics: Record<string, { state: ServiceState; error?: string }> = {};

    for (const [name, record] of this.services) {
      diagnostics[name] = {
        state: record.state,
        error: record.error?.message,
      };
    }

    return diagnostics;
  }

  /**
   * 등록된 서비스 목록
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 서비스 등록 해제
   */ public unregister(name: string): void {
    const record = this.services.get(name);
    if (record?.instance?.cleanup) {
      try {
        Promise.resolve(record.instance.cleanup()).catch(error => {
          logger.error(`Error during cleanup of service ${name}:`, error);
        });
      } catch (error) {
        logger.error(`Error during cleanup of service ${name}:`, error);
      }
    }

    this.services.delete(name);
    logger.debug(`Service unregistered: ${name}`);
  }

  /**
   * 안전한 서비스 가져오기 (에러 시 null 반환)
   */
  public async tryGet<T extends BaseService>(name: string): Promise<T | null> {
    try {
      return await this.get<T>(name);
    } catch (error) {
      logger.warn(`Failed to get service ${name}:`, error);
      return null;
    }
  }
}

// 전역 인스턴스 export
export const serviceManager = UnifiedServiceManager.getInstance();

// 편의 함수들
export function registerService<T extends BaseService>(
  name: string,
  config: ServiceConfig<T>
): void {
  serviceManager.register(name, config);
}

export async function getService<T extends BaseService>(name: string): Promise<T> {
  return serviceManager.get<T>(name);
}

export function cleanupAllServices(): Promise<void> {
  return serviceManager.cleanup();
}
