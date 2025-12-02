// Vitest globals (describe/it/expect/vi) are provided by tsconfig "vitest/globals"; avoid importing runtime helpers here
import { CoreService } from '@shared/services/service-manager';

describe('CoreService', () => {
  beforeEach(() => {
    // Reset singleton before each test
    CoreService.resetInstance();
  });

  it('registers and retrieves services', () => {
    const manager = CoreService.getInstance();
    manager.register('foo', { value: 1 });
    expect(manager.has('foo')).toBe(true);
    expect(manager.get('foo')).toEqual({ value: 1 });
    expect(manager.tryGet('foo')).toEqual({ value: 1 });
    expect(manager.getRegisteredServices()).toContain('foo');
  });

  it('throws when requesting unknown service', () => {
    const manager = CoreService.getInstance();
    expect(() => manager.get('missing')).toThrow();
  });

  it('cleanup destroys disposable services and clears registry', () => {
    const manager = CoreService.getInstance();
    const destroyed = { called: false };
    manager.register('dis', { destroy: () => (destroyed.called = true) });
    manager.cleanup();
    expect(destroyed.called).toBe(true);
    expect(manager.getRegisteredServices()).toHaveLength(0);
  });

  it('resetInstance resets singleton to null', () => {
    const manager = CoreService.getInstance();
    manager.register('a', 1);
    CoreService.resetInstance();
    const newManager = CoreService.getInstance();
    expect(newManager.has('a')).toBe(false);
  });
});
import { logger } from '@shared/logging';

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('CoreService', () => {
  // Helper to reset the singleton instance
  const resetInstance = () => {
    CoreService.resetInstance();
  };

  beforeEach(() => {
    resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CoreService.getInstance();
      const instance2 = CoreService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after resetInstance', () => {
      const instance1 = CoreService.getInstance();
      CoreService.resetInstance();
      const instance2 = CoreService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Service Registration & Retrieval', () => {
    it('should register and retrieve a service', () => {
      const core = CoreService.getInstance();
      const service = { name: 'test-service' };

      core.register('test', service);
      const retrieved = core.get('test');

      expect(retrieved).toBe(service);
    });

    it('should throw error when getting non-existent service', () => {
      const core = CoreService.getInstance();
      expect(() => core.get('non-existent')).toThrow('Service not found: non-existent');
    });

    it('should return null when tryGet is used for non-existent service', () => {
      const core = CoreService.getInstance();
      const result = core.tryGet('non-existent');
      expect(result).toBeNull();
    });

    it('should return service when tryGet is used for existing service', () => {
      const core = CoreService.getInstance();
      const service = { name: 'test-service' };
      core.register('test', service);

      const result = core.tryGet('test');
      expect(result).toBe(service);
    });

    it('should return true for has() if service is registered', () => {
      const core = CoreService.getInstance();
      core.register('test', {});
      expect(core.has('test')).toBe(true);
    });

    it('should return false for has() if service is not registered', () => {
      const core = CoreService.getInstance();
      expect(core.has('test')).toBe(false);
    });

    it('should return list of registered services', () => {
      const core = CoreService.getInstance();
      core.register('service1', {});
      core.register('service2', {});

      const services = core.getRegisteredServices();
      expect(services).toContain('service1');
      expect(services).toContain('service2');
      expect(services.length).toBe(2);
    });

    it('should overwrite service when registering with same key', () => {
      const core = CoreService.getInstance();
      const service1 = { name: 'first' };
      const service2 = { name: 'second' };

      core.register('test', service1);
      core.register('test', service2);

      expect(core.get('test')).toBe(service2);
    });

    it('should handle registering null value', () => {
      const core = CoreService.getInstance();
      core.register('nullService', null);

      expect(core.has('nullService')).toBe(true);
      expect(core.get('nullService')).toBeNull();
    });

    it('should handle registering undefined value', () => {
      const core = CoreService.getInstance();
      core.register('undefinedService', undefined);

      expect(core.has('undefinedService')).toBe(true);
      expect(core.get('undefinedService')).toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    it('should call destroy on services if available', () => {
      const core = CoreService.getInstance();
      const destroyMock = vi.fn();
      const service = { destroy: destroyMock };
      core.register('test', service);

      core.cleanup();

      expect(destroyMock).toHaveBeenCalled();
      expect(core.has('test')).toBe(false);
    });

    it('should clear all services', () => {
      const core = CoreService.getInstance();
      core.register('test', {});
      core.cleanup();
      expect(core.has('test')).toBe(false);
    });

    it('should handle cleanup errors', () => {
      const core = CoreService.getInstance();
      const error = new Error('Cleanup failed');
      const service = {
        destroy: () => {
          throw error;
        },
      };

      core.register('test', service);
      core.cleanup(); // Should not throw

      expect(logger.error).toHaveBeenCalledWith('Service cleanup failed', error);
    });

    it('should not treat functions as disposable services', () => {
      const core = CoreService.getInstance();
      const fn = () => 123;
      // store as a value that is a function (typeof value === 'function')
      core.register('fnService', fn as unknown as object);

      expect(() => core.cleanup()).not.toThrow();
      expect(core.has('fnService')).toBe(false);
    });

    it('should call destroy when destroy is provided via getter on prototype', () => {
      const core = CoreService.getInstance();
      const destroySpy = vi.fn();
      const proto = { get destroy() { return destroySpy; } } as any;
      const obj = Object.create(proto);
      core.register('getterDestroy', obj as any);
      core.cleanup();
      expect(destroySpy).toHaveBeenCalled();
      expect(core.has('getterDestroy')).toBe(false);
    });

    it('should not call destroy on non-disposable services', () => {
      const core = CoreService.getInstance();
      const service = { name: 'non-disposable' };

      core.register('test', service);
      core.cleanup(); // Should not throw

      expect(core.has('test')).toBe(false);
    });

    it('should not log error when non-disposable service present during cleanup', () => {
      const core = CoreService.getInstance();
      const service = { name: 'safe-service' };
      core.register('test-2', service);
      core.cleanup();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle services with destroy property that is not a function', () => {
      const core = CoreService.getInstance();
      const service = { destroy: 'not a function' };

      core.register('test', service);
      core.cleanup(); // Should not throw

      expect(core.has('test')).toBe(false);
    });

    it('should call destroy for services that have destroy on prototype', () => {
      const core = CoreService.getInstance();
      const protoDestroy = vi.fn();
      const proto = { destroy: protoDestroy };
      const obj = Object.create(proto);
      core.register('protoService', obj as any);

      core.cleanup();

      expect(protoDestroy).toHaveBeenCalled();
      expect(core.has('protoService')).toBe(false);
    });

    it('should cleanup multiple disposable services', () => {
      const core = CoreService.getInstance();
      const destroy1 = vi.fn();
      const destroy2 = vi.fn();

      core.register('service1', { destroy: destroy1 });
      core.register('service2', { destroy: destroy2 });

      core.cleanup();

      expect(destroy1).toHaveBeenCalled();
      expect(destroy2).toHaveBeenCalled();
    });

    it('should continue cleanup even if one service throws', () => {
      const core = CoreService.getInstance();
      const destroy1 = vi.fn(() => {
        throw new Error('First cleanup failed');
      });
      const destroy2 = vi.fn();

      core.register('service1', { destroy: destroy1 });
      core.register('service2', { destroy: destroy2 });

      core.cleanup();

      expect(destroy1).toHaveBeenCalled();
      expect(destroy2).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('should call cleanup when reset is called', () => {
      const core = CoreService.getInstance();
      const destroyMock = vi.fn();
      const service = { destroy: destroyMock };

      core.register('test', service);
      core.reset();

      expect(destroyMock).toHaveBeenCalled();
      expect(core.has('test')).toBe(false);
    });

    it('should handle reset when no services registered', () => {
      const core = CoreService.getInstance();
      expect(() => core.reset()).not.toThrow();
    });
  });

  describe('Static Reset', () => {
    it('should reset instance and set to null', () => {
      const instance1 = CoreService.getInstance();
      instance1.register('test', {});

      CoreService.resetInstance();

      const instance2 = CoreService.getInstance();
      expect(instance2.has('test')).toBe(false);
    });

    it('should handle resetInstance when no instance exists', () => {
      CoreService.resetInstance(); // First reset
      expect(() => CoreService.resetInstance()).not.toThrow(); // Second reset should not throw
    });
  });

  describe('Type Safety', () => {
    it('should preserve service types', () => {
      const core = CoreService.getInstance();

      interface TestService {
        value: number;
        method: () => string;
      }

      const service: TestService = {
        value: 42,
        method: () => 'hello',
      };

      core.register<TestService>('typed', service);
      const retrieved = core.get<TestService>('typed');

      expect(retrieved.value).toBe(42);
      expect(retrieved.method()).toBe('hello');
    });
  });
});

describe('serviceManager export', () => {
  beforeEach(() => {
    CoreService.resetInstance();
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  it('should be an instance of CoreService', () => {
    // serviceManager is exported as CoreService.getInstance()
    // After reset, we need to get a fresh instance
    const freshServiceManager = CoreService.getInstance();
    expect(freshServiceManager).toBeDefined();
    expect(typeof freshServiceManager.register).toBe('function');
    expect(typeof freshServiceManager.get).toBe('function');
    expect(typeof freshServiceManager.tryGet).toBe('function');
    expect(typeof freshServiceManager.has).toBe('function');
    expect(typeof freshServiceManager.cleanup).toBe('function');
  });
});
