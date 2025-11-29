/**
 * @fileoverview Bootstrap utilities for consistent initialization patterns
 * @description Provides reusable utilities for bootstrap stage execution,
 *              service loading, and initialization lifecycle management.
 *
 * Phase: Refactoring - Bootstrap pattern consolidation
 */

import { bootstrapErrorReporter } from '@shared/error';
import { logger } from '@shared/logging';
import type { BootstrapStage, BootstrapStageResult } from '@shared/interfaces';

// ============================================================================
// Types
// ============================================================================

/**
 * Service loader function type
 */
export type ServiceLoader<T> = () => Promise<T>;

/**
 * Service initialization options
 */
export interface ServiceInitOptions {
  /** Service name for logging */
  readonly name: string;
  /** Whether failure is recoverable */
  readonly recoverable?: boolean;
  /** Timeout in milliseconds (default: 10000) */
  readonly timeoutMs?: number;
}

/**
 * Service loading result
 */
export interface ServiceLoadResult<T> {
  /** Whether loading succeeded */
  readonly success: boolean;
  /** Loaded service instance (if successful) */
  readonly service?: T;
  /** Error message (if failed) */
  readonly error?: string;
  /** Duration in milliseconds */
  readonly durationMs: number;
}

// ============================================================================
// Stage Execution Utilities
// ============================================================================

/**
 * Execute a single bootstrap stage with timing and error handling
 *
 * @param stage - The bootstrap stage to execute
 * @returns Stage execution result
 *
 * @example
 * ```typescript
 * const result = await executeStage({
 *   label: 'Theme initialization',
 *   run: async () => {
 *     const theme = getThemeService();
 *     await theme.initialize();
 *   }
 * });
 *
 * if (!result.success) {
 *   console.error(`Stage failed: ${result.label}`);
 * }
 * ```
 */
export async function executeStage(stage: BootstrapStage): Promise<BootstrapStageResult> {
  const startTime = performance.now();

  try {
    if (__DEV__) {
      logger.debug(`[bootstrap] ➡️ ${stage.label}`);
    }

    await Promise.resolve(stage.run());

    const durationMs = performance.now() - startTime;

    if (__DEV__) {
      logger.debug(`[bootstrap] ✅ ${stage.label} (${durationMs.toFixed(1)}ms)`);
    }

    return {
      label: stage.label,
      success: true,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - startTime;

    if (stage.optional) {
      bootstrapErrorReporter.warn(error, {
        code: 'STAGE_OPTIONAL_FAILED',
        metadata: { stage: stage.label, durationMs },
      });
    } else {
      bootstrapErrorReporter.error(error, {
        code: 'STAGE_FAILED',
        metadata: { stage: stage.label, durationMs },
      });
    }

    return {
      label: stage.label,
      success: false,
      error,
      durationMs,
    };
  }
}

/**
 * Execute multiple bootstrap stages in sequence
 *
 * @param stages - Array of bootstrap stages
 * @param options - Execution options
 * @returns Array of stage results
 */
export async function executeStages(
  stages: readonly BootstrapStage[],
  options?: {
    /** Stop on first non-optional failure */
    stopOnFailure?: boolean;
  }
): Promise<BootstrapStageResult[]> {
  const results: BootstrapStageResult[] = [];
  const stopOnFailure = options?.stopOnFailure ?? true;

  for (const stage of stages) {
    const result = await executeStage(stage);
    results.push(result);

    if (!result.success && !stage.optional && stopOnFailure) {
      logger.error(`[bootstrap] ❌ Critical stage failed: ${stage.label}`);
      break;
    }
  }

  return results;
}

// ============================================================================
// Service Loading Utilities
// ============================================================================

/**
 * Load a service with timeout and error handling
 *
 * @param loader - Async function that returns the service
 * @param options - Loading options
 * @returns Service load result
 *
 * @example
 * ```typescript
 * const result = await loadService(
 *   async () => {
 *     const { ThemeService } = await import('@shared/services/theme-service');
 *     return ThemeService.getInstance();
 *   },
 *   { name: 'ThemeService', recoverable: true }
 * );
 *
 * if (result.success) {
 *   result.service.initialize();
 * }
 * ```
 */
export async function loadService<T>(
  loader: ServiceLoader<T>,
  options: ServiceInitOptions
): Promise<ServiceLoadResult<T>> {
  const startTime = performance.now();
  const timeoutMs = options.timeoutMs ?? 10000;

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Service load timeout: ${options.name} (${timeoutMs}ms)`));
      }, timeoutMs);
    });

    // Race between loader and timeout
    const service = await Promise.race([loader(), timeoutPromise]);

    const durationMs = performance.now() - startTime;

    if (__DEV__) {
      logger.debug(`[service] ✅ ${options.name} loaded (${durationMs.toFixed(1)}ms)`);
    }

    return {
      success: true,
      service,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : `Failed to load ${options.name}`;

    if (options.recoverable) {
      bootstrapErrorReporter.warn(error, {
        code: 'SERVICE_LOAD_RECOVERABLE',
        metadata: { service: options.name, durationMs },
      });
    } else {
      bootstrapErrorReporter.error(error, {
        code: 'SERVICE_LOAD_FAILED',
        metadata: { service: options.name, durationMs },
      });
    }

    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Load multiple services in parallel
 *
 * @param loaders - Map of service names to loader functions
 * @returns Map of service names to load results
 */
export async function loadServicesParallel<T extends Record<string, unknown>>(
  loaders: { [K in keyof T]: ServiceLoader<T[K]> },
  options?: {
    /** Default timeout for all services */
    timeoutMs?: number;
    /** Whether failures are recoverable by default */
    recoverable?: boolean;
  }
): Promise<{ [K in keyof T]: ServiceLoadResult<T[K]> }> {
  const entries = Object.entries(loaders) as [keyof T, ServiceLoader<T[keyof T]>][];

  const results = await Promise.all(
    entries.map(async ([name, loader]) => {
      const serviceOptions: ServiceInitOptions = {
        name: String(name),
      };
      if (options?.timeoutMs !== undefined) {
        (serviceOptions as { timeoutMs: number }).timeoutMs = options.timeoutMs;
      }
      if (options?.recoverable !== undefined) {
        (serviceOptions as { recoverable: boolean }).recoverable = options.recoverable;
      }
      const result = await loadService(loader, serviceOptions);
      return [name, result] as const;
    })
  );

  return Object.fromEntries(results) as { [K in keyof T]: ServiceLoadResult<T[K]> };
}

// ============================================================================
// Initialization Helpers
// ============================================================================

/**
 * Wrap an async initialization function with consistent error handling
 *
 * @param name - Initialization context name
 * @param fn - Async initialization function
 * @param options - Error handling options
 */
export async function withInitContext<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    recoverable?: boolean;
    defaultValue?: T;
  }
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (options?.recoverable) {
      bootstrapErrorReporter.warn(error, {
        code: 'INIT_RECOVERABLE',
        metadata: { context: name },
      });
      return options.defaultValue;
    }

    bootstrapErrorReporter.error(error, {
      code: 'INIT_FAILED',
      metadata: { context: name },
    });

    throw error;
  }
}

/**
 * Create a retry wrapper for initialization functions
 *
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Wrapped function with retry logic
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  } = {}
): () => Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelayMs = options.delayMs ?? 100;
  const backoffMultiplier = options.backoffMultiplier ?? 2;

  return async (): Promise<T> => {
    let lastError: unknown;
    let delayMs = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts) {
          if (__DEV__) {
            logger.debug(
              `[retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms`
            );
          }
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= backoffMultiplier;
        }
      }
    }

    throw lastError;
  };
}
