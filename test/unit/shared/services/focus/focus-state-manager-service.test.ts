/**
 * FocusStateManagerService Unit Tests
 *
 * @description Focus state manager service 로직 검증
 * @category Unit Test - Services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { FocusStateManagerService, createFocusStateManagerService } from '@/shared/services/focus';
import type { FocusTracking } from '@/shared/state/focus';

/**
 * Mock FocusTracking
 */
function createMockFocusTracking(overrides: Partial<FocusTracking> = {}): FocusTracking {
  return {
    lastAutoFocusedIndex: null,
    lastAppliedIndex: null,
    hasPendingRecompute: false,
    ...overrides,
  } as FocusTracking;
}

describe('FocusStateManagerService', () => {
  setupGlobalTestIsolation();

  let service: FocusStateManagerService;

  beforeEach(() => {
    service = createFocusStateManagerService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.dispose();
    vi.useRealTimers();
  });

  describe('createFocusStateManagerService', () => {
    it('should create a new instance', () => {
      const instance = createFocusStateManagerService();
      expect(instance).toBeInstanceOf(FocusStateManagerService);
    });
  });

  describe('setupAutoFocusSync', () => {
    it('should set up debounced auto focus sync', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate, 100);

      const debugInfo = service.getDebugInfo();
      expect(debugInfo.autoFocusDebouncerActive).toBe(true);
    });

    it('should use default delay of 50ms', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate);

      service.syncAutoFocus(5);
      expect(onUpdate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(onUpdate).toHaveBeenCalledWith(5, 'auto');
    });
  });

  describe('syncAutoFocus', () => {
    it('should debounce auto focus updates', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate, 100);

      service.syncAutoFocus(1);
      service.syncAutoFocus(2);
      service.syncAutoFocus(3);

      expect(onUpdate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith(3, 'auto');
    });

    it('should handle null index without forceClear', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate, 100);

      service.syncAutoFocus(null);

      vi.advanceTimersByTime(100);
      expect(onUpdate).toHaveBeenCalledWith(null, 'auto');
    });

    it('should handle null index with forceClear', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate, 100);

      service.syncAutoFocus(null, { forceClear: true });

      vi.advanceTimersByTime(100);
      expect(onUpdate).toHaveBeenCalledWith(null, 'auto');
    });

    it('should not crash if debouncer not set up', () => {
      expect(() => {
        service.syncAutoFocus(5);
      }).not.toThrow();
    });
  });

  describe('setupContainerSync', () => {
    it('should set up debounced container sync', () => {
      const onUpdate = vi.fn();
      service.setupContainerSync(onUpdate, 100);

      const debugInfo = service.getDebugInfo();
      expect(debugInfo.containerSyncDebouncerActive).toBe(true);
    });

    it('should use default delay of 50ms', () => {
      const onUpdate = vi.fn();
      service.setupContainerSync(onUpdate);

      service.syncContainer(5);
      expect(onUpdate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(onUpdate).toHaveBeenCalledWith(5, undefined);
    });
  });

  describe('syncContainer', () => {
    it('should debounce container updates', () => {
      const onUpdate = vi.fn();
      service.setupContainerSync(onUpdate, 100);

      service.syncContainer(1);
      service.syncContainer(2);
      service.syncContainer(3);

      expect(onUpdate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith(3, undefined);
    });

    it('should pass forceClear option', () => {
      const onUpdate = vi.fn();
      service.setupContainerSync(onUpdate, 100);

      service.syncContainer(null, { forceClear: true });

      vi.advanceTimersByTime(100);
      expect(onUpdate).toHaveBeenCalledWith(null, { forceClear: true });
    });

    it('should not crash if debouncer not set up', () => {
      expect(() => {
        service.syncContainer(5);
      }).not.toThrow();
    });
  });

  describe('handleScrollState', () => {
    it('should trigger recompute when scroll ends with pending recompute', () => {
      const focusTracking = createMockFocusTracking({
        hasPendingRecompute: true,
      });
      const onRecompute = vi.fn();

      const result = service.handleScrollState(false, focusTracking, onRecompute);

      expect(onRecompute).toHaveBeenCalled();
      expect(result.hasPendingRecompute).toBe(false);
    });

    it('should not trigger recompute when scrolling', () => {
      const focusTracking = createMockFocusTracking({
        hasPendingRecompute: true,
      });
      const onRecompute = vi.fn();

      const result = service.handleScrollState(true, focusTracking, onRecompute);

      expect(onRecompute).not.toHaveBeenCalled();
      expect(result.hasPendingRecompute).toBe(true);
    });

    it('should not trigger recompute when no pending recompute', () => {
      const focusTracking = createMockFocusTracking({
        hasPendingRecompute: false,
      });
      const onRecompute = vi.fn();

      const result = service.handleScrollState(false, focusTracking, onRecompute);

      expect(onRecompute).not.toHaveBeenCalled();
      expect(result.hasPendingRecompute).toBe(false);
    });

    it('should return same tracking if no action needed', () => {
      const focusTracking = createMockFocusTracking({
        hasPendingRecompute: false,
      });
      const onRecompute = vi.fn();

      const result = service.handleScrollState(false, focusTracking, onRecompute);

      expect(result).toBe(focusTracking);
    });
  });

  describe('deferSync', () => {
    it('should set hasPendingRecompute flag', () => {
      const focusTracking = createMockFocusTracking({
        hasPendingRecompute: false,
      });

      const result = service.deferSync(focusTracking);

      expect(result.hasPendingRecompute).toBe(true);
    });

    it('should maintain flag if already set', () => {
      const focusTracking = createMockFocusTracking({
        hasPendingRecompute: true,
      });

      const result = service.deferSync(focusTracking);

      expect(result.hasPendingRecompute).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should clear all debouncers', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate, 100);
      service.setupContainerSync(onUpdate, 100);

      let debugInfo = service.getDebugInfo();
      expect(debugInfo.autoFocusDebouncerActive).toBe(true);
      expect(debugInfo.containerSyncDebouncerActive).toBe(true);

      service.dispose();

      debugInfo = service.getDebugInfo();
      expect(debugInfo.autoFocusDebouncerActive).toBe(false);
      expect(debugInfo.containerSyncDebouncerActive).toBe(false);
    });

    it('should not crash if called multiple times', () => {
      expect(() => {
        service.dispose();
        service.dispose();
      }).not.toThrow();
    });
  });

  describe('getDebugInfo', () => {
    it('should return debouncer status', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate, 100);

      const debugInfo = service.getDebugInfo();

      expect(debugInfo).toEqual({
        autoFocusDebouncerActive: true,
        containerSyncDebouncerActive: false,
      });
    });

    it('should handle no debouncers', () => {
      const debugInfo = service.getDebugInfo();

      expect(debugInfo).toEqual({
        autoFocusDebouncerActive: false,
        containerSyncDebouncerActive: false,
      });
    });
  });

  describe('Integration: debouncing behavior', () => {
    it('should handle rapid updates correctly', () => {
      const onAutoFocusUpdate = vi.fn();
      const onContainerUpdate = vi.fn();

      service.setupAutoFocusSync(onAutoFocusUpdate, 100);
      service.setupContainerSync(onContainerUpdate, 100);

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        service.syncAutoFocus(i);
        service.syncContainer(i);
      }

      expect(onAutoFocusUpdate).not.toHaveBeenCalled();
      expect(onContainerUpdate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(onAutoFocusUpdate).toHaveBeenCalledTimes(1);
      expect(onAutoFocusUpdate).toHaveBeenCalledWith(9, 'auto');
      expect(onContainerUpdate).toHaveBeenCalledTimes(1);
      expect(onContainerUpdate).toHaveBeenCalledWith(9, undefined);
    });

    it('should allow multiple debounce cycles', () => {
      const onUpdate = vi.fn();
      service.setupAutoFocusSync(onUpdate, 50);

      service.syncAutoFocus(1);
      vi.advanceTimersByTime(50);
      expect(onUpdate).toHaveBeenCalledWith(1, 'auto');

      onUpdate.mockClear();

      service.syncAutoFocus(2);
      vi.advanceTimersByTime(50);
      expect(onUpdate).toHaveBeenCalledWith(2, 'auto');
    });
  });
});
