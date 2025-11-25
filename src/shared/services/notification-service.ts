/**
 * @fileoverview Lean NotificationService
 * Simplified: Only uses Tampermonkey GM_notification when available. No console or UI fallbacks.
 */
import { logger } from "@shared/logging";
import type { GMNotificationDetails } from "@shared/types/core/userscript";

export interface NotificationOptions {
  title: string;
  text?: string;
  timeout?: number;
  image?: string;
  onclick?: () => void;
}

export interface NotificationProviderInfo {
  provider: "gm" | "none";
  available: boolean;
  description: string;
}

interface GlobalWithGMNotification {
  GM_notification?: (
    details: GMNotificationDetails,
    ondone?: () => void,
  ) => void;
}

export class NotificationService {
  private static instance: NotificationService | null = null;
  private constructor() {}

  static getInstance(): NotificationService {
    if (!this.instance) this.instance = new NotificationService();
    return this.instance;
  }

  async getNotificationProvider(): Promise<NotificationProviderInfo> {
    const { detectEnvironment } = await import("@shared/external/userscript");
    const env = detectEnvironment();
    const gm = (globalThis as GlobalWithGMNotification).GM_notification;
    const summary = `theme:${env.colorScheme}/lang:${env.language}`;
    return gm
      ? {
          provider: "gm",
          available: true,
          description: `GM_notification ready (${summary})`,
        }
      : {
          provider: "none",
          available: false,
          description: `GM_notification unavailable (${summary})`,
        };
  }

  private gmNotify(options: NotificationOptions): void {
    const gm = (globalThis as GlobalWithGMNotification).GM_notification;
    if (!gm) return; // silent in lean mode
    try {
      const details: GMNotificationDetails = {
        title: options.title,
      };

      if (typeof options.text !== "undefined") {
        details.text = options.text;
      }
      if (typeof options.image !== "undefined") {
        details.image = options.image;
      }
      if (typeof options.timeout !== "undefined") {
        details.timeout = options.timeout;
      }
      if (typeof options.onclick === "function") {
        details.onclick = options.onclick;
      }

      gm(details, undefined);
    } catch (e) {
      logger.warn(
        "[NotificationService] GM_notification failed (silent lean mode)",
        e,
      );
    }
  }

  async show(options: NotificationOptions): Promise<void> {
    const provider = await this.getNotificationProvider();
    if (provider.provider === "gm") {
      this.gmNotify(options);
      logger.debug(`Notification (gm): ${options.title}`);
    } else {
      // Lean: silently ignore when GM_notification is not available
      logger.debug(
        `Notification skipped (no GM_notification): ${options.title}`,
      );
    }
  }

  async success(title: string, text?: string, timeout = 3000): Promise<void> {
    await this.show({
      title,
      text: text ?? "Completed successfully.",
      timeout,
    });
  }
  async error(title: string, text?: string, timeout = 5000): Promise<void> {
    await this.show({ title, text: text ?? "An error occurred.", timeout });
  }
  async warning(title: string, text?: string, timeout = 4000): Promise<void> {
    await this.show({ title, text: text ?? "Warning.", timeout });
  }
  async info(title: string, text?: string, timeout = 3000): Promise<void> {
    await this.show({ title, text: text ?? "Information.", timeout });
  }
}

export function getNotificationService(): NotificationService {
  return NotificationService.getInstance();
}
