/**
 * @fileoverview Notification Service
 * @description Direct Tampermonkey GM_notification wrapper for system notifications
 */

import { logger } from '@shared/logging';

/**
 * Notification options
 */
export interface NotificationOptions {
  title: string;
  text: string;
  image?: string;
  timeout?: number;
  onclick?: () => void;
}

/**
 * Tampermonkey GM_notification interface
 */
interface GlobalWithGMNotification {
  GM_notification?: (
    text: string,
    title?: string,
    image?: string,
    onclick?: () => void,
    timeout?: number
  ) => void;
}

/**
 * Notification Service using Tampermonkey API
 *
 * Direct GM_notification usage for system notifications.
 * No UI components, no state management - just simple notifications.
 *
 * @example
 * ```typescript
 * const notifier = NotificationService.getInstance();
 * notifier.show({
 *   title: 'Download Started',
 *   text: 'Downloading 5 images...',
 *   timeout: 3000
 * });
 * notifier.success('Files downloaded successfully');
 * notifier.error('Download failed', 'Network error');
 * ```
 */
export class NotificationService {
  private static instance: NotificationService | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  /**
   * Show notification
   *
   * @param options Notification options
   */
  async show(options: NotificationOptions): Promise<void> {
    try {
      const gm = globalThis as GlobalWithGMNotification;
      if (!gm.GM_notification) {
        logger.warn('GM_notification not available');
        return;
      }

      gm.GM_notification(
        options.text,
        options.title,
        options.image,
        options.onclick,
        options.timeout
      );
      logger.debug(`Notification: ${options.title}`);
    } catch (error) {
      logger.error('Failed to show notification:', error);
    }
  }

  /**
   * Show success notification
   *
   * @param title Notification title
   * @param text Notification text (optional)
   * @param timeout Auto-close timeout in ms
   */
  async success(title: string, text?: string, timeout: number = 3000): Promise<void> {
    await this.show({
      title,
      text: text ?? '완료되었습니다.',
      timeout,
    });
  }

  /**
   * Show error notification
   *
   * @param title Notification title
   * @param text Notification text (optional)
   * @param timeout Auto-close timeout in ms
   */
  async error(title: string, text?: string, timeout: number = 5000): Promise<void> {
    await this.show({
      title,
      text: text ?? '오류가 발생했습니다.',
      timeout,
    });
  }

  /**
   * Show warning notification
   *
   * @param title Notification title
   * @param text Notification text (optional)
   * @param timeout Auto-close timeout in ms
   */
  async warning(title: string, text?: string, timeout: number = 4000): Promise<void> {
    await this.show({
      title,
      text: text ?? '주의하세요.',
      timeout,
    });
  }

  /**
   * Show info notification
   *
   * @param title Notification title
   * @param text Notification text (optional)
   * @param timeout Auto-close timeout in ms
   */
  async info(title: string, text?: string, timeout: number = 3000): Promise<void> {
    await this.show({
      title,
      text: text ?? '정보입니다.',
      timeout,
    });
  }
}

/**
 * Get singleton instance convenience function
 */
export function getNotificationService(): NotificationService {
  return NotificationService.getInstance();
}
