/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ItemScrollState,
  INITIAL_ITEM_SCROLL_STATE,
  createItemScrollState,
  updateItemScrollState,
  resetItemScrollState,
  clearItemScrollTimeouts,
  isSameItemScrollState,
} from '@shared/state/item-scroll';

describe('ItemScrollState', () => {
  describe('INITIAL_ITEM_SCROLL_STATE', () => {
    it('should have correct initial values', () => {
      expect(INITIAL_ITEM_SCROLL_STATE.lastScrolledIndex).toBe(-1);
      expect(INITIAL_ITEM_SCROLL_STATE.pendingIndex).toBeNull();
      expect(INITIAL_ITEM_SCROLL_STATE.userScrollDetected).toBe(false);
      expect(INITIAL_ITEM_SCROLL_STATE.isAutoScrolling).toBe(false);
      expect(INITIAL_ITEM_SCROLL_STATE.lastScrollTime).toBe(0);
      expect(INITIAL_ITEM_SCROLL_STATE.lastUserScrollTime).toBe(0);
      expect(INITIAL_ITEM_SCROLL_STATE.retryCount).toBe(0);
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
        lastScrollTime: 1000,
        lastUserScrollTime: 2000,
        retryCount: 2,
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
      const updated = updateItemScrollState(state, { retryCount: 5 });

      expect(state).not.toBe(updated);
      expect(state.retryCount).toBe(0);
      expect(updated.retryCount).toBe(5);
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
        lastScrollTime: 3000,
        lastUserScrollTime: 4000,
        retryCount: 10,
        scrollTimeoutId: 111,
        userScrollTimeoutId: 222,
        indexWatcherId: 333,
      };

      const updated = updateItemScrollState(state, newState);
      expect(updated).toEqual(newState);
    });
  });

  describe('resetItemScrollState', () => {
    it('should reset to initial state', () => {
      const state = createItemScrollState({
        lastScrolledIndex: 50,
        userScrollDetected: true,
        retryCount: 5,
      });

      const reset = resetItemScrollState(state);
      expect(reset).toEqual(INITIAL_ITEM_SCROLL_STATE);
    });

    it('should always return same initial state reference', () => {
      const state1 = resetItemScrollState(createItemScrollState({ lastScrolledIndex: 1 }));
      const state2 = resetItemScrollState(createItemScrollState({ lastScrolledIndex: 2 }));

      expect(state1).toBe(state2);
      expect(state1).toBe(INITIAL_ITEM_SCROLL_STATE);
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

  describe('isSameItemScrollState', () => {
    it('should return true for identical states', () => {
      const state1 = createItemScrollState({
        lastScrolledIndex: 5,
        pendingIndex: 10,
        userScrollDetected: true,
      });
      const state2 = createItemScrollState({
        lastScrolledIndex: 5,
        pendingIndex: 10,
        userScrollDetected: true,
      });

      expect(isSameItemScrollState(state1, state2)).toBe(true);
    });

    it('should return false when lastScrolledIndex differs', () => {
      const state1 = createItemScrollState({ lastScrolledIndex: 5 });
      const state2 = createItemScrollState({ lastScrolledIndex: 6 });

      expect(isSameItemScrollState(state1, state2)).toBe(false);
    });

    it('should return false when pendingIndex differs', () => {
      const state1 = createItemScrollState({ pendingIndex: 10 });
      const state2 = createItemScrollState({ pendingIndex: 15 });

      expect(isSameItemScrollState(state1, state2)).toBe(false);
    });

    it('should return false when userScrollDetected differs', () => {
      const state1 = createItemScrollState({ userScrollDetected: true });
      const state2 = createItemScrollState({ userScrollDetected: false });

      expect(isSameItemScrollState(state1, state2)).toBe(false);
    });

    it('should return false when isAutoScrolling differs', () => {
      const state1 = createItemScrollState({ isAutoScrolling: true });
      const state2 = createItemScrollState({ isAutoScrolling: false });

      expect(isSameItemScrollState(state1, state2)).toBe(false);
    });

    it('should return false when retryCount differs', () => {
      const state1 = createItemScrollState({ retryCount: 2 });
      const state2 = createItemScrollState({ retryCount: 3 });

      expect(isSameItemScrollState(state1, state2)).toBe(false);
    });

    it('should ignore timeout IDs when comparing (not part of equality)', () => {
      const state1 = createItemScrollState({
        lastScrolledIndex: 5,
        scrollTimeoutId: 123,
      });
      const state2 = createItemScrollState({
        lastScrolledIndex: 5,
        scrollTimeoutId: 456,
      });

      // 타임아웃 ID는 비교에 포함되지 않음
      expect(isSameItemScrollState(state1, state2)).toBe(true);
    });

    it('should compare two identical initial states as same', () => {
      const state1 = INITIAL_ITEM_SCROLL_STATE;
      const state2 = createItemScrollState();

      expect(isSameItemScrollState(state1, state2)).toBe(true);
    });

    it('should handle complex scenarios', () => {
      const state1 = createItemScrollState({
        lastScrolledIndex: 10,
        pendingIndex: 20,
        userScrollDetected: true,
        isAutoScrolling: false,
        retryCount: 1,
        scrollTimeoutId: 999, // 비교 제외
      });

      const state2 = createItemScrollState({
        lastScrolledIndex: 10,
        pendingIndex: 20,
        userScrollDetected: true,
        isAutoScrolling: false,
        retryCount: 1,
        scrollTimeoutId: 111, // 다른 타임아웃 ID
      });

      expect(isSameItemScrollState(state1, state2)).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should enforce ItemScrollState type structure', () => {
      const state: ItemScrollState = {
        lastScrolledIndex: 0,
        pendingIndex: null,
        userScrollDetected: false,
        isAutoScrolling: false,
        lastScrollTime: 0,
        lastUserScrollTime: 0,
        retryCount: 0,
        scrollTimeoutId: null,
        userScrollTimeoutId: null,
        indexWatcherId: null,
      };

      expect(state).toBeDefined();
      expect(state.lastScrolledIndex).toBe(0);
    });
  });
});
