/**
 * NotificationService unit tests - Phase 315 (lean mode)
 *
 * Focused on GM_notification provider detection and lean show() flow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../../../../src/shared/logging';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

let NotificationService: any;

describe('NotificationService (lean)', () => {
  setupGlobalTestIsolation();

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../../../src/shared/services/notification-service.ts');
    NotificationService = module.NotificationService;
  });

  afterEach(() => {
    delete (globalThis as any).GM_notification;
    delete (globalThis as any).__VITEST__;
  });

  let service: InstanceType<typeof NotificationService>;

  beforeEach(() => {
    service = NotificationService.getInstance();
  });

  describe('getNotificationProvider()', () => {
    it('reports gm provider when GM_notification exists', async () => {
      (globalThis as Record<string, unknown>).GM_notification = vi.fn();

      const result = await service.getNotificationProvider();

      expect(result.provider).toBe('gm');
      expect(result.available).toBe(true);
      expect(result.description).toContain('GM_notification');
    });

    it('reports none provider when GM_notification is absent', async () => {
      delete (globalThis as Record<string, unknown>).GM_notification;

      const result = await service.getNotificationProvider();

      expect(result.provider).toBe('none');
      expect(result.available).toBe(false);
      expect(result.description).toContain('unavailable');
    });
  });

  describe('getInstance()', () => {
    it('returns singleton instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('show()', () => {
    it('delegates to GM_notification when available', async () => {
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      await service.show({ title: 'Test Title', text: 'Hello' });

      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Test Title',
          text: 'Hello',
          image: undefined,
          timeout: undefined,
          onclick: undefined,
        },
        undefined
      );
    });

    it('logs debug message when GM_notification is missing', async () => {
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      await service.show({ title: 'No GM', text: 'skip' });

      expect(debugSpy).toHaveBeenCalledWith('Notification skipped (no GM_notification): No GM');
      debugSpy.mockRestore();
    });

    it('supports optional parameters (image, timeout, onclick)', async () => {
      const mockGMNotification = vi.fn();
      const onclick = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      await service.show({
        title: 'Extras',
        text: 'All props',
        image: 'https://example.com/icon.png',
        timeout: 1234,
        onclick,
      });

      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Extras',
          text: 'All props',
          image: 'https://example.com/icon.png',
          timeout: 1234,
          onclick,
        },
        undefined
      );
    });
  });

  describe('shortcut helpers', () => {
    it('invokes show() for success/error/warning/info', async () => {
      const showSpy = vi.spyOn(service, 'show').mockResolvedValue();

      await service.success('Done');
      await service.error('Oops');
      await service.warning('Careful');
      await service.info('FYI');

      expect(showSpy).toHaveBeenCalledTimes(4);
      showSpy.mockRestore();
    });
  });
});
