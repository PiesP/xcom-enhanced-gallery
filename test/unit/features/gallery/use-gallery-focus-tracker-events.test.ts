/**
 * @file useGalleryFocusTracker 이벤트 구독 테스트
 * @description galleryIndexEvents를 구독하여 명시적 네비게이션 시 autoFocusIndex를 즉시 동기화
 * @scope 활성 통합 테스트 (Solid.js 반응성 + 이벤트 시스템 검증)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { getSolid } from '@shared/external/vendors';
import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { galleryIndexEvents } from '@shared/state/signals/gallery.signals';

const { createRoot } = getSolid();

describe('useGalleryFocusTracker: 이벤트 구독 및 동기화', () => {
  setupGlobalTestIsolation();

  let dispose: (() => void) | null = null;
  let container: HTMLElement;

  beforeEach(() => {
    // fake timers 설정 (debounce 테스트용)
    vi.useFakeTimers();

    container = document.createElement('div');
    container.style.height = '600px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (dispose) {
      dispose();
      dispose = null;
    }
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  describe('navigate:complete 이벤트 구독', () => {
    it('should subscribe to navigate:complete events', () => {
      const getCurrentIndex = vi.fn(() => 0);
      let focusedIndexGetter: (() => number | null) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        focusedIndexGetter = tracker.focusedIndex;
        return disposeRoot;
      });

      // navigate:complete 이벤트 발행
      galleryIndexEvents.emit('navigate:complete', { index: 2, trigger: 'button' });

      // autoFocusIndex가 즉시 업데이트되어야 함
      expect(focusedIndexGetter?.()).toBe(2);
    });

    it('should update autoFocusIndex on button trigger', () => {
      const getCurrentIndex = vi.fn(() => 0);
      let focusedIndexGetter: (() => number | null) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        focusedIndexGetter = tracker.focusedIndex;
        return disposeRoot;
      });

      galleryIndexEvents.emit('navigate:complete', { index: 3, trigger: 'button' });

      expect(focusedIndexGetter?.()).toBe(3);
    });

    it('should update autoFocusIndex on click trigger', () => {
      const getCurrentIndex = vi.fn(() => 0);
      let focusedIndexGetter: (() => number | null) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        focusedIndexGetter = tracker.focusedIndex;
        return disposeRoot;
      });

      galleryIndexEvents.emit('navigate:complete', { index: 1, trigger: 'click' });

      expect(focusedIndexGetter?.()).toBe(1);
    });

    it('should update autoFocusIndex on keyboard trigger', () => {
      const getCurrentIndex = vi.fn(() => 0);
      let focusedIndexGetter: (() => number | null) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        focusedIndexGetter = tracker.focusedIndex;
        return disposeRoot;
      });

      galleryIndexEvents.emit('navigate:complete', { index: 4, trigger: 'keyboard' });

      expect(focusedIndexGetter?.()).toBe(4);
    });

    it('should update container data-focused attribute', async () => {
      const getCurrentIndex = vi.fn(() => 0);

      dispose = createRoot(disposeRoot => {
        useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        return disposeRoot;
      });

      galleryIndexEvents.emit('navigate:complete', { index: 5, trigger: 'button' });

      // debounce 대기 (debouncedUpdateContainerFocusAttribute: 50ms)
      await vi.advanceTimersByTimeAsync(60);

      expect(container.getAttribute('data-focused')).toBe('5');
      expect(container.getAttribute('data-focused-index')).toBe('5');
    });
  });

  describe('이벤트 구독 생명주기', () => {
    it('should unsubscribe on cleanup', () => {
      const getCurrentIndex = vi.fn(() => 0);
      let focusedIndexGetter: (() => number | null) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        focusedIndexGetter = tracker.focusedIndex;
        return disposeRoot;
      });

      // 초기 이벤트 동작 확인
      galleryIndexEvents.emit('navigate:complete', { index: 1, trigger: 'button' });
      expect(focusedIndexGetter?.()).toBe(1);

      // cleanup 후에는 이벤트가 무시되어야 함
      dispose?.();
      dispose = null;

      galleryIndexEvents.emit('navigate:complete', { index: 2, trigger: 'button' });
      dispose = null;

      galleryIndexEvents.emit('navigate:complete', { index: 2, trigger: 'button' });
      // focusedIndex는 여전히 1이어야 함 (업데이트되지 않음)
      expect(focusedIndexGetter?.()).toBe(1);
    });
  });

  describe('동기화 타이밍', () => {
    it('should batch state updates for autoFocusIndex and container attribute', async () => {
      const getCurrentIndex = vi.fn(() => 0);

      dispose = createRoot(disposeRoot => {
        useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        return disposeRoot;
      });

      galleryIndexEvents.emit('navigate:complete', { index: 8, trigger: 'click' });

      // Phase 69: debouncedUpdateContainerFocusAttribute로 인한 50ms 대기
      await vi.advanceTimersByTimeAsync(60);

      // batch() 내에서 동시에 업데이트되어야 함
      expect(container.getAttribute('data-focused')).toBe('8');
    });
  });

  describe('자동 포커스 적용', () => {
    // debounce 타이밍 대기 (debouncedScheduleSync: 100ms, 스크롤: 100ms)
    it('should schedule auto focus with delay after navigation', async () => {
      const getCurrentIndex = vi.fn(() => 0);
      const mockElement = document.createElement('div');
      mockElement.tabIndex = 0;
      container.appendChild(mockElement);

      let registerItem: ((index: number, element: HTMLElement | null) => void) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
          autoFocusDebounce: 100,
        });

        registerItem = tracker.registerItem;
        return disposeRoot;
      });

      registerItem?.(2, mockElement);

      // 네비게이션 이벤트
      galleryIndexEvents.emit('navigate:complete', { index: 2, trigger: 'keyboard' });

      // 즉시는 포커스되지 않음
      expect(document.activeElement).not.toBe(mockElement);

      // delay(100) + 스크롤 대기(100) + margin
      await vi.advanceTimersByTimeAsync(250);

      expect(document.activeElement).toBe(mockElement);
    });
  });

  describe('disabled 상태', () => {
    it('should not process navigation events when disabled', () => {
      const getCurrentIndex = vi.fn(() => 0);
      let focusedIndexGetter: (() => number | null) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: false, // disabled
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        focusedIndexGetter = tracker.focusedIndex;
        return disposeRoot;
      });

      galleryIndexEvents.emit('navigate:complete', { index: 3, trigger: 'button' });

      // disabled 상태에서는 이벤트가 무시됨
      expect(focusedIndexGetter?.()).toBeNull();
    });
  });

  describe('여러 네비게이션 이벤트', () => {
    it('should handle rapid navigation events correctly', () => {
      const getCurrentIndex = vi.fn(() => 0);
      let focusedIndexGetter: (() => number | null) | null = null;

      dispose = createRoot(disposeRoot => {
        const tracker = useGalleryFocusTracker({
          container,
          isEnabled: true,
          getCurrentIndex,
          shouldAutoFocus: true,
        });

        focusedIndexGetter = tracker.focusedIndex;
        return disposeRoot;
      });

      // 연속된 네비게이션 이벤트
      galleryIndexEvents.emit('navigate:complete', { index: 1, trigger: 'button' });
      galleryIndexEvents.emit('navigate:complete', { index: 2, trigger: 'button' });
      galleryIndexEvents.emit('navigate:complete', { index: 3, trigger: 'button' });

      // 마지막 이벤트가 적용되어야 함
      expect(focusedIndexGetter?.()).toBe(3);
    });
  });
});
