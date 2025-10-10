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

  it('debounces auto-scroll when current index changes', async () => {
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

    let setCurrentIndex!: (value: number) => number;
    let hookDispose: () => void = () => {};

    createRoot(dispose => {
      hookDispose = dispose;
      const [currentIndex, setIndex] = createSignal(0);
      setCurrentIndex = setIndex;

      useGalleryItemScroll(containerRef, currentIndex, () => 2, {
        behavior: 'auto',
        debounceDelay: 75,
        respectReducedMotion: false,
      });
    });

    setCurrentIndex(1);

    // interval tick to detect index change
    vi.advanceTimersByTime(32);

    vi.advanceTimersByTime(50);
    expect(scrollSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(25);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    setCurrentIndex(1);
    vi.advanceTimersByTime(200);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    hookDispose();
  });
});
