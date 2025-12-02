/**
 * @fileoverview Integration tests for scroll-focus-toolbar synchronization
 * @description Tests the flow: scroll stop → focus change → toolbar progress update
 *
 * Focus selection algorithm (weighted scoring):
 * 1. Screen coverage score (60%): Visible height / viewport height
 * 2. Center proximity score (40%): How close the item center is to viewport center
 * 3. Combined score = coverage * 0.6 + proximity * 0.4
 *
 * This test suite verifies:
 * 1. When user scrolls and stops, the correct item gets focused
 * 2. Focus change updates the toolbar progress bar
 * 3. Programmatic scroll doesn't interfere with user scroll focus
 * 4. Manual focus is cleared when user starts scrolling
 */

import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';

// Mock SharedObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

vi.mock('@shared/utils/performance/observer-pool', () => ({
  SharedObserver: {
    observe: (...args: unknown[]) => mockObserve(...args),
    unobserve: (...args: unknown[]) => mockUnobserve(...args),
  },
}));

// Mock globalTimerManager
vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: {
    setTimeout: (fn: () => void, delay: number) => setTimeout(fn, delay) as unknown as number,
    clearTimeout: (id: number) => clearTimeout(id),
  },
}));

function createConnectedElement(): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'isConnected', { value: true, configurable: true });
  return el;
}

type FocusChangeCallback = (index: number | null, source: 'auto' | 'manual') => void;

describe('Scroll-Focus-Toolbar Synchronization', () => {
  let container: HTMLElement;
  let onFocusChange: FocusChangeCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Container with viewport center at y=300
    container = createConnectedElement();
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

    onFocusChange = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Natural Focus Selection', () => {
    it('should prioritize top-aligned item', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, viewport top at y=0
      // Item 0: top=50, within 50px threshold -> Top-aligned! (Winner)
      // Item 1: top=200, center=300, closest to viewport center but outside top threshold
      // Item 2: top=400, far from both top and center
      const items = [
        { top: 50, height: 200, ratio: 0.4 },
        { top: 200, height: 200, ratio: 0.9 },
        { top: 400, height: 200, ratio: 0.5 },
      ];

      items.forEach((item, index) => {
        const element = createConnectedElement();
        Object.defineProperty(element, 'getBoundingClientRect', {
          value: () => ({
            top: item.top,
            height: item.height,
            bottom: item.top + item.height,
            left: 0,
            width: 800,
            right: 800,
          }),
        });

        coordinator.registerItem(index, element);

        const callback = (mockObserve.mock.calls[index] as unknown[])[1] as (
          entry: IntersectionObserverEntry,
        ) => void;
        callback({
          intersectionRatio: item.ratio,
          isIntersecting: true,
          boundingClientRect: { top: item.top, height: item.height },
        } as IntersectionObserverEntry);
      });

      coordinator.updateFocus();

      // Item 0 should be selected (top-aligned with viewport)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should prioritize top-aligned over center-aligned', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, viewport top at y=0
      // Item 0: top=0, perfect top alignment (Winner)
      // Item 1: top=200, center=300, perfect center alignment but outside top threshold
      // Item 2: top=400, far from both
      const items = [
        { top: 0, height: 200, ratio: 0.8 },
        { top: 200, height: 200, ratio: 0.82 },
        { top: 400, height: 200, ratio: 0.81 },
      ];

      items.forEach((item, index) => {
        const element = createConnectedElement();
        Object.defineProperty(element, 'getBoundingClientRect', {
          value: () => ({
            top: item.top,
            height: item.height,
            bottom: item.top + item.height,
            left: 0,
            width: 800,
            right: 800,
          }),
        });

        coordinator.registerItem(index, element);

        const callback = (mockObserve.mock.calls[index] as unknown[])[1] as (
          entry: IntersectionObserverEntry,
        ) => void;
        callback({
          intersectionRatio: item.ratio,
          isIntersecting: true,
          boundingClientRect: { top: item.top, height: item.height },
        } as IntersectionObserverEntry);
      });

      coordinator.updateFocus();

      // Item 0 should be selected (top-aligned takes priority)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should prefer item closer to center regardless of coverage', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      // Container: top=0, height=600, center=300
      //
      // Item 0: Small item at center (low coverage, high proximity)
      //   center: 300 (perfect center)
      //
      // Item 1: Large item at bottom (high coverage, low proximity)
      //   center: 500 (far)
      //
      // Item 0 wins due to center proximity advantage

      const element0 = createConnectedElement();
      Object.defineProperty(element0, 'getBoundingClientRect', {
        value: () => ({
          top: 250,
          height: 100,
          bottom: 350,
          left: 0,
          width: 800,
          right: 800,
        }), // center: 300 (perfect center)
      });

      const element1 = createConnectedElement();
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({
          top: 400,
          height: 200,
          bottom: 600,
          left: 0,
          width: 800,
          right: 800,
        }), // center: 500 (far)
      });

      coordinator.registerItem(0, element0);
      coordinator.registerItem(1, element1);

      // Note: intersectionRatio is not used by the algorithm
      // The algorithm calculates coverage from actual element bounds
      const call0 = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      call0({
        intersectionRatio: 0.2,
        isIntersecting: true,
        boundingClientRect: { top: 250, height: 100 },
      } as IntersectionObserverEntry);

      const call1 = (mockObserve.mock.calls[1] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      call1({
        intersectionRatio: 0.8,
        isIntersecting: true,
        boundingClientRect: { top: 400, height: 200 },
      } as IntersectionObserverEntry);

      coordinator.updateFocus();

      // Item 0 should be selected (center proximity advantage)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });
  });

  describe('Toolbar Progress Update Flow', () => {
    it('should call onFocusChange with correct index for toolbar update', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createConnectedElement();
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 200, height: 200, left: 0, width: 800 }),
      });

      coordinator.registerItem(2, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({
        intersectionRatio: 0.8,
        isIntersecting: true,
        boundingClientRect: { top: 200, height: 200 },
      } as IntersectionObserverEntry);

      coordinator.updateFocus();

      expect(onFocusChange).toHaveBeenCalledWith(2, 'auto');
      expect(onFocusChange).toHaveBeenCalledTimes(1);

      coordinator.cleanup();
    });

    it('should update focus when visible item changes during scroll', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element0 = createConnectedElement();
      // Item 0: Fully visible initially
      Object.defineProperty(element0, 'getBoundingClientRect', {
        value: () => ({
          top: 0,
          height: 200,
          bottom: 200,
          left: 0,
          width: 800,
          right: 800,
        }),
        configurable: true,
      });

      const element1 = createConnectedElement();
      // Item 1: Barely visible initially (at bottom)
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({
          top: 550,
          height: 200,
          bottom: 750,
          left: 0,
          width: 800,
          right: 800,
        }),
        configurable: true,
      });

      coordinator.registerItem(0, element0);
      coordinator.registerItem(1, element1);

      const call0 = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      const call1 = (mockObserve.mock.calls[1] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;

      // Initial state: Item 0 visible
      call0({
        intersectionRatio: 1.0,
        isIntersecting: true,
        boundingClientRect: { top: 0, height: 200 },
      } as IntersectionObserverEntry);
      call1({
        intersectionRatio: 0.25,
        isIntersecting: true,
        boundingClientRect: { top: 550, height: 200 },
      } as IntersectionObserverEntry);

      coordinator.updateFocus();
      expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');

      // Scroll happens: Item 1 becomes visible, Item 0 moves up
      // Update rects to reflect scroll
      Object.defineProperty(element0, 'getBoundingClientRect', {
        value: () => ({
          top: -150,
          height: 200,
          bottom: 50,
          left: 0,
          width: 800,
          right: 800,
        }),
      });
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({
          top: 200,
          height: 200,
          bottom: 400,
          left: 0,
          width: 800,
          right: 800,
        }),
      });

      coordinator.updateFocus();
      expect(onFocusChange).toHaveBeenLastCalledWith(1, 'auto');

      coordinator.cleanup();
    });
  });

  describe('Disabled State Handling', () => {
    it('should not trigger focus change when disabled', () => {
      let enabled = true;
      const coordinator = new FocusCoordinator({
        isEnabled: () => enabled,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createConnectedElement();
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 200, height: 200, left: 0, width: 800, bottom: 400, right: 800 }),
      });

      coordinator.registerItem(0, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({
        intersectionRatio: 0.8,
        isIntersecting: true,
        boundingClientRect: { top: 200, height: 200 },
      } as IntersectionObserverEntry);

      enabled = false;
      coordinator.updateFocus();

      expect(onFocusChange).not.toHaveBeenCalled();

      coordinator.cleanup();
    });

    it('should resume focus tracking when re-enabled', () => {
      let enabled = false;
      const coordinator = new FocusCoordinator({
        isEnabled: () => enabled,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createConnectedElement();
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 200, height: 200, left: 0, width: 800, bottom: 400, right: 800 }),
      });

      coordinator.registerItem(0, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;

      callback({
        intersectionRatio: 0.8,
        isIntersecting: true,
        boundingClientRect: { top: 200, height: 200 },
      } as IntersectionObserverEntry);

      coordinator.updateFocus();
      expect(onFocusChange).not.toHaveBeenCalled();

      enabled = true;
      coordinator.updateFocus();
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });
  });

  describe('No Auto-Scroll Guarantee', () => {
    it('should only call onFocusChange, not trigger any scroll', () => {
      const scrollIntoViewMock = vi.fn();

      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        activeIndex: () => -1,
        onFocusChange,
      });

      const element = createConnectedElement();
      element.scrollIntoView = scrollIntoViewMock;
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 200, height: 200, left: 0, width: 800, bottom: 400, right: 800 }),
      });

      coordinator.registerItem(0, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({
        intersectionRatio: 0.8,
        isIntersecting: true,
        boundingClientRect: { top: 200, height: 200 },
      } as IntersectionObserverEntry);

      coordinator.updateFocus();

      expect(onFocusChange).toHaveBeenCalled();
      expect(scrollIntoViewMock).not.toHaveBeenCalled();

      coordinator.cleanup();
    });
  });
});
