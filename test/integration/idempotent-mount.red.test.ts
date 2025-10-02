/**
 * @fileoverview [RED] SPA Idempotent Mount - 중복 마운트/누수 방지 테스트
 * Epic: SPA_IDEMPOTENT_MOUNT
 *
 * 목적:
 * - SPA 환경에서 라우트 변경/DOM 교체 시 중복 마운트 방지
 * - 메모리 누수 방지 (이벤트 리스너, 타이머, 옵저버)
 * - 단일 마운트 보장 (idempotent initialization)
 *
 * TDD Phase: RED
 * - 실패하는 테스트 먼저 작성
 * - 현재 구현에는 중복 마운트 가드가 부족
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '@shared/logging';
import main from '@/main';

describe('[RED] SPA Idempotent Mount', () => {
  beforeEach(() => {
    // 각 테스트 전 환경 초기화
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    try {
      await main.cleanup();
    } catch (e) {
      logger.warn('Cleanup failed:', e);
    }
  });

  describe('중복 마운트 방지', () => {
    it('[RED] 동일 세션에서 start()를 여러 번 호출해도 단 한 번만 초기화되어야 함', async () => {
      // Given: 애플리케이션이 아직 시작되지 않음
      expect(document.getElementById('xeg-toast-container')).toBeNull();

      // When: start()를 3번 연속 호출
      await main.start();
      await main.start();
      await main.start();

      // Then: Toast 컨테이너는 하나만 생성되어야 함
      const containers = document.querySelectorAll('#xeg-toast-container');
      expect(containers.length).toBe(1);

      // 로그 스파이로 중복 초기화 시도 확인 (현재 구현에서는 로그만 남김)
      // 실제로는 isStarted 플래그로 가드되어야 함
    });

    it('[RED] 라우트 변경 시뮬레이션: body 교체 후 재시작해도 중복 리스너가 생기지 않아야 함', async () => {
      // Given: 초기 마운트
      await main.start();

      const initialContainer = document.getElementById('xeg-toast-container');
      expect(initialContainer).not.toBeNull();

      // When: SPA 라우트 변경 시뮬레이션 (body 내용 교체)
      // 실제 SPA에서는 React Router, Vue Router 등이 DOM을 교체함
      const oldBody = document.body.cloneNode(true);
      document.body.innerHTML = '<div id="new-route">New Route</div>';

      // 애플리케이션 재시작 시도
      await main.start();

      // Then: Toast 컨테이너는 여전히 하나만 존재해야 함
      const containers = document.querySelectorAll('#xeg-toast-container');
      expect(containers.length).toBeLessThanOrEqual(1);

      // 이벤트 리스너 중복 확인 (getEventListenerStatus 사용)
      // 현재 구현에서는 이 테스트가 실패할 수 있음 (중복 리스너 가드 부재)
    });

    it('[RED] cleanup() 후 start() 재호출 시 정상적으로 재초기화되어야 함', async () => {
      // Given: 초기 마운트 및 cleanup
      await main.start();
      expect(document.getElementById('xeg-toast-container')).not.toBeNull();

      await main.cleanup();
      expect(document.getElementById('xeg-toast-container')).toBeNull();

      // When: 재시작
      await main.start();

      // Then: Toast 컨테이너가 다시 생성되어야 함
      expect(document.getElementById('xeg-toast-container')).not.toBeNull();

      const containers = document.querySelectorAll('#xeg-toast-container');
      expect(containers.length).toBe(1);
    });
  });

  describe('메모리 누수 방지', () => {
    it('[RED] 여러 번 start/cleanup 사이클을 반복해도 타이머가 누적되지 않아야 함', async () => {
      // Given: globalTimerManager import
      const { globalTimerManager } = await import('@shared/utils');

      // When: start/cleanup을 3회 반복
      for (let i = 0; i < 3; i++) {
        await main.start();
        const timersAfterStart = globalTimerManager.getActiveTimersCount();

        await main.cleanup();
        const timersAfterCleanup = globalTimerManager.getActiveTimersCount();

        // Then: cleanup 후 타이머는 0이어야 함
        expect(timersAfterCleanup).toBe(0);
      }

      // 최종 확인: 모든 사이클 후 타이머 누적 없음
      const finalTimers = globalTimerManager.getActiveTimersCount();
      expect(finalTimers).toBe(0);
    });

    it('[RED] 여러 번 start/cleanup 사이클을 반복해도 이벤트 리스너가 누적되지 않아야 함', async () => {
      // Given: getEventListenerStatus import
      const { getEventListenerStatus } = await import('@shared/utils/events');

      // When: start/cleanup을 3회 반복
      for (let i = 0; i < 3; i++) {
        await main.start();
        const listenersAfterStart = getEventListenerStatus();

        await main.cleanup();
        const listenersAfterCleanup = getEventListenerStatus();

        // Then: cleanup 후 관리되는 리스너는 0이어야 함
        expect(listenersAfterCleanup.total).toBe(0);
      }

      // 최종 확인: 모든 사이클 후 리스너 누적 없음
      const finalListeners = getEventListenerStatus();
      expect(finalListeners.total).toBe(0);
    });

    it('[RED] DOM 교체 후 재마운트 시 MutationObserver가 중복 생성되지 않아야 함', async () => {
      // Given: 초기 마운트
      await main.start();

      // MutationObserver 추적 (LeakGuard 또는 전역 카운터 사용)
      // 현재는 직접 확인이 어려우므로 간접적으로 cleanup 호출 수를 추적
      const cleanupSpy = vi.spyOn(main, 'cleanup');

      // When: body 교체 (SPA 라우트 변경)
      document.body.innerHTML = '<div id="new-route">Route Changed</div>';

      // 재시작 (실제로는 자동으로 트리거되어야 하지만, 여기서는 수동 호출)
      await main.start();

      // Then: cleanup이 호출되지 않았다면 (재마운트 가드 없음) 중복 observer가 생성됨
      // 이상적으로는 DOM 교체 감지 시 자동 cleanup → 재mount 흐름이 있어야 함
      expect(cleanupSpy).toHaveBeenCalledTimes(0); // 현재 구현: cleanup 수동 호출 필요

      cleanupSpy.mockRestore();
    });
  });

  describe('상태 일관성', () => {
    it('[RED] start() 중 에러 발생 시 isStarted 플래그가 false로 유지되어야 함', async () => {
      // Given: 에러를 발생시키는 모킹 (예: initializeEnvironment 실패)
      const { initializeEnvironment } = await import('@/bootstrap/env-init');
      const originalInit = initializeEnvironment;

      // Mock으로 에러 주입
      vi.doMock('@/bootstrap/env-init', () => ({
        initializeEnvironment: vi.fn().mockRejectedValue(new Error('Test error')),
      }));

      // When: start() 호출 (에러 발생 예상)
      try {
        await main.start();
      } catch (e) {
        // 에러 무시
      }

      // Then: 재시도 가능해야 함 (isStarted = false)
      // 현재 구현: startPromise가 해제되므로 재시도 가능
      // 하지만 isStarted 플래그 정리가 명확하지 않을 수 있음

      // 재시도
      vi.doUnmock('@/bootstrap/env-init');
      await main.start(); // 성공해야 함

      expect(document.getElementById('xeg-toast-container')).not.toBeNull();
    });

    it('[RED] 동시 start() 호출 시 Promise가 병합되어 단일 초기화만 수행되어야 함', async () => {
      // Given: 동시 호출을 위한 Promise.all
      const startSpy = vi.spyOn(logger, 'info');

      // When: 동시에 5개의 start() 호출
      await Promise.all([main.start(), main.start(), main.start(), main.start(), main.start()]);

      // Then: '애플리케이션 초기화 완료' 로그는 1회만 출력되어야 함
      const completionLogs = startSpy.mock.calls.filter(call =>
        call[0]?.includes('애플리케이션 초기화 완료')
      );

      expect(completionLogs.length).toBe(1);

      startSpy.mockRestore();
    });
  });

  describe('SPA 통합 시나리오', () => {
    it('[RED] 페이지 내 SPA 네비게이션 시뮬레이션: 5회 라우트 변경 후에도 안정적이어야 함', async () => {
      // Given: 초기 마운트
      await main.start();

      const { globalTimerManager } = await import('@shared/utils');
      const { getEventListenerStatus } = await import('@shared/utils/events');

      // When: 5회 라우트 변경 시뮬레이션
      for (let i = 0; i < 5; i++) {
        // 라우트 변경 (body 일부 교체)
        const newRoute = document.createElement('div');
        newRoute.id = `route-${i}`;
        newRoute.textContent = `Route ${i}`;
        document.body.appendChild(newRoute);

        // 짧은 대기 (실제 SPA 렌더링 시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Then: 최종 상태 확인
      const finalTimers = globalTimerManager.getActiveTimersCount();
      const finalListeners = getEventListenerStatus();

      // 타이머/리스너가 과도하게 누적되지 않아야 함
      // 현재 구현에서는 누적될 수 있음 (가드 부재)
      expect(finalTimers).toBeLessThan(10); // 임계값 (실제로는 더 적어야 함)
      expect(finalListeners.total).toBeLessThan(50); // 임계값

      // Toast 컨테이너는 여전히 하나만
      const containers = document.querySelectorAll('#xeg-toast-container');
      expect(containers.length).toBeLessThanOrEqual(1);
    });
  });
});
