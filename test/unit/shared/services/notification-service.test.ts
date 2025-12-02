
// Mock dependencies (must come before importing modules that use them)
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/external/userscript', () => ({
  detectEnvironment: vi.fn().mockReturnValue({
    colorScheme: 'dark',
    language: 'en',
  }),
}));

import { logger } from '@shared/logging';
import { NotificationService, getNotificationService } from '@shared/services/notification-service';

describe('NotificationService', () => {
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

  describe('Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = getNotificationService();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service);
    });
  });

  describe('show', () => {
    it('should call GM_notification when available', async () => {
      const options = { title: 'Test', text: 'Message' };
      await service.show(options);

      expect(gmNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
          text: 'Message',
        }),
        undefined
      );
    });

    it('should pass all options to GM_notification', async () => {
      const onClick = vi.fn();
      const options = {
        title: 'Test',
        text: 'Message',
        image: 'icon.png',
        timeout: 1000,
        onclick: onClick,
      };

      await service.show(options);

      expect(gmNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
          text: 'Message',
          image: 'icon.png',
          timeout: 1000,
          onclick: onClick,
        }),
        undefined
      );
    });

    it('should not call GM_notification when unavailable', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).GM_notification;

      await service.show({ title: 'Test' });

      expect(gmNotificationMock).not.toHaveBeenCalled();
    });

    it('should handle GM_notification errors gracefully', async () => {
      const error = new Error('GM Error');
      gmNotificationMock.mockImplementation(() => {
        throw error;
      });

      await service.show({ title: 'Test' });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('GM_notification failed'),
        error
      );
    });
  });

  describe('Helper methods', () => {
    it('error should call show with defaults', async () => {
      const spy = vi.spyOn(service, 'show');
      await service.error('Error Title');

      expect(spy).toHaveBeenCalledWith({
        title: 'Error Title',
        text: 'An error occurred.',
        timeout: 5000,
      });
    });
  });
});
