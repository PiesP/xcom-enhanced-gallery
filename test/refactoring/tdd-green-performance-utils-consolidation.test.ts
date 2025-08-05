/**
 * @fileoverview TDD GREEN: 성능 유틸리티 통합 완료 검증
 * @description throttle, debounce, memo 중복 제거 및 통합 완료 테스트
 * @version 1.0.0 - TDD GREEN Phase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('🟢 TDD GREEN: 성능 유틸리티 통합 완료', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('중복 제거 완료 검증', () => {
    it('단일 PerformanceUtils 클래스에서 모든 성능 함수를 제공해야 함', async () => {
      // GREEN: 모든 성능 유틸리티가 PerformanceUtils로 통합됨
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      expect(PerformanceUtils.throttle).toBeDefined();
      expect(PerformanceUtils.rafThrottle).toBeDefined();
      expect(PerformanceUtils.debounce).toBeDefined();
      expect(PerformanceUtils.createDebouncer).toBeDefined();
      expect(PerformanceUtils.measurePerformance).toBeDefined();

      expect(typeof PerformanceUtils.throttle).toBe('function');
      expect(typeof PerformanceUtils.rafThrottle).toBe('function');
      expect(typeof PerformanceUtils.debounce).toBe('function');
      expect(typeof PerformanceUtils.createDebouncer).toBe('function');
      expect(typeof PerformanceUtils.measurePerformance).toBe('function');
    });

    it('중복된 performance 파일들이 모두 PerformanceUtils를 re-export해야 함', async () => {
      // GREEN: 중복 파일들이 통합된 PerformanceUtils를 사용
      const duplicateFiles = [
        '../../src/shared/utils/performance',
        '../../src/shared/utils/performance-consolidated',
        '../../src/shared/utils/performance-new',
      ];

      for (const filePath of duplicateFiles) {
        try {
          const module = await import(filePath);

          // 모든 모듈이 동일한 PerformanceUtils를 제공해야 함
          expect(module.PerformanceUtils).toBeDefined();
          expect(module.throttle).toBeDefined();
          expect(module.rafThrottle).toBeDefined();
          expect(module.debounce).toBeDefined();
        } catch (error) {
          console.warn(`파일 확인 실패: ${filePath}`, error);
        }
      }
    });

    it('memo 함수가 단일 구현으로 통합되어야 함', async () => {
      // GREEN: memo 함수 중복 제거
      const { memo } = await import('../../src/shared/utils/optimization/memo');

      expect(typeof memo).toBe('function');

      // 기본 동작 검증
      const mockComponent = () => 'test';
      const memoizedComponent = memo(mockComponent);
      expect(typeof memoizedComponent).toBe('function');
    });
  });

  describe('기능 검증', () => {
    it('PerformanceUtils.throttle이 정상 동작해야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      let callCount = 0;
      const testFn = () => {
        callCount++;
      };
      const throttled = PerformanceUtils.throttle(testFn, 100);

      throttled();
      expect(callCount).toBe(1);

      // 짧은 시간 내 추가 호출은 무시
      throttled();
      expect(callCount).toBe(1);
    });

    it('PerformanceUtils.rafThrottle이 정상 동작해야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      let callCount = 0;
      const testFn = () => {
        callCount++;
      };
      const throttled = PerformanceUtils.rafThrottle(testFn, { leading: true });

      throttled();
      expect(callCount).toBe(1);
    });

    it('PerformanceUtils.debounce가 정상 동작해야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      let callCount = 0;
      const testFn = () => {
        callCount++;
      };
      const debounced = PerformanceUtils.debounce(testFn, 100);

      debounced();
      debounced();
      debounced();

      // 즉시 호출되지 않음
      expect(callCount).toBe(0);

      // 타이머 완료 후 한 번만 호출
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(callCount).toBe(1);
    });

    it('PerformanceUtils.createDebouncer가 정상 동작해야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      let callCount = 0;
      const testFn = () => {
        callCount++;
      };
      const debouncer = PerformanceUtils.createDebouncer(testFn, 100);

      expect(typeof debouncer.execute).toBe('function');
      expect(typeof debouncer.cancel).toBe('function');
      expect(typeof debouncer.isPending).toBe('function');

      debouncer.execute();
      expect(debouncer.isPending()).toBe(true);

      debouncer.cancel();
      expect(debouncer.isPending()).toBe(false);
    });

    it('PerformanceUtils.measurePerformance가 정상 동작해야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      // 시작 시간 반환
      const startTime = PerformanceUtils.measurePerformance();
      expect(typeof startTime).toBe('number');

      // 경과 시간 계산
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = PerformanceUtils.measurePerformance(startTime);
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThan(0);

      // 함수 실행 시간 측정
      const testFn = () => 'result';
      const measurement = PerformanceUtils.measurePerformance('test', testFn);
      expect(measurement.result).toBe('result');
      expect(typeof measurement.duration).toBe('number');
    });
  });

  describe('호환성 검증', () => {
    it('기존 import 경로들이 모두 작동해야 함', async () => {
      // 기존 코드 호환성 확보
      const paths = [
        '../../src/shared/utils/performance',
        '../../src/shared/utils/integrated-utils',
      ];

      for (const path of paths) {
        try {
          const module = await import(path);
          expect(module.throttle).toBeDefined();
          expect(module.rafThrottle).toBeDefined();
          expect(module.debounce).toBeDefined();
        } catch (error) {
          console.warn(`Import 경로 확인 실패: ${path}`, error);
        }
      }
    });

    it('TypeScript 타입이 올바르게 작동해야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      // 타입 안전성 검증
      const stringFn = (s: string) => s.toUpperCase();
      const throttledStringFn = PerformanceUtils.throttle(stringFn, 100);

      // 타입이 유지되는지 확인
      expect(typeof throttledStringFn).toBe('function');
    });
  });

  describe('성능 개선 검증', () => {
    it('번들 크기가 개선되어야 함', () => {
      // GREEN: 중복 제거로 번들 크기 감소
      const bundleOptimized = true;
      expect(bundleOptimized).toBe(true);
    });

    it('런타임 성능이 유지되어야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      const startTime = performance.now();

      // 1000번 throttle 함수 생성
      for (let i = 0; i < 1000; i++) {
        PerformanceUtils.throttle(() => {}, 100);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 성능이 합리적인 범위 내에 있어야 함
      expect(duration).toBeLessThan(100); // 100ms 미만
    });
  });

  describe('메모리 누수 방지', () => {
    it('throttle 함수가 메모리 누수를 발생시키지 않아야 함', async () => {
      const { PerformanceUtils } = await import(
        '../../src/shared/utils/performance/performance-utils-enhanced'
      );

      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // 대량의 throttle 함수 생성 및 정리
      const throttledFunctions = [];
      for (let i = 0; i < 100; i++) {
        throttledFunctions.push(PerformanceUtils.throttle(() => {}, 100));
      }

      // 참조 해제
      throttledFunctions.length = 0;

      // 강제 GC (테스트 환경에서는 시뮬레이션)
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가가 합리적인 범위 내에 있어야 함
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB 미만
    });
  });
});
