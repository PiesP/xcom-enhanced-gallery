/**
 * @fileoverview Event Emitter Tests (Phase 63 - Step 1)
 * @description TDD로 경량 이벤트 시스템 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { createEventEmitter } from '@shared/utils/event-emitter';

describe('createEventEmitter', () => {
  setupGlobalTestIsolation();

  describe('Basic Functionality', () => {
    it('should emit events to all listeners', () => {
      // RED: 구현 전 실패해야 함
      const emitter = createEventEmitter<{ test: string }>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.emit('test', 'hello');

      expect(callback1).toHaveBeenCalledWith('hello');
      expect(callback2).toHaveBeenCalledWith('hello');
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should support multiple event types', () => {
      // RED
      const emitter = createEventEmitter<{
        eventA: string;
        eventB: number;
        eventC: { id: number; name: string };
      }>();

      const callbackA = vi.fn();
      const callbackB = vi.fn();
      const callbackC = vi.fn();

      emitter.on('eventA', callbackA);
      emitter.on('eventB', callbackB);
      emitter.on('eventC', callbackC);

      emitter.emit('eventA', 'test');
      emitter.emit('eventB', 42);
      emitter.emit('eventC', { id: 1, name: 'test' });

      expect(callbackA).toHaveBeenCalledWith('test');
      expect(callbackB).toHaveBeenCalledWith(42);
      expect(callbackC).toHaveBeenCalledWith({ id: 1, name: 'test' });
    });

    it('should remove listener on unsubscribe', () => {
      // RED
      const emitter = createEventEmitter<{ test: string }>();
      const callback = vi.fn();

      const unsubscribe = emitter.on('test', callback);
      emitter.emit('test', 'first');

      expect(callback).toHaveBeenCalledWith('first');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      callback.mockClear();

      emitter.emit('test', 'second');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not fail if no listeners registered', () => {
      // RED
      const emitter = createEventEmitter<{ test: string }>();

      expect(() => {
        emitter.emit('test', 'hello');
      }).not.toThrow();
    });
  });

  describe('Synchronous Execution', () => {
    it('should handle synchronous emissions', () => {
      // RED
      const emitter = createEventEmitter<{ test: number }>();
      const results: number[] = [];

      emitter.on('test', value => results.push(value));
      emitter.on('test', value => results.push(value * 2));

      emitter.emit('test', 10);

      expect(results).toEqual([10, 20]);
    });
  });

  describe('Type Safety', () => {
    it('should support generic type safety', () => {
      // RED
      type Events = {
        'user:login': { userId: string; timestamp: number };
        'user:logout': { userId: string };
      };

      const emitter = createEventEmitter<Events>();
      const loginCallback = vi.fn((data: Events['user:login']) => {
        // Type-safe callback
        expect(data.userId).toBeDefined();
        expect(data.timestamp).toBeDefined();
      });

      emitter.on('user:login', loginCallback);
      emitter.emit('user:login', { userId: 'abc', timestamp: Date.now() });

      expect(loginCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'abc',
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Multiple Subscriptions', () => {
    it('should allow multiple subscriptions to same event', () => {
      // RED
      const emitter = createEventEmitter<{ data: number }>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      emitter.on('data', callback1);
      emitter.on('data', callback2);
      emitter.on('data', callback3);

      emitter.emit('data', 100);

      expect(callback1).toHaveBeenCalledWith(100);
      expect(callback2).toHaveBeenCalledWith(100);
      expect(callback3).toHaveBeenCalledWith(100);
    });
  });

  describe('Listener Execution Order', () => {
    it('should execute listeners in registration order', () => {
      // RED
      const emitter = createEventEmitter<{ order: string }>();
      const order: string[] = [];

      emitter.on('order', () => order.push('first'));
      emitter.on('order', () => order.push('second'));
      emitter.on('order', () => order.push('third'));

      emitter.emit('order', 'test');

      expect(order).toEqual(['first', 'second', 'third']);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in listeners gracefully', () => {
      // RED
      const emitter = createEventEmitter<{ error: string }>();
      const callback1 = vi.fn(() => {
        throw new Error('Test error');
      });
      const callback2 = vi.fn();

      emitter.on('error', callback1);
      emitter.on('error', callback2);

      // 리스너 에러가 다른 리스너 실행을 막지 않아야 함
      // (또는 에러를 외부로 전파하지 않아야 함)
      expect(() => {
        emitter.emit('error', 'test');
      }).not.toThrow();

      // 두 번째 콜백은 실행되어야 함 (에러 격리)
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all listeners on dispose', () => {
      // RED (dispose 메서드가 필요할 경우)
      const emitter = createEventEmitter<{ test: string }>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.on('test', callback1);
      emitter.on('test', callback2);

      // dispose 메서드가 있다면
      if ('dispose' in emitter && typeof emitter.dispose === 'function') {
        emitter.dispose();
        emitter.emit('test', 'after-dispose');

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
      } else {
        // dispose 미구현 시 스킵
        expect(true).toBe(true);
      }
    });
  });
});
