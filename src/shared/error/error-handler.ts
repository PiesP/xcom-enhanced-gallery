/**
 * @fileoverview Global error handler for uncaught errors and unhandled rejections
 * @description Singleton service that captures and logs runtime errors (dev mode).
 */

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import { createSingleton } from '@shared/utils/types/singleton';

const formatErrorLocation = (
  filename: string | undefined,
  lineno: number | undefined,
  colno: number | undefined
): string | undefined => filename && `${filename}:${lineno ?? 0}:${colno ?? 0}`;

const formatRejectionMessage = (reason: unknown): string => {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  return `Unhandled rejection: ${String(reason)}`;
};

export class GlobalErrorHandler {
  private static readonly singleton = createSingleton(() => new GlobalErrorHandler());
  private isInitialized = false;
  private controller: AbortController | null = null;
  private errorListenerId: string | null = null;
  private rejectionListenerId: string | null = null;

  /**
   * Handle uncaught errors.
   * @param event - Error event from window
   */
  private readonly errorListener = (event: ErrorEvent): void => {
    const message = event.message || 'Unknown error occurred';
    const location = formatErrorLocation(event.filename, event.lineno, event.colno);

    if (__DEV__) {
      logger.error(`[UncaughtError] ${message}`, {
        type: 'uncaught-error',
        location,
        error: event.error,
      });
      event.preventDefault();
    }
  };

  /**
   * Handle unhandled promise rejections.
   * @param event - Promise rejection event from window
   */
  private readonly rejectionListener = (event: PromiseRejectionEvent): void => {
    const message = formatRejectionMessage(event.reason);

    if (__DEV__) {
      logger.error(`[UnhandledRejection] ${message}`, {
        type: 'unhandled-rejection',
        reason: event.reason,
      });
      event.preventDefault();
    }
  };

  /**
   * Get the singleton instance of GlobalErrorHandler.
   * @returns The GlobalErrorHandler instance
   */
  public static getInstance(): GlobalErrorHandler {
    return GlobalErrorHandler.singleton.get();
  }

  /**
   * Reset the singleton instance for testing purposes.
   * @internal Test helper - should only be called in test environments
   */
  public static resetForTests(): void {
    const existing = GlobalErrorHandler.singleton.peek?.();
    existing?.destroy();
    GlobalErrorHandler.singleton.reset?.();
  }

  private constructor() {}

  /**
   * Initialize the global error handler.
   * Sets up listeners for uncaught errors and unhandled promise rejections.
   * Safe to call multiple times - subsequent calls are ignored.
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    const eventManager = EventManager.getInstance();
    this.controller = new AbortController();

    const onError: EventListener = (evt): void => {
      this.errorListener(evt as ErrorEvent);
    };

    const onUnhandledRejection: EventListener = (evt): void => {
      this.rejectionListener(evt as PromiseRejectionEvent);
    };

    this.errorListenerId =
      eventManager.addEventListener(window, 'error', onError, {
        signal: this.controller.signal,
        context: 'global-error-handler',
      }) ?? null;

    this.rejectionListenerId =
      eventManager.addEventListener(window, 'unhandledrejection', onUnhandledRejection, {
        signal: this.controller.signal,
        context: 'global-error-handler',
      }) ?? null;

    this.isInitialized = true;
  }

  /**
   * Destroy the global error handler and clean up all resources.
   * Removes all event listeners and aborts any pending operations.
   * Safe to call multiple times - subsequent calls are ignored.
   */
  public destroy(): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      return;
    }

    const eventManager = EventManager.getInstance();
    if (this.errorListenerId) {
      eventManager.removeListener(this.errorListenerId);
      this.errorListenerId = null;
    }
    if (this.rejectionListenerId) {
      eventManager.removeListener(this.rejectionListenerId);
      this.rejectionListenerId = null;
    }

    this.controller?.abort();
    this.controller = null;
    this.isInitialized = false;
  }
}
