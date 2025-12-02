import { TestHarness, createTestHarness } from '@shared/container/harness';
import { CoreService } from '@shared/services/service-manager';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import * as ServiceInitialization from '@shared/services/service-initialization';

// Mock dependencies
vi.mock('@shared/services/service-manager', () => ({
  CoreService: {
    resetInstance: vi.fn(),
  },
}));

vi.mock('@shared/container/core-service-registry', () => ({
  CoreServiceRegistry: {
    register: vi.fn(),
    get: vi.fn(),
    tryGet: vi.fn(),
    clearCache: vi.fn(),
  },
}));

vi.mock('@shared/services/service-initialization', () => ({
  registerCoreServices: vi.fn(),
}));

describe('TestHarness', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = createTestHarness();
    vi.clearAllMocks();
  });

  it('should create a new instance via factory', () => {
    const instance = createTestHarness();
    expect(instance).toBeInstanceOf(TestHarness);
  });

  describe('initCoreServices', () => {
    it('should call registerCoreServices', async () => {
      await harness.initCoreServices();
      expect(ServiceInitialization.registerCoreServices).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should delegate to CoreServiceRegistry.register', () => {
      const key = 'test-key';
      const instance = { foo: 'bar' };
      harness.register(key, instance);
      expect(CoreServiceRegistry.register).toHaveBeenCalledWith(key, instance);
    });
  });

  describe('get', () => {
    it('should delegate to CoreServiceRegistry.get', () => {
      const key = 'test-key';
      const expected = { foo: 'bar' };
      vi.mocked(CoreServiceRegistry.get).mockReturnValue(expected);

      const result = harness.get(key);
      expect(CoreServiceRegistry.get).toHaveBeenCalledWith(key);
      expect(result).toBe(expected);
    });
  });

  describe('tryGet', () => {
    it('should delegate to CoreServiceRegistry.tryGet', () => {
      const key = 'test-key';
      const expected = { foo: 'bar' };
      vi.mocked(CoreServiceRegistry.tryGet).mockReturnValue(expected);

      const result = harness.tryGet(key);
      expect(CoreServiceRegistry.tryGet).toHaveBeenCalledWith(key);
      expect(result).toBe(expected);
    });
  });

  describe('reset', () => {
    it('should reset CoreService instance', () => {
      harness.reset();
      expect(CoreService.resetInstance).toHaveBeenCalled();
    });
  });
});
