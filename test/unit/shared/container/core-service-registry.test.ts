/**
 * @vitest - CoreServiceRegistry 단위 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  CoreServiceRegistry,
  getService,
  tryGetService,
  registerService,
} from '@shared/container/core-service-registry';
import { CoreService } from '@shared/services/core';
import { SERVICE_KEYS } from '@/constants';

const TEST_PRIMARY_KEY = 'test.registry.primary';
const TEST_SECONDARY_KEY = 'test.registry.secondary';

describe('CoreServiceRegistry', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    // 각 테스트 전 캐시 초기화
    CoreServiceRegistry.clearCache();
  });

  describe('register', () => {
    it('should register a service instance', () => {
      const mockService = { name: 'TestService' };
      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);

      // CoreService에 등록되었는지 확인
      const retrieved = CoreService.getInstance().get(TEST_PRIMARY_KEY);
      expect(retrieved).toBe(mockService);
    });

    it('should cache registered service', () => {
      const mockService = { name: 'TestService' };
      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);

      // 캐시에 저장되었는지 확인
      const cacheKeys = CoreServiceRegistry.getCacheKeys();
      expect(cacheKeys).toContain(TEST_PRIMARY_KEY);
    });
  });

  describe('get', () => {
    it('should retrieve cached service', () => {
      const mockService = { name: 'TestService' };
      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);

      // 캐시에서 조회
      const retrieved = CoreServiceRegistry.get(TEST_PRIMARY_KEY);
      expect(retrieved).toBe(mockService);
    });

    it('should retrieve service from CoreService if not cached', () => {
      const mockService = { name: 'TestService' };
      CoreService.getInstance().register(TEST_PRIMARY_KEY, mockService);

      // 캐시 초기화
      CoreServiceRegistry.clearCache();

      // CoreService에서 조회 후 캐시
      const retrieved = CoreServiceRegistry.get(TEST_PRIMARY_KEY);
      expect(retrieved).toBe(mockService);

      // 이제 캐시에 있어야 함
      const cacheKeys = CoreServiceRegistry.getCacheKeys();
      expect(cacheKeys).toContain(TEST_PRIMARY_KEY);
    });

    it('should maintain type safety', () => {
      interface ITestService {
        test(): string;
      }

      const mockService: ITestService = {
        test: () => 'test',
      };

      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);
      const retrieved = CoreServiceRegistry.get<ITestService>(TEST_PRIMARY_KEY);

      expect(retrieved.test()).toBe('test');
    });

    it('should throw error if service not found', () => {
      expect(() => {
        CoreServiceRegistry.get('NON_EXISTENT_KEY');
      }).toThrow();
    });
  });

  describe('tryGet', () => {
    it('should return cached service', () => {
      const mockService = { name: 'TestService' };
      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);

      const retrieved = CoreServiceRegistry.tryGet(TEST_PRIMARY_KEY);
      expect(retrieved).toBe(mockService);
    });

    it('should return null if service not found', () => {
      const retrieved = CoreServiceRegistry.tryGet('NON_EXISTENT_KEY');
      expect(retrieved).toBeNull();
    });

    it('should return null without throwing', () => {
      expect(() => {
        CoreServiceRegistry.tryGet('NON_EXISTENT_KEY');
      }).not.toThrow();
    });
  });

  describe('caching behavior', () => {
    it('should improve performance with caching', () => {
      // CoreService를 스파이
      const coreServiceInstance = CoreService.getInstance();
      const spy = vi.spyOn(coreServiceInstance, 'get');

      const mockService = { name: 'TestService' };
      coreServiceInstance.register(TEST_PRIMARY_KEY, mockService);

      // 캐시 초기화
      CoreServiceRegistry.clearCache();

      // 첫 번째 조회 (CoreService에서)
      const result1 = CoreServiceRegistry.get(TEST_PRIMARY_KEY);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result1).toBe(mockService);

      // 두 번째 조회 (캐시에서)
      const result2 = CoreServiceRegistry.get(TEST_PRIMARY_KEY);
      expect(spy).toHaveBeenCalledTimes(1); // 여전히 1회 (캐시 사용)
      expect(result2).toBe(mockService);

      spy.mockRestore();
    });

    it('should invalidate cache for specific key', () => {
      const mockService = { name: 'TestService' };
      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);

      let cacheKeys = CoreServiceRegistry.getCacheKeys();
      expect(cacheKeys).toContain(TEST_PRIMARY_KEY);

      CoreServiceRegistry.invalidateCache(TEST_PRIMARY_KEY);

      cacheKeys = CoreServiceRegistry.getCacheKeys();
      expect(cacheKeys).not.toContain(TEST_PRIMARY_KEY);
    });

    it('should clear all cache', () => {
      const service1 = { name: 'Service1' };
      const service2 = { name: 'Service2' };

      CoreServiceRegistry.register(TEST_PRIMARY_KEY, service1);
      CoreServiceRegistry.register(TEST_SECONDARY_KEY, service2);

      let cacheKeys = CoreServiceRegistry.getCacheKeys();
      expect(cacheKeys.length).toBeGreaterThan(0);

      CoreServiceRegistry.clearCache();

      cacheKeys = CoreServiceRegistry.getCacheKeys();
      expect(cacheKeys.length).toBe(0);
    });
  });

  describe('helper functions', () => {
    it('getService should retrieve service', () => {
      const mockService = { name: 'TestService' };
      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);

      const retrieved = getService(TEST_PRIMARY_KEY);
      expect(retrieved).toBe(mockService);
    });

    it('tryGetService should safely retrieve service', () => {
      const mockService = { name: 'TestService' };
      CoreServiceRegistry.register(TEST_PRIMARY_KEY, mockService);

      const retrieved = tryGetService(TEST_PRIMARY_KEY);
      expect(retrieved).toBe(mockService);

      const notFound = tryGetService('NON_EXISTENT_KEY');
      expect(notFound).toBeNull();
    });

    it('registerService should register service', () => {
      const mockService = { name: 'TestService' };
      registerService(TEST_PRIMARY_KEY, mockService);

      const retrieved = getService(TEST_PRIMARY_KEY);
      expect(retrieved).toBe(mockService);
    });
  });

  describe('multiple services', () => {
    it('should handle multiple different services', () => {
      const toastService = { type: 'toast' };
      const themeService = { type: 'theme' };
      const mediaService = { type: 'media' };

      CoreServiceRegistry.register(TEST_PRIMARY_KEY, toastService);
      CoreServiceRegistry.register(SERVICE_KEYS.THEME, themeService);
      CoreServiceRegistry.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);

      expect(CoreServiceRegistry.get(TEST_PRIMARY_KEY)).toBe(toastService);
      expect(CoreServiceRegistry.get(SERVICE_KEYS.THEME)).toBe(themeService);
      expect(CoreServiceRegistry.get(SERVICE_KEYS.MEDIA_SERVICE)).toBe(mediaService);
    });

    it('should cache multiple services independently', () => {
      const service1 = { id: '1' };
      const service2 = { id: '2' };

      CoreServiceRegistry.register(TEST_PRIMARY_KEY, service1);
      CoreServiceRegistry.register(TEST_SECONDARY_KEY, service2);

      const cacheKeys = CoreServiceRegistry.getCacheKeys();
      expect(cacheKeys).toHaveLength(2);
      expect(cacheKeys).toContain(TEST_PRIMARY_KEY);
      expect(cacheKeys).toContain(TEST_SECONDARY_KEY);
    });
  });

  describe('type safety', () => {
    it('should preserve type information', () => {
      interface ICustomService {
        getValue(): number;
        setValue(value: number): void;
      }

      const mockService: ICustomService = {
        getValue: () => 42,
        setValue: (value: number) => {
          // Mock implementation
        },
      };

      CoreServiceRegistry.register<ICustomService>(TEST_PRIMARY_KEY, mockService);
      const retrieved = CoreServiceRegistry.get<ICustomService>(TEST_PRIMARY_KEY);

      expect(retrieved.getValue()).toBe(42);
    });
  });
});
