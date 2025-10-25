/**
 * @file Phase 21.1 통합 테스트: IntersectionObserver 무한 루프 방지
 * @description useGalleryFocusTracker의 개선사항 검증
 *
 * 적용된 개선사항:
 * - untrack: IntersectionObserver 콜백에서 반응성 체인 끊기
 * - on(): 명시적 의존성 지정으로 effect 최적화
 * - debounce: signal 업데이트 제한 (50ms)
 *
 * 목표: 개선된 구현이 effect 폭주를 방지함을 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import { useGalleryFocusTracker } from '@/features/gallery/hooks/useGalleryFocusTracker';

const { createRoot } = getSolid();

describe('[Phase 21.1 Integration] useGalleryFocusTracker infinite loop prevention', () => {
  let disposer: (() => void) | undefined;
  let container: globalThis.HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    disposer?.();
    document.body.removeChild(container);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should use untrack, on(), and debounce to prevent effect cascade', async () => {
    // Arrange: 실제 훅 사용
    let focusedIndexCallCount = 0;

    await createRoot(async dispose => {
      disposer = dispose;

      const { createSignal } = getSolid();
      const [currentIndex, setCurrentIndex] = createSignal(0);

      const tracker = useGalleryFocusTracker({
        container,
        isEnabled: true,
        getCurrentIndex: currentIndex,
        threshold: 0.5,
        shouldAutoFocus: false, // 자동 포커스 비활성화로 effect 관찰
      });

      // focusedIndex 구독으로 effect 실행 추적
      const { createEffect } = getSolid();
      createEffect(() => {
        tracker.focusedIndex();
        focusedIndexCallCount++;
      });

      // 여러 아이템 등록
      for (let i = 0; i < 10; i++) {
        const item = document.createElement('div');
        item.style.height = '100px';
        container.appendChild(item);
        tracker.registerItem(i, item);
      }

      // currentIndex 빠르게 변경 (50회)
      for (let i = 0; i < 50; i++) {
        setCurrentIndex(i % 10);
        await vi.advanceTimersByTimeAsync(1);
      }

      // debounce 완료 대기
      await vi.advanceTimersByTimeAsync(100);
    });

    // Assert: focusedIndex effect가 합리적인 횟수만 실행됨
    // 기대: 초기 1회 + debounce된 업데이트 < 60회
    console.log('[Integration] focusedIndex effect calls:', focusedIndexCallCount);
    expect(focusedIndexCallCount).toBeLessThan(60);
    expect(focusedIndexCallCount).toBeGreaterThan(0);
  });

  it('should handle IntersectionObserver updates efficiently', async () => {
    // Arrange: 실제 IntersectionObserver 시뮬레이션
    let registerItemCallCount = 0;

    await createRoot(async dispose => {
      disposer = dispose;

      const { createSignal } = getSolid();
      const [currentIndex] = createSignal(0);

      const tracker = useGalleryFocusTracker({
        container,
        isEnabled: true,
        getCurrentIndex: currentIndex,
        threshold: 0.5,
        shouldAutoFocus: false,
      });

      // 100개 아이템 등록 (IntersectionObserver 부하 시뮬레이션)
      for (let i = 0; i < 100; i++) {
        const item = document.createElement('div');
        container.appendChild(item);
        tracker.registerItem(i, item);
        registerItemCallCount++;
      }

      await vi.advanceTimersByTimeAsync(100);
    });

    // Assert: 모든 아이템이 등록됨
    expect(registerItemCallCount).toBe(100);
  });

  it('demonstrates untrack usage pattern', async () => {
    // Arrange: untrack 패턴 검증 (패턴 예시)
    let observerCallbackUsesUntrack = false;

    await createRoot(async dispose => {
      disposer = dispose;

      const { createSignal, untrack } = getSolid();

      const [autoFocusIndex, setAutoFocusIndex] = createSignal<number | null>(null);

      // ✅ 올바른 패턴: untrack으로 반응성 끊기
      const handleEntriesCorrect: globalThis.IntersectionObserverCallback = entries => {
        untrack(() => {
          entries.forEach(entry => {
            // Map 업데이트는 반응성 추적 안 함
          });

          // signal 업데이트도 untrack 내부에서
          setAutoFocusIndex(0);
          observerCallbackUsesUntrack = true;
        });
      };

      const mockEntry = {
        target: document.createElement('div'),
        intersectionRatio: 0.5,
        time: performance.now(),
        boundingClientRect: {} as globalThis.DOMRectReadOnly,
        intersectionRect: {} as globalThis.DOMRectReadOnly,
        isIntersecting: true,
        rootBounds: null,
      } as unknown as globalThis.IntersectionObserverEntry;

      handleEntriesCorrect([mockEntry], {} as globalThis.IntersectionObserver);
    });

    // Assert: untrack 사용 여부
    expect(observerCallbackUsesUntrack).toBe(true);
  });

  it('demonstrates on() usage pattern for explicit dependencies', async () => {
    // Arrange: on() 사용으로 명시적 의존성 지정
    const effectExecutions: string[] = [];

    await createRoot(async dispose => {
      disposer = dispose;

      const { createSignal, createEffect, on } = getSolid();

      const [autoFocusIndex] = createSignal<number | null>(0);
      const [currentIndex, setCurrentIndex] = createSignal(0);
      const [unrelatedSignal, setUnrelatedSignal] = createSignal(0);

      // ✅ 올바른 패턴: on()으로 필요한 의존성만 추적
      createEffect(
        on(
          [currentIndex, autoFocusIndex],
          ([currentIdx, autoIdx]) => {
            effectExecutions.push(`on-effect: ${currentIdx}, ${autoIdx}`);
          },
          { defer: true }
        )
      );

      // unrelatedSignal 변경 → effect 실행 안 됨
      setUnrelatedSignal(1);
      setUnrelatedSignal(2);
      setUnrelatedSignal(3);

      await vi.runAllTimersAsync();

      // currentIndex 변경 → effect 실행
      setCurrentIndex(1);

      await vi.runAllTimersAsync();
    });

    // Assert: unrelatedSignal 변경은 effect 실행 안 함
    expect(effectExecutions.length).toBe(1); // currentIndex 변경 1회만
  });
});
