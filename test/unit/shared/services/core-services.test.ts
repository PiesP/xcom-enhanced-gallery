/**
 * @fileoverview Core Services 테스트
 * @description ConsoleLogger 어댑터 및 CoreService 통합 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleLogger, defaultLogger } from '../../../../src/shared/services/core-services';
import {
  CoreService,
  serviceManager,
  getService,
} from '../../../../src/shared/services/core-services';

// Mock logger
vi.mock('../../../../src/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import mocked logger
import { logger as mockLogger } from '../../../../src/shared/logging/logger';

describe('ConsoleLogger', () => {
  let consoleLogger: ConsoleLogger;

  beforeEach(() => {
    consoleLogger = new ConsoleLogger();
    vi.clearAllMocks();
  });

  it('debug()는 logger.debug()를 호출한다', () => {
    consoleLogger.debug('debug message', 'arg1', 'arg2');

    expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    expect(mockLogger.debug).toHaveBeenCalledWith('debug message', 'arg1', 'arg2');
  });

  it('info()는 logger.info()를 호출한다', () => {
    consoleLogger.info('info message', 'arg1');

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith('info message', 'arg1');
  });

  it('warn()은 logger.warn()을 호출한다', () => {
    consoleLogger.warn('warn message');

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith('warn message');
  });

  it('error()는 logger.error()를 호출한다', () => {
    consoleLogger.error('error message', { code: 500 });

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('error message', { code: 500 });
  });

  it('여러 인자를 전달할 수 있다', () => {
    consoleLogger.debug('message', 1, true, { foo: 'bar' }, [1, 2, 3]);

    expect(mockLogger.debug).toHaveBeenCalledWith('message', 1, true, { foo: 'bar' }, [1, 2, 3]);
  });

  it('인자 없이 호출할 수 있다', () => {
    consoleLogger.info('message only');

    expect(mockLogger.info).toHaveBeenCalledWith('message only');
  });
});

describe('defaultLogger', () => {
  it('ConsoleLogger 인스턴스이다', () => {
    expect(defaultLogger).toBeInstanceOf(ConsoleLogger);
  });

  it('logger 메서드를 호출할 수 있다', () => {
    vi.clearAllMocks();

    defaultLogger.debug('test');
    defaultLogger.info('test');
    defaultLogger.warn('test');
    defaultLogger.error('test');

    expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
  });
});

describe('CoreService', () => {
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
      expect(() => coreService.get('non-existent')).toThrow(
        '서비스를 찾을 수 없습니다: non-existent'
      );
    });

    it('동일 키로 재등록 시 경고를 출력한다', () => {
      coreService.register('test', { version: 1 });
      coreService.register('test', { version: 2 });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('서비스 덮어쓰기: test')
      );
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
      expect(mockLogger.warn).toHaveBeenCalledTimes(3); // 덮어쓰기 + destroy 실패 + cleanup 실패
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

    it('동일 키로 팩토리 재등록 시 무시한다', () => {
      const factory1 = vi.fn(() => ({ version: 1 }));
      const factory2 = vi.fn(() => ({ version: 2 }));

      coreService.registerFactory('test-factory', factory1);
      coreService.registerFactory('test-factory', factory2);

      const retrieved = coreService.get('test-factory');

      expect(factory1).toHaveBeenCalledTimes(1);
      expect(factory2).not.toHaveBeenCalled();
      expect(retrieved).toEqual({ version: 1 });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('팩토리 중복 등록 무시: test-factory')
      );
    });

    it('직접 등록된 서비스와 키가 겹치면 팩토리 등록을 무시한다', () => {
      coreService.register('test', { direct: true });
      coreService.registerFactory('test', () => ({ factory: true }));

      const retrieved = coreService.get('test');

      expect(retrieved).toEqual({ direct: true });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('팩토리 중복 등록 무시: test')
      );
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
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('서비스 조회 실패: non-existent'),
        expect.any(Error)
      );
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

    it('팩토리 등록된 서비스는 false를 반환한다 (캐시 전)', () => {
      coreService.registerFactory('factory', () => ({}));

      expect(coreService.has('factory')).toBe(false);
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

      expect(diagnostics.instances['null-service']).toBe(false);
      expect(diagnostics.activeInstances).toBe(0);
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
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('error-service destroy 실패:'),
        expect.any(Error)
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('error-service cleanup 실패:'),
        expect.any(Error)
      );
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
