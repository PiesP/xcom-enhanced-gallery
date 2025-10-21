/**
 * @fileoverview toast-controller.ts 테스트
 * @description ToastController 서비스 테스트
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastController, toastController } from '../../../../src/shared/services/toast-controller';
import type { ToastOptions } from '../../../../src/shared/services/toast-controller';

// Mock logger
vi.mock('../../../../src/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ToastManager
const mockToastManagerInstance = {
  show: vi.fn((options: ToastOptions) => `toast-${Date.now()}`),
  remove: vi.fn(),
  clear: vi.fn(),
};

vi.mock('../../../../src/shared/services/unified-toast-manager', () => ({
  ToastManager: {
    getInstance: vi.fn(() => mockToastManagerInstance),
  },
}));

describe('ToastController', () => {
  let controller: ToastController;

  beforeEach(() => {
    controller = new ToastController();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await controller.initialize();

      expect(controller.isInitialized()).toBe(true);
      expect(controller.isReady()).toBe(true);
    });

    it('should start as not initialized', () => {
      expect(controller.isInitialized()).toBe(false);
      expect(controller.isReady()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clear all toasts and reset state', async () => {
      await controller.initialize();
      await controller.cleanup();

      expect(mockToastManagerInstance.clear).toHaveBeenCalledTimes(1);
      expect(controller.isInitialized()).toBe(false);
    });

    it('should work even if not initialized', async () => {
      await controller.cleanup();

      expect(mockToastManagerInstance.clear).toHaveBeenCalled();
      expect(controller.isInitialized()).toBe(false);
    });
  });

  describe('show', () => {
    it('should display toast with default options', () => {
      const options: ToastOptions = {
        title: 'Test Title',
        message: 'Test Message',
      };

      const id = controller.show(options);

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(options);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should display toast with all options', () => {
      const onAction = vi.fn();
      const options: ToastOptions = {
        title: 'Test',
        message: 'Message',
        type: 'success',
        duration: 5000,
        actionText: 'Click Me',
        onAction,
      };

      controller.show(options);

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(options);
    });

    it('should return toast ID', () => {
      const id = controller.show({
        title: 'Test',
        message: 'Message',
      });

      expect(id).toMatch(/^toast-/);
    });

    it('should handle type option', () => {
      const types: Array<'info' | 'success' | 'warning' | 'error'> = [
        'info',
        'success',
        'warning',
        'error',
      ];

      types.forEach(type => {
        controller.show({
          title: 'Test',
          message: 'Message',
          type,
        });

        expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
          expect.objectContaining({ type })
        );
      });
    });
  });

  describe('success', () => {
    it('should display success toast', () => {
      const title = 'Success';
      const message = 'Operation completed';

      controller.success(title, message);

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          message,
          type: 'success',
        })
      );
    });

    it('should merge additional options', () => {
      const title = 'Success';
      const message = 'Done';
      const options = { duration: 3000 };

      controller.success(title, message, options);

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          message,
          type: 'success',
          duration: 3000,
        })
      );
    });

    it('should return toast ID', () => {
      const id = controller.success('Test', 'Message');

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });
  });

  describe('info', () => {
    it('should display info toast', () => {
      const title = 'Information';
      const message = 'Please note';

      controller.info(title, message);

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          message,
          type: 'info',
        })
      );
    });

    it('should merge additional options', () => {
      const onAction = vi.fn();
      controller.info('Info', 'Message', {
        actionText: 'Action',
        onAction,
      });

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          actionText: 'Action',
          onAction,
        })
      );
    });

    it('should return toast ID', () => {
      const id = controller.info('Test', 'Message');

      expect(id).toBeDefined();
    });
  });

  describe('warning', () => {
    it('should display warning toast', () => {
      const title = 'Warning';
      const message = 'Be careful';

      controller.warning(title, message);

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          message,
          type: 'warning',
        })
      );
    });

    it('should merge additional options', () => {
      controller.warning('Warn', 'Message', { duration: 10000 });

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          duration: 10000,
        })
      );
    });

    it('should return toast ID', () => {
      const id = controller.warning('Test', 'Message');

      expect(id).toBeDefined();
    });
  });

  describe('error', () => {
    it('should display error toast', () => {
      const title = 'Error';
      const message = 'Something went wrong';

      controller.error(title, message);

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          message,
          type: 'error',
        })
      );
    });

    it('should merge additional options', () => {
      const onAction = vi.fn();
      controller.error('Error', 'Message', {
        actionText: 'Retry',
        onAction,
      });

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          actionText: 'Retry',
          onAction,
        })
      );
    });

    it('should return toast ID', () => {
      const id = controller.error('Test', 'Message');

      expect(id).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove specific toast by ID', () => {
      const id = 'toast-123';

      controller.remove(id);

      expect(mockToastManagerInstance.remove).toHaveBeenCalledWith(id);
      expect(mockToastManagerInstance.remove).toHaveBeenCalledTimes(1);
    });

    it('should delegate to ToastManager', () => {
      controller.remove('test-id');

      expect(mockToastManagerInstance.remove).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all toasts', () => {
      controller.clear();

      expect(mockToastManagerInstance.clear).toHaveBeenCalledTimes(1);
    });

    it('should delegate to ToastManager', () => {
      controller.clear();

      expect(mockToastManagerInstance.clear).toHaveBeenCalled();
    });
  });

  describe('global instance', () => {
    it('should provide global toastController instance', () => {
      expect(toastController).toBeInstanceOf(ToastController);
    });

    it('should be usable without explicit initialization', () => {
      const id = toastController.show({
        title: 'Test',
        message: 'Message',
      });

      expect(id).toBeDefined();
      expect(mockToastManagerInstance.show).toHaveBeenCalled();
    });

    it('should maintain state across calls', async () => {
      await toastController.initialize();
      expect(toastController.isInitialized()).toBe(true);

      await toastController.cleanup();
      expect(toastController.isInitialized()).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple toast types in sequence', () => {
      controller.info('Info', 'Info message');
      controller.success('Success', 'Success message');
      controller.warning('Warning', 'Warning message');
      controller.error('Error', 'Error message');

      expect(mockToastManagerInstance.show).toHaveBeenCalledTimes(4);
    });

    it('should handle toast with action callback', () => {
      const actionCallback = vi.fn();
      controller.show({
        title: 'Action Toast',
        message: 'Click action',
        actionText: 'Click',
        onAction: actionCallback,
      });

      expect(mockToastManagerInstance.show).toHaveBeenCalledWith(
        expect.objectContaining({
          actionText: 'Click',
          onAction: actionCallback,
        })
      );
    });

    it('should handle lifecycle: initialize → show → cleanup', async () => {
      await controller.initialize();
      expect(controller.isReady()).toBe(true);

      controller.show({ title: 'Test', message: 'Message' });
      expect(mockToastManagerInstance.show).toHaveBeenCalled();

      await controller.cleanup();
      expect(mockToastManagerInstance.clear).toHaveBeenCalled();
      expect(controller.isReady()).toBe(false);
    });

    it('should allow removing specific toast after showing', () => {
      mockToastManagerInstance.show.mockReturnValue('toast-456');

      const id = controller.show({ title: 'Test', message: 'Message' });
      controller.remove(id);

      expect(mockToastManagerInstance.remove).toHaveBeenCalledWith('toast-456');
    });
  });
});
