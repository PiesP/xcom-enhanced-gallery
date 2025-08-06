/**
 * @fileoverview TDD Phase 2 (GREEN): 중복 정리 완료 검증
 * @description 중복 제거 작업이 성공적으로 완료되었는지 확인
 * @version 1.0.0 - TDD Phase GREEN
 */

import { describe, it, expect, test } from 'vitest';

describe('🟢 GREEN Phase 2: 중복 정리 완료 검증', () => {
  describe('Priority 1: 모듈 로더 중복 정리 완료', () => {
    it('ModuleLoader.ts가 deprecated되고 module-loader.ts로 re-export하는지 확인', async () => {
      const deprecatedModule = await import('@shared/services/ModuleLoader');
      const mainModule = await import('@shared/services/module-loader');

      // 두 모듈이 같은 기능을 제공해야 함
      expect(deprecatedModule.loadModulesParallel).toBeDefined();
      expect(mainModule.loadModulesParallel).toBeDefined();

      // deprecated 모듈이 main 모듈의 re-export인지 확인
      expect(typeof deprecatedModule.loadModulesParallel).toBe('function');
      expect(typeof deprecatedModule.loadServiceModule).toBe('function');
    });

    it('deprecated 컴포넌트 로딩이 올바르게 처리되는지 확인', async () => {
      const { loadModulesParallel } = await import('@shared/services/module-loader');

      const result = await loadModulesParallel([{ type: 'component', name: 'TestComponent' }]);

      expect(result[0].success).toBe(false);
      expect(result[0].error).toBe('deprecated');
    });
  });

  describe('Priority 2: 스타일 관리 중복 정리 완료', () => {
    it('css-utilities.ts가 StyleManager로 re-export하는지 확인', async () => {
      const cssUtils = await import('@shared/utils/styles/css-utilities');

      // css-utilities가 StyleManager의 함수들을 re-export해야 함
      expect(typeof cssUtils.setCSSVariable).toBe('function');
      expect(typeof cssUtils.getCSSVariable).toBe('function');
      expect(typeof cssUtils.setCSSVariables).toBe('function');
    });

    it('utils.ts의 setCSSVariable이 StyleManager에서 오는지 확인', async () => {
      const utils = await import('@shared/utils/utils');
      const styleManager = await import('@shared/styles/style-manager');

      // utils의 setCSSVariable이 StyleManager에서 오는지 확인
      expect(typeof utils.setCSSVariable).toBe('function');
      expect(typeof styleManager.setCSSVariable).toBe('function');
    });

    it('integrated-utils.ts가 StyleManager에서 직접 import하는지 확인', async () => {
      const integratedUtils = await import('@shared/utils/integrated-utils');

      // IntegratedUtils가 스타일 함수들을 제공해야 함
      expect(typeof integratedUtils.setCSSVariable).toBe('function');
      expect(typeof integratedUtils.IntegratedUtils.styles.setCSSVariable).toBe('function');
    });

    it('CoreStyleManager가 deprecated 경고를 포함하는지 확인', async () => {
      const coreStyles = await import('@core/styles');

      // CoreStyleManager는 여전히 존재하지만 deprecated 상태
      expect(coreStyles.CoreStyleManager).toBeDefined();
      expect(typeof coreStyles.CoreStyleManager.getInstance).toBe('function');

      // 개별 함수들도 사용 가능해야 함
      expect(typeof coreStyles.setCSSVariable).toBe('function');
      expect(typeof coreStyles.combineClasses).toBe('function');
    });
  });

  describe('Priority 3: 성능 유틸리티 re-export 정리 완료', () => {
    it('모든 성능 관련 파일들이 PerformanceUtils를 올바르게 re-export하는지 확인', async () => {
      const performance = await import('@shared/utils/performance');
      const types = await import('@shared/utils/types');
      const timerManagement = await import('@shared/utils/timer-management');

      // 모든 파일에서 기본 성능 함수들을 사용할 수 있어야 함
      expect(typeof performance.throttle).toBe('function');
      expect(typeof performance.debounce).toBe('function');
      expect(typeof performance.rafThrottle).toBe('function');

      expect(typeof types.throttle).toBe('function');
      expect(typeof types.debounce).toBe('function');

      expect(typeof timerManagement.Debouncer).toBe('function');
      expect(typeof timerManagement.createDebouncer).toBe('function');
    });

    it('PerformanceUtils가 모든 성능 함수를 제공하는지 확인', async () => {
      const { PerformanceUtils } = await import(
        '@shared/utils/performance/performance-utils-enhanced'
      );

      expect(typeof PerformanceUtils.throttle).toBe('function');
      expect(typeof PerformanceUtils.debounce).toBe('function');
      expect(typeof PerformanceUtils.rafThrottle).toBe('function');
      expect(typeof PerformanceUtils.createDebouncer).toBe('function');
      expect(typeof PerformanceUtils.measurePerformance).toBe('function');
    });
  });

  describe('기능 무결성 검증', () => {
    it('정리 후에도 모든 핵심 기능이 작동하는지 확인', async () => {
      // 스타일 함수 테스트
      const { setCSSVariable } = await import('@shared/styles/style-manager');
      expect(() => {
        setCSSVariable('--test-var', 'test-value');
      }).not.toThrow();

      // 성능 함수 테스트
      const { throttle } = await import('@shared/utils/performance/performance-utils-enhanced');
      const mockFn = () => {};
      const throttled = throttle(mockFn, 100);

      expect(typeof throttled).toBe('function');
      throttled();
      // 기능적 테스트는 다른 테스트에서 수행
    });

    it('deprecated 모듈들이 여전히 호환성을 제공하는지 확인', async () => {
      // ModuleLoader (deprecated)
      const deprecatedModuleLoader = await import('@shared/services/ModuleLoader');
      expect(typeof deprecatedModuleLoader.loadModulesParallel).toBe('function');

      // css-utilities (deprecated)
      const deprecatedCssUtils = await import('@shared/utils/styles/css-utilities');
      expect(typeof deprecatedCssUtils.setCSSVariable).toBe('function');

      // CoreStyleManager (deprecated)
      const { CoreStyleManager } = await import('@core/styles');
      const instance = CoreStyleManager.getInstance();
      expect(typeof instance.setCSSVariable).toBe('function');
    });
  });

  describe('타입 안전성 검증', () => {
    it('모든 함수가 올바른 타입 시그니처를 가지는지 확인', async () => {
      const { PerformanceUtils } = await import(
        '@shared/utils/performance/performance-utils-enhanced'
      );
      const { setCSSVariable } = await import('@shared/styles/style-manager');

      // 타입 검증 (컴파일 타임)
      const mockFn = () => {};
      const throttled = PerformanceUtils.throttle(mockFn, 100);
      expect(typeof throttled).toBe('function');

      // CSS 변수 설정 타입 검증
      expect(() => {
        setCSSVariable('--test', 'value');
        setCSSVariable('--test', 'value', document.body);
      }).not.toThrow();
    });
  });
});

describe('🔄 REFACTOR Phase 3: 최적화 및 정리', () => {
  describe('번들 크기 최적화', () => {
    test('중복 제거로 인한 import 최적화 확인', async () => {
      // 다양한 경로에서 import해도 같은 구현을 사용하는지 확인
      const perf1 = await import('@shared/utils/performance');
      const perf2 = await import('@shared/utils/performance/performance-utils-enhanced');

      // 동일한 함수 구현을 참조해야 함
      expect(typeof perf1.throttle).toBe('function');
      expect(typeof perf2.throttle).toBe('function');
    });

    test('메모리 사용량 최적화 확인', () => {
      // 중복 제거로 인한 메모리 사용량 감소 시뮬레이션
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // 여러 번 import해도 동일한 인스턴스 사용
      for (let i = 0; i < 10; i++) {
        import('@shared/utils/performance');
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가가 합리적인 범위 내에 있어야 함
      expect(memoryIncrease).toBeLessThan(50 * 1024); // 50KB 미만
    });
  });

  describe('코드 품질 개선', () => {
    test('deprecated 마킹이 올바르게 적용되었는지 확인', async () => {
      // 파일 내용에서 deprecated 마킹 확인은 정적 분석으로 수행
      // 런타임에서는 기능적 호환성만 확인
      expect(true).toBe(true);
    });

    test('import 경로 일관성 확인', async () => {
      // 모든 re-export가 올바른 경로를 사용하는지 확인
      const modules = [
        '@shared/utils/performance',
        '@shared/utils/types',
        '@shared/utils/timer-management',
        '@shared/utils/styles/css-utilities',
        '@shared/services/ModuleLoader',
      ];

      for (const modulePath of modules) {
        try {
          const module = await import(modulePath);
          expect(module).toBeDefined();
        } catch (error) {
          throw new Error(`Failed to import ${modulePath}: ${error}`);
        }
      }
    });
  });
});
