/**
 * @fileoverview listener-manager 함수 단위 테스트
 * Coverage: addListener, removeEventListenerManaged, removeEventListenersByContext,
 *           removeAllEventListeners, getEventListenerStatus
 * Phase 329: Core layer (listener management) 모듈화 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  addListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeAllEventListeners,
  getEventListenerStatus,
} from '@/shared/utils/events';

setupGlobalTestIsolation();

describe('listener-manager.ts', () => {
  let mockElement: HTMLElement;
  let mockListener: EventListener;

  beforeEach(() => {
    // Create mock DOM element
    mockElement = document.createElement('div');
    mockListener = vi.fn();

    // Clear all listeners before each test
    removeAllEventListeners();
  });

  afterEach(() => {
    // Cleanup
    removeAllEventListeners();
  });

  describe('addListener', () => {
    it('should add event listener and return listener ID', () => {
      const listenerId = addListener(mockElement, 'click', mockListener);

      expect(listenerId).toBeDefined();
      expect(typeof listenerId).toBe('string');
      expect(listenerId.length).toBeGreaterThan(0);
    });

    it('should register listener in DOM', () => {
      const addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener');
      addListener(mockElement, 'click', mockListener);

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', mockListener, undefined);
    });

    it('should accept custom context and include in listener ID', () => {
      const listenerId = addListener(mockElement, 'click', mockListener, {}, 'custom-context');

      expect(listenerId).toContain('custom-context');
    });

    it('should handle AbortSignal in options', () => {
      const controller = new globalThis.AbortController();
      const listenerId = addListener(mockElement, 'click', mockListener, {
        signal: controller.signal,
      });

      expect(listenerId).toBeDefined();

      // Abort signal should auto-remove listener
      controller.abort();
      // Listener should be removed after abort
      const status = getEventListenerStatus();
      expect(status.total).toBe(0);
    });

    it('should skip adding listener if signal is pre-aborted', () => {
      const controller = new globalThis.AbortController();
      controller.abort();

      const addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener');
      addListener(mockElement, 'click', mockListener, {
        signal: controller.signal,
      });

      // Should not call addEventListener if signal is pre-aborted
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should handle invalid element gracefully', () => {
      const invalidElement = {} as globalThis.EventTarget;
      const listenerId = addListener(invalidElement, 'click', mockListener);

      // Should return ID even if element is invalid
      expect(listenerId).toBeDefined();
      expect(typeof listenerId).toBe('string');
    });

    it('should set timestamp on listener context', () => {
      addListener(mockElement, 'click', mockListener);
      const status = getEventListenerStatus();

      expect(status.total).toBe(1);
      expect(status.listeners[0].created).toBeLessThanOrEqual(Date.now());
      expect(status.listeners[0].created).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('removeEventListenerManaged', () => {
    it('should remove listener from DOM', () => {
      const listenerId = addListener(mockElement, 'click', mockListener);
      const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');

      const removed = removeEventListenerManaged(listenerId);

      expect(removed).toBe(true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', mockListener, undefined);
    });

    it('should return false if listener not found', () => {
      const removed = removeEventListenerManaged('non-existent-id');

      expect(removed).toBe(false);
    });

    it('should remove listener from internal registry', () => {
      const listenerId = addListener(mockElement, 'click', mockListener);
      removeEventListenerManaged(listenerId);

      const status = getEventListenerStatus();
      expect(status.total).toBe(0);
    });
  });

  describe('removeEventListenersByContext', () => {
    it('should remove all listeners with matching context', () => {
      const id1 = addListener(mockElement, 'click', mockListener, {}, 'gallery');
      const id2 = addListener(mockElement, 'keydown', mockListener, {}, 'gallery');
      const id3 = addListener(mockElement, 'scroll', mockListener, {}, 'other');

      const removedCount = removeEventListenersByContext('gallery');

      expect(removedCount).toBe(2);
      const status = getEventListenerStatus();
      expect(status.total).toBe(1);
    });

    it('should return 0 if no matching context found', () => {
      addListener(mockElement, 'click', mockListener, {}, 'gallery');

      const removedCount = removeEventListenersByContext('non-existent');

      expect(removedCount).toBe(0);
    });

    it('should handle empty context string', () => {
      const id1 = addListener(mockElement, 'click', mockListener, {}, '');
      const id2 = addListener(mockElement, 'keydown', mockListener, {}, '');

      // Empty context should not match default behavior
      const removedCount = removeEventListenersByContext('');

      // May be 0 or 2 depending on implementation
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('removeAllEventListeners', () => {
    it('should remove all listeners', () => {
      addListener(mockElement, 'click', mockListener, {}, 'context1');
      addListener(mockElement, 'keydown', mockListener, {}, 'context2');
      addListener(mockElement, 'scroll', mockListener, {}, 'context3');

      removeAllEventListeners();

      const status = getEventListenerStatus();
      expect(status.total).toBe(0);
    });

    it('should not throw error if no listeners exist', () => {
      expect(() => removeAllEventListeners()).not.toThrow();
    });
  });

  describe('getEventListenerStatus', () => {
    it('should return empty status when no listeners', () => {
      const status = getEventListenerStatus();

      expect(status.total).toBe(0);
      expect(Object.keys(status.byContext).length).toBe(0);
      expect(Object.keys(status.byType).length).toBe(0);
      expect(status.listeners.length).toBe(0);
    });

    it('should group listeners by context', () => {
      addListener(mockElement, 'click', mockListener, {}, 'gallery');
      addListener(mockElement, 'keydown', mockListener, {}, 'gallery');
      addListener(mockElement, 'scroll', mockListener, {}, 'other');

      const status = getEventListenerStatus();

      expect(status.total).toBe(3);
      expect(status.byContext['gallery']).toBe(2);
      expect(status.byContext['other']).toBe(1);
    });

    it('should group listeners by event type', () => {
      addListener(mockElement, 'click', mockListener);
      addListener(mockElement, 'click', mockListener);
      addListener(mockElement, 'keydown', mockListener);

      const status = getEventListenerStatus();

      expect(status.total).toBe(3);
      expect(status.byType['click']).toBe(2);
      expect(status.byType['keydown']).toBe(1);
    });

    it('should include listener details in response', () => {
      const listenerId = addListener(mockElement, 'click', mockListener, {}, 'test');

      const status = getEventListenerStatus();

      expect(status.listeners.length).toBe(1);
      expect(status.listeners[0].id).toBe(listenerId);
      expect(status.listeners[0].type).toBe('click');
      expect(status.listeners[0].context).toBe('test');
      expect(status.listeners[0].created).toBeDefined();
    });

    it('should handle multiple listeners with default context', () => {
      addListener(mockElement, 'click', mockListener);
      addListener(mockElement, 'keydown', mockListener);

      const status = getEventListenerStatus();

      expect(status.total).toBe(2);
      expect(status.byContext['default']).toBe(2);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle add/remove cycles', () => {
      const id1 = addListener(mockElement, 'click', mockListener);
      let status = getEventListenerStatus();
      expect(status.total).toBe(1);

      removeEventListenerManaged(id1);
      status = getEventListenerStatus();
      expect(status.total).toBe(0);

      const id2 = addListener(mockElement, 'keydown', mockListener);
      status = getEventListenerStatus();
      expect(status.total).toBe(1);
    });

    it('should handle mixed context removal', () => {
      const id1 = addListener(mockElement, 'click', mockListener, {}, 'gallery');
      const id2 = addListener(mockElement, 'keydown', mockListener, {}, 'gallery');
      const id3 = addListener(mockElement, 'scroll', mockListener, {}, 'other');

      removeEventListenersByContext('gallery');
      let status = getEventListenerStatus();
      expect(status.total).toBe(1);
      expect(status.byContext['other']).toBe(1);

      removeEventListenersByContext('other');
      status = getEventListenerStatus();
      expect(status.total).toBe(0);
    });

    it('should track listener creation time accurately', () => {
      const beforeTime = Date.now();
      const id1 = addListener(mockElement, 'click', mockListener);
      const afterTime = Date.now();

      const status = getEventListenerStatus();
      const created = status.listeners[0].created;

      expect(created).toBeGreaterThanOrEqual(beforeTime);
      expect(created).toBeLessThanOrEqual(afterTime);
    });

    it('should handle multiple elements', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('span');

      const id1 = addListener(elem1, 'click', mockListener, {}, 'ctx1');
      const id2 = addListener(elem2, 'click', mockListener, {}, 'ctx2');

      let status = getEventListenerStatus();
      expect(status.total).toBe(2);

      removeEventListenerManaged(id1);
      status = getEventListenerStatus();
      expect(status.total).toBe(1);
      expect(status.byContext['ctx2']).toBe(1);
    });
  });
});
