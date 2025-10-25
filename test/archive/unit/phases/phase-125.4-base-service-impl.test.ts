/**
 * @fileoverview Phase 125.4: base-service-impl.ts 테스트
 * @description 목표: 12.9% → 60% (+47.1%p)
 *
 * 테스트 전략:
 * - BaseServiceImpl: 추상 클래스이므로 구체적인 구현체를 만들어 테스트
 * - initialize/destroy 라이프사이클 검증
 * - 에러 핸들링 검증 (초기화 실패, destroy 실패)
 * - 상태 관리 검증 (중복 초기화/destroy 방지)
 *
 * - SingletonServiceImpl: 싱글톤 패턴 검증
 * - 인스턴스 재사용 검증
 * - 테스트용 리셋 기능 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseServiceImpl, SingletonServiceImpl } from '@shared/services/base-service-impl';
import { logger } from '@shared/logging/logger';

// 테스트용 구체적 구현체
class TestService extends BaseServiceImpl {
  public initializeCalled = false;
  public destroyCalled = false;
  public shouldThrowOnInit = false;
  public shouldThrowOnDestroy = false;

  constructor(serviceName = 'TestService') {
    super(serviceName);
  }

  protected onInitialize(): void {
    if (this.shouldThrowOnInit) {
      throw new Error('Initialization failed');
    }
    this.initializeCalled = true;
  }

  protected onDestroy(): void {
    if (this.shouldThrowOnDestroy) {
      throw new Error('Destroy failed');
    }
    this.destroyCalled = true;
  }
}

// 비동기 초기화를 가진 테스트 서비스
class AsyncTestService extends BaseServiceImpl {
  public initializeCalled = false;
  public destroyCalled = false;

  constructor(serviceName = 'AsyncTestService') {
    super(serviceName);
  }

  protected async onInitialize(): Promise<void> {
    // 비동기 초기화 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 10));
    this.initializeCalled = true;
  }

  protected onDestroy(): void {
    this.destroyCalled = true;
  }
}

// 싱글톤 테스트용 구체적 구현체
class TestSingletonService extends SingletonServiceImpl {
  public initializeCalled = false;
  public destroyCalled = false;

  private constructor(serviceName = 'TestSingletonService') {
    super(serviceName);
  }

  static getInstance(): TestSingletonService {
    return this.getSingletonInstance(TestSingletonService, 'TestSingletonService');
  }

  static reset(): void {
    this.resetSingleton('TestSingletonService');
  }

  protected onInitialize(): void {
    this.initializeCalled = true;
  }

  protected onDestroy(): void {
    this.destroyCalled = true;
  }
}

describe('Phase 125.4: base-service-impl.ts', () => {
  describe('BaseServiceImpl', () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService();
      vi.clearAllMocks();
    });

    describe('initialize', () => {
      it('should initialize service successfully', async () => {
        await service.initialize();

        expect(service.isInitialized()).toBe(true);
        expect(service.initializeCalled).toBe(true);
      });

      it('should log initialization start and success', async () => {
        const infoSpy = vi.spyOn(logger, 'info');

        await service.initialize();

        expect(infoSpy).toHaveBeenCalledWith('TestService initializing...');
        expect(infoSpy).toHaveBeenCalledWith('TestService initialized');
      });

      it('should not re-initialize if already initialized', async () => {
        await service.initialize();
        service.initializeCalled = false; // 플래그 리셋

        await service.initialize();

        expect(service.initializeCalled).toBe(false); // onInitialize가 호출되지 않음
      });

      it('should throw error and log if initialization fails', async () => {
        service.shouldThrowOnInit = true;
        const errorSpy = vi.spyOn(logger, 'error');

        await expect(service.initialize()).rejects.toThrow('Initialization failed');

        expect(service.isInitialized()).toBe(false);
        expect(errorSpy).toHaveBeenCalledWith(
          'TestService initialization failed:',
          expect.any(Error)
        );
      });

      it('should handle async initialization', async () => {
        const asyncService = new AsyncTestService();

        await asyncService.initialize();

        expect(asyncService.isInitialized()).toBe(true);
        expect(asyncService.initializeCalled).toBe(true);
      });
    });

    describe('destroy', () => {
      beforeEach(async () => {
        await service.initialize();
      });

      it('should destroy service successfully', () => {
        service.destroy();

        expect(service.isInitialized()).toBe(false);
        expect(service.destroyCalled).toBe(true);
      });

      it('should log destruction start and success', () => {
        const infoSpy = vi.spyOn(logger, 'info');

        service.destroy();

        expect(infoSpy).toHaveBeenCalledWith('TestService destroying...');
        expect(infoSpy).toHaveBeenCalledWith('TestService destroyed');
      });

      it('should not destroy if not initialized', () => {
        const uninitializedService = new TestService();

        uninitializedService.destroy();

        expect(uninitializedService.destroyCalled).toBe(false);
      });

      it('should log error if destroy fails but not throw', () => {
        service.shouldThrowOnDestroy = true;
        const errorSpy = vi.spyOn(logger, 'error');

        // destroy는 에러를 throw하지 않음
        expect(() => service.destroy()).not.toThrow();

        expect(errorSpy).toHaveBeenCalledWith('TestService destroy failed:', expect.any(Error));
        // 에러가 발생하면 상태는 초기화되지 않음 (try 블록 내부에서만 false 설정)
        expect(service.isInitialized()).toBe(true);
      });
    });

    describe('isInitialized', () => {
      it('should return false initially', () => {
        expect(service.isInitialized()).toBe(false);
      });

      it('should return true after initialization', async () => {
        await service.initialize();

        expect(service.isInitialized()).toBe(true);
      });

      it('should return false after destruction', async () => {
        await service.initialize();
        service.destroy();

        expect(service.isInitialized()).toBe(false);
      });
    });

    describe('lifecycle', () => {
      it('should support full lifecycle: init → destroy → init', async () => {
        // 첫 번째 라이프사이클
        await service.initialize();
        expect(service.isInitialized()).toBe(true);

        service.destroy();
        expect(service.isInitialized()).toBe(false);

        // 두 번째 라이프사이클
        service.initializeCalled = false;
        await service.initialize();
        expect(service.isInitialized()).toBe(true);
        expect(service.initializeCalled).toBe(true);
      });
    });
  });

  describe('SingletonServiceImpl', () => {
    afterEach(() => {
      // 각 테스트 후 싱글톤 리셋
      TestSingletonService.reset();
    });

    describe('getInstance', () => {
      it('should return same instance on multiple calls', () => {
        const instance1 = TestSingletonService.getInstance();
        const instance2 = TestSingletonService.getInstance();

        expect(instance1).toBe(instance2);
      });

      it('should create only one instance', async () => {
        const instance1 = TestSingletonService.getInstance();
        await instance1.initialize();

        const instance2 = TestSingletonService.getInstance();

        expect(instance2.isInitialized()).toBe(true);
      });
    });

    describe('resetSingleton', () => {
      it('should destroy and remove singleton instance', async () => {
        const instance1 = TestSingletonService.getInstance();
        await instance1.initialize();

        TestSingletonService.reset();

        const instance2 = TestSingletonService.getInstance();
        expect(instance2).not.toBe(instance1);
        expect(instance2.isInitialized()).toBe(false);
      });

      it('should call destroy when resetting', async () => {
        const instance = TestSingletonService.getInstance();
        await instance.initialize();

        TestSingletonService.reset();

        expect(instance.destroyCalled).toBe(true);
      });

      it('should handle reset on non-existent instance', () => {
        // 인스턴스가 없을 때 reset 호출해도 에러 없음
        expect(() => TestSingletonService.reset()).not.toThrow();
      });
    });

    describe('inheritance', () => {
      it('should support BaseServiceImpl methods', async () => {
        const instance = TestSingletonService.getInstance();

        await instance.initialize();
        expect(instance.isInitialized()).toBe(true);

        instance.destroy();
        expect(instance.isInitialized()).toBe(false);
      });
    });
  });

  describe('error handling edge cases', () => {
    it('should handle serviceName with special characters', async () => {
      const service = new TestService('Test/Service:123');
      const infoSpy = vi.spyOn(logger, 'info');

      await service.initialize();

      expect(infoSpy).toHaveBeenCalledWith('Test/Service:123 initializing...');
    });

    it('should handle empty serviceName', async () => {
      const service = new TestService('');
      const infoSpy = vi.spyOn(logger, 'info');

      await service.initialize();

      expect(infoSpy).toHaveBeenCalledWith(' initializing...');
      expect(service.isInitialized()).toBe(true);
    });
  });
});
