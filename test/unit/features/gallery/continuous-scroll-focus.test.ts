/**
 * @fileoverview Continuous Scroll Focus Tests
 * @description Tests auto-focus behavior when user performs consecutive scroll-stop actions.
 *
 * Scenario: User scrolls through gallery, stops, then scrolls again repeatedly.
 * Expected behavior:
 * 1. Each scroll-stop cycle should correctly update focus to most visible item
 * 2. Debounce timers should reset properly between scroll actions
 * 3. No stale focus updates from previous scroll cycles
 * 4. Focus should update reliably even under rapid consecutive scrolling
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
type IntersectionCallback = (entry: IntersectionObserverEntry) => void;

/**
 * Helper to simulate intersection observer callbacks for registered elements
 */
function getObserverCallback(element: HTMLElement): IntersectionCallback | undefined {
  const call = mockObserve.mock.calls.find((c: unknown[]) => c[0] === element);
  return call?.[1] as IntersectionCallback | undefined;
}

/**
 * Helper to create mock element with getBoundingClientRect
 */
function createMockElement(rect: { top: number; height: number }): HTMLElement {
  const element = document.createElement('div');
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({ ...rect, left: 0, width: 800 }),
    configurable: true,
  });
  return element;
}

/**
 * Helper to simulate visibility change for an element
 */
function simulateVisibilityChange(
  element: HTMLElement,
  ratio: number,
  rect: { top: number; height: number },
): void {
  const callback = getObserverCallback(element);
  if (callback) {
    callback({
      intersectionRatio: ratio,
      boundingClientRect: rect,
    } as IntersectionObserverEntry);
  }
}

describe('Continuous Scroll Focus Behavior', () => {
  let container: HTMLElement;
  let onFocusChange: FocusChangeCallback;
  const DEBOUNCE_TIME = 50;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Container viewport: 600px height, center at y=300
    container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ top: 0, height: 600, left: 0, width: 800 }),
    });

    onFocusChange = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Consecutive Scroll-Stop Cycles', () => {
    it('should update focus correctly after each scroll-stop cycle', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      // Setup 3 gallery items
      const elements = [
        createMockElement({ top: 0, height: 300 }),
        createMockElement({ top: 300, height: 300 }),
        createMockElement({ top: 600, height: 300 }),
      ];

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      // --- Cycle 1: Item 0 is most visible ---
      simulateVisibilityChange(elements[0]!, 0.9, { top: 0, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.3, { top: 300, height: 300 });
      simulateVisibilityChange(elements[2]!, 0, { top: 600, height: 300 });

      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');

      // --- Cycle 2: User scrolls down, item 1 is most visible ---
      simulateVisibilityChange(elements[0]!, 0.1, { top: -200, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.95, { top: 100, height: 300 });
      simulateVisibilityChange(elements[2]!, 0.2, { top: 400, height: 300 });

      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(1, 'auto');

      // --- Cycle 3: User scrolls down more, item 2 is most visible ---
      simulateVisibilityChange(elements[0]!, 0, { top: -500, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.1, { top: -200, height: 300 });
      simulateVisibilityChange(elements[2]!, 0.85, { top: 100, height: 300 });

      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(2, 'auto');

      coordinator.cleanup();
    });

    it('should handle rapid scroll-stop cycles without stale updates', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const elements = [
        createMockElement({ top: 0, height: 300 }),
        createMockElement({ top: 300, height: 300 }),
      ];

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      // Start with item 0 visible
      simulateVisibilityChange(elements[0]!, 0.8, { top: 50, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.2, { top: 350, height: 300 });

      // Before debounce completes, user scrolls again (item 1 now visible)
      vi.advanceTimersByTime(DEBOUNCE_TIME / 2);
      simulateVisibilityChange(elements[0]!, 0.1, { top: -150, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.9, { top: 150, height: 300 });

      // Wait for debounce
      vi.advanceTimersByTime(DEBOUNCE_TIME);

      // Should only report item 1 (latest state), not item 0
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

      coordinator.cleanup();
    });

    it('should reset debounce timer on each scroll action', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const element = createMockElement({ top: 100, height: 300 });
      coordinator.registerItem(0, element);

      // First visibility change
      simulateVisibilityChange(element, 0.5, { top: 100, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME - 10);

      // Another visibility change before debounce completes (resets timer)
      simulateVisibilityChange(element, 0.7, { top: 100, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME - 10);

      // Still should not have fired
      expect(onFocusChange).not.toHaveBeenCalled();

      // Complete the debounce
      vi.advanceTimersByTime(10);
      expect(onFocusChange).toHaveBeenCalledTimes(1);

      coordinator.cleanup();
    });
  });

  describe('Bidirectional Scroll Patterns', () => {
    it('should handle scroll down then scroll up pattern', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const elements = [
        createMockElement({ top: 0, height: 300 }),
        createMockElement({ top: 300, height: 300 }),
        createMockElement({ top: 600, height: 300 }),
      ];

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      // Initial: Item 0 visible
      simulateVisibilityChange(elements[0]!, 0.8, { top: 50, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');

      // Scroll down: Item 2 visible
      simulateVisibilityChange(elements[0]!, 0, { top: -400, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.1, { top: -100, height: 300 });
      simulateVisibilityChange(elements[2]!, 0.9, { top: 200, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(2, 'auto');

      // Scroll back up: Item 1 visible
      simulateVisibilityChange(elements[0]!, 0.2, { top: -50, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.85, { top: 250, height: 300 });
      simulateVisibilityChange(elements[2]!, 0.1, { top: 550, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(1, 'auto');

      coordinator.cleanup();
    });

    it('should handle oscillating scroll pattern (back and forth)', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const elements = [
        createMockElement({ top: 0, height: 300 }),
        createMockElement({ top: 300, height: 300 }),
      ];

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      const focusHistory: number[] = [];
      (onFocusChange as ReturnType<typeof vi.fn>).mockImplementation(
        (index: number) => void focusHistory.push(index),
      );

      // Oscillate between items multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        const focusItem = cycle % 2;
        const otherItem = 1 - focusItem;

        simulateVisibilityChange(elements[focusItem]!, 0.9, {
          top: focusItem === 0 ? 100 : 100,
          height: 300,
        });
        simulateVisibilityChange(elements[otherItem]!, 0.1, {
          top: otherItem === 0 ? -200 : 400,
          height: 300,
        });

        vi.advanceTimersByTime(DEBOUNCE_TIME);
      }

      // Should have alternating focus: 0, 1, 0, 1, 0
      expect(focusHistory).toEqual([0, 1, 0, 1, 0]);

      coordinator.cleanup();
    });
  });

  describe('Edge Cases in Continuous Scrolling', () => {
    it('should handle multiple items becoming equally visible', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      // Two items with same visibility - tiebreaker uses center distance
      const element0 = createMockElement({ top: 100, height: 200 }); // Center at 200
      const element1 = createMockElement({ top: 250, height: 200 }); // Center at 350, closer to viewport center (300)

      coordinator.registerItem(0, element0);
      coordinator.registerItem(1, element1);

      // Both items 80% visible
      simulateVisibilityChange(element0, 0.8, { top: 100, height: 200 });
      simulateVisibilityChange(element1, 0.8, { top: 250, height: 200 });

      vi.advanceTimersByTime(DEBOUNCE_TIME);

      // Item 1 should win (closer to viewport center at y=300)
      expect(onFocusChange).toHaveBeenCalledWith(1, 'auto');

      coordinator.cleanup();
    });

    it('should handle all items becoming invisible during scroll', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
        minimumVisibleRatio: 0.1,
      });

      const elements = [
        createMockElement({ top: 0, height: 300 }),
        createMockElement({ top: 300, height: 300 }),
      ];

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      // Initially item 0 visible
      simulateVisibilityChange(elements[0]!, 0.8, { top: 50, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');
      const callCountAfterFirst = (onFocusChange as ReturnType<typeof vi.fn>).mock.calls.length;

      // All items become invisible (below minimum threshold)
      simulateVisibilityChange(elements[0]!, 0.05, { top: -250, height: 300 });
      simulateVisibilityChange(elements[1]!, 0.05, { top: 550, height: 300 });

      vi.advanceTimersByTime(DEBOUNCE_TIME);

      // No new focus change should occur (no valid candidates)
      expect((onFocusChange as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
        callCountAfterFirst,
      );

      coordinator.cleanup();
    });

    it('should handle dynamic item registration during scroll', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      // Start with one item
      const element0 = createMockElement({ top: 100, height: 300 });
      coordinator.registerItem(0, element0);

      simulateVisibilityChange(element0, 0.7, { top: 100, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');

      // Add new item during scroll
      const element1 = createMockElement({ top: 200, height: 300 });
      coordinator.registerItem(1, element1);

      // New item becomes more visible
      simulateVisibilityChange(element0, 0.2, { top: -100, height: 300 });
      simulateVisibilityChange(element1, 0.9, { top: 100, height: 300 });

      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(1, 'auto');

      coordinator.cleanup();
    });

    it('should handle item removal during scroll', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const elements = [
        createMockElement({ top: 0, height: 300 }),
        createMockElement({ top: 300, height: 300 }),
      ];

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      // Item 0 initially visible
      simulateVisibilityChange(elements[0]!, 0.8, { top: 50, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(0, 'auto');

      // Remove item 0 during scroll
      coordinator.registerItem(0, null);

      // Update remaining item
      simulateVisibilityChange(elements[1]!, 0.9, { top: 150, height: 300 });

      vi.advanceTimersByTime(DEBOUNCE_TIME);
      expect(onFocusChange).toHaveBeenLastCalledWith(1, 'auto');

      coordinator.cleanup();
    });
  });

  describe('Stress Tests', () => {
    it('should handle 20 consecutive scroll-stop cycles reliably', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const NUM_ITEMS = 10;
      const NUM_CYCLES = 20;

      const elements = Array.from({ length: NUM_ITEMS }, (_, i) =>
        createMockElement({ top: i * 300, height: 300 }),
      );

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      const focusHistory: number[] = [];
      (onFocusChange as ReturnType<typeof vi.fn>).mockImplementation(
        (index: number) => void focusHistory.push(index),
      );

      // Simulate scrolling through items sequentially
      for (let cycle = 0; cycle < NUM_CYCLES; cycle++) {
        const targetIndex = cycle % NUM_ITEMS;

        // Make target item most visible
        elements.forEach((el, i) => {
          const isTarget = i === targetIndex;
          const ratio = isTarget ? 0.9 : 0.05;
          const offset = (targetIndex - i) * 300;
          simulateVisibilityChange(el, ratio, {
            top: 150 - offset,
            height: 300,
          });
        });

        vi.advanceTimersByTime(DEBOUNCE_TIME);
      }

      // Should have exactly NUM_CYCLES focus changes
      expect(focusHistory).toHaveLength(NUM_CYCLES);

      // Each focus should match the target index for that cycle
      focusHistory.forEach((focus, cycle) => {
        expect(focus).toBe(cycle % NUM_ITEMS);
      });

      coordinator.cleanup();
    });

    it('should handle very rapid visibility changes (scroll jitter)', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const elements = [
        createMockElement({ top: 0, height: 300 }),
        createMockElement({ top: 300, height: 300 }),
      ];

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      // Simulate scroll jitter - many rapid changes
      for (let i = 0; i < 50; i++) {
        const jitter = Math.sin(i * 0.5) * 0.3; // Oscillating visibility
        simulateVisibilityChange(elements[0]!, 0.5 + jitter, { top: 100, height: 300 });
        simulateVisibilityChange(elements[1]!, 0.5 - jitter, { top: 400, height: 300 });
        vi.advanceTimersByTime(5); // Very short intervals
      }

      // Wait for final debounce
      vi.advanceTimersByTime(DEBOUNCE_TIME);

      // Should have resolved to a single focus change at the end
      // The exact item depends on final jitter state
      expect(onFocusChange).toHaveBeenCalled();

      coordinator.cleanup();
    });
  });

  describe('Cleanup During Scroll', () => {
    it('should not emit focus change after cleanup', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const element = createMockElement({ top: 100, height: 300 });
      coordinator.registerItem(0, element);

      // Trigger visibility change but don't wait for debounce
      simulateVisibilityChange(element, 0.8, { top: 100, height: 300 });
      vi.advanceTimersByTime(DEBOUNCE_TIME / 2);

      // Cleanup before debounce completes
      coordinator.cleanup();

      // Wait past debounce time
      vi.advanceTimersByTime(DEBOUNCE_TIME);

      // Should not have emitted any focus change
      expect(onFocusChange).not.toHaveBeenCalled();
    });

    it('should cleanup all observers when destroyed', () => {
      const coordinator = new FocusCoordinator({
        isEnabled: () => true,
        container: () => container,
        onFocusChange,
        debounceTime: DEBOUNCE_TIME,
      });

      const elements = Array.from({ length: 5 }, () => createMockElement({ top: 0, height: 300 }));

      elements.forEach((el, i) => coordinator.registerItem(i, el));

      coordinator.cleanup();

      // All elements should have been unobserved
      elements.forEach(el => {
        expect(mockUnobserve).toHaveBeenCalledWith(el);
      });
    });
  });
});
