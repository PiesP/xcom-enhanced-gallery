/**
 * @fileoverview Phase 3 TDD Tests - StateManager 초기화 안정화
 * @description StateManager와 signals 간의 초기화 타이밍 및 의존성 문제 해결
 * @version 1.0.0 - TDD RED 단계
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 브라우저 환경 모킹을 위한 타입 확장
declare global {
  interface Window {
    gallery?: {
      signals?: Record<string, any>;
    };
  }
}

describe('Phase 3: StateManager 초기화 안정화', () => {
  beforeEach(() => {
    // 테스트 전 정리
    vi.clearAllMocks();

    // window.gallery 정리
    if (typeof globalThis !== 'undefined' && globalThis.window && 'gallery' in globalThis.window) {
      delete globalThis.window.gallery;
    }
  });

  afterEach(() => {
    // 테스트 후 정리
    vi.clearAllMocks();

    // StateManager 인스턴스 초기화 (필요시)
    if (typeof globalThis !== 'undefined' && globalThis.window && 'gallery' in globalThis.window) {
      delete globalThis.window.gallery;
    }
  });

  describe('의존성 주입 패턴 적용', () => {
    it('StateManager가 signals에 직접 의존하지 않고 주입받아야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');

      // GREEN: 개선된 StateManager는 안전한 fallback 제공
      const stateManager = StateManager.getInstance();

      // gallery signals 없이도 동작해야 함
      expect(stateManager).toBeDefined();
      expect(() => stateManager.getState('gallery')).not.toThrow();

      // GREEN: 이제 안전한 기본값을 반환함
      const state = stateManager.getState('gallery');
      expect(state).toBeDefined();
      expect(state).toEqual({
        isOpen: false,
        currentMediaIndex: 0,
        mediaCount: undefined,
        currentUrl: undefined,
      });
    });

    it('StateManager가 signals 주입을 받을 수 있어야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');

      // GREEN: 이제 signals 주입 기능이 있음
      const stateManager = StateManager.getInstance();

      // 주입 메서드가 있어야 함
      expect(stateManager).toHaveProperty('injectSignals');
      expect(typeof stateManager.injectSignals).toBe('function');
    });

    it('signals가 주입되기 전까지 안전한 상태여야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // signals 없이도 구독/동기화 메서드가 안전해야 함
      expect(() => {
        const unsubscribe = stateManager.subscribe('gallery', () => {});
        unsubscribe();
      }).not.toThrow();

      expect(() => {
        stateManager.syncState('gallery', {
          isOpen: false,
          currentMediaIndex: 0,
        });
      }).not.toThrow();
    });
  });

  describe('초기화 순서 문제 해결', () => {
    it('gallery signals가 초기화되기 전에 StateManager가 안전하게 동작해야 함', async () => {
      // gallery signals 초기화 전 상황 시뮬레이션
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // 현재는 window.gallery.signals에 바로 접근해서 에러 발생 가능
      // 개선 후에는 안전하게 처리되어야 함
      expect(() => {
        stateManager.getState('gallery');
      }).not.toThrow();
    });

    it('signals 초기화 후 StateManager가 자동으로 연결되어야 함', async () => {
      // RED: 현재는 수동 연결이 필요할 수 있음
      // GREEN 후에는 자동 감지 및 연결 메커니즘이 있어야 함

      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // signals 초기화 시뮬레이션
      const mockSignals = {
        isOpen: { value: false, subscribe: vi.fn(() => vi.fn()) },
        currentMediaIndex: { value: 0, subscribe: vi.fn(() => vi.fn()) },
        mediaCount: { value: 0, subscribe: vi.fn(() => vi.fn()) },
        currentUrl: { value: '', subscribe: vi.fn(() => vi.fn()) },
      };

      // window.gallery 설정
      if (globalThis.window) {
        Object.assign(globalThis.window, { gallery: { signals: mockSignals } });
      }

      // StateManager가 자동으로 감지하고 연결해야 함
      // 현재는 초기화 시점에서만 연결됨 (RED)
      // GREEN 후에는 동적 감지 기능이 있어야 함

      const state = stateManager.getState('gallery');
      expect(state).toBeDefined();
    });

    it('여러 번 초기화해도 안전해야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');

      // 여러 번 getInstance 호출해도 안전해야 함
      const instance1 = StateManager.getInstance();
      const instance2 = StateManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(() => {
        instance1.reset();
        instance2.getState('gallery');
      }).not.toThrow();
    });
  });

  describe('에러 처리 및 복구 메커니즘', () => {
    it('signals 연결 실패 시 graceful fallback이 있어야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // 잘못된 signals 구조 시뮬레이션
      if (globalThis.window) {
        Object.assign(globalThis.window, { gallery: { signals: null } });
      }

      // StateManager가 에러 없이 동작해야 함
      expect(() => {
        stateManager.getState('gallery');
        stateManager.syncState('gallery', { isOpen: true, currentMediaIndex: 1 });
      }).not.toThrow();
    });

    it('signals 연결 에러가 복구 가능해야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // 초기 연결 실패
      if (globalThis.window && 'gallery' in globalThis.window) {
        delete globalThis.window.gallery;
      }

      // GREEN: 이제 안전한 기본값을 반환함
      expect(() => stateManager.getState('gallery')).not.toThrow();

      // 나중에 signals 복구
      const mockSignals = {
        isOpen: { value: false, subscribe: vi.fn(() => vi.fn()) },
        currentMediaIndex: { value: 0, subscribe: vi.fn(() => vi.fn()) },
      };
      if (globalThis.window) {
        Object.assign(globalThis.window, { gallery: { signals: mockSignals } });
      }

      // GREEN: 수동 재연결 후 정상 동작
      stateManager.reconnect();
      const state = stateManager.getState('gallery') as
        | { isOpen: boolean; currentMediaIndex: number }
        | undefined;
      expect(state).toBeDefined();
      expect(state?.isOpen).toBe(false);
      expect(state?.currentMediaIndex).toBe(0);
    });

    it('performance metrics가 에러 상황을 추적해야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // 에러 상황 생성
      if (globalThis.window) {
        Object.assign(globalThis.window, { gallery: { signals: null } });
      }

      // 에러가 발생해도 metrics는 기록되어야 함
      stateManager.getState('gallery');

      const metrics = stateManager.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.errorCount).toBe('number');

      // RED: 현재 에러 카운트가 올바르게 증가하는지 확인 필요
      // 실제로는 에러 발생 시 errorCount가 증가해야 함
    });
  });

  describe('성능 및 메모리 최적화', () => {
    it('불필요한 re-initialization을 방지해야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // signals 설정
      const mockSignals = {
        isOpen: { value: false, subscribe: vi.fn(() => vi.fn()) },
        currentMediaIndex: { value: 0, subscribe: vi.fn(() => vi.fn()) },
      };

      // GREEN: 직접 주입 사용 (더 안정적)
      stateManager.injectSignals('gallery', mockSignals);

      // 여러 번 접근해도 초기화는 한 번만 되어야 함
      stateManager.getState('gallery');
      stateManager.getState('gallery');
      stateManager.getState('gallery');

      // GREEN: 직접 주입된 signals의 subscribe가 호출됨
      Object.values(mockSignals).forEach(signal => {
        expect(signal.subscribe).toHaveBeenCalledTimes(1);
      });
    });

    it('메모리 누수 없이 cleanup이 되어야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // 구독자 등록
      const unsubscribe1 = stateManager.subscribe('gallery', vi.fn());
      const unsubscribe2 = stateManager.subscribe('gallery', vi.fn());

      // cleanup
      unsubscribe1();
      unsubscribe2();
      stateManager.reset();

      // 메모리 누수 확인 (구독자 Map이 정리되었는지)
      const metrics = stateManager.getPerformanceMetrics();
      expect(metrics.syncCount).toBe(0); // reset 후 초기 상태
    });
  });

  describe('타입 안전성 강화', () => {
    it('StateManager의 모든 메서드가 타입 안전해야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      // 타입 검사는 컴파일 시점에 이루어지므로 런타임 검증은 제한적
      // 하지만 기본적인 타입 체크는 가능

      expect(() => {
        // 유효한 key만 허용되어야 함
        stateManager.getState('gallery');
        stateManager.subscribe('gallery', () => {});
        stateManager.syncState('gallery', { isOpen: true, currentMediaIndex: 0 });
      }).not.toThrow();

      // RED: 현재 잘못된 타입 전달 시 에러 처리가 불충분할 수 있음
      // GREEN 후에는 런타임 타입 검증이 강화되어야 함
    });
  });
});
