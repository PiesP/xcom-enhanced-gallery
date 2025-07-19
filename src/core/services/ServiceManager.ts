/**
 * @fileoverview Service Manager
 * @description 서비스 등록, 초기화, 의존성 관리
 */

import { logger } from '@core/logging/logger';

/**
 * 서비스 팩토리 함수 타입
 *
 * @description 서비스 인스턴스를 생성하는 팩토리 함수입니다.
 * 동기 또는 비동기 함수 모두 지원합니다.
 *
 * @template T 생성할 서비스 타입
 * @returns T | Promise<T> 서비스 인스턴스 또는 Promise
 */
export type ServiceFactory<T = unknown> = () => T | Promise<T>;

/**
 * 서비스 설정 인터페이스
 *
 * @description 서비스 등록 시 사용되는 설정 객체입니다.
 * 서비스의 생명주기와 의존성 관리 방식을 정의합니다.
 *
 * @template T 서비스 타입
 *
 * @example
 * ```typescript
 * // 기본 싱글톤 서비스
 * const config: ServiceConfig<VideoService> = {
 *   factory: () => new VideoService()
 * };
 *
 * // 의존성이 있는 서비스
 * const config: ServiceConfig<GalleryService> = {
 *   factory: () => new GalleryService(),
 *   dependencies: ['video.control', 'scroll.service']
 * };
 *
 * // 즉시 로딩되는 비싱글톤 서비스
 * const config: ServiceConfig<TempService> = {
 *   factory: () => new TempService(),
 *   singleton: false,
 *   lazy: false
 * };
 * ```
 */
export interface ServiceConfig<T = unknown> {
  /**
   * 서비스 생성 팩토리 함수
   *
   * @description 서비스 인스턴스를 생성하는 함수입니다.
   * 비동기 초기화가 필요한 경우 Promise를 반환할 수 있습니다.
   */
  factory: ServiceFactory<T>;

  /**
   * 싱글톤 여부
   *
   * @description true인 경우 한 번만 생성되어 재사용됩니다.
   * false인 경우 조회할 때마다 새 인스턴스를 생성합니다.
   * @default true
   */
  singleton?: boolean;

  /**
   * 의존성 목록
   *
   * @description 이 서비스가 의존하는 다른 서비스들의 키 목록입니다.
   * 서비스 생성 전에 의존성들이 먼저 초기화됩니다.
   * @default []
   */
  dependencies?: string[];

  /**
   * 지연 로딩 여부
   *
   * @description true인 경우 첫 조회 시점에 생성됩니다.
   * false인 경우 등록과 동시에 즉시 생성됩니다.
   * @default true
   */
  lazy?: boolean;
}

/**
 * 기본 서비스 인터페이스
 *
 * @description 서비스가 구현할 수 있는 선택적 생명주기 메서드들을 정의합니다.
 * 이 인터페이스를 구현하면 ServiceManager가 자동으로 생명주기를 관리합니다.
 *
 * @example
 * ```typescript
 * class VideoControlService implements BaseService {
 *   private isReady = false;
 *
 *   async initialize(): Promise<void> {
 *     // 서비스 초기화 로직
 *     await this.setupVideoControls();
 *     this.isReady = true;
 *   }
 *
 *   async cleanup(): Promise<void> {
 *     // 정리 로직
 *     this.removeEventListeners();
 *     this.isReady = false;
 *   }
 *
 *   isInitialized(): boolean {
 *     return this.isReady;
 *   }
 * }
 * ```
 */
export interface BaseService {
  /**
   * 서비스 초기화 메서드
   *
   * @description 서비스가 생성된 후 자동으로 호출됩니다.
   * 비동기 초기화 작업을 수행할 수 있습니다.
   *
   * @returns Promise<void> | void 초기화 완료 Promise 또는 즉시 완료
   */
  initialize?(): Promise<void> | void;

  /**
   * 서비스 정리 메서드
   *
   * @description 애플리케이션 종료 시 또는 서비스 해제 시 호출됩니다.
   * 리소스 정리, 이벤트 리스너 제거 등을 수행합니다.
   *
   * @returns Promise<void> | void 정리 완료 Promise 또는 즉시 완료
   */
  cleanup?(): Promise<void> | void;

  /**
   * 서비스 즉시 파괴 메서드
   *
   * @description cleanup과 달리 즉시 동기적으로 서비스를 파괴합니다.
   * 에러 상황에서 강제 정리 시 사용됩니다.
   */
  destroy?(): void;

  /**
   * 서비스 초기화 상태 확인
   *
   * @description 서비스가 초기화되어 사용 가능한 상태인지 확인합니다.
   *
   * @returns boolean 초기화 완료 여부
   */
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
 * 서비스 매니저
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
  } /**
   * 서비스 등록
   *
   * @description 새로운 서비스를 서비스 컨테이너에 등록합니다.
   * 서비스는 지연 로딩되며, 필요할 때 팩토리 함수를 통해 생성됩니다.
   *
   * @template T 서비스 타입
   * @param key 서비스 고유 키 (예: 'video.control', 'gallery.renderer')
   * @param config 서비스 설정 객체
   *
   * @example
   * ```typescript
   * // 싱글톤 서비스 등록
   * serviceManager.register('video.control', {
   *   factory: () => new VideoControlService(),
   *   dependencies: ['scroll.service']
   * });
   *
   * // 일반 서비스 등록 (매번 새 인스턴스)
   * serviceManager.register('media.processor', {
   *   factory: () => new MediaProcessor(),
   *   singleton: false
   * });
   *
   * // 비동기 서비스 등록
   * serviceManager.register('api.client', {
   *   factory: async () => {
   *     const client = new APIClient();
   *     await client.initialize();
   *     return client;
   *   }
   * });
   * ```
   *
   * @see {@link ServiceConfig} 서비스 설정 옵션
   * @see {@link get} 서비스 조회 방법
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
   * @description 등록된 서비스를 조회하고, 필요시 생성 및 초기화합니다.
   * 의존성이 있는 경우 자동으로 해결하며, 순환 의존성을 감지합니다.
   *
   * @template T 반환할 서비스 타입
   * @param key 조회할 서비스 키
   * @param dependencyPath 순환 의존성 감지를 위한 경로 (내부 사용)
   * @returns Promise<T> 서비스 인스턴스
   * @throws {Error} 서비스가 등록되지 않았거나 순환 의존성이 발견된 경우
   *
   * @example
   * ```typescript
   * // 기본 사용법
   * const videoService = await serviceManager.get<VideoControlService>('video.control');
   * videoService.play();
   *
   * // 타입 추론 사용
   * const galleryRenderer = await serviceManager.get('gallery.renderer');
   * // TypeScript가 자동으로 타입을 추론함
   *
   * // 에러 처리
   * try {
   *   const service = await serviceManager.get('unknown.service');
   * } catch (error) {
   *   console.error('서비스 조회 실패:', error.message);
   * }
   * ```
   *
   * @see {@link getSync} 동기적 조회 (이미 생성된 서비스만)
   * @see {@link tryGet} 안전한 조회 (실패 시 null 반환)
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
   *
   * @description 이미 생성된 서비스 인스턴스를 즉시 반환합니다.
   * 서비스가 아직 생성되지 않은 경우 에러를 발생시킵니다.
   *
   * @template T 반환할 서비스 타입
   * @param key 조회할 서비스 키
   * @returns T 서비스 인스턴스
   * @throws {Error} 서비스가 아직 초기화되지 않은 경우
   *
   * @example
   * ```typescript
   * // 서비스가 이미 초기화된 경우에만 사용
   * if (serviceManager.isInitialized('video.control')) {
   *   const videoService = serviceManager.getSync<VideoControlService>('video.control');
   *   videoService.pause();
   * }
   *
   * // 핫 패스에서 성능이 중요한 경우
   * try {
   *   const cachedService = serviceManager.getSync('frequently.used.service');
   *   return cachedService.quickOperation();
   * } catch {
   *   // 폴백 로직
   *   return await this.initializeAndUse();
   * }
   * ```
   *
   * @see {@link get} 비동기 조회 (생성 및 초기화 포함)
   * @see {@link isInitialized} 서비스 초기화 상태 확인
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
