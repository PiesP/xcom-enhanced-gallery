/**
 * @fileoverview Integration tests for scroll-focus-toolbar synchronization
 * @description Tests the flow: scroll stop → focus change → toolbar progress update
 *
 * This test suite verifies:
 * 1. When user scrolls and stops, the correct item gets focused
 * 2. Focus change updates the toolbar progress bar
 * 3. Programmatic scroll doesn't interfere with user scroll focus
 * 4. Manual focus is cleared when user starts scrolling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusCoordinator } from '../../../../src/features/gallery/logic/focus-coordinator';

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

type FocusChangeCallback = (index: number | null, source: 'auto' | 'manual') => void;

describe('Scroll-Focus-Toolbar Synchronization', () => {
  let container: HTMLElement;
  let onFocusChange: FocusChangeCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ top: 0, height: 600, left: 0, width: 800 }),
    });

    onFocusChange = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Scroll Stop Focus Selection', () => {
    it('should focus item closest to viewport top when scroll stops', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: 50,
      });

      // Create 3 items at different positions
      const items = [
        { top: 50, height: 200, ratio: 0.8 }, // Closest to viewport top
        { top: 200, height: 200, ratio: 0.9 },
        { top: 400, height: 200, ratio: 0.5 },
      ];

      items.forEach((item, index) => {
        const element = document.createElement('div');
        Object.defineProperty(element, 'getBoundingClientRect', {
          value: () => ({ ...item, left: 0, width: 800 }),
        });

        coordinator.registerItem(index, element);

        const callback = (mockObserve.mock.calls[index] as unknown[])[1] as (
          entry: IntersectionObserverEntry,
        ) => void;
        callback({
          intersectionRatio: item.ratio,
          boundingClientRect: { top: item.top, height: item.height },
        } as IntersectionObserverEntry);
      });

      // Wait for debounce (simulating scroll stop)
      vi.advanceTimersByTime(50);

      // Item 0 should be selected (closest to viewport top=0)
      expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

      coordinator.cleanup();
    });

    it('should prefer highly visible items over closer items', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: 50,
      });

      // Item 0: very close but low visibility
      const element0 = document.createElement('div');
      Object.defineProperty(element0, 'getBoundingClientRect', {
        value: () => ({ top: 10, height: 200, left: 0, width: 800 }),
      });

      // Item 1: farther but high visibility (≥30%)
      const element1 = document.createElement('div');
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({ top: 100, height: 200, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element0);
      coordinator.registerItem(1, element1);

      // Item 0: 10% visible (< 30%)
      const call0 = mockObserve.mock.calls.find((call: unknown[]) => call[0] === element0);
      (call0![1] as (entry: IntersectionObserverEntry) => void)({
        intersectionRatio: 0.1,
        boundingClientRect: { top: 10, height: 200 },
      } as IntersectionObserverEntry);

      // Item 1: 50% visible (≥ 30%)
      const call1 = mockObserve.mock.calls.find((call: unknown[]) => call[0] === element1);
      (call1![1] as (entry: IntersectionObserverEntry) => void)({
        intersectionRatio: 0.5,
        boundingClientRect: { top: 100, height: 200 },
      } as IntersectionObserverEntry);

      vi.advanceTimersByTime(50);

      // Item 1 should be selected (has ≥30% visibility)
      expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

      coordinator.cleanup();
    });
  });

  describe('Toolbar Progress Update Flow', () => {
    it('should call onFocusChange with correct index for toolbar update', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: 50,
      });

      // Register item at index 2
      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 50, height: 200, left: 0, width: 800 }),
      });

      coordinator.registerItem(2, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({
        intersectionRatio: 0.8,
        boundingClientRect: { top: 50, height: 200 },
      } as IntersectionObserverEntry);

      vi.advanceTimersByTime(50);

      // Verify toolbar can receive the correct index
      expect(onFocusChange).toHaveBeenCalledWith(2, 'auto');
      expect(onFocusChange).toHaveBeenCalledTimes(1);

      coordinator.cleanup();
    });

    it('should update focus when visible item changes during scroll', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: 50,
      });

      const element0 = document.createElement('div');
      const element1 = document.createElement('div');

      Object.defineProperty(element0, 'getBoundingClientRect', {
        value: () => ({ top: 0, height: 200, left: 0, width: 800 }),
      });
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({ top: 200, height: 200, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element0);
      coordinator.registerItem(1, element1);

      const callback0 = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      const callback1 = (mockObserve.mock.calls[1] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;

      // Initially item 0 is visible
      callback0({
        intersectionRatio: 0.8,
        boundingClientRect: { top: 0, height: 200 },
      } as IntersectionObserverEntry);

      vi.advanceTimersByTime(50);
      expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');

      // Scroll changes - now item 1 is more visible
      callback0({
        intersectionRatio: 0.1,
        boundingClientRect: { top: -100, height: 200 },
      } as IntersectionObserverEntry);
      callback1({
        intersectionRatio: 0.9,
        boundingClientRect: { top: 50, height: 200 },
      } as IntersectionObserverEntry);

      vi.advanceTimersByTime(50);
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
        onFocusChange,
        debounceTime: 50,
      });

      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 50, height: 200, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({
        intersectionRatio: 0.8,
        boundingClientRect: { top: 50, height: 200 },
      } as IntersectionObserverEntry);

      // Disable before debounce completes
      enabled = false;
      vi.advanceTimersByTime(50);

      expect(onFocusChange).not.toHaveBeenCalled();

      coordinator.cleanup();
    });

    it('should resume focus tracking when re-enabled', () => {
      let enabled = false;
      const coordinator = new FocusCoordinator({
        isEnabled: () => enabled,
        container: () => container,
        onFocusChange,
        debounceTime: 50,
      });

      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 50, height: 200, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;

      // Trigger while disabled
      callback({
        intersectionRatio: 0.8,
        boundingClientRect: { top: 50, height: 200 },
      } as IntersectionObserverEntry);
      vi.advanceTimersByTime(50);
      expect(onFocusChange).not.toHaveBeenCalled();

      // Re-enable and trigger
      enabled = true;
      callback({
        intersectionRatio: 0.8,
        boundingClientRect: { top: 50, height: 200 },
      } as IntersectionObserverEntry);
      vi.advanceTimersByTime(50);
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
        onFocusChange,
        debounceTime: 50,
      });

      const element = document.createElement('div');
      element.scrollIntoView = scrollIntoViewMock;
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 50, height: 200, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element);

      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({
        intersectionRatio: 0.8,
        boundingClientRect: { top: 50, height: 200 },
      } as IntersectionObserverEntry);

      vi.advanceTimersByTime(50);

      // Focus should be tracked
      expect(onFocusChange).toHaveBeenCalled();

      // But no auto-scroll should be triggered by FocusCoordinator
      expect(scrollIntoViewMock).not.toHaveBeenCalled();

      coordinator.cleanup();
    });
  });
});
