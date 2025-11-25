/**
 * @fileoverview Tests for FocusCoordinator
 * @description Verifies scroll-based focus tracking functionality
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusCoordinator } from '../../../../../src/features/gallery/logic/focus-coordinator';

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

describe('FocusCoordinator', () => {
  let container: HTMLElement;
  let onFocusChange: FocusChangeCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ top: 0, height: 600, left: 0, width: 800 }),
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
        onFocusChange,
      });

      expect(coordinator).toBeDefined();
      coordinator.cleanup();
    });

    it('should accept custom options', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        threshold: 0.5,
        rootMargin: '10px',
        minimumVisibleRatio: 0.1,
        debounceTime: 100,
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
        onFocusChange,
      });

      const element = document.createElement('div');
      coordinator.registerItem(0, element);

      expect(mockObserve).toHaveBeenCalledWith(
        element,
        expect.any(Function),
        expect.objectContaining({
          threshold: 0,
          rootMargin: '0px',
        }),
      );

      coordinator.cleanup();
    });

    it('should unobserve previous element when re-registering', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
      });

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      coordinator.registerItem(0, element1);
      coordinator.registerItem(0, element2);

      expect(mockUnobserve).toHaveBeenCalledWith(element1);
      expect(mockObserve).toHaveBeenLastCalledWith(
        element2,
        expect.any(Function),
        expect.any(Object),
      );

      coordinator.cleanup();
    });

    it('should unobserve and remove item when null element', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
      });

      const element = document.createElement('div');
      coordinator.registerItem(0, element);
      coordinator.registerItem(0, null);

      expect(mockUnobserve).toHaveBeenCalledWith(element);

      coordinator.cleanup();
    });
  });

  describe('recompute', () => {
    it('should not compute when disabled', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => false,
        container: () => container,
        onFocusChange,
      });

      coordinator.recompute();

      expect(onFocusChange).not.toHaveBeenCalled();
      coordinator.cleanup();
    });

    it('should not compute when no container', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => null,
        onFocusChange,
      });

      coordinator.recompute();

      expect(onFocusChange).not.toHaveBeenCalled();
      coordinator.cleanup();
    });

    it('should find item closest to center', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: 0,
      });

      // Create three items at different positions
      const items = [
        { top: 0, height: 200 }, // center: 100
        { top: 200, height: 200 }, // center: 300 (closest to container center 300)
        { top: 400, height: 200 }, // center: 500
      ];

      items.forEach((rect, index) => {
        const element = document.createElement('div');
        Object.defineProperty(element, 'getBoundingClientRect', {
          value: () => ({ ...rect, left: 0, width: 800 }),
        });

        coordinator.registerItem(index, element);

        // Simulate intersection callback with visible ratio
        const observeCall = mockObserve.mock.calls.find(
          (call: unknown[]) => call[0] === element,
        );
        if (observeCall) {
          const callback = observeCall[1] as (entry: IntersectionObserverEntry) => void;
          callback({
            intersectionRatio: 0.5,
            boundingClientRect: rect,
          } as IntersectionObserverEntry);
        }
      });

      vi.advanceTimersByTime(100);

      expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

      coordinator.cleanup();
    });

    it('should ignore items below minimum visible ratio', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        minimumVisibleRatio: 0.1,
        debounceTime: 0,
      });

      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 300, height: 100, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element);

      // Simulate very low visibility
      const observeCall = mockObserve.mock.calls[0] as unknown[];
      const callback = observeCall[1] as (entry: IntersectionObserverEntry) => void;
      callback({
        intersectionRatio: 0.01, // Below minimum
        boundingClientRect: { top: 300, height: 100 },
      } as IntersectionObserverEntry);

      vi.advanceTimersByTime(100);

      expect(onFocusChange).not.toHaveBeenCalled();

      coordinator.cleanup();
    });
  });

  describe('debouncing', () => {
    it('should debounce recompute calls', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: 50,
      });

      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 300, height: 100, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element);

      // Simulate multiple intersection callbacks
      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;

      callback({ intersectionRatio: 0.5, boundingClientRect: {} } as IntersectionObserverEntry);
      callback({ intersectionRatio: 0.6, boundingClientRect: {} } as IntersectionObserverEntry);
      callback({ intersectionRatio: 0.7, boundingClientRect: {} } as IntersectionObserverEntry);

      // Before debounce completes
      vi.advanceTimersByTime(30);
      expect(onFocusChange).not.toHaveBeenCalled();

      // After debounce completes
      vi.advanceTimersByTime(30);
      expect(onFocusChange).toHaveBeenCalledTimes(1);

      coordinator.cleanup();
    });
  });

  describe('cleanup', () => {
    it('should unobserve all items on cleanup', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
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
        expect(mockUnobserve).toHaveBeenCalledWith(el);
      });
    });

    it('should clear pending debounce timer on cleanup', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: 100,
      });

      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: 300, height: 100, left: 0, width: 800 }),
      });

      coordinator.registerItem(0, element);

      // Trigger debounced recompute
      const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({ intersectionRatio: 0.5, boundingClientRect: {} } as IntersectionObserverEntry);

      // Cleanup before debounce completes
      coordinator.cleanup();

      // Advance time past debounce
      vi.advanceTimersByTime(200);

      // Should not have called onFocusChange after cleanup
      expect(onFocusChange).not.toHaveBeenCalled();
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
      value: () => ({ top: 0, height: 600, left: 0, width: 800 }),
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
      onFocusChange,
      debounceTime: 50,
    });

    // Simulate item at center of viewport
    const element = document.createElement('div');
    Object.defineProperty(element, 'getBoundingClientRect', {
      value: () => ({ top: 250, height: 100, left: 0, width: 800 }), // center: 300
    });

    coordinator.registerItem(0, element);

    // Simulate visibility change during scroll
    const callback = (mockObserve.mock.calls[0] as unknown[])[1] as (
      entry: IntersectionObserverEntry,
    ) => void;
    callback({ intersectionRatio: 0.8, boundingClientRect: {} } as IntersectionObserverEntry);

    // Wait for debounce (scroll stops)
    vi.advanceTimersByTime(50);

    expect(onFocusChange).toHaveBeenCalledWith(0, 'auto');

    coordinator.cleanup();
  });

  it('should handle rapid item registration during scroll', () => {
    const coordinator = new FocusCoordinator({
      isEnabled: () => true,
      container: () => container,
      onFocusChange,
      debounceTime: 50,
    });

    // Register multiple items rapidly (simulating virtual scroll)
    for (let i = 0; i < 10; i++) {
      const element = document.createElement('div');
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({ top: i * 100, height: 80, left: 0, width: 800 }),
      });

      coordinator.registerItem(i, element);

      const callback = (mockObserve.mock.calls[i] as unknown[])[1] as (
        entry: IntersectionObserverEntry,
      ) => void;
      callback({ intersectionRatio: 0.5, boundingClientRect: {} } as IntersectionObserverEntry);
    }

    // Should only call onFocusChange once after debounce
    vi.advanceTimersByTime(100);
    expect(onFocusChange).toHaveBeenCalledTimes(1);

    coordinator.cleanup();
  });
});
