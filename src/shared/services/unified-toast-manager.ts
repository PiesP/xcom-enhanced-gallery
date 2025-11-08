/**
 * @fileoverview Toast Manager proxy
 * @description Delegates all notifications to Tampermonkey NotificationService (Toast UI deprecated)
 * @version 3.0.0 - Phase 420: Toast UI removal
 */

import { logger } from '@shared/logging';
import { NotificationService } from './notification-service';

// 통합된 Toast 타입 정의
export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

export interface ToastOptions {
  title: string;
  message: string;
  type?: ToastItem['type'];
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  /** @deprecated Phase 420: Toast UI removed, route option has no effect. */
  route?: 'live-only' | 'toast-only' | 'both';
}

/**
 * Toast Manager proxy class
 *
 * Maintains backward-compatible API surface while delegating all work to
 * Tampermonkey NotificationService.
 */
export class ToastManager {
  private static instance: ToastManager | null = null;
  private readonly notificationService = NotificationService.getInstance();
  private toastIdCounter = 0;

  private constructor() {
    logger.debug('[ToastManager] Initialized (delegating to NotificationService)');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  /**
   * Show toast - base method
   */
  public show(options: ToastOptions): string {
    const id = this.generateId();
    const type = options.type ?? 'info';

    const notificationOptions: Parameters<NotificationService['show']>[0] = {
      title: options.title,
      text: options.message,
      ...(options.duration !== undefined ? { timeout: options.duration } : {}),
      ...(options.onAction ? { onclick: options.onAction } : {}),
    };

    void this.notificationService.show(notificationOptions);

    logger.debug(`[ToastManager] Delegated ${type} notification: ${options.title}`);
    return id;
  }

  /**
   * Success toast display
   */
  public success(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'success',
      ...options,
    });
  }

  /**
   * Info toast display
   */
  public info(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'info',
      ...options,
    });
  }

  /**
   * Warning toast display
   */
  public warning(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'warning',
      ...options,
    });
  }

  /**
   * Error toast display
   */
  public error(title: string, message: string, options: Partial<ToastOptions> = {}): string {
    return this.show({
      title,
      message,
      type: 'error',
      ...options,
    });
  }

  /**
   * Remove specific toast
   */
  public remove(id: string): void {
    logger.debug(`[ToastManager] remove(${id}) noop – handled by NotificationService`);
  }

  /**
   * Remove all toasts
   */
  public clear(): void {
    logger.debug('[ToastManager] clear() noop – handled by NotificationService');
  }

  /**
   * Get current toast list
   */
  public getToasts(): ToastItem[] {
    return [];
  }

  /**
   * Subscribe to toast state changes
   */
  public subscribe(callback: (toasts: ToastItem[]) => void): () => void {
    callback([]);
    return () => {
      /* noop */
    };
  }

  /**
   * Signal accessor for Preact signals integration
   */
  public get signal() {
    return {
      get value() {
        return [] as ToastItem[];
      },
      set value(_: ToastItem[]) {
        logger.warn('[ToastManager] Direct state setting is not supported.');
      },
      subscribe(callback: (value: ToastItem[]) => void) {
        callback([]);
        return () => {
          /* noop */
        };
      },
    };
  }

  /**
   * Service initialization
   */
  public async init(): Promise<void> {
    logger.debug('[ToastManager] Service initialization (noop)');
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    logger.debug('[ToastManager] Cleanup complete (noop)');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `toast_${++this.toastIdCounter}_${Date.now()}`;
  }

  /**
   * Notify subscribers of state changes
   */
  /**
   * Initialize singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (ToastManager.instance) {
      ToastManager.instance.cleanup();
      ToastManager.instance = null;
      logger.debug('[ToastManager] Singleton reset');
    }
  }
}

/**
 * Global instance
 */
export const toastManager = ToastManager.getInstance();

/**
 * Signals-based state for use in Preact components
 */
export const toasts = {
  get value(): ToastItem[] {
    return [];
  },
  set value(_: ToastItem[]) {
    // Direct setting is not allowed - changes must be made through manager methods
    logger.warn('[ToastManager] Direct state setting is not allowed. Use manager methods.');
  },
  subscribe(callback: (value: ToastItem[]) => void) {
    callback([]);
    return () => {
      /* noop */
    };
  },
};

/**
 * Migration guide:
 *
 * === Standardized official API ===
 * - toastManager.show(options) - Display all types of toasts
 * - toastManager.success(title, message, options)
 * - toastManager.info(title, message, options)
 * - toastManager.warning(title, message, options)
 * - toastManager.error(title, message, options)
 * - toastManager.remove(id) - Remove specific toast
 * - toastManager.clear() - Remove all toasts
 * - toastManager.getToasts() - Get current toast list
 * - toastManager.subscribe(callback) - Subscribe to state changes
 *
 * === Legacy code migration ===
 * Where alias was used in existing code:
 * - toastController → toastManager
 * - ToastService → toastManager
 * - toastService → toastManager
 *
 * Legacy convenience functions removed:
 * - addToast(...) → toastManager.show(...)
 * - removeToast(id) → toastManager.remove(id)
 * - clearAllToasts() → toastManager.clear()
 *
 * Live region support:
 * - Control accessibility announcements via route option: 'live-only' | 'toast-only' | 'both'
 */
