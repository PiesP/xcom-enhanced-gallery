/**
 * @fileoverview Body Scroll Manager - Lazy Loading Trigger 테스트
 * TDD Phase: RED (테스트 작성)
 *
 * 목표:
 * - 갤러리 닫을 때 X.com lazy loading 자동 트리거
 * - scrollBy + dispatchEvent로 스크롤 이벤트 발생
 * - iOS 안정성 고려 (setTimeout 지연)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface BodyScrollManager {
  lock(id: string, priority?: number): void;
  unlock(id: string): void;
  isLocked(id?: string): boolean;
  getActiveLocks(): string[];
  clear(): void;
}

describe('BodyScrollManager - Lazy Loading Trigger', () => {
  let manager: BodyScrollManager;
  let mockPageYOffset: number;
  let scrollBySpy: ReturnType<typeof vi.spyOn>;
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // 이전 테스트의 pending timers를 먼저 실행
    if (vi.isFakeTimers()) {
      vi.runAllTimers();
    }

    // Fake timers로 setTimeout 제어
    vi.useFakeTimers();
    // 모든 pending timers 클리어 (이전 테스트의 setTimeout 제거)
    vi.clearAllTimers();

    document.body.style.overflow = '';

    // scrollTo, pageYOffset mock 설정
    mockPageYOffset = 0;
    Object.defineProperty(window, 'pageYOffset', {
      configurable: true,
      get: () => mockPageYOffset,
    });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      configurable: true,
      get: () => mockPageYOffset,
    });
    window.scrollTo = vi.fn((x: number, y: number) => {
      mockPageYOffset = y;
    });

    // scrollBy mock (lazy loading 트리거용) - 매 테스트마다 새로 생성
    window.scrollBy = vi.fn((x: number, y: number) => {
      // 실제로 스크롤 위치를 변경하지 않음 (1px 이동 후 복원되므로)
    });
    scrollBySpy = window.scrollBy as any;

    // dispatchEvent mock - 매 테스트마다 새로 생성
    window.dispatchEvent = vi.fn((event: Event) => true);
    dispatchEventSpy = window.dispatchEvent as any;

    // BodyScrollManager import
    const module = await import('@shared/utils/scroll/body-scroll-manager');
    manager = module.bodyScrollManager;
    manager.clear();
  });

  afterEach(() => {
    document.body.style.overflow = '';
    if (manager && typeof manager.clear === 'function') {
      manager.clear();
    }
    mockPageYOffset = 0;
    // spy 카운트 명시적 리셋
    if (scrollBySpy) {
      scrollBySpy.mockClear();
    }
    if (dispatchEventSpy) {
      dispatchEventSpy.mockClear();
    }
    // pending timers를 모두 실행하여 다음 테스트에 영향 주지 않도록
    vi.runAllTimers();
    // Fake timers 정리
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('unlock 시 lazy loading 트리거', () => {
    it('should trigger scroll events after unlock to activate lazy loading', async () => {
      // 초기 스크롤 위치 설정
      window.scrollTo(0, 500);
      expect(mockPageYOffset).toBe(500);

      // Lock
      manager.lock('gallery', 5);
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.top).toBe('-500px');

      // Unlock - lazy loading 트리거 기대
      manager.unlock('gallery');

      // 스크롤 위치 복원 확인
      expect(window.pageYOffset).toBe(500);

      // setTimeout 내부의 코드가 실행될 때까지 fake timer 진행
      await vi.advanceTimersByTimeAsync(150);

      // scrollBy 호출 검증 (1px 이동 후 복원)
      expect(scrollBySpy).toHaveBeenCalledWith(0, 1);
      expect(scrollBySpy).toHaveBeenCalledWith(0, -1);

      // scroll/resize 이벤트 발생 검증
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'scroll' }));
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'resize' }));
    });

    it('should trigger lazy loading after last unlock', async () => {
      // 이 테스트는 두 번째 unlock 후 lazy loading이 트리거되는지 검증
      window.scrollTo(0, 300);

      // 두 개의 lock
      manager.lock('gallery', 5);
      manager.lock('settings', 10);

      // 첫 번째 unlock - lazy loading 트리거 안 됨 (settings lock 유지)
      manager.unlock('gallery');
      expect(document.body.style.position).toBe('fixed'); // 여전히 locked

      // spy 초기화
      scrollBySpy.mockClear();
      dispatchEventSpy.mockClear();

      // 두 번째 unlock - 모든 lock 해제, lazy loading 트리거됨
      manager.unlock('settings');
      expect(document.body.style.position).toBe(''); // unlock됨

      // 시간 진행
      await vi.advanceTimersByTimeAsync(150);

      // 두 번째 unlock 후에는 lazy loading 트리거됨
      expect(scrollBySpy).toHaveBeenCalledWith(0, 1);
      expect(scrollBySpy).toHaveBeenCalledWith(0, -1);
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'scroll' }));
    });

    it('should handle edge case: zero scroll position', async () => {
      window.scrollTo(0, 0);

      manager.lock('gallery', 5);
      manager.unlock('gallery');

      await vi.advanceTimersByTimeAsync(150);

      // 스크롤 위치가 0이어도 이벤트는 발생해야 함
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'scroll' }));
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'resize' }));
    });

    it('should handle edge case: page end position', async () => {
      // 페이지 끝 위치 시뮬레이션 (매우 큰 값)
      const largeScrollY = 10000;
      window.scrollTo(0, largeScrollY);

      manager.lock('gallery', 5);
      manager.unlock('gallery');

      expect(window.pageYOffset).toBe(largeScrollY);

      await vi.advanceTimersByTimeAsync(150);

      // 큰 스크롤 값에서도 정상 동작
      expect(scrollBySpy).toHaveBeenCalled();
      expect(dispatchEventSpy).toHaveBeenCalled();
    });
  });

  describe('지연 시간 검증', () => {
    it('should use appropriate delay for DOM stabilization', async () => {
      window.scrollTo(0, 200);
      manager.lock('gallery', 5);
      manager.unlock('gallery');

      // 50ms 후에는 아직 호출 안 됨
      await vi.advanceTimersByTimeAsync(50);
      expect(scrollBySpy).not.toHaveBeenCalled();

      // 100ms 후에는 호출됨 (기본 지연 시간)
      await vi.advanceTimersByTimeAsync(100);
      expect(scrollBySpy).toHaveBeenCalled();
    });
  });

  describe('iOS 안정성', () => {
    it('should work correctly on iOS Safari simulation', async () => {
      // iOS Safari 시뮬레이션 (User-Agent 체크 없이 동작 검증)
      window.scrollTo(0, 400);
      manager.lock('gallery', 5);
      manager.unlock('gallery');

      await vi.advanceTimersByTimeAsync(150);

      // position: fixed + top 패턴 사용 확인
      expect(window.scrollTo).toHaveBeenCalledWith(0, 400);
      expect(scrollBySpy).toHaveBeenCalled();
    });
  });
});
