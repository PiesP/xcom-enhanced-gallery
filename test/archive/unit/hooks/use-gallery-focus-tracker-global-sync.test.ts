/**
 * @fileoverview Phase 64 Step 3: useGalleryFocusTracker 전역 focusedIndex 연동 (TDD RED)
 * @description autoFocusIndex 업데이트 시 전역 setFocusedIndex() 호출하여 버튼 네비게이션과 동기화
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'solid-js';
import { getSolid } from '../../../../src/shared/external/vendors';

const { createSignal } = getSolid();

// Mock 설정
vi.mock('../../../src/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock gallery.signals with setFocusedIndex spy
const setFocusedIndexSpy = vi.fn();
const galleryIndexEvents = {
  on: vi.fn(() => vi.fn()),
  emit: vi.fn(),
};

vi.mock('../../../src/shared/state/signals/gallery.signals', () => ({
  galleryIndexEvents,
  setFocusedIndex: setFocusedIndexSpy,
}));

describe('Phase 64 Step 3: useGalleryFocusTracker - 전역 focusedIndex 연동', () => {
  let dispose: (() => void) | undefined;
  let mockContainer: globalThis.HTMLDivElement;

  beforeEach(() => {
    // Phase 69: fake timers 설정 (debounce 테스트용)
    vi.useFakeTimers();

    // DOM 환경 설정
    mockContainer = document.createElement('div');
    mockContainer.className = 'xeg-gallery-container';
    mockContainer.style.height = '500px';
    mockContainer.style.overflow = 'auto';
    document.body.appendChild(mockContainer);

    // Mock 초기화
    vi.clearAllMocks();
  });

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('RED: 명시적 네비게이션 시 동기화 검증', () => {
    it('아이템 등록 시 setFocusedIndex가 호출되어야 함', async () => {
      // Given: useGalleryFocusTracker가 활성화됨
      const { useGalleryFocusTracker } = await import(
        '../../../../src/features/gallery/hooks/useGalleryFocusTracker'
      );
      const [currentIndex] = createSignal(0);
      let registerItem: ((index: number, element: HTMLElement | null) => void) | undefined;

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const result = useGalleryFocusTracker({
            container: mockContainer,
            isEnabled: true,
            getCurrentIndex: currentIndex,
          });

          registerItem = result.registerItem;
          resolve();
          return innerDispose;
        });
      });

      setFocusedIndexSpy.mockClear();

      // When: 첫 번째 아이템 등록
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      mockContainer.appendChild(item);
      registerItem?.(0, item);

      // Phase 69: debouncedScheduleSync (100ms) 대기
      await vi.advanceTimersByTimeAsync(150);

      // Then: recomputeFocus가 실행되며 setFocusedIndex(0) 호출
      expect(setFocusedIndexSpy).toHaveBeenCalled();
    });
  });

  describe('GREEN: 수동 포커스는 전역 동기화하지 않음', () => {
    // Phase 74: debounce 타이밍 수정 (fake timers 사용)
    it('handleItemFocus로 manualFocusIndex 설정 시 전역 setFocusedIndex 호출 안 함', async () => {
      // Given: useGalleryFocusTracker가 활성화됨
      const { useGalleryFocusTracker } = await import(
        '../../../../src/features/gallery/hooks/useGalleryFocusTracker'
      );
      const [currentIndex] = createSignal(0);
      let handleItemFocus: ((index: number) => void) | undefined;

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const result = useGalleryFocusTracker({
            container: mockContainer,
            isEnabled: true,
            getCurrentIndex: currentIndex,
          });

          handleItemFocus = result.handleItemFocus;
          resolve();
          return innerDispose;
        });
      });

      setFocusedIndexSpy.mockClear();

      // When: 수동 포커스 설정
      handleItemFocus?.(2);
      await vi.advanceTimersByTimeAsync(60);

      // Then: 수동 포커스는 전역 동기화 대상이 아니므로 호출 안 함
      expect(setFocusedIndexSpy).not.toHaveBeenCalled();
    });
  });

  describe('Regression: 컨테이너 신호 변동 대응', () => {
    // Phase 74: debounce 타이밍 수정 (fake timers 사용)
    it('컨테이너 accessor가 일시적으로 null이어도 focusedIndex를 null로 초기화하지 않음', async () => {
      const { useGalleryFocusTracker } = await import(
        '../../../../src/features/gallery/hooks/useGalleryFocusTracker'
      );
      const [currentIndex] = createSignal(0);
      const [containerRef, setContainerRef] = createSignal<globalThis.HTMLDivElement | null>(
        mockContainer
      );
      let registerItem: ((index: number, element: HTMLElement | null) => void) | undefined;

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const result = useGalleryFocusTracker({
            container: containerRef,
            isEnabled: true,
            getCurrentIndex: currentIndex,
          });

          registerItem = result.registerItem;
          resolve();
          return innerDispose;
        });
      });

      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      item.style.height = '300px';
      mockContainer.appendChild(item);
      registerItem?.(0, item);

      // Phase 74: debouncedScheduleSync (100ms) 대기
      await vi.advanceTimersByTimeAsync(150);

      const initialCall =
        setFocusedIndexSpy.mock.calls[setFocusedIndexSpy.mock.calls.length - 1]?.[0] ?? null;
      expect(initialCall).not.toBeNull();

      setFocusedIndexSpy.mockClear();

      setContainerRef(null);
      await vi.advanceTimersByTimeAsync(150);

      const hasNullCallAfterDetach = setFocusedIndexSpy.mock.calls.some(
        ([value]) => value === null
      );
      expect(hasNullCallAfterDetach).toBe(false);

      setFocusedIndexSpy.mockClear();

      setContainerRef(mockContainer);
      await vi.advanceTimersByTimeAsync(150);

      const hasNullCallAfterRestore = setFocusedIndexSpy.mock.calls.some(
        ([value]) => value === null
      );
      expect(hasNullCallAfterRestore).toBe(false);
    });
  });
});
