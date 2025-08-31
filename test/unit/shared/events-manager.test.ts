import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  addListener,
  addMultipleEventListeners,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeEventListenersByType,
  clearAllEventListeners,
  getActiveListenerCount,
  cleanupEventDispatcher,
} from '@shared/utils/events';

// Minimal fake EventTarget implementation for addEventListener/removeEventListener/dispatchEvent
function createFakeTarget() {
  return {
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(listener);
    },
    removeEventListener(type, listener) {
      this.listeners[type] = (this.listeners[type] || []).filter(l => l !== listener);
    },
    dispatchEvent() {
      return true;
    },
  };
}

describe('event listener manager (pure parts)', () => {
  let target;

  beforeEach(() => {
    target = createFakeTarget();
  });

  afterEach(() => {
    // ensure cleanup between tests
    cleanupEventDispatcher();
  });

  it('adds and removes a single listener', () => {
    const id = addListener(target, 'click', () => {});
    expect(typeof id).toBe('string');
    expect(getActiveListenerCount()).toBeGreaterThan(0);

    const removed = removeEventListenerManaged(id);
    expect(removed).toBe(true);
    expect(getActiveListenerCount()).toBe(0);
  });

  it('adds multiple listeners and removes by type/context', () => {
    const ids = addMultipleEventListeners(target, ['a', 'b'], () => {}, undefined, 'ctx1');
    expect(ids.length).toBe(2);
    expect(getActiveListenerCount()).toBe(2);

    const removedByType = removeEventListenersByType('a');
    expect(removedByType).toBeGreaterThanOrEqual(1);

    // remaining listeners should be removed by context
    const removedByContext = removeEventListenersByContext('ctx1');
    expect(removedByContext).toBeGreaterThanOrEqual(0);
    expect(getActiveListenerCount()).toBe(0);
  });

  it('clearAllEventListeners deletes all entries', () => {
    addListener(target, 'x', () => {}, undefined, 'c1');
    addListener(target, 'y', () => {}, undefined, 'c2');
    expect(getActiveListenerCount()).toBeGreaterThanOrEqual(2);

    clearAllEventListeners();
    expect(getActiveListenerCount()).toBe(0);
  });
});
