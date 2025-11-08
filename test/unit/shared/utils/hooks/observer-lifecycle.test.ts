/**
 * @fileoverview Unit tests for observer-lifecycle utilities
 * @module test/unit/shared/utils/hooks/observer-lifecycle
 * @version 1.0.0
 * @since Phase 350
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createManagedIntersectionObserver,
  createManagedMutationObserver,
  createManagedResizeObserver,
  createObserverGroup,
} from '@shared/utils/hooks';

describe('observer-lifecycle', () => {
  let cleanup: (() => void)[] = [];

  beforeEach(() => {
    cleanup = [];
  });

  afterEach(() => {
    cleanup.forEach(fn => fn());
    cleanup = [];
  });

  describe('createManagedIntersectionObserver', () => {
    it('should create observer with callback', () => {
      const callback = vi.fn();
      const observer = createManagedIntersectionObserver(callback);
      cleanup.push(() => observer.disconnect());

      expect(observer).toBeDefined();
      expect(observer.observe).toBeInstanceOf(Function);
      expect(observer.disconnect).toBeInstanceOf(Function);
    });

    it('should observe target element', () => {
      const callback = vi.fn();
      const observer = createManagedIntersectionObserver(callback);
      cleanup.push(() => observer.disconnect());

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());

      expect(() => observer.observe(element)).not.toThrow();
    });

    it('should disconnect observer', () => {
      const callback = vi.fn();
      const observer = createManagedIntersectionObserver(callback);

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());

      observer.observe(element);
      expect(() => observer.disconnect()).not.toThrow();
    });

    it('should handle multiple disconnect calls safely', () => {
      const callback = vi.fn();
      const observer = createManagedIntersectionObserver(callback);

      observer.disconnect();
      expect(() => observer.disconnect()).not.toThrow();
    });

    it('should accept intersection observer options', () => {
      const callback = vi.fn();
      const options = { threshold: 0.5, rootMargin: '10px' };
      const observer = createManagedIntersectionObserver(callback, options);
      cleanup.push(() => observer.disconnect());

      expect(observer).toBeDefined();
    });
  });

  describe('createManagedMutationObserver', () => {
    it('should create observer with callback', () => {
      const callback = vi.fn();
      const observer = createManagedMutationObserver(callback);
      cleanup.push(() => observer.disconnect());

      expect(observer).toBeDefined();
      expect(observer.observe).toBeInstanceOf(Function);
      expect(observer.disconnect).toBeInstanceOf(Function);
    });

    it('should observe target element with options', () => {
      const callback = vi.fn();
      const observer = createManagedMutationObserver(callback);
      cleanup.push(() => observer.disconnect());

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());

      const options = { childList: true, subtree: true };
      expect(() => observer.observe(element, options)).not.toThrow();
    });

    it('should disconnect observer', () => {
      const callback = vi.fn();
      const observer = createManagedMutationObserver(callback);

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());

      observer.observe(element, { childList: true });
      expect(() => observer.disconnect()).not.toThrow();
    });

    it('should handle multiple disconnect calls safely', () => {
      const callback = vi.fn();
      const observer = createManagedMutationObserver(callback);

      observer.disconnect();
      expect(() => observer.disconnect()).not.toThrow();
    });

    it('should detect mutations when childList changes', async () => {
      const callback = vi.fn();
      const observer = createManagedMutationObserver(callback);
      cleanup.push(() => observer.disconnect());

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());

      observer.observe(element, { childList: true });

      const child = document.createElement('span');
      element.appendChild(child);

      // MutationObserver is async, need to wait
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('createManagedResizeObserver', () => {
    it('should create observer with callback', () => {
      const callback = vi.fn();
      const observer = createManagedResizeObserver(callback);
      cleanup.push(() => observer.disconnect());

      expect(observer).toBeDefined();
      expect(observer.observe).toBeInstanceOf(Function);
      expect(observer.disconnect).toBeInstanceOf(Function);
    });

    it('should observe target element', () => {
      const callback = vi.fn();
      const observer = createManagedResizeObserver(callback);
      cleanup.push(() => observer.disconnect());

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());

      expect(() => observer.observe(element)).not.toThrow();
    });

    it('should disconnect observer', () => {
      const callback = vi.fn();
      const observer = createManagedResizeObserver(callback);

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());

      observer.observe(element);
      expect(() => observer.disconnect()).not.toThrow();
    });

    it('should handle multiple disconnect calls safely', () => {
      const callback = vi.fn();
      const observer = createManagedResizeObserver(callback);

      observer.disconnect();
      expect(() => observer.disconnect()).not.toThrow();
    });

    it('should accept resize observer options', () => {
      const callback = vi.fn();
      const options = { box: 'border-box' as const };
      const observer = createManagedResizeObserver(callback, options);
      cleanup.push(() => observer.disconnect());

      expect(observer).toBeDefined();
    });
  });

  describe('createObserverGroup', () => {
    it('should create empty observer group', () => {
      const group = createObserverGroup();
      cleanup.push(() => group.disconnectAll());

      expect(group).toBeDefined();
      expect(group.add).toBeInstanceOf(Function);
      expect(group.disconnectAll).toBeInstanceOf(Function);
      expect(group.getActiveCount).toBeInstanceOf(Function);
      expect(group.getActiveCount()).toBe(0);
    });

    it('should add observers to group', () => {
      const group = createObserverGroup();
      cleanup.push(() => group.disconnectAll());

      const callback = vi.fn();
      const observer = createManagedIntersectionObserver(callback);

      const element = document.createElement('div');
      document.body.appendChild(element);
      cleanup.push(() => element.remove());
      observer.observe(element); // observe를 호출해야 isActive가 true

      group.add(observer);
      expect(group.getActiveCount()).toBe(1);
    });

    it('should disconnect all observers in group', () => {
      const group = createObserverGroup();

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const observer1 = createManagedIntersectionObserver(callback1);
      const observer2 = createManagedMutationObserver(callback2);

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      cleanup.push(() => {
        element1.remove();
        element2.remove();
      });

      observer1.observe(element1);
      observer2.observe(element2, { childList: true });

      group.add(observer1);
      group.add(observer2);
      expect(group.getActiveCount()).toBe(2);

      group.disconnectAll();
      expect(group.getActiveCount()).toBe(0);
    });

    it('should track active observer count', () => {
      const group = createObserverGroup();
      cleanup.push(() => group.disconnectAll());

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const observer1 = createManagedIntersectionObserver(callback1);
      const observer2 = createManagedResizeObserver(callback2);

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      cleanup.push(() => {
        element1.remove();
        element2.remove();
      });

      expect(group.getActiveCount()).toBe(0);

      observer1.observe(element1);
      group.add(observer1);
      expect(group.getActiveCount()).toBe(1);

      observer2.observe(element2);
      group.add(observer2);
      expect(group.getActiveCount()).toBe(2);
    });

    it('should handle empty disconnectAll call', () => {
      const group = createObserverGroup();

      expect(() => group.disconnectAll()).not.toThrow();
      expect(group.getActiveCount()).toBe(0);
    });
  });
});
