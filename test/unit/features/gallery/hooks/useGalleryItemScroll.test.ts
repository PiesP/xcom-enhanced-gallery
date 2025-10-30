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
          debounceDelay: 100,
          respectReducedMotion: false,
        });
      });

      // First index change: should get 0ms debounce (skipped)
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
          debounceDelay: 100,
          respectReducedMotion: false,
        });
      });

      // First index change: 0ms debounce
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
          debounceDelay: 100,
          respectReducedMotion: false,
        });
      });

      // First index change triggers MutationObserver setup
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
});
