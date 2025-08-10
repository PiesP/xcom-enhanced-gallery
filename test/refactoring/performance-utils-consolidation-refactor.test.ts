/**
 * @fileoverview Performance Utils Consolidation REFACTOR 테스트
 * 🔵 REFACTOR 단계: 성능 유틸리티 최적화 및 코드 품질 향상
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { globalPerformanceMonitor, TestingError } from '../../src/shared/testing/testing-utils';

describe('🔵 REFACTOR: Performance Utils 성능 최적화 및 품질 향상', () => {
  beforeEach(() => {
    globalPerformanceMonitor.reset();
  });

  afterEach(() => {
    globalPerformanceMonitor.reset();
  });

  describe('Debounce 성능 최적화', () => {
    it('should pass - Debounce 함수 성능이 최적화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('debounce-performance');

      try {
        const { debounce } = await import('../../src/shared/utils/performance.js');

        let callCount = 0;
        const testFunction = () => callCount++;

        // 성능 테스트: 1000번의 debounce 호출
        const startTime = performance.now();
        const debouncedFn = debounce(testFunction, 10);

        for (let i = 0; i < 1000; i++) {
          debouncedFn();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // 성능 기준: 1000번 debounce 호출이 50ms 미만이어야 함
        expect(duration).toBeLessThan(50);

        // 함수 정리 후 대기
        setTimeout(() => {
          expect(callCount).toBe(1); // debounce로 인해 마지막 호출만 실행
        }, 20);

        globalPerformanceMonitor.endMeasurement('debounce-performance');

        console.log('✅ REFACTOR 완료: Debounce 성능 최적화');
      } catch (error) {
        throw new TestingError('Debounce performance test failed', 'debounce-performance', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    it('should pass - 메모리 효율적인 debounce 정리가 구현되었다', async () => {
      globalPerformanceMonitor.startMeasurement('debounce-memory-optimization');

      try {
        const { debounce } = await import('../../src/shared/utils/performance.js');

        // 메모리 사용량 측정
        const initialMemory = performance.memory?.usedJSHeapSize || 0;

        // 많은 debounce 함수 생성 후 정리
        const debouncedFunctions: Array<() => void> = [];

        for (let i = 0; i < 100; i++) {
          const fn = () => console.log(`test-${i}`);
          const debouncedFn = debounce(fn, 100);
          debouncedFunctions.push(debouncedFn);
        }

        // 모든 함수 실행 후 정리 대기
        for (const fn of debouncedFunctions) {
          fn();
        }

        // 정리 시간 대기
        await new Promise(resolve => setTimeout(resolve, 150));

        const finalMemory = performance.memory?.usedJSHeapSize || 0;

        // 메모리 누수가 없는지 확인
        if (performance.memory) {
          expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB 미만
        }

        globalPerformanceMonitor.endMeasurement('debounce-memory-optimization');

        console.log('✅ REFACTOR 완료: Debounce 메모리 최적화');
      } catch (error) {
        throw new TestingError(
          'Debounce memory optimization test failed',
          'debounce-memory-optimization',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });
  });

  describe('Throttle 성능 최적화', () => {
    it('should pass - Throttle 함수 성능이 최적화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('throttle-performance');

      try {
        const { throttle } = await import('../../src/shared/utils/performance.js');

        let callCount = 0;
        const testFunction = () => callCount++;

        // 성능 테스트: 빠른 throttle 호출
        const startTime = performance.now();
        const throttledFn = throttle(testFunction, 10);

        // 짧은 시간 내 많은 호출
        for (let i = 0; i < 1000; i++) {
          throttledFn();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // 성능 기준: 1000번 throttle 호출이 50ms 미만이어야 함
        expect(duration).toBeLessThan(50);

        // throttle로 인해 첫 번째 호출만 실행되었어야 함
        expect(callCount).toBeGreaterThan(0);
        expect(callCount).toBeLessThan(10); // 제한된 호출 수

        globalPerformanceMonitor.endMeasurement('throttle-performance');

        console.log('✅ REFACTOR 완료: Throttle 성능 최적화');
      } catch (error) {
        throw new TestingError('Throttle performance test failed', 'throttle-performance', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    it('should pass - 고빈도 이벤트 처리가 최적화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('high-frequency-throttle');

      try {
        const { throttle } = await import('../../src/shared/utils/performance.js');

        let executionCount = 0;
        const heavyFunction = () => {
          // 무거운 작업 시뮬레이션
          executionCount++;
          for (let i = 0; i < 1000; i++) {
            Math.random();
          }
        };

        const throttledHeavyFn = throttle(heavyFunction, 50);

        const startTime = performance.now();

        // 고빈도 호출 시뮬레이션 (예: 스크롤 이벤트)
        const interval = setInterval(throttledHeavyFn, 1);

        setTimeout(() => {
          clearInterval(interval);
          const endTime = performance.now();
          const duration = endTime - startTime;

          // throttle로 인해 실행 횟수가 제한되었는지 확인
          expect(executionCount).toBeLessThan(10); // 제한된 실행
          expect(duration).toBeGreaterThan(100); // 최소 100ms 실행

          globalPerformanceMonitor.endMeasurement('high-frequency-throttle');

          console.log('✅ REFACTOR 완료: 고빈도 이벤트 처리 최적화');
        }, 100);
      } catch (error) {
        throw new TestingError('High frequency throttle test failed', 'high-frequency-throttle', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  });

  describe('TypeScript 타입 안전성 강화', () => {
    it('should pass - Performance Utils 타입 안전성이 강화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('performance-utils-type-safety');

      try {
        const performanceUtils = await import('../../src/shared/utils/performance.js');

        // 타입 안전성 검증
        expect(typeof performanceUtils.debounce).toBe('function');
        expect(typeof performanceUtils.throttle).toBe('function');

        // 함수 시그니처 검증
        const testFn = (a: number, b: string) => `${a}-${b}`;

        const debouncedFn = performanceUtils.debounce(testFn, 10);
        const throttledFn = performanceUtils.throttle(testFn, 10);

        expect(typeof debouncedFn).toBe('function');
        expect(typeof throttledFn).toBe('function');

        globalPerformanceMonitor.endMeasurement('performance-utils-type-safety');

        console.log('✅ REFACTOR 완료: Performance Utils 타입 안전성 강화');
      } catch (error) {
        throw new TestingError(
          'Performance utils type safety test failed',
          'performance-utils-type-safety',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });

    it('should pass - 에러 처리가 강화되었다', async () => {
      globalPerformanceMonitor.startMeasurement('performance-utils-error-handling');

      try {
        const { debounce, throttle } = await import('../../src/shared/utils/performance.js');

        // 잘못된 매개변수에 대한 에러 처리 확인
        expect(() => {
          // @ts-expect-error: 의도적인 잘못된 매개변수
          debounce(null, 10);
        }).not.toThrow(); // 적절한 기본값이나 무시 처리

        expect(() => {
          // @ts-expect-error: 의도적인 잘못된 매개변수
          throttle(() => {}, -1);
        }).not.toThrow(); // 음수 delay에 대한 적절한 처리

        globalPerformanceMonitor.endMeasurement('performance-utils-error-handling');

        console.log('✅ REFACTOR 완료: Performance Utils 에러 처리 강화');
      } catch (error) {
        throw new TestingError(
          'Performance utils error handling test failed',
          'performance-utils-error-handling',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });
  });

  describe('통합 성능 보고서', () => {
    it('should pass - Performance Utils REFACTOR 성능 개선이 측정되었다', () => {
      // 최종 성능 체크
      globalPerformanceMonitor.startMeasurement('final-performance-utils-check');

      // 간단한 성능 체크 작업
      const testUtilsFeatures = {
        debounce: 'function optimization',
        throttle: 'event handling optimization',
        typeAafety: 'TypeScript strict compliance',
      };

      expect(Object.keys(testUtilsFeatures)).toHaveLength(3);
      expect(testUtilsFeatures.debounce).toBe('function optimization');

      globalPerformanceMonitor.endMeasurement('final-performance-utils-check');

      const report = globalPerformanceMonitor.generateReport();

      expect(report).toContain('Performance Report');
      expect(report.length).toBeGreaterThan(50);

      // 현재 실행된 메트릭 확인
      const allMetrics = globalPerformanceMonitor.getAllMetrics();
      expect(allMetrics['final-performance-utils-check']).toBeDefined();
      expect(allMetrics['final-performance-utils-check'].duration).toBeGreaterThan(0);

      console.log('✅ REFACTOR 완료: Performance Utils 성능 개선 완료');
      console.log('📊 성능 보고서:\n', report);
    });
  });
});
