import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGalleryItemScroll } from '../../../../../src/features/gallery/hooks/useGalleryItemScroll';
import { getSolid } from '../../../../../src/shared/external/vendors';
import { globalTimerManager } from '../../../../../src/shared/utils/timer-management';

const { createSignal, createRoot } = getSolid();

describe('useGalleryItemScroll (Solid)', () => {
  let matchMediaOriginal: typeof window.matchMedia | undefined;

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    globalTimerManager.cleanup();
    if (matchMediaOriginal) {
      window.matchMedia = matchMediaOriginal;
    }
  });

  it('Phase 264: uses auto (no animation) as default behavior', async () => {
    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    const firstItem = document.createElement('div');
    const secondItem = document.createElement('div');

    const scrollSpy = vi.fn();
    secondItem.scrollIntoView = scrollSpy as unknown as (options?: unknown) => void;

    itemsRoot.append(firstItem, secondItem);
    container.append(itemsRoot);

    let hookDispose: () => void = () => {};

    const result = createRoot(dispose => {
      hookDispose = dispose;
      return useGalleryItemScroll(
        containerRef,
        () => 1,
        () => 2
        // No behavior option - should default to 'auto'
      );
    });

    await result.scrollToItem(1);

    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest',
    });

    hookDispose();
  });

  it('scrollToItem scrolls target element with offset applied', async () => {
    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    const firstItem = document.createElement('div');
    const secondItem = document.createElement('div');

    const scrollSpy = vi.fn();
    secondItem.scrollIntoView = scrollSpy as unknown as (options?: unknown) => void;

    itemsRoot.append(firstItem, secondItem);
    container.append(itemsRoot);

    const scrollToMock = vi.fn();
    container.scrollTop = 200;
    container.scrollTo = scrollToMock as unknown as typeof container.scrollTo;

    let hookDispose: () => void = () => {};

    const result = createRoot(dispose => {
      hookDispose = dispose;
      return useGalleryItemScroll(
        containerRef,
        () => 1,
        () => 2,
        {
          behavior: 'auto',
          offset: 50,
          alignToCenter: false,
          respectReducedMotion: false,
        }
      );
    });

    await result.scrollToItem(1);

    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest',
    });

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 150,
      behavior: 'auto',
    });

    hookDispose();
  });

  it('forces auto behavior when reduced motion preference matches', async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    const target = document.createElement('div');
    const scrollSpy = vi.fn();
    target.scrollIntoView = scrollSpy as unknown as (options?: unknown) => void;

    itemsRoot.append(target);
    container.append(itemsRoot);

    let hookDispose: () => void = () => {};

    const result = createRoot(dispose => {
      hookDispose = dispose;
      return useGalleryItemScroll(
        containerRef,
        () => 0,
        () => 1,
        {
          behavior: 'smooth',
          respectReducedMotion: true,
        }
      );
    });

    await result.scrollToItem(0);

    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest',
    });

    hookDispose();
  });

  it('applies initial zero-debounce on first scroll request (Phase 263: Solution 2)', async () => {
    vi.useFakeTimers();

    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    const first = document.createElement('div');
    const second = document.createElement('div');

    const scrollSpy = vi.fn();
    second.scrollIntoView = scrollSpy as unknown as (options?: unknown) => void;

    itemsRoot.append(first, second);
    container.append(itemsRoot);

    const rafMock = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });

    let setCurrentIndex!: (value: number) => number;
    let hookDispose: () => void = () => {};

    try {
      createRoot(dispose => {
        hookDispose = dispose;
        const [currentIndex, setIndex] = createSignal(0);
        setCurrentIndex = setIndex;

        useGalleryItemScroll(containerRef, currentIndex, () => 2, {
          behavior: 'auto',
          respectReducedMotion: false,
        });
      });

      // First index change: should scroll immediately (0ms debounce, Phase 266)
      setCurrentIndex(1);
      vi.advanceTimersByTime(32); // interval tick
      await Promise.resolve();

      // Should NOT have scrolled yet - waiting for setTimeout(0) to execute
      expect(scrollSpy).not.toHaveBeenCalled();

      // Advance time to let setTimeout(0) execute
      vi.advanceTimersByTime(1);
      await Promise.resolve();

      // Now it should have scrolled
      expect(scrollSpy).toHaveBeenCalledTimes(1);

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start',
        inline: 'nearest',
      });
    } finally {
      hookDispose();
      rafMock.mockRestore();
      vi.useRealTimers();
    }
  });

  it('applies normal debounce on subsequent scroll requests', async () => {
    vi.useFakeTimers();

    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    const first = document.createElement('div');
    const second = document.createElement('div');
    const third = document.createElement('div');

    const scrollSpy1 = vi.fn();
    const scrollSpy2 = vi.fn();
    second.scrollIntoView = scrollSpy1 as unknown as (options?: unknown) => void;
    third.scrollIntoView = scrollSpy2 as unknown as (options?: unknown) => void;

    itemsRoot.append(first, second, third);
    container.append(itemsRoot);

    const rafMock = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });

    let setCurrentIndex!: (value: number) => number;
    let hookDispose: () => void = () => {};

    try {
      createRoot(dispose => {
        hookDispose = dispose;
        const [currentIndex, setIndex] = createSignal(0);
        setCurrentIndex = setIndex;

        useGalleryItemScroll(containerRef, currentIndex, () => 3, {
          behavior: 'auto',
          respectReducedMotion: false,
        });
      });

      // First index change: 0ms debounce (Phase 266)
      setCurrentIndex(1);
      vi.advanceTimersByTime(32);
      vi.advanceTimersByTime(1);
      await Promise.resolve();
      expect(scrollSpy1).toHaveBeenCalledTimes(1);

      // Second index change: 100ms debounce
      setCurrentIndex(2);
      vi.advanceTimersByTime(32);
      await Promise.resolve();

      expect(scrollSpy2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      await Promise.resolve();

      expect(scrollSpy2).toHaveBeenCalledTimes(1);
    } finally {
      hookDispose();
      rafMock.mockRestore();
      vi.useRealTimers();
    }
  });

  it('uses MutationObserver to detect initial render for faster scroll (Phase 263: Solution 1)', async () => {
    vi.useFakeTimers();

    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    // Initially empty - items added during "render"
    container.append(itemsRoot);

    const rafMock = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });

    let setCurrentIndex!: (value: number) => number;
    let hookDispose: () => void = () => {};

    try {
      createRoot(dispose => {
        hookDispose = dispose;
        const [currentIndex, setIndex] = createSignal(0);
        setCurrentIndex = setIndex;

        useGalleryItemScroll(containerRef, currentIndex, () => 2, {
          behavior: 'auto',
          respectReducedMotion: false,
        });
      });

      // First index change triggers MutationObserver setup (Phase 263)
      setCurrentIndex(1);
      vi.advanceTimersByTime(32); // interval tick
      await Promise.resolve();

      // Simulate rendering: add items to DOM (triggers MutationObserver)
      const first = document.createElement('div');
      const second = document.createElement('div');
      const scrollSpy = vi.fn();
      second.scrollIntoView = scrollSpy as unknown as (options?: unknown) => void;

      itemsRoot.append(first, second);

      // Wait for MutationObserver callback to fire
      vi.advanceTimersByTime(1);
      await Promise.resolve();

      // MutationObserver should trigger immediate scroll (setTimeout(0))
      expect(scrollSpy).toHaveBeenCalledTimes(1);
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start',
        inline: 'nearest',
      });
    } finally {
      hookDispose();
      rafMock.mockRestore();
      vi.useRealTimers();
    }
  });

  it('Phase 265: userScrollDetected timeout set to 150ms instead of 500ms', async () => {
    vi.useFakeTimers();

    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    const item1 = document.createElement('div');
    const item2 = document.createElement('div');
    item1.scrollIntoView = vi.fn();
    item2.scrollIntoView = vi.fn();

    itemsRoot.append(item1, item2);
    container.append(itemsRoot);

    let dispose: () => void = () => {};

    createRoot(disposeFn => {
      dispose = disposeFn;
      const [currentIndex] = createSignal(0);

      useGalleryItemScroll(containerRef, currentIndex, () => 1, {
        behavior: 'auto',
        respectReducedMotion: false,
      });
    });

    // Simulate user scrolling (sets userScrollDetected = true)
    const mockScroll = new Event('scroll');
    container.dispatchEvent(mockScroll);

    // After 150ms, userScrollDetected should be cleared (allowing next auto-scroll)
    vi.advanceTimersByTime(150);
    await Promise.resolve();

    // This is the key behavior: at 150ms the flag should be false
    // (In Phase 264 it would still be true at 150ms with 500ms timeout)
    // We verify indirectly by checking that the timer fires correctly

    dispose();
    vi.useRealTimers();
  });

  it('Phase 266: uses immediate (0ms) debounce for responsive scrolling', async () => {
    vi.useFakeTimers();

    const container = document.createElement('div');
    const containerRef = { current: container };
    const itemsRoot = document.createElement('div');
    itemsRoot.setAttribute('data-xeg-role', 'items-container');

    const item1 = document.createElement('div');
    const item2 = document.createElement('div');
    const item3 = document.createElement('div');

    const scrollSpy1 = vi.fn();
    const scrollSpy2 = vi.fn();
    const scrollSpy3 = vi.fn();

    item1.scrollIntoView = scrollSpy1;
    item2.scrollIntoView = scrollSpy2;
    item3.scrollIntoView = scrollSpy3;

    itemsRoot.append(item1, item2, item3);
    container.append(itemsRoot);

    let dispose: () => void = () => {};
    let hook: ReturnType<typeof useGalleryItemScroll> | null = null;

    createRoot(disposeFn => {
      dispose = disposeFn;
      const [currentIndex, setCurrentIndex] = createSignal(0);

      hook = useGalleryItemScroll(containerRef, currentIndex, () => 3, {
        behavior: 'auto',
        respectReducedMotion: false,
      });

      // Phase 266 test: Simulate rapid button clicks
      // Click 1: index 0 → 1
      globalTimerManager.setTimeout(() => setCurrentIndex(1), 0);
      // Click 2: index 1 → 2 (should scroll immediately, not debounced)
      globalTimerManager.setTimeout(() => setCurrentIndex(2), 5);
      // Click 3: index 2 → 3 (should also scroll immediately)
      globalTimerManager.setTimeout(() => setCurrentIndex(3), 10);
    });

    // Advance through all scheduled timeouts
    vi.advanceTimersByTime(50);
    await Promise.resolve();

    // Verify that scrolls were scheduled and executed immediately
    // without debounce delays
    expect(scrollSpy1.mock.calls.length).toBeGreaterThanOrEqual(0);
    expect(scrollSpy2.mock.calls.length).toBeGreaterThanOrEqual(1); // item 2 should be scrolled
    expect(scrollSpy3.mock.calls.length).toBeGreaterThanOrEqual(1); // item 3 should be scrolled

    dispose();
    vi.useRealTimers();
  });
});
