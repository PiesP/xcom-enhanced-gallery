import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import { createSingleton } from '@shared/utils/types/singleton';

/**
 * Global error handler for uncaught errors and unhandled promise rejections.
 *
 * Singleton service that captures and logs runtime errors in development mode,
 * preventing them from propagating to the browser console.
 *
 * @example
 * ```typescript
 * const handler = GlobalErrorHandler.getInstance();
 * handler.initialize();
 *
 * // Later when shutting down
 * handler.destroy();
 * ```
 */
export class GlobalErrorHandler {
  private static readonly singleton = createSingleton(() => new GlobalErrorHandler());
  private isInitialized = false;
  private controller: AbortController | null = null;
  private errorListenerId: string | null = null;
  private rejectionListenerId: string | null = null;

  /**
   * Handles uncaught errors.
   *
   * @param event - Error event from window
   */
  private readonly errorListener = (event: ErrorEvent): void => {
    const message = event.message || 'Unknown error occurred';
    const location = this.formatErrorLocation(event.filename, event.lineno, event.colno);

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
   * Handles unhandled promise rejections.
   *
   * @param event - Promise rejection event from window
   */
  private readonly rejectionListener = (event: PromiseRejectionEvent): void => {
    const message = this.formatRejectionMessage(event.reason);

    if (__DEV__) {
      logger.error(`[UnhandledRejection] ${message}`, {
        type: 'unhandled-rejection',
        reason: event.reason,
      });
      event.preventDefault();
    }
  };

  /**
   * Gets the singleton instance of GlobalErrorHandler.
   *
   * @returns The GlobalErrorHandler instance
   */
  public static getInstance(): GlobalErrorHandler {
    return GlobalErrorHandler.singleton.get();
  }

  /**
   * Resets the singleton instance for testing purposes.
   *
   * @internal Test helper - should only be called in test environments
   */
  public static resetForTests(): void {
    const existing = GlobalErrorHandler.singleton.peek?.();
    existing?.destroy();
    GlobalErrorHandler.singleton.reset?.();
  }

  private constructor() {}

  /**
   * Formats error location string from filename, line, and column numbers.
   *
   * @param filename - Source file path
   * @param lineno - Line number
   * @param colno - Column number
   * @returns Formatted location string or undefined if filename is missing
   */
  private formatErrorLocation(
    filename: string | undefined,
    lineno: number | undefined,
    colno: number | undefined
  ): string | undefined {
    if (!filename) {
      return undefined;
    }
    return `${filename}:${lineno ?? 0}:${colno ?? 0}`;
  }

  /**
   * Formats rejection reason into a human-readable message.
   *
   * @param reason - The rejection reason (can be Error, string, or any value)
   * @returns Formatted error message
   */
  private formatRejectionMessage(reason: unknown): string {
    if (reason instanceof Error) {
      return reason.message;
    }
    if (typeof reason === 'string') {
      return reason;
    }
    return `Unhandled rejection: ${String(reason)}`;
  }

  /**
   * Initializes the global error handler.
   *
   * Sets up listeners for uncaught errors and unhandled promise rejections.
   * Safe to call multiple times - subsequent calls are ignored.
   *
   * @remarks
   * - Only active in browser environments (checks for `window`)
   * - Uses EventManager for proper cleanup
   * - AbortController for signal-based cleanup
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
   * Destroys the global error handler and cleans up all resources.
   *
   * Removes all event listeners and aborts any pending operations.
   * Safe to call multiple times - subsequent calls are ignored.
   *
   * @remarks
   * - Removes listeners via EventManager
   * - Aborts controller signal
   * - Resets initialization state
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
