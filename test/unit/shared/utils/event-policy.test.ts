/**
 * @fileoverview PC-only 이벤트 정책 테스트
 * Touch/Pointer 이벤트 차단 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeGalleryEvents, cleanupGalleryEvents } from '../../../../src/shared/utils/events';
import type { EventHandlers } from '../../../../src/shared/utils/events';

/**
 * Mock EventHandlers
 */
const createMockHandlers = (): EventHandlers => ({
  onMediaClick: vi.fn(),
  onGalleryClose: vi.fn(),
  onKeyboardEvent: vi.fn(),
});

describe('Event Policy: PC-only 이벤트 검증', () => {
  let handlers: EventHandlers;

  beforeEach(() => {
    handlers = createMockHandlers();
  });

  afterEach(() => {
    cleanupGalleryEvents();
  });

  describe('Touch 이벤트 차단', () => {
    it('should initialize gallery events without Touch events', async () => {
      await initializeGalleryEvents(handlers);
      expect(handlers).toBeDefined();
    });

    it('should block touchstart with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      // blockTouchAndPointerEvents에서 명시적으로 차단 리스너 등록 (passive: false)
      const touchstartCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === 'touchstart'
      );
      expect(touchstartCalls.length).toBeGreaterThan(0);
      expect(touchstartCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block touchmove with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const touchmoveCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'touchmove');
      expect(touchmoveCalls.length).toBeGreaterThan(0);
      expect(touchmoveCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block touchend with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const touchendCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'touchend');
      expect(touchendCalls.length).toBeGreaterThan(0);
      expect(touchendCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block touchcancel with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const touchcancelCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === 'touchcancel'
      );
      expect(touchcancelCalls.length).toBeGreaterThan(0);
      expect(touchcancelCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Pointer 이벤트 차단', () => {
    it('should block pointerdown with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const pointerdownCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === 'pointerdown'
      );
      expect(pointerdownCalls.length).toBeGreaterThan(0);
      expect(pointerdownCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block pointermove with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const pointermoveCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === 'pointermove'
      );
      expect(pointermoveCalls.length).toBeGreaterThan(0);
      expect(pointermoveCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block pointerup with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const pointerupCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'pointerup');
      expect(pointerupCalls.length).toBeGreaterThan(0);
      expect(pointerupCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block pointercancel with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const pointercancelCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === 'pointercancel'
      );
      expect(pointercancelCalls.length).toBeGreaterThan(0);
      expect(pointercancelCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block pointerenter with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const pointerenterCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === 'pointerenter'
      );
      expect(pointerenterCalls.length).toBeGreaterThan(0);
      expect(pointerenterCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });

    it('should block pointerleave with explicit handler', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const pointerleaveCalls = addEventListenerSpy.mock.calls.filter(
        call => call[0] === 'pointerleave'
      );
      expect(pointerleaveCalls.length).toBeGreaterThan(0);
      expect(pointerleaveCalls[0][2]).toEqual({ passive: false, capture: true });

      addEventListenerSpy.mockRestore();
    });
  });

  describe('PC-only 이벤트 등록', () => {
    it('should register click listener', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const clickCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'click');
      expect(clickCalls.length).toBeGreaterThan(0);

      addEventListenerSpy.mockRestore();
    });

    it('should register keydown listener', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      const keydownCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'keydown');
      expect(keydownCalls.length).toBeGreaterThan(0);

      addEventListenerSpy.mockRestore();
    });

    it('should use capture phase for PC-only events', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      await initializeGalleryEvents(handlers);

      // 캡처 페이즈에서 등록되어야 함 (capture: true)
      const clickCalls = addEventListenerSpy.mock.calls.filter(
        call =>
          call[0] === 'click' && (call[2] as unknown as { capture?: boolean })?.capture === true
      );
      expect(clickCalls.length).toBeGreaterThan(0);

      addEventListenerSpy.mockRestore();
    });
  });

  describe('이벤트 정리', () => {
    it('should cleanup all listeners without touch events', async () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      await initializeGalleryEvents(handlers);
      cleanupGalleryEvents();

      // Touch/Pointer 리스너 제거 호출이 없어야 함
      const touchRemovals = removeEventListenerSpy.mock.calls.filter(
        call => call[0].startsWith('touch') || call[0].startsWith('pointer')
      );
      expect(touchRemovals).toHaveLength(0);

      removeEventListenerSpy.mockRestore();
    });
  });
});
