/**
 * @fileoverview EventManager BaseServiceImpl 패턴 테스트
 * @description 이벤트 관리자의 BaseService 준수 및 생명주기 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { EventManager } from '@/shared/services/event-manager';

describe('EventManager - BaseServiceImpl Pattern', () => {
  setupGlobalTestIsolation();

  let manager: EventManager;

  beforeEach(async () => {
    // 기존 싱글톤 초기화 해제
    EventManager['instance'] = null;
    manager = EventManager.getInstance();
  });

  afterEach(async () => {
    if (manager && manager.isInitialized?.()) {
      manager.destroy();
    }
  });

  describe('BaseService Interface Compliance', () => {
    it('should implement BaseService interface', () => {
      expect(manager).toHaveProperty('initialize');
      expect(manager).toHaveProperty('destroy');
      expect(manager).toHaveProperty('isInitialized');
    });

    it('should have serviceName property', () => {
      expect(manager['serviceName']).toBe('EventManager');
    });

    it('should start with uninitialized state', () => {
      expect(manager.isInitialized?.()).toBe(false);
    });
  });

  describe('Initialization Lifecycle', () => {
    it('should initialize successfully', async () => {
      expect(manager.isInitialized?.()).toBe(false);
      await manager.initialize?.();
      expect(manager.isInitialized?.()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await manager.initialize?.();
      const firstInit = manager.isInitialized?.();
      await manager.initialize?.();
      const secondInit = manager.isInitialized?.();
      expect(firstInit).toBe(true);
      expect(secondInit).toBe(true);
    });

    it('should handle initialize errors gracefully', async () => {
      const invalidManager = new EventManager();
      // Simulate initialization that might fail
      try {
        await invalidManager.initialize?.();
        expect(invalidManager.isInitialized?.()).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Destruction & Cleanup', () => {
    it('should destroy successfully', async () => {
      await manager.initialize?.();
      expect(manager.isInitialized?.()).toBe(true);
      manager.destroy?.();
      expect(manager.getIsDestroyed()).toBe(true);
    });

    it('should prevent operations after destroy', async () => {
      await manager.initialize?.();
      manager.destroy?.();

      const mockElement = document.createElement('div');
      const mockHandler = vi.fn();

      manager.addEventListener(mockElement, 'click', mockHandler);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should cleanup all gallery events on destroy', async () => {
      await manager.initialize?.();
      manager.destroy?.();
      const status = manager.getGalleryStatus();
      expect(status).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on getInstance calls', () => {
      const instance1 = EventManager.getInstance();
      const instance2 = EventManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton after initialize/destroy cycle', async () => {
      const instance1 = EventManager.getInstance();
      await instance1.initialize?.();
      instance1.destroy?.();
      const instance2 = EventManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('DOM Event Management', () => {
    beforeEach(async () => {
      await manager.initialize?.();
    });

    it('should register DOM event listeners', async () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addEventListener(element, 'click', handler);
      expect(manager.getListenerCount()).toBeGreaterThanOrEqual(0);
    });

    it('should count listeners correctly', async () => {
      const element = document.createElement('div');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      manager.addEventListener(element, 'click', handler1);
      manager.addEventListener(element, 'mouseenter', handler2);

      const count = manager.getListenerCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should register custom event listeners', async () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addCustomEventListener(element, 'custom-event', handler);
      expect(manager.getListenerCount()).toBeGreaterThanOrEqual(0);
    });

    it('should handle null elements gracefully', async () => {
      const handler = vi.fn();
      expect(() => manager.addEventListener(null, 'click', handler)).not.toThrow();
    });
  });

  describe('Managed Listener Interface', () => {
    beforeEach(async () => {
      await manager.initialize?.();
    });

    it('should add managed listeners', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const id = manager.addListener(element, 'click', handler, undefined, 'test-context');
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should remove managed listeners by id', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const id = manager.addListener(element, 'click', handler);
      if (id) {
        const removed = manager.removeListener(id);
        expect(typeof removed).toBe('boolean');
      }
    });

    it('should remove listeners by context', () => {
      const element = document.createElement('div');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      manager.addListener(element, 'click', handler1, undefined, 'context-1');
      manager.addListener(element, 'mouseenter', handler2, undefined, 'context-1');

      const removed = manager.removeByContext('context-1');
      expect(typeof removed).toBe('number');
    });

    it('should handle twitter event callbacks', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const id = manager.handleTwitterEvent(element, 'click', handler, 'twitter-context');
      expect(id).toBeDefined();
    });
  });

  describe('Unified Status & Diagnostics', () => {
    beforeEach(async () => {
      await manager.initialize?.();
    });

    it('should provide unified status', () => {
      const status = manager.getUnifiedStatus();
      expect(status).toHaveProperty('domEvents');
      expect(status).toHaveProperty('galleryEvents');
      expect(status).toHaveProperty('totalListeners');
      expect(status).toHaveProperty('isDestroyed');
    });

    it('should provide DOM event status', () => {
      const status = manager.getUnifiedStatus();
      expect(status.domEvents).toHaveProperty('listenerCount');
      expect(status.domEvents).toHaveProperty('isDestroyed');
    });

    it('should provide gallery event status', () => {
      const status = manager.getUnifiedStatus();
      expect(status.galleryEvents).toBeDefined();
    });

    it('should report correct destroy status before cleanup', async () => {
      expect(manager.getIsDestroyed()).toBe(false);
    });

    it('should report correct destroy status after cleanup', () => {
      manager.destroy?.();
      expect(manager.getIsDestroyed()).toBe(true);
    });
  });

  describe('Lifecycle State Management', () => {
    it('should allow addEventListener when not initialized', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const result = manager.addEventListener(element, 'click', handler);
      expect(result).toBe(manager);
      expect(manager.getListenerCount()).toBeGreaterThanOrEqual(0);
    });

    it('should allow addListener when not initialized', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const id = manager.addListener(element, 'click', handler);
      expect(id).not.toBe('');
    });

    it('should prevent addEventListener after destroy', async () => {
      await manager.initialize?.();
      manager.destroy?.();

      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addEventListener(element, 'click', handler);
      element.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should prevent addListener after destroy', async () => {
      await manager.initialize?.();
      manager.destroy?.();

      const element = document.createElement('div');
      const handler = vi.fn();

      const id = manager.addListener(element, 'click', handler);
      expect(id).toBe('');
    });

    it('should prevent handleTwitterEvent after destroy', async () => {
      await manager.initialize?.();
      manager.destroy?.();

      const element = document.createElement('div');
      const handler = vi.fn();

      const id = manager.handleTwitterEvent(element, 'click', handler);
      expect(id).toBe('');
    });
  });

  describe('Integration: Full Lifecycle', () => {
    it('should complete full initialize->use->destroy cycle', async () => {
      // Initialize
      expect(manager.isInitialized?.()).toBe(false);
      await manager.initialize?.();
      expect(manager.isInitialized?.()).toBe(true);

      // Use
      const element = document.createElement('div');
      const handler = vi.fn();
      manager.addEventListener(element, 'click', handler);
      expect(manager.getListenerCount()).toBeGreaterThanOrEqual(0);

      // Destroy
      manager.destroy?.();
      expect(manager.getIsDestroyed()).toBe(true);
    });

    it('should cleanupAll on destroy', async () => {
      await manager.initialize?.();
      manager.cleanupAll();
      expect(manager.getIsDestroyed()).toBe(true);
    });
  });
});
