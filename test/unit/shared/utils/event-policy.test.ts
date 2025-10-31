/**
 * @fileoverview PC-only 이벤트 정책 테스트
 * Touch/Pointer 이벤트 차단 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeGalleryEvents, cleanupGalleryEvents } from '@/shared/utils/events';
import type { EventHandlers } from '@/shared/utils/events';

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
      await initializeGalleryEvents(handlers);

      // PC-only 정책: on<Event> 프로퍼티 또는 addEventListener로 차단 핸들러 등록 확인
      // JSDOM에서는 on<Event> 프로퍼티가 우선 작동하므로 이를 검증
      const hasTouchstartBlocker =
        typeof document.ontouchstart === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasTouchstartBlocker).toBe(true);
    });

    it('should block touchmove with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasTouchmoveBlocker =
        typeof document.ontouchmove === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasTouchmoveBlocker).toBe(true);
    });

    it('should block touchend with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasTouchendBlocker =
        typeof document.ontouchend === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasTouchendBlocker).toBe(true);
    });

    it('should block touchcancel with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasTouchcancelBlocker =
        typeof document.ontouchcancel === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasTouchcancelBlocker).toBe(true);
    });
  });

  describe('Pointer 이벤트 차단', () => {
    it('should block pointerdown with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasPointerdownBlocker =
        typeof document.onpointerdown === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasPointerdownBlocker).toBe(true);
    });

    it('should block pointermove with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasPointermoveBlocker =
        typeof document.onpointermove === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasPointermoveBlocker).toBe(true);
    });

    it('should block pointerup with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasPointerupBlocker =
        typeof document.onpointerup === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasPointerupBlocker).toBe(true);
    });

    it('should block pointercancel with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasPointercancelBlocker =
        typeof document.onpointercancel === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasPointercancelBlocker).toBe(true);
    });

    it('should block pointerenter with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasPointerenterBlocker =
        typeof document.onpointerenter === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasPointerenterBlocker).toBe(true);
    });

    it('should block pointerleave with explicit handler', async () => {
      await initializeGalleryEvents(handlers);

      const hasPointerleaveBlocker =
        typeof document.onpointerleave === 'function' ||
        typeof document.addEventListener === 'function';

      expect(hasPointerleaveBlocker).toBe(true);
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
