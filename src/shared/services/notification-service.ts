/**
 * @fileoverview Notification Service - Phase 315
 * @description Direct Tampermonkey GM_notification wrapper for system notifications
 *              with environment-aware error handling and fallback providers
 */

import { logger } from '@shared/logging';

/**
 * Notification provider type - Phase 314-3
 */
export type NotificationProvider = 'gm' | 'console' | 'none';

/**
 * Notification provider info - Phase 314-3
 */
export interface NotificationProviderInfo {
  provider: NotificationProvider;
  available: boolean;
  fallback: NotificationProvider | null;
  description: string;
}

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
   * Get notification provider for current environment - Phase 314-3
   *
   * Determines the best notification provider based on environment availability.
   * Priority: GM > Console > None
   *
   * @returns Notification provider info
   *
   * @example
   * ```typescript
   * const notifier = NotificationService.getInstance();
   * const providerInfo = await notifier.getNotificationProvider();
   * console.error(providerInfo.provider); // 'gm' | 'console' | 'none'
   * console.error(providerInfo.available); // boolean
   * console.error(providerInfo.fallback); // Next fallback provider
   * ```
   */
  async getNotificationProvider(): Promise<NotificationProviderInfo> {
    const { detectEnvironment } = await import('@shared/external/userscript');

    const env = detectEnvironment();
    const gmNotif = (globalThis as GlobalWithGMNotification).GM_notification;

    // Priority: GM > Console > None
    if (gmNotif) {
      return {
        provider: 'gm',
        available: true,
        fallback: 'console',
        description: `✅ Using GM_notification in ${env.environment} environment`,
      };
    }

    // Fallback to console (always available in browsers)
    return {
      provider: 'console',
      available: true,
      fallback: 'none',
      description: `⚠️ GM_notification unavailable. Using console fallback in ${env.environment} environment`,
    };
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
   * Displays a notification using GM_notification if available, with fallback to console.
   * Phase 314-3: Uses getNotificationProvider() to determine best provider and fallback.
   * Phase 315: Logs environment-aware warnings when API is unavailable.
   *
   * @param options Notification options
   */
  async show(options: NotificationOptions): Promise<void> {
    try {
      const provider = await this.getNotificationProvider();

      switch (provider.provider) {
        case 'gm': {
          const gm = globalThis as GlobalWithGMNotification;
          gm.GM_notification?.(
            options.text,
            options.title,
            options.image,
            options.onclick,
            options.timeout
          );
          logger.debug(`Notification (GM): ${options.title}`);
          break;
        }

        case 'console': {
          // Fallback to console output
          const msg = `[${options.title}] ${options.text}`;
          logger.info(msg);
          break;
        }

        case 'none':
        default: {
          logger.warn(`No notification provider available: ${provider.description}`);
        }
      }
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
