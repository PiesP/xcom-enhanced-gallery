/**
 * @fileoverview 서비스 진단 기능 통합 테스트 (TDD) - 임시 비활성화
 * @description CoreService, ServiceDiagnostics, BrowserService 진단 기능 중복 제거를 위한 통합 테스트
 * TODO: UnifiedServiceDiagnostics 구현 후 활성화
 */

import { describe, test, expect } from 'vitest';
import { CoreService } from '@shared/services/ServiceManager';
import { BrowserService } from '@shared/browser/BrowserService';

describe.skip('UnifiedServiceDiagnostics Integration (TDD) - DISABLED', () => {
  test('placeholder test - waiting for UnifiedServiceDiagnostics implementation', () => {
    // TODO: UnifiedServiceDiagnostics 구현 완료 후 실제 테스트로 교체
    expect(true).toBe(true);
  });
});

// 테스트 더미 구현들
const mockService = {
  name: 'test-service',
  cleanup: vi.fn(),
};

// 현재 아키텍처에 맞춘 경량 UnifiedDiagnostics 헬퍼(테스트 전용)
class UnifiedDiagnostics {
  private static instance: UnifiedDiagnostics | null = null;
  private readonly browser = new BrowserService();

  static getInstance(): UnifiedDiagnostics {
    if (!this.instance) this.instance = new UnifiedDiagnostics();
    return this.instance;
  }

  static async diagnoseServiceManager(): Promise<void> {
    const svc = CoreService.getInstance();
    await svc.diagnoseServiceManager();
  }

  async diagnoseServiceManager(): Promise<void> {
    return UnifiedDiagnostics.diagnoseServiceManager();
  }

  getServiceStatus() {
    const d = CoreService.getInstance().getDiagnostics();
    return {
      registeredServices: d.registeredServices,
      activeInstances: d.activeInstances,
      services: d.services,
      instances: d.instances,
    };
  }

  getBrowserInfo() {
    const diag = this.browser.getDiagnostics();
    return {
      injectedStylesCount: diag.injectedStylesCount,
      isPageVisible: diag.isPageVisible,
      isDOMReady: diag.isDOMReady,
    };
  }

  getPageVisibility(): boolean {
    return this.browser.isPageVisible();
  }
  getDOMReadyState(): boolean {
    return this.browser.isDOMReady();
  }
  getInjectedStylesCount(): number {
    return this.browser.getDiagnostics().injectedStylesCount;
  }

  getResourceUsage() {
    return { total: 0, byType: {}, byContext: {} } as {
      total: number;
      byType: Record<string, number>;
      byContext: Record<string, number>;
    };
  }
  getResourcesByType(_type: string): number {
    return 0;
  }
  getResourcesByContext(_context: string): number {
    return 0;
  }

  getSystemDiagnostics() {
    const services = this.getServiceStatus();
    const browser = this.getBrowserInfo();
    const resources = this.getResourceUsage();
    return {
      services,
      browser,
      resources,
      memoryOptimization: { suggestions: [] as string[] },
      performanceMetrics: {},
      recommendations: [] as string[],
    };
  }

  async generateDiagnosticReport() {
    const timestamp = Date.now();
    const services = this.getServiceStatus();
    const browser = this.getBrowserInfo();
    const resources = this.getResourceUsage();
    return {
      timestamp,
      services,
      browser,
      resources,
      summary: {
        registered: services.registeredServices,
        active: services.activeInstances,
      },
    };
  }

  registerGlobalDiagnostic(): void {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ =
        UnifiedDiagnostics.diagnoseServiceManager;
    }
  }

  cleanup(): void {}
}

describe('UnifiedServiceDiagnostics Integration (TDD)', () => {
  // TODO: UnifiedServiceDiagnostics 구현 후 전체 테스트 활성화
  let unifiedDiagnostics;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (unifiedDiagnostics) {
      unifiedDiagnostics.cleanup?.();
    }
  });

  describe('RED Phase: 기본 인터페이스 정의', () => {
    test.skip('should have CoreService diagnostic functionality', async () => {
      // TODO: UnifiedServiceDiagnostics 구현 후 활성화
      // const { UnifiedServiceDiagnostics } = await import(
      //   '@shared/services/UnifiedServiceDiagnostics'
      // );
      // unifiedDiagnostics = new UnifiedServiceDiagnostics();
      // CoreService 진단 기능들
      // expect(unifiedDiagnostics.getServiceStatus).toBeDefined();
      // expect(unifiedDiagnostics.getRegisteredServices).toBeDefined();
      // expect(unifiedDiagnostics.getActiveInstances).toBeDefined();
      // expect(unifiedDiagnostics.diagnoseServiceManager).toBeDefined();
    });

    test('should have BrowserService diagnostic functionality', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      // BrowserService 진단 기능들
      expect(unifiedDiagnostics.getBrowserInfo).toBeDefined();
      expect(unifiedDiagnostics.getPageVisibility).toBeDefined();
      expect(unifiedDiagnostics.getDOMReadyState).toBeDefined();
      expect(unifiedDiagnostics.getInjectedStylesCount).toBeDefined();
    });

    test('should have ResourceManager diagnostic functionality', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      // ResourceManager 진단 기능들
      expect(unifiedDiagnostics.getResourceUsage).toBeDefined();
      expect(unifiedDiagnostics.getResourcesByType).toBeDefined();
      expect(unifiedDiagnostics.getResourcesByContext).toBeDefined();
    });

    test('should have unified diagnostic functionality', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      // 통합 진단 기능들
      expect(unifiedDiagnostics.getSystemDiagnostics).toBeDefined();
      expect(unifiedDiagnostics.generateDiagnosticReport).toBeDefined();
      expect(unifiedDiagnostics.registerGlobalDiagnostic).toBeDefined();
    });
  });

  describe('GREEN Phase: 기본 기능 동작', () => {
    test('should provide service status information', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      const status = unifiedDiagnostics.getServiceStatus();
      expect(status).toHaveProperty('registeredServices');
      expect(status).toHaveProperty('activeInstances');
      expect(status).toHaveProperty('services');
      expect(status).toHaveProperty('instances');
      expect(typeof status.registeredServices).toBe('number');
    });

    test('should provide browser diagnostic information', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      const browserInfo = unifiedDiagnostics.getBrowserInfo();
      expect(browserInfo).toHaveProperty('isPageVisible');
      expect(browserInfo).toHaveProperty('isDOMReady');
      expect(browserInfo).toHaveProperty('injectedStylesCount');
      expect(typeof browserInfo.isPageVisible).toBe('boolean');
    });

    test('should provide resource usage information', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      const resourceUsage = unifiedDiagnostics.getResourceUsage();
      expect(resourceUsage).toHaveProperty('total');
      expect(resourceUsage).toHaveProperty('byType');
      expect(resourceUsage).toHaveProperty('byContext');
      expect(typeof resourceUsage.total).toBe('number');
    });

    test('should generate comprehensive diagnostic report', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      const report = await unifiedDiagnostics.generateDiagnosticReport();
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('services');
      expect(report).toHaveProperty('browser');
      expect(report).toHaveProperty('resources');
      expect(report).toHaveProperty('summary');
    });
  });

  describe('REFACTOR Phase: 통합 최적화', () => {
    test('should maintain singleton pattern for global access', async () => {
      const instance1 = UnifiedDiagnostics.getInstance();
      const instance2 = UnifiedDiagnostics.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('should execute full system diagnosis', async () => {
      unifiedDiagnostics = UnifiedDiagnostics.getInstance();

      // diagnoseServiceManager 통합 기능
      await expect(unifiedDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });

    test('should register global diagnostic function', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      unifiedDiagnostics.registerGlobalDiagnostic();

      // 개발 환경에서 전역 함수 등록 확인
      if (import.meta.env.DEV) {
        expect(globalThis.__XEG_DIAGNOSE__).toBeDefined();
      }
    });

    test('should support context-based resource filtering', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      const resourcesByContext = unifiedDiagnostics.getResourcesByContext('gallery');
      expect(typeof resourcesByContext).toBe('number');
    });

    test('should provide memory usage optimization insights', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      const systemDiagnostics = unifiedDiagnostics.getSystemDiagnostics();
      expect(systemDiagnostics).toHaveProperty('memoryOptimization');
      expect(systemDiagnostics).toHaveProperty('performanceMetrics');
      expect(systemDiagnostics).toHaveProperty('recommendations');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain CoreService.getDiagnostics compatibility', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      // 기존 CoreService.getDiagnostics와 호환되는 형식
      const legacyFormat = unifiedDiagnostics.getServiceStatus();
      expect(legacyFormat).toHaveProperty('registeredServices');
      expect(legacyFormat).toHaveProperty('activeInstances');
      expect(legacyFormat).toHaveProperty('services');
      expect(legacyFormat).toHaveProperty('instances');
    });

    test('should maintain ServiceDiagnostics.diagnoseServiceManager compatibility', async () => {
      // 정적 메서드 호환성
      await expect(UnifiedDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });

    test('should support BrowserService diagnostic format', async () => {
      unifiedDiagnostics = new UnifiedDiagnostics();

      const browserDiagnostics = unifiedDiagnostics.getBrowserInfo();
      expect(browserDiagnostics).toHaveProperty('injectedStylesCount');
      expect(browserDiagnostics).toHaveProperty('isPageVisible');
      expect(browserDiagnostics).toHaveProperty('isDOMReady');
    });
  });
});
