/**
 * @fileoverview Unified Toast Manager
 * @description Single source of truth (SSOT) for toast state management
 * @version 2.0.0 - Phase 327: ToastController removal, simplicity first
 */

import { logger } from '@shared/logging';
import { ensurePoliteLiveRegion, ensureAssertiveLiveRegion } from '../utils/accessibility/index';
import { createSignalSafe } from '../state/signals/signal-factory';

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
  /**
   * Routing override:
   * - 'live-only': announce to live region only (no toast list)
   * - 'toast-only': show toast only (no live region)
   * - 'both': announce to live region and show toast
   * If omitted, a default policy is applied (info/success → live-only, warning/error → toast-only).
   */
  route?: 'live-only' | 'toast-only' | 'both';
}

/**
 * Unified Toast Manager class
 *
 * Integrates the Map-based state management from the existing ToastController.ts
 * and the signals-based state management from Toast.tsx to provide
 * a single source of truth (SSOT).
 */
export class ToastManager {
  private static instance: ToastManager | null = null;
  private readonly toastsSignal = createSignalSafe<ToastItem[]>([]);
  private toastIdCounter = 0;
  private readonly subscribers = new Set<(toasts: ToastItem[]) => void>();

  private constructor() {
    this.toastsSignal.subscribe(this.notifySubscribers.bind(this));

    logger.debug('[ToastManager] Initialized');
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
    const toast: ToastItem = {
      id,
      type: options.type ?? 'info',
      title: options.title,
      message: options.message,
      ...(options.duration !== undefined && { duration: options.duration }),
      ...(options.actionText && { actionText: options.actionText }),
      ...(options.onAction && { onAction: options.onAction }),
    };

    // Routing policy with override
    // Default routing: info/success → live-only, warning/error → toast-only
    const defaultRoute: 'live-only' | 'toast-only' =
      toast.type === 'warning' || toast.type === 'error' ? 'toast-only' : 'live-only';
    const route = options.route ?? defaultRoute;

    if (route === 'live-only' || route === 'both') {
      this.announceToLiveRegion(toast);
      logger.debug(
        `[ToastManager] LiveRegion announce(${toast.type}): ${options.title} - ${options.message}`
      );
    }

    if (route === 'toast-only' || route === 'both') {
      const currentToasts = this.toastsSignal.value;
      this.toastsSignal.value = [...currentToasts, toast];

      logger.debug(`[ToastManager] Toast shown: ${options.title} - ${options.message}`);
      // Manual notification for UI updates in environments without subscription API
      this.notifySubscribers(this.toastsSignal.value);
    }

    // return id regardless of routing path
    // Synchronize to legacy toast list (UI subscribes to Toast.tsx's toasts)
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
    const currentToasts = this.toastsSignal.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);

    if (filteredToasts.length !== currentToasts.length) {
      this.toastsSignal.value = filteredToasts;
      logger.debug(`[ToastManager] Toast removed: ${id}`);
      this.notifySubscribers(this.toastsSignal.value);
    }
  }

  /**
   * Remove all toasts
   */
  public clear(): void {
    this.toastsSignal.value = [];
    logger.debug('[ToastManager] All toasts removed');
    this.notifySubscribers(this.toastsSignal.value);
  }

  /**
   * Get current toast list
   */
  public getToasts(): ToastItem[] {
    return this.toastsSignal.value;
  }

  /**
   * Subscribe to toast state changes
   */
  public subscribe(callback: (toasts: ToastItem[]) => void): () => void {
    this.subscribers.add(callback);

    // Deliver current state immediately
    callback(this.getToasts());

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Signal accessor for Preact signals integration
   */
  public get signal() {
    return this.toastsSignal;
  }

  /**
   * Service initialization
   */
  public async init(): Promise<void> {
    logger.debug('[ToastManager] Service initialization');
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    this.clear();
    this.subscribers.clear();
    logger.debug('[ToastManager] Cleanup complete');
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
  private notifySubscribers(toasts: ToastItem[]): void {
    this.subscribers.forEach(callback => {
      try {
        callback(toasts);
      } catch (error) {
        logger.warn('[ToastManager] Subscriber notification failed:', error);
      }
    });
  }

  /**
   * Accessibility: Announce message to live region.
   * Info/success use polite, error can use assertive.
   */
  private announceToLiveRegion(toast: ToastItem): void {
    try {
      const region =
        toast.type === 'error' ? ensureAssertiveLiveRegion() : ensurePoliteLiveRegion();
      // Update text node so screen readers can read the message
      const text = document.createElement('div');
      text.textContent = `${toast.title}: ${toast.message}`;
      // Clear region and add new node
      while (region.firstChild) region.removeChild(region.firstChild);
      region.appendChild(text);
    } catch {
      // document may not exist in test/SSR environment – silently ignore
    }
  }

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
    return toastManager.getToasts();
  },
  set value(_: ToastItem[]) {
    // Direct setting is not allowed - changes must be made through manager methods
    logger.warn('[ToastManager] Direct state setting is not allowed. Use manager methods.');
  },
  subscribe(callback: (value: ToastItem[]) => void) {
    return toastManager.subscribe(callback);
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
