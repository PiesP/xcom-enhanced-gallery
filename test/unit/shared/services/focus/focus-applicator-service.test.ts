/**
 * FocusApplicatorService Unit Tests
 *
 * @description Focus applicator service 로직 검증
 * @category Unit Test - Services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { FocusApplicatorService, createFocusApplicatorService } from '@/shared/services/focus';
import { ItemCache } from '@/shared/state/focus';
import type { FocusTracking, FocusTimerManager } from '@/shared/state/focus';

/**
 * Mock FocusTracking
 */
function createMockFocusTracking(overrides: Partial<FocusTracking> = {}): FocusTracking {
  return {
    lastAutoFocusedIndex: null,
    lastAppliedIndex: null,
    ...overrides,
  };
}

/**
 * Mock FocusTimerManager
 */
function createMockFocusTimerManager(): FocusTimerManager {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    setTimer: vi.fn((name: string, callback: () => void, delay: number) => {
      const timerId = setTimeout(callback, delay);
      timers.set(name, timerId);
    }),
    clearTimer: vi.fn((name: string) => {
      const timerId = timers.get(name);
      if (timerId) {
        clearTimeout(timerId);
        timers.delete(name);
      }
    }),
    clearAllTimers: vi.fn(() => {
      timers.forEach(timerId => clearTimeout(timerId));
      timers.clear();
    }),
    hasTimer: vi.fn((name: string) => timers.has(name)),
    getTimerCount: vi.fn(() => timers.size),
  } as unknown as FocusTimerManager;
}

describe('FocusApplicatorService', () => {
  setupGlobalTestIsolation();

  let service: FocusApplicatorService;
  let itemCache: ItemCache;
  let focusTimerManager: FocusTimerManager;

  beforeEach(() => {
    service = createFocusApplicatorService();
    itemCache = new ItemCache();
    focusTimerManager = createMockFocusTimerManager();
  });

  afterEach(() => {
    itemCache.clear();
    vi.clearAllTimers();
  });

  describe('createFocusApplicatorService', () => {
    it('should create a new instance', () => {
      const instance = createFocusApplicatorService();
      expect(instance).toBeInstanceOf(FocusApplicatorService);
    });
  });

  describe('clearAutoFocusTimer', () => {
    it('should call clearTimer with "auto-focus"', () => {
      service.clearAutoFocusTimer(focusTimerManager);
      expect(focusTimerManager.clearTimer).toHaveBeenCalledWith('auto-focus');
    });
  });

  describe('applyAutoFocus', () => {
    it('should return null if element is not in DOM', () => {
      const element = document.createElement('div');
      // element not connected to DOM
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking();
      const result = service.applyAutoFocus(0, itemCache, focusTracking, 'test');

      expect(result).toBeNull();
    });

    it('should return null if element does not exist', () => {
      const focusTracking = createMockFocusTracking();
      const result = service.applyAutoFocus(0, itemCache, focusTracking, 'test');

      expect(result).toBeNull();
    });

    it('should return null if already applied to same index', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking({ lastAppliedIndex: 0 });
      const result = service.applyAutoFocus(0, itemCache, focusTracking, 'test');

      expect(result).toBeNull();
      document.body.removeChild(element);
    });

    it('should update tracking if element is already focused', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      element.focus();
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking();
      const result = service.applyAutoFocus(0, itemCache, focusTracking, 'test');

      expect(result).not.toBeNull();
      expect(result?.lastAutoFocusedIndex).toBe(0);
      expect(result?.lastAppliedIndex).toBe(0);
      document.body.removeChild(element);
    });

    it('should apply focus successfully', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking();
      const result = service.applyAutoFocus(0, itemCache, focusTracking, 'test');

      expect(result).not.toBeNull();
      expect(result?.lastAutoFocusedIndex).toBe(0);
      expect(result?.lastAppliedIndex).toBe(0);
      expect(document.activeElement).toBe(element);
      document.body.removeChild(element);
    });

    it('should handle focus error gracefully', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      itemCache.setItem(0, element);

      // Mock focus to throw error
      const mockFocus = vi.fn().mockImplementation(() => {
        throw new Error('Focus failed');
      });
      element.focus = mockFocus;

      const focusTracking = createMockFocusTracking();
      const result = service.applyAutoFocus(0, itemCache, focusTracking, 'test');

      expect(result).toBeNull();
      expect(mockFocus).toHaveBeenCalled();
      document.body.removeChild(element);
    });
  });

  describe('evaluateAndScheduleAutoFocus', () => {
    it('should clear existing timer', () => {
      const container = document.createElement('div');
      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        100,
        onApply,
        'test'
      );

      expect(focusTimerManager.clearTimer).toHaveBeenCalledWith('auto-focus');
    });

    it('should return unchanged tracking if auto focus disabled', () => {
      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      const result = service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        false, // disabled
        100,
        onApply,
        'test'
      );

      expect(result).toBe(focusTracking);
      expect(focusTimerManager.setTimer).not.toHaveBeenCalled();
    });

    it('should return unchanged tracking if manual focus is set', () => {
      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      const result = service.evaluateAndScheduleAutoFocus(
        0,
        5, // manual focus index
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        100,
        onApply,
        'test'
      );

      expect(result).toBe(focusTracking);
      expect(focusTimerManager.setTimer).not.toHaveBeenCalled();
    });

    it('should return unchanged tracking if target index is null', () => {
      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      const result = service.evaluateAndScheduleAutoFocus(
        null,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        100,
        onApply,
        'test'
      );

      expect(result).toBe(focusTracking);
      expect(focusTimerManager.setTimer).not.toHaveBeenCalled();
    });

    it('should return unchanged tracking if target index is NaN', () => {
      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      const result = service.evaluateAndScheduleAutoFocus(
        NaN,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        100,
        onApply,
        'test'
      );

      expect(result).toBe(focusTracking);
      expect(focusTimerManager.setTimer).not.toHaveBeenCalled();
    });

    it('should return unchanged tracking if element not connected', () => {
      const element = document.createElement('div');
      // not connected to DOM
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      const result = service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        100,
        onApply,
        'test'
      );

      expect(result).toBe(focusTracking);
      expect(focusTimerManager.setTimer).not.toHaveBeenCalled();
    });

    it('should return unchanged tracking if already correctly focused', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      element.focus();
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking({
        lastAutoFocusedIndex: 0,
      });
      const onApply = vi.fn();

      const result = service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        100,
        onApply,
        'test'
      );

      expect(result).toBe(focusTracking);
      expect(focusTimerManager.setTimer).not.toHaveBeenCalled();
      document.body.removeChild(element);
    });

    it('should reset lastAppliedIndex if target index changed', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking({
        lastAppliedIndex: 5, // different index
      });
      const onApply = vi.fn();

      const result = service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        100,
        onApply,
        'test'
      );

      expect(result.lastAppliedIndex).toBeNull();
      document.body.removeChild(element);
    });

    it('should schedule timer with correct delay', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();
      const delay = 200;

      service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        delay,
        onApply,
        'test'
      );

      expect(focusTimerManager.setTimer).toHaveBeenCalledWith(
        'auto-focus',
        expect.any(Function),
        delay
      );
      document.body.removeChild(element);
    });

    it('should use minimum delay of 0', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        focusTimerManager,
        true,
        -100, // negative delay
        onApply,
        'test'
      );

      expect(focusTimerManager.setTimer).toHaveBeenCalledWith(
        'auto-focus',
        expect.any(Function),
        0
      );
      document.body.removeChild(element);
    });

    it('should call onApply callback when timer fires', async () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      itemCache.setItem(0, element);

      const focusTracking = createMockFocusTracking();
      const onApply = vi.fn();

      // Create real timer manager for this test
      const realTimerManager = {
        timers: new Map<string, ReturnType<typeof setTimeout>>(),
        setTimer(name: string, callback: () => void, delay: number) {
          const timerId = setTimeout(callback, delay);
          this.timers.set(name, timerId);
        },
        clearTimer(name: string) {
          const timerId = this.timers.get(name);
          if (timerId) {
            clearTimeout(timerId);
            this.timers.delete(name);
          }
        },
        clearAllTimers() {
          this.timers.forEach(timerId => clearTimeout(timerId));
          this.timers.clear();
        },
        hasTimer: vi.fn(),
        getTimerCount: vi.fn(),
      } as unknown as FocusTimerManager;

      service.evaluateAndScheduleAutoFocus(
        0,
        null,
        itemCache,
        focusTracking,
        realTimerManager,
        true,
        10,
        onApply,
        'test'
      );

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(onApply).toHaveBeenCalledWith(0, 'test');
      realTimerManager.clearAllTimers();
      document.body.removeChild(element);
    });
  });

  describe('getDebugInfo', () => {
    it('should return tracking debug info', () => {
      const focusTracking = createMockFocusTracking({
        lastAutoFocusedIndex: 5,
        lastAppliedIndex: 3,
      });

      const debugInfo = service.getDebugInfo(focusTracking);

      expect(debugInfo).toEqual({
        lastAutoFocusedIndex: 5,
        lastAppliedIndex: 3,
      });
    });

    it('should handle null values', () => {
      const focusTracking = createMockFocusTracking();

      const debugInfo = service.getDebugInfo(focusTracking);

      expect(debugInfo).toEqual({
        lastAutoFocusedIndex: null,
        lastAppliedIndex: null,
      });
    });
  });
});
