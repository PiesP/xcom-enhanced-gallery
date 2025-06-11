/**
 * @fileoverview Unified Service Manager
 * @version 1.0.0
 *
 * 모든 서비스의 생명주기를 관리하는 중앙 서비스 매니저
 * Factory 패턴과 Singleton 패턴을 통합한 Service Manager 패턴
 *
 * 성능 최적화:
 * - WeakMap을 사용한 메모리 누수 방지
 * - Lazy loading으로 필요한 시점에만 로드
 * - Tree-shaking 최적화를 위한 동적 import
 */

import { logger } from '@infrastructure/logging/logger';

type ServiceFactory<T> = () => T | Promise<T>;

interface ServiceConfig<T = unknown> {
  factory: ServiceFactory<T>;
  singleton?: boolean;
  dependencies?: string[];
  lazy?: boolean;
}

/**
 * 메모리 최적화를 위한 WeakMap 기반 캐시
 */
const serviceCache = new WeakMap<ServiceManager, Map<string, unknown>>();
const configCache = new WeakMap<ServiceManager, Map<string, ServiceConfig>>();
const initializedCache = new WeakMap<ServiceManager, Set<string>>();
const loadingCache = new WeakMap<ServiceManager, Map<string, Promise<unknown>>>();

/**
 * 통합 서비스 매니저
 * 모든 서비스의 생성, 초기화, 정리를 중앙에서 관리
 * 메모리 효율성을 위해 WeakMap 사용
 */
export class ServiceManager {
  private static instance: ServiceManager | null = null;
  private isReady = false;

  private constructor() {
    this.initializeCaches();
    this.isReady = true;
  }

  /**
   * WeakMap 기반 캐시 초기화
   */
  private initializeCaches(): void {
    serviceCache.set(this, new Map());
    configCache.set(this, new Map());
    initializedCache.set(this, new Set());
    loadingCache.set(this, new Map());
  }

  /**
   * 캐시 유효성 확인 및 복구
   */
  private ensureCaches(): {
    services: Map<string, unknown>;
    configs: Map<string, ServiceConfig>;
    initialized: Set<string>;
    loading: Map<string, Promise<unknown>>;
  } {
    let services = serviceCache.get(this);
    let configs = configCache.get(this);
    let initialized = initializedCache.get(this);
    let loading = loadingCache.get(this);

    // 캐시가 손실된 경우 재초기화
    if (!services || !configs || !initialized || !loading) {
      logger.warn('[ServiceManager] Cache lost, reinitializing...');
      this.initializeCaches();
      services = serviceCache.get(this);
      configs = configCache.get(this);
      initialized = initializedCache.get(this);
      loading = loadingCache.get(this);

      // 재초기화 후에도 실패하면 오류 발생
      if (!services || !configs || !initialized || !loading) {
        throw new Error('[ServiceManager] Critical error: Failed to initialize caches');
      }
    }

    return { services, configs, initialized, loading };
  }

  public static getInstance(): ServiceManager {
    this.instance ??= new ServiceManager();
    return this.instance;
  }

  /**
   * 서비스를 등록합니다
   */
  public register<T>(key: string, config: ServiceConfig<T>): void {
    if (!this.isReady) {
      throw new Error('[ServiceManager] Manager not ready for registration');
    }

    const { configs } = this.ensureCaches();

    // 중복 등록 확인
    if (configs.has(key)) {
      logger.warn(`[ServiceManager] Service already registered, overwriting: ${key}`);
    }

    configs.set(key, {
      singleton: true, // 기본값은 singleton
      lazy: true, // 기본값은 lazy loading
      ...config,
    });

    logger.debug(`[ServiceManager] Registered service: ${key}`);
  }

  /**
   * 서비스를 가져옵니다 (최적화된 버전)
   */
  public async get<T>(key: string): Promise<T> {
    if (!this.isReady) {
      throw new Error('[ServiceManager] Manager not ready');
    }

    const { services, configs, loading, initialized } = this.ensureCaches();

    const config = configs.get(key);
    if (!config) {
      throw new Error(`[ServiceManager] Service not registered: ${key}`);
    }

    // Singleton 체크 - 메모리 효율적 방식
    if (config.singleton && services.has(key)) {
      return services.get(key) as T;
    }

    // 중복 로딩 방지 - 이미 로딩 중인 경우
    if (loading.has(key)) {
      const existingPromise = loading.get(key);
      if (existingPromise) {
        return existingPromise as Promise<T>;
      }
    }

    // 순환 의존성 검사 추가
    if (config.dependencies && config.dependencies.length > 0) {
      this.checkCircularDependency(key, config.dependencies, configs, new Set());
    }

    // 의존성 먼저 로드 (병렬 처리로 성능 향상)
    if (config.dependencies && config.dependencies.length > 0) {
      await this.loadDependenciesOptimized(config.dependencies);
    }

    // 서비스 생성 - 메모리 효율적 방식
    const loadingPromise = this.createServiceOptimized(key, config);
    loading.set(key, loadingPromise);

    try {
      const service = await loadingPromise;

      if (config.singleton) {
        services.set(key, service);
      }

      initialized.add(key);
      loading.delete(key);

      logger.debug(`[ServiceManager] Service loaded: ${key}`);
      return service as T;
    } catch (error) {
      loading.delete(key);
      logger.error(`[ServiceManager] Failed to load service ${key}:`, error);
      throw error;
    }
  }

  /**
   * 동기적으로 서비스를 가져옵니다 (이미 로드된 서비스만)
   * @param key 서비스 키
   * @returns 서비스 인스턴스
   * @throws 서비스가 등록되지 않았거나 아직 로드되지 않은 경우 에러
   */
  public getService<T>(key: string): T {
    if (!this.isReady) {
      throw new Error('[ServiceManager] Manager not ready');
    }

    const { services, configs, initialized } = this.ensureCaches();

    const config = configs.get(key);
    if (!config) {
      throw new Error(`[ServiceManager] Service not registered: ${key}`);
    }

    // 이미 초기화된 서비스인지 확인
    if (!initialized.has(key)) {
      throw new Error(
        `[ServiceManager] Service not initialized yet: ${key}. Use get() for async loading.`
      );
    }

    // Singleton 서비스에서 캐시된 인스턴스 반환
    if (config.singleton && services.has(key)) {
      return services.get(key) as T;
    }

    throw new Error(`[ServiceManager] Service instance not found in cache: ${key}`);
  }

  /**
   * 모든 서비스를 초기화합니다 (배치 처리 최적화)
   */
  public async initializeAll(): Promise<void> {
    const { configs } = this.ensureCaches();
    const keys = Array.from(configs.keys());

    if (keys.length === 0) {
      logger.warn('[ServiceManager] No services registered for initialization');
      return;
    }

    try {
      // 의존성 순서를 고려한 배치 초기화
      await this.initializeBatch(keys);
      logger.info(`[ServiceManager] All ${keys.length} services initialized successfully`);
    } catch (error) {
      logger.error('[ServiceManager] Failed to initialize all services:', error);
      throw error;
    }
  }

  /**
   * 서비스를 정리합니다 (메모리 누수 방지)
   */
  public cleanup(key?: string): void {
    const { services, initialized, loading } = this.ensureCaches();

    if (key) {
      // 특정 서비스 정리
      this.cleanupSingleService(key, services, initialized, loading);
    } else {
      // 모든 서비스 정리
      this.cleanupAllServices(services, initialized, loading);
    }
  }

  /**
   * 단일 서비스 정리
   */
  private cleanupSingleService(
    key: string,
    services: Map<string, unknown>,
    initialized: Set<string>,
    loading: Map<string, Promise<unknown>>
  ): void {
    try {
      const service = services.get(key);
      this.destroyService(service, key);

      services.delete(key);
      initialized.delete(key);
      loading.delete(key);

      logger.debug(`[ServiceManager] Service cleaned up: ${key}`);
    } catch (error) {
      logger.warn(`[ServiceManager] Error cleaning up service ${key}:`, error);
    }
  }

  /**
   * 모든 서비스 정리
   */
  private cleanupAllServices(
    services: Map<string, unknown>,
    initialized: Set<string>,
    loading: Map<string, Promise<unknown>>
  ): void {
    let cleanupCount = 0;
    let errorCount = 0;

    // 모든 서비스 정리
    for (const [serviceKey, service] of services.entries()) {
      try {
        this.destroyService(service, serviceKey);
        cleanupCount++;
      } catch (error) {
        logger.warn(`[ServiceManager] Error destroying service ${serviceKey}:`, error);
        errorCount++;
      }
    }

    services.clear();
    initialized.clear();
    loading.clear();

    logger.info(
      `[ServiceManager] Cleanup complete: ${cleanupCount} services cleaned, ${errorCount} errors`
    );

    // 가비지 컬렉션 힌트
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
  }

  /**
   * 서비스 destroy 메서드 호출
   */
  private destroyService(service: unknown, key: string): void {
    if (
      service &&
      typeof service === 'object' &&
      'destroy' in service &&
      typeof service.destroy === 'function'
    ) {
      try {
        service.destroy();
      } catch (error) {
        throw new Error(`Service ${key} destroy failed: ${error}`);
      }
    }
  }

  /**
   * 서비스 상태 확인
   */
  public isInitialized(key: string): boolean {
    const initialized = initializedCache.get(this);
    return initialized?.has(key) ?? false;
  }

  public getLoadedServices(): string[] {
    const initialized = initializedCache.get(this);
    return initialized ? Array.from(initialized) : [];
  }

  /**
   * 의존성 로드 최적화 (병렬 처리)
   */
  private async loadDependenciesOptimized(dependencies: string[]): Promise<void> {
    await Promise.all(dependencies.map(dep => this.get(dep)));
  }

  /**
   * 순환 의존성 검사
   */
  private checkCircularDependency(
    currentKey: string,
    dependencies: string[],
    configs: Map<string, ServiceConfig>,
    visitingStack: Set<string>
  ): void {
    if (visitingStack.has(currentKey)) {
      const path = `${Array.from(visitingStack).join(' -> ')} -> ${currentKey}`;
      throw new Error(`[ServiceManager] Circular dependency detected: ${path}`);
    }

    visitingStack.add(currentKey);

    for (const dep of dependencies) {
      const depConfig = configs.get(dep);
      if (depConfig?.dependencies) {
        this.checkCircularDependency(dep, depConfig.dependencies, configs, visitingStack);
      }
    }

    visitingStack.delete(currentKey);
  }

  /**
   * 서비스 생성 최적화
   */
  private async createServiceOptimized<T>(key: string, config: ServiceConfig<T>): Promise<T> {
    try {
      const startTime = performance.now();
      const service = await config.factory();

      // BaseService 인터페이스를 구현한 서비스는 초기화해야 함
      if (
        service &&
        typeof (service as unknown as { initialize?: () => Promise<void> }).initialize ===
          'function'
      ) {
        await (service as unknown as { initialize: () => Promise<void> }).initialize();
      }

      const endTime = performance.now();

      logger.debug(
        `[ServiceManager] Created service ${key} in ${(endTime - startTime).toFixed(2)}ms`
      );
      return service;
    } catch (error) {
      logger.error(`[ServiceManager] Failed to create service ${key}:`, error);
      throw error;
    }
  }

  /**
   * 메모리 사용량 모니터링 (개발 모드)
   */
  public getMemoryUsage(): {
    services: number;
    configs: number;
    loading: number;
    initialized: number;
  } | null {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      const { services, configs, loading, initialized } = this.ensureCaches();

      return {
        services: services.size,
        configs: configs.size,
        loading: loading.size,
        initialized: initialized.size,
      };
    }
    return null;
  }

  /**
   * 서비스 상태 진단 (디버깅용)
   */
  public getDiagnostics(): {
    isReady: boolean;
    registeredServices: string[];
    initializedServices: string[];
    loadingServices: string[];
    memoryUsage: ReturnType<ServiceManager['getMemoryUsage']>;
  } {
    const { configs, initialized, loading } = this.ensureCaches();

    return {
      isReady: this.isReady,
      registeredServices: Array.from(configs.keys()),
      initializedServices: Array.from(initialized),
      loadingServices: Array.from(loading.keys()),
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * 정적 인스턴스 정리 (테스트용)
   */
  public static resetInstance(): void {
    if (this.instance) {
      this.instance.cleanup();
      this.instance = null;
    }
  }

  /**
   * 서비스 등록 상태 확인
   */
  public isRegistered(key: string): boolean {
    const { configs } = this.ensureCaches();
    return configs.has(key);
  }

  /**
   * 등록된 모든 서비스 키 반환
   */
  public getRegisteredServices(): string[] {
    const { configs } = this.ensureCaches();
    return Array.from(configs.keys());
  }

  /**
   * 서비스 등록 정보 반환 (디버깅용)
   */
  public getServiceConfig(key: string): ServiceConfig | null {
    const { configs } = this.ensureCaches();
    return configs.get(key) ?? null;
  }

  /**
   * 안전한 서비스 접근 (오류 시 null 반환)
   */
  public async tryGet<T>(key: string): Promise<T | null> {
    try {
      return await this.get<T>(key);
    } catch (error) {
      logger.warn(`[ServiceManager] Failed to get service safely: ${key}`, error);
      return null;
    }
  }

  /**
   * 배치 서비스 초기화 (의존성 순서 고려)
   */
  public async initializeBatch(keys: string[]): Promise<void> {
    const { configs } = this.ensureCaches();

    // 의존성 그래프 생성 및 위상 정렬
    const sortedKeys = this.topologicalSort(keys, configs);

    logger.debug(`[ServiceManager] Initializing services in order: ${sortedKeys.join(', ')}`);

    for (const key of sortedKeys) {
      try {
        await this.get(key);
      } catch (error) {
        logger.error(`[ServiceManager] Failed to initialize service in batch: ${key}`, error);
        throw error;
      }
    }
  }

  /**
   * 의존성 기반 위상 정렬
   */
  private topologicalSort(keys: string[], configs: Map<string, ServiceConfig>): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (key: string): void => {
      if (visited.has(key)) return;
      if (visiting.has(key)) {
        throw new Error(`[ServiceManager] Circular dependency detected involving: ${key}`);
      }

      visiting.add(key);

      const config = configs.get(key);
      if (config?.dependencies) {
        for (const dep of config.dependencies) {
          if (keys.includes(dep)) {
            visit(dep);
          }
        }
      }

      visiting.delete(key);
      visited.add(key);
      result.push(key);
    };

    for (const key of keys) {
      visit(key);
    }

    return result;
  }
}

// 글로벌 서비스 매니저 인스턴스
export const serviceManager = ServiceManager.getInstance();
