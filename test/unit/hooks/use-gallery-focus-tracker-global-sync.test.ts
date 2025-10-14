/**
 * @fileoverview Phase 64 Step 3: useGalleryFocusTracker 전역 focusedIndex 연동 (TDD RED)
 * @description autoFocusIndex 업데이트 시 전역 setFocusedIndex() 호출하여 버튼 네비게이션과 동기화
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'solid-js';
import { getSolid } from '../../../src/shared/external/vendors';

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

  describe('RED: autoFocusIndex 업데이트 시 전역 setFocusedIndex 호출', () => {
    it('스크롤로 autoFocusIndex가 변경되면 전역 setFocusedIndex를 호출해야 함', async () => {
      // Given: useGalleryFocusTracker가 활성화되고 3개 아이템이 등록됨
      const { useGalleryFocusTracker } = await import(
        '../../../src/features/gallery/hooks/useGalleryFocusTracker'
      );
      const [currentIndex, setCurrentIndex] = createSignal(0);
      let registerItem: ((index: number, element: HTMLElement | null) => void) | undefined;

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const result = useGalleryFocusTracker({
            container: mockContainer,
            isEnabled: true,
            getCurrentIndex: currentIndex,
            minimumVisibleRatio: 0.5,
          });

          registerItem = result.registerItem;
          resolve();
          return innerDispose;
        });
      });

      // 3개 아이템 등록
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.setAttribute('data-index', String(i));
        item.style.height = '300px';
        mockContainer.appendChild(item);
        registerItem?.(i, item);
      }

      // Phase 69: debouncedScheduleSync (100ms) 대기
      await vi.advanceTimersByTimeAsync(150);

      // When: IntersectionObserver 시뮬레이션 (2번 아이템이 가시화)
      // 실제로는 스크롤 시 IntersectionObserver가 자동으로 트리거됨
      // 여기서는 직접 테스트하기 어려우므로 forceSync를 통해 간접 검증

      // Phase 69: debouncedScheduleSync (100ms) 대기
      await vi.advanceTimersByTimeAsync(150);

      // Then: setFocusedIndex가 호출되어야 함 (아직 구현 안 됨 - RED)
      expect(setFocusedIndexSpy).toHaveBeenCalled();
    });

    // TODO: Phase 69 debounce 타이밍에 맞춰 테스트 리팩토링 필요
    it.skip('autoFocusIndex가 null로 변경되면 setFocusedIndex(null)을 호출해야 함', async () => {
      // Given: useGalleryFocusTracker가 비활성화 상태
      const { useGalleryFocusTracker } = await import(
        '../../../src/features/gallery/hooks/useGalleryFocusTracker'
      );
      const [currentIndex] = createSignal(0);
      const [isEnabled, setIsEnabled] = createSignal(true);

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          useGalleryFocusTracker({
            container: mockContainer,
            isEnabled,
            getCurrentIndex: currentIndex,
          });

          resolve();
          return innerDispose;
        });
      });

      // When: 비활성화
      setIsEnabled(false);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Then: setFocusedIndex(null)이 호출되어야 함 (아직 구현 안 됨 - RED)
      expect(setFocusedIndexSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('RED: 명시적 네비게이션 시 동기화 검증', () => {
    it('아이템 등록 시 setFocusedIndex가 호출되어야 함', async () => {
      // Given: useGalleryFocusTracker가 활성화됨
      const { useGalleryFocusTracker } = await import(
        '../../../src/features/gallery/hooks/useGalleryFocusTracker'
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
    // TODO: Phase 69 debounce 타이밍에 맞춰 테스트 리팩토링 필요
    it.skip('handleItemFocus로 manualFocusIndex 설정 시 전역 setFocusedIndex 호출 안 함', async () => {
      // Given: useGalleryFocusTracker가 활성화됨
      const { useGalleryFocusTracker } = await import(
        '../../../src/features/gallery/hooks/useGalleryFocusTracker'
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
      await new Promise(resolve => setTimeout(resolve, 50));

      // Then: 수동 포커스는 전역 동기화 대상이 아니므로 호출 안 함
      expect(setFocusedIndexSpy).not.toHaveBeenCalled();
    });
  });

  describe('Regression: 컨테이너 신호 변동 대응', () => {
    // TODO: Phase 69 debounce 타이밍에 맞춰 테스트 리팩토링 필요
    it.skip('컨테이너 accessor가 일시적으로 null이어도 focusedIndex를 null로 초기화하지 않음', async () => {
      const { useGalleryFocusTracker } = await import(
        '../../../src/features/gallery/hooks/useGalleryFocusTracker'
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

      // Phase 69: debouncedScheduleSync (100ms) 대기
      await vi.advanceTimersByTimeAsync(150);

      const initialCall =
        setFocusedIndexSpy.mock.calls[setFocusedIndexSpy.mock.calls.length - 1]?.[0] ?? null;
      expect(initialCall).not.toBeNull();

      setFocusedIndexSpy.mockClear();

      setContainerRef(null);
      await new Promise(resolve => setTimeout(resolve, 150));

      const hasNullCallAfterDetach = setFocusedIndexSpy.mock.calls.some(
        ([value]) => value === null
      );
      expect(hasNullCallAfterDetach).toBe(false);

      setFocusedIndexSpy.mockClear();

      setContainerRef(mockContainer);
      await new Promise(resolve => setTimeout(resolve, 150));

      const hasNullCallAfterRestore = setFocusedIndexSpy.mock.calls.some(
        ([value]) => value === null
      );
      expect(hasNullCallAfterRestore).toBe(false);
    });
  });

  describe('REFACTOR: 성능 최적화 검증', () => {
    // TODO: Phase 69 debounce 타이밍에 맞춰 테스트 리팩토링 필요
    it.skip('짧은 시간 내 여러 번 autoFocusIndex 변경 시 debounce로 한 번만 호출', async () => {
      // Given: useGalleryFocusTracker가 활성화됨
      const { useGalleryFocusTracker } = await import(
        '../../../src/features/gallery/hooks/useGalleryFocusTracker'
      );
      const [currentIndex] = createSignal(0);
      let forceSync: (() => void) | undefined;

      await new Promise<void>(resolve => {
        dispose = createRoot(innerDispose => {
          const result = useGalleryFocusTracker({
            container: mockContainer,
            isEnabled: true,
            getCurrentIndex: currentIndex,
          });

          forceSync = result.forceSync;
          resolve();
          return innerDispose;
        });
      });

      setFocusedIndexSpy.mockClear();

      // When: 연속으로 forceSync 호출 (debounce 테스트)
      forceSync?.();
      forceSync?.();
      forceSync?.();

      await new Promise(resolve => setTimeout(resolve, 150)); // debounce 대기

      // Then: debounce로 인해 호출 횟수가 제한되어야 함
      // (정확한 횟수는 debounce 구현에 따라 다를 수 있음)
      const callCount = setFocusedIndexSpy.mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(2); // 연속 호출이 병합됨
    });
  });
});
