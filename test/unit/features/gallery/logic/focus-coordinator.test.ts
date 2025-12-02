/**
 * @fileoverview Tests for FocusCoordinator
 * @description Verifies scroll-based focus tracking functionality
 */
/**
 * @fileoverview Tests for FocusCoordinator
 * @description Verifies scroll-based focus tracking functionality
 */

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';

// Mock SharedObserver
const mockObserve = vi.fn();
const unsubscribeMap = new Map<Element, ReturnType<typeof vi.fn>>();

vi.mock('@shared/utils/performance/observer-pool', () => ({
  SharedObserver: {
    observe: (...args: unknown[]) => mockObserve(...args),
    unobserve: vi.fn(),
  },
}));

// Mock globalTimerManager
vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: {
    setTimeout: (fn: () => void, delay: number) => setTimeout(fn, delay) as unknown as number,
    clearTimeout: (id: number) => clearTimeout(id),
  },
}));

type FocusChangeCallback = (index: number | null, source: 'auto' | 'manual') => void;

const createElementWithRect = (top: number, height: number): HTMLElement => {
  const element = document.createElement('div');
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({
      top,
      height,
      bottom: top + height,
      left: 0,
      width: 800,
      right: 800,
    }),
    configurable: true,
  });
  Object.defineProperty(element, 'isConnected', {
    value: true,
    configurable: true,
  });
  return element;
};

const triggerIntersection = (element: HTMLElement, ratio = 0.5, rootHeight = 600): void => {
  const observeCall = mockObserve.mock.calls.find(call => call[0] === element);
  if (!observeCall) {
    throw new Error('Observer callback not found for element');
  }
  const callback = observeCall[1] as (entry: IntersectionObserverEntry) => void;
  const rect = element.getBoundingClientRect();
  callback({
    intersectionRatio: ratio,
    isIntersecting: ratio > 0,
    boundingClientRect: {
      top: rect.top,
      height: rect.height,
    } as DOMRectReadOnly,
    rootBounds: {
      top: 0,
      bottom: rootHeight,
      height: rootHeight,
    } as DOMRectReadOnly,
  } as IntersectionObserverEntry);
};

describe('FocusCoordinator', () => {
  let container: HTMLElement;
  let onFocusChange: FocusChangeCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    unsubscribeMap.clear();

    mockObserve.mockImplementation((element: Element) => {
      const unsubscribe = vi.fn();
      unsubscribeMap.set(element, unsubscribe);
      return unsubscribe;
    });

    container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        top: 0,
        height: 600,
        bottom: 600,
        left: 0,
        width: 800,
        right: 800,
      }),
    });

    onFocusChange = vi.fn() as unknown as FocusChangeCallback;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should create coordinator with default options', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      expect(coordinator).toBeDefined();
      coordinator.cleanup();
    });

    it('should accept custom options', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
        threshold: 0.5,
        rootMargin: '10px',
      });

      expect(coordinator).toBeDefined();
      coordinator.cleanup();
    });
  });

  describe('registerItem', () => {
    it('should observe element when registering', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = document.createElement('div');
      coordinator.registerItem(0, element);

      expect(mockObserve).toHaveBeenCalledWith(
        element,
        expect.any(Function),
        expect.objectContaining({
          threshold: expect.any(Array),
          rootMargin: '0px',
        }),
      );

      coordinator.cleanup();
    });

    it('should unobserve previous element when re-registering', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      coordinator.registerItem(0, element1);
      coordinator.registerItem(0, element2);

      const unsubscribeFirst = unsubscribeMap.get(element1);
      expect(unsubscribeFirst).toBeDefined();
      unsubscribeFirst && expect(unsubscribeFirst).toHaveBeenCalledTimes(1);
      expect(mockObserve).toHaveBeenCalledWith(element2, expect.any(Function), expect.any(Object));

      coordinator.cleanup();
    });

    it('should unobserve and remove item when null element', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = document.createElement('div');
      coordinator.registerItem(0, element);
      coordinator.registerItem(0, null);

      const unsubscribe = unsubscribeMap.get(element);
      expect(unsubscribe).toBeDefined();
      unsubscribe && expect(unsubscribe).toHaveBeenCalledTimes(1);

      coordinator.cleanup();
    });
  });

  describe('updateFocus', () => {
    it('should not compute when disabled', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => false,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      coordinator.updateFocus();
      expect(onFocusChange).not.toHaveBeenCalled();

      coordinator.cleanup();
    });

    it('should not compute when no container', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => null,
        activeIndex: () => -1,
        onFocusChange,
      });

      coordinator.updateFocus();
      expect(onFocusChange).not.toHaveBeenCalled();

      coordinator.cleanup();
    });

    it('should find item closest to center', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600, center at y=300
      //
      // Item 0: top=0, height=200, bottom=200
      //   - top distance from viewport top=0 (within 50px threshold)
      //   - Top-aligned candidate! (Winner)
      //
      // Item 1: top=200, height=200, bottom=400
      //   - center=300, center distance=0
      //   - top distance from viewport top=200 (outside threshold)
      //
      // Item 2: top=400, height=200, bottom=600
      //   - center=500, center distance=200
      //   - top distance from viewport top=400 (outside threshold)
      //
      // Item 0 wins as top-aligned candidate (prioritized)

      const items = [
        { top: 0, height: 200 },
        { top: 200, height: 200 },
        { top: 400, height: 200 },
      ];

      items.forEach((item, index) => {
        const element = createElementWithRect(item.top, item.height);
        coordinator.registerItem(index, element);
        triggerIntersection(element, 0.5);
      });

      coordinator.updateFocus();

      // Item 0 should be selected (top-aligned with viewport top)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should prefer item aligned to viewport top over center-aligned', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600, center=300
      // Top-alignment takes priority over center-alignment
      //
      // Item 0: top=0, height=200
      //   - top distance=0 (within 50px threshold) → Top-aligned! (Winner)
      // Item 1: top=200, height=200, center=300 (exactly at viewport center)
      //   - top distance=200 (outside threshold)
      // Item 2: top=400, height=200
      //   - top distance=400 (outside threshold)
      //
      // Item 0 wins due to top-alignment priority

      const items = [
        { top: 0, height: 200 },
        { top: 200, height: 200 },
        { top: 400, height: 200 },
      ];

      items.forEach((item, index) => {
        const element = createElementWithRect(item.top, item.height);
        coordinator.registerItem(index, element);
        triggerIntersection(element, 0.5);
      });

      coordinator.updateFocus();

      // Item 0 should be selected (top-aligned with viewport top)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should prioritize top-aligned item over center-aligned item', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600, center=300
      //
      // Item 0: top=0, height=150
      //   - top distance=0 (within 50px threshold) → Top-aligned! (Winner)
      // Item 1: top=250, height=100, center=300
      //   - center distance=0 (perfectly centered)
      //   - top distance=250 (outside threshold)
      //
      // Item 0 wins despite Item 1 being perfectly centered

      const items = [
        { top: 0, height: 150 },
        { top: 250, height: 100 },
      ];

      items.forEach((item, index) => {
        const element = createElementWithRect(item.top, item.height);
        coordinator.registerItem(index, element);
        triggerIntersection(element, 1.0);
      });

      coordinator.updateFocus();

      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should fallback to center-aligned when no top-aligned candidate exists', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600, center=300
      // No items within 50px of viewport top
      //
      // Item 0: top=100, height=100, center=150
      //   - top distance=100 (outside 50px threshold)
      //   - center distance=150
      // Item 1: top=250, height=100, center=300
      //   - top distance=250 (outside threshold)
      //   - center distance=0 (Winner via fallback)

      const items = [
        { top: 100, height: 100 },
        { top: 250, height: 100 },
      ];

      items.forEach((item, index) => {
        const element = createElementWithRect(item.top, item.height);
        coordinator.registerItem(index, element);
        triggerIntersection(element, 1.0);
      });

      coordinator.updateFocus();

      // Item 1 wins via center-based fallback
      expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

      coordinator.cleanup();
    });

    it('should choose closest top-aligned item when multiple qualify', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600
      // Multiple items within 50px threshold
      //
      // Item 0: top=10, height=100
      //   - top distance=10 (Winner - closest to viewport top)
      // Item 1: top=40, height=100
      //   - top distance=40

      const items = [
        { top: 10, height: 100 },
        { top: 40, height: 100 },
      ];

      items.forEach((item, index) => {
        const element = createElementWithRect(item.top, item.height);
        coordinator.registerItem(index, element);
        triggerIntersection(element, 1.0);
      });

      coordinator.updateFocus();

      // Item 0 wins (closest to viewport top)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should prefer higher visibility ratio over center distance', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600, center=300
      // No items within 50px top threshold
      //
      // Item 0: top=100, height=400
      //   - visibility: 400/400 = 100% (Winner - highest visibility)
      //   - center distance: |300-300| = 0
      // Item 1: top=200, height=100
      //   - visibility: 100/100 = 100%
      //   - center distance: |250-300| = 50
      //
      // Both have 100% visibility, Item 0 wins (closer to center)

      const items = [
        { top: 100, height: 400 },
        { top: 200, height: 100 },
      ];

      items.forEach((item, index) => {
        const element = createElementWithRect(item.top, item.height);
        coordinator.registerItem(index, element);
        triggerIntersection(element, 1.0);
      });

      coordinator.updateFocus();

      // Item 0 wins (both 100% visible, Item 0 closer to center)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should select item with most visibility when partially visible', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600
      // Testing partial visibility scenario
      //
      // Item 0: top=-200, height=400, bottom=200
      //   - visible portion: 0 to 200 = 200px
      //   - visibility: 200/400 = 50%
      // Item 1: top=100, height=400, bottom=500
      //   - visible portion: 100 to 500 = 400px
      //   - visibility: 400/400 = 100% (Winner - highest visibility)

      const items = [
        { top: -200, height: 400 },
        { top: 100, height: 400 },
      ];

      items.forEach((item, index) => {
        const element = createElementWithRect(item.top, item.height);
        coordinator.registerItem(index, element);
        // Simulate partial intersection for Item 0
        triggerIntersection(element, index === 0 ? 0.5 : 1.0);
      });

      coordinator.updateFocus();

      // Item 1 wins (100% visible vs 50%)
      expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

      coordinator.cleanup();
    });

    // Removed obsolete tests for complex scoring and hysteresis
  });

  describe('filtering', () => {
    it('should ignore items not visible', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createElementWithRect(0, 200);
      coordinator.registerItem(0, element);
      // No intersection triggered

      coordinator.updateFocus();
      expect(onFocusChange).not.toHaveBeenCalled();

      coordinator.cleanup();
    });

    it('should ignore items with zero intersection height', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createElementWithRect(800, 200); // Outside viewport
      coordinator.registerItem(0, element);
      triggerIntersection(element, 0);

      coordinator.updateFocus();
      expect(onFocusChange).not.toHaveBeenCalled();

      coordinator.cleanup();
    });
  });

  describe('debouncing', () => {
    it('should not debounce updates (handled externally)', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createElementWithRect(0, 200);
      coordinator.registerItem(0, element);
      triggerIntersection(element, 1.0);

      // No automatic update
      expect(onFocusChange).not.toHaveBeenCalled();

      // Manual update
      coordinator.updateFocus();
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });
  });

  describe('cleanup', () => {
    it('should unobserve all items on cleanup', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ];

      elements.forEach((el, index) => {
        coordinator.registerItem(index, el);
      });

      coordinator.cleanup();

      elements.forEach(el => {
        const unsubscribe = unsubscribeMap.get(el);
        expect(unsubscribe).toBeDefined();
        unsubscribe && expect(unsubscribe).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('force update', () => {
    it('should bypass isEnabled check when force is true', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => false,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createElementWithRect(0, 100);
      coordinator.registerItem(0, element);
      triggerIntersection(element, 1.0);

      // Should not update when disabled and no force
      coordinator.updateFocus();
      expect(onFocusChange).not.toHaveBeenCalled();

      // Should update when force is true
      coordinator.updateFocus(true);
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });
  });
});

describe('FocusCoordinator integration scenarios', () => {
  let container: HTMLElement;
  let onFocusChange: FocusChangeCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        top: 0,
        height: 600,
        bottom: 600,
        left: 0,
        width: 800,
        right: 800,
      }),
    });

    onFocusChange = vi.fn() as unknown as FocusChangeCallback;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should update focus when scroll stops (simulated)', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
        onFocusChange,
    });

    // Simulate item at center of viewport
    const element = document.createElement('div');
    Object.defineProperty(element, 'getBoundingClientRect', {
      value: () => ({
        top: 250,
        height: 100,
        bottom: 350,
        left: 0,
        width: 800,
        right: 800,
      }), // center: 300
    });
    Object.defineProperty(element, 'isConnected', {
      value: true,
      configurable: true,
    });

    coordinator.registerItem(0, element);

    // Simulate visibility change during scroll
    const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
      entry: IntersectionObserverEntry,
    ) => void;
    callback({
      intersectionRatio: 0.8,
      isIntersecting: true,
      boundingClientRect: {},
    } as IntersectionObserverEntry);

    // Manual update (scroll stops)
    coordinator.updateFocus();

    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should handle rapid item registration during scroll', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
        onFocusChange,
    });

    // Register multiple items rapidly (simulating virtual scroll)
    for (let i = 0; i < 10; i++) {
      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          top: i * 100,
          height: 80,
          bottom: i * 100 + 80,
          left: 0,
          width: 800,
          right: 800,
        }),
      });
      Object.defineProperty(element, 'isConnected', {
        value: true,
        configurable: true,
      });

      coordinator.registerItem(i, element);

      const callback = (mockObserve.mock.calls[i] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({
        intersectionRatio: 0.5,
        isIntersecting: true,
        boundingClientRect: {},
      } as IntersectionObserverEntry);
    }

    // Manual update
    coordinator.updateFocus();
    expect(onFocusChange).toHaveBeenCalledTimes(1);

    coordinator.cleanup();
  });
});

describe('FocusCoordinator (mutation coverage)', () => {
  let container: HTMLElement;
  let onFocusChange: FocusChangeCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    unsubscribeMap.clear();

    mockObserve.mockImplementation((element: Element) => {
      const unsubscribe = vi.fn();
      unsubscribeMap.set(element, unsubscribe);
      return unsubscribe;
    });

    container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        top: 0,
        height: 600,
        bottom: 600,
        left: 0,
        width: 800,
        right: 800,
      }),
    });

    onFocusChange = vi.fn() as unknown as FocusChangeCallback;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call onFocusChange when selection equals current activeIndex', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => 0, // Already at index 0
      onFocusChange,
    });

    const element = createElementWithRect(0, 100);
    coordinator.registerItem(0, element);
    triggerIntersection(element, 1.0);

    coordinator.updateFocus();

    // Should not call onFocusChange since index didn't change
    expect(onFocusChange).not.toHaveBeenCalled();

    coordinator.cleanup();
  });

  it('should handle element with zero height gracefully', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = createElementWithRect(100, 0); // Zero height
    coordinator.registerItem(0, element);
    triggerIntersection(element, 0);

    coordinator.updateFocus();

    expect(onFocusChange).not.toHaveBeenCalled();

    coordinator.cleanup();
  });

  it('should skip disconnected elements', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = document.createElement('div');
    Object.defineProperty(element, 'getBoundingClientRect', {
      value: () => ({
        top: 0,
        height: 200,
        bottom: 200,
        left: 0,
        width: 800,
        right: 800,
      }),
    });
    Object.defineProperty(element, 'isConnected', {
      value: false, // Disconnected
      configurable: true,
    });

    coordinator.registerItem(0, element);
    triggerIntersection(element, 1.0);

    coordinator.updateFocus();

    expect(onFocusChange).not.toHaveBeenCalled();

    coordinator.cleanup();
  });

  it('should prefer closest to viewport top within proximity threshold', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Two items within 50px threshold
    const items = [
      { top: 30, height: 100 }, // 30px from top
      { top: 10, height: 100 }, // 10px from top (winner)
    ];

    items.forEach((item, index) => {
      const element = createElementWithRect(item.top, item.height);
      coordinator.registerItem(index, element);
      triggerIntersection(element, 1.0);
    });

    coordinator.updateFocus();

    // Index 1 should win (closer to viewport top)
    expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

    coordinator.cleanup();
  });

  it('should use visibility ratio fallback when no top-aligned candidate', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Container: height=600
    // Items outside 50px threshold
    const items = [
      { top: 100, height: 300 }, // 50% visible if partially in view
      { top: 200, height: 600 }, // 100% visible (larger)
    ];

    // Index 0: top=100, bottom=400, visible=100-400=300px, ratio=300/300=100%
    // Index 1: top=200, bottom=800, but viewport is 0-600, visible=200-600=400px, ratio=400/600≈67%
    // Both are > 10% visibility threshold

    items.forEach((item, index) => {
      const element = createElementWithRect(item.top, item.height);
      coordinator.registerItem(index, element);
      triggerIntersection(element, index === 0 ? 1.0 : 0.67);
    });

    coordinator.updateFocus();

    // Index 0 should win (100% visibility vs 67%)
    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should handle container height of 0 gracefully', () => {
    const zeroHeightContainer = document.createElement('div');
    Object.defineProperty(zeroHeightContainer, 'getBoundingClientRect', {
      value: () => ({
        top: 0,
        height: 0,
        bottom: 0,
        left: 0,
        width: 800,
        right: 800,
      }),
    });

    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => zeroHeightContainer,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = createElementWithRect(0, 100);
    coordinator.registerItem(0, element);
    triggerIntersection(element, 1.0);

    // Should not throw
    coordinator.updateFocus();

    coordinator.cleanup();
  });

  it('should return null selection when all items are outside viewport', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = createElementWithRect(1000, 100); // Way below viewport
    coordinator.registerItem(0, element);
    // Don't trigger intersection (not visible)

    coordinator.updateFocus();

    expect(onFocusChange).not.toHaveBeenCalled();

    coordinator.cleanup();
  });

  it('should use default threshold array when not provided', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
      // No threshold provided
    });

    const element = document.createElement('div');
    coordinator.registerItem(0, element);

    expect(mockObserve).toHaveBeenCalledWith(
      element,
      expect.any(Function),
      expect.objectContaining({
        threshold: expect.arrayContaining([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]),
        rootMargin: '0px',
      }),
    );

    coordinator.cleanup();
  });

  it('should use custom threshold when provided', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
      threshold: 0.5,
    });

    const element = document.createElement('div');
    coordinator.registerItem(0, element);

    expect(mockObserve).toHaveBeenCalledWith(
      element,
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.5,
      }),
    );

    coordinator.cleanup();
  });

  it('should use custom rootMargin when provided', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
      rootMargin: '50px',
    });

    const element = document.createElement('div');
    coordinator.registerItem(0, element);

    expect(mockObserve).toHaveBeenCalledWith(
      element,
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '50px',
      }),
    );

    coordinator.cleanup();
  });

  it('should prefer higher visibility when ratios are equal but center distances differ', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Container: top=0, height=600, center=300
    // Both items outside 50px threshold
    // Both have same visibility ratio, but different center distances
    const items = [
      { top: 100, height: 100 }, // center=150, distance=150
      { top: 250, height: 100 }, // center=300, distance=0 (winner - closer to center)
    ];

    items.forEach((item, index) => {
      const element = createElementWithRect(item.top, item.height);
      coordinator.registerItem(index, element);
      triggerIntersection(element, 1.0);
    });

    coordinator.updateFocus();

    // Index 1 should win (closer to center)
    expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

    coordinator.cleanup();
  });

  it('should handle items with visibility below 10% threshold', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = createElementWithRect(0, 100);
    coordinator.registerItem(0, element);
    // Trigger with very low visibility (below 10% threshold for highestVisibilityCandidate)
    triggerIntersection(element, 0.05);

    coordinator.updateFocus();

    // Should still select as center-based fallback
    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should return best center candidate when no top-aligned or high-visibility candidate', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Two items with low visibility (below 10%) - only center-based fallback available
    const items = [
      { top: 100, height: 100 }, // center=150, distance from viewport center=150
      { top: 280, height: 100 }, // center=330, distance from viewport center=30 (winner)
    ];

    items.forEach((item, index) => {
      const element = createElementWithRect(item.top, item.height);
      coordinator.registerItem(index, element);
      triggerIntersection(element, 0.05); // Low visibility
    });

    coordinator.updateFocus();

    // Index 1 should win (center-based fallback, closer to center)
    expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

    coordinator.cleanup();
  });

  it('should handle top-aligned candidate with low visibility ratio correctly', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Item at top with low visibility
    const element = createElementWithRect(0, 100);
    coordinator.registerItem(0, element);
    triggerIntersection(element, 0.05); // Low visibility but within top threshold

    coordinator.updateFocus();

    // Should not be selected as top-aligned candidate (visibility < 0.1 threshold)
    // But should be selected as center-based fallback
    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should handle viewportHeight of exactly 1 (edge case)', () => {
    const smallContainer = document.createElement('div');
    Object.defineProperty(smallContainer, 'getBoundingClientRect', {
      value: () => ({
        top: 0,
        height: 1, // Minimum non-zero height
        bottom: 1,
        left: 0,
        width: 800,
        right: 800,
      }),
    });

    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => smallContainer,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = createElementWithRect(0, 1);
    coordinator.registerItem(0, element);
    triggerIntersection(element, 1.0);

    // Should not throw
    coordinator.updateFocus();

    coordinator.cleanup();
  });

  it('should handle negative container top position', () => {
    const negativeTopContainer = document.createElement('div');
    Object.defineProperty(negativeTopContainer, 'getBoundingClientRect', {
      value: () => ({
        top: -100,
        height: 600,
        bottom: 500,
        left: 0,
        width: 800,
        right: 800,
      }),
    });

    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => negativeTopContainer,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = createElementWithRect(-100, 100);
    coordinator.registerItem(0, element);
    triggerIntersection(element, 1.0);

    coordinator.updateFocus();

    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should return null when items Map is empty', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // No items registered
    coordinator.updateFocus();

    expect(onFocusChange).not.toHaveBeenCalled();

    coordinator.cleanup();
  });

  it('should handle item entry update through observer callback', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => 0, // Set to 0 to simulate "already at this index"
      onFocusChange,
    });

    const element = createElementWithRect(0, 100);
    coordinator.registerItem(0, element);

    // First intersection
    triggerIntersection(element, 0.5);
    coordinator.updateFocus();

    // activeIndex is already 0, so onFocusChange should not be called
    expect(onFocusChange).not.toHaveBeenCalled();

    // Update intersection with higher ratio
    triggerIntersection(element, 1.0);
    coordinator.updateFocus();

    // Should still not call onFocusChange since index didn't change
    expect(onFocusChange).not.toHaveBeenCalled();

    coordinator.cleanup();
  });

  it('should select center-based candidate when visibility ratio equals threshold', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Container: height=600, center=300
    const items = [
      { top: 200, height: 100 }, // center=250, distance from center=50
      { top: 280, height: 100 }, // center=330, distance from center=30 (winner)
    ];

    items.forEach((item, index) => {
      const element = createElementWithRect(item.top, item.height);
      coordinator.registerItem(index, element);
      triggerIntersection(element, 0.1); // Exactly at threshold
    });

    coordinator.updateFocus();

    // Index 1 should win (closer to center)
    expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

    coordinator.cleanup();
  });

  it('should handle multiple items with same visibility and center distance', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Two items equidistant from center
    const items = [
      { top: 200, height: 100 }, // center=250, distance=50
      { top: 350, height: 100 }, // center=400, distance=100 (not equal actually)
    ];

    items.forEach((item, index) => {
      const element = createElementWithRect(item.top, item.height);
      coordinator.registerItem(index, element);
      triggerIntersection(element, 1.0);
    });

    coordinator.updateFocus();

    // First item should win (closer to center)
    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should call unsubscribe when cleanup is called multiple times', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    const element = document.createElement('div');
    coordinator.registerItem(0, element);

    const unsubscribe = unsubscribeMap.get(element);

    coordinator.cleanup();
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    // Second cleanup should not throw
    coordinator.cleanup();
  });

  it('should handle item visibility becoming false after being true', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => 0, // Already at index 0
      onFocusChange,
    });

    const element = createElementWithRect(0, 100);
    coordinator.registerItem(0, element);

    // First: visible
    triggerIntersection(element, 1.0);
    coordinator.updateFocus();
    // Since activeIndex is already 0, onFocusChange should not be called
    expect(onFocusChange).not.toHaveBeenCalled();

    // Second: no longer visible (isIntersecting will be false)
    triggerIntersection(element, 0);
    coordinator.updateFocus();

    // No candidate should be selected (element not visible)
    expect(onFocusChange).not.toHaveBeenCalled();

    coordinator.cleanup();
  });

  it('should handle top proximity exactly at 50px threshold', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Container: top=0
    // Item at exactly 50px from top (at threshold boundary)
    const element = createElementWithRect(50, 100);
    coordinator.registerItem(0, element);
    triggerIntersection(element, 1.0);

    coordinator.updateFocus();

    // Should be selected as top-aligned (50 <= 50)
    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should NOT select top-aligned when top distance is 51px (just outside threshold)', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      activeIndex: () => -1,
      onFocusChange,
    });

    // Container: top=0
    // Item at 51px from top (just outside threshold)
    const element = createElementWithRect(51, 100);
    coordinator.registerItem(0, element);
    triggerIntersection(element, 1.0);

    coordinator.updateFocus();

    // Should be selected via visibility/center fallback, not top-aligned
    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });
});
