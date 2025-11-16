/**
 * @fileoverview Lean NotificationService
 * Simplified: Only uses Tampermonkey GM_notification when available. No console or UI fallbacks.
 */
import { logger } from '@shared/logging';
import type { GMNotificationDetails } from '@shared/types/core/userscript';

export interface NotificationOptions {
  title: string;
  text?: string;
  timeout?: number;
  image?: string;
  onclick?: () => void;
}

export interface NotificationProviderInfo {
  provider: 'gm' | 'none';
  available: boolean;
  description: string;
}

export interface NotificationAvailabilityCheckResult {
  available: boolean;
  environment: string;
  message: string;
  canFallback: boolean; // always false in lean mode
}

interface GlobalWithGMNotification {
  GM_notification?: (details: GMNotificationDetails, ondone?: () => void) => void;
}

export class NotificationService {
  private static instance: NotificationService | null = null;
  private constructor() {}

  static getInstance(): NotificationService {
    if (!this.instance) this.instance = new NotificationService();
    return this.instance;
  }

  async getNotificationProvider(): Promise<NotificationProviderInfo> {
    const { detectEnvironment } = await import('@shared/external/userscript');
    const env = detectEnvironment();
    const gm = (globalThis as GlobalWithGMNotification).GM_notification;
    return gm
      ? {
          provider: 'gm',
          available: true,
          description: `✅ GM_notification available (${env.environment})`,
        }
      : {
          provider: 'none',
          available: false,
          description: `⚠️ GM_notification unavailable (${env.environment})`,
        };
  }

  async validateAvailability(): Promise<NotificationAvailabilityCheckResult> {
    const { detectEnvironment } = await import('@shared/external/userscript');
    const env = detectEnvironment();
    const gm = (globalThis as GlobalWithGMNotification).GM_notification;
    return {
      available: !!gm,
      environment: env.environment,
      message: gm
        ? '✅ Notifications enabled via GM_notification'
        : '⚠️ GM_notification not available; notifications disabled',
      canFallback: false,
    };
  }

  private gmNotify(options: NotificationOptions): void {
    const gm = (globalThis as GlobalWithGMNotification).GM_notification;
    if (!gm) return; // silent in lean mode
    try {
      const details: GMNotificationDetails = {
        title: options.title,
      };

      if (typeof options.text !== 'undefined') {
        details.text = options.text;
      }
      if (typeof options.image !== 'undefined') {
        details.image = options.image;
      }
      if (typeof options.timeout !== 'undefined') {
        details.timeout = options.timeout;
      }
      if (typeof options.onclick === 'function') {
        details.onclick = options.onclick;
      }

      gm(details, undefined);
    } catch (e) {
      logger.warn('[NotificationService] GM_notification failed (silent lean mode)', e);
    }
  }

  async show(options: NotificationOptions): Promise<void> {
    const provider = await this.getNotificationProvider();
    if (provider.provider === 'gm') {
      this.gmNotify(options);
      logger.debug(`Notification (gm): ${options.title}`);
    } else {
      // Lean: silently ignore when GM_notification is not available
      logger.debug(`Notification skipped (no GM_notification): ${options.title}`);
    }
  }

  async success(title: string, text?: string, timeout = 3000): Promise<void> {
    await this.show({ title, text: text ?? '완료되었습니다.', timeout });
  }
  async error(title: string, text?: string, timeout = 5000): Promise<void> {
    await this.show({ title, text: text ?? '오류가 발생했습니다.', timeout });
  }
  async warning(title: string, text?: string, timeout = 4000): Promise<void> {
    await this.show({ title, text: text ?? '주의하세요.', timeout });
  }
  async info(title: string, text?: string, timeout = 3000): Promise<void> {
    await this.show({ title, text: text ?? '정보입니다.', timeout });
  }
}

export function getNotificationService(): NotificationService {
  return NotificationService.getInstance();
}
