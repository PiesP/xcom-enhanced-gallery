/**
 * @fileoverview Scroll Position Restoration 테스트
 * Epic: GALLERY-UX-ENHANCEMENT Sub-Epic 1
 * TDD Phase: RED (테스트 작성)
 *
 * 목표:
 * - DOM 앵커 기반 스크롤 위치 복원으로 정확도 향상
 * - 동적 콘텐츠 로딩으로 인한 오차 최소화 (±50px 이내)
 * - 앵커 부재 시 픽셀 기반 fallback 동작
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface ScrollOptions {
  top?: number;
  left?: number;
  behavior?: 'auto' | 'smooth';
}

describe('Scroll Position Restoration (DOM Anchor)', () => {
  let mockPageYOffset: number;
  let scrollAnchorManager: any;

  beforeEach(async () => {
    // 페이지 스크롤 위치 mock
    mockPageYOffset = 0;
    Object.defineProperty(window, 'pageYOffset', {
      configurable: true,
      get: () => mockPageYOffset,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => mockPageYOffset,
    });
    window.scrollTo = vi.fn((x: number | ScrollOptions, y?: number) => {
      if (typeof x === 'number') {
        mockPageYOffset = y ?? x;
      } else {
        mockPageYOffset = x.top ?? 0;
      }
    });

    // ScrollAnchorManager import (구현 전이므로 실패 예상)
    try {
      const module = await import('@shared/utils/scroll/scroll-anchor-manager');
      scrollAnchorManager = module.scrollAnchorManager;
      scrollAnchorManager.clear();
    } catch {
      // RED: 아직 구현되지 않음
      scrollAnchorManager = null;
    }
  });

  afterEach(() => {
    if (scrollAnchorManager && typeof scrollAnchorManager.clear === 'function') {
      scrollAnchorManager.clear();
    }
    mockPageYOffset = 0;

    // 테스트 DOM 정리
    document.body.innerHTML = '';
  });

  describe('앵커 설정 및 조회', () => {
    it('should save tweet element as scroll anchor', () => {
      expect(scrollAnchorManager).toBeDefined();
      expect(typeof scrollAnchorManager.setAnchor).toBe('function');

      // Mock 트윗 요소 생성
      const tweetElement = document.createElement('div');
      tweetElement.setAttribute('data-testid', 'tweet');
      tweetElement.setAttribute('data-tweet-id', '123456');
      tweetElement.style.position = 'absolute';
      tweetElement.style.top = '500px';
      document.body.appendChild(tweetElement);

      // 앵커 설정
      scrollAnchorManager.setAnchor(tweetElement);

      // 앵커 조회
      expect(scrollAnchorManager.getAnchor()).toBe(tweetElement);
    });

    it('should handle null anchor gracefully', () => {
      expect(scrollAnchorManager).toBeDefined();

      scrollAnchorManager.setAnchor(null);
      expect(scrollAnchorManager.getAnchor()).toBeNull();
    });

    it('should store anchor metadata (position, timestamp)', () => {
      expect(scrollAnchorManager).toBeDefined();

      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 300,
        bottom: 400,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      const timestampBefore = Date.now();
      scrollAnchorManager.setAnchor(tweetElement);
      const timestampAfter = Date.now();

      // 내부 상태 접근 (테스트 목적)
      const anchorData = scrollAnchorManager._getAnchorData?.();
      expect(anchorData).toBeDefined();
      expect(anchorData.element).toBe(tweetElement);
      expect(anchorData.offsetTop).toBeGreaterThanOrEqual(0);
      expect(anchorData.timestamp).toBeGreaterThanOrEqual(timestampBefore);
      expect(anchorData.timestamp).toBeLessThanOrEqual(timestampAfter);
    });
  });

  describe('앵커 기반 복원', () => {
    it('should restore scroll to anchor element position', () => {
      expect(scrollAnchorManager).toBeDefined();
      expect(typeof scrollAnchorManager.restoreScroll).toBe('function');

      // JSDOM 기본 뷰포트 명시적 설정 (태블릿 범위)
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 768,
      });

      // 현재 스크롤 위치 설정 (setAnchor 호출 전)
      mockPageYOffset = 0;

      // Mock 트윗 요소 (getBoundingClientRect returns viewport-relative position)
      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 500, // viewport-relative top
        bottom: 600,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      scrollAnchorManager.setAnchor(tweetElement);
      // setAnchor will calculate: offsetTop = rect.top (500) + window.scrollY (0) = 500

      scrollAnchorManager.restoreScroll();

      // 앵커 위치 (offsetTop: 500) - 상단 여백 80px (태블릿) = 420
      const expectedScrollTop = 500 - 80;
      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: expectedScrollTop,
        })
      );
    });

    it('should clamp scroll position to non-negative', () => {
      expect(scrollAnchorManager).toBeDefined();

      // Mock 트윗 요소 (상단에 위치)
      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 50,
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      scrollAnchorManager.setAnchor(tweetElement);
      scrollAnchorManager.restoreScroll();

      // 음수가 아닌 최소값 0
      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: 0,
        })
      );
    });

    it('should fallback to pixel position when anchor is missing', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 앵커 없이 fallback 스크롤 위치만 저장
      window.scrollTo(0, 500);
      scrollAnchorManager.setAnchor(null);

      // 복원 시 픽셀 기반 fallback 사용
      scrollAnchorManager.restoreScroll();
      expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
    });

    it('should fallback when anchor element is removed from DOM', () => {
      expect(scrollAnchorManager).toBeDefined();

      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 300,
        bottom: 300 + 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      // 초기 스크롤 위치 저장
      window.scrollTo(0, 400);
      scrollAnchorManager.setAnchor(tweetElement);

      // 앵커 요소 제거 (SPA 라우팅 시뮬레이션)
      document.body.removeChild(tweetElement);

      // 복원 시 fallback 사용
      scrollAnchorManager.restoreScroll();
      expect(window.scrollTo).toHaveBeenCalledWith(0, 400);
    });
  });

  describe('동적 콘텐츠 처리', () => {
    it('should handle dynamic content changes between set and restore', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 태블릿 뷰포트 설정
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 768,
      });

      // 초기 스크롤 위치
      mockPageYOffset = 0;

      // 초기 트윗 요소
      const tweetElement = document.createElement('div');
      tweetElement.setAttribute('data-testid', 'tweet');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 500,
        bottom: 600,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      scrollAnchorManager.setAnchor(tweetElement);
      // offsetTop = 500 + 0 = 500

      // 동적 콘텐츠 추가 시뮬레이션 (DOM 높이 변화)
      const newContent = document.createElement('div');
      newContent.style.height = '200px';
      document.body.insertBefore(newContent, tweetElement);

      // getBoundingClientRect 업데이트 (element가 아래로 이동)
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 700, // 200px 아래로 이동
        bottom: 800,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });

      // 복원 시 현재 getBoundingClientRect 사용 (동적 변화 반영)
      // offsetTop = 700 + 0 = 700
      scrollAnchorManager.restoreScroll();
      const expectedScrollTop = 700 - 80; // 태블릿 여백
      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: expectedScrollTop,
        })
      );
    });

    it('should maintain accuracy within ±50px tolerance', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 현재 스크롤 위치 설정
      mockPageYOffset = 900;

      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100, // viewport-relative: 스크롤된 상태에서 100px 위치
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      // 앵커 설정: offsetTop = 100 + 900 = 1000
      scrollAnchorManager.setAnchor(tweetElement);

      // 복원: targetY = 1000 - 100 (desktop) = 900
      scrollAnchorManager.restoreScroll();

      // ±50px 허용 오차 내에 있는지 확인
      const scrollToCalls = (window.scrollTo as any).mock.calls;
      expect(scrollToCalls.length).toBeGreaterThan(0);

      const lastCall = scrollToCalls[scrollToCalls.length - 1];
      const callArg = lastCall[0];
      const restoredTop = typeof callArg === 'number' ? callArg : callArg.top;
      const tolerance = 50;
      const originalScrollTop = 900;
      expect(Math.abs(restoredTop - originalScrollTop)).toBeLessThanOrEqual(tolerance);
    });
  });

  describe('통합 시나리오', () => {
    it('should integrate with bodyScrollManager workflow', async () => {
      expect(scrollAnchorManager).toBeDefined();

      // 태블릿 뷰포트 설정
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 768,
      });

      // bodyScrollManager import
      const bodyModule = await import('@shared/utils/scroll/body-scroll-manager');
      const bodyScrollManager = bodyModule.bodyScrollManager;
      bodyScrollManager.clear();

      // 1. 사용자가 타임라인을 스크롤 (300px)
      mockPageYOffset = 300;

      // 2. 트윗 클릭 → 앵커 설정
      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 50, // viewport-relative
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);
      scrollAnchorManager.setAnchor(tweetElement);
      // offsetTop = 50 + 300 = 350

      // 3. 갤러리 열림 → body scroll lock
      bodyScrollManager.lock('gallery', 5);

      // 4. 갤러리 닫힘 → body scroll unlock + 앵커 복원
      bodyScrollManager.unlock('gallery');
      scrollAnchorManager.restoreScroll();

      // 5. 앵커 위치로 복원 확인 (offsetTop: 350 - 80 = 270, 태블릿)
      const expectedScrollTop = 350 - 80;
      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: expectedScrollTop,
        })
      );

      bodyScrollManager.clear();
    });

    it('should clear anchor state on reset', () => {
      expect(scrollAnchorManager).toBeDefined();
      expect(typeof scrollAnchorManager.clear).toBe('function');

      const tweetElement = document.createElement('div');
      document.body.appendChild(tweetElement);
      scrollAnchorManager.setAnchor(tweetElement);

      scrollAnchorManager.clear();

      expect(scrollAnchorManager.getAnchor()).toBeNull();
    });
  });

  describe('에지 케이스', () => {
    it('should handle rapid anchor changes', () => {
      expect(scrollAnchorManager).toBeDefined();

      const tweet1 = document.createElement('div');
      const tweet2 = document.createElement('div');
      tweet1.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100,
        bottom: 100 + 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      tweet2.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 500,
        bottom: 500 + 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweet1);
      document.body.appendChild(tweet2);

      // 빠른 연속 설정
      scrollAnchorManager.setAnchor(tweet1);
      scrollAnchorManager.setAnchor(tweet2);

      // 마지막 앵커가 유지되어야 함
      expect(scrollAnchorManager.getAnchor()).toBe(tweet2);
    });

    it('should handle very large scroll positions', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 태블릿 뷰포트 설정
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 768,
      });

      // 현재 스크롤 위치 설정
      mockPageYOffset = 0;

      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 50000, // viewport-relative (unrealistic but tests boundary)
        bottom: 50100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      scrollAnchorManager.setAnchor(tweetElement);
      // offsetTop = 50000 + 0 = 50000

      scrollAnchorManager.restoreScroll();

      const expectedScrollTop = 50000 - 80; // 태블릿 여백
      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: expectedScrollTop,
        })
      );
    });

    it('should handle browser environment without scrollTo', () => {
      expect(scrollAnchorManager).toBeDefined();

      // scrollTo 제거 (일부 환경)
      const originalScrollTo = window.scrollTo;
      (window as any).scrollTo = undefined;

      const tweetElement = document.createElement('div');
      document.body.appendChild(tweetElement);
      scrollAnchorManager.setAnchor(tweetElement);

      // 오류 없이 처리
      expect(() => {
        scrollAnchorManager.restoreScroll();
      }).not.toThrow();

      // 복원
      window.scrollTo = originalScrollTo;
    });
  });

  describe('Epic GALLERY-UX-REFINEMENT: 뷰포트 반응형 여백 (Viewport-Responsive Margin)', () => {
    it('[RED] should use 60px margin for mobile viewports (<600px)', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 모바일 뷰포트 설정
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 500,
      });

      // 현재 스크롤 위치 설정
      mockPageYOffset = 0;

      // Mock 트윗 요소 (getBoundingClientRect)
      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 500,
        bottom: 600,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      scrollAnchorManager.setAnchor(tweetElement);
      // offsetTop = 500 + 0 = 500

      scrollAnchorManager.restoreScroll();

      // 기대값: 500 - 60 = 440
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 440,
        behavior: 'auto',
      });
    });

    it('[RED] should use 80px margin for tablet viewports (600px-900px)', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 태블릿 뷰포트 설정
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 768,
      });

      // 현재 스크롤 위치 설정
      mockPageYOffset = 0;

      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 500,
        bottom: 600,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      scrollAnchorManager.setAnchor(tweetElement);
      // offsetTop = 500 + 0 = 500

      scrollAnchorManager.restoreScroll();

      // 기대값: 500 - 80 = 420
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 420,
        behavior: 'auto',
      });
    });

    it('[RED] should use 100px margin for desktop viewports (≥900px)', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 데스크톱 뷰포트 설정
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 1080,
      });

      // 현재 스크롤 위치 설정
      mockPageYOffset = 0;

      const tweetElement = document.createElement('div');
      tweetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 500,
        bottom: 600,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      });
      document.body.appendChild(tweetElement);

      scrollAnchorManager.setAnchor(tweetElement);
      // offsetTop = 500 + 0 = 500

      scrollAnchorManager.restoreScroll();

      // 기대값: 500 - 100 = 400
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 400,
        behavior: 'auto',
      });
    });

    it('[RED] should handle edge case: extremely small viewport', () => {
      expect(scrollAnchorManager).toBeDefined();

      // 매우 작은 뷰포트
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 400,
      });

      const tweetElement = document.createElement('div');
      tweetElement.style.position = 'absolute';
      tweetElement.style.top = '50px';
      document.body.appendChild(tweetElement);

      Object.defineProperty(tweetElement, 'offsetTop', {
        configurable: true,
        value: 50,
      });

      scrollAnchorManager.setAnchor(tweetElement);
      scrollAnchorManager.restoreScroll();

      // 기대값: max(0, 50 - 60) = 0 (음수 방지)
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'auto',
      });
    });
  });
});
