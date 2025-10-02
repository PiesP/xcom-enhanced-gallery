/**
 * @fileoverview 서비스 진단 기능 통합 테스트 (TDD GREEN)
 * @description CoreService, BrowserService 진단 기능 검증
 * Epic: RED-TEST-003 완료
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreService } from '@shared/services/ServiceManager';
import { BrowserService } from '@shared/browser/BrowserService';
import { UnifiedServiceDiagnostics } from '../_adapters/UnifiedServiceDiagnostics';

describe('UnifiedServiceDiagnostics Integration', () => {
  let unifiedDiagnostics: UnifiedServiceDiagnostics;

  beforeEach(() => {
    vi.clearAllMocks();
    CoreService.resetInstance();
  });

  afterEach(() => {
    if (unifiedDiagnostics) {
      unifiedDiagnostics.cleanup?.();
    }
    CoreService.resetInstance();
  });

  describe('RED Phase: 기본 인터페이스 정의', () => {
    test('should have CoreService diagnostic functionality', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      // CoreService 진단 기능들
      expect(unifiedDiagnostics.getServiceStatus).toBeDefined();
      expect(unifiedDiagnostics.diagnoseServiceManager).toBeDefined();
    });

    test('should have BrowserService diagnostic functionality', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      // BrowserService 진단 기능들
      expect(unifiedDiagnostics.getBrowserInfo).toBeDefined();
      expect(unifiedDiagnostics.getPageVisibility).toBeDefined();
      expect(unifiedDiagnostics.getDOMReadyState).toBeDefined();
      expect(unifiedDiagnostics.getInjectedStylesCount).toBeDefined();
    });

    test('should have ResourceManager diagnostic functionality', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      // ResourceManager 진단 기능들
      expect(unifiedDiagnostics.getResourceUsage).toBeDefined();
      expect(unifiedDiagnostics.getResourcesByType).toBeDefined();
      expect(unifiedDiagnostics.getResourcesByContext).toBeDefined();
    });

    test('should have unified diagnostic functionality', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      // 통합 진단 기능들
      expect(unifiedDiagnostics.getSystemDiagnostics).toBeDefined();
      expect(unifiedDiagnostics.generateDiagnosticReport).toBeDefined();
      expect(unifiedDiagnostics.registerGlobalDiagnostic).toBeDefined();
    });
  });

  describe('GREEN Phase: 기본 기능 동작', () => {
    test('should provide service status information', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      const status = unifiedDiagnostics.getServiceStatus();
      expect(status).toHaveProperty('registeredServices');
      expect(status).toHaveProperty('activeInstances');
      expect(status).toHaveProperty('services');
      expect(status).toHaveProperty('instances');
      expect(typeof status.registeredServices).toBe('number');
    });

    test('should provide browser diagnostic information', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      const browserInfo = unifiedDiagnostics.getBrowserInfo();
      expect(browserInfo).toHaveProperty('isPageVisible');
      expect(browserInfo).toHaveProperty('isDOMReady');
      expect(browserInfo).toHaveProperty('injectedStylesCount');
      expect(typeof browserInfo.isPageVisible).toBe('boolean');
    });

    test('should provide resource usage information', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      const resourceUsage = unifiedDiagnostics.getResourceUsage();
      expect(resourceUsage).toHaveProperty('total');
      expect(resourceUsage).toHaveProperty('byType');
      expect(resourceUsage).toHaveProperty('byContext');
      expect(typeof resourceUsage.total).toBe('number');
    });

    test('should generate comprehensive diagnostic report', async () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      const report = await unifiedDiagnostics.generateDiagnosticReport();
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('services');
      expect(report).toHaveProperty('browser');
      expect(report).toHaveProperty('resources');
      expect(report).toHaveProperty('summary');
    });
  });

  describe('REFACTOR Phase: 통합 최적화', () => {
    test('should maintain singleton pattern for global access', () => {
      const instance1 = UnifiedServiceDiagnostics.getInstance();
      const instance2 = UnifiedServiceDiagnostics.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('should execute full system diagnosis', async () => {
      unifiedDiagnostics = UnifiedServiceDiagnostics.getInstance();

      // diagnoseServiceManager 통합 기능
      await expect(unifiedDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });

    test('should register global diagnostic function', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      unifiedDiagnostics.registerGlobalDiagnostic();

      // 개발 환경에서 전역 함수 등록 확인
      if (import.meta.env.DEV) {
        expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBeDefined();
      }
    });

    test('should support context-based resource filtering', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      const resourcesByContext = unifiedDiagnostics.getResourcesByContext('gallery');
      expect(typeof resourcesByContext).toBe('number');
    });

    test('should provide memory usage optimization insights', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      const systemDiagnostics = unifiedDiagnostics.getSystemDiagnostics();
      expect(systemDiagnostics).toHaveProperty('memoryOptimization');
      expect(systemDiagnostics).toHaveProperty('performanceMetrics');
      expect(systemDiagnostics).toHaveProperty('recommendations');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain CoreService.getDiagnostics compatibility', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      // 기존 CoreService.getDiagnostics와 호환되는 형식
      const legacyFormat = unifiedDiagnostics.getServiceStatus();
      expect(legacyFormat).toHaveProperty('registeredServices');
      expect(legacyFormat).toHaveProperty('activeInstances');
      expect(legacyFormat).toHaveProperty('services');
      expect(legacyFormat).toHaveProperty('instances');
    });

    test('should maintain ServiceDiagnostics.diagnoseServiceManager compatibility', async () => {
      // 정적 메서드 호환성
      await expect(UnifiedServiceDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });

    test('should support BrowserService diagnostic format', () => {
      unifiedDiagnostics = new UnifiedServiceDiagnostics();

      const browserDiagnostics = unifiedDiagnostics.getBrowserInfo();
      expect(browserDiagnostics).toHaveProperty('injectedStylesCount');
      expect(browserDiagnostics).toHaveProperty('isPageVisible');
      expect(browserDiagnostics).toHaveProperty('isDOMReady');
    });
  });
});
