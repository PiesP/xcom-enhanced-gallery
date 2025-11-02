/**
 * @fileoverview Notification Service - Phase 315
 * @description Direct Tampermonkey GM_notification wrapper for system notifications
 *              with environment-aware error handling
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
 * Availability check result for notifications - Phase 315
 */
export interface NotificationAvailabilityCheckResult {
  available: boolean;
  environment: string;
  message: string;
  canFallback: boolean;
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
 * Direct GM_notification usage for system notifications with environment awareness.
 * Phase 315: Added validateAvailability() for environment-aware error handling.
 * No UI components, no state management - just simple notifications.
 *
 * @example
 * ```typescript
 * const notifier = NotificationService.getInstance();
 *
 * // Check availability before using
 * const availability = await notifier.validateAvailability();
 * if (!availability.available) {
 *   console.log(availability.message);
 * }
 *
 * // Show notifications
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
   * Validate notification availability in current environment - Phase 315
   *
   * Checks if GM_notification is available and provides environment-specific guidance.
   *
   * @returns Availability check result with environment details
   *
   * @example
   * ```typescript
   * const result = await notifier.validateAvailability();
   * console.log(result.available);   // boolean
   * console.log(result.environment); // 'userscript' | 'test' | 'extension' | 'console'
   * console.log(result.message);     // Environment-specific guidance
   * console.log(result.canFallback); // Whether fallback is possible
   * ```
   */
  async validateAvailability(): Promise<NotificationAvailabilityCheckResult> {
    const { detectEnvironment, getEnvironmentDescription } = await import(
      '@shared/external/userscript'
    );

    const env = detectEnvironment();
    const gmNotif = (globalThis as GlobalWithGMNotification).GM_notification;

    return {
      available: !!gmNotif,
      environment: env.environment,
      message: gmNotif
        ? `✅ GM_notification available in ${env.environment} environment. Notifications enabled.`
        : `⚠️ GM_notification not available. ${getEnvironmentDescription(env)} Consider using toast/UI fallback.`,
      canFallback: env.isTestEnvironment || env.isBrowserConsole || env.isBrowserExtension,
    };
  }

  /**
   * Show notification
   *
   * Displays a notification using GM_notification if available.
   * Phase 315: Logs environment-aware warnings when API is unavailable.
   *
   * @param options Notification options
   */
  async show(options: NotificationOptions): Promise<void> {
    try {
      const gm = globalThis as GlobalWithGMNotification;
      if (!gm.GM_notification) {
        // Phase 315: Log environment context for debugging
        const availability = await this.validateAvailability();
        logger.warn(
          `GM_notification not available in ${availability.environment} environment. ${availability.message}`
        );
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
