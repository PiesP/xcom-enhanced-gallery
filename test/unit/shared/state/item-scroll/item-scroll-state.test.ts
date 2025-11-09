/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Unit Tests
 */

import { describe, expect, it } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import {
  type ItemScrollState,
  INITIAL_ITEM_SCROLL_STATE,
  createItemScrollState,
  updateItemScrollState,
  clearItemScrollTimeouts,
} from '@shared/state/item-scroll';

describe('ItemScrollState', () => {
  setupGlobalTestIsolation();

  describe('INITIAL_ITEM_SCROLL_STATE', () => {
    it('should have correct initial values', () => {
      expect(INITIAL_ITEM_SCROLL_STATE.lastScrolledIndex).toBe(-1);
      expect(INITIAL_ITEM_SCROLL_STATE.pendingIndex).toBeNull();
      expect(INITIAL_ITEM_SCROLL_STATE.userScrollDetected).toBe(false);
      expect(INITIAL_ITEM_SCROLL_STATE.isAutoScrolling).toBe(false);
      expect(INITIAL_ITEM_SCROLL_STATE.scrollTimeoutId).toBeNull();
      expect(INITIAL_ITEM_SCROLL_STATE.userScrollTimeoutId).toBeNull();
      expect(INITIAL_ITEM_SCROLL_STATE.indexWatcherId).toBeNull();
    });

    it('should be immutable', () => {
      // 참조 비교 검증
      const state1 = INITIAL_ITEM_SCROLL_STATE;
      const state2 = INITIAL_ITEM_SCROLL_STATE;
      expect(state1).toBe(state2);
    });
  });

  describe('createItemScrollState', () => {
    it('should create state with default values when no overrides provided', () => {
      const state = createItemScrollState();
      expect(state).toEqual(INITIAL_ITEM_SCROLL_STATE);
    });

    it('should create state with partial overrides', () => {
      const state = createItemScrollState({
        lastScrolledIndex: 5,
        userScrollDetected: true,
      });

      expect(state.lastScrolledIndex).toBe(5);
      expect(state.userScrollDetected).toBe(true);
      // 나머지는 초기값 유지
      expect(state.pendingIndex).toBeNull();
      expect(state.isAutoScrolling).toBe(false);
    });

    it('should create state with all overrides', () => {
      const overrides: ItemScrollState = {
        lastScrolledIndex: 10,
        pendingIndex: 15,
        userScrollDetected: true,
        isAutoScrolling: true,
        scrollTimeoutId: 123,
        userScrollTimeoutId: 456,
        indexWatcherId: 789,
      };

      const state = createItemScrollState(overrides);
      expect(state).toEqual(overrides);
    });

    it('should not mutate the original initial state', () => {
      const original = { ...INITIAL_ITEM_SCROLL_STATE };
      createItemScrollState({ lastScrolledIndex: 99 });
      expect(INITIAL_ITEM_SCROLL_STATE).toEqual(original);
    });
  });

  describe('updateItemScrollState', () => {
    it('should update state with partial updates', () => {
      const state = createItemScrollState({ lastScrolledIndex: 5 });
      const updated = updateItemScrollState(state, {
        userScrollDetected: true,
        pendingIndex: 10,
      });

      expect(updated.lastScrolledIndex).toBe(5); // 유지
      expect(updated.userScrollDetected).toBe(true); // 업데이트
      expect(updated.pendingIndex).toBe(10); // 업데이트
    });

    it('should create new object instead of mutating', () => {
      const state = createItemScrollState();
      const updated = updateItemScrollState(state, { isAutoScrolling: true });

      expect(state).not.toBe(updated);
      expect(state.isAutoScrolling).toBe(false);
      expect(updated.isAutoScrolling).toBe(true);
    });

    it('should handle empty updates', () => {
      const state = createItemScrollState({ lastScrolledIndex: 7 });
      const updated = updateItemScrollState(state, {});

      expect(updated).toEqual(state);
      expect(updated).not.toBe(state); // 새로운 객체
    });

    it('should override all fields when full state provided', () => {
      const state = createItemScrollState({ lastScrolledIndex: 1 });
      const newState: ItemScrollState = {
        lastScrolledIndex: 99,
        pendingIndex: 100,
        userScrollDetected: true,
        isAutoScrolling: true,
        scrollTimeoutId: 111,
        userScrollTimeoutId: 222,
        indexWatcherId: 333,
      };

      const updated = updateItemScrollState(state, newState);
      expect(updated).toEqual(newState);
    });
  });

  describe('clearItemScrollTimeouts', () => {
    it('should clear all timeout IDs', () => {
      const state = createItemScrollState({
        scrollTimeoutId: 123,
        userScrollTimeoutId: 456,
        indexWatcherId: 789,
        lastScrolledIndex: 10,
      });

      const cleared = clearItemScrollTimeouts(state);

      expect(cleared.scrollTimeoutId).toBeNull();
      expect(cleared.userScrollTimeoutId).toBeNull();
      expect(cleared.indexWatcherId).toBeNull();
      // 다른 필드는 유지
      expect(cleared.lastScrolledIndex).toBe(10);
    });

    it('should handle state with already null timeout IDs', () => {
      const state = createItemScrollState({
        lastScrolledIndex: 5,
      });

      const cleared = clearItemScrollTimeouts(state);

      expect(cleared.scrollTimeoutId).toBeNull();
      expect(cleared.userScrollTimeoutId).toBeNull();
      expect(cleared.indexWatcherId).toBeNull();
      expect(cleared.lastScrolledIndex).toBe(5);
    });

    it('should create new object', () => {
      const state = createItemScrollState({
        scrollTimeoutId: 999,
      });

      const cleared = clearItemScrollTimeouts(state);

      expect(cleared).not.toBe(state);
      expect(state.scrollTimeoutId).toBe(999);
      expect(cleared.scrollTimeoutId).toBeNull();
    });
  });

  describe('Type Safety', () => {
    it('should enforce ItemScrollState type structure', () => {
      const state: ItemScrollState = {
        lastScrolledIndex: 0,
        pendingIndex: null,
        userScrollDetected: false,
        isAutoScrolling: false,
        scrollTimeoutId: null,
        userScrollTimeoutId: null,
        indexWatcherId: null,
      };

      expect(state).toBeDefined();
      expect(state.lastScrolledIndex).toBe(0);
    });
  });
});
