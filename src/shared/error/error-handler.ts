import { getEventBus } from '@shared/events';
import { logger } from '@shared/logging';
import { createSingleton } from '@shared/utils/types/singleton';

export class GlobalErrorHandler {
  private static readonly singleton = createSingleton(() => new GlobalErrorHandler());
  private isInitialized = false;
  private controller: AbortController | null = null;
  private readonly errorListener = (event: ErrorEvent) => {
    const message = event.message ?? 'Unknown error occurred';
    const location = event.filename
      ? `${event.filename}:${event.lineno ?? 0}:${event.colno ?? 0}`
      : undefined;

    logger.error(`[UncaughtError] ${message}`, {
      type: 'uncaught-error',
      location,
    });

    if (__DEV__) {
      event.preventDefault();
    }
  };

  private readonly rejectionListener = (event: PromiseRejectionEvent) => {
    const { reason } = event;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : `Unhandled rejection: ${String(reason)}`;

    logger.error(`[UnhandledRejection] ${message}`, {
      type: 'unhandled-rejection',
      reason,
    });

    if (__DEV__) {
      event.preventDefault();
    }
  };

  public static getInstance(): GlobalErrorHandler {
    return GlobalErrorHandler.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    const existing = GlobalErrorHandler.singleton.peek();
    existing?.destroy();
    GlobalErrorHandler.singleton.reset();
  }

  private constructor() {}

  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    const bus = getEventBus();
    this.controller = new AbortController();

    bus.addDOMListener(window, 'error', this.errorListener as unknown as EventListener, {
      signal: this.controller.signal,
      context: 'global-error-handler',
    });

    bus.addDOMListener(
      window,
      'unhandledrejection',
      this.rejectionListener as unknown as EventListener,
      {
        signal: this.controller.signal,
        context: 'global-error-handler',
      }
    );

    this.isInitialized = true;
  }

  public destroy(): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.controller?.abort();
    this.controller = null;
    this.isInitialized = false;
  }
}

export const globalErrorHandler = GlobalErrorHandler.getInstance();
