/**
 * @fileoverview Lean NotificationService
 * Simplified: Only uses Tampermonkey GM_notification when available via UserscriptAPI adapter.
 * No console or UI fallbacks.
 */
import { getUserscriptSafe, type UserscriptAPI } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging/logger';
import { createSingleton } from '@shared/utils/types/singleton';

interface NotificationOptions {
  readonly title: string;
  readonly text?: string;
  readonly timeout?: number;
  readonly image?: string;
  readonly onclick?: () => void;
}

export class NotificationService {
  private static readonly singleton = createSingleton(() => new NotificationService());

  private get userscript(): UserscriptAPI {
    return getUserscriptSafe();
  }

  private constructor() {}

  static getInstance(): NotificationService {
    return NotificationService.singleton.get();
  }

  /** @internal Test helper */
  static resetForTests(): void {
    NotificationService.singleton.reset?.();
  }

  async show(options: NotificationOptions): Promise<void> {
    // Use UserscriptAPI adapter for GM_notification access
    // The adapter silently handles unavailability
    this.userscript.notification({
      title: options.title,
      text: options.text,
      image: options.image,
      timeout: options.timeout,
      onclick: options.onclick,
    });
    if (__DEV__) {
      logger.debug(`Notification: ${options.title}`);
    }
  }

  async error(title: string, text: string, timeout = 5000): Promise<void> {
    await this.show({ title, text, timeout });
  }
}
