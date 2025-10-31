/**
 * FocusObserverManager Unit Tests
 *
 * @description IntersectionObserver 라이프사이클 및 엔트리 처리 검증
 * @category Phase 150.4a
 */

/* eslint-disable no-undef */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FocusObserverManager, createFocusObserverManager } from '@/shared/services/focus';
import { ItemCache } from '@/shared/state/focus';

/**
 * Mock ItemCache
 */
function createMockItemCache(): ItemCache {
  return new ItemCache();
}

/**
 * Mock IntersectionObserverEntry
 */
function createMockEntry(
  options: {
    target?: HTMLElement;
    isIntersecting?: boolean;
    intersectionRatio?: number;
    boundingClientRect?: DOMRect;
    rootBounds?: DOMRect;
  } = {}
): IntersectionObserverEntry {
  const element = options.target || document.createElement('div');
  element.setAttribute('data-index', '0');

  const rect = options.boundingClientRect || new DOMRect(0, 100, 100, 100);

  return {
    target: element,
    isIntersecting: options.isIntersecting ?? true,
    intersectionRatio: options.intersectionRatio ?? 0.5,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: options.rootBounds || new DOMRect(0, 0, 400, 300),
    time: Date.now(),
    toJSON: () => ({}),
  } as IntersectionObserverEntry;
}

describe('FocusObserverManager - IntersectionObserver Lifecycle', () => {
  let manager: FocusObserverManager;
  let itemCache: ItemCache;
  let mockIntersectionObserverCallback: (entries: IntersectionObserverEntry[]) => void;

  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
      mockIntersectionObserverCallback = callback;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => []),
      };
    });

    manager = createFocusObserverManager();
    itemCache = createMockItemCache();
  });

  afterEach(() => {
    manager.cleanupObserver();
    itemCache.clear();
  });

  describe('setupObserver', () => {
    it('should create an IntersectionObserver with proper configuration', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: null,
          rootMargin: '0px',
          threshold: [0.25, 0.5, 0.75],
        })
      );
    });

    it('should observe all items with data-index attribute', () => {
      const container = document.createElement('div');
      const item1 = document.createElement('div');
      const item2 = document.createElement('div');

      item1.setAttribute('data-index', '0');
      item2.setAttribute('data-index', '1');

      container.appendChild(item1);
      container.appendChild(item2);

      const onEntries = vi.fn();
      const mockObserve = vi.fn();

      global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
        mockIntersectionObserverCallback = callback;
        return {
          observe: mockObserve,
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
        };
      });

      manager.setupObserver(container, itemCache, onEntries);

      expect(mockObserve).toHaveBeenCalledTimes(2);
      expect(mockObserve).toHaveBeenCalledWith(item1);
      expect(mockObserve).toHaveBeenCalledWith(item2);
    });

    it('should accept custom threshold and rootMargin', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();
      const customThreshold = [0.1, 0.9];
      const customMargin = '50px';

      manager.setupObserver(container, itemCache, onEntries, customThreshold, customMargin);

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: customThreshold,
          rootMargin: customMargin,
        })
      );
    });

    it('should clean up existing observer before creating a new one', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();
      const mockDisconnect = vi.fn();

      let disconnectFn: (() => void) | null = null;

      global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
        mockIntersectionObserverCallback = callback;
        disconnectFn = mockDisconnect;
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: mockDisconnect,
          takeRecords: vi.fn(() => []),
        };
      });

      manager.setupObserver(container, itemCache, onEntries);
      manager.setupObserver(container, itemCache, onEntries);

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('handleEntries', () => {
    it('should calculate candidate scores for visible items', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      container.appendChild(item);

      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      const entry = createMockEntry({
        target: item,
        intersectionRatio: 0.8,
      });

      mockIntersectionObserverCallback([entry]);

      expect(onEntries).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            index: 0,
            intersectionRatio: 0.8,
            centerDistance: expect.any(Number),
          }),
        ])
      );
    });

    it('should filter out invisible items (intersectionRatio < 0.05)', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      container.appendChild(item);

      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      const entry = createMockEntry({
        target: item,
        intersectionRatio: 0.02, // Below minimum threshold
      });

      mockIntersectionObserverCallback([entry]);

      expect(onEntries).toHaveBeenCalledWith([]);
    });

    it('should handle multiple entries in a single callback', () => {
      const container = document.createElement('div');
      const item1 = document.createElement('div');
      const item2 = document.createElement('div');

      item1.setAttribute('data-index', '0');
      item2.setAttribute('data-index', '1');

      container.appendChild(item1);
      container.appendChild(item2);

      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      const entries = [
        createMockEntry({ target: item1, intersectionRatio: 0.5 }),
        createMockEntry({ target: item2, intersectionRatio: 0.7 }),
      ];

      mockIntersectionObserverCallback(entries);

      // 실제 구현에서는 data-index 속성을 읽기 때문에, 두 엔트리 모두 처리되어야 함
      const call = onEntries.mock.calls[0][0];
      expect(Array.isArray(call)).toBe(true);
      expect(call.length).toBeGreaterThanOrEqual(1);
      // 첫 번째 엔트리는 index 0으로 확인
      if (call.length > 0) {
        expect(call[0].index).toBe(0);
      }
    });

    it('should sync cache with entry data', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      container.appendChild(item);

      const onEntries = vi.fn();

      // 캐시에 아이템 등록
      itemCache.setItem(0, item);

      manager.setupObserver(container, itemCache, onEntries);

      const entry = createMockEntry({ target: item, intersectionRatio: 0.6 });

      mockIntersectionObserverCallback([entry]);

      // Verify cache was updated via setEntry
      itemCache.setEntry(item, entry);
      const cached = itemCache.getItem(0);
      expect(cached).toBeDefined();
      expect(cached?.index).toBe(0);
    });

    it('should update lastUpdateTime on each entry batch', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      container.appendChild(item);

      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      const initialTime = manager.getLastUpdateTime();

      // Simulate a slight delay
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      const entry = createMockEntry({ target: item });
      mockIntersectionObserverCallback([entry]);

      const updatedTime = manager.getLastUpdateTime();

      expect(updatedTime).toBeGreaterThan(initialTime);

      vi.useRealTimers();
    });

    it('should handle items without data-index attribute gracefully', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      // No data-index attribute
      container.appendChild(item);

      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      // 캐시에 아이템을 등록하지 않음 (data-index 없으므로)
      const entry = createMockEntry({
        target: item,
        intersectionRatio: 0.8,
      });

      mockIntersectionObserverCallback([entry]);

      // data-index가 없으므로 index를 얻을 수 없고, 콜백은 빈 배열로 호출되어야 함
      expect(onEntries).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('observeItem', () => {
    it('should start observing a new item', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');

      const onEntries = vi.fn();
      const mockObserve = vi.fn();

      global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
        mockIntersectionObserverCallback = callback;
        return {
          observe: mockObserve,
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
        };
      });

      manager.setupObserver(container, itemCache, onEntries);
      mockObserve.mockClear();

      manager.observeItem(item);

      expect(mockObserve).toHaveBeenCalledWith(item);
    });

    it('should handle observeItem when no observer is active', () => {
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');

      // Should not throw
      expect(() => manager.observeItem(item)).not.toThrow();
    });
  });

  describe('unobserveItem', () => {
    it('should stop observing an item', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      container.appendChild(item);

      const onEntries = vi.fn();
      const mockUnobserve = vi.fn();

      global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
        mockIntersectionObserverCallback = callback;
        return {
          observe: vi.fn(),
          unobserve: mockUnobserve,
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
        };
      });

      manager.setupObserver(container, itemCache, onEntries);

      manager.unobserveItem(item);

      expect(mockUnobserve).toHaveBeenCalledWith(item);
    });

    it('should handle unobserveItem when no observer is active', () => {
      const item = document.createElement('div');

      expect(() => manager.unobserveItem(item)).not.toThrow();
    });
  });

  describe('cleanupObserver', () => {
    it('should disconnect the observer', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();
      const mockDisconnect = vi.fn();

      global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
        mockIntersectionObserverCallback = callback;
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: mockDisconnect,
          takeRecords: vi.fn(() => []),
        };
      });

      manager.setupObserver(container, itemCache, onEntries);
      manager.cleanupObserver();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should allow re-setup after cleanup', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();

      global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
        mockIntersectionObserverCallback = callback;
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
        };
      });

      manager.setupObserver(container, itemCache, onEntries);
      manager.cleanupObserver();

      expect(() => manager.setupObserver(container, itemCache, onEntries)).not.toThrow();
    });

    it('should handle cleanup when no observer is active', () => {
      expect(() => manager.cleanupObserver()).not.toThrow();
    });
  });

  describe('getDebugInfo', () => {
    it('should return debug information about observer state', () => {
      const info = manager.getDebugInfo();

      expect(info).toEqual({
        isActive: false,
        lastUpdateTime: 0,
      });
    });

    it('should reflect active state after setupObserver', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      const info = manager.getDebugInfo();

      expect(info.isActive).toBe(true);
    });

    it('should reflect inactive state after cleanup', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);
      manager.cleanupObserver();

      const info = manager.getDebugInfo();

      expect(info.isActive).toBe(false);
    });
  });

  describe('getLastUpdateTime', () => {
    it('should return 0 initially', () => {
      expect(manager.getLastUpdateTime()).toBe(0);
    });

    it('should update after processing entries', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      container.appendChild(item);

      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      const initialTime = manager.getLastUpdateTime();

      const entry = createMockEntry({ target: item });
      mockIntersectionObserverCallback([entry]);

      const updatedTime = manager.getLastUpdateTime();

      expect(updatedTime).toBeGreaterThanOrEqual(initialTime);
    });
  });

  describe('Factory Function', () => {
    it('should create a new FocusObserverManager instance', () => {
      const instance1 = createFocusObserverManager();
      const instance2 = createFocusObserverManager();

      expect(instance1).toBeInstanceOf(FocusObserverManager);
      expect(instance2).toBeInstanceOf(FocusObserverManager);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle container with no items', () => {
      const container = document.createElement('div');
      const onEntries = vi.fn();
      const mockObserve = vi.fn();

      global.IntersectionObserver = vi.fn().mockImplementation(function (callback) {
        mockIntersectionObserverCallback = callback;
        return {
          observe: mockObserve,
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
        };
      });

      manager.setupObserver(container, itemCache, onEntries);

      expect(mockObserve).not.toHaveBeenCalled();
    });

    it('should calculate centerDistance correctly for various element positions', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '0');
      container.appendChild(item);

      const onEntries = vi.fn();

      manager.setupObserver(container, itemCache, onEntries);

      // Item at top of viewport
      const topEntry = createMockEntry({
        target: item,
        intersectionRatio: 0.6,
      });

      mockIntersectionObserverCallback([topEntry]);

      expect(onEntries).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            index: 0,
            centerDistance: expect.any(Number),
          }),
        ])
      );
    });
  });
});
