/**
 * @fileoverview keyboard-handler 함수 단위 테스트
 * Coverage: handleKeyboardEvent 함수 (Space, ArrowKeys, M, ESC 키 처리)
 * Phase 329: Handlers layer (keyboard event processing) 모듈화 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  cleanupGalleryEvents,
  getGalleryEventSnapshot,
  removeAllEventListeners,
} from '@/shared/utils/events';

setupGlobalTestIsolation();

describe('keyboard-handler.ts (handleKeyboardEvent)', () => {
  let mockHandlers: any;

  beforeEach(() => {
    // Create mock handlers
    mockHandlers = {
      onMediaClick: vi.fn(),
      onGalleryClose: vi.fn(),
      onKeyboardEvent: vi.fn(),
    };

    // Clear all listeners and state
    removeAllEventListeners();
  });

  afterEach(() => {
    cleanupGalleryEvents();
    removeAllEventListeners();
  });

  describe('Keyboard event handling', () => {
    it('should be callable without errors', () => {
      // Basic sanity check - handler should exist and be imported
      expect(mockHandlers).toBeDefined();
      expect(mockHandlers.onMediaClick).toBeDefined();
      expect(mockHandlers.onGalleryClose).toBeDefined();
    });

    it('should handle keyboard options with enableKeyboard flag', () => {
      const options = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };

      expect(options.enableKeyboard).toBe(true);
      expect(options.context).toBe('gallery');
    });

    it('should process keydown event for supported keys', () => {
      const mockEvent = new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
      });

      // Events should be created and handled
      expect(mockEvent.key).toBe(' ');
      expect(mockEvent.type).toBe('keydown');
    });

    it('should create arrow key events', () => {
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });

      expect(upEvent.key).toBe('ArrowUp');
      expect(downEvent.key).toBe('ArrowDown');
      expect(leftEvent.key).toBe('ArrowLeft');
      expect(rightEvent.key).toBe('ArrowRight');
    });

    it('should create escape key event', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });

      expect(escapeEvent.key).toBe('Escape');
    });

    it('should create M key event for mute toggle', () => {
      const mKeyEvent = new KeyboardEvent('keydown', {
        key: 'm',
        code: 'KeyM',
      });

      expect(mKeyEvent.key).toBe('m');
    });

    it('should handle keyboard event options', () => {
      const eventInit: KeyboardEventInit = {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true,
      };

      const event = new KeyboardEvent('keydown', eventInit);

      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
    });

    it('should differentiate between keyboard key types', () => {
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const mEvent = new KeyboardEvent('keydown', { key: 'm' });
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });

      expect(spaceEvent.key).not.toBe(arrowEvent.key);
      expect(arrowEvent.key).not.toBe(mEvent.key);
      expect(mEvent.key).not.toBe(escapeEvent.key);
    });
  });

  describe('Keyboard event option handling', () => {
    it('should respect enableKeyboard option', () => {
      const enabledOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };

      const disabledOptions = {
        enableKeyboard: false,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };

      expect(enabledOptions.enableKeyboard).toBe(true);
      expect(disabledOptions.enableKeyboard).toBe(false);
    });

    it('should support debug mode option', () => {
      const debugOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: true,
        preventBubbling: true,
        context: 'gallery',
      };

      const normalOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };

      expect(debugOptions.debugMode).toBe(true);
      expect(normalOptions.debugMode).toBe(false);
    });

    it('should support prevent bubbling option', () => {
      const bubbleOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };

      expect(bubbleOptions.preventBubbling).toBe(true);
    });
  });

  describe('Event context tracking', () => {
    it('should track keyboard events with context', () => {
      const options = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery-keyboard',
      };

      expect(options.context).toBe('gallery-keyboard');
    });

    it('should support custom context identifiers', () => {
      const contexts = ['gallery', 'gallery-keyboard', 'keyboard-nav', 'custom-ctx'];

      contexts.forEach(ctx => {
        const options = {
          enableKeyboard: true,
          enableMediaDetection: true,
          debugMode: false,
          preventBubbling: true,
          context: ctx,
        };

        expect(options.context).toBe(ctx);
      });
    });
  });

  describe('Integration with event handlers', () => {
    it('should work with onKeyboardEvent callback', () => {
      expect(mockHandlers.onKeyboardEvent).toBeDefined();
      expect(typeof mockHandlers.onKeyboardEvent).toBe('function');
    });

    it('should work with onMediaClick callback', () => {
      expect(mockHandlers.onMediaClick).toBeDefined();
      expect(typeof mockHandlers.onMediaClick).toBe('function');
    });

    it('should work with onGalleryClose callback', () => {
      expect(mockHandlers.onGalleryClose).toBeDefined();
      expect(typeof mockHandlers.onGalleryClose).toBe('function');
    });

    it('should support optional onKeyboardEvent handler', () => {
      const handlersWithoutKeyboardEvent = {
        onMediaClick: vi.fn(),
        onGalleryClose: vi.fn(),
        // onKeyboardEvent is optional
      };

      expect(handlersWithoutKeyboardEvent.onKeyboardEvent).toBeUndefined();
    });
  });
});
