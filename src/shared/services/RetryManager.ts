/**
 * @fileoverview RetryManager Service
 * @description Smart retry mechanism with offline detection and network status monitoring
 */

import { createScopedLogger } from '../logging/logger';
import type { IRetryManager, ILogger } from './interfaces';

// RetryManager 전용 로거
const logger = createScopedLogger('RetryManager');

export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: Error) => boolean;
  enableOfflineDetection?: boolean;
}

export interface RetryContext {
  attempt: number;
  maxRetries: number;
  lastError?: Error;
  totalElapsed: number;
  networkStatus: 'online' | 'offline' | 'unknown';
}

export type RetryStrategy = 'linear' | 'exponential' | 'fibonacci';

/**
 * RetryManager - Intelligent retry management system with offline detection
 *
 * Provides configurable retry logic with multiple strategies:
 * - Linear backoff: Fixed delay between attempts
 * - Exponential backoff: Exponentially increasing delay
 * - Fibonacci backoff: Fibonacci sequence delay
 * - Network status monitoring: Pauses retries when offline
 *
 * @example
 * ```typescript
 * const retryManager = new RetryManager({
 *   maxRetries: 3,
 *   delay: 1000,
 *   strategy: 'exponential',
 *   enableOfflineDetection: true
 * });
 *
 * const result = await retryManager.execute(async () => {
 *   return await fetchData();
 * });
 * ```
 */
export class RetryManager implements IRetryManager {
  private readonly options: Required<RetryOptions>;
  private readonly strategy: RetryStrategy;
  private networkStatusListeners: Array<() => void> = [];
  private isOnline: boolean = navigator.onLine;

  constructor(
    options: RetryOptions,
    strategy: RetryStrategy = 'exponential',
    private readonly loggerService: ILogger = logger
  ) {
    this.options = {
      maxRetries: options.maxRetries,
      delay: options.delay,
      backoffMultiplier: options.backoffMultiplier ?? 2,
      maxDelay: options.maxDelay ?? 30000, // 30 seconds max
      retryCondition: options.retryCondition ?? this.defaultRetryCondition,
      enableOfflineDetection: options.enableOfflineDetection ?? true,
    };
    this.strategy = strategy;

    // Setup offline detection if enabled
    if (this.options.enableOfflineDetection) {
      this.setupNetworkMonitoring();
    }
  }

  /**
   * Setup network status monitoring
   */
  private setupNetworkMonitoring(): void {
    const handleOnline = () => {
      this.isOnline = true;
      logger.info('Network connection restored');
    };

    const handleOffline = () => {
      this.isOnline = false;
      logger.warn('Network connection lost - pausing retries');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store cleanup functions
    this.networkStatusListeners.push(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  /**
   * Get current network status
   */
  private getNetworkStatus(): 'online' | 'offline' | 'unknown' {
    if (!this.options.enableOfflineDetection) {
      return 'unknown';
    }
    return this.isOnline ? 'online' : 'offline';
  }

  /**
   * Wait for network connection
   */
  private async waitForConnection(): Promise<void> {
    if (!this.options.enableOfflineDetection || this.isOnline) {
      return;
    }

    return new Promise<void>(resolve => {
      const checkConnection = () => {
        if (this.isOnline) {
          resolve();
        } else {
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    });
  }

  /**
   * Execute a function with retry logic and offline detection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        // Wait for network connection if offline
        await this.waitForConnection();

        const result = await fn();

        // Log successful recovery if this wasn't the first attempt
        if (attempt > 0) {
          logger.info(`Operation succeeded after ${attempt} retries`);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        const networkStatus = this.getNetworkStatus();

        // Check if we should retry
        if (attempt === this.options.maxRetries || !this.options.retryCondition(lastError)) {
          logger.error(
            `Operation failed after ${attempt + 1} attempts (network: ${networkStatus}):`,
            lastError
          );
          throw lastError;
        }

        // If offline, don't retry network errors immediately
        if (networkStatus === 'offline' && this.isNetworkError(lastError)) {
          logger.warn('Network error while offline, waiting for connection...');
          await this.waitForConnection();
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);

        logger.warn(
          `Attempt ${attempt + 1} failed (network: ${networkStatus}), retrying in ${delay}ms:`,
          lastError.message
        );

        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Retry operation failed');
  }

  /**
   * Execute with progress callback and network status
   */
  async executeWithProgress<T>(
    fn: () => Promise<T>,
    onProgress?: (context: RetryContext) => void
  ): Promise<T> {
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      const context: RetryContext = {
        attempt,
        maxRetries: this.options.maxRetries,
        totalElapsed: Date.now() - startTime,
        networkStatus: this.getNetworkStatus(),
      };

      if (onProgress) {
        onProgress(context);
      }

      try {
        await this.waitForConnection();
        return await fn();
      } catch (error) {
        context.lastError = error as Error;

        if (
          attempt === this.options.maxRetries ||
          !this.options.retryCondition(context.lastError)
        ) {
          throw context.lastError;
        }

        // Handle offline scenarios
        if (context.networkStatus === 'offline' && this.isNetworkError(context.lastError)) {
          await this.waitForConnection();
        }

        await this.delay(this.calculateDelay(attempt));
      }
    }

    throw new Error('Retry operation failed');
  }

  /**
   * Calculate delay based on strategy
   */
  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.strategy) {
      case 'linear':
        delay = this.options.delay;
        break;

      case 'exponential':
        delay = this.options.delay * Math.pow(this.options.backoffMultiplier, attempt);
        break;

      case 'fibonacci':
        delay = this.options.delay * this.fibonacci(attempt + 1);
        break;

      default:
        delay = this.options.delay;
    }

    // Apply jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    delay += jitter;

    // Respect maximum delay
    return Math.min(delay, this.options.maxDelay);
  }

  /**
   * Fibonacci sequence calculation
   */
  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    if (n === 2) return 1;

    let a = 1,
      b = 1;
    for (let i = 3; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * Promise-based delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is network related
   */
  private isNetworkError(error: Error): boolean {
    return (
      error.message.includes('NetworkError') ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('connection')
    );
  }

  /**
   * Default retry condition - retries on network errors and server errors
   */
  private defaultRetryCondition(error: Error): boolean {
    // Don't retry if offline and it's a network error
    if (!this.isOnline && this.isNetworkError(error)) {
      return false;
    }

    // Retry on network errors
    if (this.isNetworkError(error)) {
      return true;
    }

    // Check for HTTP status codes if available
    if ('status' in error) {
      const status = error.status as number;
      // Retry on 5xx server errors and 429 rate limiting
      return status >= 500 || status === 429;
    }

    // Retry on timeout errors
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return true;
    }

    return false;
  }

  /**
   * Cleanup network listeners
   */
  dispose(): void {
    for (const cleanup of this.networkStatusListeners) {
      cleanup();
    }
    this.networkStatusListeners = [];
  }
}

/**
 * Create a pre-configured RetryManager for common scenarios
 */
export const createRetryManager = {
  /**
   * For network requests with offline detection
   */
  network: () =>
    new RetryManager(
      {
        maxRetries: 3,
        delay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000,
        enableOfflineDetection: true,
      },
      'exponential'
    ),

  /**
   * For critical operations with enhanced offline handling
   */
  critical: () =>
    new RetryManager(
      {
        maxRetries: 5,
        delay: 500,
        backoffMultiplier: 1.5,
        maxDelay: 15000,
        enableOfflineDetection: true,
      },
      'fibonacci'
    ),

  /**
   * For background tasks with offline awareness
   */
  background: () =>
    new RetryManager(
      {
        maxRetries: 10,
        delay: 2000,
        backoffMultiplier: 1.2,
        maxDelay: 60000,
        enableOfflineDetection: true,
      },
      'linear'
    ),
};
