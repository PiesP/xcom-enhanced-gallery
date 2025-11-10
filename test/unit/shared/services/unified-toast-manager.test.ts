/**
 * @fileoverview UnifiedToastManager 테스트 (Phase 420 이후)
 * @description NotificationService 위임 동작을 검증한다.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { ToastManager, toastManager, type ToastItem } from '@shared/services/unified-toast-manager';
import { NotificationService } from '@shared/services/notification-service';
import { logger } from '@shared/logging';

// 로거는 출력만 남기므로 더미로 대체한다.
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ToastManager (Notification proxy)', () => {
  setupGlobalTestIsolation();

  let manager: ToastManager;
  let notificationMock: Pick<NotificationService, 'show'>;
  let getInstanceSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    notificationMock = {
      show: vi.fn().mockResolvedValue(undefined),
    } as Pick<NotificationService, 'show'>;

    getInstanceSpy = vi
      .spyOn(NotificationService, 'getInstance')
      .mockReturnValue(notificationMock as NotificationService);

    ToastManager.resetInstance();
    manager = ToastManager.getInstance();
  });

  afterEach(() => {
    getInstanceSpy.mockRestore();
    ToastManager.resetInstance();
    vi.clearAllMocks();
  });

  describe('Singleton', () => {
    it('getInstance()는 항상 동일한 인스턴스를 반환한다', () => {
      const instance1 = ToastManager.getInstance();
      const instance2 = ToastManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('toastManager export는 ToastManager 인스턴스를 노출한다', () => {
      expect(toastManager).toBeInstanceOf(ToastManager);
    });

    it('resetInstance() 후 새로운 인스턴스를 생성한다', () => {
      const first = ToastManager.getInstance();
      ToastManager.resetInstance();
      const second = ToastManager.getInstance();

      expect(first).not.toBe(second);
    });
  });

  describe('show()', () => {
    it('ID를 반환하고 NotificationService.show를 호출한다', () => {
      const id = manager.show({ title: '알림', message: '본문' });

      expect(id).toMatch(/^toast_\d+_\d+$/);
      expect(notificationMock.show).toHaveBeenCalledTimes(1);
      expect(notificationMock.show).toHaveBeenCalledWith({
        title: '알림',
        text: '본문',
      });
      expect(manager.getToasts()).toEqual([]);
    });

    it('duration과 onAction 옵션을 NotificationService 옵션으로 매핑한다', () => {
      const onAction = vi.fn();

      manager.show({
        title: 'Title',
        message: 'Message',
        duration: 4000,
        onAction,
        route: 'toast-only', // Phase 420: route는 무시되지만 에러 없이 처리되어야 한다.
      });

      expect(notificationMock.show).toHaveBeenCalledWith({
        title: 'Title',
        text: 'Message',
        timeout: 4000,
        onclick: onAction,
      });
    });
  });

  describe('헬퍼 메서드', () => {
    it.each([
      ['success', '성공', '완료'],
      ['info', '정보', '알림'],
      ['warning', '주의', '경고'],
      ['error', '오류', '문제'],
    ] as const)('%s()는 show()를 위임한다', (method, title, message) => {
      notificationMock.show.mockClear();

      const id = manager[method](title, message);

      expect(id).toMatch(/^toast_\d+_\d+$/);
      expect(notificationMock.show).toHaveBeenCalledTimes(1);
      expect(notificationMock.show).toHaveBeenCalledWith({
        title,
        text: message,
      });
    });
  });

  describe('상태 관련 메서드', () => {
    it('getToasts()는 항상 빈 배열을 반환한다', () => {
      manager.show({ title: '테스트', message: '본문' });
      expect(manager.getToasts()).toEqual([]);
    });

    it('remove()/clear()는 예외 없이 동작한다', () => {
      expect(() => manager.remove('dummy')).not.toThrow();
      expect(() => manager.clear()).not.toThrow();
      expect(manager.getToasts()).toEqual([]);
    });
  });

  describe('구독 시스템', () => {
    it('subscribe()는 즉시 빈 배열을 전달하고 unsubscribe는 noop이다', () => {
      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([]);

      callback.mockClear();
      manager.show({ title: 'Another', message: 'Toast' });
      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('signal', () => {
    it('값은 항상 빈 배열이며 setter는 경고만 남긴다', () => {
      const signal = manager.signal;
      expect(signal.value).toEqual([]);

      signal.value = [
        {
          id: 'temp',
          title: 'Ignored',
          message: 'Ignored',
          type: 'info',
        } as ToastItem,
      ];
      expect(logger.warn).toHaveBeenCalled();
      expect(signal.value).toEqual([]);
    });
  });

  describe('라이프사이클', () => {
    it('init()과 cleanup()은 Promise/void 반환', async () => {
      await expect(manager.init()).resolves.toBeUndefined();
      expect(() => manager.cleanup()).not.toThrow();
    });
  });

  describe('ID 생성', () => {
    it('각 호출마다 고유한 ID를 만든다', () => {
      const ids = new Set(
        Array.from({ length: 3 }).map(() => manager.show({ title: 'T', message: 'M' }))
      );
      expect(ids.size).toBe(3);
      ids.forEach(id => {
        expect(id).toMatch(/^toast_\d+_\d+$/);
      });
    });
  });
});
