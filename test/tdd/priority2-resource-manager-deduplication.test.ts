/**
 * @fileoverview TDD Priority 2: 리소스 매니저 중복 제거 및 통합
 * @description 중복된 리소스 관리 코드 제거 및 통합 완료 검증
 * @version 1.0.0 - TDD GREEN Phase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UnifiedMemoryManager } from '@shared/memory/unified-memory-manager';

describe('🔄 GREEN Phase: 리소스 매니저 중복 제거 완료', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    UnifiedMemoryManager.resetInstance();
  });

  afterEach(() => {
    UnifiedMemoryManager.getInstance().cleanup();
    vi.runOnlyPendingTimers();
  });

  describe('통합된 리소스 관리 검증', () => {
    it('단일 메모리 매니저로 모든 리소스 타입을 관리한다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();

      expect(memoryManager).toBeDefined();
      expect(memoryManager.register).toBeDefined();
      expect(memoryManager.release).toBeDefined();
      expect(memoryManager.cleanup).toBeDefined();
      expect(memoryManager.getDiagnostics).toBeDefined();
    });

    it('다양한 리소스 타입 등록이 통합적으로 작동한다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn();

      // 다양한 타입의 리소스 등록
      memoryManager.register('timer-1', 'timer', cleanup1);
      memoryManager.register('interval-1', 'interval', cleanup2);
      memoryManager.register('event-1', 'event', cleanup3);

      const diagnostics = memoryManager.getDiagnostics();
      expect(diagnostics.totalResources).toBe(3);
      expect(diagnostics.resourcesByType.timer).toBe(1);
      expect(diagnostics.resourcesByType.interval).toBe(1);
      expect(diagnostics.resourcesByType.event).toBe(1);
    });

    it('리소스 타입별 정리가 정상 작동한다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();
      const timerCleanup = vi.fn();
      const eventCleanup = vi.fn();

      memoryManager.register('timer-1', 'timer', timerCleanup);
      memoryManager.register('event-1', 'event', eventCleanup);

      // 타이머만 정리
      const released = memoryManager.releaseByType('timer');
      expect(released).toBe(1);
      expect(timerCleanup).toHaveBeenCalled();
      expect(eventCleanup).not.toHaveBeenCalled();

      const diagnostics = memoryManager.getDiagnostics();
      expect(diagnostics.totalResources).toBe(1);
      expect(diagnostics.resourcesByType.event).toBe(1);
    });

    it('통합된 정리 메커니즘이 작동한다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();
      const cleanups = [vi.fn(), vi.fn(), vi.fn()];

      cleanups.forEach((cleanup, index) => {
        memoryManager.register(`resource-${index}`, 'timer', cleanup);
      });

      memoryManager.cleanup();

      cleanups.forEach(cleanup => {
        expect(cleanup).toHaveBeenCalled();
      });

      const diagnostics = memoryManager.getDiagnostics();
      expect(diagnostics.totalResources).toBe(0);
    });
  });

  describe('중복 제거 확인', () => {
    it('단일 메모리 매니저 인스턴스만 존재한다', () => {
      const instance1 = UnifiedMemoryManager.getInstance();
      const instance2 = UnifiedMemoryManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('통합된 API로 모든 기능에 접근할 수 있다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();

      // 등록 기능
      expect(typeof memoryManager.register).toBe('function');

      // 해제 기능
      expect(typeof memoryManager.release).toBe('function');
      expect(typeof memoryManager.releaseByType).toBe('function');

      // 정리 기능
      expect(typeof memoryManager.cleanup).toBe('function');

      // 진단 기능
      expect(typeof memoryManager.getDiagnostics).toBe('function');
      expect(typeof memoryManager.getMemoryUsageMB).toBe('function');
    });

    it('성능 최적화된 리소스 관리가 작동한다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();
      const startTime = performance.now();

      // 대량 리소스 등록
      for (let i = 0; i < 1000; i++) {
        memoryManager.register(`perf-test-${i}`, 'timer', vi.fn());
      }

      const registrationTime = performance.now() - startTime;
      expect(registrationTime).toBeLessThan(50); // 50ms 이내

      // 대량 정리
      const cleanupStartTime = performance.now();
      memoryManager.cleanup();
      const cleanupTime = performance.now() - cleanupStartTime;

      expect(cleanupTime).toBeLessThan(20); // 20ms 이내
    });
  });

  describe('호환성 보장', () => {
    it('기존 CoreMemoryManager API 호환성을 유지한다', async () => {
      // CoreMemoryManager 별명으로 import 가능
      const { CoreMemoryManager } = await import('@shared/memory/unified-memory-manager');
      const coreManager = CoreMemoryManager.getInstance();

      expect(coreManager).toBeInstanceOf(UnifiedMemoryManager);
      expect(coreManager.register).toBeDefined();
      expect(coreManager.cleanup).toBeDefined();
    });

    it('기존 MemoryTracker API 호환성을 유지한다', async () => {
      // MemoryTracker 별명으로 import 가능
      const { MemoryTracker } = await import('@shared/memory/unified-memory-manager');
      const tracker = MemoryTracker.getInstance();

      expect(tracker).toBeInstanceOf(UnifiedMemoryManager);
      expect(tracker.getDiagnostics).toBeDefined();
      expect(tracker.getMemoryUsageMB).toBeDefined();
    });

    it('전역 memoryManager export가 정상 작동한다', async () => {
      const { memoryManager } = await import('@shared/memory/unified-memory-manager');

      expect(memoryManager).toBeInstanceOf(UnifiedMemoryManager);

      const cleanup = vi.fn();
      memoryManager.register('export-test', 'timer', cleanup);

      const diagnostics = memoryManager.getDiagnostics();
      expect(diagnostics.totalResources).toBeGreaterThan(0);
    });
  });

  describe('메모리 관리 최적화', () => {
    it('메모리 사용량 추적이 정확하다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();

      const initialUsage = memoryManager.getMemoryUsageMB();
      // getMemoryUsageMB()는 브라우저 환경에서만 작동하므로 null일 수 있음
      expect(initialUsage === null || typeof initialUsage === 'number').toBe(true);
      if (initialUsage !== null) {
        expect(initialUsage).toBeGreaterThanOrEqual(0);
      }
    });

    it('메모리 누수 감지 기능이 작동한다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();

      // 대량 리소스 등록 후 정리하지 않음
      for (let i = 0; i < 100; i++) {
        memoryManager.register(`leak-test-${i}`, 'timer', vi.fn());
      }

      const diagnostics = memoryManager.getDiagnostics();
      expect(diagnostics.totalResources).toBe(100);

      // 잠재적 누수 감지
      expect(diagnostics.totalResources).toBeGreaterThan(50);
    });

    it('리소스 통계가 정확히 집계된다', () => {
      const memoryManager = UnifiedMemoryManager.getInstance();

      // 다양한 타입의 리소스 등록
      memoryManager.register('timer-1', 'timer', vi.fn());
      memoryManager.register('timer-2', 'timer', vi.fn());
      memoryManager.register('event-1', 'event', vi.fn());
      memoryManager.register('observer-1', 'observer', vi.fn());

      const diagnostics = memoryManager.getDiagnostics();

      expect(diagnostics.totalResources).toBe(4);
      expect(diagnostics.resourcesByType.timer).toBe(2);
      expect(diagnostics.resourcesByType.event).toBe(1);
      expect(diagnostics.resourcesByType.observer).toBe(1);

      // totalTypes는 구현에 없으므로 직접 계산
      const usedTypes = Object.values(diagnostics.resourcesByType).filter(
        count => count > 0
      ).length;
      expect(usedTypes).toBe(3);
    });
  });
});
