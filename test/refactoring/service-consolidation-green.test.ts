/**
 * @fileoverview GREEN 단계: 통합 서비스 기능 검증 테스트
 * @description 통합된 서비스들이 제대로 동작하는지 확인하는 테스트
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  UnifiedTimerService,
  UnifiedResourceService,
  UnifiedServiceManager,
  unifiedTimerService,
  unifiedResourceService,
  unifiedServiceManager,
  TimerService,
  ResourceService,
  ServiceManager,
  type IUnifiedTimerService,
  type IUnifiedResourceService,
  type IUnifiedServiceManager,
} from '@shared/services/unified-services';

describe('🟢 TDD Phase 2: 서비스 클래스 통합 - GREEN 단계', () => {
  describe('UnifiedTimerService 기능 검증', () => {
    let timerService: UnifiedTimerService;

    beforeEach(() => {
      timerService = new UnifiedTimerService();
    });

    afterEach(() => {
      timerService.clearAllTimers();
    });

    test('should implement all timer APIs consistently', () => {
      // 인터페이스 호환성 검증
      const service: IUnifiedTimerService = timerService;
      expect(service).toBeDefined();

      // 모든 API 메서드가 존재하는지 확인
      expect(typeof service.setTimeout).toBe('function');
      expect(typeof service.clearTimeout).toBe('function');
      expect(typeof service.createTimer).toBe('function');
      expect(typeof service.set).toBe('function');
      expect(typeof service.clear).toBe('function');
      expect(typeof service.clearAllTimers).toBe('function');
      expect(typeof service.getActiveTimerCount).toBe('function');
      expect(typeof service.hasTimer).toBe('function');
    });

    test('should work with key-based API (Services TimerService 호환)', ctx => {
      return new Promise<void>(resolve => {
        let callbackExecuted = false;

        timerService.setTimeout(
          'test-key',
          () => {
            callbackExecuted = true;
            expect(callbackExecuted).toBe(true);
            expect(timerService.hasTimer('test-key')).toBe(false); // 실행 후 자동 제거
            resolve();
          },
          10
        );

        expect(timerService.hasTimer('test-key')).toBe(true);
        expect(timerService.getActiveTimerCount()).toBe(1);

        // 타임아웃을 설정해서 테스트가 너무 오래 걸리지 않도록 함
        ctx.timeout = 100;
      });
    });

    test('should work with handle-based API (Unified TimerService 호환)', ctx => {
      return new Promise<void>(resolve => {
        let callbackExecuted = false;

        const handle = timerService.createTimer(() => {
          callbackExecuted = true;
          expect(callbackExecuted).toBe(true);
          resolve();
        }, 10);

        expect(handle.id).toMatch(/^auto_\d+$/);
        expect(typeof handle.cancel).toBe('function');

        ctx.timeout = 100;
      });
    });

    test('should work with simple API (Performance TimerService 호환)', ctx => {
      return new Promise<void>(resolve => {
        let callbackExecuted = false;

        timerService.set(
          'simple-test',
          () => {
            callbackExecuted = true;
            expect(callbackExecuted).toBe(true);
            resolve();
          },
          10
        );

        expect(timerService.hasTimer('simple-test')).toBe(true);

        ctx.timeout = 100;
      });
    });

    test('should manage timers correctly', () => {
      const mockCallback = () => {};

      // 타이머 추가
      timerService.setTimeout('timer1', mockCallback, 1000);
      timerService.set('timer2', mockCallback, 1000);
      timerService.createTimer(mockCallback, 1000);

      expect(timerService.getActiveTimerCount()).toBe(3);
      expect(timerService.hasTimer('timer1')).toBe(true);
      expect(timerService.hasTimer('timer2')).toBe(true);

      // 개별 제거
      timerService.clearTimeout('timer1');
      expect(timerService.getActiveTimerCount()).toBe(2);
      expect(timerService.hasTimer('timer1')).toBe(false);

      timerService.clear('timer2');
      expect(timerService.getActiveTimerCount()).toBe(1);

      // 전체 제거
      timerService.clearAllTimers();
      expect(timerService.getActiveTimerCount()).toBe(0);
    });
  });

  describe('UnifiedResourceService 기능 검증', () => {
    let resourceService: UnifiedResourceService;

    beforeEach(() => {
      resourceService = new UnifiedResourceService();
    });

    afterEach(() => {
      resourceService.releaseAll();
    });

    test('should implement all resource APIs consistently', () => {
      // 인터페이스 호환성 검증
      const service: IUnifiedResourceService = resourceService;
      expect(service).toBeDefined();

      // 모든 API 메서드가 존재하는지 확인
      expect(typeof service.register).toBe('function');
      expect(typeof service.release).toBe('function');
      expect(typeof service.registerSimple).toBe('function');
      expect(typeof service.releaseSimple).toBe('function');
      expect(typeof service.releaseAll).toBe('function');
      expect(typeof service.getResourceCount).toBe('function');
      expect(typeof service.hasResource).toBe('function');
      expect(typeof service.getAllResourceIds).toBe('function');
    });

    test('should work with key-based API (Unified ResourceService 호환)', () => {
      let cleanupExecuted = false;
      const cleanup = () => {
        cleanupExecuted = true;
      };

      resourceService.register('test-resource', cleanup);

      expect(resourceService.hasResource('test-resource')).toBe(true);
      expect(resourceService.getResourceCount()).toBe(1);
      expect(resourceService.getAllResourceIds()).toContain('test-resource');

      const released = resourceService.release('test-resource');
      expect(released).toBe(true);
      expect(cleanupExecuted).toBe(true);
      expect(resourceService.hasResource('test-resource')).toBe(false);
    });

    test('should work with simple API (Performance ResourceService 호환)', () => {
      let cleanupExecuted = false;
      const cleanup = () => {
        cleanupExecuted = true;
      };

      const resourceId = resourceService.registerSimple(cleanup);
      expect(resourceId).toMatch(/^simple_\d+$/);
      expect(resourceService.hasResource(resourceId)).toBe(true);
      expect(resourceService.getResourceCount()).toBe(1);

      resourceService.releaseSimple(cleanup);
      expect(cleanupExecuted).toBe(false); // releaseSimple은 cleanup을 실행하지 않음 (참조만 제거)
      expect(resourceService.hasResource(resourceId)).toBe(false);
    });

    test('should handle resource cleanup properly', () => {
      let cleanup1Executed = false;
      let cleanup2Executed = false;
      const cleanup1 = () => {
        cleanup1Executed = true;
      };
      const cleanup2 = () => {
        cleanup2Executed = true;
      };

      resourceService.register('resource1', cleanup1);
      resourceService.register('resource2', cleanup2);

      expect(resourceService.getResourceCount()).toBe(2);

      resourceService.releaseAll();
      expect(cleanup1Executed).toBe(true);
      expect(cleanup2Executed).toBe(true);
      expect(resourceService.getResourceCount()).toBe(0);
    });
  });

  describe('UnifiedServiceManager 기능 검증', () => {
    let serviceManager: UnifiedServiceManager;

    beforeEach(() => {
      // 새로운 인스턴스로 초기화
      UnifiedServiceManager.resetInstance();
      serviceManager = UnifiedServiceManager.getInstance();
    });

    afterEach(() => {
      serviceManager.reset();
    });

    test('should implement simplified service management API', () => {
      // 인터페이스 호환성 검증
      const service: IUnifiedServiceManager = serviceManager;
      expect(service).toBeDefined();

      // 모든 API 메서드가 존재하는지 확인
      expect(typeof service.register).toBe('function');
      expect(typeof service.get).toBe('function');
      expect(typeof service.has).toBe('function');
      expect(typeof service.getRegisteredServices).toBe('function');
      expect(typeof service.cleanup).toBe('function');
      expect(typeof service.reset).toBe('function');
    });

    test('should manage services correctly', () => {
      const testService = { value: 42 };

      // 서비스 등록
      serviceManager.register('test-service', testService);
      expect(serviceManager.has('test-service')).toBe(true);
      expect(serviceManager.getRegisteredServices()).toContain('test-service');

      // 서비스 조회
      const retrieved = serviceManager.get<typeof testService>('test-service');
      expect(retrieved).toBe(testService);
      expect(retrieved.value).toBe(42);
    });

    test('should handle service not found', () => {
      expect(() => {
        serviceManager.get('non-existent');
      }).toThrow('서비스를 찾을 수 없습니다: non-existent');
    });

    test('should prevent duplicate registration', () => {
      const service1 = { id: 1 };
      const service2 = { id: 2 };

      serviceManager.register('duplicate-test', service1);
      serviceManager.register('duplicate-test', service2); // 이건 무시됨

      const retrieved = serviceManager.get<typeof service1>('duplicate-test');
      expect(retrieved.id).toBe(1); // 첫 번째가 유지됨
    });

    test('should work as singleton', () => {
      const instance1 = UnifiedServiceManager.getInstance();
      const instance2 = UnifiedServiceManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(serviceManager);
    });
  });

  describe('Backward Compatibility 검증', () => {
    test('should export unified services as legacy aliases', () => {
      // 싱글톤 인스턴스들이 올바르게 export됨
      expect(unifiedTimerService).toBeInstanceOf(UnifiedTimerService);
      expect(unifiedResourceService).toBeInstanceOf(UnifiedResourceService);
      expect(unifiedServiceManager).toBeInstanceOf(UnifiedServiceManager);

      // 별칭들이 같은 인스턴스를 가리킴
      expect(TimerService).toBe(unifiedTimerService);
      expect(ResourceService).toBe(unifiedResourceService);
      expect(ServiceManager).toBe(unifiedServiceManager);
    });

    test('should maintain API compatibility across all service types', () => {
      // TimerService API 호환성
      const timer: IUnifiedTimerService = TimerService;
      expect(typeof timer.setTimeout).toBe('function');
      expect(typeof timer.createTimer).toBe('function');
      expect(typeof timer.set).toBe('function');

      // ResourceService API 호환성
      const resource: IUnifiedResourceService = ResourceService;
      expect(typeof resource.register).toBe('function');
      expect(typeof resource.registerSimple).toBe('function');

      // ServiceManager API 호환성
      const service: IUnifiedServiceManager = ServiceManager;
      expect(typeof service.register).toBe('function');
      expect(typeof service.get).toBe('function');
    });
  });
});
