/**
 * @fileoverview UnifiedToastManager 테스트
 * @description ToastManager 싱글톤의 상태 관리, 라우팅, 구독 시스템 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastManager, toastManager } from '../../../../src/shared/services/unified-toast-manager';
import type {
  ToastItem,
  ToastOptions,
} from '../../../../src/shared/services/unified-toast-manager';

// Mock logger
vi.mock('../../../../src/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock accessibility helpers
const mockPoliteLiveRegion = document.createElement('div');
const mockAssertiveLiveRegion = document.createElement('div');
vi.mock('../../../../src/shared/utils/accessibility/index', () => ({
  ensurePoliteLiveRegion: vi.fn(() => mockPoliteLiveRegion),
  ensureAssertiveLiveRegion: vi.fn(() => mockAssertiveLiveRegion),
}));

describe('ToastManager', () => {
  let manager: ToastManager;

  beforeEach(() => {
    ToastManager.resetInstance();
    manager = ToastManager.getInstance();
    mockPoliteLiveRegion.innerHTML = '';
    mockAssertiveLiveRegion.innerHTML = '';
  });

  afterEach(() => {
    ToastManager.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('getInstance()는 항상 동일한 인스턴스를 반환한다', () => {
      const instance1 = ToastManager.getInstance();
      const instance2 = ToastManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('resetInstance() 후 새로운 인스턴스를 생성한다', () => {
      const instance1 = ToastManager.getInstance();
      ToastManager.resetInstance();
      const instance2 = ToastManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('State Management', () => {
    it('초기 상태는 빈 배열이다', () => {
      expect(manager.getToasts()).toEqual([]);
    });

    it('show()는 toast를 추가하고 ID를 반환한다 (route: toast-only)', () => {
      const id = manager.show({
        title: 'Test',
        message: 'Message',
        type: 'warning', // warning은 기본 toast-only
      });

      expect(id).toMatch(/^toast_\d+_\d+$/);
      expect(manager.getToasts()).toHaveLength(1);
      expect(manager.getToasts()[0]).toMatchObject({
        id,
        title: 'Test',
        message: 'Message',
        type: 'warning',
      });
    });

    it('remove()는 특정 toast를 제거한다', () => {
      const id1 = manager.show({ title: 'T1', message: 'M1', type: 'warning' });
      const id2 = manager.show({ title: 'T2', message: 'M2', type: 'warning' });

      manager.remove(id1);

      const toasts = manager.getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].id).toBe(id2);
    });

    it('clear()는 모든 toast를 제거한다', () => {
      manager.show({ title: 'T1', message: 'M1', type: 'warning' });
      manager.show({ title: 'T2', message: 'M2', type: 'warning' });

      manager.clear();

      expect(manager.getToasts()).toEqual([]);
    });

    it('존재하지 않는 ID를 remove()해도 에러가 발생하지 않는다', () => {
      const initialToasts = manager.getToasts();

      expect(() => manager.remove('non-existent-id')).not.toThrow();
      expect(manager.getToasts()).toEqual(initialToasts);
    });
  });

  describe('Routing Policy', () => {
    it('info 타입은 기본적으로 live-only 라우팅을 사용한다', () => {
      manager.show({
        title: 'Info',
        message: 'Message',
        type: 'info',
      });

      // live-only이므로 toast 목록에 추가되지 않음
      expect(manager.getToasts()).toEqual([]);
      // live region에는 공지됨
      expect(mockPoliteLiveRegion.textContent).toContain('Info: Message');
    });

    it('success 타입은 기본적으로 live-only 라우팅을 사용한다', () => {
      manager.show({
        title: 'Success',
        message: 'Message',
        type: 'success',
      });

      expect(manager.getToasts()).toEqual([]);
      expect(mockPoliteLiveRegion.textContent).toContain('Success: Message');
    });

    it('warning 타입은 기본적으로 toast-only 라우팅을 사용한다', () => {
      manager.show({
        title: 'Warning',
        message: 'Message',
        type: 'warning',
      });

      expect(manager.getToasts()).toHaveLength(1);
      expect(mockPoliteLiveRegion.textContent).toBe('');
    });

    it('error 타입은 기본적으로 toast-only 라우팅을 사용한다', () => {
      manager.show({
        title: 'Error',
        message: 'Message',
        type: 'error',
      });

      expect(manager.getToasts()).toHaveLength(1);
      expect(mockAssertiveLiveRegion.textContent).toBe('');
    });

    it('route 옵션으로 라우팅을 재정의할 수 있다 - both', () => {
      manager.show({
        title: 'Info',
        message: 'Message',
        type: 'info',
        route: 'both',
      });

      // both이므로 toast 목록에도 추가되고 live region에도 공지됨
      expect(manager.getToasts()).toHaveLength(1);
      expect(mockPoliteLiveRegion.textContent).toContain('Info: Message');
    });

    it('route 옵션으로 라우팅을 재정의할 수 있다 - toast-only', () => {
      manager.show({
        title: 'Info',
        message: 'Message',
        type: 'info',
        route: 'toast-only',
      });

      // toast-only이므로 toast 목록에만 추가되고 live region에는 공지 안됨
      expect(manager.getToasts()).toHaveLength(1);
      expect(mockPoliteLiveRegion.textContent).toBe('');
    });

    it('error 타입은 assertive live region을 사용한다', () => {
      manager.show({
        title: 'Critical',
        message: 'Error',
        type: 'error',
        route: 'live-only',
      });

      expect(mockAssertiveLiveRegion.textContent).toContain('Critical: Error');
      expect(mockPoliteLiveRegion.textContent).toBe('');
    });
  });

  describe('Type Helpers', () => {
    it('success()는 success 타입의 toast를 표시한다', () => {
      const id = manager.success('Success', 'Message');

      expect(id).toMatch(/^toast_\d+_\d+$/);
      // success는 기본 live-only이므로 toast 목록에 없음
      expect(manager.getToasts()).toEqual([]);
    });

    it('info()는 info 타입의 toast를 표시한다', () => {
      const id = manager.info('Info', 'Message');

      expect(id).toMatch(/^toast_\d+_\d+$/);
      expect(manager.getToasts()).toEqual([]);
    });

    it('warning()은 warning 타입의 toast를 표시한다', () => {
      const id = manager.warning('Warning', 'Message');

      expect(id).toMatch(/^toast_\d+_\d+$/);
      // warning은 기본 toast-only이므로 목록에 추가됨
      expect(manager.getToasts()).toHaveLength(1);
      expect(manager.getToasts()[0].type).toBe('warning');
    });

    it('error()는 error 타입의 toast를 표시한다', () => {
      const id = manager.error('Error', 'Message');

      expect(id).toMatch(/^toast_\d+_\d+$/);
      expect(manager.getToasts()).toHaveLength(1);
      expect(manager.getToasts()[0].type).toBe('error');
    });

    it('헬퍼 메서드는 추가 옵션을 병합한다', () => {
      const id = manager.error('Error', 'Message', {
        duration: 5000,
        actionText: 'Retry',
        onAction: vi.fn(),
      });

      const toast = manager.getToasts()[0];
      expect(toast).toMatchObject({
        title: 'Error',
        message: 'Message',
        type: 'error',
        duration: 5000,
        actionText: 'Retry',
      });
      expect(toast.onAction).toBeTypeOf('function');
    });
  });

  describe('Subscription System', () => {
    it('subscribe()는 현재 상태를 즉시 전달한다', () => {
      manager.show({ title: 'Existing', message: 'Toast', type: 'warning' });

      const callback = vi.fn();
      manager.subscribe(callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(manager.getToasts());
    });

    it('상태 변경 시 구독자에게 알림을 보낸다 - add', () => {
      const callback = vi.fn();
      manager.subscribe(callback);

      callback.mockClear();
      manager.show({ title: 'New', message: 'Toast', type: 'warning' });

      // signal.subscribe + 수동 notifySubscribers로 2번 호출됨
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(manager.getToasts());
    });

    it('상태 변경 시 구독자에게 알림을 보낸다 - remove', () => {
      const id = manager.show({ title: 'Toast', message: 'Test', type: 'warning' });

      const callback = vi.fn();
      manager.subscribe(callback);

      callback.mockClear();
      manager.remove(id);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('상태 변경 시 구독자에게 알림을 보낸다 - clear', () => {
      manager.show({ title: 'T1', message: 'M1', type: 'warning' });
      manager.show({ title: 'T2', message: 'M2', type: 'warning' });

      const callback = vi.fn();
      manager.subscribe(callback);

      callback.mockClear();
      manager.clear();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('구독 해제 함수가 정상 동작한다', () => {
      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);

      callback.mockClear();
      unsubscribe();

      manager.show({ title: 'Test', message: 'Toast', type: 'warning' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('여러 구독자를 동시에 관리할 수 있다', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.subscribe(callback1);
      manager.subscribe(callback2);

      callback1.mockClear();
      callback2.mockClear();

      manager.show({ title: 'Test', message: 'Toast', type: 'warning' });

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(2);
    });

    it('구독자 콜백에서 에러가 발생해도 다른 구독자에게 영향을 주지 않는다', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = vi.fn();

      // subscribe()는 즉시 callback 호출하므로 try-catch로 감싸야 함
      expect(() => manager.subscribe(errorCallback)).toThrow('Subscriber error');
      manager.subscribe(normalCallback);

      errorCallback.mockClear();
      normalCallback.mockClear();

      // show()는 notifySubscribers의 try-catch로 보호됨
      expect(() => {
        manager.show({ title: 'Test', message: 'Toast', type: 'warning' });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalledTimes(2);
      expect(normalCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Signal Integration', () => {
    it('signal 접근자를 제공한다', () => {
      const signal = manager.signal;

      expect(signal).toBeDefined();
      expect(signal.value).toEqual([]);
    });

    it('signal.value는 현재 toast 목록과 동기화된다', () => {
      const signal = manager.signal;

      manager.show({ title: 'Test', message: 'Toast', type: 'warning' });

      expect(signal.value).toEqual(manager.getToasts());
    });
  });

  describe('Lifecycle Methods', () => {
    it('init()을 호출할 수 있다', async () => {
      await expect(manager.init()).resolves.toBeUndefined();
    });

    it('cleanup()은 모든 toast를 제거하고 구독자를 정리한다', () => {
      manager.show({ title: 'T1', message: 'M1', type: 'warning' });
      manager.show({ title: 'T2', message: 'M2', type: 'warning' });

      const callback = vi.fn();
      manager.subscribe(callback);

      manager.cleanup();

      expect(manager.getToasts()).toEqual([]);

      callback.mockClear();
      manager.show({ title: 'T3', message: 'M3', type: 'warning' });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Toast Options', () => {
    it('duration 옵션을 포함한다', () => {
      const id = manager.show({
        title: 'Test',
        message: 'Toast',
        type: 'warning',
        duration: 3000,
      });

      const toast = manager.getToasts().find(t => t.id === id);
      expect(toast?.duration).toBe(3000);
    });

    it('actionText와 onAction 옵션을 포함한다', () => {
      const onAction = vi.fn();
      const id = manager.show({
        title: 'Test',
        message: 'Toast',
        type: 'warning',
        actionText: 'Undo',
        onAction,
      });

      const toast = manager.getToasts().find(t => t.id === id);
      expect(toast?.actionText).toBe('Undo');
      expect(toast?.onAction).toBe(onAction);
    });

    it('type 옵션이 없으면 info를 기본값으로 사용한다', () => {
      const id = manager.show({
        title: 'Test',
        message: 'Toast',
        route: 'toast-only',
      });

      const toast = manager.getToasts().find(t => t.id === id);
      expect(toast?.type).toBe('info');
    });
  });

  describe('ID Generation', () => {
    it('각 toast는 고유한 ID를 받는다', () => {
      const id1 = manager.show({ title: 'T1', message: 'M1', type: 'warning' });
      const id2 = manager.show({ title: 'T2', message: 'M2', type: 'warning' });
      const id3 = manager.show({ title: 'T3', message: 'M3', type: 'warning' });

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('ID는 toast_[counter]_[timestamp] 형식이다', () => {
      const id = manager.show({ title: 'Test', message: 'Toast', type: 'warning' });

      expect(id).toMatch(/^toast_\d+_\d+$/);
    });
  });
});
