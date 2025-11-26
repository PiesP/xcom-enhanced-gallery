import { logger } from '@shared/logging';

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler | null = null;
  private isInitialized = false;
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
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private constructor() {}

  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('error', this.errorListener);
    window.addEventListener('unhandledrejection', this.rejectionListener);

    this.isInitialized = true;
  }

  public destroy(): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('error', this.errorListener);
    window.removeEventListener('unhandledrejection', this.rejectionListener);
    this.isInitialized = false;
  }
}

export const globalErrorHandler = GlobalErrorHandler.getInstance();
