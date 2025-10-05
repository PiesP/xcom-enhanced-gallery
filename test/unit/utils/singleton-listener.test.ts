/**
 * @fileoverview Singleton Listener Manager 테스트
 * @description 중복 리스너 방지 싱글톤 관리자 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// RED: 구현 전이므로 import 실패 예상
import { SingletonListenerManager, globalListenerManager } from '@shared/utils/singleton-listener';

describe('SingletonListenerManager', () => {
  let manager: SingletonListenerManager;

  beforeEach(() => {
    manager = new SingletonListenerManager();
  });

  afterEach(() => {
    manager.clear();
  });

  describe('register', () => {
    it('should register cleanup function', () => {
      const cleanup = vi.fn();
      manager.register('test-key', cleanup);

      expect(manager.isActive('test-key')).toBe(true);
    });

    it('should call previous cleanup when re-registering same key', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();

      manager.register('test-key', cleanup1);
      manager.register('test-key', cleanup2);

      expect(cleanup1).toHaveBeenCalledOnce();
      expect(manager.isActive('test-key')).toBe(true);
    });

    it('should allow different keys simultaneously', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();

      manager.register('key1', cleanup1);
      manager.register('key2', cleanup2);

      expect(manager.isActive('key1')).toBe(true);
      expect(manager.isActive('key2')).toBe(true);
      expect(cleanup1).not.toHaveBeenCalled();
      expect(cleanup2).not.toHaveBeenCalled();
    });
  });

  describe('unregister', () => {
    it('should call cleanup function and remove listener', () => {
      const cleanup = vi.fn();
      manager.register('test-key', cleanup);

      manager.unregister('test-key');

      expect(cleanup).toHaveBeenCalledOnce();
      expect(manager.isActive('test-key')).toBe(false);
    });

    it('should handle unregistering non-existent key gracefully', () => {
      expect(() => manager.unregister('non-existent')).not.toThrow();
      expect(manager.isActive('non-existent')).toBe(false);
    });

    it('should not call cleanup multiple times', () => {
      const cleanup = vi.fn();
      manager.register('test-key', cleanup);

      manager.unregister('test-key');
      manager.unregister('test-key');

      expect(cleanup).toHaveBeenCalledOnce();
    });
  });

  describe('clear', () => {
    it('should call all cleanup functions', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn();

      manager.register('key1', cleanup1);
      manager.register('key2', cleanup2);
      manager.register('key3', cleanup3);

      manager.clear();

      expect(cleanup1).toHaveBeenCalledOnce();
      expect(cleanup2).toHaveBeenCalledOnce();
      expect(cleanup3).toHaveBeenCalledOnce();
    });

    it('should remove all listeners after clear', () => {
      manager.register('key1', vi.fn());
      manager.register('key2', vi.fn());

      manager.clear();

      expect(manager.isActive('key1')).toBe(false);
      expect(manager.isActive('key2')).toBe(false);
    });

    it('should handle clear on empty manager', () => {
      expect(() => manager.clear()).not.toThrow();
    });
  });

  describe('isActive', () => {
    it('should return true for registered keys', () => {
      manager.register('test-key', vi.fn());
      expect(manager.isActive('test-key')).toBe(true);
    });

    it('should return false for unregistered keys', () => {
      expect(manager.isActive('never-registered')).toBe(false);
    });

    it('should return false after unregister', () => {
      manager.register('test-key', vi.fn());
      manager.unregister('test-key');
      expect(manager.isActive('test-key')).toBe(false);
    });
  });
});

describe('globalListenerManager', () => {
  afterEach(() => {
    globalListenerManager.clear();
  });

  it('should be a singleton instance', () => {
    expect(globalListenerManager).toBeInstanceOf(SingletonListenerManager);
  });

  it('should work across multiple imports', () => {
    const cleanup = vi.fn();
    globalListenerManager.register('global-test', cleanup);

    expect(globalListenerManager.isActive('global-test')).toBe(true);

    globalListenerManager.unregister('global-test');

    expect(cleanup).toHaveBeenCalledOnce();
  });
});
