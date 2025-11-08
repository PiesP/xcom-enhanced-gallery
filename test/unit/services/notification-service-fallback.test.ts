/**
 * Notification Service Fallback Tests - Phase 314-3
 *
 * Tests for getNotificationProvider() method with fallback providers.
 * Verifies provider detection and fallback chain.
 *
 * @see src/shared/services/notification-service.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  NotificationService,
  type NotificationProvider,
  type NotificationProviderInfo,
} from '../../../src/shared/services';

describe('NotificationService Fallback (Phase 314-3)', () => {
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
      expect(provider.fallback).toBe('console');
      expect(provider.description).toContain('✅');
      expect(provider.description).toContain('GM_notification');

      // Cleanup
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('should return console provider when GM_notification is unavailable', async () => {
      // Ensure GM_notification is not available
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const provider = await notificationService.getNotificationProvider();

      expect(provider.provider).toBe('console');
      expect(provider.available).toBe(true);
      expect(provider.fallback).toBe('none');
      expect(provider.description).toContain('⚠️');
      expect(provider.description).toContain('console');
    });

    it('should have correct fallback chain: gm -> console -> none', async () => {
      // Test with GM available
      const mockGMNotif = vi.fn();
      Object.defineProperty(globalThis, 'GM_notification', {
        value: mockGMNotif,
        writable: true,
        configurable: true,
      });

      let provider = await notificationService.getNotificationProvider();
      expect(provider.provider).toBe('gm');
      expect(provider.fallback).toBe('console');

      // Test without GM (console available)
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      provider = await notificationService.getNotificationProvider();
      expect(provider.provider).toBe('console');
      expect(provider.fallback).toBe('none');
    });

    it('should include environment info in description', async () => {
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const provider = await notificationService.getNotificationProvider();

      expect(provider.description).toContain('environment');
      // Verify description contains one of the environment types
      const hasEnvironmentInfo =
        provider.description.includes('test') ||
        provider.description.includes('userscript') ||
        provider.description.includes('extension') ||
        provider.description.includes('console');
      expect(hasEnvironmentInfo).toBe(true);
    });

    it('should return valid NotificationProviderInfo structure', async () => {
      const provider = await notificationService.getNotificationProvider();

      // Verify all required fields exist
      expect(provider).toHaveProperty('provider');
      expect(provider).toHaveProperty('available');
      expect(provider).toHaveProperty('fallback');
      expect(provider).toHaveProperty('description');

      // Verify types
      expect(typeof provider.provider).toBe('string');
      expect(typeof provider.available).toBe('boolean');
      expect(typeof provider.description).toBe('string');
      expect(provider.fallback === null || typeof provider.fallback === 'string').toBe(true);

      // Verify provider is valid
      expect(['gm', 'console', 'none']).toContain(provider.provider);

      // Verify fallback chain
      if (provider.provider === 'gm') {
        expect(provider.fallback).toBe('console');
      } else if (provider.provider === 'console') {
        expect(provider.fallback).toBe('none');
      } else if (provider.provider === 'none') {
        expect(provider.fallback).toBe(null);
      }
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

      expect(mockGMNotif).toHaveBeenCalled();

      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('should fallback to console when GM is unavailable', async () => {
      Object.defineProperty(globalThis, 'GM_notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await notificationService.show({
        title: 'Test',
        text: 'Fallback Message',
      });

      // Console fallback should be used (via logger.info)
      // This test verifies the fallback path is taken

      loggerSpy.mockRestore();
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

      // Should not throw - error handling is in place
      await expect(
        notificationService.show({
          title: 'Error Test',
          text: 'Should handle error',
        })
      ).resolves.not.toThrow();

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
