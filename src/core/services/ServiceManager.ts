/**
 * @fileoverview Service Manager
 * @description 서비스 등록, 초기화, 의존성 관리
 */

import { logger } from '../../infrastructure/logging/logger';

export type ServiceFactory<T = unknown> = () => T | Promise<T>;

export interface ServiceConfig<T = unknown> {
  /** 서비스 생성 팩토리 함수 */
  factory: ServiceFactory<T>;
  /** 싱글톤 여부 (기본: true) */
  singleton?: boolean;
  /** 의존성 목록 */
  dependencies?: string[];
  /** 지연 로딩 여부 (기본: true) */
  lazy?: boolean;
}

export interface BaseService {
  initialize?(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
  destroy?(): void;
  isInitialized?(): boolean;
}

/**
 * 서비스 상태
 */
type ServiceState = 'registered' | 'loading' | 'ready' | 'failed';

/**
 * 서비스 메타데이터
 */
export interface ServiceMetadata {
  key: string;
  state: ServiceState;
  config: ServiceConfig;
  createdAt: number;
  loadedAt?: number;
  dependencies: string[];
  error?: Error;
}

/**
 * 통합 서비스 매니저
 *
 * 모든 서비스의 생명주기를 중앙에서 관리하며
 * Clean Architecture 원칙을 준수합니다.
 *
 * 주요 특징:
 * - 의존성 해결 및 순환 의존성 감지
 * - 서비스 생명주기 관리
 * - 에러 처리 및 복구
 * - 성능 모니터링
 */
export class ServiceManager {
  private static instance: ServiceManager | null = null;

  private readonly services = new Map<string, unknown>();
  private readonly configs = new Map<string, ServiceConfig>();
  private readonly metadata = new Map<string, ServiceMetadata>();
  private readonly loading = new Map<string, Promise<unknown>>();
  private readonly initializationGuard = new Set<string>();

  private constructor() {
    logger.debug('[ServiceManager] Instance created');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): ServiceManager {
    ServiceManager.instance ??= new ServiceManager();
    return ServiceManager.instance;
  }

  /**
   * 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): boolean {
    ServiceManager.instance = null;
    return true;
  }

  /**
   * 서비스 등록
   */
  public register<T>(key: string, config: ServiceConfig<T>): void {
    if (this.configs.has(key)) {
      logger.warn(`[ServiceManager] Service already registered, overwriting: ${key}`);
    }

    const fullConfig: ServiceConfig<T> = {
      singleton: true,
      lazy: true,
      dependencies: [],
      ...config,
    };

    this.configs.set(key, fullConfig);
    this.metadata.set(key, {
      key,
      state: 'registered',
      config: fullConfig,
      createdAt: Date.now(),
      dependencies: fullConfig.dependencies ?? [],
    });

    logger.debug(`[ServiceManager] Registered service: ${key}`);
  }

  /**
   * 서비스 조회 (비동기)
   *
   * @param key 서비스 키
   * @param dependencyPath 순환 의존성 감지를 위한 경로
   */
  public async get<T>(key: string, dependencyPath: string[] = []): Promise<T> {
    const metadata = this.metadata.get(key);
    if (!metadata) {
      throw new Error(`[ServiceManager] Service not registered: ${key}`);
    }

    // 순환 의존성 체크
    if (dependencyPath.includes(key)) {
      const cycle = [...dependencyPath, key].join(' -> ');
      throw new Error(`[ServiceManager] Circular dependency detected: ${cycle}`);
    }

    // 중복 초기화 방지
    if (this.initializationGuard.has(key)) {
      await this.waitForInitialization(key);
      const instance = this.services.get(key);
      if (instance) {
        return instance as T;
      }
    }

    // 이미 로딩 중인 경우 대기
    const loadingPromise = this.loading.get(key);
    if (loadingPromise) {
      return (await loadingPromise) as T;
    }

    // 싱글톤이고 이미 인스턴스가 있는 경우
    const existingService = this.services.get(key);
    if (existingService && metadata.config.singleton !== false) {
      return existingService as T;
    }

    // 초기화 가드 설정
    this.initializationGuard.add(key);

    try {
      // 의존성 먼저 해결
      if (metadata.dependencies.length > 0) {
        await this.resolveDependencies(metadata.dependencies, [...dependencyPath, key]);
      }

      // 서비스 생성
      metadata.state = 'loading';
      const servicePromise = this.createService(key, metadata.config);
      this.loading.set(key, servicePromise);

      const service = await servicePromise;

      // 싱글톤인 경우 저장
      if (metadata.config.singleton !== false) {
        this.services.set(key, service);
      }

      metadata.state = 'ready';
      metadata.loadedAt = Date.now();
      this.loading.delete(key);

      logger.debug(`[ServiceManager] Service created successfully: ${key}`);
      return service as T;
    } catch (error) {
      metadata.state = 'failed';
      metadata.error = error instanceof Error ? error : new Error(String(error));
      this.loading.delete(key);

      logger.error(`[ServiceManager] Failed to create service '${key}':`, error);
      throw error;
    } finally {
      this.initializationGuard.delete(key);
    }
  }

  /**
   * 동기적 서비스 조회 (이미 생성된 경우만)
   */
  public getSync<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(
        `[ServiceManager] Service not initialized yet: ${key}. Use async get() instead.`
      );
    }
    return service as T;
  }

  /**
   * 안전한 서비스 조회 (실패 시 null 반환)
   */
  public async tryGet<T>(key: string): Promise<T | null> {
    try {
      return await this.get<T>(key);
    } catch (error) {
      logger.warn(`[ServiceManager] Failed to get service '${key}':`, error);
      return null;
    }
  }

  /**
   * 모든 서비스 초기화
   */
  public async initializeAll(): Promise<void> {
    const keys = Array.from(this.configs.keys());
    const startTime = performance.now();

    logger.info(`[ServiceManager] Initializing ${keys.length} services...`);

    try {
      await Promise.all(keys.map(key => this.get(key)));

      const duration = performance.now() - startTime;
      logger.info(
        `[ServiceManager] All services initialized successfully (${duration.toFixed(2)}ms)`
      );
    } catch (error) {
      logger.error('[ServiceManager] Failed to initialize all services:', error);
      throw error;
    }
  }

  /**
   * 배치 초기화 (특정 서비스들만)
   */
  public async initializeBatch(keys: string[]): Promise<void> {
    const startTime = performance.now();

    logger.debug(`[ServiceManager] Initializing batch: ${keys.join(', ')}`);

    try {
      await Promise.all(keys.map(key => this.get(key)));

      const duration = performance.now() - startTime;
      logger.debug(`[ServiceManager] Batch initialized (${duration.toFixed(2)}ms)`);
    } catch (error) {
      logger.error('[ServiceManager] Failed to initialize batch:', error);
      throw error;
    }
  }

  /**
   * 서비스 정리
   */
  public cleanup(key?: string): void {
    if (key) {
      // 특정 서비스 정리
      const service = this.services.get(key);
      this.cleanupService(service);

      this.services.delete(key);
      this.metadata.delete(key);
      this.loading.delete(key);
      this.initializationGuard.delete(key);

      logger.debug(`[ServiceManager] Cleaned up service: ${key}`);
    } else {
      // 모든 서비스 정리
      const cleanedCount = this.services.size;

      this.services.forEach(service => {
        this.cleanupService(service);
      });

      this.services.clear();
      this.configs.clear();
      this.metadata.clear();
      this.loading.clear();
      this.initializationGuard.clear();

      logger.info(`[ServiceManager] Cleanup complete: ${cleanedCount} services cleaned`);
    }
  }

  /**
   * 서비스 상태 확인
   */
  public isRegistered(key: string): boolean {
    return this.configs.has(key);
  }

  public isInitialized(key: string): boolean {
    return this.services.has(key) && this.metadata.get(key)?.state === 'ready';
  }

  public getServiceState(key: string): ServiceState | null {
    return this.metadata.get(key)?.state ?? null;
  }

  public getServiceConfig(key: string): ServiceConfig | null {
    return this.configs.get(key) ?? null;
  }

  public getRegisteredServices(): string[] {
    return Array.from(this.configs.keys());
  }

  public getLoadedServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 진단 정보
   */
  public getDiagnostics(): {
    isReady: boolean;
    registeredServices: string[];
    initializedServices: string[];
    loadingServices: string[];
    failedServices: string[];
    metadata: Record<string, ServiceMetadata>;
    memoryUsage: {
      services: number;
      configs: number;
      loading: number;
      metadata: number;
    };
  } {
    const failedServices = Array.from(this.metadata.entries())
      .filter(([, meta]) => meta.state === 'failed')
      .map(([key]) => key);

    return {
      isReady: true,
      registeredServices: this.getRegisteredServices(),
      initializedServices: this.getLoadedServices(),
      loadingServices: Array.from(this.loading.keys()),
      failedServices,
      metadata: Object.fromEntries(this.metadata.entries()),
      memoryUsage: {
        services: this.services.size,
        configs: this.configs.size,
        loading: this.loading.size,
        metadata: this.metadata.size,
      },
    };
  }

  // Private 메서드들

  /**
   * 의존성 해결
   */
  private async resolveDependencies(dependencies: string[], path: string[] = []): Promise<void> {
    const promises = dependencies.map(dep => this.get(dep, path));
    await Promise.all(promises);
  }

  /**
   * 서비스 생성
   */
  private async createService(key: string, config: ServiceConfig): Promise<unknown> {
    const startTime = performance.now();

    try {
      const result = config.factory();
      const service = result instanceof Promise ? await result : result;

      // 서비스 초기화 시도
      if (service && typeof service === 'object' && 'initialize' in service) {
        const initMethod = service.initialize as unknown;
        if (typeof initMethod === 'function') {
          const initResult = initMethod.call(service);
          if (initResult instanceof Promise) {
            await initResult;
          }
        }
      }

      const initTime = performance.now() - startTime;
      if (initTime > 1000) {
        logger.warn(
          `[ServiceManager] Slow service initialization: ${key} (${initTime.toFixed(2)}ms)`
        );
      }

      return service;
    } catch (error) {
      logger.error(`[ServiceManager] Error creating service '${key}':`, error);
      throw error;
    }
  }

  /**
   * 서비스 정리 헬퍼
   */
  private cleanupService(service: unknown): void {
    if (!service || typeof service !== 'object') {
      return;
    }

    // cleanup 메서드 호출
    if ('cleanup' in service && typeof service.cleanup === 'function') {
      try {
        const result = service.cleanup();
        if (result instanceof Promise) {
          result.catch(error => {
            logger.warn('[ServiceManager] Error during service cleanup:', error);
          });
        }
      } catch (error) {
        logger.warn('[ServiceManager] Error during service cleanup:', error);
      }
    }

    // destroy 메서드 호출 (fallback)
    if ('destroy' in service && typeof service.destroy === 'function') {
      try {
        service.destroy();
      } catch (error) {
        logger.warn('[ServiceManager] Error during service destroy:', error);
      }
    }
  }

  /**
   * 초기화 완료 대기
   */
  private async waitForInitialization(key: string): Promise<void> {
    const maxWaitTime = 5000; // 5초
    const checkInterval = 50; // 50ms
    let waitTime = 0;

    while (this.initializationGuard.has(key) && waitTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }

    if (this.initializationGuard.has(key)) {
      throw new Error(`[ServiceManager] Service initialization timeout: ${key}`);
    }
  }
}

/**
 * 전역 ServiceManager 인스턴스
 */
export const serviceManager = ServiceManager.getInstance();

/**
 * 편의 함수들
 */
export const services = {
  /**
   * 서비스 등록
   */
  register: <T>(key: string, config: ServiceConfig<T>) => serviceManager.register(key, config),

  /**
   * 서비스 조회
   */
  get: <T>(key: string) => serviceManager.get<T>(key),

  /**
   * 동기 서비스 조회
   */
  getSync: <T>(key: string) => serviceManager.getSync<T>(key),

  /**
   * 안전한 서비스 조회
   */
  tryGet: <T>(key: string) => serviceManager.tryGet<T>(key),

  /**
   * 서비스 상태 확인
   */
  isReady: (key: string) => serviceManager.isInitialized(key),

  /**
   * 진단 정보
   */
  diagnostics: () => serviceManager.getDiagnostics(),
};
