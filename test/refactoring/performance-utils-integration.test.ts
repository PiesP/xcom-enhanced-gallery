/**
 * @fileoverview 🔵 REFACTOR Phase - 성능 시스템 통합 완료 검증
 * @description 통합되고 개선된 성능 유틸리티 시스템 검증
 * @version 2.0.0 - REFACTOR Phase
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('🔵 REFACTOR: 성능 시스템 통합 및 개선 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('✅ 통합된 PerformanceUtils 클래스 (REFACTOR)', () => {
    it('단일 PerformanceUtils 클래스가 모든 기능을 제공해야 함', async () => {
      const { PerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );

      // 핵심 기능들
      expect(PerformanceUtils.throttle).toBeDefined();
      expect(PerformanceUtils.debounce).toBeDefined();
      expect(PerformanceUtils.rafThrottle).toBeDefined();
      expect(PerformanceUtils.measurePerformance).toBeDefined();
      expect(PerformanceUtils.createDebouncer).toBeDefined();
      expect(PerformanceUtils.delay).toBeDefined();

      // REFACTOR: 새로 추가된 기능들
      expect(PerformanceUtils.createTimerService).toBeDefined();
      expect(PerformanceUtils.getGlobalTimerService).toBeDefined();
      expect(PerformanceUtils.optimizeForUserScript).toBeDefined();

      // 타입 검증
      expect(typeof PerformanceUtils.throttle).toBe('function');
      expect(typeof PerformanceUtils.debounce).toBe('function');
      expect(typeof PerformanceUtils.rafThrottle).toBe('function');
      expect(typeof PerformanceUtils.measurePerformance).toBe('function');
    });

    it('UI 최적화 기능이 통합되어 제공되어야 함', async () => {
      const { UnifiedPerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );

      // TimerService 관련 기능 검증
      expect(UnifiedPerformanceUtils.createTimerService).toBeDefined();
      expect(typeof UnifiedPerformanceUtils.createTimerService).toBe('function');

      // 글로벌 타이머 서비스 접근
      expect(UnifiedPerformanceUtils.getGlobalTimerService).toBeDefined();
    });

    it('메모리 관리를 위한 ResourceService를 제공해야 함', async () => {
      const { UnifiedPerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );

      // ResourceService 관련 기능 검증
      expect(UnifiedPerformanceUtils.createResourceService).toBeDefined();
      expect(UnifiedPerformanceUtils.getGlobalResourceService).toBeDefined();
    });
  });

  describe('호환성 레이어 검증', () => {
    it('기존 import 경로들이 모두 작동해야 함', async () => {
      // 기존의 개별 import들이 여전히 작동하는지 검증
      const performanceModule = await import('@shared/utils/performance');

      expect(performanceModule.throttle).toBeDefined();
      expect(performanceModule.debounce).toBeDefined();
      expect(performanceModule.rafThrottle).toBeDefined();
      expect(performanceModule.measurePerformance).toBeDefined();
    });

    it('utils/index.ts를 통한 re-export가 작동해야 함', async () => {
      const utilsModule = await import('@shared/utils');

      // 통합된 performance 유틸리티들 검증
      expect(utilsModule.throttle).toBeDefined();
      expect(utilsModule.debounce).toBeDefined();
      expect(utilsModule.rafThrottle).toBeDefined();
      expect(utilsModule.TimerService).toBeDefined();
      expect(utilsModule.globalTimerService).toBeDefined();
    });
  });

  describe('기능적 통합성 검증', () => {
    it('throttle 기능이 통합 후에도 정상 작동해야 함', async () => {
      vi.useFakeTimers();

      const { UnifiedPerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );
      const mockFn = vi.fn();

      const throttled = UnifiedPerformanceUtils.throttle(mockFn, 100);

      // 첫 번째 호출은 즉시 실행
      throttled('arg1');
      expect(mockFn).toHaveBeenCalledWith('arg1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // 100ms 내 추가 호출은 지연됨
      throttled('arg2');
      expect(mockFn).toHaveBeenCalledTimes(1); // 아직 1번만

      // 100ms 후에는 마지막 호출이 실행됨
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(2); // 지연된 호출 실행됨
      expect(mockFn).toHaveBeenLastCalledWith('arg2'); // 마지막 인자로 호출됨
    });

    it('debounce 기능이 통합 후에도 정상 작동해야 함', async () => {
      vi.useFakeTimers();

      const { UnifiedPerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );
      const mockFn = vi.fn();

      const debounced = UnifiedPerformanceUtils.debounce(mockFn, 100);

      // 연속 호출 시 마지막 호출만 실행됨
      debounced('arg1');
      debounced('arg2');
      debounced('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      // 100ms 후 마지막 호출이 실행됨
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('arg3');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('성능 측정이 통합 후에도 정상 작동해야 함', async () => {
      const { UnifiedPerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );

      const testFunction = () => {
        // 시뮬레이션 작업
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
        return 'result';
      };

      const result = UnifiedPerformanceUtils.measurePerformance('test', testFunction);

      expect(result.result).toBe('result');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('새로운 통합 기능 검증', () => {
    it('통합된 성능 관리자가 모든 기능을 제공해야 함', async () => {
      const { UnifiedPerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );

      // 통합된 관리자의 새로운 기능들
      expect(UnifiedPerformanceUtils.getPerformanceManager).toBeDefined();
      expect(UnifiedPerformanceUtils.optimizeForUserScript).toBeDefined();
    });

    it('유저스크립트 최적화 기능이 존재해야 함', async () => {
      const { UnifiedPerformanceUtils } = await import(
        '@shared/utils/performance/unified-performance-utils'
      );

      // 유저스크립트 환경에 특화된 최적화
      const optimized = UnifiedPerformanceUtils.optimizeForUserScript({
        maxFunctionCalls: 1000,
        memoryThreshold: 50 * 1024 * 1024, // 50MB
        enableGC: true,
      });

      expect(optimized).toBeDefined();
      expect(optimized.throttle).toBeDefined();
      expect(optimized.debounce).toBeDefined();
      expect(optimized.cleanup).toBeDefined();
    });
  });
});
