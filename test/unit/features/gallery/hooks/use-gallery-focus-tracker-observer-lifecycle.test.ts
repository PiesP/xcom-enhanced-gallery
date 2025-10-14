/**
 * @file Phase 68.1 RED: Observer 생명주기 최적화 테스트
 * @description IntersectionObserver 인스턴스가 불필요하게 재생성되지 않도록 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';

const { createRoot, createSignal } = getSolid();

describe('Phase 68.1: Observer Lifecycle Optimization', () => {
  let dispose: (() => void) | null = null;
  let container: globalThis.HTMLDivElement;
  let observerInstances: globalThis.IntersectionObserver[] = [];
  let originalObserver: typeof globalThis.IntersectionObserver;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    container.style.height = '600px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);

    // IntersectionObserver 생성 추적
    observerInstances = [];
    originalObserver = globalThis.IntersectionObserver;

    class MockIntersectionObserver implements globalThis.IntersectionObserver {
      readonly root: globalThis.Element | globalThis.Document | null;
      readonly rootMargin = '0px';
      readonly thresholds: ReadonlyArray<number>;

      constructor(
        public callback: globalThis.IntersectionObserverCallback,
        public options?: globalThis.IntersectionObserverInit
      ) {
        this.root = options?.root ?? null;
        this.thresholds = Array.isArray(options?.threshold)
          ? options!.threshold!
          : [options?.threshold ?? 0];
        observerInstances.push(this);
      }

      observe(): void {
        /* noop */
      }
      unobserve(): void {
        /* noop */
      }
      disconnect(): void {
        /* noop */
      }
      takeRecords(): globalThis.IntersectionObserverEntry[] {
        return [];
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    if (dispose) {
      dispose();
      dispose = null;
    }
    document.body.removeChild(container);
    vi.restoreAllMocks();
    vi.useRealTimers();
    globalThis.IntersectionObserver = originalObserver;
  });

  it('[RED] observer는 안정적인 스크롤 중 재초기화되지 않아야 함', async () => {
    // Given: useGalleryFocusTracker 초기화
    let registerItem: ((index: number, element: HTMLElement | null) => void) | undefined;

    await createRoot(async innerDispose => {
      dispose = innerDispose;

      const [currentIndex] = createSignal(0);
      const tracker = useGalleryFocusTracker({
        container: () => container,
        isEnabled: true,
        getCurrentIndex: currentIndex,
      });

      registerItem = tracker.registerItem;
    });

    // 3개 아이템 등록
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.style.height = '300px';
      container.appendChild(item);
      registerItem?.(i, item);
    }

    await vi.advanceTimersByTimeAsync(100);

    const initialObserverCount = observerInstances.length;
    expect(initialObserverCount).toBeGreaterThan(0);
    const initialObserver = observerInstances[0];

    // When: 스크롤 시뮬레이션 (10회)
    for (let i = 0; i < 10; i++) {
      container.scrollTop += 100;
      container.dispatchEvent(new globalThis.Event('scroll'));
      await vi.advanceTimersByTimeAsync(50);
    }

    // Then: observer 인스턴스가 재생성되지 않아야 함
    // 현재 구현: 매번 새 observer 생성 → FAIL 예상
    expect(observerInstances.length).toBe(initialObserverCount); // RED: 실제로는 증가함
    expect(observerInstances[observerInstances.length - 1]).toBe(initialObserver); // RED: 다른 인스턴스
  });

  it('[RED] container 변경 없이 아이템 추가 시 observer는 재생성되지 않아야 함', async () => {
    // Given: useGalleryFocusTracker 초기화
    let registerItem: ((index: number, element: HTMLElement | null) => void) | undefined;

    await createRoot(async innerDispose => {
      dispose = innerDispose;

      const [currentIndex] = createSignal(0);
      const tracker = useGalleryFocusTracker({
        container: () => container,
        isEnabled: true,
        getCurrentIndex: currentIndex,
      });

      registerItem = tracker.registerItem;
    });

    // 초기 아이템 등록
    const item1 = document.createElement('div');
    container.appendChild(item1);
    registerItem?.(0, item1);

    await vi.advanceTimersByTimeAsync(100);

    const initialObserverCount = observerInstances.length;
    const initialObserver = observerInstances[0];

    // When: 추가 아이템 등록 (container는 동일)
    for (let i = 1; i < 5; i++) {
      const item = document.createElement('div');
      container.appendChild(item);
      registerItem?.(i, item);
      await vi.advanceTimersByTimeAsync(20);
    }

    // Then: observer는 재생성되지 않아야 함 (observe만 호출)
    // 현재 구현: registerItem이 effect를 트리거하여 재생성 → FAIL 예상
    expect(observerInstances.length).toBe(initialObserverCount); // RED
    expect(observerInstances[observerInstances.length - 1]).toBe(initialObserver); // RED
  });

  it('[RED] isEnabled가 false→true 전환 시에만 observer가 재생성되어야 함', async () => {
    // Given: useGalleryFocusTracker 초기화 (비활성화 상태)
    let registerItem: ((index: number, element: HTMLElement | null) => void) | undefined;
    const [isEnabled, setIsEnabled] = createSignal(false);

    await createRoot(async innerDispose => {
      dispose = innerDispose;

      const [currentIndex] = createSignal(0);
      const tracker = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        getCurrentIndex: currentIndex,
      });

      registerItem = tracker.registerItem;
    });

    await vi.advanceTimersByTimeAsync(100);

    const initialObserverCount = observerInstances.length;
    expect(initialObserverCount).toBe(0); // 비활성화 상태이므로 observer 없음

    // When: 활성화
    setIsEnabled(true);
    await vi.advanceTimersByTimeAsync(100);

    // Then: observer 1개 생성됨
    expect(observerInstances.length).toBe(1);
    const firstObserver = observerInstances[0];

    // When: 아이템 등록
    const item = document.createElement('div');
    container.appendChild(item);
    registerItem?.(0, item);
    await vi.advanceTimersByTimeAsync(100);

    // Then: observer는 재생성되지 않음
    // 현재 구현: registerItem → scheduleSync → effect 트리거 → 재생성 → FAIL 예상
    expect(observerInstances.length).toBe(1); // RED
    expect(observerInstances[0]).toBe(firstObserver); // RED
  });

  it('[GREEN 목표] observer는 enabled/container 변경 시에만 재생성되어야 함', async () => {
    // Given: useGalleryFocusTracker 초기화
    let registerItem: ((index: number, element: HTMLElement | null) => void) | undefined;
    const [isEnabled, setIsEnabled] = createSignal(true);

    await createRoot(async innerDispose => {
      dispose = innerDispose;

      const [currentIndex] = createSignal(0);
      const tracker = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        getCurrentIndex: currentIndex,
      });

      registerItem = tracker.registerItem;
    });

    await vi.advanceTimersByTimeAsync(100);

    const initialObserverCount = observerInstances.length;
    expect(initialObserverCount).toBe(1);
    const initialObserver = observerInstances[0];

    // When: 아이템 등록, 스크롤 시뮬레이션 (observer 재생성 없어야 함)
    for (let i = 0; i < 5; i++) {
      const item = document.createElement('div');
      container.appendChild(item);
      registerItem?.(i, item);
      container.scrollTop += 50;
      await vi.advanceTimersByTimeAsync(50);
    }

    // Then: observer는 여전히 초기 인스턴스
    expect(observerInstances.length).toBe(1); // GREEN 목표
    expect(observerInstances[0]).toBe(initialObserver); // GREEN 목표

    // When: isEnabled 토글 (재생성 필요)
    setIsEnabled(false);
    await vi.advanceTimersByTimeAsync(100);

    expect(observerInstances.length).toBe(1); // disconnect됨, 새 인스턴스 없음

    setIsEnabled(true);
    await vi.advanceTimersByTimeAsync(100);

    // Then: 새 observer 생성됨 (정상)
    expect(observerInstances.length).toBe(2); // GREEN 목표
    expect(observerInstances[1]).not.toBe(initialObserver); // GREEN 목표
  });
});
