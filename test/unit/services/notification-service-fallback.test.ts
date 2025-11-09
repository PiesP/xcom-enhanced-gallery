/**
 * Notification Service Lean Mode Tests - Phase 321
 *
 * The notification service now operates in a "lean" configuration:
 * - Only Tampermonkey's GM_notification is used when available
 * - No console/UI fallback chain is provided
 * - Provider metadata reports GM availability or absence only
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/shared/logging';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { NotificationService } from '../../../src/shared/services';

describe('NotificationService Lean Mode (Phase 321)', () => {
  setupGlobalTestIsolation();

  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = NotificationService.getInstance();
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotificationProvider', () => {
    it('should return GM provider when GM_notification is available', async () => {
      // Setup: Mock GM_notification
      const mockGMNotif = vi.fn();
      Object.defineProperty(globalThis, 'GM_notification', {
        value: mockGMNotif,
        writable: true,
        configurable: true,
      });

      const provider = await notificationService.getNotificationProvider();

      expect(provider.provider).toBe('gm');
      expect(provider.available).toBe(true);
      expect(provider.description).toContain('✅ GM_notification available');
      expect(provider.description).toMatch(/\(.*\)$/);

      // Cleanup
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('should return none provider when GM_notification is unavailable', async () => {
      // Ensure GM_notification is not available
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const provider = await notificationService.getNotificationProvider();

      expect(provider.provider).toBe('none');
      expect(provider.available).toBe(false);
      expect(provider.description).toContain('⚠️ GM_notification unavailable');
      expect(provider.description).toMatch(/\(.*\)$/);
    });

    it('should include environment info in description', async () => {
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const provider = await notificationService.getNotificationProvider();

      expect(provider.description).toMatch(/\(.*\)$/);
      expect(provider.description).toContain('GM_notification');
    });

    it('should return valid NotificationProviderInfo structure', async () => {
      const provider = await notificationService.getNotificationProvider();

      // Verify all required fields exist
      expect(provider).toHaveProperty('provider');
      expect(provider).toHaveProperty('available');
      expect(provider).toHaveProperty('description');

      // Verify types
      expect(typeof provider.provider).toBe('string');
      expect(typeof provider.available).toBe('boolean');
      expect(typeof provider.description).toBe('string');

      // Verify provider is valid
      expect(['gm', 'none']).toContain(provider.provider);
    });
  });

  describe('show with fallback', () => {
    it('should use GM provider when available', async () => {
      const mockGMNotif = vi.fn();
      Object.defineProperty(globalThis, 'GM_notification', {
        value: mockGMNotif,
        writable: true,
        configurable: true,
      });

      await notificationService.show({
        title: 'Test',
        text: 'Message',
      });

      expect(mockGMNotif).toHaveBeenCalledTimes(1);
      expect(mockGMNotif).toHaveBeenCalledWith(
        {
          title: 'Test',
          text: 'Message',
          image: undefined,
          timeout: undefined,
          onclick: undefined,
        },
        undefined
      );

      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('should skip notification and log debug when GM is unavailable', async () => {
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      await notificationService.show({
        title: 'Test',
        text: 'Fallback Message',
      });

      expect(debugSpy).toHaveBeenCalledWith('Notification skipped (no GM_notification): Test');
      debugSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      // Create a scenario where an error might occur
      const mockGMNotif = vi.fn(() => {
        throw new Error('GM_notification error');
      });
      Object.defineProperty(globalThis, 'GM_notification', {
        value: mockGMNotif,
        writable: true,
        configurable: true,
      });

      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      // Should not throw - error handling is in place
      await expect(
        notificationService.show({
          title: 'Error Test',
          text: 'Should handle error',
        })
      ).resolves.not.toThrow();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();

      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
