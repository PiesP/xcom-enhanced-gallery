/**
 * @fileoverview Core Services 테스트
 * @description CoreService 통합 테스트
 * @note ConsoleLogger 및 defaultLogger 테스트는 logger.test.ts에서 커버됨
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  CoreService,
  getService,
} from '../../../../src/shared/services/core/core-service-manager.ts';

describe('CoreService', () => {
  setupGlobalTestIsolation();

  let coreService: CoreService;

  beforeEach(() => {
    CoreService.resetInstance();
    coreService = CoreService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('getInstance()는 항상 동일한 인스턴스를 반환한다', () => {
      const instance1 = CoreService.getInstance();
      const instance2 = CoreService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('resetInstance() 후 새로운 인스턴스를 생성한다', () => {
      const instance1 = CoreService.getInstance();
      CoreService.resetInstance();
      const instance2 = CoreService.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('register() & get()', () => {
    it('서비스를 등록하고 조회할 수 있다', () => {
      const testService = { name: 'test' };

      coreService.register('test-service', testService);
      const retrieved = coreService.get('test-service');

      expect(retrieved).toBe(testService);
    });

    it('타입 안전하게 조회할 수 있다', () => {
      interface TestService {
        value: number;
      }
      const testService: TestService = { value: 42 };

      coreService.register<TestService>('typed-service', testService);
      const retrieved = coreService.get<TestService>('typed-service');

      expect(retrieved.value).toBe(42);
    });

    it('존재하지 않는 서비스 조회 시 에러를 던진다', () => {
      expect(() => coreService.get('non-existent')).toThrow('Service not found: non-existent');
    });

    it('동일 키로 재등록 시 덮어쓰기 동작을 수행한다', () => {
      coreService.register('test', { version: 1 });
      coreService.register('test', { version: 2 });

      // 덮어쓰기가 성공적으로 수행됨
      const retrieved = coreService.get('test');
      expect(retrieved).toEqual({ version: 2 });
    });

    it('재등록 시 기존 인스턴스의 destroy()를 호출한다', () => {
      const oldInstance = {
        value: 1,
        destroy: vi.fn(),
      };

      coreService.register('test', oldInstance);
      coreService.register('test', { value: 2 });

      expect(oldInstance.destroy).toHaveBeenCalledTimes(1);
    });

    it('재등록 시 기존 인스턴스의 cleanup()을 호출한다', () => {
      const oldInstance = {
        value: 1,
        cleanup: vi.fn(),
      };

      coreService.register('test', oldInstance);
      coreService.register('test', { value: 2 });

      expect(oldInstance.cleanup).toHaveBeenCalledTimes(1);
    });

    it('destroy/cleanup 에러를 조용히 처리한다', () => {
      const oldInstance = {
        destroy: vi.fn(() => {
          throw new Error('destroy error');
        }),
        cleanup: vi.fn(() => {
          throw new Error('cleanup error');
        }),
      };

      coreService.register('test', oldInstance);

      expect(() => coreService.register('test', { value: 2 })).not.toThrow();
    });
  });

  describe('registerFactory() & get()', () => {
    it('팩토리를 등록하고 서비스를 생성할 수 있다', () => {
      const factory = vi.fn(() => ({ name: 'factory-service' }));

      coreService.registerFactory('factory-service', factory);
      const retrieved = coreService.get('factory-service');

      expect(factory).toHaveBeenCalledTimes(1);
      expect(retrieved).toEqual({ name: 'factory-service' });
    });

    it('팩토리는 캐싱된다 (동일 인스턴스 반환)', () => {
      const factory = vi.fn(() => ({ value: Math.random() }));

      coreService.registerFactory('cached-service', factory);
      const instance1 = coreService.get('cached-service');
      const instance2 = coreService.get('cached-service');

      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
    });

    it('동일 키로 팩토리 재등록 시 첫 번째 팩토리를 유지한다', () => {
      const factory1 = vi.fn(() => ({ version: 1 }));
      const factory2 = vi.fn(() => ({ version: 2 }));

      coreService.registerFactory('test-factory', factory1);
      coreService.registerFactory('test-factory', factory2);

      const retrieved = coreService.get('test-factory');

      expect(factory1).toHaveBeenCalledTimes(1);
      expect(factory2).not.toHaveBeenCalled();
      expect(retrieved).toEqual({ version: 1 });
    });

    it('직접 등록된 서비스와 키가 겹치면 직접 등록된 서비스가 우선한다', () => {
      coreService.register('test', { direct: true });
      coreService.registerFactory('test', () => ({ factory: true }));

      const retrieved = coreService.get('test');

      expect(retrieved).toEqual({ direct: true });
    });
  });

  describe('tryGet()', () => {
    it('서비스가 존재하면 반환한다', () => {
      coreService.register('test', { value: 42 });

      const result = coreService.tryGet('test');

      expect(result).toEqual({ value: 42 });
    });

    it('서비스가 없으면 null을 반환한다', () => {
      const result = coreService.tryGet('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('has()', () => {
    it('등록된 서비스는 true를 반환한다', () => {
      coreService.register('test', {});

      expect(coreService.has('test')).toBe(true);
    });

    it('미등록 서비스는 false를 반환한다', () => {
      expect(coreService.has('non-existent')).toBe(false);
    });

    it('팩토리 등록된 서비스는 true를 반환한다', () => {
      coreService.registerFactory('factory', () => ({}));

      expect(coreService.has('factory')).toBe(true);
    });
  });

  describe('getRegisteredServices()', () => {
    it('등록된 서비스 키 목록을 반환한다', () => {
      coreService.register('service1', {});
      coreService.register('service2', {});
      coreService.register('service3', {});

      const services = coreService.getRegisteredServices();

      expect(services).toEqual(['service1', 'service2', 'service3']);
    });

    it('초기 상태는 빈 배열이다', () => {
      expect(coreService.getRegisteredServices()).toEqual([]);
    });
  });

  describe('getDiagnostics()', () => {
    it('진단 정보를 반환한다', () => {
      coreService.register('service1', { value: 1 });
      coreService.register('service2', { value: 2 });

      const diagnostics = coreService.getDiagnostics();

      expect(diagnostics).toEqual({
        registeredServices: 2,
        activeInstances: 2,
        services: ['service1', 'service2'],
        instances: {
          service1: true,
          service2: true,
        },
      });
    });

    it('null 인스턴스를 올바르게 처리한다', () => {
      coreService.register('null-service', null);

      const diagnostics = coreService.getDiagnostics();

      // null도 등록된 서비스로 카운트됨
      expect(diagnostics.instances['null-service']).toBe(true);
      expect(diagnostics.activeInstances).toBe(1);
    });
  });

  describe('cleanup()', () => {
    it('모든 서비스의 destroy()를 호출한다', () => {
      const service1 = { destroy: vi.fn() };
      const service2 = { destroy: vi.fn() };

      coreService.register('service1', service1);
      coreService.register('service2', service2);

      coreService.cleanup();

      expect(service1.destroy).toHaveBeenCalledTimes(1);
      expect(service2.destroy).toHaveBeenCalledTimes(1);
    });

    it('모든 서비스의 cleanup()을 호출한다', () => {
      const service1 = { cleanup: vi.fn() };
      const service2 = { cleanup: vi.fn() };

      coreService.register('service1', service1);
      coreService.register('service2', service2);

      coreService.cleanup();

      expect(service1.cleanup).toHaveBeenCalledTimes(1);
      expect(service2.cleanup).toHaveBeenCalledTimes(1);
    });

    it('destroy()와 cleanup()이 모두 있으면 둘 다 호출한다', () => {
      const service = {
        destroy: vi.fn(),
        cleanup: vi.fn(),
      };

      coreService.register('service', service);
      coreService.cleanup();

      expect(service.destroy).toHaveBeenCalledTimes(1);
      expect(service.cleanup).toHaveBeenCalledTimes(1);
    });

    it('cleanup 메서드가 없는 서비스는 무시한다', () => {
      coreService.register('plain-service', { value: 42 });

      expect(() => coreService.cleanup()).not.toThrow();
    });

    it('cleanup 에러를 조용히 처리한다', () => {
      const service = {
        destroy: vi.fn(() => {
          throw new Error('destroy error');
        }),
        cleanup: vi.fn(() => {
          throw new Error('cleanup error');
        }),
      };

      coreService.register('error-service', service);

      expect(() => coreService.cleanup()).not.toThrow();
    });
  });

  describe('reset()', () => {
    it('모든 서비스를 초기화한다', () => {
      coreService.register('service1', {});
      coreService.register('service2', {});
      coreService.registerFactory('factory', () => ({}));

      coreService.reset();

      expect(coreService.getRegisteredServices()).toEqual([]);
      expect(() => coreService.get('service1')).toThrow();
      expect(() => coreService.get('factory')).toThrow();
    });
  });
});

describe('getService()', () => {
  beforeEach(() => {
    CoreService.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  it('CoreService.getInstance().get()를 호출한다', () => {
    const service = { value: 42 };
    CoreService.getInstance().register('test', service);

    const retrieved = getService('test');

    expect(retrieved).toBe(service);
  });

  it('타입 안전하게 조회할 수 있다', () => {
    interface TestService {
      method(): string;
    }
    const service: TestService = {
      method: () => 'result',
    };

    CoreService.getInstance().register('typed', service);

    const retrieved = getService<TestService>('typed');

    expect(retrieved.method()).toBe('result');
  });
});
