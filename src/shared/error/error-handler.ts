import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import { createSingleton } from '@shared/utils/types/singleton';

export class GlobalErrorHandler {
  private static readonly singleton = createSingleton(() => new GlobalErrorHandler());
  private isInitialized = false;
  private controller: AbortController | null = null;
  private errorListenerId: string | null = null;
  private rejectionListenerId: string | null = null;
  private readonly errorListener = (event: ErrorEvent) => {
    const message = event.message ?? 'Unknown error occurred';
    const location = event.filename
      ? `${event.filename}:${event.lineno ?? 0}:${event.colno ?? 0}`
      : undefined;

    if (__DEV__) {
      logger.error(`[UncaughtError] ${message}`, {
        type: 'uncaught-error',
        location,
      });
    }

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

    if (__DEV__) {
      logger.error(`[UnhandledRejection] ${message}`, {
        type: 'unhandled-rejection',
        reason,
      });
    }

    if (__DEV__) {
      event.preventDefault();
    }
  };

  public static getInstance(): GlobalErrorHandler {
    return GlobalErrorHandler.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    const existing = GlobalErrorHandler.singleton.peek?.();
    existing?.destroy();
    GlobalErrorHandler.singleton.reset?.();
  }

  private constructor() {}

  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    const eventManager = EventManager.getInstance();
    this.controller = new AbortController();

    const onError: EventListener = (evt) => {
      this.errorListener(evt as ErrorEvent);
    };

    const onUnhandledRejection: EventListener = (evt) => {
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

const globalErrorHandler = GlobalErrorHandler.getInstance();
