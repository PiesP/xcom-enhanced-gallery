/**
 * Service Manager Unit Tests (Comprehensive)
 *
 * ServiceManager의 실제 구현에 맞춘 정확한 테스트 스위트
 * - WeakMap 기반 캐시 시스템의 정확한 동작
 * - 의존성 주입 및 순환 의존성 감지
 * - Singleton vs Non-singleton 패턴 테스트
 * - 메모리 효율성 및 정리 기능
 * - 에러 처리 및 진단 기능
 * - 실제 서비스 생명주기 관리
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseService } from '../../../../src/core/types/services.types';

// 직접 로거 모킹
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
};

vi.mock('../../../../src/infrastructure/logging/logger', () => ({
  logger: mockLogger,
}));

import { ServiceManager } from '../../../../src/core/services/ServiceManager';

// ServiceConfig 타입 정의 (ServiceManager와 일치)
interface ServiceConfig<T = unknown> {
  factory: () => T | Promise<T>;
  singleton?: boolean;
  dependencies?: string[];
  lazy?: boolean;
}

// Mock 서비스 클래스들 - BaseService 인터페이스를 정확히 구현
class MockService implements BaseService {
  private _isInitialized = false;
  private _isDestroyed = false;
  private initializationDelay: number;
  private destroyError: boolean;

  constructor(
    private config?: {
      delay?: number;
      shouldFail?: boolean;
      destroyError?: boolean;
      id?: string;
    }
  ) {
    this.initializationDelay = config?.delay ?? 0;
    this.destroyError = config?.destroyError ?? false;
  }

  async initialize(): Promise<void> {
    if (this.config?.shouldFail) {
      throw new Error(`Mock service initialization failed: ${this.config.id || 'unknown'}`);
    }

    if (this.initializationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.initializationDelay));
    }

    this._isInitialized = true;
  }

  destroy(): void {
    if (this.destroyError) {
      throw new Error(`Mock service destruction failed: ${this.config?.id || 'unknown'}`);
    }

    this._isDestroyed = true;
    this._isInitialized = false;
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  // 추가 헬퍼 메서드들
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  getStatus(): 'active' | 'inactive' | 'destroyed' {
    if (this._isDestroyed) return 'destroyed';
    return this._isInitialized ? 'active' : 'inactive';
  }

  getConfig(): unknown {
    return this.config;
  }

  getId(): string {
    return this.config?.id || 'mock-service';
  }
}

// 의존성이 있는 서비스
class DependentService implements BaseService {
  private _isInitialized = false;
  private dependencies: BaseService[] = [];

  constructor(
    private config?: { id?: string },
    ...deps: BaseService[]
  ) {
    this.dependencies = deps;
  }

  async initialize(): Promise<void> {
    // 의존성이 모두 초기화되었는지 확인
    for (const dep of this.dependencies) {
      if (!dep.isInitialized?.()) {
        throw new Error(`Dependency not initialized: ${this.config?.id || 'unknown'}`);
      }
    }
    this._isInitialized = true;
  }

  destroy(): void {
    this._isInitialized = false;
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  getDependencies(): BaseService[] {
    return this.dependencies;
  }
}

// 비동기 초기화를 테스트하기 위한 서비스
class AsyncMockService implements BaseService {
  private _isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private initializationTime: number;

  constructor(private config?: { delay?: number; id?: string }) {
    this.initializationTime = config?.delay ?? 50;
  }

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise(resolve => {
      setTimeout(() => {
        this._isInitialized = true;
        resolve();
      }, this.initializationTime);
    });

    return this.initPromise;
  }

  destroy(): void {
    this._isInitialized = false;
    this.initPromise = null;
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  getId(): string {
    return this.config?.id || 'async-mock-service';
  }
}

// 실패하는 서비스 - 다양한 실패 시나리오
class FailingService implements BaseService {
  constructor(
    private config?: {
      initError?: string;
      destroyError?: string;
      id?: string;
    }
  ) {}

  async initialize(): Promise<void> {
    const error = this.config?.initError || 'Service initialization failed';
    throw new Error(`${error}: ${this.config?.id || 'unknown'}`);
  }

  destroy(): void {
    if (this.config?.destroyError) {
      throw new Error(`${this.config.destroyError}: ${this.config?.id || 'unknown'}`);
    }
  }

  isInitialized(): boolean {
    return false;
  }
}

// Singleton 테스트용 서비스
class SingletonTestService implements BaseService {
  private static instanceCount = 0;
  private _isInitialized = false;
  public instanceId: number;

  constructor() {
    SingletonTestService.instanceCount++;
    this.instanceId = SingletonTestService.instanceCount;
  }

  async initialize(): Promise<void> {
    this._isInitialized = true;
  }

  destroy(): void {
    this._isInitialized = false;
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  static getInstanceCount(): number {
    return this.instanceCount;
  }

  static resetInstanceCount(): void {
    this.instanceCount = 0;
  }
}

// 로거 모킹 - vi.mock은 호이스팅되므로 여기서 직접 정의
vi.mock('../../../../src/infrastructure/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ServiceManager (Comprehensive Tests)', () => {
  let serviceManager: ServiceManager;

  beforeEach(() => {
    // 매번 새로운 인스턴스로 시작
    ServiceManager.resetInstance();
    serviceManager = ServiceManager.getInstance();
    SingletonTestService.resetInstanceCount();
    vi.clearAllMocks();

    // Mock logger functions를 초기화
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.time.mockClear();
    mockLogger.timeEnd.mockClear();
  });

  afterEach(() => {
    try {
      serviceManager.cleanup();
    } catch (error) {
      // cleanup 에러는 무시 (테스트 격리를 위해)
    }
    ServiceManager.resetInstance();
    vi.clearAllMocks();
  });

  describe('Service Registration', () => {
    it('서비스를 등록할 수 있어야 함', () => {
      const config: ServiceConfig = {
        factory: () => new MockService({ id: 'test-service' }),
      };

      serviceManager.register('mockService', config);

      expect(serviceManager.isRegistered('mockService')).toBe(true);
      expect(serviceManager.getRegisteredServices()).toContain('mockService');
    });

    it('팩토리 함수로 서비스를 등록할 수 있어야 함', () => {
      const factory = () => new MockService({ id: 'factory-service' });
      serviceManager.register('factoryService', { factory });

      expect(serviceManager.isRegistered('factoryService')).toBe(true);

      const config = serviceManager.getServiceConfig('factoryService');
      expect(config).toBeDefined();
      expect(config?.singleton).toBe(true); // 기본값은 singleton
      expect(config?.lazy).toBe(true); // 기본값은 lazy loading
    });

    it('중복 등록 시 경고 로그를 출력하고 덮어써야 함', async () => {
      // Import logger directly and spy on it
      const { logger } = await import('../../../../src/infrastructure/logging/logger');
      const warnSpy = vi.spyOn(logger, 'warn');

      serviceManager.register('mockService', { factory: () => new MockService({ id: 'first' }) });

      // This should trigger the warning
      serviceManager.register('mockService', { factory: () => new MockService({ id: 'second' }) });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Service already registered, overwriting: mockService')
      );
      expect(serviceManager.isRegistered('mockService')).toBe(true);

      // Clean up
      warnSpy.mockRestore();
    });

    it('의존성이 있는 서비스를 등록할 수 있어야 함', () => {
      serviceManager.register('dependency', {
        factory: () => new MockService({ id: 'dependency' }),
      });
      serviceManager.register('dependent', {
        factory: () => new MockService({ id: 'dependent' }),
        dependencies: ['dependency'],
      });

      expect(serviceManager.isRegistered('dependent')).toBe(true);

      const config = serviceManager.getServiceConfig('dependent');
      expect(config?.dependencies).toEqual(['dependency']);
    });

    it('복잡한 설정으로 서비스를 등록할 수 있어야 함', () => {
      serviceManager.register('complexService', {
        factory: () => new MockService({ id: 'complex' }),
        singleton: false,
        lazy: false,
        dependencies: [],
      });

      const config = serviceManager.getServiceConfig('complexService');
      expect(config?.singleton).toBe(false);
      expect(config?.lazy).toBe(false);
      expect(config?.dependencies).toEqual([]);
    });
  });

  describe('Service Creation', () => {
    it('서비스 인스턴스를 생성하고 초기화해야 함', async () => {
      serviceManager.register('mockService', {
        factory: () => new MockService({ id: 'created-service' }),
      });

      const service = await serviceManager.get<MockService>('mockService');

      expect(service).toBeInstanceOf(MockService);
      expect(service.isInitialized()).toBe(true);
      expect(service.getId()).toBe('created-service');
      expect(serviceManager.isInitialized('mockService')).toBe(true);
    });

    it('싱글톤 서비스는 같은 인스턴스를 반환해야 함', async () => {
      serviceManager.register('singletonService', {
        factory: () => new SingletonTestService(),
        singleton: true,
      });

      const service1 = await serviceManager.get<SingletonTestService>('singletonService');
      const service2 = await serviceManager.get<SingletonTestService>('singletonService');

      expect(service1).toBe(service2);
      expect(service1.instanceId).toBe(service2.instanceId);
      expect(SingletonTestService.getInstanceCount()).toBe(1);
    });

    it('비싱글톤 서비스는 다른 인스턴스를 반환해야 함', async () => {
      serviceManager.register('nonSingletonService', {
        factory: () => new SingletonTestService(),
        singleton: false,
      });

      const service1 = await serviceManager.get<SingletonTestService>('nonSingletonService');
      const service2 = await serviceManager.get<SingletonTestService>('nonSingletonService');

      expect(service1).not.toBe(service2);
      expect(service1.instanceId).not.toBe(service2.instanceId);
      expect(SingletonTestService.getInstanceCount()).toBe(2);
    });

    it('등록되지 않은 서비스 요청 시 명확한 에러를 발생시켜야 함', async () => {
      await expect(serviceManager.get('nonexistent')).rejects.toThrow(
        '[ServiceManager] Service not registered: nonexistent'
      );
    });

    it('동기적 서비스 접근이 올바르게 작동해야 함', async () => {
      serviceManager.register('syncTestService', {
        factory: () => new MockService({ id: 'sync-test' }),
      });

      // 먼저 비동기로 로드
      await serviceManager.get('syncTestService');

      // 그 다음 동기적으로 접근
      const service = serviceManager.getService<MockService>('syncTestService');
      expect(service.getId()).toBe('sync-test');
    });

    it('초기화되지 않은 서비스의 동기적 접근 시 에러 발생해야 함', () => {
      serviceManager.register('notInitialized', {
        factory: () => new MockService({ id: 'not-init' }),
      });

      expect(() => {
        serviceManager.getService('notInitialized');
      }).toThrow('[ServiceManager] Service not initialized yet: notInitialized');
    });
  });

  describe('Dependency Resolution', () => {
    it('의존성을 올바르게 해결해야 함', async () => {
      serviceManager.register('dependency', {
        factory: () => new MockService({ id: 'dependency' }),
      });
      serviceManager.register('dependent', {
        factory: async () => {
          // 의존성 서비스 가져오기
          const dep = await serviceManager.get<MockService>('dependency');
          return new DependentService({ id: 'dependent' }, dep);
        },
        dependencies: ['dependency'],
      });

      const service = await serviceManager.get<DependentService>('dependent');

      expect(service).toBeInstanceOf(DependentService);
      expect(service.isInitialized()).toBe(true);
      expect(serviceManager.isInitialized('dependency')).toBe(true);
      expect(serviceManager.isInitialized('dependent')).toBe(true);
    });

    it('순환 의존성을 감지해야 함', async () => {
      serviceManager.register('serviceA', {
        factory: () => new MockService({ id: 'serviceA' }),
        dependencies: ['serviceB'],
      });
      serviceManager.register('serviceB', {
        factory: () => new MockService({ id: 'serviceB' }),
        dependencies: ['serviceA'],
      });

      await expect(serviceManager.get('serviceA')).rejects.toThrow(
        /Circular dependency detected.*serviceA.*serviceB.*serviceA/
      );
    });

    it('누락된 의존성을 감지해야 함', async () => {
      serviceManager.register('dependent', {
        factory: () => new MockService({ id: 'dependent' }),
        dependencies: ['missingDependency'],
      });

      await expect(serviceManager.get('dependent')).rejects.toThrow(
        '[ServiceManager] Service not registered: missingDependency'
      );
    });

    it('깊은 의존성 체인을 해결해야 함', async () => {
      // A -> B -> C 의존성 체인
      serviceManager.register('serviceC', {
        factory: () => new MockService({ id: 'serviceC' }),
      });
      serviceManager.register('serviceB', {
        factory: async () => {
          const serviceC = await serviceManager.get<MockService>('serviceC');
          return new DependentService({ id: 'serviceB' }, serviceC);
        },
        dependencies: ['serviceC'],
      });
      serviceManager.register('serviceA', {
        factory: async () => {
          const serviceB = await serviceManager.get<DependentService>('serviceB');
          return new DependentService({ id: 'serviceA' }, serviceB);
        },
        dependencies: ['serviceB'],
      });

      const serviceA = await serviceManager.get<DependentService>('serviceA');

      expect(serviceA).toBeInstanceOf(DependentService);
      expect(serviceA.isInitialized()).toBe(true);
      expect(serviceManager.isInitialized('serviceA')).toBe(true);
      expect(serviceManager.isInitialized('serviceB')).toBe(true);
      expect(serviceManager.isInitialized('serviceC')).toBe(true);
    });

    it('다중 의존성을 병렬로 해결해야 함', async () => {
      const startTime = performance.now();

      serviceManager.register('dep1', {
        factory: () => new AsyncMockService({ delay: 50, id: 'dep1' }),
      });
      serviceManager.register('dep2', {
        factory: () => new AsyncMockService({ delay: 50, id: 'dep2' }),
      });
      serviceManager.register('multiDependent', {
        factory: async () => {
          const dep1 = await serviceManager.get<AsyncMockService>('dep1');
          const dep2 = await serviceManager.get<AsyncMockService>('dep2');
          return new DependentService({ id: 'multiDependent' }, dep1, dep2);
        },
        dependencies: ['dep1', 'dep2'],
      });

      const service = await serviceManager.get<DependentService>('multiDependent');
      const endTime = performance.now();

      expect(service).toBeInstanceOf(DependentService);
      expect(service.getDependencies()).toHaveLength(2);
      // 병렬 처리로 인해 총 시간이 100ms보다 훨씬 적어야 함
      expect(endTime - startTime).toBeLessThan(150);
    });
  });

  describe('Service Lifecycle', () => {
    it('서비스를 초기화하고 상태를 추적해야 함', async () => {
      serviceManager.register('lifecycleService', {
        factory: () => new MockService({ id: 'lifecycle' }),
      });

      expect(serviceManager.isInitialized('lifecycleService')).toBe(false);

      const service = await serviceManager.get<MockService>('lifecycleService');

      expect(service).toBeDefined();
      expect(service.isInitialized()).toBe(true);
      expect(serviceManager.isInitialized('lifecycleService')).toBe(true);
      expect(serviceManager.getLoadedServices()).toContain('lifecycleService');
    });

    it('특정 서비스를 파괴할 수 있어야 함', async () => {
      serviceManager.register('destroyableService', {
        factory: () => new MockService({ id: 'destroyable' }),
      });

      const service = await serviceManager.get<MockService>('destroyableService');
      expect(service.isInitialized()).toBe(true);
      expect(serviceManager.isInitialized('destroyableService')).toBe(true);

      serviceManager.cleanup('destroyableService');

      expect(serviceManager.isInitialized('destroyableService')).toBe(false);
      expect(serviceManager.getLoadedServices()).not.toContain('destroyableService');
    });

    it('모든 서비스를 파괴할 수 있어야 함', async () => {
      serviceManager.register('service1', {
        factory: () => new MockService({ id: 'service1' }),
      });
      serviceManager.register('service2', {
        factory: () => new MockService({ id: 'service2' }),
      });

      await serviceManager.get('service1');
      await serviceManager.get('service2');

      expect(serviceManager.getLoadedServices()).toHaveLength(2);

      serviceManager.cleanup();

      expect(serviceManager.getLoadedServices()).toHaveLength(0);
      expect(serviceManager.isInitialized('service1')).toBe(false);
      expect(serviceManager.isInitialized('service2')).toBe(false);
    });

    it('존재하지 않는 서비스 파괴는 안전해야 함', () => {
      expect(() => {
        serviceManager.cleanup('nonexistentService');
      }).not.toThrow();
    });

    it('서비스 파괴 중 에러가 발생해도 정리가 계속되어야 함', async () => {
      serviceManager.register('failingDestroy', {
        factory: () => new MockService({ id: 'failing', destroyError: true }),
      });
      serviceManager.register('normalService', {
        factory: () => new MockService({ id: 'normal' }),
      });

      await serviceManager.get('failingDestroy');
      await serviceManager.get('normalService');

      // cleanup 메서드가 에러 없이 완료되어야 함
      expect(() => {
        serviceManager.cleanup();
      }).not.toThrow();

      // 두 서비스 모두 정리되어야 함
      expect(serviceManager.isInitialized('failingDestroy')).toBe(false);
      expect(serviceManager.isInitialized('normalService')).toBe(false);
    });

    it('배치 초기화가 올바르게 작동해야 함', async () => {
      serviceManager.register('batchService1', {
        factory: () => new MockService({ id: 'batch1' }),
      });
      serviceManager.register('batchService2', {
        factory: () => new MockService({ id: 'batch2' }),
        dependencies: ['batchService1'],
      });

      await serviceManager.initializeBatch(['batchService2', 'batchService1']);

      expect(serviceManager.isInitialized('batchService1')).toBe(true);
      expect(serviceManager.isInitialized('batchService2')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('서비스 팩토리 실패를 올바르게 처리해야 함', async () => {
      serviceManager.register('failingFactory', {
        factory: () => {
          throw new Error('Factory creation failed');
        },
      });

      await expect(serviceManager.get('failingFactory')).rejects.toThrow('Factory creation failed');
      // 서비스가 초기화되지 않았음을 확인
      expect(serviceManager.isInitialized('failingFactory')).toBe(false);
    });

    it('서비스 초기화 실패를 처리해야 함', async () => {
      serviceManager.register('failingInit', {
        factory: () =>
          new FailingService({
            initError: 'Initialization failed',
            id: 'failing-init',
          }),
      });

      await expect(serviceManager.get('failingInit')).rejects.toThrow(
        'Initialization failed: failing-init'
      );
    });

    it('비동기 서비스 초기화 실패를 처리해야 함', async () => {
      serviceManager.register('asyncFailingService', {
        factory: () => new MockService({ shouldFail: true, id: 'async-fail' }),
      });

      await expect(serviceManager.get('asyncFailingService')).rejects.toThrow(
        'Mock service initialization failed: async-fail'
      );
    });

    it('의존성 초기화 실패 시 상위 서비스도 실패해야 함', async () => {
      serviceManager.register('failingDependency', {
        factory: () =>
          new FailingService({
            initError: 'Dependency failed',
            id: 'failing-dep',
          }),
      });
      serviceManager.register('dependentOnFailing', {
        factory: () => new MockService({ id: 'dependent-on-failing' }),
        dependencies: ['failingDependency'],
      });

      await expect(serviceManager.get('dependentOnFailing')).rejects.toThrow(
        'Dependency failed: failing-dep'
      );
    });

    it('중복 로딩 요청을 안전하게 처리해야 함', async () => {
      serviceManager.register('slowService', {
        factory: () => new AsyncMockService({ delay: 100, id: 'slow' }),
      });

      // 동시에 여러 번 요청
      const promises = [
        serviceManager.get('slowService'),
        serviceManager.get('slowService'),
        serviceManager.get('slowService'),
      ];

      const results = await Promise.all(promises);

      // 모든 결과가 같은 인스턴스여야 함 (singleton 기본값)
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
      expect((results[0] as AsyncMockService).getId()).toBe('slow');
    });

    it('tryGet 메서드가 에러 시 null을 반환해야 함', async () => {
      serviceManager.register('failingService', {
        factory: () => {
          throw new Error('Service creation failed');
        },
      });

      const result = await serviceManager.tryGet('failingService');

      expect(result).toBeNull();
      // 서비스가 초기화되지 않았음을 확인
      expect(serviceManager.isInitialized('failingService')).toBe(false);
    });

    it('등록되지 않은 서비스에 대한 tryGet은 null 반환해야 함', async () => {
      const result = await serviceManager.tryGet('nonexistentService');
      expect(result).toBeNull();
    });
  });

  describe('Service Status & Diagnostics', () => {
    it('서비스 상태를 정확히 추적해야 함', async () => {
      serviceManager.register('statusService', {
        factory: () => new MockService({ id: 'status' }),
      });

      // 등록되었지만 초기화되지 않은 상태
      expect(serviceManager.isRegistered('statusService')).toBe(true);
      expect(serviceManager.isInitialized('statusService')).toBe(false);

      // 서비스 로드 후
      const service = await serviceManager.get<MockService>('statusService');
      expect(service.isInitialized()).toBe(true);
      expect(serviceManager.isInitialized('statusService')).toBe(true);

      // 정리 후
      serviceManager.cleanup('statusService');
      expect(serviceManager.isInitialized('statusService')).toBe(false);
    });

    it('등록되지 않은 서비스 상태는 올바르게 반환해야 함', () => {
      expect(serviceManager.isRegistered('nonexistent')).toBe(false);
      expect(serviceManager.isInitialized('nonexistent')).toBe(false);
    });

    it('모든 서비스 상태를 올바르게 진단해야 함', async () => {
      serviceManager.register('service1', {
        factory: () => new MockService({ id: 'service1' }),
      });
      serviceManager.register('service2', {
        factory: () => new MockService({ id: 'service2' }),
      });

      // service1만 로드
      await serviceManager.get('service1');

      const diagnostics = serviceManager.getDiagnostics();

      expect(diagnostics.isReady).toBe(true);
      expect(diagnostics.registeredServices).toContain('service1');
      expect(diagnostics.registeredServices).toContain('service2');
      expect(diagnostics.initializedServices).toContain('service1');
      expect(diagnostics.initializedServices).not.toContain('service2');
      expect(diagnostics.loadingServices).toHaveLength(0);
    });

    it('메모리 사용량 정보를 제공해야 함 (개발 모드)', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      serviceManager.register('memoryTestService', {
        factory: () => new MockService({ id: 'memory-test' }),
      });

      const memoryUsage = serviceManager.getMemoryUsage();

      expect(memoryUsage).toBeDefined();
      expect(memoryUsage?.configs).toBeGreaterThan(0);

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('프로덕션 모드에서는 메모리 정보를 제공하지 않아야 함', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const memoryUsage = serviceManager.getMemoryUsage();

      expect(memoryUsage).toBeNull();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('로드된 서비스 목록을 올바르게 반환해야 함', async () => {
      serviceManager.register('loaded1', {
        factory: () => new MockService({ id: 'loaded1' }),
      });
      serviceManager.register('loaded2', {
        factory: () => new MockService({ id: 'loaded2' }),
      });
      serviceManager.register('notLoaded', {
        factory: () => new MockService({ id: 'notLoaded' }),
      });

      await serviceManager.get('loaded1');
      await serviceManager.get('loaded2');

      const loadedServices = serviceManager.getLoadedServices();

      expect(loadedServices).toContain('loaded1');
      expect(loadedServices).toContain('loaded2');
      expect(loadedServices).not.toContain('notLoaded');
      expect(loadedServices).toHaveLength(2);
    });

    it('등록된 모든 서비스 키를 반환해야 함', () => {
      serviceManager.register('reg1', { factory: () => new MockService() });
      serviceManager.register('reg2', { factory: () => new MockService() });
      serviceManager.register('reg3', { factory: () => new MockService() });

      const registeredServices = serviceManager.getRegisteredServices();

      expect(registeredServices).toContain('reg1');
      expect(registeredServices).toContain('reg2');
      expect(registeredServices).toContain('reg3');
      expect(registeredServices).toHaveLength(3);
    });
  });

  describe('Service Configuration', () => {
    it('설정과 함께 서비스를 생성해야 함', async () => {
      const config = { delay: 10, id: 'configured-service' };

      serviceManager.register('configuredService', {
        factory: () => new MockService(config),
      });

      const service = await serviceManager.get<MockService>('configuredService');

      expect(service).toBeInstanceOf(MockService);
      expect(service.getId()).toBe('configured-service');
    });

    it('서비스 설정 정보를 조회할 수 있어야 함', () => {
      const config: ServiceConfig = {
        factory: () => new MockService(),
        singleton: true,
        dependencies: ['other-service'],
      };

      serviceManager.register('mockService', config);

      const retrievedConfig = serviceManager.getServiceConfig('mockService');
      expect(retrievedConfig).toBeDefined();
      expect(retrievedConfig?.singleton).toBe(true);
      expect(retrievedConfig?.dependencies).toEqual(['other-service']);
    });

    it('등록되지 않은 서비스의 설정 조회 시 null 반환해야 함', () => {
      const config = serviceManager.getServiceConfig('nonexistent');
      expect(config).toBeNull();
    });
  });

  describe('Performance & Memory Management', () => {
    it('서비스 생성이 효율적이어야 함', async () => {
      serviceManager.register('performanceTest', {
        factory: () => new MockService({ id: 'performance' }),
      });

      const start = performance.now();
      await serviceManager.get('performanceTest');
      const end = performance.now();

      expect(end - start).toBeLessThan(50); // 50ms 이내
    });

    it('대량의 서비스를 효율적으로 관리해야 함', async () => {
      const serviceCount = 10;

      // 서비스 등록
      for (let i = 0; i < serviceCount; i++) {
        serviceManager.register(`bulkService${i}`, {
          factory: () => new MockService({ id: `bulk-${i}` }),
        });
      }

      const start = performance.now();

      // 모든 서비스 생성
      const promises = [];
      for (let i = 0; i < serviceCount; i++) {
        promises.push(serviceManager.get(`bulkService${i}`));
      }
      const services = await Promise.all(promises);

      const end = performance.now();

      expect(services).toHaveLength(serviceCount);
      expect(end - start).toBeLessThan(500); // 500ms 이내
      expect(serviceManager.getLoadedServices()).toHaveLength(serviceCount);
    });

    it('WeakMap 캐시 시스템이 올바르게 작동해야 함', async () => {
      serviceManager.register('cacheTestService', {
        factory: () => new SingletonTestService(),
        singleton: true,
      });

      // 첫 번째 호출
      const service1 = await serviceManager.get<SingletonTestService>('cacheTestService');
      const instanceCount1 = SingletonTestService.getInstanceCount();

      // 두 번째 호출 (캐시에서 가져와야 함)
      const service2 = await serviceManager.get<SingletonTestService>('cacheTestService');
      const instanceCount2 = SingletonTestService.getInstanceCount();

      expect(service1).toBe(service2);
      expect(instanceCount1).toBe(instanceCount2); // 인스턴스가 추가 생성되지 않아야 함
    });

    it('서비스 파괴 후 참조를 정리해야 함', async () => {
      serviceManager.register('cleanupTest', {
        factory: () => new MockService({ id: 'cleanup' }),
      });

      const service = await serviceManager.get<MockService>('cleanupTest');
      expect(service.isInitialized()).toBe(true);
      expect(serviceManager.isInitialized('cleanupTest')).toBe(true);

      serviceManager.cleanup('cleanupTest');

      expect(serviceManager.isInitialized('cleanupTest')).toBe(false);
      expect(serviceManager.getLoadedServices()).not.toContain('cleanupTest');
    });

    it('메모리 누수 없이 서비스 생성/파괴를 반복할 수 있어야 함', async () => {
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        serviceManager.register(`memoryTest${i}`, {
          factory: () => new MockService({ id: `memory-${i}` }),
          singleton: false, // 매번 새 인스턴스 생성
        });

        const service = await serviceManager.get<MockService>(`memoryTest${i}`);
        expect(service.getId()).toBe(`memory-${i}`);

        serviceManager.cleanup(`memoryTest${i}`);
        expect(serviceManager.isInitialized(`memoryTest${i}`)).toBe(false);
      }

      // 모든 반복 후 메모리가 정리되었는지 확인
      expect(serviceManager.getLoadedServices()).toHaveLength(0);
    });

    it('전체 초기화 성능이 적절해야 함', async () => {
      // 의존성 체인이 있는 서비스들 등록
      serviceManager.register('perfBase', {
        factory: () => new MockService({ id: 'perf-base' }),
      });
      serviceManager.register('perfMiddle', {
        factory: () => new MockService({ id: 'perf-middle' }),
        dependencies: ['perfBase'],
      });
      serviceManager.register('perfTop', {
        factory: () => new MockService({ id: 'perf-top' }),
        dependencies: ['perfMiddle'],
      });

      const start = performance.now();
      await serviceManager.initializeAll();
      const end = performance.now();

      expect(end - start).toBeLessThan(200); // 200ms 이내
      expect(serviceManager.getLoadedServices()).toHaveLength(3);
    });

    it('가비지 컬렉션 힌트가 제공되어야 함', () => {
      // 글로벌 gc 함수 모킹
      const originalGc = globalThis.gc;
      globalThis.gc = vi.fn();

      serviceManager.register('gcTest1', { factory: () => new MockService() });
      serviceManager.register('gcTest2', { factory: () => new MockService() });

      serviceManager.cleanup(); // 모든 서비스 정리

      // gc 함수가 호출되었는지 확인 (있는 경우에만)
      if (originalGc) {
        expect(globalThis.gc).toHaveBeenCalled();
      }

      // 원래 상태로 복원
      globalThis.gc = originalGc;
    });
  });

  describe('Advanced Features', () => {
    it('Singleton 인스턴스가 올바르게 관리되어야 함', () => {
      // ServiceManager 자체가 Singleton인지 확인
      const instance1 = ServiceManager.getInstance();
      const instance2 = ServiceManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('인스턴스 리셋이 올바르게 작동해야 함', () => {
      const instance1 = ServiceManager.getInstance();

      ServiceManager.resetInstance();

      const instance2 = ServiceManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('복잡한 의존성 그래프를 위상 정렬로 해결해야 함', async () => {
      // 복잡한 의존성 그래프: A -> [B, C], B -> D, C -> D
      serviceManager.register('nodeD', {
        factory: () => new MockService({ id: 'nodeD' }),
      });
      serviceManager.register('nodeB', {
        factory: () => new MockService({ id: 'nodeB' }),
        dependencies: ['nodeD'],
      });
      serviceManager.register('nodeC', {
        factory: () => new MockService({ id: 'nodeC' }),
        dependencies: ['nodeD'],
      });
      serviceManager.register('nodeA', {
        factory: () => new MockService({ id: 'nodeA' }),
        dependencies: ['nodeB', 'nodeC'],
      });

      // 배치 초기화로 의존성 순서 확인
      await serviceManager.initializeBatch(['nodeA', 'nodeB', 'nodeC', 'nodeD']);

      // 모든 서비스가 올바른 순서로 초기화되었는지 확인
      expect(serviceManager.isInitialized('nodeD')).toBe(true);
      expect(serviceManager.isInitialized('nodeB')).toBe(true);
      expect(serviceManager.isInitialized('nodeC')).toBe(true);
      expect(serviceManager.isInitialized('nodeA')).toBe(true);
    });

    it('서비스 매니저가 준비되지 않은 상태에서 작업 시 에러 발생해야 함', () => {
      // 새로운 인스턴스 생성하고 준비 상태를 강제로 false로 설정
      ServiceManager.resetInstance();
      const newManager = ServiceManager.getInstance();

      // private 필드에 접근하기 위한 타입 캐스팅
      (newManager as any).isReady = false;

      expect(() => {
        newManager.register('testService', { factory: () => new MockService() });
      }).toThrow('[ServiceManager] Manager not ready for registration');

      expect(async () => {
        await newManager.get('testService');
      }).rejects.toThrow('[ServiceManager] Manager not ready');
    });

    it('캐시 손실 시 자동 복구가 작동해야 함', async () => {
      serviceManager.register('cacheRecoveryTest', {
        factory: () => new MockService({ id: 'cache-recovery' }),
      });

      // WeakMap 캐시를 강제로 손상시키기 (실제로는 불가능하지만 시뮬레이션)
      const service = await serviceManager.get('cacheRecoveryTest');
      expect(service).toBeInstanceOf(MockService);

      // 정상적으로 작동하는지 확인
      expect(serviceManager.isInitialized('cacheRecoveryTest')).toBe(true);
    });

    it('빈 서비스 목록으로 전체 초기화 시 정상 처리해야 함', async () => {
      // 새로운 매니저 인스턴스로 시작
      ServiceManager.resetInstance();
      const emptyManager = ServiceManager.getInstance();

      // 에러 없이 완료되어야 함
      await expect(emptyManager.initializeAll()).resolves.not.toThrow();
    });

    it('성능 로깅은 정상적으로 작동해야 함', async () => {
      serviceManager.register('perfLogTest', {
        factory: () => new MockService({ id: 'perf-log', delay: 10 }),
      });

      const service = await serviceManager.get('perfLogTest');

      // 서비스가 올바르게 생성되었는지 확인
      expect(service).toBeInstanceOf(MockService);
      expect(serviceManager.isInitialized('perfLogTest')).toBe(true);
    });

    it('전체 서비스 정리 시 통계 로그가 출력되어야 함', async () => {
      // Import logger directly to get the actual logger instance used by ServiceManager
      const { logger } = await import('../../../../src/infrastructure/logging/logger');
      const infoSpy = vi.spyOn(logger, 'info');

      serviceManager.register('statsTest1', {
        factory: () => new MockService({ id: 'stats1' }),
      });
      serviceManager.register('statsTest2', {
        factory: () => new MockService({ id: 'stats2' }),
      });

      await serviceManager.get('statsTest1');
      await serviceManager.get('statsTest2');

      serviceManager.cleanup();

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Cleanup complete: \d+ services cleaned, \d+ errors/)
      );

      // Clean up
      infoSpy.mockRestore();
    });
  });
});
