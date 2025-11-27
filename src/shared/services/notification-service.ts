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

interface GlobalWithGMNotification {
  GM_notification?: (details: GMNotificationDetails, ondone?: () => void) => void;
}

export class NotificationService {
  private static instance: NotificationService | null = null;
  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) NotificationService.instance = new NotificationService();
    return NotificationService.instance;
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
    const gm = (globalThis as GlobalWithGMNotification).GM_notification;
    if (gm) {
      this.gmNotify(options);
      logger.debug(`Notification (gm): ${options.title}`);
    } else {
      // Lean: silently ignore when GM_notification is not available
      logger.debug(`Notification skipped (no GM_notification): ${options.title}`);
    }
  }

  async error(title: string, text?: string, timeout = 5000): Promise<void> {
    await this.show({ title, text: text ?? 'An error occurred.', timeout });
  }
}

export function getNotificationService(): NotificationService {
  return NotificationService.getInstance();
}
