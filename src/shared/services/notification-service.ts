/**
 * @fileoverview Lean NotificationService
 * Simplified: Only uses Tampermonkey GM_notification when available via UserscriptAPI adapter.
 * No console or UI fallbacks.
 */
import { getUserscript, type UserscriptAPI } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import type { GMNotificationDetails, GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
import { createSingleton } from '@shared/utils/types/singleton';

const NOOP_USERSCRIPT: UserscriptAPI = Object.freeze({
  hasGM: false,
  manager: 'unknown',
  info: () => null,
  async download(_url: string, _filename: string) {
    throw new Error('GM_download unavailable');
  },
  async setValue(_key: string, _value: unknown) {
    throw new Error('GM_setValue unavailable');
  },
  async getValue<T>(_key: string, _default?: T): Promise<T | undefined> {
    return undefined;
  },
  getValueSync<T>(_key: string, _default?: T): T | undefined {
    return undefined;
  },
  async deleteValue(_key: string) {
    throw new Error('GM_deleteValue unavailable');
  },
  async listValues(): Promise<string[]> {
    return [];
  },
  addStyle(_css: string): HTMLStyleElement {
    throw new Error('GM_addStyle unavailable');
  },
  xmlHttpRequest(_details: GMXMLHttpRequestDetails) {
    throw new Error('GM_xmlhttpRequest unavailable');
  },
  notification(_details: GMNotificationDetails): void {
    // silent no-op
  },
  cookie: undefined,
});

export interface NotificationOptions {
  title: string;
  text?: string;
  timeout?: number;
  image?: string;
  onclick?: () => void;
}

export class NotificationService {
  private static readonly singleton = createSingleton(() => new NotificationService());

  private get userscript(): UserscriptAPI {
    try {
      return getUserscript();
    } catch {
      return NOOP_USERSCRIPT;
    }
  }

  private constructor() {}

  static getInstance(): NotificationService {
    return NotificationService.singleton.get();
  }

  /** @internal Test helper */
  static resetForTests(): void {
    NotificationService.singleton.reset();
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
    logger.debug(`Notification: ${options.title}`);
  }

  async error(title: string, text?: string, timeout = 5000): Promise<void> {
    await this.show({ title, text: text ?? 'An error occurred.', timeout });
  }
}

export function getNotificationService(): NotificationService {
  return NotificationService.getInstance();
}
