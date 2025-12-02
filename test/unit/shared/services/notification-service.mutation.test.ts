/**
 * @fileoverview Mutation test coverage for NotificationService
 * Target: Improve notification-service.ts from 80.56% to 90%+
 * Focus: Edge cases, conditional branches, optional parameters
 */
import { NotificationService, getNotificationService } from '@shared/services/notification-service';
import { logger } from '@shared/logging';

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('NotificationService mutation coverage', () => {
  let service: NotificationService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gmNotificationMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (NotificationService as any).instance = null;
    service = NotificationService.getInstance();

    // Setup GM_notification mock
    gmNotificationMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).GM_notification = gmNotificationMock;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (NotificationService as any).instance = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).GM_notification;
  });

  describe('gmNotify conditional branches', () => {
    it('should only include text in details when provided', async () => {
      await service.show({ title: 'Test Title' });

      expect(gmNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Title' }),
        undefined
      );

      // Verify text is NOT in the call if not provided
      const call = gmNotificationMock.mock.calls[0][0];
      expect(Object.prototype.hasOwnProperty.call(call, 'text')).toBe(false);
    });

    it('should include text when explicitly set to empty string', async () => {
      await service.show({ title: 'Test', text: '' });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(call.text).toBe('');
    });

    it('should only include image when provided', async () => {
      await service.show({ title: 'Test' });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(Object.prototype.hasOwnProperty.call(call, 'image')).toBe(false);
    });

    it('should include image when set to empty string', async () => {
      await service.show({ title: 'Test', image: '' });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(call.image).toBe('');
    });

    it('should only include timeout when provided', async () => {
      await service.show({ title: 'Test' });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(Object.prototype.hasOwnProperty.call(call, 'timeout')).toBe(false);
    });

    it('should include timeout when set to 0', async () => {
      await service.show({ title: 'Test', timeout: 0 });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(call.timeout).toBe(0);
    });

    it('should only include onclick when it is a function', async () => {
      await service.show({ title: 'Test' });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(Object.prototype.hasOwnProperty.call(call, 'onclick')).toBe(false);
    });

    it('should include onclick when provided as function', async () => {
      const onclick = vi.fn();
      await service.show({ title: 'Test', onclick });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(call.onclick).toBe(onclick);
    });

    it('should NOT include onclick if not a function', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await service.show({ title: 'Test', onclick: 'not a function' as any });

      const call = gmNotificationMock.mock.calls[0][0];
      expect(Object.prototype.hasOwnProperty.call(call, 'onclick')).toBe(false);
    });
  });

  describe('show method logging', () => {
    it('should log debug with gm when GM_notification is available', async () => {
      await service.show({ title: 'Notification Test' });

      expect(logger.debug).toHaveBeenCalledWith('Notification (gm): Notification Test');
    });

    it('should log debug with skip message when GM_notification unavailable', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).GM_notification;

      await service.show({ title: 'Skipped Test' });

      expect(logger.debug).toHaveBeenCalledWith('Notification skipped (no GM_notification): Skipped Test');
      expect(gmNotificationMock).not.toHaveBeenCalled();
    });
  });

  describe('error helper method', () => {
    it('should use default error text when text is not provided', async () => {
      const showSpy = vi.spyOn(service, 'show');
      await service.error('Error Title');

      expect(showSpy).toHaveBeenCalledWith({
        title: 'Error Title',
        text: 'An error occurred.',
        timeout: 5000,
      });
    });

    it('should use provided text when given', async () => {
      const showSpy = vi.spyOn(service, 'show');
      await service.error('Error Title', 'Custom error message');

      expect(showSpy).toHaveBeenCalledWith({
        title: 'Error Title',
        text: 'Custom error message',
        timeout: 5000,
      });
    });

    it('should use custom timeout when provided', async () => {
      const showSpy = vi.spyOn(service, 'show');
      await service.error('Error Title', undefined, 10000);

      expect(showSpy).toHaveBeenCalledWith({
        title: 'Error Title',
        text: 'An error occurred.',
        timeout: 10000,
      });
    });

    it('should use empty string for text when explicitly provided', async () => {
      const showSpy = vi.spyOn(service, 'show');
      await service.error('Error Title', '');

      expect(showSpy).toHaveBeenCalledWith({
        title: 'Error Title',
        text: '',
        timeout: 5000,
      });
    });
  });

  describe('GM_notification error handling', () => {
    it('should catch synchronous errors from GM_notification', async () => {
      gmNotificationMock.mockImplementation(() => {
        throw new Error('Sync GM Error');
      });

      await service.show({ title: 'Test' });

      expect(logger.warn).toHaveBeenCalledWith(
        '[NotificationService] GM_notification failed (silent lean mode)',
        expect.any(Error)
      );
    });

    it('should not throw when GM_notification throws', async () => {
      gmNotificationMock.mockImplementation(() => {
        throw new Error('GM Error');
      });

      await expect(service.show({ title: 'Test' })).resolves.not.toThrow();
    });
  });

  describe('singleton pattern edge cases', () => {
    it('should reuse existing instance after first call', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      const instance3 = getNotificationService();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });

    it('should create new instance after manual reset', () => {
      const instance1 = NotificationService.getInstance();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (NotificationService as any).instance = null;
      const instance2 = NotificationService.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('gmNotify return early when unavailable', () => {
    it('should return early without logging warn when gm is undefined', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).GM_notification;

      // gmNotify is private, but we can test through show
      await service.show({ title: 'Test' });

      // Should not call warn since it returns early (no error)
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('full options object construction', () => {
    it('should construct details with all optional properties', async () => {
      const onclick = vi.fn();

      await service.show({
        title: 'Full Test',
        text: 'Message',
        image: 'icon.png',
        timeout: 3000,
        onclick,
      });

      expect(gmNotificationMock).toHaveBeenCalledWith(
        {
          title: 'Full Test',
          text: 'Message',
          image: 'icon.png',
          timeout: 3000,
          onclick,
        },
        undefined
      );
    });

    it('should construct minimal details with only title', async () => {
      await service.show({ title: 'Minimal' });

      expect(gmNotificationMock).toHaveBeenCalledWith(
        { title: 'Minimal' },
        undefined
      );
    });
  });
});
