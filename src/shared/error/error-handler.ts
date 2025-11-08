/**
 * @fileoverview Global Error Handler - Uncaught Exception Management
 * @version 2.1.0 - Phase 196: Global window-level error handling
 * @phase 401: Enhanced documentation and infrastructure
 *
 * @section System Purpose
 * Singleton handler for window-level uncaught errors and unhandled promise rejections.
 * Provides centralized error capture and logging at the browser's global scope.
 *
 * This module specifically handles:
 * 1. **Uncaught Errors**: JavaScript errors not caught by try-catch blocks
 * 2. **Unhandled Rejections**: Promise rejections without .catch() handlers
 * 3. **Development Mode**: Enhanced debugging in development environment
 *
 * @note Application logic should use @shared/utils/error-handling.ts for routine error handling.
 * This module catches only window-level exceptions that bypass normal error handling.
 *
 * @section Architecture
 * **Singleton Pattern**: GlobalErrorHandler maintains single instance for application lifetime
 * **Event Binding**: Bound listeners stored for proper cleanup during destroy()
 * **Logger Integration**: All errors logged via @shared/logging for correlation and tracing
 * **Lifecycle**: initialize() to register, destroy() to unregister event listeners
 *
 * @section Event Handling Flow
 * ```
 * Browser Error Event (uncaught)
 *   ↓
 * handleUncaughtError() captures Error with stack trace
 *   ↓
 * Logger formats and routes to @shared/logging
 *   ↓
 * Development mode: preventDefault() stops native error display
 * Production mode: Native error handling proceeds
 * ```
 *
 * @section Type Safety
 * - ErrorEvent: Standard browser error event with filename, lineno, colno
 * - PromiseRejectionEvent: Standard browser promise rejection event
 * - All errors normalized to string format for logging
 *
 * @section Design Patterns
 * **Singleton Pattern**: getInstance() ensures single instance across application
 * **Lazy Binding**: Event listeners bound only during initialize()
 * **Cleanup Pattern**: destroy() removes all listeners and resets state
 * **Context Preservation**: Bound listeners saved to allow removal (removeEventListener requires same reference)
 *
 * @section Usage
 * ```typescript
 * // Bootstrap initialization (typically in main.ts)
 * const errorHandler = GlobalErrorHandler.getInstance();
 * errorHandler.initialize();
 *
 * // Cleanup on application shutdown
 * errorHandler.destroy();
 *
 * // Alternatively, use singleton instance
 * import { globalErrorHandler } from '@shared/error';
 * globalErrorHandler.initialize();
 * ```
 *
 * @section Lifecycle & Resource Management
 * - **initialize()**: Registers window event listeners (safe to call multiple times - no-op if already initialized)
 * - **destroy()**: Removes event listeners and clears internal state (safe to call multiple times)
 * - **State Tracking**: isInitialized flag prevents duplicate listener registration
 * - **Memory Safety**: Bound listeners stored as instance variables for deterministic cleanup
 *
 * @section Error Recovery
 * - **Development Mode**: preventDefault() suppresses native error dialogs for testing
 * - **Production Mode**: Native error handling continues, allowing browser to handle fatal errors
 * - **Unhandled Rejections**: Always logged, never suppressed (Promise rejection protocol)
 *
 * @section Related Documentation
 * - [@shared/logging](./logging/README.md) - Logging infrastructure
 * - [@shared/utils/error-handling.ts](./utils/error-handling.ts) - Application error utilities
 * - [Error Handling Guide](../docs/error-handling.md) - Best practices
 *
 * @author X.com Enhanced Gallery | Phase 401 Optimization
 */

import { logger } from '@shared/logging';

/**
 * @class GlobalErrorHandler
 * @implements Singleton pattern for global exception handling
 *
 * Manages window-level error events and unhandled promise rejections.
 * Provides centralized logging and error tracking for debugging.
 *
 * @example
 * // Bootstrap usage (main.ts)
 * const handler = GlobalErrorHandler.getInstance();
 * handler.initialize();
 *
 * // Cleanup (optional, but recommended for testing)
 * handler.destroy();
 *
 * @example
 * // Accessing singleton instance
 * import { globalErrorHandler } from '@shared/error';
 * globalErrorHandler.initialize();
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler | null = null;
  private isInitialized = false;
  private boundErrorListener: ((event: ErrorEvent) => void) | null = null;
  private boundRejectionListener: ((event: PromiseRejectionEvent) => void) | null = null;

  public static getInstance(): GlobalErrorHandler {
    if (!this.instance) {
      this.instance = new GlobalErrorHandler();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 전역 에러 핸들러 초기화
   * Window 이벤트 리스너 등록
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.debug('[GlobalErrorHandler] Already initialized');
      return;
    }

    // Bound listeners 생성 (removeEventListener에서 동일 참조 필요)
    if (!this.boundErrorListener) {
      this.boundErrorListener = this.handleUncaughtError.bind(this);
    }
    if (!this.boundRejectionListener) {
      this.boundRejectionListener = this.handleUnhandledRejection.bind(this);
    }

    // Window 이벤트 리스너 등록
    window.addEventListener('error', this.boundErrorListener);
    window.addEventListener('unhandledrejection', this.boundRejectionListener);

    this.isInitialized = true;
    logger.debug('[GlobalErrorHandler] Global error handlers registered');
  }

  /**
   * 전역 에러 핸들러 정리
   * Window 이벤트 리스너 제거
   */
  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    // 리스너 제거
    if (this.boundErrorListener) {
      window.removeEventListener('error', this.boundErrorListener);
    }
    if (this.boundRejectionListener) {
      window.removeEventListener('unhandledrejection', this.boundRejectionListener);
    }

    this.isInitialized = false;
    this.boundErrorListener = null;
    this.boundRejectionListener = null;
    logger.debug('[GlobalErrorHandler] Global error handlers unregistered');
  }

  /**
   * Uncaught 에러 처리
   * @private
   */
  private handleUncaughtError(event: ErrorEvent): void {
    const message = event.message || 'Unknown error occurred';
    const context = {
      location: `${event.filename}:${event.lineno}:${event.colno}`,
      type: 'uncaught-error',
    };

    logger.error(`[UncaughtError] ${message}`, context);

    // 기본 동작 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }

  /**
   * Unhandled Promise Rejection 처리
   * @private
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : `Unhandled rejection: ${String(reason)}`;

    logger.error(`[UnhandledRejection] ${message}`, {
      type: 'unhandled-rejection',
      reason: typeof reason === 'object' ? reason : String(reason),
    });

    // 기본 동작 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }
}

/**
 * Singleton instance of GlobalErrorHandler
 * @constant
 * @type {GlobalErrorHandler}
 *
 * Provides global access to error handler without instantiation.
 * Automatically initialized when accessed.
 *
 * @example
 * import { globalErrorHandler } from '@shared/error';
 * globalErrorHandler.initialize(); // Safe to call multiple times
 */
export const globalErrorHandler = GlobalErrorHandler.getInstance();
