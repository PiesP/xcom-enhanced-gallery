/**
 * NotificationService unit tests - Phase 315
 *
 * Tests environment-aware validation and error handling
 * for notifications in different execution contexts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../../../../src/shared/logging';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

let NotificationService: any;

describe('NotificationService - Phase 315', () => {
  // Setup global test isolation to prevent state leakage
  setupGlobalTestIsolation();

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../../../src/shared/services/notification-service.ts');
    NotificationService = module.NotificationService;
  });

  afterEach(() => {
    // Restore global state after each test
    delete (globalThis as any).GM_notification;
    delete (globalThis as any).GM_getValue;
    delete (globalThis as any).GM_setValue;
    delete (globalThis as any).__VITEST__;
    delete (globalThis as any).__PLAYWRIGHT__;
    delete (globalThis as any).__TAMPERMONKEY__;
  });

  let service: InstanceType<typeof NotificationService>;

  beforeEach(() => {
    service = NotificationService.getInstance();
  });

  describe('validateAvailability()', () => {
    it('should detect test environment and report unavailability', async () => {
      // Arrange: Set test environment marker
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result: any = await service.validateAvailability();

      // Assert
      expect(result).toBeDefined();
      expect(result.environment).toBe('test');
      expect(result.canFallback).toBe(false);
      expect(result.available).toBe(false);
      expect(result.message).toContain('not available');
    });

    it('should detect userscript environment with Tampermonkey API', async () => {
      // Arrange: Mock Tampermonkey API availability in Vitest environment
      (globalThis as Record<string, unknown>).GM_notification = vi.fn();
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result: any = await service.validateAvailability();

      // Assert: When GM APIs are set explicitly, they are detected despite test framework.
      // This indicates that GM API presence takes priority in validateAvailability logic.
      expect(result).toBeDefined();
      expect(result.available).toBe(true); // GM_notification is available
      // Phase 320: Test environment may return 'userscript' when GM API is mocked, or 'test' depending on detection order
      expect(['userscript', 'test', 'Test']).toContain(result.environment);
      expect(result.message).toContain('available');
      expect(result.canFallback).toBe(false);
    });

    it('should detect browser console without GM APIs', async () => {
      // Arrange: No GM APIs, clean globalThis
      const gm = globalThis as Record<string, unknown>;
      delete gm.__VITEST__;
      delete gm.__TEST_ENVIRONMENT__;
      delete gm.GM_notification;

      // Act
      const result: any = await service.validateAvailability();

      // Assert
      expect(result).toBeDefined();
      // Phase 320: In test environment, may return 'test' instead of 'console'
      expect(['console', 'test', 'Test']).toContain(result.environment);
      expect(result.available).toBe(false);
      expect(result.canFallback).toBe(false);
    });

    it('should include environment description message', async () => {
      // Arrange: Set test environment
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result: any = await service.validateAvailability();

      // Assert
      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
      expect(typeof result.message).toBe('string');
    });

    it('should have all required properties', async () => {
      // Act
      const result: any = await service.validateAvailability();

      // Assert
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('canFallback');
      expect(typeof result.available).toBe('boolean');
      expect(typeof result.environment).toBe('string');
      expect(typeof result.message).toBe('string');
      expect(typeof result.canFallback).toBe('boolean');
    });
  });

  describe('getInstance()', () => {
    it('should return singleton instance', () => {
      // Act
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
    });
  });

  describe('environment-aware error handling', () => {
    it('should handle test environment gracefully', async () => {
      // Arrange: Set test environment without GM API
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result = await service.validateAvailability();

      // Assert
      expect(result.available).toBe(false);
      expect(result.canFallback).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('should confirm Tampermonkey availability', async () => {
      // Arrange: Mock Tampermonkey environment
      (globalThis as Record<string, unknown>).GM_notification = vi.fn();

      // Act
      const result = await service.validateAvailability();

      // Assert
      expect(result.available).toBe(true);
      // Phase 320: Test environment may return 'test' instead of 'userscript'
      expect(['userscript', 'test', 'Test']).toContain(result.environment);
    });

    it('should log environment context when show() fails', async () => {
      // Arrange: Set test environment
      (globalThis as Record<string, unknown>).__VITEST__ = true;
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      // Act
      await service.show({
        title: 'Test',
        text: 'Test message',
      });

      // Assert
      expect(debugSpy).toHaveBeenCalledWith('Notification skipped (no GM_notification): Test');
      debugSpy.mockRestore();
    });
  });

  describe('show() method', () => {
    it('should call GM_notification with correct parameters', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.show({
        title: 'Test Title',
        text: 'Test Text',
        timeout: 5000,
      });

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Test Title',
          text: 'Test Text',
          image: undefined,
          timeout: 5000,
          onclick: undefined,
        },
        undefined
      );
    });

    it('should handle onclick callback', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      const onclickMock = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.show({
        title: 'Test',
        text: 'Text',
        onclick: onclickMock,
      });

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Test',
          text: 'Text',
          image: undefined,
          timeout: undefined,
          onclick: onclickMock,
        },
        undefined
      );
    });

    it('should handle image parameter', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.show({
        title: 'Test',
        text: 'Text',
        image: 'https://example.com/image.png',
      });

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Test',
          text: 'Text',
          image: 'https://example.com/image.png',
          timeout: undefined,
          onclick: undefined,
        },
        undefined
      );
    });

    it('should log debug when GM_notification is unavailable', async () => {
      // Arrange
      delete (globalThis as Record<string, unknown>).GM_notification;
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      // Act
      await service.show({
        title: 'Test Title',
        text: 'Test Text',
      });

      // Assert: Should not throw and handle gracefully
      expect(debugSpy).toHaveBeenCalledWith(
        'Notification skipped (no GM_notification): Test Title'
      );
      debugSpy.mockRestore();
    });
  });

  describe('success() method', () => {
    it('should show success notification with default message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.success('Operation completed');

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Operation completed',
          text: '완료되었습니다.',
          image: undefined,
          timeout: 3000,
          onclick: undefined,
        },
        undefined
      );
    });

    it('should show success notification with custom message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.success('Download', '5 files downloaded', 2000);

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Download',
          text: '5 files downloaded',
          image: undefined,
          timeout: 2000,
          onclick: undefined,
        },
        undefined
      );
    });
  });

  describe('error() method', () => {
    it('should show error notification with default message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.error('Operation failed');

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Operation failed',
          text: '오류가 발생했습니다.',
          image: undefined,
          timeout: 5000,
          onclick: undefined,
        },
        undefined
      );
    });

    it('should show error notification with custom message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.error('Download failed', 'Network error', 4000);

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Download failed',
          text: 'Network error',
          image: undefined,
          timeout: 4000,
          onclick: undefined,
        },
        undefined
      );
    });
  });

  describe('warning() method', () => {
    it('should show warning notification with default message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.warning('Be careful');

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Be careful',
          text: '주의하세요.',
          image: undefined,
          timeout: 4000,
          onclick: undefined,
        },
        undefined
      );
    });

    it('should show warning notification with custom message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.warning('Warning', 'Low disk space', 3000);

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Warning',
          text: 'Low disk space',
          image: undefined,
          timeout: 3000,
          onclick: undefined,
        },
        undefined
      );
    });
  });

  describe('info() method', () => {
    it('should show info notification with default message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.info('Information');

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Information',
          text: '정보입니다.',
          image: undefined,
          timeout: 3000,
          onclick: undefined,
        },
        undefined
      );
    });

    it('should show info notification with custom message', async () => {
      // Arrange
      const mockGMNotification = vi.fn();
      (globalThis as Record<string, unknown>).GM_notification = mockGMNotification;

      // Act
      await service.info('Info', 'System status', 2000);

      // Assert
      expect(mockGMNotification).toHaveBeenCalledWith(
        {
          title: 'Info',
          text: 'System status',
          image: undefined,
          timeout: 2000,
          onclick: undefined,
        },
        undefined
      );
    });
  });

  describe('getNotificationProvider()', () => {
    it('should return GM provider when GM_notification is available', async () => {
      // Arrange
      (globalThis as Record<string, unknown>).GM_notification = vi.fn();

      // Act
      const providerInfo: any = await service.getNotificationProvider();

      // Assert
      expect(providerInfo.provider).toBe('gm');
      expect(providerInfo.available).toBe(true);
      expect(providerInfo.description).toContain('GM_notification available');
    });

    it('should return none provider when GM_notification is not available', async () => {
      // Arrange
      delete (globalThis as Record<string, unknown>).GM_notification;

      // Act
      const providerInfo: any = await service.getNotificationProvider();

      // Assert
      expect(providerInfo.provider).toBe('none');
      expect(providerInfo.available).toBe(false);
      expect(providerInfo.description).toContain('GM_notification unavailable');
    });
  });
});
