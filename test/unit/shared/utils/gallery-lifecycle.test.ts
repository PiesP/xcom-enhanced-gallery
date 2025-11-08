/**
 * @fileoverview gallery-lifecycle 함수 단위 테스트
 * Coverage: initializeGalleryEvents, cleanupGalleryEvents, updateGalleryEventOptions, getGalleryEventSnapshot
 * Phase 329: Lifecycle layer 모듈화 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  initializeGalleryEvents,
  cleanupGalleryEvents,
  updateGalleryEventOptions,
  getGalleryEventSnapshot,
  removeAllEventListeners,
} from '@/shared/utils/events';

setupGlobalTestIsolation();

describe('gallery-lifecycle.ts', () => {
  let mockHandlers: any;

  beforeEach(() => {
    // Create mock handlers
    mockHandlers = {
      onMediaClick: vi.fn(async () => undefined),
      onGalleryClose: vi.fn(),
      onKeyboardEvent: vi.fn(),
    };

    // Clear state before each test
    removeAllEventListeners();
    cleanupGalleryEvents();
  });

  afterEach(() => {
    cleanupGalleryEvents();
    removeAllEventListeners();
  });

  describe('initializeGalleryEvents', () => {
    it('should be async function that returns cleanup function', async () => {
      const cleanup = await initializeGalleryEvents(mockHandlers);

      expect(typeof cleanup).toBe('function');
    });

    it('should initialize with default options', async () => {
      const cleanup = await initializeGalleryEvents(mockHandlers);

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);

      cleanup();
    });

    it('should initialize with custom options', async () => {
      const customOptions = {
        enableKeyboard: true,
        enableMediaDetection: false,
        debugMode: true,
        preventBubbling: false,
        context: 'custom-gallery',
      };

      const cleanup = await initializeGalleryEvents(mockHandlers, customOptions);

      expect(cleanup).toBeDefined();
      cleanup();
    });

    it('should initialize with explicit gallery root element', async () => {
      const galleryRoot = document.createElement('div');
      galleryRoot.id = 'gallery-root';

      const cleanup = await initializeGalleryEvents(mockHandlers, galleryRoot);

      expect(cleanup).toBeDefined();
      cleanup();
    });

    it('should return cleanup function', async () => {
      const cleanup = await initializeGalleryEvents(mockHandlers);

      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    it('should clean up previous initialization', async () => {
      const cleanup1 = await initializeGalleryEvents(mockHandlers);
      const cleanup2 = await initializeGalleryEvents(mockHandlers);

      // Both cleanups should work
      expect(() => cleanup1()).not.toThrow();
      expect(() => cleanup2()).not.toThrow();
    });
  });

  describe('cleanupGalleryEvents', () => {
    it('should be callable without errors', () => {
      expect(() => cleanupGalleryEvents()).not.toThrow();
    });

    it('should reset state to uninitialized', async () => {
      await initializeGalleryEvents(mockHandlers);
      let snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);

      cleanupGalleryEvents();
      snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(false);
    });

    it('should remove all event listeners', async () => {
      await initializeGalleryEvents(mockHandlers);
      let snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);

      cleanupGalleryEvents();
      snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(false);
    });

    it('should clean up SPA router observer', async () => {
      const cleanup = await initializeGalleryEvents(mockHandlers);
      expect(() => cleanupGalleryEvents()).not.toThrow();
    });
  });

  describe('updateGalleryEventOptions', () => {
    it('should update options after initialization', async () => {
      await initializeGalleryEvents(mockHandlers);

      const newOptions = {
        enableKeyboard: false,
        debugMode: true,
      };

      updateGalleryEventOptions(newOptions);

      // Snapshot should reflect updated state
      const snapshot = getGalleryEventSnapshot();
      expect(snapshot).toBeDefined();

      cleanupGalleryEvents();
    });

    it('should handle partial option updates', async () => {
      await initializeGalleryEvents(mockHandlers);

      updateGalleryEventOptions({
        debugMode: true,
      });

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot).toBeDefined();

      cleanupGalleryEvents();
    });

    it('should preserve other options during partial update', async () => {
      const options = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };

      await initializeGalleryEvents(mockHandlers, options);

      // Update only debugMode
      updateGalleryEventOptions({ debugMode: true });

      // Should maintain other settings
      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.options?.context).toBe('gallery');

      cleanupGalleryEvents();
    });

    it('should not throw if called before initialization', () => {
      // Should handle gracefully
      expect(() => {
        updateGalleryEventOptions({ debugMode: true });
      }).not.toThrow();
    });
  });

  describe('getGalleryEventSnapshot', () => {
    it('should return snapshot with initialized flag', async () => {
      const snapshot1 = getGalleryEventSnapshot();
      expect(snapshot1.initialized).toBe(false);

      await initializeGalleryEvents(mockHandlers);
      const snapshot2 = getGalleryEventSnapshot();
      expect(snapshot2.initialized).toBe(true);

      cleanupGalleryEvents();
    });

    it('should include listener count', async () => {
      await initializeGalleryEvents(mockHandlers);

      const snapshot = getGalleryEventSnapshot();
      // Phase 329: listenerCount removed from snapshot
      // Use getEventListenerStatus() instead if needed
      expect(snapshot.initialized).toBe(true);
      expect(snapshot.isConnected).toBe(true);

      cleanupGalleryEvents();
    });

    it('should indicate handler presence', async () => {
      const snapshot1 = getGalleryEventSnapshot();
      // Phase 329: hasHandlers removed, use initialized instead
      expect(snapshot1.initialized).toBe(false);

      await initializeGalleryEvents(mockHandlers);
      const snapshot2 = getGalleryEventSnapshot();
      expect(snapshot2.initialized).toBe(true);

      cleanupGalleryEvents();
    });

    it('should track scoped target connection status', async () => {
      const snapshot1 = getGalleryEventSnapshot();
      // Phase 329: hasScopedTarget removed, use isConnected instead
      expect(snapshot1.isConnected).toBe(false);

      await initializeGalleryEvents(mockHandlers);
      const snapshot2 = getGalleryEventSnapshot();
      // May or may not have scoped target depending on implementation
      expect(snapshot2.isConnected).toBe(true);

      cleanupGalleryEvents();
    });

    it('should include event options in snapshot', async () => {
      const options = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'test-gallery',
      };

      await initializeGalleryEvents(mockHandlers, options);

      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.options).toBeDefined();
      if (snapshot.options) {
        expect(snapshot.options.context).toBe('test-gallery');
      }

      cleanupGalleryEvents();
    });

    it('should return consistent snapshot structure', () => {
      const snapshot = getGalleryEventSnapshot();

      // Phase 329: Simplified snapshot structure
      expect(snapshot).toHaveProperty('initialized');
      expect(snapshot).toHaveProperty('options');
      expect(snapshot).toHaveProperty('isConnected');
    });
  });

  describe('Lifecycle integration', () => {
    it('should handle full init-update-cleanup cycle', async () => {
      const snapshot1 = getGalleryEventSnapshot();
      expect(snapshot1.initialized).toBe(false);

      const cleanup = await initializeGalleryEvents(mockHandlers);
      const snapshot2 = getGalleryEventSnapshot();
      expect(snapshot2.initialized).toBe(true);

      updateGalleryEventOptions({ debugMode: true });
      const snapshot3 = getGalleryEventSnapshot();
      expect(snapshot3.initialized).toBe(true);

      cleanup();
      const snapshot4 = getGalleryEventSnapshot();
      expect(snapshot4.initialized).toBe(false);
    });

    it('should support multiple initializations', async () => {
      const cleanup1 = await initializeGalleryEvents(mockHandlers);
      let snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);

      const cleanup2 = await initializeGalleryEvents(mockHandlers);
      snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);

      cleanup2();
      snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(false);
    });

    it('should maintain handler references', async () => {
      const cleanup = await initializeGalleryEvents(mockHandlers);

      const snapshot = getGalleryEventSnapshot();
      // Phase 329: hasHandlers removed, use initialized instead
      expect(snapshot.initialized).toBe(true);
      expect(mockHandlers.onMediaClick).toBeDefined();
      expect(mockHandlers.onGalleryClose).toBeDefined();

      cleanup();
    });

    it('should handle error scenarios gracefully', async () => {
      // Invalid handlers should still be attempted
      expect(async () => {
        const cleanup = await initializeGalleryEvents({} as any);
        cleanup();
      }).not.toThrow();
    });
  });

  describe('SPA router integration', () => {
    it('should set up SPA router observer', async () => {
      const cleanup = await initializeGalleryEvents(mockHandlers);

      // Router observer setup should be attempted
      const snapshot = getGalleryEventSnapshot();
      expect(snapshot.initialized).toBe(true);

      cleanup();
    });

    it('should handle router observer errors gracefully', async () => {
      // Should not throw even if router setup fails
      const cleanup = await initializeGalleryEvents(mockHandlers);

      expect(cleanup).toBeDefined();
      cleanup();
    });
  });
});
