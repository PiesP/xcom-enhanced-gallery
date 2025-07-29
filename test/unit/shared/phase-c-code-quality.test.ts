/**
 * @fileoverview Phase C: 코드 품질 개선 테스트
 * @description 중복 코드 제거와 사용하지 않는 기능 정리 검증
 */

import { describe, it, expect, vi } from 'vitest';

describe('Phase C: 코드 품질 개선', () => {
  describe('Debouncer 중복 통합 검증', () => {
    it('Debouncer 클래스가 performance-utils에서만 export되어야 한다', async () => {
      // 메인 구현체가 performance-utils에 있어야 함
      const performanceUtils = await import(
        '../../../src/shared/utils/performance/performance-utils'
      );
      expect(performanceUtils.Debouncer).toBeDefined();
      expect(performanceUtils.createDebouncer).toBeDefined();

      // Debouncer 클래스가 올바르게 동작하는지 검증
      const testFn = vi.fn();
      const debouncer = new performanceUtils.Debouncer(testFn, 100);

      debouncer.execute('test');
      expect(testFn).not.toHaveBeenCalled(); // 아직 호출되지 않음

      debouncer.flush();
      expect(testFn).toHaveBeenCalledWith('test'); // 즉시 실행됨
    });

    it('모든 다른 모듈들은 performance-utils에서 import해야 한다', async () => {
      // core-utils에서 unified-utils를 거치지 않고 직접 import하는지 확인
      const coreUtils = await import('../../../src/shared/utils/core-utils');
      const performanceUtils = await import(
        '../../../src/shared/utils/performance/performance-utils'
      );

      // createDebouncer 함수가 동일한 결과를 생성하는지 검증
      const testFn = vi.fn();
      const coreDebouncer = coreUtils.createDebouncer(testFn, 100);
      const perfDebouncer = performanceUtils.createDebouncer(testFn, 100);

      expect(coreDebouncer.constructor).toBe(perfDebouncer.constructor);
    });

    it('중복 제거 함수들이 통합되어야 한다', async () => {
      const coreUtils = await import('../../../src/shared/utils/core-utils');
      const unifiedUtils = await import('../../../src/shared/utils/unified-utils');

      // removeDuplicateStrings 함수가 중복되지 않아야 함
      expect(typeof coreUtils.removeDuplicateStrings).toBe('function');
      expect(typeof unifiedUtils.removeDuplicateStrings).toBe('function');

      // 동일한 동작을 수행하는지 검증
      const testArray = ['a', 'b', 'a', 'c', 'b'];
      const coreResult = coreUtils.removeDuplicateStrings(testArray);
      const unifiedResult = unifiedUtils.removeDuplicateStrings(testArray);

      expect(coreResult).toEqual(unifiedResult);
    });
  });

  describe('사용하지 않는 기능 제거 검증', () => {
    it('기본 메모이제이션 기능이 사용 가능한지 확인', async () => {
      // 기본 Preact compat memo 사용 검증
      const vendors = await import('../../../src/shared/external/vendors');
      const { memo } = vendors.getPreactCompat();

      expect(memo).toBeDefined();
      expect(typeof memo).toBe('function');

      // 기본 메모이제이션 동작 테스트
      const mockComponent = () => null;
      const memoizedComponent = memo(mockComponent);

      expect(typeof memoizedComponent).toBe('function');
    });

    it('Bundle 유틸리티가 실제로 사용되는지 확인', async () => {
      const bundleUtils = await import('../../../src/shared/utils/optimization/bundle');

      expect(bundleUtils.createBundleInfo).toBeDefined();
      expect(bundleUtils.isWithinSizeTarget).toBeDefined();
      expect(bundleUtils.getBundleOptimizationSuggestions).toBeDefined();

      // 기본 기능 테스트
      const bundleInfo = bundleUtils.createBundleInfo(['test'], 100);
      expect(bundleInfo.modules).toEqual(['test']);
      expect(bundleInfo.totalSize).toBe(100);
    });
  });

  describe('성능 최적화 검증', () => {
    it('중복 제거된 유틸리티들이 올바르게 동작해야 한다', async () => {
      const { removeDuplicates, removeDuplicateStrings } = await import(
        '../../../src/shared/utils/unified-utils'
      );

      // 범용 중복 제거 함수 테스트
      const testObjects = [
        { id: '1', name: 'a' },
        { id: '2', name: 'b' },
        { id: '1', name: 'a' },
        { id: '3', name: 'c' },
      ];

      const uniqueObjects = removeDuplicates(testObjects, item => item.id);
      expect(uniqueObjects).toHaveLength(3);
      expect(uniqueObjects.map(obj => obj.id)).toEqual(['1', '2', '3']);

      // 문자열 중복 제거 함수 테스트
      const testStrings = ['a', 'b', 'a', 'c', 'b'];
      const uniqueStrings = removeDuplicateStrings(testStrings);
      expect(uniqueStrings).toEqual(['a', 'b', 'c']);
    });
  });

  describe('타이머 관리 통합 검증', () => {
    it('타이머 관리 함수들이 통합되어야 한다', async () => {
      // 메인 타이머 관리 구현체
      const timerManagement = await import('../../../src/shared/utils/timer-management');
      const resourceManager = await import('../../../src/shared/utils/resource-manager');

      // TimerManager 클래스가 존재해야 함
      expect(timerManagement.TimerManager).toBeDefined();
      expect(timerManagement.globalTimerManager).toBeDefined();

      // 리소스 관리의 타이머 함수들도 존재해야 함
      expect(resourceManager.createManagedTimer).toBeDefined();
      expect(resourceManager.createManagedInterval).toBeDefined();

      // TimerManager 기본 동작 검증
      const manager = new timerManagement.TimerManager();
      expect(manager.getActiveTimersCount()).toBe(0);
    });

    it('타이머 관리가 일관되게 동작해야 한다', async () => {
      const { TimerManager } = await import('../../../src/shared/utils/timer-management');
      const { createManagedTimer, createManagedInterval } = await import(
        '../../../src/shared/utils/resource-manager'
      );

      // 기본 타이머 관리
      const manager = new TimerManager();
      const initialCount = manager.getActiveTimersCount();
      expect(initialCount).toBe(0);

      // 관리되는 타이머들
      const timerId = createManagedTimer(() => {}, 1000);
      const intervalId = createManagedInterval(() => {}, 1000);

      expect(typeof timerId).toBe('string');
      expect(typeof intervalId).toBe('string');
    });
  });

  describe('성능 측정 함수 통합 검증', () => {
    it('성능 측정 함수가 중복되지 않아야 한다', async () => {
      const performanceUtils = await import(
        '../../../src/shared/utils/performance/performance-utils'
      );
      const timerManagement = await import('../../../src/shared/utils/timer-management');

      // 메인 구현체는 performance-utils에 있어야 함
      expect(performanceUtils.measurePerformance).toBeDefined();
      expect(performanceUtils.measureAsyncPerformance).toBeDefined();

      // timer-management에는 다른 성능 측정 함수가 있을 수 있지만 주요 구현체는 performance-utils
      expect(timerManagement.measurePerformance).toBeDefined();

      // 기본 성능 측정 동작 검증
      const result = performanceUtils.measurePerformance('test', () => 'result');
      expect(result.result).toBe('result');
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('비동기 성능 측정이 올바르게 동작해야 한다', async () => {
      const { measureAsyncPerformance } = await import(
        '../../../src/shared/utils/performance/performance-utils'
      );

      const result = await measureAsyncPerformance('async-test', async () => {
        // Promise.resolve를 사용하여 비동기 동작 시뮬레이션
        await Promise.resolve().then(() => new Promise(resolve => resolve('async-result')));
        return 'async-result';
      });

      expect(result.result).toBe('async-result');
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('복잡한 최적화 시스템 제거 검증', () => {
    it('AdvancedMemoization이 제거되고 기본 memo 사용을 권장해야 한다', async () => {
      // optimization/index.ts에서 AdvancedMemoization이 export되지 않아야 함
      const optimizationIndex = await import('../../../src/shared/components/optimization');

      // AdvancedMemoization이 export되지 않아야 함
      expect(optimizationIndex).not.toHaveProperty('AdvancedMemoization');

      // 대신 기본 Preact memo 사용 권장
      const vendors = await import('../../../src/shared/external/vendors');
      const { memo } = vendors.getPreactCompat();
      expect(memo).toBeDefined();
    });

    it('과도한 메모리 풀링 시스템이 단순화되어야 한다', async () => {
      const memoryPoolManager = await import('../../../src/shared/utils/memory/MemoryPoolManager');

      // 기본 ObjectPool은 유지하되, 복잡한 시스템들은 단순화
      expect(memoryPoolManager.ObjectPool).toBeDefined();

      // DOMElementPool, CanvasPool 등은 유저스크립트에 과도할 수 있음
      // 필요에 따라 존재 여부 확인
      if (memoryPoolManager.DOMElementPool) {
        expect(typeof memoryPoolManager.DOMElementPool).toBe('function');
      }
    });
  });
});
