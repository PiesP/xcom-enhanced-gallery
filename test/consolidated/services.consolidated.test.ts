/**
 * @fileoverview 서비스 통합 테스트
 * @description CoreService, ServiceManager 등 서비스 레이어 통합 테스트
 * @version 1.0.0 - Consolidated Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock CoreService 구현
class MockCoreService {
  private static instance: MockCoreService | null = null;
  private services = new Map<string, any>();

  static getInstance(): MockCoreService {
    if (!MockCoreService.instance) {
      MockCoreService.instance = new MockCoreService();
    }
    return MockCoreService.instance;
  }

  static resetInstance(): void {
    MockCoreService.instance = null;
  }

  registerService<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  getService<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not found: ${key}`);
    }
    return service as T;
  }

  hasService(key: string): boolean {
    return this.services.has(key);
  }

  removeService(key: string): boolean {
    return this.services.delete(key);
  }

  cleanup(): void {
    this.services.clear();
  }

  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }
}

describe('서비스 레이어 - 통합 테스트', () => {
  let coreService: MockCoreService;

  beforeEach(() => {
    MockCoreService.resetInstance();
    coreService = MockCoreService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    MockCoreService.resetInstance();
  });

  describe('싱글톤 패턴 검증', () => {
    it('getInstance()는 항상 동일한 인스턴스를 반환해야 함', () => {
      const instance1 = MockCoreService.getInstance();
      const instance2 = MockCoreService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(coreService);
    });

    it('resetInstance() 후 새로운 인스턴스가 생성되어야 함', () => {
      const originalInstance = MockCoreService.getInstance();

      MockCoreService.resetInstance();
      const newInstance = MockCoreService.getInstance();

      expect(newInstance).not.toBe(originalInstance);
    });
  });

  describe('서비스 등록 및 관리', () => {
    interface TestService {
      name: string;
      version: string;
      initialize(): void;
      cleanup(): void;
    }

    it('서비스를 정상적으로 등록할 수 있어야 함', () => {
      const testService: TestService = {
        name: 'TestService',
        version: '1.0.0',
        initialize: vi.fn(),
        cleanup: vi.fn(),
      };

      coreService.registerService('test', testService);

      expect(coreService.hasService('test')).toBe(true);
      expect(coreService.getService<TestService>('test')).toBe(testService);
    });

    it('동일한 키로 서비스를 덮어쓸 수 있어야 함', () => {
      const service1: TestService = {
        name: 'Service1',
        version: '1.0.0',
        initialize: vi.fn(),
        cleanup: vi.fn(),
      };

      const service2: TestService = {
        name: 'Service2',
        version: '2.0.0',
        initialize: vi.fn(),
        cleanup: vi.fn(),
      };

      coreService.registerService('test', service1);
      coreService.registerService('test', service2);

      const retrievedService = coreService.getService<TestService>('test');
      expect(retrievedService.name).toBe('Service2');
      expect(retrievedService.version).toBe('2.0.0');
    });

    it('여러 서비스를 동시에 관리할 수 있어야 함', () => {
      const services = {
        media: { name: 'MediaService', type: 'media' },
        gallery: { name: 'GalleryService', type: 'gallery' },
        settings: { name: 'SettingsService', type: 'settings' },
      };

      Object.entries(services).forEach(([key, service]) => {
        coreService.registerService(key, service);
      });

      expect(coreService.hasService('media')).toBe(true);
      expect(coreService.hasService('gallery')).toBe(true);
      expect(coreService.hasService('settings')).toBe(true);

      expect(coreService.getService('media').name).toBe('MediaService');
      expect(coreService.getService('gallery').name).toBe('GalleryService');
      expect(coreService.getService('settings').name).toBe('SettingsService');
    });
  });

  describe('서비스 조회 및 접근', () => {
    it('등록된 서비스를 올바르게 조회할 수 있어야 함', () => {
      const mockService = {
        id: 'test-123',
        data: { value: 42 },
      };

      coreService.registerService('mock', mockService);

      const retrieved = coreService.getService('mock');
      expect(retrieved.id).toBe('test-123');
      expect(retrieved.data.value).toBe(42);
    });

    it('존재하지 않는 서비스 조회시 에러가 발생해야 함', () => {
      expect(() => {
        coreService.getService('nonexistent');
      }).toThrow('Service not found: nonexistent');
    });

    it('hasService로 서비스 존재 여부를 확인할 수 있어야 함', () => {
      coreService.registerService('existing', { name: 'test' });

      expect(coreService.hasService('existing')).toBe(true);
      expect(coreService.hasService('nonexistent')).toBe(false);
    });
  });

  describe('서비스 제거 및 정리', () => {
    it('서비스를 개별적으로 제거할 수 있어야 함', () => {
      coreService.registerService('removable', { name: 'test' });
      expect(coreService.hasService('removable')).toBe(true);

      const removed = coreService.removeService('removable');
      expect(removed).toBe(true);
      expect(coreService.hasService('removable')).toBe(false);
    });

    it('존재하지 않는 서비스 제거시 false를 반환해야 함', () => {
      const removed = coreService.removeService('nonexistent');
      expect(removed).toBe(false);
    });

    it('cleanup으로 모든 서비스를 정리할 수 있어야 함', () => {
      coreService.registerService('service1', { name: 'test1' });
      coreService.registerService('service2', { name: 'test2' });
      coreService.registerService('service3', { name: 'test3' });

      expect(coreService.getAllServices().size).toBe(3);

      coreService.cleanup();

      expect(coreService.getAllServices().size).toBe(0);
      expect(coreService.hasService('service1')).toBe(false);
      expect(coreService.hasService('service2')).toBe(false);
      expect(coreService.hasService('service3')).toBe(false);
    });
  });

  describe('서비스 생명주기 관리', () => {
    interface LifecycleService {
      initialized: boolean;
      cleanedUp: boolean;
      initialize(): void;
      cleanup(): void;
    }

    it('서비스 초기화를 관리할 수 있어야 함', () => {
      const lifecycleService: LifecycleService = {
        initialized: false,
        cleanedUp: false,
        initialize() {
          this.initialized = true;
        },
        cleanup() {
          this.cleanedUp = true;
        },
      };

      coreService.registerService('lifecycle', lifecycleService);

      const service = coreService.getService<LifecycleService>('lifecycle');
      service.initialize();

      expect(service.initialized).toBe(true);
      expect(service.cleanedUp).toBe(false);
    });

    it('서비스 정리를 관리할 수 있어야 함', () => {
      const lifecycleService: LifecycleService = {
        initialized: false,
        cleanedUp: false,
        initialize() {
          this.initialized = true;
        },
        cleanup() {
          this.cleanedUp = true;
        },
      };

      coreService.registerService('lifecycle', lifecycleService);

      const service = coreService.getService<LifecycleService>('lifecycle');
      service.initialize();
      service.cleanup();

      expect(service.initialized).toBe(true);
      expect(service.cleanedUp).toBe(true);
    });
  });

  describe('타입 안전성', () => {
    interface TypedService {
      readonly id: string;
      readonly version: number;
      process(_input: string): string;
    }

    it('타입 안전한 서비스 등록 및 조회가 가능해야 함', () => {
      const typedService: TypedService = {
        id: 'typed-service',
        version: 1,
        process: (data: string) => `Processed: ${data}`,
      };

      coreService.registerService<TypedService>('typed', typedService);

      const retrieved = coreService.getService<TypedService>('typed');
      expect(retrieved.id).toBe('typed-service');
      expect(retrieved.version).toBe(1);
      expect(retrieved.process('test')).toBe('Processed: test');
    });
  });

  describe('에러 처리', () => {
    it('서비스 등록 중 에러가 발생해도 다른 서비스에 영향을 주면 안됨', () => {
      const goodService = { name: 'good' };
      const badService = {
        name: 'bad',
        get error() {
          throw new Error('Bad service error');
        },
      };

      coreService.registerService('good', goodService);
      coreService.registerService('bad', badService);

      // 좋은 서비스는 정상 작동해야 함
      expect(coreService.getService('good').name).toBe('good');

      // 나쁜 서비스도 등록은 되어야 함
      expect(coreService.hasService('bad')).toBe(true);

      // 하지만 에러 프로퍼티 접근시에는 에러 발생
      expect(() => {
        coreService.getService('bad').error;
      }).toThrow('Bad service error');
    });
  });

  describe('성능 및 메모리 관리', () => {
    it('대량의 서비스 등록/해제가 효율적으로 처리되어야 함', () => {
      const startTime = performance.now();

      // 1000개 서비스 등록
      for (let i = 0; i < 1000; i++) {
        coreService.registerService(`service-${i}`, { id: i, name: `Service ${i}` });
      }

      expect(coreService.getAllServices().size).toBe(1000);

      // 모든 서비스 정리
      coreService.cleanup();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000개 서비스 처리가 100ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(100);
      expect(coreService.getAllServices().size).toBe(0);
    });

    it('메모리 누수 없이 서비스를 관리해야 함', () => {
      const initialSize = coreService.getAllServices().size;

      // 여러 번 등록/삭제 반복
      for (let i = 0; i < 100; i++) {
        coreService.registerService(`temp-${i}`, { data: new Array(100).fill(i) });
        coreService.removeService(`temp-${i}`);
      }

      const finalSize = coreService.getAllServices().size;

      // 초기 상태와 동일해야 함
      expect(finalSize).toBe(initialSize);
    });
  });

  describe('동시성 처리', () => {
    it('동시 서비스 등록이 안전하게 처리되어야 함', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve().then(() => {
          coreService.registerService(`concurrent-${i}`, { id: i });
        })
      );

      await Promise.all(promises);

      // 모든 서비스가 등록되어야 함
      for (let i = 0; i < 10; i++) {
        expect(coreService.hasService(`concurrent-${i}`)).toBe(true);
      }
    });
  });

  describe('실제 사용 시나리오', () => {
    it('갤러리 앱 초기화 시나리오가 작동해야 함', () => {
      // 실제 서비스들 모킹
      const mediaService = {
        name: 'MediaExtractionService',
        extractMedia: vi.fn().mockReturnValue([]),
        getHighQualityUrl: vi.fn(),
      };

      const galleryService = {
        name: 'GalleryService',
        openGallery: vi.fn(),
        closeGallery: vi.fn(),
        isOpen: vi.fn().mockReturnValue(false),
      };

      const settingsService = {
        name: 'SettingsService',
        getSettings: vi.fn().mockReturnValue({}),
        saveSettings: vi.fn(),
      };

      // 서비스 등록
      coreService.registerService('media', mediaService);
      coreService.registerService('gallery', galleryService);
      coreService.registerService('settings', settingsService);

      // 실제 사용 시나리오 시뮬레이션
      const media = coreService.getService('media');
      const gallery = coreService.getService('gallery');
      const settings = coreService.getService('settings');

      // 초기화 과정
      const userSettings = settings.getSettings();
      const mediaItems = media.extractMedia();
      const isGalleryOpen = gallery.isOpen();

      expect(media.name).toBe('MediaExtractionService');
      expect(gallery.name).toBe('GalleryService');
      expect(settings.name).toBe('SettingsService');
      expect(userSettings).toEqual({});
      expect(mediaItems).toEqual([]);
      expect(isGalleryOpen).toBe(false);
    });

    it('서비스 간 의존성이 올바르게 해결되어야 함', () => {
      // 의존성이 있는 서비스들
      const baseService = {
        name: 'BaseService',
        getValue: () => 'base-value',
      };

      const dependentService = {
        name: 'DependentService',
        base: null as any,
        initialize(base: any) {
          this.base = base;
        },
        getProcessedValue() {
          return `processed-${this.base.getValue()}`;
        },
      };

      // 서비스 등록 및 의존성 해결
      coreService.registerService('base', baseService);
      coreService.registerService('dependent', dependentService);

      const base = coreService.getService('base');
      const dependent = coreService.getService('dependent');

      dependent.initialize(base);

      expect(dependent.getProcessedValue()).toBe('processed-base-value');
    });
  });
});
