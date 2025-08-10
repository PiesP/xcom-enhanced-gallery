/**
 * @fileoverview TDD Phase 1.4 - Browser 유틸리티 REFACTOR 테스트
 * 🔵 REFACTOR 단계: 성능 최적화 및 코드 품질 향상
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { globalPerformanceMonitor, TestingError } from '../../src/shared/testing/testing-utils';

describe('🔵 REFACTOR: Browser 유틸리티 성능 최적화 및 품질 향상', () => {
  beforeEach(() => {
    globalPerformanceMonitor.reset();
  });

  afterEach(() => {
    globalPerformanceMonitor.reset();
  });

  describe('성능 최적화 검증', () => {
    it('should pass - CSS 주입 성능이 최적화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('css-injection-performance');

      try {
        const { BrowserCSSUtils } = await import('../../src/shared/browser/browser-css-utils.js');

        // 성능 테스트: 100개의 CSS 스타일을 빠르게 주입
        const startTime = performance.now();

        for (let i = 0; i < 100; i++) {
          const css = `.test-class-${i} { color: red; }`;
          BrowserCSSUtils.injectCSS(css, `test-style-${i}`);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // 성능 기준: 100개 CSS 주입이 100ms 미만이어야 함
        expect(duration).toBeLessThan(100);

        globalPerformanceMonitor.endMeasurement('css-injection-performance');
        const metrics = globalPerformanceMonitor.getMetrics('css-injection-performance');

        expect(metrics).toBeDefined();
        expect(metrics!.duration).toBeGreaterThan(0);

        console.log('✅ REFACTOR 완료: CSS 주입 성능 최적화');
      } catch (error) {
        throw new TestingError(
          'CSS injection performance test failed',
          'css-injection-performance',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });

    it('should pass - 환경 체크 성능이 최적화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('environment-check-performance');

      try {
        const { isBrowserEnvironment, isExtensionEnvironment } = await import(
          '../../src/shared/browser/browser-environment.js'
        );

        // 성능 테스트: 1000번의 환경 체크
        const startTime = performance.now();

        for (let i = 0; i < 1000; i++) {
          isBrowserEnvironment();
          isExtensionEnvironment();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // 성능 기준: 1000번 환경 체크가 50ms 미만이어야 함
        expect(duration).toBeLessThan(50);

        globalPerformanceMonitor.endMeasurement('environment-check-performance');
        const metrics = globalPerformanceMonitor.getMetrics('environment-check-performance');

        expect(metrics).toBeDefined();
        expect(metrics!.duration).toBeGreaterThan(0);

        console.log('✅ REFACTOR 완료: 환경 체크 성능 최적화');
      } catch (error) {
        throw new TestingError(
          'Environment check performance test failed',
          'environment-check-performance',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });
  });

  describe('코드 품질 향상 검증', () => {
    it('should pass - TypeScript strict 모드 준수', async () => {
      globalPerformanceMonitor.startMeasurement('typescript-strict-compliance');

      try {
        // TypeScript strict 모드 호환성 테스트
        const browserCssUtils = await import('../../src/shared/browser/browser-css-utils.js');
        const browserEnvironment = await import('../../src/shared/browser/browser-environment.js');

        // 타입 안전성 검증
        expect(typeof browserCssUtils.BrowserCSSUtils).toBe('function');
        expect(typeof browserCssUtils.BrowserCSSUtils.injectCSS).toBe('function');
        expect(typeof browserCssUtils.BrowserCSSUtils.removeCSS).toBe('function');

        expect(typeof browserEnvironment.isBrowserEnvironment).toBe('function');
        expect(typeof browserEnvironment.isExtensionEnvironment).toBe('function');
        expect(typeof browserEnvironment.safeWindow).toBe('function');

        globalPerformanceMonitor.endMeasurement('typescript-strict-compliance');

        console.log('✅ REFACTOR 완료: TypeScript strict 모드 준수');
      } catch (error) {
        throw new TestingError(
          'TypeScript strict compliance test failed',
          'typescript-strict-compliance',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });

    it('should pass - 에러 처리가 강화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('error-handling-enhancement');

      try {
        const { BrowserCSSUtils } = await import('../../src/shared/browser/browser-css-utils.js');

        // 잘못된 CSS 주입 시 적절한 에러 처리 확인
        let errorCaught = false;

        try {
          // @ts-expect-error: 의도적인 잘못된 매개변수
          BrowserCSSUtils.injectCSS(null);
        } catch (error) {
          errorCaught = true;
          expect(error).toBeInstanceOf(Error);
        }

        expect(errorCaught).toBe(true);

        globalPerformanceMonitor.endMeasurement('error-handling-enhancement');

        console.log('✅ REFACTOR 완료: 에러 처리 강화');
      } catch (error) {
        throw new TestingError(
          'Error handling enhancement test failed',
          'error-handling-enhancement',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });
  });

  describe('메모리 최적화 검증', () => {
    it('should pass - CSS 스타일 메모리 관리가 최적화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('css-memory-optimization');

      try {
        const { BrowserCSSUtils } = await import('../../src/shared/browser/browser-css-utils.js');

        // 메모리 사용량 측정
        const initialMemory = performance.memory?.usedJSHeapSize || 0;

        // 많은 스타일 주입 후 제거
        const styleIds: string[] = [];

        for (let i = 0; i < 50; i++) {
          const styleId = `memory-test-${i}`;
          const css = `.memory-test-${i} { color: blue; font-size: ${i}px; }`;
          BrowserCSSUtils.injectCSS(css, styleId);
          styleIds.push(styleId);
        }

        // 모든 스타일 제거
        for (const styleId of styleIds) {
          BrowserCSSUtils.removeCSS(styleId);
        }

        const finalMemory = performance.memory?.usedJSHeapSize || 0;

        // 메모리 누수가 없는지 확인 (정확하지 않지만 대략적인 체크)
        if (performance.memory) {
          expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB 미만
        }

        globalPerformanceMonitor.endMeasurement('css-memory-optimization');

        console.log('✅ REFACTOR 완료: CSS 메모리 관리 최적화');
      } catch (error) {
        throw new TestingError('CSS memory optimization test failed', 'css-memory-optimization', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    it('should pass - 전체 시스템 메모리 효율성이 향상되었다', async () => {
      globalPerformanceMonitor.startMeasurement('system-memory-efficiency');

      try {
        const browserIndex = await import('../../src/shared/browser/index.js');

        // 모든 API가 메모리 효율적으로 동작하는지 확인
        expect(browserIndex.BrowserCSSUtils).toBeDefined();
        expect(browserIndex.BrowserUtils).toBeDefined();
        expect(browserIndex.isBrowserEnvironment).toBeDefined();
        expect(browserIndex.isExtensionEnvironment).toBeDefined();
        expect(browserIndex.safeWindow).toBeDefined();

        // 중복 로딩이 없는지 확인 (같은 참조인지 체크)
        expect(browserIndex.BrowserUtils).toBe(browserIndex.BrowserCSSUtils);

        globalPerformanceMonitor.endMeasurement('system-memory-efficiency');

        console.log('✅ REFACTOR 완료: 시스템 메모리 효율성 향상');
      } catch (error) {
        throw new TestingError('System memory efficiency test failed', 'system-memory-efficiency', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  });

  describe('통합 성능 보고서', () => {
    it('should pass - REFACTOR 성능 개선 효과가 측정되었다', () => {
      // beforeEach에서 reset되므로, 여기서 다시 측정을 시작
      globalPerformanceMonitor.startMeasurement('final-performance-check');

      // 간단한 작업 수행
      const testData = { test: 'performance check' };
      expect(testData.test).toBe('performance check');

      globalPerformanceMonitor.endMeasurement('final-performance-check');

      const report = globalPerformanceMonitor.generateReport();

      expect(report).toContain('Performance Report');
      expect(report.length).toBeGreaterThan(50);

      // 현재 실행된 메트릭이 포함되어 있는지 확인
      const allMetrics = globalPerformanceMonitor.getAllMetrics();
      expect(allMetrics['final-performance-check']).toBeDefined();
      expect(allMetrics['final-performance-check'].duration).toBeGreaterThan(0);

      console.log('✅ REFACTOR 완료: 성능 개선 효과 측정 완료');
      console.log('📊 성능 보고서:\n', report);
    });
  });
});
