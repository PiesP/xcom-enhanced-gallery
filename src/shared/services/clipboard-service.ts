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
 * Clipboard availability check result with environment context
 */
export interface ClipboardAvailabilityCheckResult {
  available: boolean;
  environment: string;
  message: string;
  canFallback: boolean;
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
   * Check if GM_setClipboard is available in current environment
   * Detects Tampermonkey, test, extension, and console environments
   *
   * @returns Availability check result with environment context
   */
  async validateAvailability(): Promise<ClipboardAvailabilityCheckResult> {
    const { detectEnvironment, getEnvironmentDescription } = await import(
      '@shared/external/userscript'
    );

    const env = detectEnvironment();
    const gmSetClipboard = (globalThis as GlobalWithGMSetClipboard).GM_setClipboard;

    return {
      available: !!gmSetClipboard,
      environment: env.environment,
      message: gmSetClipboard
        ? `✅ GM_setClipboard available in ${env.environment} environment.`
        : `⚠️ GM_setClipboard not available. ${getEnvironmentDescription(env)}. Consider using DOM fallback or manual copy.`,
      canFallback: env.isTestEnvironment || env.isBrowserConsole || env.isBrowserExtension,
    };
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
        const availability = await this.validateAvailability();
        const error = availability.message;
        logger.warn('ClipboardService.copyText:', error);

        if (showNotification) {
          await this.notificationService.error('Copy failed', 'Tampermonkey required');
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
        await this.notificationService.success('Copy complete', `${text.length} characters copied`);
      }

      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('ClipboardService.copyText failed:', error);

      if (showNotification) {
        await this.notificationService.error('Copy error', msg);
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
      logger.debug('ClipboardService.copyURL: success', { label: displayLabel });
      await this.notificationService.success('Copy URL', displayLabel);
    } else {
      const availability = await this.validateAvailability();
      logger.warn('ClipboardService.copyURL failed:', availability.message);
      await this.notificationService.error('Copy URL failed', displayLabel);
    }

    return result;
  }
}

/**
 * Singleton instance export (convenience)
 */
export const clipboardService = ClipboardService.getInstance();
