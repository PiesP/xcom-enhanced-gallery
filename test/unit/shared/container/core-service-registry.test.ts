/**
 * @fileoverview CoreServiceRegistry tests
 * @description Phase 500: Updated after removing redundant caching layer.
 *              Tests now verify the simplified facade behavior.
 */
import { CoreServiceRegistry, registerService, getService, tryGetService } from '@shared/container/core-service-registry';
import { CoreService } from '@shared/services/service-manager';

describe('CoreServiceRegistry behavior', () => {
  beforeEach(() => {
    // Reset the singleton CoreService so each test can operate cleanly
    CoreService.resetInstance();
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  it('should register services and allow retrieval via get', () => {
    const key = 'test-service-get';
    const instance = { value: 'hello' } as const;
    registerService(key, instance);
    const result = getService<typeof instance>(key);
    expect(result).toBe(instance);
  });

  it('should return null from tryGet when not registered', () => {
    const key = 'not-registered';
    const res = tryGetService(key);
    expect(res).toBeNull();
  });

  it('should return the instance from tryGet when registered', () => {
    const key = 'test-try-get';
    const instance = { ok: true } as const;
    registerService(key, instance);
    const res = tryGetService<typeof instance>(key);
    expect(res).toBe(instance);
  });

  it('should return registered services list', () => {
    registerService('one', { a: 1 } as const);
    registerService('two', { b: 2 } as const);
    const services = CoreServiceRegistry.getRegisteredServices();
    expect(services).toContain('one');
    expect(services).toContain('two');
  });

  it('should check if service exists via has()', () => {
    const key = 'has-test';
    expect(CoreServiceRegistry.has(key)).toBe(false);
    registerService(key, { value: 1 });
    expect(CoreServiceRegistry.has(key)).toBe(true);
  });

  it('get should throw when service not registered', () => {
    expect(() => CoreServiceRegistry.get('does-not-exist')).toThrow();
  });
});
