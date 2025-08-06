/**
 * @fileoverview TDD Priority 1: 메모리 관리자 중복 제거 - GREEN Phase
 * @description CoreMemoryManager와 MemoryTracker 통합 완료 검증
 * @version 1.0.0 - TDD GREEN Phase
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedMemoryManager, memoryManager } from '@shared/memory/unified-memory-manager';

describe('� GREEN Phase: 메모리 관리자 통합 완료', () => {
  let manager: UnifiedMemoryManager;

  beforeEach(() => {
    manager = UnifiedMemoryManager.getInstance();
  });

  afterEach(() => {
    manager.cleanup();
    UnifiedMemoryManager.resetInstance();
  });

  describe('통합된 메모리 관리자 기능 검증', () => {
    it('단일 메모리 관리자 인스턴스만 존재한다', () => {
      const instance1 = UnifiedMemoryManager.getInstance();
      const instance2 = UnifiedMemoryManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(UnifiedMemoryManager);
    });

    it('통합된 메모리 관리자는 모든 기본 기능을 제공한다', () => {
      // CoreMemoryManager 기능 확인
      expect(typeof manager.register).toBe('function');
      expect(typeof manager.release).toBe('function');
      expect(typeof manager.releaseByType).toBe('function');

      // MemoryTracker 기능 확인
      expect(typeof manager.getMemoryInfo).toBe('function');
      expect(typeof manager.getMemoryUsageMB).toBe('function');
      expect(typeof manager.trackMemory).toBe('function');

      // 공통 기능 확인
      expect(typeof manager.cleanup).toBe('function');
      expect(typeof manager.getDiagnostics).toBe('function');
    });

    it('중복된 리소스 등록을 방지한다', () => {
      const cleanup = vi.fn();
      const id = 'test-resource';

      // 첫 번째 등록
      manager.register(id, 'timer', cleanup);

      // 두 번째 등록 시도 (중복)
      manager.register(id, 'timer', cleanup);

      const diagnostics = manager.getDiagnostics();
      expect(diagnostics.totalResources).toBe(1); // 하나만 등록되어야 함
    });

    it('메모리 추적 기능이 작동한다', () => {
      manager.trackMemory('test-component', 1024);

      const memoryInfo = manager.getMemoryInfo();
      const memoryUsage = manager.getMemoryUsageMB();

      // 메모리 정보가 반환되어야 함 (브라우저 환경에 따라 null일 수 있음)
      expect(memoryInfo === null || typeof memoryInfo.heap === 'number').toBe(true);
      expect(memoryUsage === null || typeof memoryUsage === 'number').toBe(true);
    });

    it('리소스 정리가 완전히 수행된다', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();

      manager.register('resource1', 'timer', cleanup1);
      manager.register('resource2', 'event', cleanup2);

      const beforeCleanup = manager.getDiagnostics();
      expect(beforeCleanup.totalResources).toBe(2);

      manager.cleanup();

      const afterCleanup = manager.getDiagnostics();
      expect(afterCleanup.totalResources).toBe(0);
      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });
  });

  describe('성능 요구사항 충족', () => {
    it('대량 리소스 등록/해제가 빠르게 처리된다', () => {
      const startTime = performance.now();

      // 1000개 리소스 등록
      const cleanupFunctions: Array<() => void> = [];
      for (let i = 0; i < 1000; i++) {
        const cleanup = vi.fn();
        cleanupFunctions.push(cleanup);
        manager.register(`resource-${i}`, 'timer', cleanup);
      }

      // 전체 정리
      manager.cleanup();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100ms 미만이어야 함
      expect(duration).toBeLessThan(100);

      // 모든 cleanup 함수가 호출되었는지 확인
      cleanupFunctions.forEach(cleanup => {
        expect(cleanup).toHaveBeenCalled();
      });
    });
  });

  describe('호환성 요구사항 충족', () => {
    it('전역 memoryManager 인스턴스에 접근할 수 있다', () => {
      expect(memoryManager).toBeInstanceOf(UnifiedMemoryManager);
      expect(memoryManager).toBe(UnifiedMemoryManager.getInstance());
    });

    it('진단 정보를 정확히 반환한다', () => {
      const cleanup = vi.fn();
      manager.register('test-1', 'timer', cleanup);
      manager.register('test-2', 'event', cleanup);
      manager.register('test-3', 'timer', cleanup);

      const diagnostics = manager.getDiagnostics();

      expect(diagnostics.totalResources).toBe(3);
      expect(diagnostics.resourcesByType.timer).toBe(2);
      expect(diagnostics.resourcesByType.event).toBe(1);
      expect(typeof diagnostics.status).toBe('string');
      expect(['normal', 'warning', 'critical', 'unknown']).toContain(diagnostics.status);
    });

    it('타입별 리소스 해제가 작동한다', () => {
      const timerCleanup1 = vi.fn();
      const timerCleanup2 = vi.fn();
      const eventCleanup = vi.fn();

      manager.register('timer-1', 'timer', timerCleanup1);
      manager.register('timer-2', 'timer', timerCleanup2);
      manager.register('event-1', 'event', eventCleanup);

      const releasedCount = manager.releaseByType('timer');

      expect(releasedCount).toBe(2);
      expect(timerCleanup1).toHaveBeenCalled();
      expect(timerCleanup2).toHaveBeenCalled();
      expect(eventCleanup).not.toHaveBeenCalled();

      const diagnostics = manager.getDiagnostics();
      expect(diagnostics.totalResources).toBe(1);
      expect(diagnostics.resourcesByType.event).toBe(1);
    });

    it('중복된 리소스 등록을 방지해야 함', () => {
      // 같은 ID로 중복 등록 시 경고 또는 무시
      expect(false).toBe(true); // 의도적 실패
    });

    it('메모리 누수 감지 기능이 작동해야 함', () => {
      // 메모리 임계값 초과 시 경고
      expect(false).toBe(true); // 의도적 실패
    });

    it('리소스 정리가 완전히 수행되어야 함', () => {
      // cleanup() 호출 시 모든 리소스가 해제되어야 함
      expect(false).toBe(true); // 의도적 실패
    });
  });

  describe('성능 요구사항', () => {
    it('메모리 추적 오버헤드가 최소화되어야 함', () => {
      // 메모리 추적으로 인한 성능 저하가 5% 미만이어야 함
      expect(false).toBe(true); // 의도적 실패
    });

    it('대량 리소스 등록/해제가 빠르게 처리되어야 함', () => {
      // 1000개 리소스 등록/해제가 100ms 미만이어야 함
      expect(false).toBe(true); // 의도적 실패
    });
  });

  describe('호환성 요구사항', () => {
    it('기존 CoreMemoryManager 사용 코드가 호환되어야 함', () => {
      // 기존 API 호환성 유지
      expect(false).toBe(true); // 의도적 실패
    });

    it('기존 MemoryTracker 사용 코드가 호환되어야 함', () => {
      // 기존 API 호환성 유지
      expect(false).toBe(true); // 의도적 실패
    });
  });
});
