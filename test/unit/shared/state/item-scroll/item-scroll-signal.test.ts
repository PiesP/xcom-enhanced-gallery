/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Signal Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createItemScrollStateSignal,
  updateStateSignal,
  hasItemScrollStateChanged,
  type ItemScrollStateSignal,
} from '@shared/state/item-scroll';
import { createItemScrollState, INITIAL_ITEM_SCROLL_STATE } from '@shared/state/item-scroll';

describe('ItemScrollStateSignal', () => {
  describe('createItemScrollStateSignal', () => {
    it('should create a signal with default initial state', () => {
      const signal = createItemScrollStateSignal();
      const state = signal.getState();

      expect(state).toEqual(INITIAL_ITEM_SCROLL_STATE);
    });

    it('should create a signal with custom initial state', () => {
      const signal = createItemScrollStateSignal({
        lastScrolledIndex: 5,
        userScrollDetected: true,
      });
      const state = signal.getState();

      expect(state.lastScrolledIndex).toBe(5);
      expect(state.userScrollDetected).toBe(true);
      expect(state.pendingIndex).toBeNull();
    });

    it('should create independent signal instances', () => {
      const signal1 = createItemScrollStateSignal();
      const signal2 = createItemScrollStateSignal();

      signal1.setState({ lastScrolledIndex: 10 });
      const state1 = signal1.getState();
      const state2 = signal2.getState();

      expect(state1.lastScrolledIndex).toBe(10);
      expect(state2.lastScrolledIndex).toBe(-1);
    });

    it('should return a valid ItemScrollStateSignal interface', () => {
      const signal = createItemScrollStateSignal();

      expect(typeof signal.getState).toBe('function');
      expect(typeof signal.setState).toBe('function');
      expect(typeof signal.reset).toBe('function');
      expect(typeof signal.clearTimeouts).toBe('function');
    });
  });

  describe('setState', () => {
    it('should update state with new value', () => {
      const signal = createItemScrollStateSignal();
      const newState = createItemScrollState({
        lastScrolledIndex: 15,
        retryCount: 2,
      });

      signal.setState(newState);
      const state = signal.getState();

      expect(state.lastScrolledIndex).toBe(15);
      expect(state.retryCount).toBe(2);
    });

    it('should update state with updater function', () => {
      const signal = createItemScrollStateSignal({ lastScrolledIndex: 5 });

      signal.setState(prev => ({
        ...prev,
        lastScrolledIndex: prev.lastScrolledIndex + 1,
      }));

      const state = signal.getState();
      expect(state.lastScrolledIndex).toBe(6);
    });

    it('should support functional updates preserving other fields', () => {
      const signal = createItemScrollStateSignal({
        lastScrolledIndex: 10,
        userScrollDetected: true,
        retryCount: 3,
      });

      signal.setState(prev => ({
        ...prev,
        lastScrolledIndex: 20,
      }));

      const state = signal.getState();
      expect(state.lastScrolledIndex).toBe(20);
      expect(state.userScrollDetected).toBe(true);
      expect(state.retryCount).toBe(3);
    });
  });

  describe('reset', () => {
    it('should reset state to initial value', () => {
      const signal = createItemScrollStateSignal({
        lastScrolledIndex: 50,
        retryCount: 5,
        userScrollDetected: true,
      });

      signal.reset();
      const state = signal.getState();

      expect(state).toEqual(INITIAL_ITEM_SCROLL_STATE);
    });

    it('should reset state for multiple calls', () => {
      const signal = createItemScrollStateSignal();

      signal.setState({ lastScrolledIndex: 10 });
      signal.reset();
      expect(signal.getState().lastScrolledIndex).toBe(-1);

      signal.setState({ lastScrolledIndex: 20 });
      signal.reset();
      expect(signal.getState().lastScrolledIndex).toBe(-1);
    });
  });

  describe('clearTimeouts', () => {
    it('should clear all timeout IDs', () => {
      const signal = createItemScrollStateSignal({
        scrollTimeoutId: 123,
        userScrollTimeoutId: 456,
        indexWatcherId: 789,
        lastScrolledIndex: 10,
      });

      signal.clearTimeouts();
      const state = signal.getState();

      expect(state.scrollTimeoutId).toBeNull();
      expect(state.userScrollTimeoutId).toBeNull();
      expect(state.indexWatcherId).toBeNull();
      // Other fields should be preserved
      expect(state.lastScrolledIndex).toBe(10);
    });

    it('should handle clearing already null timeout IDs', () => {
      const signal = createItemScrollStateSignal({
        lastScrolledIndex: 5,
      });

      signal.clearTimeouts();
      const state = signal.getState();

      expect(state.scrollTimeoutId).toBeNull();
      expect(state.userScrollTimeoutId).toBeNull();
      expect(state.indexWatcherId).toBeNull();
      expect(state.lastScrolledIndex).toBe(5);
    });
  });

  describe('updateStateSignal', () => {
    it('should update signal state with partial updates', () => {
      const signal = createItemScrollStateSignal({ lastScrolledIndex: 5 });

      updateStateSignal(signal.setState, {
        userScrollDetected: true,
        retryCount: 2,
      });

      const state = signal.getState();
      expect(state.lastScrolledIndex).toBe(5);
      expect(state.userScrollDetected).toBe(true);
      expect(state.retryCount).toBe(2);
    });

    it('should preserve other fields during partial updates', () => {
      const signal = createItemScrollStateSignal({
        lastScrolledIndex: 10,
        userScrollDetected: true,
        retryCount: 1,
        isAutoScrolling: false,
      });

      updateStateSignal(signal.setState, {
        pendingIndex: 20,
      });

      const state = signal.getState();
      expect(state.lastScrolledIndex).toBe(10);
      expect(state.userScrollDetected).toBe(true);
      expect(state.retryCount).toBe(1);
      expect(state.isAutoScrolling).toBe(false);
      expect(state.pendingIndex).toBe(20);
    });

    it('should handle empty updates', () => {
      const signal = createItemScrollStateSignal({ lastScrolledIndex: 7 });
      const prevState = signal.getState();

      updateStateSignal(signal.setState, {});

      const newState = signal.getState();
      // State should be the same semantically
      expect(newState.lastScrolledIndex).toBe(prevState.lastScrolledIndex);
    });
  });

  describe('hasItemScrollStateChanged', () => {
    it('should return true when state changes', () => {
      const state1 = createItemScrollState({ lastScrolledIndex: 5 });
      const state2 = createItemScrollState({ lastScrolledIndex: 10 });

      expect(hasItemScrollStateChanged(state1, state2)).toBe(true);
    });

    it('should return false when state is the same', () => {
      const state1 = createItemScrollState({ lastScrolledIndex: 5 });
      const state2 = createItemScrollState({ lastScrolledIndex: 5 });

      expect(hasItemScrollStateChanged(state1, state2)).toBe(false);
    });

    it('should ignore timeout IDs when comparing changes', () => {
      const state1 = createItemScrollState({
        lastScrolledIndex: 5,
        scrollTimeoutId: 123,
      });
      const state2 = createItemScrollState({
        lastScrolledIndex: 5,
        scrollTimeoutId: 456,
      });

      // Should return false because timeout IDs are not compared
      expect(hasItemScrollStateChanged(state1, state2)).toBe(false);
    });

    it('should detect changes in key state fields', () => {
      const baseState = createItemScrollState({
        lastScrolledIndex: 5,
        pendingIndex: null,
        userScrollDetected: false,
        isAutoScrolling: false,
        retryCount: 0,
      });

      const changedUserScroll = createItemScrollState({
        ...baseState,
        userScrollDetected: true,
      });

      const changedAutoScroll = createItemScrollState({
        ...baseState,
        isAutoScrolling: true,
      });

      const changedRetry = createItemScrollState({
        ...baseState,
        retryCount: 3,
      });

      expect(hasItemScrollStateChanged(baseState, changedUserScroll)).toBe(true);
      expect(hasItemScrollStateChanged(baseState, changedAutoScroll)).toBe(true);
      expect(hasItemScrollStateChanged(baseState, changedRetry)).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex state transitions', () => {
      const signal = createItemScrollStateSignal();

      // Transition 1: User scrolls
      signal.setState(prev => ({
        ...prev,
        userScrollDetected: true,
      }));

      // Transition 2: Set pending index
      updateStateSignal(signal.setState, {
        pendingIndex: 5,
      });

      const state1 = signal.getState();
      expect(state1.userScrollDetected).toBe(true);
      expect(state1.pendingIndex).toBe(5);

      // Transition 3: Clear timeouts and reset
      signal.clearTimeouts();
      signal.setState(prev => ({
        ...prev,
        lastScrolledIndex: 5,
        pendingIndex: null,
        userScrollDetected: false,
      }));

      const state2 = signal.getState();
      expect(state2.lastScrolledIndex).toBe(5);
      expect(state2.pendingIndex).toBeNull();
      expect(state2.userScrollDetected).toBe(false);
    });

    it('should work with multiple state updates in sequence', () => {
      const signal = createItemScrollStateSignal();

      // Update 1
      signal.setState({ lastScrolledIndex: 1 });
      expect(signal.getState().lastScrolledIndex).toBe(1);

      // Update 2
      updateStateSignal(signal.setState, {
        isAutoScrolling: true,
      });
      expect(signal.getState().isAutoScrolling).toBe(true);

      // Update 3 - increment retryCount
      updateStateSignal(signal.setState, {
        retryCount: 1,
      });
      expect(signal.getState().retryCount).toBe(1);

      // Verify all updates are preserved
      const finalState = signal.getState();
      expect(finalState.lastScrolledIndex).toBe(1);
      expect(finalState.isAutoScrolling).toBe(true);
      expect(finalState.retryCount).toBe(1);
    });
  });
});
