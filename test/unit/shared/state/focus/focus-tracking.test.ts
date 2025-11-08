import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import {
  type FocusTracking,
  INITIAL_FOCUS_TRACKING,
  createFocusTracking,
  isSameFocusTracking,
  resetFocusTracking,
  updateFocusTracking,
} from '@shared/state/focus/focus-types';

describe('Focus Tracking (Phase 150.2 Step 4)', () => {
  setupGlobalTestIsolation();

  describe('FocusTracking Interface', () => {
    it('should initialize with INITIAL_FOCUS_TRACKING', () => {
      const tracking = INITIAL_FOCUS_TRACKING;

      expect(tracking.lastAutoFocusedIndex).toBeNull();
      expect(tracking.lastAppliedIndex).toBeNull();
      expect(tracking.hasPendingRecompute).toBe(false);
      expect(tracking.lastUpdateTime).toBe(0);
    });

    it('should support partial FocusTracking updates', () => {
      const tracking: FocusTracking = {
        lastAutoFocusedIndex: 5,
        lastAppliedIndex: 5,
        hasPendingRecompute: false,
        lastUpdateTime: 1000,
      };

      expect(tracking.lastAutoFocusedIndex).toBe(5);
      expect(tracking.lastAppliedIndex).toBe(5);
    });
  });

  describe('createFocusTracking', () => {
    it('should create tracking with defaults', () => {
      const tracking = createFocusTracking();

      expect(tracking.lastAutoFocusedIndex).toBeNull();
      expect(tracking.lastAppliedIndex).toBeNull();
      expect(tracking.hasPendingRecompute).toBe(false);
      expect(tracking.lastUpdateTime).toBeGreaterThan(0);
    });

    it('should create tracking with overrides', () => {
      const tracking = createFocusTracking({
        lastAutoFocusedIndex: 10,
        hasPendingRecompute: true,
      });

      expect(tracking.lastAutoFocusedIndex).toBe(10);
      expect(tracking.lastAppliedIndex).toBeNull();
      expect(tracking.hasPendingRecompute).toBe(true);
      expect(tracking.lastUpdateTime).toBeGreaterThan(0);
    });

    it('should set lastUpdateTime on creation', () => {
      const before = performance.now?.() ?? Date.now();
      const tracking = createFocusTracking();
      const after = performance.now?.() ?? Date.now();

      expect(tracking.lastUpdateTime).toBeGreaterThanOrEqual(before);
      expect(tracking.lastUpdateTime).toBeLessThanOrEqual(after);
    });
  });

  describe('isSameFocusTracking', () => {
    it('should return true for identical tracking (ignoring timestamp)', () => {
      const tracking1 = createFocusTracking({
        lastAutoFocusedIndex: 5,
        lastAppliedIndex: 5,
        hasPendingRecompute: false,
      });

      const tracking2 = createFocusTracking({
        lastAutoFocusedIndex: 5,
        lastAppliedIndex: 5,
        hasPendingRecompute: false,
      });

      expect(isSameFocusTracking(tracking1, tracking2)).toBe(true);
    });

    it('should return false for different lastAutoFocusedIndex', () => {
      const tracking1 = createFocusTracking({ lastAutoFocusedIndex: 5 });
      const tracking2 = createFocusTracking({ lastAutoFocusedIndex: 10 });

      expect(isSameFocusTracking(tracking1, tracking2)).toBe(false);
    });

    it('should return false for different lastAppliedIndex', () => {
      const tracking1 = createFocusTracking({ lastAppliedIndex: 5 });
      const tracking2 = createFocusTracking({ lastAppliedIndex: 10 });

      expect(isSameFocusTracking(tracking1, tracking2)).toBe(false);
    });

    it('should return false for different hasPendingRecompute', () => {
      const tracking1 = createFocusTracking({ hasPendingRecompute: true });
      const tracking2 = createFocusTracking({ hasPendingRecompute: false });

      expect(isSameFocusTracking(tracking1, tracking2)).toBe(false);
    });

    it('should ignore timestamp difference', () => {
      const tracking1 = createFocusTracking({ lastAutoFocusedIndex: 5 });

      // Wait a bit to ensure timestamp difference
      const tracking2 = createFocusTracking({ lastAutoFocusedIndex: 5 });

      expect(tracking1.lastUpdateTime).not.toBe(tracking2.lastUpdateTime);
      expect(isSameFocusTracking(tracking1, tracking2)).toBe(true);
    });
  });

  describe('resetFocusTracking', () => {
    it('should reset tracking to initial state', () => {
      const tracking = resetFocusTracking();

      expect(tracking.lastAutoFocusedIndex).toBeNull();
      expect(tracking.lastAppliedIndex).toBeNull();
      expect(tracking.hasPendingRecompute).toBe(false);
      expect(tracking.lastUpdateTime).toBeGreaterThan(0);
    });
  });

  describe('updateFocusTracking', () => {
    it('should update tracking with new values', () => {
      const tracking1 = createFocusTracking();
      const tracking2 = updateFocusTracking(tracking1, {
        lastAutoFocusedIndex: 7,
        hasPendingRecompute: true,
      });

      expect(tracking2.lastAutoFocusedIndex).toBe(7);
      expect(tracking2.hasPendingRecompute).toBe(true);
      expect(tracking2.lastAppliedIndex).toBeNull();
    });

    it('should update lastUpdateTime on change', () => {
      const tracking1 = createFocusTracking();
      const tracking2 = updateFocusTracking(tracking1, {
        lastAutoFocusedIndex: 10,
      });

      expect(tracking2.lastUpdateTime).toBeGreaterThanOrEqual(tracking1.lastUpdateTime);
    });

    it('should preserve non-updated values', () => {
      const tracking1 = createFocusTracking({
        lastAutoFocusedIndex: 5,
        lastAppliedIndex: 5,
        hasPendingRecompute: true,
      });

      const tracking2 = updateFocusTracking(tracking1, {
        hasPendingRecompute: false,
      });

      expect(tracking2.lastAutoFocusedIndex).toBe(5);
      expect(tracking2.lastAppliedIndex).toBe(5);
      expect(tracking2.hasPendingRecompute).toBe(false);
    });
  });

  describe('FocusTracking Integration (Phase 150.2 consolidation)', () => {
    it('should consolidate 4 previous states into 1 object', () => {
      // Previous approach (4+ states):
      // - lastAutoFocusedIndex: number | null
      // - lastAppliedIndex: number | null
      // - hasPendingRecompute: boolean
      // - pendingFocusIndex?: number | null

      // Consolidated approach:
      const tracking = createFocusTracking({
        lastAutoFocusedIndex: 3,
        lastAppliedIndex: 3,
        hasPendingRecompute: true,
      });

      // Verify all previous data is accessible through single object
      expect(tracking.lastAutoFocusedIndex).toBe(3);
      expect(tracking.lastAppliedIndex).toBe(3);
      expect(tracking.hasPendingRecompute).toBe(true);

      // Update tracking
      const updated = updateFocusTracking(tracking, {
        lastAutoFocusedIndex: 5,
        hasPendingRecompute: false,
      });

      expect(updated.lastAutoFocusedIndex).toBe(5);
      expect(updated.hasPendingRecompute).toBe(false);
    });

    it('should provide lifecycle methods for tracking management', () => {
      let tracking = createFocusTracking({ lastAutoFocusedIndex: 10 });
      expect(tracking.lastAutoFocusedIndex).toBe(10);

      tracking = updateFocusTracking(tracking, { lastAppliedIndex: 10 });
      expect(tracking.lastAppliedIndex).toBe(10);

      tracking = resetFocusTracking();
      expect(isSameFocusTracking(tracking, INITIAL_FOCUS_TRACKING)).toBe(true);
    });

    it('should maintain state immutability', () => {
      const tracking1 = createFocusTracking({ lastAutoFocusedIndex: 5 });
      const tracking2 = updateFocusTracking(tracking1, { lastAutoFocusedIndex: 10 });

      expect(tracking1.lastAutoFocusedIndex).toBe(5);
      expect(tracking2.lastAutoFocusedIndex).toBe(10);
    });
  });
});
