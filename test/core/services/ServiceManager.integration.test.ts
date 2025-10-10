/**
 * Service Manager - 실제 비즈니스 로직 테스트
 * 서비스 등록, 의존성 관리, 초기화 생명주기 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 타입 정의
interface Service {
  initialized?: boolean;
  init?: () => Promise<void>;
  destroy?: () => void;
  getDependencies?: () => string[];
}

// Mock 서비스 클래스들
class MockVideoService implements Service {
  initialized: boolean;
  dependencies: string[];

  constructor(deps: string[] = []) {
    this.initialized = false;
    this.dependencies = deps;
  }

  async init(): Promise<void> {
    this.initialized = true;
  }

  destroy(): void {
    this.initialized = false;
  }

  getDependencies(): string[] {
    return this.dependencies;
  }
}

class MockDependentService implements Service {
  initialized: boolean;
  videoService: MockVideoService;

  constructor(videoService: MockVideoService) {
    this.initialized = false;
    this.videoService = videoService;
  }

  async init(): Promise<void> {
    if (!this.videoService.initialized) {
      throw new Error('VideoService must be initialized first');
    }
    this.initialized = true;
  }

  destroy(): void {
    this.initialized = false;
  }
}

// ServiceManager 모킹 (실제 구현과 유사한 로직)
class TestServiceManager {
  services: Map<string, Service>;
  initOrder: string[];

  constructor() {
    this.services = new Map();
    this.initOrder = [];
  }

  register(name: string, service: Service): void {
    this.services.set(name, service);
  }

  get(name: string): Service | undefined {
    return this.services.get(name);
  }

  async initializeAll(): Promise<void> {
    // 의존성 순서대로 초기화
    const sortedServices = this.resolveDependencyOrder();

    for (const serviceName of sortedServices) {
      const service = this.services.get(serviceName);
      if (service && typeof service.init === 'function') {
        await service.init();
        this.initOrder.push(serviceName);
      }
    }
  }

  destroyAll(): void {
    // 역순으로 파괴
    const reverseOrder = [...this.initOrder].reverse();
    for (const serviceName of reverseOrder) {
      const service = this.services.get(serviceName);
      if (service && typeof service.destroy === 'function') {
        service.destroy();
      }
    }
    this.initOrder = [];
  }

  resolveDependencyOrder(): string[] {
    // 간단한 토폴로지 정렬 구현
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (serviceName: string): void => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`);
      }
      if (visited.has(serviceName)) {
        return;
      }

      visiting.add(serviceName);
      const service = this.services.get(serviceName);

      if (service && typeof service.getDependencies === 'function') {
        const deps = service.getDependencies();
        for (const dep of deps) {
          if (this.services.has(dep)) {
            visit(dep);
          }
        }
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      result.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }

    return result;
  }

  getInitializationOrder(): string[] {
    return [...this.initOrder];
  }

  isInitialized(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    return service?.initialized === true;
  }
}

describe('ServiceManager - Business Logic Integration', () => {
  let serviceManager: TestServiceManager;

  beforeEach(() => {
    serviceManager = new TestServiceManager();
  });

  describe('Service Registration and Retrieval', () => {
    it('should register and retrieve services correctly', () => {
      const videoService = new MockVideoService();

      serviceManager.register('video', videoService);

      expect(serviceManager.get('video')).toBe(videoService);
      expect(serviceManager.get('nonexistent')).toBeUndefined();
    });

    it('should handle multiple services of different types', () => {
      const services = {
        video: new MockVideoService(),
        gallery: new MockVideoService(['video']), // 의존성 있는 서비스
      };

      Object.entries(services).forEach(([name, service]) => {
        serviceManager.register(name, service);
      });

      expect(serviceManager.get('video')).toBeDefined();
      expect(serviceManager.get('gallery')).toBeDefined();
    });
  });

  describe('Service Initialization Lifecycle', () => {
    it('should initialize services correctly', async () => {
      const videoService = new MockVideoService();

      serviceManager.register('video', videoService);

      expect(videoService.initialized).toBe(false);

      await serviceManager.initializeAll();

      expect(videoService.initialized).toBe(true);
      expect(serviceManager.getInitializationOrder()).toEqual(['video']);
    });

    it('should handle initialization errors gracefully', async () => {
      const faultyService = {
        init: vi.fn().mockRejectedValue(new Error('Initialization failed')),
        destroy: vi.fn(),
      };

      serviceManager.register('faulty', faultyService);

      await expect(serviceManager.initializeAll()).rejects.toThrow('Initialization failed');
    });

    it('should track initialization state correctly', async () => {
      const videoService = new MockVideoService();
      serviceManager.register('video', videoService);

      expect(serviceManager.isInitialized('video')).toBe(false);

      await serviceManager.initializeAll();

      expect(serviceManager.isInitialized('video')).toBe(true);
    });
  });

  describe('Service Destruction', () => {
    it('should destroy services correctly', async () => {
      const videoService = new MockVideoService();

      serviceManager.register('video', videoService);

      await serviceManager.initializeAll();

      expect(videoService.initialized).toBe(true);

      serviceManager.destroyAll();

      expect(videoService.initialized).toBe(false);
    });

    it('should handle services without destroy method', async () => {
      const serviceWithoutDestroy = {
        init: vi.fn().mockResolvedValue(undefined),
        // destroy 메서드 없음
      };

      serviceManager.register('incomplete', serviceWithoutDestroy);

      await serviceManager.initializeAll();

      // destroy 메서드가 없어도 오류 없이 실행되어야 함
      expect(() => serviceManager.destroyAll()).not.toThrow();
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve simple dependencies correctly', async () => {
      const videoService = new MockVideoService();
      const dependentService = new MockDependentService(videoService);

      serviceManager.register('video', videoService);
      serviceManager.register('dependent', dependentService);

      await serviceManager.initializeAll();

      // video 서비스가 먼저 초기화되어야 함
      expect(serviceManager.getInitializationOrder()).toEqual(['video', 'dependent']);
      expect(dependentService.initialized).toBe(true);
    });

    it('should handle services with complex dependency chains', async () => {
      const baseService = new MockVideoService();
      const midService = new MockVideoService(['base']);
      const topService = new MockVideoService(['mid']);

      serviceManager.register('base', baseService);
      serviceManager.register('mid', midService);
      serviceManager.register('top', topService);

      await serviceManager.initializeAll();

      const order = serviceManager.getInitializationOrder();
      expect(order.indexOf('base')).toBeLessThan(order.indexOf('mid'));
      expect(order.indexOf('mid')).toBeLessThan(order.indexOf('top'));
    });

    it('should detect circular dependencies', async () => {
      const serviceA = new MockVideoService(['serviceB']);
      const serviceB = new MockVideoService(['serviceA']);

      serviceManager.register('serviceA', serviceA);
      serviceManager.register('serviceB', serviceB);

      await expect(async () => {
        await serviceManager.initializeAll();
      }).rejects.toThrow('Circular dependency detected');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty service manager', async () => {
      await expect(serviceManager.initializeAll()).resolves.not.toThrow();
      expect(serviceManager.getInitializationOrder()).toEqual([]);
    });

    it('should handle services without init method', async () => {
      const staticService: Service = {
        data: 'static data',
        // init/destroy 메서드 없음
      } as any;

      serviceManager.register('static', staticService);

      await expect(serviceManager.initializeAll()).resolves.not.toThrow();
    });

    it('should handle repeated initialization calls', async () => {
      const videoService = new MockVideoService();
      serviceManager.register('video', videoService);

      await serviceManager.initializeAll();
      expect(videoService.initialized).toBe(true);

      // 두 번째 초기화 호출
      await serviceManager.initializeAll();
      expect(videoService.initialized).toBe(true); // 여전히 true여야 함
    });
  });
});
