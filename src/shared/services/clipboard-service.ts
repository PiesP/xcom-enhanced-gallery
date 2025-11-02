/**
 * @fileoverview Clipboard Service
 * @description Tampermonkey GM_setClipboard wrapper for clipboard operations
 *
 * Phase 311: Final Tampermonkey API integration
 * - Wraps: GM_setClipboard
 * - Pattern: Singleton
 * - Features: Text copy with optional notification
 */

import { logger } from '@shared/logging';
import { NotificationService } from './notification-service';

/**
 * Clipboard operation result
 */
export interface ClipboardResult {
  success: boolean;
  error?: string;
}

/**
 * Interface for GM_setClipboard function
 */
interface GlobalWithGMSetClipboard {
  GM_setClipboard?: (text: string, type?: string) => void;
}

/**
 * Get GM_setClipboard from userscript global context
 */
function getGMSetClipboard(): ((text: string, type?: string) => void) | undefined {
  const gm = globalThis as GlobalWithGMSetClipboard;
  return gm.GM_setClipboard;
}

/**
 * Clipboard Service using Tampermonkey API
 *
 * Direct GM_setClipboard usage for clipboard operations.
 * No DOM manipulation, no fallback - Tampermonkey-only.
 *
 * @example
 * ```typescript
 * const clipboard = ClipboardService.getInstance();
 * const result = await clipboard.copyText('https://twitter.com/...', true);
 * if (result.success) {
 *   console.log('Copied to clipboard');
 * }
 * ```
 */
export class ClipboardService {
  private static instance: ClipboardService | null = null;
  private readonly notificationService = NotificationService.getInstance();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ClipboardService {
    if (!this.instance) {
      this.instance = new ClipboardService();
    }
    return this.instance;
  }

  /**
   * Copy text to clipboard
   *
   * @param text Text to copy
   * @param showNotification Show success/error notification
   * @returns Result object with success status
   */
  async copyText(text: string, showNotification: boolean = true): Promise<ClipboardResult> {
    try {
      const gmSetClipboard = getGMSetClipboard();

      if (!gmSetClipboard) {
        const error = 'Tampermonkey GM_setClipboard not available';
        logger.warn('ClipboardService.copyText:', error);

        if (showNotification) {
          await this.notificationService.error('복사 실패', 'Tampermonkey 필수');
        }

        return { success: false, error };
      }

      // Call GM_setClipboard (no return value, synchronous)
      gmSetClipboard(text, 'text/plain');

      logger.debug('ClipboardService.copyText: success', {
        length: text.length,
        preview: text.substring(0, 50),
      });

      if (showNotification) {
        await this.notificationService.success('복사 완료', `${text.length}자 복사됨`);
      }

      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('ClipboardService.copyText failed:', error);

      if (showNotification) {
        await this.notificationService.error('복사 오류', msg);
      }

      return { success: false, error: msg };
    }
  }

  /**
   * Copy URL to clipboard (convenience method)
   *
   * @param url URL to copy
   * @param label Optional label for notification
   * @returns Result object with success status
   */
  async copyURL(url: string, label?: string): Promise<ClipboardResult> {
    const displayLabel = label || 'URL';
    const result = await this.copyText(url, false);

    if (result.success) {
      await this.notificationService.success('URL 복사', displayLabel);
    } else {
      await this.notificationService.error('URL 복사 실패', displayLabel);
    }

    return result;
  }
}

/**
 * Singleton instance export (convenience)
 */
export const clipboardService = ClipboardService.getInstance();
