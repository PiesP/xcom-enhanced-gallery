/**
 * @fileoverview CoreServiceRegistry tests with mocked CoreService
 * @description Phase 500: Updated after removing redundant caching layer.
 *              Tests now verify direct pass-through to CoreService.
 */
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { CoreService } from '@shared/services/service-manager';

vi.mock('@shared/services/service-manager', () => {
  const mockCoreService = {
    register: vi.fn(),
    get: vi.fn(),
    tryGet: vi.fn(),
    has: vi.fn(),
    getRegisteredServices: vi.fn(),
  };
  return {
    CoreService: {
      getInstance: vi.fn(() => mockCoreService),
    },
  };
});

describe('CoreServiceRegistry (mocked CoreService)', () => {
  const mockCoreService = CoreService.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate register to CoreService', () => {
    const key = 'test-service';
    const instance = { foo: 'bar' };

    CoreServiceRegistry.register(key, instance);

    expect(mockCoreService.register).toHaveBeenCalledWith(key, instance);
  });

  it('should delegate get to CoreService', () => {
    const key = 'test-service';
    const instance = { foo: 'bar' };
    vi.mocked(mockCoreService.get).mockReturnValue(instance);

    const retrieved = CoreServiceRegistry.get(key);

    expect(mockCoreService.get).toHaveBeenCalledWith(key);
    expect(retrieved).toBe(instance);
  });

  it('should always call CoreService.get (no caching)', () => {
    const key = 'test-service';
    const instance = { foo: 'bar' };
    vi.mocked(mockCoreService.get).mockReturnValue(instance);

    CoreServiceRegistry.get(key); // First call
    CoreServiceRegistry.get(key); // Second call

    // Both calls should hit CoreService.get
    expect(mockCoreService.get).toHaveBeenCalledTimes(2);
  });

  it('should delegate tryGet to CoreService', () => {
    const key = 'test-service';
    const instance = { foo: 'bar' };
    vi.mocked(mockCoreService.tryGet).mockReturnValue(instance);

    const retrieved = CoreServiceRegistry.tryGet(key);

    expect(mockCoreService.tryGet).toHaveBeenCalledWith(key);
    expect(retrieved).toBe(instance);
  });

  it('should return null from tryGet when service does not exist', () => {
    const key = 'nonexistent-service';
    vi.mocked(mockCoreService.tryGet).mockReturnValue(null);

    const retrieved = CoreServiceRegistry.tryGet(key);

    expect(mockCoreService.tryGet).toHaveBeenCalledWith(key);
    expect(retrieved).toBeNull();
  });

  it('should delegate has to CoreService', () => {
    const key = 'test-service';
    vi.mocked(mockCoreService.has).mockReturnValue(true);

    const result = CoreServiceRegistry.has(key);

    expect(mockCoreService.has).toHaveBeenCalledWith(key);
    expect(result).toBe(true);
  });

  it('should delegate getRegisteredServices to CoreService', () => {
    const services = ['service1', 'service2'];
    vi.mocked(mockCoreService.getRegisteredServices).mockReturnValue(services);

    const result = CoreServiceRegistry.getRegisteredServices();

    expect(mockCoreService.getRegisteredServices).toHaveBeenCalled();
    expect(result).toBe(services);
  });
});
