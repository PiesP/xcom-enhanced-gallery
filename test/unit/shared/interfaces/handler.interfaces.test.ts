/**
 * @fileoverview Tests for handler lifecycle interfaces
 */


import {
  createFailureResult,
  createSuccessResult,
  DEFAULT_EVENT_HANDLER_CONFIG,
} from '@shared/interfaces/handler.interfaces';
import type {
  HandlerLifecycle,
  HandlerLifecyclePhase,
  InitializationResult,
  GalleryController,
} from '@shared/interfaces/handler.interfaces';

describe('Handler Interfaces', () => {
  describe('createSuccessResult', () => {
    it('should create a success result without message', () => {
      const result = createSuccessResult();

      expect(result.success).toBe(true);
      expect(result.message).toBeUndefined();
      expect(result.durationMs).toBeUndefined();
    });

    it('should create a success result with message', () => {
      const result = createSuccessResult('Initialization complete');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Initialization complete');
    });

    it('should create a success result with duration', () => {
      const result = createSuccessResult('Done', 150);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Done');
      expect(result.durationMs).toBe(150);
    });
  });

  describe('createFailureResult', () => {
    it('should create a failure result with error', () => {
      const error = new Error('Something went wrong');
      const result = createFailureResult(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('should create a failure result with message', () => {
      const result = createFailureResult('string error', 'Initialization failed');

      expect(result.success).toBe(false);
      expect(result.error).toBe('string error');
      expect(result.message).toBe('Initialization failed');
    });
  });

  describe('DEFAULT_EVENT_HANDLER_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_EVENT_HANDLER_CONFIG.enableKeyboard).toBe(true);
      expect(DEFAULT_EVENT_HANDLER_CONFIG.enableMediaDetection).toBe(true);
      expect(DEFAULT_EVENT_HANDLER_CONFIG.debugMode).toBe(false);
      expect(DEFAULT_EVENT_HANDLER_CONFIG.preventBubbling).toBe(true);
      expect(DEFAULT_EVENT_HANDLER_CONFIG.context).toBe('default');
    });

    it('should be frozen (immutable)', () => {
      expect(Object.isFrozen(DEFAULT_EVENT_HANDLER_CONFIG)).toBe(true);
    });
  });

  describe('HandlerLifecycle interface', () => {
    it('should be implementable', () => {
      class TestHandler implements HandlerLifecycle {
        private phase: HandlerLifecyclePhase = 'uninitialized';

        async initialize(): Promise<InitializationResult> {
          this.phase = 'initializing';
          this.phase = 'ready';
          return createSuccessResult();
        }

        destroy(): void {
          this.phase = 'destroyed';
        }

        getPhase(): HandlerLifecyclePhase {
          return this.phase;
        }

        isReady(): boolean {
          return this.phase === 'ready';
        }
      }

      const handler = new TestHandler();
      expect(handler.getPhase()).toBe('uninitialized');
      expect(handler.isReady()).toBe(false);
    });
  });

  describe('GalleryController interface', () => {
    it('should be implementable', () => {
      class TestGalleryController implements GalleryController {
        private items: readonly unknown[] = [];
        private index = 0;
        private opened = false;

        async open(mediaItems: readonly unknown[], startIndex = 0): Promise<void> {
          this.items = mediaItems;
          this.index = startIndex;
          this.opened = true;
        }

        close(): void {
          this.opened = false;
        }

        navigateTo(index: number): void {
          this.index = index;
        }

        next(): void {
          this.index = Math.min(this.index + 1, this.items.length - 1);
        }

        previous(): void {
          this.index = Math.max(this.index - 1, 0);
        }

        isOpen(): boolean {
          return this.opened;
        }

        getCurrentIndex(): number {
          return this.index;
        }

        getTotalItems(): number {
          return this.items.length;
        }
      }

      const controller = new TestGalleryController();
      expect(controller.isOpen()).toBe(false);
      expect(controller.getCurrentIndex()).toBe(0);
      expect(controller.getTotalItems()).toBe(0);
    });
  });
});
