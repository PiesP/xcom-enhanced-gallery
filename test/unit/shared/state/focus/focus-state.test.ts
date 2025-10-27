import { describe, it, expect } from 'vitest';
import {
  type FocusState,
  INITIAL_FOCUS_STATE,
  isValidFocusState,
  createFocusState,
  isSameFocusState,
} from '@shared/state/focus/focus-types';

describe('FocusState Integration (Phase 150.2 Step 1)', () => {
  describe('FocusState Interface', () => {
    it('should initialize with null index and auto source', () => {
      expect(INITIAL_FOCUS_STATE).toEqual({
        index: null,
        source: 'auto',
        timestamp: 0,
      });
    });

    it('should have valid structure with index, source, timestamp', () => {
      const state: FocusState = {
        index: 5,
        source: 'manual',
        timestamp: 1000,
      };
      expect(state).toBeDefined();
      expect(state.index).toBe(5);
      expect(state.source).toBe('manual');
      expect(state.timestamp).toBe(1000);
    });

    it('should support null index for cleared focus', () => {
      const state: FocusState = {
        index: null,
        source: 'external',
        timestamp: 2000,
      };
      expect(state.index).toBeNull();
    });
  });

  describe('isValidFocusState', () => {
    it('should validate correct FocusState', () => {
      const validState: FocusState = {
        index: 3,
        source: 'auto',
        timestamp: 1500,
      };
      expect(isValidFocusState(validState)).toBe(true);
    });

    it('should accept null index as valid', () => {
      const nullIndexState: FocusState = {
        index: null,
        source: 'manual',
        timestamp: 1500,
      };
      expect(isValidFocusState(nullIndexState)).toBe(true);
    });

    it('should reject NaN index', () => {
      const nanState: FocusState = {
        index: NaN,
        source: 'auto',
        timestamp: 1500,
      };
      expect(isValidFocusState(nanState)).toBe(false);
    });

    it('should reject invalid source', () => {
      const invalidSourceState = {
        index: 5,
        source: 'invalid',
        timestamp: 1500,
      } as unknown as FocusState;
      expect(isValidFocusState(invalidSourceState)).toBe(false);
    });

    it('should reject negative timestamp', () => {
      const negativeTimestampState: FocusState = {
        index: 5,
        source: 'auto',
        timestamp: -100,
      };
      expect(isValidFocusState(negativeTimestampState)).toBe(false);
    });

    it('should accept 0 timestamp as valid (special case)', () => {
      const zeroTimestampState: FocusState = {
        index: 5,
        source: 'auto',
        timestamp: 0,
      };
      expect(isValidFocusState(zeroTimestampState)).toBe(true);
    });
  });

  describe('createFocusState', () => {
    it('should create FocusState with current timestamp', () => {
      const beforeTime = Date.now();
      const state = createFocusState(7, 'auto');
      const afterTime = Date.now();

      expect(state.index).toBe(7);
      expect(state.source).toBe('auto');
      expect(state.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(state.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should default source to auto', () => {
      const state = createFocusState(5);
      expect(state.source).toBe('auto');
    });

    it('should create with manual source', () => {
      const state = createFocusState(3, 'manual');
      expect(state.source).toBe('manual');
    });

    it('should create with external source', () => {
      const state = createFocusState(2, 'external');
      expect(state.source).toBe('external');
    });

    it('should create with null index', () => {
      const state = createFocusState(null, 'auto');
      expect(state.index).toBeNull();
    });

    it('should create different timestamps for sequential calls', async () => {
      const state1 = createFocusState(1);
      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      const state2 = createFocusState(2);

      expect(state2.timestamp).toBeGreaterThanOrEqual(state1.timestamp);
    });
  });

  describe('isSameFocusState', () => {
    it('should return true for identical states (ignoring timestamp)', () => {
      const state1: FocusState = {
        index: 5,
        source: 'manual',
        timestamp: 1000,
      };
      const state2: FocusState = {
        index: 5,
        source: 'manual',
        timestamp: 2000, // Different timestamp
      };
      expect(isSameFocusState(state1, state2)).toBe(true);
    });

    it('should return false for different index', () => {
      const state1: FocusState = {
        index: 5,
        source: 'manual',
        timestamp: 1000,
      };
      const state2: FocusState = {
        index: 6,
        source: 'manual',
        timestamp: 1000,
      };
      expect(isSameFocusState(state1, state2)).toBe(false);
    });

    it('should return false for different source', () => {
      const state1: FocusState = {
        index: 5,
        source: 'manual',
        timestamp: 1000,
      };
      const state2: FocusState = {
        index: 5,
        source: 'auto',
        timestamp: 1000,
      };
      expect(isSameFocusState(state1, state2)).toBe(false);
    });

    it('should return true for both null index (ignoring timestamp)', () => {
      const state1: FocusState = {
        index: null,
        source: 'auto',
        timestamp: 1000,
      };
      const state2: FocusState = {
        index: null,
        source: 'auto',
        timestamp: 3000,
      };
      expect(isSameFocusState(state1, state2)).toBe(true);
    });

    it('should return false for one null and one non-null index', () => {
      const state1: FocusState = {
        index: null,
        source: 'auto',
        timestamp: 1000,
      };
      const state2: FocusState = {
        index: 5,
        source: 'auto',
        timestamp: 1000,
      };
      expect(isSameFocusState(state1, state2)).toBe(false);
    });
  });
});
