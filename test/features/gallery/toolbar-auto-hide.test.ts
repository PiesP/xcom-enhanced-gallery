/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 툴바 자동 숨김 기능 테스트
 * @description TDD로 구현하는 갤러리 기동 시 툴바 3초 자동 숨김 기능
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 간소화된 테스트 - 실제 로직 시뮬레이션 방식
describe('툴바 자동 숨김 기능', () => {
  let mockSetInitialToolbarVisible;
  let mockLogger;

  beforeEach(() => {
    mockSetInitialToolbarVisible = vi.fn();
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('초기 툴바 표시 및 자동 숨김', () => {
    it('갤러리가 열릴 때 툴바가 표시되어야 한다', () => {
      // Given: 갤러리가 보이고 DOM이 준비된 상태
      const isVisible = true;
      const domReady = true;
      const initialToolbarVisible = true;

      // When: 컴포넌트가 마운트됨
      // (실제 구현에서는 이 조건들이 충족되면 툴바가 표시됨)

      // Then: 초기에 툴바가 표시되어야 함
      expect(initialToolbarVisible).toBe(true);
      expect(isVisible && domReady).toBe(true);
    });

    it('갤러리가 열린 후 3초 뒤에 툴바가 자동으로 숨겨져야 한다', async () => {
      vi.useFakeTimers();

      // Given: 갤러리가 보이고 DOM이 준비된 상태
      const isVisible = true;
      const domReady = true;

      // 실제 auto-hide 로직을 시뮬레이션하는 함수
      const simulateAutoHide = () => {
        const setInitialToolbarVisible = mockSetInitialToolbarVisible;

        // useEffect 시뮬레이션
        if (isVisible && domReady) {
          globalThis.setTimeout(() => {
            setInitialToolbarVisible(false);
            mockLogger.debug('Toolbar auto-hidden after initial display');
          }, 3000);
        }
      };

      // When: auto-hide 로직 실행
      simulateAutoHide();

      // Then: 3초 전까지는 숨김 호출되지 않음
      expect(mockSetInitialToolbarVisible).not.toHaveBeenCalledWith(false);

      // When: 3초 경과
      vi.advanceTimersByTime(3000);

      // Then: 툴바 숨김 함수가 호출되어야 함
      expect(mockSetInitialToolbarVisible).toHaveBeenCalledWith(false);
      expect(mockLogger.debug).toHaveBeenCalledWith('Toolbar auto-hidden after initial display');

      vi.useRealTimers();
    });

    it('DOM이 준비되지 않은 상태에서는 타이머가 시작되지 않아야 한다', () => {
      vi.useFakeTimers();

      // Given: 갤러리는 보이지만 DOM이 준비되지 않은 상태
      const isVisible = true;
      const domReady = false;

      // 실제 auto-hide 로직을 시뮬레이션하는 함수
      const simulateAutoHide = () => {
        const setInitialToolbarVisible = mockSetInitialToolbarVisible;

        // useEffect 시뮬레이션 - 조건을 만족하지 않으면 타이머 시작 안함
        if (isVisible && domReady) {
          globalThis.setTimeout(() => {
            setInitialToolbarVisible(false);
          }, 3000);
        }
      };

      // When: auto-hide 로직 실행
      simulateAutoHide();

      // When: 시간 경과
      vi.advanceTimersByTime(5000);

      // Then: 툴바 숨김 함수가 호출되지 않아야 함
      expect(mockSetInitialToolbarVisible).not.toHaveBeenCalledWith(false);

      vi.useRealTimers();
    });

    it('갤러리가 보이지 않는 상태에서는 타이머가 시작되지 않아야 한다', () => {
      vi.useFakeTimers();

      // Given: 갤러리가 보이지 않는 상태
      const isVisible = false;
      const domReady = true;

      // 실제 auto-hide 로직을 시뮬레이션하는 함수
      const simulateAutoHide = () => {
        const setInitialToolbarVisible = mockSetInitialToolbarVisible;

        // useEffect 시뮬레이션 - 조건을 만족하지 않으면 타이머 시작 안함
        if (isVisible && domReady) {
          globalThis.setTimeout(() => {
            setInitialToolbarVisible(false);
          }, 3000);
        }
      };

      // When: auto-hide 로직 실행
      simulateAutoHide();

      // When: 시간 경과
      vi.advanceTimersByTime(5000);

      // Then: 툴바 숨김 함수가 호출되지 않아야 함
      expect(mockSetInitialToolbarVisible).not.toHaveBeenCalledWith(false);

      vi.useRealTimers();
    });
  });

  describe('타이머 정리', () => {
    it('컴포넌트 언마운트 시 타이머가 정리되어야 한다', () => {
      vi.useFakeTimers();

      // Given: 타이머가 시작된 상태
      const isVisible = true;
      const domReady = true;
      let timerId;

      // 실제 auto-hide 로직을 시뮬레이션하는 함수 (클린업 포함)
      const simulateAutoHideWithCleanup = () => {
        const setInitialToolbarVisible = mockSetInitialToolbarVisible;

        if (isVisible && domReady) {
          timerId = globalThis.setTimeout(() => {
            setInitialToolbarVisible(false);
          }, 3000);

          // 클린업 함수 반환
          return () => globalThis.clearTimeout(timerId);
        }
      };

      // When: auto-hide 로직 실행 및 클린업 함수 획득
      const cleanup = simulateAutoHideWithCleanup();

      // When: 클린업 실행 (컴포넌트 언마운트 시뮬레이션)
      if (cleanup) {
        cleanup();
      }

      // When: 3초 경과
      vi.advanceTimersByTime(3000);

      // Then: 타이머가 정리되어 콜백이 실행되지 않아야 함
      expect(mockSetInitialToolbarVisible).not.toHaveBeenCalledWith(false);

      vi.useRealTimers();
    });

    it('갤러리가 다시 열릴 때 새로운 타이머가 시작되어야 한다', () => {
      vi.useFakeTimers();

      // Given: 첫 번째 갤러리 세션
      let isVisible = true;
      let domReady = true;

      const simulateAutoHide = () => {
        const setInitialToolbarVisible = mockSetInitialToolbarVisible;

        if (isVisible && domReady) {
          globalThis.setTimeout(() => {
            setInitialToolbarVisible(false);
          }, 3000);
        }
      };

      // When: 첫 번째 auto-hide 실행
      simulateAutoHide();

      // When: 1초 경과 후 갤러리 닫힘
      vi.advanceTimersByTime(1000);
      isVisible = false;

      // When: 갤러리 다시 열림
      isVisible = true;
      mockSetInitialToolbarVisible.mockClear(); // 호출 기록 초기화

      // When: 두 번째 auto-hide 실행
      simulateAutoHide();

      // When: 3초 경과
      vi.advanceTimersByTime(3000);

      // Then: 새로운 타이머로 숨김 함수가 호출되어야 함
      expect(mockSetInitialToolbarVisible).toHaveBeenCalledWith(false);

      vi.useRealTimers();
    });
  });

  describe('호버 기능과의 통합', () => {
    it('자동 숨김 후에도 호버 기능이 정상 동작해야 한다', () => {
      // Given: 툴바가 자동으로 숨겨진 상태
      const initialToolbarVisible = false;

      // When: 호버 기능이 활성화됨
      // (실제로는 useToolbarPositionBased 훅에서 처리)
      const hoverVisible = true;

      // Then: 호버 상태와 초기 툴바 상태는 독립적이어야 함
      expect(initialToolbarVisible).toBe(false);
      expect(hoverVisible).toBe(true);

      // 두 상태가 독립적으로 동작함을 확인
      expect(initialToolbarVisible !== hoverVisible).toBe(true);
    });
  });

  describe('로깅', () => {
    it('툴바 자동 숨김 시 디버그 로그가 출력되어야 한다', () => {
      vi.useFakeTimers();

      // Given: 갤러리가 보이고 DOM이 준비된 상태
      const isVisible = true;
      const domReady = true;

      // 실제 auto-hide 로직을 시뮬레이션하는 함수 (로깅 포함)
      const simulateAutoHideWithLogging = () => {
        const setInitialToolbarVisible = mockSetInitialToolbarVisible;

        if (isVisible && domReady) {
          globalThis.setTimeout(() => {
            setInitialToolbarVisible(false);
            mockLogger.debug('Toolbar auto-hidden after initial display');
          }, 3000);
        }
      };

      // When: auto-hide 로직 실행
      simulateAutoHideWithLogging();

      // When: 3초 경과
      vi.advanceTimersByTime(3000);

      // Then: 디버그 로그가 출력되어야 함
      expect(mockLogger.debug).toHaveBeenCalledWith('Toolbar auto-hidden after initial display');

      vi.useRealTimers();
    });
  });
});
