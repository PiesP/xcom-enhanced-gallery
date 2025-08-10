/**
 * @fileoverview REFACTOR 단계: 서비스 통합 최적화 및 마이그레이션 테스트
 * @description 통합된 서비스들의 성능 최적화와 기존 코드 마이그레이션을 검증
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  unifiedTimerService,
  unifiedResourceService,
  unifiedServiceManager,
} from '@shared/services/unified-services';

describe('🔧 TDD Phase 2: 서비스 클래스 통합 - REFACTOR 단계', () => {
  beforeEach(() => {
    // 각 테스트 전 상태 초기화
    unifiedTimerService.clearAllTimers();
    unifiedResourceService.releaseAll();
    unifiedServiceManager.reset();
  });

  describe('성능 최적화 검증', () => {
    test('should handle large numbers of timers efficiently', () => {
      const startTime = performance.now();
      const timerCount = 1000;

      // 대량의 타이머 생성
      for (let i = 0; i < timerCount; i++) {
        unifiedTimerService.setTimeout(`timer-${i}`, () => {}, 5000);
      }

      expect(unifiedTimerService.getActiveTimerCount()).toBe(timerCount);

      // 전체 정리 시간 측정
      const clearStartTime = performance.now();
      unifiedTimerService.clearAllTimers();
      const clearEndTime = performance.now();

      expect(unifiedTimerService.getActiveTimerCount()).toBe(0);

      // 성능 검증 (1000개 타이머를 1ms 이내에 정리)
      expect(clearEndTime - clearStartTime).toBeLessThan(10);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // 전체 작업이 50ms 이내
    });

    test('should handle large numbers of resources efficiently', () => {
      const startTime = performance.now();
      const resourceCount = 1000;
      let cleanupCount = 0;

      // 대량의 리소스 등록
      for (let i = 0; i < resourceCount; i++) {
        unifiedResourceService.register(`resource-${i}`, () => {
          cleanupCount++;
        });
      }

      expect(unifiedResourceService.getResourceCount()).toBe(resourceCount);

      // 전체 정리 시간 측정
      const clearStartTime = performance.now();
      unifiedResourceService.releaseAll();
      const clearEndTime = performance.now();

      expect(unifiedResourceService.getResourceCount()).toBe(0);
      expect(cleanupCount).toBe(resourceCount);

      // 성능 검증 (1000개 리소스를 10ms 이내에 정리)
      expect(clearEndTime - clearStartTime).toBeLessThan(20);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // 전체 작업이 100ms 이내
    });

    test('should minimize memory footprint', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 리소스 생성 및 정리
      for (let i = 0; i < 100; i++) {
        unifiedTimerService.setTimeout(`test-${i}`, () => {}, 1000);
        unifiedResourceService.register(`resource-${i}`, () => {});
      }

      unifiedTimerService.clearAllTimers();
      unifiedResourceService.releaseAll();

      // 메모리가 정리되었는지 확인 (GC 이후)
      if ((performance as any).memory) {
        const afterMemory = (performance as any).memory.usedJSHeapSize;
        // 메모리 증가가 크지 않아야 함
        expect(afterMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB 이하
      }
    });
  });

  describe('마이그레이션 호환성 검증', () => {
    test('should maintain backward compatibility with Performance TimerService API', () => {
      // Performance TimerService의 SimpleTimerService API 호환성
      const mockCallback = () => {};

      // set/clear API (Performance에서 사용하던 방식)
      unifiedTimerService.set('perf-timer', mockCallback, 100);
      expect(unifiedTimerService.hasTimer('perf-timer')).toBe(true);

      unifiedTimerService.clear('perf-timer');
      expect(unifiedTimerService.hasTimer('perf-timer')).toBe(false);
    });

    test('should maintain backward compatibility with Unified TimerService API', () => {
      // Unified TimerService의 setTimeout/clearTimeout API 호환성
      const mockCallback = () => {};

      unifiedTimerService.setTimeout('unified-timer', mockCallback, 100);
      expect(unifiedTimerService.hasTimer('unified-timer')).toBe(true);

      unifiedTimerService.clearTimeout('unified-timer');
      expect(unifiedTimerService.hasTimer('unified-timer')).toBe(false);
    });

    test('should maintain backward compatibility with Services TimerService handle API', () => {
      // Services TimerService의 handle 기반 API 호환성
      const mockCallback = () => {};

      const handle = unifiedTimerService.createTimer(mockCallback, 100);
      expect(handle.id).toMatch(/^auto_\d+$/);
      expect(typeof handle.cancel).toBe('function');

      // handle.cancel() 호출
      handle.cancel();
      expect(unifiedTimerService.hasTimer(handle.id)).toBe(false);
    });

    test('should maintain backward compatibility with Performance ResourceService API', () => {
      // Performance ResourceService의 단순 API 호환성
      let cleanupCalled = false;
      const cleanup = () => {
        cleanupCalled = true;
      };

      const resourceId = unifiedResourceService.registerSimple(cleanup);
      expect(resourceId).toMatch(/^simple_\d+$/);

      unifiedResourceService.releaseSimple(cleanup);
      expect(cleanupCalled).toBe(false); // releaseSimple은 cleanup을 호출하지 않음
    });

    test('should maintain backward compatibility with Unified ResourceService API', () => {
      // Unified ResourceService의 키 기반 API 호환성
      let cleanupCalled = false;
      const cleanup = () => {
        cleanupCalled = true;
      };

      unifiedResourceService.register('unified-resource', cleanup);
      expect(unifiedResourceService.hasResource('unified-resource')).toBe(true);

      const released = unifiedResourceService.release('unified-resource');
      expect(released).toBe(true);
      expect(cleanupCalled).toBe(true);
    });
  });

  describe('서비스 관리 최적화', () => {
    test('should provide efficient service registration and lookup', () => {
      const serviceCount = 100;
      const services: Record<string, { id: number }> = {};

      // 대량 서비스 등록 시간 측정
      const startTime = performance.now();

      for (let i = 0; i < serviceCount; i++) {
        const service = { id: i };
        services[`service-${i}`] = service;
        unifiedServiceManager.register(`service-${i}`, service);
      }

      const registrationTime = performance.now() - startTime;
      expect(registrationTime).toBeLessThan(50); // 등록이 빨라야 함

      // 대량 서비스 조회 시간 측정
      const lookupStartTime = performance.now();

      for (let i = 0; i < serviceCount; i++) {
        const service = unifiedServiceManager.get<{ id: number }>(`service-${i}`);
        expect(service.id).toBe(i);
      }

      const lookupTime = performance.now() - lookupStartTime;
      expect(lookupTime).toBeLessThan(20); // 조회도 빨라야 함
    });

    test('should prevent memory leaks in service management', () => {
      const initialServices = unifiedServiceManager.getRegisteredServices().length;

      // 서비스 등록 및 정리 반복
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 10; i++) {
          unifiedServiceManager.register(`cycle-${cycle}-service-${i}`, { value: i });
        }
        unifiedServiceManager.reset();
      }

      const finalServices = unifiedServiceManager.getRegisteredServices().length;
      expect(finalServices).toBe(initialServices); // 메모리 누수 없음
    });
  });

  describe('통합 API 일관성 검증', () => {
    test('should provide consistent error handling across all services', () => {
      // 존재하지 않는 타이머 제거 시 오류 없이 처리
      expect(() => {
        unifiedTimerService.clearTimeout('non-existent');
      }).not.toThrow();

      // 존재하지 않는 리소스 해제 시 false 반환
      const released = unifiedResourceService.release('non-existent');
      expect(released).toBe(false);

      // 존재하지 않는 서비스 조회 시 명확한 에러 메시지
      expect(() => {
        unifiedServiceManager.get('non-existent');
      }).toThrow('서비스를 찾을 수 없습니다: non-existent');
    });

    test('should provide consistent cleanup behavior', () => {
      // 모든 서비스에서 cleanup이 완전히 동작해야 함
      unifiedTimerService.setTimeout('test-timer', () => {}, 1000);
      unifiedResourceService.register('test-resource', () => {});
      unifiedServiceManager.register('test-service', { cleanup: () => {} });

      // 개별 정리
      unifiedTimerService.clearAllTimers();
      unifiedResourceService.releaseAll();
      unifiedServiceManager.cleanup();

      // 상태 확인
      expect(unifiedTimerService.getActiveTimerCount()).toBe(0);
      expect(unifiedResourceService.getResourceCount()).toBe(0);
      expect(unifiedServiceManager.has('test-service')).toBe(true); // cleanup은 제거하지 않음

      // 최종 리셋
      unifiedServiceManager.reset();
      expect(unifiedServiceManager.getRegisteredServices()).toHaveLength(0);
    });
  });
});
